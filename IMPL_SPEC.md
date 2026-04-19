# Pulse — Implementation Specification v3.0

> 交给 Claude Code 实施的完整技术规格。涵盖架构、数据库、API、服务端内部设计。

---

## 1. 系统总览

### 1.1 组件清单

| 组件 | 说明 | 产物 |
|------|------|------|
| **pulse** | 核心服务：调度、探测、API、Dashboard、告警 | 单 Go 二进制 |
| **pulse-probe** | 轻量 agent：push 心跳上报 / edge 远程探测 | 单 Go 二进制 |
| **PostgreSQL** | 唯一主存储：配置 + 打点 + 故障区间 + 聚合 + 离线分析结果 | 阿里云 RDS PG 15+ |
| **Redis** | 纯缓存层：热 SLA 数据、热力图、离线分析结果缓存。挂了可从 PG 重算 | 阿里云 Redis |

### 1.2 架构图

```
┌──────────────────────────────────────────────────────────────┐
│                       pulse (binary)                          │
│                                                               │
│  ┌───────────┐  ┌───────────┐  ┌──────────┐  ┌────────────┐ │
│  │ Scheduler │  │  Workers  │  │ API /    │  │   Alert    │ │
│  │ (wheel)   │──│  (pool)   │  │ Dashboard│  │   Engine   │ │
│  └─────┬─────┘  └─────┬─────┘  └────┬─────┘  └─────┬──────┘ │
│        │ dispatch      │ results     │ query        │ notify  │
│        └──────►────────┘             │              │         │
│                   │                  │              │         │
│            ┌──────▼───────┐          │              │         │
│            │ BatchWriter  │          │              │         │
│            └──────┬───────┘          │              │         │
│                   │                  │              │         │
│  ┌────────────────▼──────────────────▼──────────────▼───────┐ │
│  │                    内部数据层                              │ │
│  │   PG Pool (pgx)          Redis Pool (go-redis)           │ │
│  └────────┬─────────────────────────┬───────────────────────┘ │
└───────────┼─────────────────────────┼─────────────────────────┘
            │                         │
     ┌──────▼──────┐          ┌───────▼───────┐
     │ PostgreSQL  │          │    Redis      │
     │ (主存储)     │          │  (纯缓存)     │
     └─────────────┘          └───────────────┘

  ┌─────────────────┐    ┌─────────────────┐
  │  pulse-probe    │    │  pulse-probe    │
  │  --mode=push    │    │  --mode=edge    │
  │  (用户环境)      │    │  (海外 VPS)     │
  └───────┬─────────┘    └───────┬─────────┘
          │ HTTPS POST           │ HTTPS POST
          └──────────► pulse ◄───┘
```

### 1.3 技术栈

| 层 | 选型 |
|----|------|
| 语言 | Go 1.22+ |
| HTTP 框架 | Echo v4 |
| 数据库驱动 | pgx/v5 (PG), go-redis/v9 (Redis) |
| 配置 | Viper + YAML |
| 日志 | slog (structured JSON) |
| 前端 | Vite + React + TypeScript + Tailwind |
| 部署 | Fly.io / Railway / Docker |

---

## 2. 数据库设计 (PostgreSQL)

### 2.1 完整 Schema

```sql
-- ============================================================
-- 租户 / 用户 (初期单租户, 预留多租户扩展)
-- ============================================================
CREATE TABLE tenants (
    id              BIGSERIAL PRIMARY KEY,
    name            TEXT NOT NULL,
    slug            TEXT NOT NULL UNIQUE,       -- URL 友好标识
    created_at      TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE users (
    id              BIGSERIAL PRIMARY KEY,
    tenant_id       BIGINT NOT NULL REFERENCES tenants(id),
    email           TEXT NOT NULL UNIQUE,
    password_hash   TEXT NOT NULL,              -- bcrypt
    role            TEXT NOT NULL DEFAULT 'member', -- owner | admin | member
    created_at      TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE api_keys (
    id              BIGSERIAL PRIMARY KEY,
    tenant_id       BIGINT NOT NULL REFERENCES tenants(id),
    name            TEXT NOT NULL,              -- 用户自定义名称, 如 "CI/CD"
    key_hash        TEXT NOT NULL UNIQUE,       -- SHA256(raw_key)
    key_prefix      TEXT NOT NULL,              -- 前 8 字符, 用于列表展示 "pk_a3f2..."
    scopes          TEXT[] DEFAULT '{}',        -- 空 = 全部权限
    expires_at      TIMESTAMPTZ,               -- NULL = 永不过期
    last_used_at    TIMESTAMPTZ,
    created_at      TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================
-- 服务 (探针逻辑分组)
-- ============================================================
CREATE TABLE services (
    id              BIGSERIAL PRIMARY KEY,
    tenant_id       BIGINT NOT NULL REFERENCES tenants(id),
    name            TEXT NOT NULL,
    description     TEXT,
    sla_target      REAL NOT NULL DEFAULT 99.9,  -- 目标 SLA %
    created_at      TIMESTAMPTZ DEFAULT NOW(),
    updated_at      TIMESTAMPTZ DEFAULT NOW()
);
CREATE INDEX idx_services_tenant ON services(tenant_id);

-- ============================================================
-- 探针配置
-- ============================================================
CREATE TABLE probes (
    id              BIGSERIAL PRIMARY KEY,
    tenant_id       BIGINT NOT NULL REFERENCES tenants(id),
    service_id      BIGINT REFERENCES services(id) ON DELETE SET NULL,
    name            TEXT NOT NULL,
    protocol        TEXT NOT NULL,              -- http | tcp | ws | dns | icmp | push
    target          TEXT NOT NULL,              -- URL 或 host:port
    interval_sec    INT NOT NULL DEFAULT 30,
    timeout_ms      INT NOT NULL DEFAULT 8000,
    retries         INT NOT NULL DEFAULT 1,

    -- 可用性判定规则
    expect          JSONB DEFAULT '{}',
    -- 结构: {
    --   "status_codes": [200, 204],
    --   "keyword": "ok",
    --   "max_latency_ms": 3000
    -- }

    -- 值检测/断言规则
    assertions      JSONB DEFAULT '[]',
    -- 结构: [
    --   {"type":"json_path","path":"$.version","op":"eq","expect":"2.4.1"},
    --   {"type":"header","key":"X-Deploy-Id","op":"eq","expect":"abc123"},
    --   {"type":"body_hash","op":"eq"}
    -- ]

    -- 认证配置
    auth            JSONB DEFAULT '{}',
    -- 结构: {
    --   "type": "bearer",         -- none|apikey|bearer|basic|oauth2
    --   "token": "eyJ...",
    --   -- apikey: "header","value"
    --   -- basic: "username","password"
    --   -- oauth2: "token_url","client_id","client_secret","scope"
    -- }

    -- 多区域策略
    edge_policy     TEXT DEFAULT 'auto',       -- auto | edge_only | local_only

    -- 上次断言状态 (body_hash 等 "跟上次比" 的场景)
    last_assertion_state JSONB DEFAULT '{}',
    -- 结构: {"body_hash":"a3f2b8c...","$.version":"2.4.1"}

    -- Push 模式专用
    push_token      TEXT UNIQUE,               -- HMAC 签名用, 仅 protocol=push
    push_timeout_sec INT DEFAULT 60,           -- 超时判定阈值

    -- 多实例分配
    assigned_instance TEXT,                    -- 当前负责此探针的 pulse 实例 ID

    enabled         BOOLEAN DEFAULT TRUE,
    deleted_at      TIMESTAMPTZ,
    created_at      TIMESTAMPTZ DEFAULT NOW(),
    updated_at      TIMESTAMPTZ DEFAULT NOW()
);
CREATE INDEX idx_probes_tenant ON probes(tenant_id) WHERE deleted_at IS NULL;
CREATE INDEX idx_probes_assigned ON probes(assigned_instance) WHERE deleted_at IS NULL AND enabled = TRUE;
CREATE INDEX idx_probes_service ON probes(service_id) WHERE deleted_at IS NULL;

-- ============================================================
-- 探测结果 (按月分区)
-- ============================================================
CREATE TABLE probe_results (
    probe_id        BIGINT NOT NULL,
    scheduled_at    TIMESTAMPTZ NOT NULL,
    executed_at     TIMESTAMPTZ NOT NULL,
    status          SMALLINT NOT NULL,         -- 1=up, 2=down, 3=degraded, 4=skipped, 5=changed
    latency_ms      INT,
    status_code     SMALLINT,                  -- HTTP 状态码, 非 HTTP 为 NULL
    error_msg       TEXT,
    edge_node_id    TEXT,                       -- NULL=本地, 否则 edge 标识
    assertion_detail JSONB                     -- 断言失败详情: {"$.version":{"expect":"2.4.1","actual":"2.5.0"}}
) PARTITION BY RANGE (scheduled_at);

CREATE INDEX idx_results_probe_time
    ON probe_results (probe_id, scheduled_at DESC);

-- 分区示例 (pg_partman 自动管理, 或 cron 提前创建 3 个月)
-- CREATE TABLE probe_results_2026_04
--     PARTITION OF probe_results
--     FOR VALUES FROM ('2026-04-01') TO ('2026-05-01');

-- ============================================================
-- 故障区间
-- ============================================================
CREATE TABLE fault_intervals (
    id              BIGSERIAL PRIMARY KEY,
    probe_id        BIGINT NOT NULL REFERENCES probes(id),
    fault_start     TIMESTAMPTZ NOT NULL,
    fault_end       TIMESTAMPTZ,               -- NULL = 故障进行中
    fault_type      TEXT DEFAULT 'down',        -- down | degraded | changed
    created_at      TIMESTAMPTZ DEFAULT NOW()
);
CREATE INDEX idx_fault_probe_time
    ON fault_intervals (probe_id, fault_start DESC);

-- ============================================================
-- 聚合表 (离线任务产出)
-- ============================================================
CREATE TABLE probe_rollup_hourly (
    probe_id        BIGINT NOT NULL,
    hour            TIMESTAMPTZ NOT NULL,
    total           INT NOT NULL,
    up_count        INT NOT NULL,
    down_count      INT NOT NULL,
    degraded_count  INT NOT NULL DEFAULT 0,
    changed_count   INT NOT NULL DEFAULT 0,
    avg_latency     REAL,
    p95_latency     REAL,
    PRIMARY KEY (probe_id, hour)
);

CREATE TABLE probe_rollup_daily (
    probe_id        BIGINT NOT NULL,
    day             DATE NOT NULL,
    total           INT NOT NULL,
    up_count        INT NOT NULL,
    down_count      INT NOT NULL,
    degraded_count  INT NOT NULL DEFAULT 0,
    changed_count   INT NOT NULL DEFAULT 0,
    avg_latency     REAL,
    p95_latency     REAL,
    fault_seconds   REAL DEFAULT 0,            -- 当日总故障秒数
    sla_percent     REAL,                      -- 当日 SLA
    PRIMARY KEY (probe_id, day)
);

-- ============================================================
-- 离线分析结果 (通用 KV, 缓存回源用)
-- ============================================================
CREATE TABLE analysis_results (
    key             TEXT PRIMARY KEY,           -- 如 'sla:probe:42:90d:2026-04'
    value           JSONB NOT NULL,
    expires_at      TIMESTAMPTZ,               -- NULL = 永不过期
    created_at      TIMESTAMPTZ DEFAULT NOW(),
    updated_at      TIMESTAMPTZ DEFAULT NOW()
);
CREATE INDEX idx_analysis_expires ON analysis_results(expires_at)
    WHERE expires_at IS NOT NULL;

-- ============================================================
-- 告警通知渠道
-- ============================================================
CREATE TABLE notification_channels (
    id              BIGSERIAL PRIMARY KEY,
    tenant_id       BIGINT NOT NULL REFERENCES tenants(id),
    name            TEXT NOT NULL,
    type            TEXT NOT NULL,              -- webhook | email | slack | pagerduty
    config          JSONB NOT NULL,
    -- webhook: {"url":"https://...", "secret":"optional_hmac_secret"}
    -- email:   {"to":["a@b.com"]}
    -- slack:   {"webhook_url":"https://hooks.slack.com/..."}
    enabled         BOOLEAN DEFAULT TRUE,
    created_at      TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================
-- 告警规则
-- ============================================================
CREATE TABLE alert_rules (
    id              BIGSERIAL PRIMARY KEY,
    tenant_id       BIGINT NOT NULL REFERENCES tenants(id),
    probe_id        BIGINT REFERENCES probes(id),     -- NULL = 全局规则
    service_id      BIGINT REFERENCES services(id),   -- NULL = 探针级
    name            TEXT NOT NULL,
    condition_type  TEXT NOT NULL,              -- consecutive_fail | sla_below | latency_above | status_changed
    condition       JSONB NOT NULL,
    -- consecutive_fail: {"count": 3}
    -- sla_below:        {"threshold": 99.5, "window": "24h"}
    -- latency_above:    {"threshold_ms": 5000, "count": 5}
    -- status_changed:   {}  (任何 assertion 变化即触发)
    channel_ids     BIGINT[] NOT NULL,         -- 关联的通知渠道
    cooldown_sec    INT DEFAULT 300,           -- 告警冷却时间
    enabled         BOOLEAN DEFAULT TRUE,
    created_at      TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================
-- 告警事件历史
-- ============================================================
CREATE TABLE alert_events (
    id              BIGSERIAL PRIMARY KEY,
    tenant_id       BIGINT NOT NULL,
    alert_rule_id   BIGINT REFERENCES alert_rules(id),
    probe_id        BIGINT,
    service_id      BIGINT,
    status          TEXT NOT NULL,              -- firing | resolved
    message         TEXT NOT NULL,
    detail          JSONB,                     -- 触发时的上下文
    fired_at        TIMESTAMPTZ DEFAULT NOW(),
    resolved_at     TIMESTAMPTZ
);
CREATE INDEX idx_alert_events_tenant ON alert_events(tenant_id, fired_at DESC);

-- ============================================================
-- 维护窗口
-- ============================================================
CREATE TABLE maintenance_windows (
    id              BIGSERIAL PRIMARY KEY,
    tenant_id       BIGINT NOT NULL REFERENCES tenants(id),
    probe_id        BIGINT REFERENCES probes(id),     -- NULL = 全局
    service_id      BIGINT REFERENCES services(id),   -- NULL = 探针级
    title           TEXT NOT NULL,
    start_at        TIMESTAMPTZ NOT NULL,
    end_at          TIMESTAMPTZ NOT NULL,
    recurrence      JSONB,                     -- {"rrule":"FREQ=WEEKLY;BYDAY=SU"} 可选
    created_at      TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================
-- Pulse 实例注册 (多实例协调)
-- ============================================================
CREATE TABLE pulse_instances (
    instance_id     TEXT PRIMARY KEY,
    last_seen       TIMESTAMPTZ DEFAULT NOW(),
    probe_count     INT DEFAULT 0,
    metadata        JSONB DEFAULT '{}'         -- {"version":"1.0.0","region":"cn-hangzhou"}
);

-- ============================================================
-- Edge 节点注册
-- ============================================================
CREATE TABLE edge_nodes (
    id              TEXT PRIMARY KEY,           -- 节点唯一标识
    tenant_id       BIGINT NOT NULL REFERENCES tenants(id),
    name            TEXT NOT NULL,
    region          TEXT NOT NULL,              -- us-west | us-east | eu-west | ...
    endpoint        TEXT,                       -- 节点回连地址 (仅展示用)
    last_seen       TIMESTAMPTZ,
    status          TEXT DEFAULT 'online',      -- online | offline | quarantined
    created_at      TIMESTAMPTZ DEFAULT NOW()
);
```

### 2.2 Redis 缓存键设计

Redis 定位为**纯缓存**，所有数据可从 PG 重算。

| Key Pattern | Value | TTL | 来源 |
|-------------|-------|-----|------|
| `sla:{probe_id}:{window}` | `{"sla":99.97,"completeness":0.998}` | 5 min | 实时查询缓存 |
| `sla:{service_id}:{window}` | `{"sla":99.95}` | 5 min | 实时查询缓存 |
| `heatmap:{probe_id}:{year}` | `[{"date":"2026-01-01","status":"up","pct":100},...]` | 1 hour | 离线任务产出 |
| `daily_sla:{probe_id}:{date}` | `{"sla":99.8,"fault_sec":172}` | 24 hour | 离线任务产出 |
| `analysis:{key}` | `<JSONB>` | varies | 离线分析结果 |
| `probe:status:{probe_id}` | `{"status":"up","latency":42,"ts":"..."}` | 2 × interval | 最新状态快查 |
| `edge:last_seen:{edge_id}` | `timestamp` | 5 min | Edge 心跳 |

**缓存回源策略**：API 层先查 Redis，miss 则查 PG（或 analysis_results 表），结果回填 Redis。离线任务（pg_cron / pulse 内部 goroutine）定时预热高频 key。

---

## 3. OpenAPI Specification

```yaml
openapi: 3.0.3
info:
  title: Pulse API
  version: 1.0.0
  description: SLA monitoring service API

servers:
  - url: /api/v1

security:
  - ApiKeyAuth: []

components:
  securitySchemes:
    ApiKeyAuth:
      type: apiKey
      in: header
      name: X-API-Key

  schemas:
    # ── Probe ──
    Probe:
      type: object
      properties:
        id:
          type: integer
          format: int64
        name:
          type: string
        protocol:
          type: string
          enum: [http, tcp, ws, dns, icmp, push]
        target:
          type: string
        interval_sec:
          type: integer
          minimum: 10
          maximum: 86400
        timeout_ms:
          type: integer
        retries:
          type: integer
        expect:
          $ref: '#/components/schemas/ProbeExpect'
        assertions:
          type: array
          items:
            $ref: '#/components/schemas/Assertion'
        auth:
          $ref: '#/components/schemas/ProbeAuth'
        edge_policy:
          type: string
          enum: [auto, edge_only, local_only]
        service_id:
          type: integer
          format: int64
          nullable: true
        push_token:
          type: string
          description: 仅 protocol=push 时返回
        enabled:
          type: boolean
        created_at:
          type: string
          format: date-time
        updated_at:
          type: string
          format: date-time

    ProbeExpect:
      type: object
      properties:
        status_codes:
          type: array
          items:
            type: integer
        keyword:
          type: string
        max_latency_ms:
          type: integer

    Assertion:
      type: object
      required: [type, op]
      properties:
        type:
          type: string
          enum: [json_path, header, body_hash]
        path:
          type: string
          description: json_path 类型必填, 如 $.version
        key:
          type: string
          description: header 类型必填, 如 X-Deploy-Id
        op:
          type: string
          enum: [eq, neq, contains, regex]
        expect:
          type: string
          description: body_hash 类型不需要, 自动跟上次比

    ProbeAuth:
      type: object
      properties:
        type:
          type: string
          enum: [none, apikey, bearer, basic, oauth2]
        # apikey
        header:
          type: string
        value:
          type: string
        # bearer
        token:
          type: string
        # basic
        username:
          type: string
        password:
          type: string
        # oauth2
        token_url:
          type: string
        client_id:
          type: string
        client_secret:
          type: string
        scope:
          type: string

    ProbeCreate:
      type: object
      required: [name, protocol, target]
      properties:
        name:
          type: string
        protocol:
          type: string
          enum: [http, tcp, ws, dns, icmp, push]
        target:
          type: string
        interval_sec:
          type: integer
          default: 30
        timeout_ms:
          type: integer
          default: 8000
        retries:
          type: integer
          default: 1
        expect:
          $ref: '#/components/schemas/ProbeExpect'
        assertions:
          type: array
          items:
            $ref: '#/components/schemas/Assertion'
        auth:
          $ref: '#/components/schemas/ProbeAuth'
        edge_policy:
          type: string
          default: auto
        service_id:
          type: integer
          format: int64
        push_timeout_sec:
          type: integer
          default: 60
        enabled:
          type: boolean
          default: true

    ProbeUpdate:
      type: object
      description: 所有字段可选, 仅更新传入的字段
      properties:
        name:
          type: string
        target:
          type: string
        interval_sec:
          type: integer
        timeout_ms:
          type: integer
        retries:
          type: integer
        expect:
          $ref: '#/components/schemas/ProbeExpect'
        assertions:
          type: array
          items:
            $ref: '#/components/schemas/Assertion'
        auth:
          $ref: '#/components/schemas/ProbeAuth'
        edge_policy:
          type: string
        service_id:
          type: integer
          format: int64
          nullable: true
        push_timeout_sec:
          type: integer
        enabled:
          type: boolean

    # ── Service ──
    Service:
      type: object
      properties:
        id:
          type: integer
          format: int64
        name:
          type: string
        description:
          type: string
        sla_target:
          type: number
          format: float
        probe_count:
          type: integer
        current_sla:
          type: number
          format: float
          description: 当前 30d SLA
        created_at:
          type: string
          format: date-time

    ServiceCreate:
      type: object
      required: [name]
      properties:
        name:
          type: string
        description:
          type: string
        sla_target:
          type: number
          default: 99.9

    # ── SLA ──
    SlaResponse:
      type: object
      properties:
        sla_percent:
          type: number
        downtime_seconds:
          type: number
        total_seconds:
          type: number
        data_completeness:
          type: number
          description: 0-1, 实际打点覆盖率
        window:
          type: string
        period_start:
          type: string
          format: date-time
        period_end:
          type: string
          format: date-time

    # ── Probe Result ──
    ProbeResult:
      type: object
      properties:
        scheduled_at:
          type: string
          format: date-time
        status:
          type: string
          enum: [up, down, degraded, skipped, changed]
        latency_ms:
          type: integer
        status_code:
          type: integer
        error_msg:
          type: string
        edge_node_id:
          type: string
        assertion_detail:
          type: object

    # ── Availability (heatmap / bar chart) ──
    DailyAvailability:
      type: object
      properties:
        date:
          type: string
          format: date
        sla_percent:
          type: number
        fault_seconds:
          type: number
        status:
          type: string
          enum: [healthy, degraded, down, no_data]

    # ── Alert ──
    NotificationChannel:
      type: object
      properties:
        id:
          type: integer
          format: int64
        name:
          type: string
        type:
          type: string
          enum: [webhook, email, slack, pagerduty]
        config:
          type: object
        enabled:
          type: boolean

    AlertRule:
      type: object
      properties:
        id:
          type: integer
          format: int64
        name:
          type: string
        probe_id:
          type: integer
          format: int64
          nullable: true
        service_id:
          type: integer
          format: int64
          nullable: true
        condition_type:
          type: string
          enum: [consecutive_fail, sla_below, latency_above, status_changed]
        condition:
          type: object
        channel_ids:
          type: array
          items:
            type: integer
            format: int64
        cooldown_sec:
          type: integer
        enabled:
          type: boolean

    AlertEvent:
      type: object
      properties:
        id:
          type: integer
          format: int64
        alert_rule_id:
          type: integer
          format: int64
        probe_id:
          type: integer
          format: int64
        status:
          type: string
          enum: [firing, resolved]
        message:
          type: string
        detail:
          type: object
        fired_at:
          type: string
          format: date-time
        resolved_at:
          type: string
          format: date-time
          nullable: true

    # ── Maintenance Window ──
    MaintenanceWindow:
      type: object
      properties:
        id:
          type: integer
          format: int64
        probe_id:
          type: integer
          format: int64
          nullable: true
        service_id:
          type: integer
          format: int64
          nullable: true
        title:
          type: string
        start_at:
          type: string
          format: date-time
        end_at:
          type: string
          format: date-time
        recurrence:
          type: object

    # ── Edge Node ──
    EdgeNode:
      type: object
      properties:
        id:
          type: string
        name:
          type: string
        region:
          type: string
        status:
          type: string
          enum: [online, offline, quarantined]
        last_seen:
          type: string
          format: date-time

    # ── Common ──
    Pagination:
      type: object
      properties:
        total:
          type: integer
        page:
          type: integer
        per_page:
          type: integer

    Error:
      type: object
      properties:
        error:
          type: string
        message:
          type: string

# ================================================================
# Paths
# ================================================================
paths:

  # ── Probes ──
  /probes:
    get:
      summary: 探针列表
      tags: [Probes]
      parameters:
        - name: protocol
          in: query
          schema:
            type: string
            enum: [http, tcp, ws, dns, icmp, push]
        - name: service_id
          in: query
          schema:
            type: integer
        - name: enabled
          in: query
          schema:
            type: boolean
        - name: page
          in: query
          schema:
            type: integer
            default: 1
        - name: per_page
          in: query
          schema:
            type: integer
            default: 50
      responses:
        '200':
          description: OK
          content:
            application/json:
              schema:
                type: object
                properties:
                  data:
                    type: array
                    items:
                      $ref: '#/components/schemas/Probe'
                  pagination:
                    $ref: '#/components/schemas/Pagination'

    post:
      summary: 创建探针
      tags: [Probes]
      requestBody:
        required: true
        content:
          application/json:
            schema:
              $ref: '#/components/schemas/ProbeCreate'
      responses:
        '201':
          description: Created
          content:
            application/json:
              schema:
                type: object
                properties:
                  data:
                    $ref: '#/components/schemas/Probe'

  /probes/{id}:
    get:
      summary: 获取探针详情
      tags: [Probes]
      parameters:
        - name: id
          in: path
          required: true
          schema:
            type: integer
      responses:
        '200':
          description: OK
          content:
            application/json:
              schema:
                type: object
                properties:
                  data:
                    $ref: '#/components/schemas/Probe'

    patch:
      summary: 更新探针 (部分更新)
      tags: [Probes]
      parameters:
        - name: id
          in: path
          required: true
          schema:
            type: integer
      requestBody:
        content:
          application/json:
            schema:
              $ref: '#/components/schemas/ProbeUpdate'
      responses:
        '200':
          description: OK
          content:
            application/json:
              schema:
                type: object
                properties:
                  data:
                    $ref: '#/components/schemas/Probe'

    delete:
      summary: 删除探针 (软删除)
      tags: [Probes]
      parameters:
        - name: id
          in: path
          required: true
          schema:
            type: integer
      responses:
        '204':
          description: No Content

  /probes/{id}/results:
    get:
      summary: 探测结果 (图表数据)
      tags: [Probes]
      parameters:
        - name: id
          in: path
          required: true
          schema:
            type: integer
        - name: from
          in: query
          required: true
          schema:
            type: string
            format: date-time
        - name: to
          in: query
          required: true
          schema:
            type: string
            format: date-time
        - name: granularity
          in: query
          schema:
            type: string
            enum: [raw, 1m, 5m, 1h, 1d]
            default: raw
      responses:
        '200':
          description: OK
          content:
            application/json:
              schema:
                type: object
                properties:
                  data:
                    type: array
                    items:
                      $ref: '#/components/schemas/ProbeResult'

  /probes/{id}/availability:
    get:
      summary: 每日可用性 (热力图/条形图)
      tags: [Probes]
      parameters:
        - name: id
          in: path
          required: true
          schema:
            type: integer
        - name: days
          in: query
          schema:
            type: integer
            default: 90
        - name: timezone
          in: query
          schema:
            type: string
            default: UTC
      responses:
        '200':
          description: OK
          content:
            application/json:
              schema:
                type: object
                properties:
                  data:
                    type: array
                    items:
                      $ref: '#/components/schemas/DailyAvailability'

  /probes/{id}/sla:
    get:
      summary: 探针 SLA
      tags: [Probes, SLA]
      parameters:
        - name: id
          in: path
          required: true
          schema:
            type: integer
        - name: window
          in: query
          schema:
            type: string
            enum: [7d, 30d, 90d, 180d, 365d]
            default: 30d
        - name: timezone
          in: query
          schema:
            type: string
            default: UTC
      responses:
        '200':
          description: OK
          content:
            application/json:
              schema:
                type: object
                properties:
                  data:
                    $ref: '#/components/schemas/SlaResponse'

  # ── Push (pulse-probe --mode=push) ──
  /push/{push_token}:
    post:
      summary: 客户端心跳上报
      tags: [Push]
      security: []
      parameters:
        - name: push_token
          in: path
          required: true
          schema:
            type: string
      requestBody:
        content:
          application/json:
            schema:
              type: object
              properties:
                status:
                  type: string
                  enum: [up, degraded]
                  default: up
                latency_ms:
                  type: integer
                message:
                  type: string
                hmac:
                  type: string
                  description: HMAC-SHA256(token, probe_id:timestamp)
                timestamp:
                  type: integer
                  description: Unix timestamp
      responses:
        '200':
          description: OK
          content:
            application/json:
              schema:
                type: object
                properties:
                  ok:
                    type: boolean

  # ── Edge Results (pulse-probe --mode=edge) ──
  /edge/results:
    post:
      summary: Edge 节点批量上报探测结果
      tags: [Edge]
      description: 需要 mTLS 认证
      requestBody:
        required: true
        content:
          application/json:
            schema:
              type: object
              required: [edge_id, results]
              properties:
                edge_id:
                  type: string
                results:
                  type: array
                  items:
                    type: object
                    properties:
                      probe_id:
                        type: integer
                      scheduled_at:
                        type: string
                        format: date-time
                      executed_at:
                        type: string
                        format: date-time
                      status:
                        type: string
                        enum: [up, down, degraded, changed]
                      latency_ms:
                        type: integer
                      error_msg:
                        type: string
                      assertion_detail:
                        type: object
      responses:
        '200':
          description: Accepted
          content:
            application/json:
              schema:
                type: object
                properties:
                  accepted:
                    type: integer

  # ── Services ──
  /services:
    get:
      summary: 服务列表
      tags: [Services]
      responses:
        '200':
          description: OK
          content:
            application/json:
              schema:
                type: object
                properties:
                  data:
                    type: array
                    items:
                      $ref: '#/components/schemas/Service'

    post:
      summary: 创建服务
      tags: [Services]
      requestBody:
        required: true
        content:
          application/json:
            schema:
              $ref: '#/components/schemas/ServiceCreate'
      responses:
        '201':
          description: Created

  /services/{id}:
    get:
      summary: 服务详情 (含关联探针 + SLA)
      tags: [Services]
      parameters:
        - name: id
          in: path
          required: true
          schema:
            type: integer
      responses:
        '200':
          description: OK

    patch:
      summary: 更新服务
      tags: [Services]
      parameters:
        - name: id
          in: path
          required: true
          schema:
            type: integer
      responses:
        '200':
          description: OK

    delete:
      summary: 删除服务
      tags: [Services]
      parameters:
        - name: id
          in: path
          required: true
          schema:
            type: integer
      responses:
        '204':
          description: No Content

  /services/{id}/sla:
    get:
      summary: 服务级 SLA
      tags: [Services, SLA]
      parameters:
        - name: id
          in: path
          required: true
          schema:
            type: integer
        - name: window
          in: query
          schema:
            type: string
            default: 30d
      responses:
        '200':
          description: OK
          content:
            application/json:
              schema:
                type: object
                properties:
                  data:
                    $ref: '#/components/schemas/SlaResponse'

  # ── Notification Channels ──
  /notification-channels:
    get:
      summary: 通知渠道列表
      tags: [Alerts]
      responses:
        '200':
          description: OK

    post:
      summary: 创建通知渠道
      tags: [Alerts]
      requestBody:
        required: true
        content:
          application/json:
            schema:
              type: object
              required: [name, type, config]
              properties:
                name:
                  type: string
                type:
                  type: string
                  enum: [webhook, email, slack, pagerduty]
                config:
                  type: object
      responses:
        '201':
          description: Created

  /notification-channels/{id}:
    patch:
      summary: 更新通知渠道
      tags: [Alerts]
      parameters:
        - name: id
          in: path
          required: true
          schema:
            type: integer
      responses:
        '200':
          description: OK

    delete:
      summary: 删除通知渠道
      tags: [Alerts]
      parameters:
        - name: id
          in: path
          required: true
          schema:
            type: integer
      responses:
        '204':
          description: No Content

  /notification-channels/{id}/test:
    post:
      summary: 发送测试通知
      tags: [Alerts]
      parameters:
        - name: id
          in: path
          required: true
          schema:
            type: integer
      responses:
        '200':
          description: OK

  # ── Alert Rules ──
  /alert-rules:
    get:
      summary: 告警规则列表
      tags: [Alerts]
      responses:
        '200':
          description: OK

    post:
      summary: 创建告警规则
      tags: [Alerts]
      responses:
        '201':
          description: Created

  /alert-rules/{id}:
    patch:
      summary: 更新告警规则
      tags: [Alerts]
      parameters:
        - name: id
          in: path
          required: true
          schema:
            type: integer
      responses:
        '200':
          description: OK

    delete:
      summary: 删除告警规则
      tags: [Alerts]
      parameters:
        - name: id
          in: path
          required: true
          schema:
            type: integer
      responses:
        '204':
          description: No Content

  # ── Alert Events ──
  /alert-events:
    get:
      summary: 告警事件历史
      tags: [Alerts]
      parameters:
        - name: status
          in: query
          schema:
            type: string
            enum: [firing, resolved]
        - name: from
          in: query
          schema:
            type: string
            format: date-time
        - name: to
          in: query
          schema:
            type: string
            format: date-time
        - name: page
          in: query
          schema:
            type: integer
        - name: per_page
          in: query
          schema:
            type: integer
      responses:
        '200':
          description: OK

  # ── Maintenance Windows ──
  /maintenance-windows:
    get:
      summary: 维护窗口列表
      tags: [Maintenance]
      responses:
        '200':
          description: OK

    post:
      summary: 创建维护窗口
      tags: [Maintenance]
      requestBody:
        required: true
        content:
          application/json:
            schema:
              type: object
              required: [title, start_at, end_at]
              properties:
                title:
                  type: string
                probe_id:
                  type: integer
                service_id:
                  type: integer
                start_at:
                  type: string
                  format: date-time
                end_at:
                  type: string
                  format: date-time
                recurrence:
                  type: object
      responses:
        '201':
          description: Created

  /maintenance-windows/{id}:
    delete:
      summary: 删除维护窗口
      tags: [Maintenance]
      parameters:
        - name: id
          in: path
          required: true
          schema:
            type: integer
      responses:
        '204':
          description: No Content

  # ── Edge Nodes ──
  /edge-nodes:
    get:
      summary: Edge 节点列表
      tags: [Edge]
      responses:
        '200':
          description: OK
          content:
            application/json:
              schema:
                type: object
                properties:
                  data:
                    type: array
                    items:
                      $ref: '#/components/schemas/EdgeNode'

    post:
      summary: 注册 Edge 节点
      tags: [Edge]
      requestBody:
        required: true
        content:
          application/json:
            schema:
              type: object
              required: [name, region]
              properties:
                name:
                  type: string
                region:
                  type: string
      responses:
        '201':
          description: Created

  /edge-nodes/{id}:
    delete:
      summary: 移除 Edge 节点
      tags: [Edge]
      parameters:
        - name: id
          in: path
          required: true
          schema:
            type: string
      responses:
        '204':
          description: No Content

  # ── Dashboard Overview ──
  /dashboard/overview:
    get:
      summary: 总览数据 (首页用)
      tags: [Dashboard]
      responses:
        '200':
          description: OK
          content:
            application/json:
              schema:
                type: object
                properties:
                  total_probes:
                    type: integer
                  probes_up:
                    type: integer
                  probes_down:
                    type: integer
                  probes_degraded:
                    type: integer
                  overall_sla_30d:
                    type: number
                  active_alerts:
                    type: integer
                  services:
                    type: array
                    items:
                      type: object
                      properties:
                        id:
                          type: integer
                        name:
                          type: string
                        status:
                          type: string
                        sla_30d:
                          type: number
                        probe_count:
                          type: integer

  # ── System / Health ──
  /health:
    get:
      summary: 健康检查
      tags: [System]
      security: []
      responses:
        '200':
          description: OK
          content:
            application/json:
              schema:
                type: object
                properties:
                  status:
                    type: string
                  version:
                    type: string
                  uptime_sec:
                    type: integer
                  pg:
                    type: string
                    enum: [ok, error]
                  redis:
                    type: string
                    enum: [ok, error]
                  scheduler:
                    type: object
                    properties:
                      active_probes:
                        type: integer
                      worker_pool_size:
                        type: integer
                      pending_results:
                        type: integer

  /metrics:
    get:
      summary: Prometheus metrics
      tags: [System]
      security: []
      responses:
        '200':
          description: Prometheus text format
```

---

## 4. 服务端内部架构

### 4.1 Go 项目结构

```
pulse/
├── cmd/
│   ├── pulse/          # 主服务入口
│   │   └── main.go
│   └── pulse-probe/    # agent 入口
│       └── main.go
├── internal/
│   ├── config/         # Viper 配置加载
│   ├── server/         # Echo HTTP server + 路由注册
│   ├── handler/        # API handlers (按资源分文件)
│   │   ├── probe.go
│   │   ├── service.go
│   │   ├── sla.go
│   │   ├── alert.go
│   │   ├── push.go
│   │   ├── edge.go
│   │   ├── dashboard.go
│   │   └── health.go
│   ├── model/          # 数据结构 (DB model + API DTO)
│   ├── store/          # 数据库操作 (repository pattern)
│   │   ├── pg.go       # PG 连接池 + 通用方法
│   │   ├── probe.go
│   │   ├── result.go
│   │   ├── service.go
│   │   ├── alert.go
│   │   └── cache.go    # Redis 缓存操作
│   ├── scheduler/      # 时间轮调度器
│   │   ├── wheel.go
│   │   └── dispatcher.go
│   ├── worker/         # Worker Pool + 探测执行
│   │   ├── pool.go
│   │   ├── http.go     # HTTP 探测器
│   │   ├── tcp.go      # TCP 探测器
│   │   ├── ws.go       # WebSocket 探测器
│   │   ├── icmp.go     # ICMP 探测器
│   │   └── assertion.go # 断言引擎
│   ├── writer/         # BatchWriter (攒批写入 PG)
│   ├── alert/          # 告警引擎 + 通知分发
│   ├── aggregator/     # 离线聚合任务 (hourly/daily rollup)
│   ├── arbitrator/     # 多区域仲裁
│   ├── auth/           # API Key 认证中间件
│   └── metrics/        # Prometheus 指标
├── probe/              # pulse-probe 共享逻辑
│   ├── push.go         # --mode=push
│   └── edge.go         # --mode=edge
├── migrations/         # PG 迁移文件 (golang-migrate)
│   ├── 001_init.up.sql
│   └── 001_init.down.sql
├── config.example.yaml
├── Dockerfile
├── Dockerfile.probe
└── go.mod
```

### 4.2 配置文件

```yaml
# config.yaml
server:
  host: 0.0.0.0
  port: 8080

database:
  url: postgres://user:pass@host:5432/pulse?sslmode=require
  max_conns: 20

redis:
  url: redis://:pass@host:6379/0

scheduler:
  worker_pool_size: 512
  result_buffer_size: 10000

writer:
  batch_size: 2000
  flush_interval: 1s

aggregator:
  hourly_cron: "5 * * * *"       # 每小时第 5 分钟
  daily_cron: "15 0 * * *"       # 每天 00:15

instance:
  id: pulse-01                    # 多实例时每个不同
  heartbeat_interval: 10s
  rebalance_interval: 30s

log:
  level: info
  format: json
```

### 4.3 核心流程

**探测执行流程**:
```
Scheduler (timing wheel tick)
  │
  ├─ 从 slot 取出到期的 probe 列表
  ├─ 对每个 probe: 检查 in_flight 原子标记
  │   ├─ 已在执行 → skip, 记录 overlap metric
  │   └─ 空闲 → 投递到 worker channel
  │
Worker Pool (从 channel 消费)
  │
  ├─ 从 sync.Pool 获取 ProbeResult 结构体
  ├─ context.WithTimeout(interval * 0.8)
  ├─ 执行协议探测 (http/tcp/ws/icmp)
  │   ├─ 成功 → 判定 expect 规则 → up / degraded
  │   └─ 失败 → down
  ├─ 如果 status=up 且有 assertions → 执行断言
  │   ├─ 全部通过 → 维持 up
  │   └─ 任一失败 → changed, 记录 assertion_detail
  ├─ 结果投递到 result channel
  │
BatchWriter (从 result channel 消费)
  │
  ├─ 攒批: 每 1s 或满 2000 条 → COPY 写入 PG
  ├─ 写入失败 → 本地 WAL 文件, 恢复后重放
  │
  └─ 同时: 状态变更检测 (up→down / down→up / up→changed)
      ├─ up→down: INSERT fault_intervals (fault_end=NULL)
      ├─ down→up: UPDATE fault_intervals SET fault_end=NOW()
      ├─ up→changed: INSERT fault_intervals (fault_type='changed')
      └─ 触发 alert engine 评估告警规则
```

**缓存策略**:
```
API 请求 (如 GET /probes/42/sla?window=90d)
  │
  ├─ 查 Redis: sla:42:90d
  │   ├─ 命中 → 直接返回
  │   └─ 未命中 ↓
  ├─ 查 PG: analysis_results WHERE key='sla:probe:42:90d'
  │   ├─ 命中且未过期 → 返回, 回填 Redis (TTL=5min)
  │   └─ 未命中或已过期 ↓
  ├─ 实时计算: 查 fault_intervals 做区间交集
  │   └─ 返回, 同时写入 analysis_results + Redis
  │
离线任务 (aggregator, 每小时/每天):
  │
  ├─ 计算所有活跃探针的 hourly/daily rollup → 写入 rollup 表
  ├─ 计算 90d/180d/365d SLA → 写入 analysis_results
  ├─ 生成热力图数据 → 写入 analysis_results
  └─ 预热 Redis 缓存: 高频 key 主动 SET
```

### 4.4 多实例协调

```
pulse-01 启动:
  │
  ├─ UPSERT pulse_instances SET last_seen=NOW()
  ├─ LISTEN probe_changed
  ├─ 启动心跳 goroutine: 每 10s UPDATE last_seen
  │
  └─ 启动 rebalance goroutine: 每 30s
      │
      ├─ SELECT pg_try_advisory_lock(1) -- 只有一个实例跑分配器
      │   ├─ 未获取 → 跳过, 等下一轮
      │   └─ 获取到 ↓
      ├─ 清理超时实例: DELETE WHERE last_seen < NOW()-'30s'
      ├─ 查询未分配/孤儿探针
      ├─ 按 round-robin 均匀分配到存活实例
      └─ UPDATE probes SET assigned_instance=...

每个实例只调度 assigned_instance = 自己 ID 的探针.
```

### 4.5 断言引擎

```go
// Assertion 执行伪代码
func RunAssertions(resp *http.Response, body []byte, probe *Probe) (bool, map[string]any) {
    detail := map[string]any{}
    allPass := true

    for _, a := range probe.Assertions {
        switch a.Type {
        case "json_path":
            actual := gjson.GetBytes(body, a.Path).String()
            if !compare(actual, a.Op, a.Expect) {
                detail[a.Path] = map[string]string{"expect": a.Expect, "actual": actual}
                allPass = false
            }

        case "header":
            actual := resp.Header.Get(a.Key)
            if !compare(actual, a.Op, a.Expect) {
                detail["header:"+a.Key] = map[string]string{"expect": a.Expect, "actual": actual}
                allPass = false
            }

        case "body_hash":
            hash := sha256Hex(body)
            prev := probe.LastAssertionState["body_hash"]
            if prev != "" && hash != prev {
                detail["body_hash"] = map[string]string{"previous": prev, "current": hash}
                allPass = false
            }
            // 更新 last_assertion_state (无论是否变化)
            updateLastState(probe.ID, "body_hash", hash)
        }
    }
    return allPass, detail
}
```

---

## 5. pulse-probe 设计

### 5.1 Push 模式

```yaml
# pulse-probe config (push mode)
mode: push
server: https://pulse.example.com
probe_id: 42
token: "sk_xxx"                    # HMAC 签名用, 不直接传输
interval: 30s

# 本地健康检查 (可选)
checks:
  - type: http
    url: http://localhost:8080/healthz
  - type: tcp
    addr: localhost:3306
  - type: exec
    command: "/usr/local/bin/check_disk.sh"
    timeout: 5s
```

**执行逻辑**: 每 interval 执行本地 checks → 汇总状态 → 计算 HMAC(token, probe_id:timestamp) → POST /api/v1/push/{push_token}

### 5.2 Edge 模式

```yaml
# pulse-probe config (edge mode)
mode: edge
server: https://pulse.example.com
edge_id: "edge-us-west-01"
region: us-west

# mTLS
tls:
  cert: /etc/pulse/edge.crt
  key: /etc/pulse/edge.key
  ca: /etc/pulse/ca.crt

poll_interval: 10s               # 向 controller 拉取探针分配
buffer_size: 10000               # 本地缓冲区大小
```

**执行逻辑**: 定期 GET /api/v1/internal/edge/assignments?edge_id=xxx 获取分配的探针列表 → 本地调度执行 → 批量 POST /api/v1/edge/results

---

## 6. 部署

### 6.1 最小部署 (Fly.io / Railway)

```
pulse binary (1 instance)
  └─ 连接阿里云 RDS PG
  └─ 连接阿里云 Redis
```

环境变量:
```
DATABASE_URL=postgres://user:pass@xxx.rds.aliyuncs.com:5432/pulse?sslmode=require
REDIS_URL=redis://:pass@xxx.redis.rds.aliyuncs.com:6379/0
PULSE_INSTANCE_ID=pulse-01
```

### 6.2 多实例部署

```
pulse-01 (Fly machine 1) ─┐
pulse-02 (Fly machine 2) ─┼─ 同一个 PG + Redis
pulse-03 (Fly machine 3) ─┘

pulse-probe --mode=edge (Vultr US-West, $3.5/mo)
pulse-probe --mode=edge (Hetzner EU, $3.5/mo)
```

### 6.3 PG 基础操作速查

给不熟悉 PG 的开发者:

```bash
# 连接
psql "postgres://user:pass@host:5432/pulse"

# 阿里云 RDS 控制台也有 Web 版 SQL 编辑器, 可以直接执行

# 查看所有表
\dt

# 查看表结构
\d probes

# 查看分区
\d+ probe_results

# 创建新月份分区 (生产环境用 pg_partman 自动管理)
CREATE TABLE probe_results_2026_05
    PARTITION OF probe_results
    FOR VALUES FROM ('2026-05-01') TO ('2026-06-01');

# 查看当前连接数
SELECT count(*) FROM pg_stat_activity;

# 查看慢查询
SELECT pid, now() - pg_stat_activity.query_start AS duration, query
FROM pg_stat_activity
WHERE state != 'idle' AND now() - pg_stat_activity.query_start > interval '1 second';

# LISTEN/NOTIFY 测试
-- 终端 A:
LISTEN probe_changed;
-- 终端 B:
NOTIFY probe_changed, '42';
-- 终端 A 会收到: Asynchronous notification "probe_changed" with payload "42"
```
