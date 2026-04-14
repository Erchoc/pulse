# Pulse — SLA Monitoring Platform

> 轻量、高性能的服务可用性监控平台。支持私有化部署与本地运行，开源核心 + 商业增值。

---

## 1. 项目定位

| 维度 | 说明 |
|------|------|
| 核心能力 | 服务端主动探测 + 客户端心跳上报，采集可用性指标并计算 SLA |
| 部署形态 | 单二进制本地运行 / Docker 私有化 / K8s 集群 |
| 授权模式 | 核心功能 Apache-2.0 开源；商业版提供多租户、SSO、高级报表等增值功能 |
| 技术栈 | 后端 Go · 前端 Vite + React SPA · 存储可插拔（嵌入式 SQLite ↔ ClickHouse/VictoriaMetrics） |

---

## 2. 核心概念

### 2.1 Probe（探针）

探针是最小监控单元，分两类：

**服务端探测（Server-side Probe）**
- 平台主动向目标发起检测
- 支持类型：`http` / `tcp` / `websocket` / `dns` / `icmp`
- 可配置：间隔（10s ~ 1d）、超时、重试次数、期望状态码/关键字

**客户端上报（Client Push / Pulse Probe）**
- 被监控端主动向平台推送心跳
- 适用于移动端 App、IoT 设备、内网服务等无法被外部探测的场景
- 嵌入式探针进程 **Pulse Probe** 可以单二进制部署到任意设备（Linux/macOS/Windows/ARM），以微小常驻进程方式运行
- 平台分配唯一 Push URL，客户端按约定间隔 POST 心跳
- 超过 `timeout` 未收到心跳则判定异常

### 2.2 Service（服务）

服务是探针的逻辑分组，一个服务可关联多个探针。SLA 按服务维度计算。

### 2.3 SLA 计算

```
SLA% = (1 - 异常时长 / 统计窗口总时长) × 100
```

- **统计窗口**：可配置 7d / 30d / 90d 滚动窗口
- **时区**：默认 UTC，可切换。时区决定每个统计周期的起止边界。例如月度 SLA 在 `Asia/Shanghai` 下从每月 1 日 00:00 CST 开始，同一故障在不同时区设定下可能归属不同周期
- **异常判定**：探测失败（超时/非预期响应）即计为异常打点
- **数据降采样**：原始打点保留可配置时长（30d ~ 2y），超期数据降采样为小时/天粒度聚合

---

## 3. 系统架构

```
┌──────────────────────────────────────────────────────────┐
│                      Frontend (SPA)                       │
│              Vite + React + Tailwind + uPlot              │
│                    CDN / 嵌入式托管                        │
└──────────────────────┬───────────────────────────────────┘
                       │ REST API (JSON)
┌──────────────────────▼───────────────────────────────────┐
│                    API Gateway (Go)                        │
│        Gin/Echo · Auth · Rate Limit · CORS                │
├───────────┬───────────┬───────────┬──────────────────────┤
│  Probe    │  Data     │  Alert    │  Config              │
│  Scheduler│  Ingester │  Engine   │  Manager             │
│           │           │           │                      │
│  执行探测  │  接收打点  │  异常判定  │  探针/服务/设置 CRUD  │
│  调度队列  │  写入存储  │  Webhook  │                      │
└─────┬─────┴─────┬─────┴─────┬─────┴──────────────────────┘
      │           │           │
┌─────▼───────────▼───────────▼────────────────────────────┐
│                   Storage Layer                           │
│                                                          │
│  本地模式: SQLite (config) + 内嵌 TSDB (打点)             │
│  集群模式: PostgreSQL (config) + ClickHouse/VM (打点)     │
└──────────────────────────────────────────────────────────┘
```

### 3.1 模块职责

| 模块 | 职责 | 关键设计 |
|------|------|----------|
| **Probe Scheduler** | 按配置间隔调度探测任务 | 时间轮算法，支持 10s 精度；探针增删改时动态调整 |
| **Data Ingester** | 接收服务端探测结果 + 客户端 Push 心跳 | 批量写入，可配置 flush 间隔 |
| **Alert Engine** | 异常判定 + 通知分发 | 支持连续 N 次失败才告警（避免单次抖动）；Webhook POST |
| **Config Manager** | 探针/服务/项目设置的 CRUD | RESTful API，配置持久化到关系型存储 |
| **SLA Calculator** | 按服务 + 时间窗口聚合计算 SLA | 读取打点数据，支持实时查询 + 定时预聚合 |

---

## 4. 数据模型

### 4.1 配置存储（SQLite / PostgreSQL）

```sql
-- 探针配置
CREATE TABLE probes (
    id          TEXT PRIMARY KEY,
    name        TEXT NOT NULL,
    type        TEXT NOT NULL,          -- http|tcp|websocket|dns|icmp|push
    mode        TEXT NOT NULL,          -- server|client
    target      TEXT NOT NULL,          -- URL / host:port / push token
    interval_s  INT  NOT NULL DEFAULT 30,
    timeout_s   INT  NOT NULL DEFAULT 5,
    retries     INT  NOT NULL DEFAULT 1,
    expect      JSONB,                 -- {status_codes:[200], keyword:"ok"}
    metadata    JSONB,                 -- 自定义标签
    enabled     BOOLEAN DEFAULT TRUE,
    created_at  TIMESTAMPTZ DEFAULT NOW(),
    updated_at  TIMESTAMPTZ DEFAULT NOW()
);

-- 服务（探针逻辑分组）
CREATE TABLE services (
    id          TEXT PRIMARY KEY,
    name        TEXT NOT NULL,
    description TEXT,
    sla_target  REAL NOT NULL DEFAULT 99.9,
    created_at  TIMESTAMPTZ DEFAULT NOW()
);

-- 服务-探针关联
CREATE TABLE service_probes (
    service_id  TEXT REFERENCES services(id),
    probe_id    TEXT REFERENCES probes(id),
    PRIMARY KEY (service_id, probe_id)
);

-- 项目设置
CREATE TABLE settings (
    key   TEXT PRIMARY KEY,
    value JSONB NOT NULL
);
-- 预置 keys: project_name, data_retention, sla_window, sla_timezone, webhook_url, api_key
```

### 4.2 打点存储（时序数据库）

```sql
-- ClickHouse 示例
CREATE TABLE probe_points (
    probe_id    String,
    ts          DateTime64(3, 'UTC'),
    status      Enum8('up'=1, 'degraded'=2, 'down'=3, 'timeout'=4),
    latency_ms  UInt32,
    status_code UInt16,
    error_msg   String DEFAULT ''
) ENGINE = MergeTree()
PARTITION BY toYYYYMM(ts)
ORDER BY (probe_id, ts)
TTL ts + INTERVAL 90 DAY;

-- 降采样聚合表（小时粒度）
CREATE MATERIALIZED VIEW probe_points_hourly
ENGINE = AggregatingMergeTree()
PARTITION BY toYYYYMM(ts_hour)
ORDER BY (probe_id, ts_hour)
AS SELECT
    probe_id,
    toStartOfHour(ts) AS ts_hour,
    countState() AS total,
    countIfState(status = 'up') AS up_count,
    avgState(latency_ms) AS avg_latency,
    quantileState(0.95)(latency_ms) AS p95_latency
FROM probe_points
GROUP BY probe_id, ts_hour;
```

### 4.3 数据规模估算

| 场景 | 探针数 | 间隔 | 年打点量 | 存储估算（未压缩） |
|------|--------|------|----------|-------------------|
| 个人/小团队 | 10 | 60s | ~315 万 | ~150 MB |
| 中型团队 | 100 | 30s | ~1.05 亿 | ~5 GB |
| 企业级 | 1000 | 10s | ~31.5 亿 | ~150 GB |

ClickHouse 压缩比通常 10:1，实际存储约为上表的 1/10。SQLite 嵌入模式建议探针数 ≤ 50。

---

## 5. API 设计（OpenAPI 3.0）

Base URL: `/api/v1`

认证：所有接口需要 `X-API-Key` Header（设置页生成的 API Key）。

### 5.1 探针管理

```yaml
GET /probes
  Query: mode=server|client, type=http|tcp|..., enabled=true|false
  Response: 200 { data: Probe[], total: number }

POST /probes
  Body: { name, type, mode, target, interval_s, timeout_s, retries?, expect?, metadata? }
  Response: 201 { data: Probe }

GET /probes/{id}
  Response: 200 { data: Probe }

PUT /probes/{id}
  Body: (同创建，部分字段可选)
  Response: 200 { data: Probe }

DELETE /probes/{id}
  Response: 204

POST /probes/{id}/duplicate
  Response: 201 { data: Probe }
```

### 5.2 客户端心跳上报

```yaml
POST /push/{push_token}
  Body: { status?: "up"|"degraded", latency_ms?: number, message?: string }
  Response: 200 { ok: true }
```

### 5.3 服务管理

```yaml
GET    /services
POST   /services
GET    /services/{id}               # 含关联探针 + 实时 SLA
PUT    /services/{id}
DELETE /services/{id}
POST   /services/{id}/probes        # 关联探针 { probe_ids: [] }
DELETE /services/{id}/probes/{pid}  # 解除关联
```

### 5.4 SLA 查询

```yaml
GET /services/{id}/sla
  Query: window=7d|30d|90d, timezone=UTC
  Response: 200 {
    sla_percent: 99.97,
    total_minutes: 43200,
    downtime_minutes: 12.96,
    window: "30d",
    timezone: "UTC",
    period_start: "2026-03-15T00:00:00Z",
    period_end: "2026-04-14T00:00:00Z"
  }

GET /probes/{id}/points
  Query: from, to, granularity=raw|1m|5m|1h|1d
  Response: 200 { data: [{ ts, status, latency_ms }] }

GET /probes/{id}/availability
  Query: days=90, timezone=UTC
  Response: 200 { data: [{ date, status, uptime_percent }] }
```

### 5.5 项目设置

```yaml
GET /settings
  Response: 200 { data: { project_name, data_retention, sla_window, sla_timezone, webhook_url } }

PUT /settings
  Body: { project_name?, data_retention?, sla_window?, sla_timezone?, webhook_url? }
  Response: 200 { data: Settings }

POST /settings/api-key/regenerate
  Response: 200 { data: { api_key: "sk_..." } }
```

### 5.6 Webhook

```yaml
POST /settings/webhook/test
  Response: 200 { success: true, status_code: 200, response_time_ms: 123 }
```

**Webhook 推送格式**（探测异常时平台 → 用户 URL）:

```json
{
  "event": "probe_anomaly",
  "probe_id": "prod-api-health",
  "probe_name": "prod-api-health",
  "from": "up",
  "to": "down",
  "timestamp": "2026-04-14T13:22:01Z",
  "latency_ms": 5023,
  "status_code": 503,
  "message": "Health check failed: HTTP 503",
  "error": {
    "type": "HTTP_ERROR",
    "retry_count": 3,
    "last_error": "status 503 Service Unavailable"
  }
}
```

### 5.7 统一错误格式

```json
{
  "error": {
    "code": "PROBE_NOT_FOUND",
    "message": "Probe with id 'xxx' not found",
    "details": {}
  }
}
```

HTTP 状态码：`400` 参数错误 · `401` 未认证 · `403` 无权限 · `404` 不存在 · `409` 冲突 · `429` 限频 · `500` 内部错误

---

## 6. 前端架构

```
src/
├── main.tsx
├── App.tsx                  # 路由 + 主题 + i18n Provider
├── api/
│   ├── client.ts            # fetch 封装 + X-API-Key 注入
│   ├── probes.ts
│   ├── services.ts
│   ├── settings.ts
│   └── sla.ts
├── hooks/
│   ├── useProbes.ts
│   ├── useSLA.ts
│   └── useSettings.ts
├── components/
│   ├── Badge.tsx
│   ├── Btn.tsx
│   ├── ChipSelect.tsx
│   ├── Dropdown.tsx
│   ├── Input.tsx
│   ├── Modal.tsx
│   ├── StatusDot.tsx
│   ├── Toast.tsx
│   ├── SLAGauge.tsx
│   ├── UptimeBar.tsx
│   └── MiniChart.tsx
├── pages/
│   ├── Overview.tsx
│   ├── Probes.tsx
│   ├── Incidents.tsx
│   └── Settings.tsx
├── i18n/
│   ├── en.ts
│   └── zh.ts
├── theme/
│   ├── tokens.ts
│   ├── dark.ts
│   └── light.ts
└── utils/
    ├── sla.ts
    └── format.ts
```

**核心依赖**：react, react-dom, react-router-dom, tailwindcss, uplot, ky (或原生 fetch)

**构建**：`vite build` 输出静态文件 → CDN 或 Go `embed.FS` 内嵌

---

## 7. 部署模式

### 7.1 本地单二进制

```bash
curl -fsSL https://github.com/pulsemonitor/pulse/releases/latest/download/pulse-$(uname -s | tr A-Z a-z)-$(uname -m).tar.gz | tar xz
./pulse serve --port 8080
# 浏览器打开 http://localhost:8080
```

配置/数据遵循 XDG：`~/.config/pulse/config.yaml` + `~/.local/share/pulse/`

### 7.2 Docker

```yaml
version: "3.8"
services:
  app:
    image: ghcr.io/pulsemonitor/pulse:latest
    ports: ["8080:8080"]
    volumes: [data:/data]
    environment:
      STORAGE_MODE: embedded      # embedded | external
      # PG_DSN: postgres://...
      # CLICKHOUSE_DSN: clickhouse://...
volumes:
  data:
```

### 7.3 Kubernetes（商业版）

Helm Chart：API Deployment + ClickHouse StatefulSet + PostgreSQL + Ingress + HPA

---

## 8. 开源 vs 商业版

| 功能 | 开源 (Apache-2.0) | 商业版 |
|------|-------------------|--------|
| 全部探测类型 | ✅ | ✅ |
| 客户端 Push | ✅ | ✅ |
| SLA Dashboard | ✅ | ✅ |
| Webhook 告警 | ✅ | ✅ |
| REST API | ✅ | ✅ |
| 主题 + i18n | ✅ | ✅ |
| 单二进制 / Docker | ✅ | ✅ |
| 公开状态页 | ✅ | ✅ |
| 多租户 / 团队 | ❌ | ✅ |
| SSO (OIDC/SAML) | ❌ | ✅ |
| 报表导出 | ❌ | ✅ |
| 分布式探测节点 | ❌ | ✅ |
| SLA 合规报告 | ❌ | ✅ |
| K8s Helm Chart | ❌ | ✅ |
| 优先支持 | ❌ | ✅ |

---

## 9. 开发规范

**Go 后端**：Go 1.22+ · `net/http` 或 Echo · slog 结构化日志 · 测试 ≥ 80%

**前端**：TypeScript strict · ESLint + Prettier · i18n 用 Context + 字典，不引 i18next

**Git**：`main` / `develop` / `feat/*` / `fix/*` · Conventional Commits · GitHub Actions CI

---

## 10. Roadmap

**Phase 1 — MVP（4 周）**：Go 骨架 + 嵌入式存储 · HTTP/TCP 探测 · Push 上报 · SLA API · Dashboard + 探针管理 + 设置 · Docker 镜像

**Phase 2 — 完善（4 周）**：WebSocket/DNS/ICMP 探测 · Webhook 告警策略 · 公开状态页 · 降采样 + 保留策略 · 外部存储适配 · 事件页面

**Phase 3 — 商业化**：多租户 · SSO · 分布式探测 · 高级报表 · Helm Chart
