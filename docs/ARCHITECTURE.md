# Pulse — 架构设计文档

> 本文档是 Pulse 系统的**架构总览与长期演进蓝图**。所有服务端开发以此为基准；
> 与 `IMPL_SPEC.md`（实施规格细节）、`SERVER_ROADMAP.md`（分阶段路线）、
> `DATABASE.md`（数据层运维）配套阅读。
>
> **维护约定**：涉及模块新增/拆分、存储选型变更、跨模块数据流调整时必须同步本文。
> 每次更新在文末的"变更记录"添加一行。

---

## 1. 定位与目标

| 维度 | 说明 |
|------|------|
| 产品定位 | 轻量 SLA 监控平台（私有化/单二进制友好，可扩展至多实例） |
| 采集模式 | **服务端主动探测**（http/tcp/ws/dns/icmp）+ **客户端心跳上报**（push）+ **多地域 Edge 探测**（可选） |
| 计算维度 | 探针级 & 服务级 SLA；支持 7d/30d/90d/180d/365d 滚动窗口 |
| 告警能力 | 连续失败 / SLA 低于阈值 / 延迟超限 / 断言变更 |
| 部署形态 | 单实例本地（SQLite）→ 单实例生产（PG+Redis）→ 多实例协同（PG 仲裁） |

**非目标（短期内不做）**：APM、日志聚合、K8s Operator、时序指标长周期（>1y）存储。

---

## 2. 领域模型

```
Tenant (租户)
  └── Service (服务, 业务单元)
        └── Probe (探针, 技术检测点)          ─┐
              ├── ProbeResult (原始打点)         │ N:1
              ├── FaultInterval (故障区间)        │
              └── Rollup (hourly/daily 聚合)     │
                                               ─┘
  └── AlertRule ── NotificationChannel
  └── MaintenanceWindow (服务级维护)
```

关键约束：
- **Probe → Service: N:1**（删除服务时探针 `service_id` 置 NULL，不级联删除）
- **维护窗口设在服务级**：维护期间所在服务的全部探针故障不计入 SLA
- **Push 探针**不参与主动调度，由外部客户端通过 `/api/v1/push/{token}` 上报
- **Edge 探针**协议与本地探针相同，仅执行环境不同（pulse-probe --mode=edge）

---

## 3. 组件拓扑

```
┌────────────────────────── pulse (单 Go 二进制) ─────────────────────────┐
│                                                                         │
│  ┌───────────┐   ┌───────────┐   ┌──────────┐   ┌────────────────────┐ │
│  │ Scheduler │──▶│  Workers  │──▶│ Writer   │   │ API / Dashboard    │ │
│  │ (时间轮)   │   │  (pool)   │   │ (batch)  │   │ (Echo v4)          │ │
│  └───────────┘   └───────────┘   └────┬─────┘   └─────────┬──────────┘ │
│        ▲                               │                   │            │
│        │                      ┌────────▼────────┐          │            │
│        │                      │ Alert Engine    │          │            │
│        │                      └────────┬────────┘          │            │
│        │                               │                   │            │
│        │                      ┌────────▼────────┐          │            │
│        │                      │ Aggregator      │◀─ cron ──┘            │
│        │                      │ (离线 rollup)    │                      │
│        │                      └────────┬────────┘                      │
│        │                               │                                │
│  ┌─────┴─────────────────────────────▼─────────────────────────────┐  │
│  │                     存储访问层 (internal/store)                    │  │
│  │         PG Pool (pgx/v5)              Redis Pool (go-redis)       │  │
│  └───────────┬──────────────────────────────────┬────────────────────┘  │
└──────────────┼──────────────────────────────────┼───────────────────────┘
               │                                  │
        ┌──────▼───────┐                   ┌──────▼───────┐
        │ PostgreSQL   │                   │    Redis     │
        │ (主存储)      │                   │  (纯缓存)     │
        └──────────────┘                   └──────────────┘

  ┌──────────────────┐   ┌──────────────────┐
  │ pulse-probe      │   │ pulse-probe      │
  │ --mode=push      │   │ --mode=edge      │
  └────────┬─────────┘   └────────┬─────────┘
           │ HTTPS POST            │ HTTPS POST (mTLS)
           └──────────▶ pulse ◀────┘
```

### 3.1 进程边界

| 进程 | 产物 | 运行位置 | 状态 |
|------|------|----------|------|
| `pulse` (server) | `packages/server/cmd/pulse/` | 托管侧 | 🟡 仅 HTTP stub，需建完整内核 |
| `pulse-probe --mode=push` | `packages/probe/cmd/pulse-probe/` | 用户侧 | 🟡 只有 heartbeat loop，待加本地 checks |
| `pulse-probe --mode=edge` | 同上二进制不同 flag | 海外 VPS | 🔴 未实现 |

### 3.2 存储边界

- **PostgreSQL = 真相源**：配置表、打点表、故障区间、聚合表、离线分析结果、实例注册
- **Redis = 纯缓存**：全部数据可从 PG 重算；挂了只影响查询延迟，不丢数据
- **本地 WAL 文件**：Writer 在 PG 不可用时作为降级缓冲（见 §5.3）

> **存储演进**：MVP 阶段**允许用 SQLite 跑单机**（开发/私有化场景），但所有 SQL 必须兼容 PG 语法，分区/NOTIFY 等 PG 专用特性通过 `internal/store` 接口隔离。详见 `DATABASE.md §1`。

---

## 4. 模块职责

| 目录 | 职责 | 关键接口 / 外部依赖 |
|------|------|---------------------|
| `internal/config` | Viper 加载 yaml + env，运行时配置热更新（可选） | — |
| `internal/server` | Echo 路由注册、中间件（Recover/CORS/ApiKey/RequestID） | `handler/*` |
| `internal/handler` | API handler（按资源拆文件），仅做参数校验 + 调用 service 层 | `store/*`, `scheduler` |
| `internal/store` | 仓储层（`ProbeStore`、`ResultStore`、`CacheStore` 等接口） | pgx/v5、go-redis |
| `internal/scheduler` | 时间轮调度器 + 分发器 | 下发到 `worker.Channel` |
| `internal/worker` | Worker 池 + 各协议探测器 + 断言引擎 | net/http、gorilla/websocket、golang.org/x/net/icmp |
| `internal/writer` | BatchWriter（攒批 COPY 写 PG）、故障区间增量维护、本地 WAL 降级 | PG COPY、本地文件 |
| `internal/alert` | 规则评估 + 通知分发（webhook/email/slack/pagerduty） | net/http、SMTP |
| `internal/aggregator` | 小时/日 rollup、90d+ SLA、热力图，写回 `analysis_results` | pg_cron 或内嵌 goroutine |
| `internal/arbitrator` | 多实例分配、Edge 节点仲裁（多源故障判定） | `pg_advisory_lock` |
| `internal/auth` | API Key 中间件（SHA256 hash 查表 + 最后使用时间） | `store.APIKey` |
| `internal/metrics` | Prometheus 指标注册 + `/metrics` handler | prometheus/client_golang |

**分层约束**：
- `handler` 只能调 `store`、`scheduler`，不得直接操作 PG/Redis
- `scheduler`/`worker`/`writer` 只能调 `store`，不得调 `handler`
- 所有数据库驱动（pgx、go-redis）的 import **仅允许**出现在 `store/*.go` 中

---

## 5. 关键数据流

### 5.1 探测执行流

```
Scheduler tick (每 100ms)
  │
  ├─ 时间轮 slot 取出当前到期 probe 列表
  ├─ 对每个 probe: CAS in_flight 原子标记
  │   ├─ 已置位 → skip（overlap 计数 +1）
  │   └─ 未置位 → 投 workerCh
  │
Worker (从 workerCh 消费)
  │
  ├─ 从 sync.Pool 取 Result 结构体
  ├─ context.WithTimeout(min(interval*0.8, timeout_ms))
  ├─ 按 protocol 分发: http/tcp/ws/dns/icmp
  ├─ 成功 → 判定 expect 规则
  │   ├─ 全部满足 → status = up
  │   ├─ 仅 latency 超限 → status = degraded
  │   └─ 状态码/关键字不符 → status = down
  ├─ status == up && len(assertions) > 0 → 跑断言链
  │   └─ 任一失败 → status = changed, assertion_detail 填明细
  └─ 投 resultCh

BatchWriter (从 resultCh 消费)
  │
  ├─ 攒批：每 1s 或满 2000 条 → PG COPY
  │   └─ 失败 → 本地 WAL，后台重试
  ├─ 状态变更检测（和上次记录对比）
  │   ├─ up→down: INSERT fault_intervals (fault_end=NULL)
  │   ├─ down→up: UPDATE fault_intervals SET fault_end=NOW()
  │   ├─ up→changed: INSERT fault_intervals (fault_type='changed')
  │   └─ any→*: 触发 Alert Engine 评估相关规则
  └─ 更新 Redis probe:status:{id}
```

### 5.2 查询流（SLA / 热力图）

```
GET /api/v1/probes/42/sla?window=90d
  │
  ├─ 1. Redis GET sla:42:90d     → 命中直返
  ├─ 2. PG SELECT analysis_results WHERE key='sla:probe:42:90d'
  │     └─ 命中且未过期 → 回填 Redis (TTL 5min) 并返回
  ├─ 3. 实时计算（fault_intervals 区间交集 + 维护窗口扣除）
  │     └─ 写入 analysis_results + Redis，返回
  │
离线 Aggregator (每小时 / 每天):
  ├─ hourly rollup（probe_results → probe_rollup_hourly）
  ├─ daily rollup  （probe_rollup_hourly → probe_rollup_daily）
  ├─ 长窗口 SLA（90d/180d/365d）→ analysis_results
  └─ 高频 key 预热到 Redis
```

### 5.3 降级策略

| 故障 | 影响 | 策略 |
|------|------|------|
| Redis 挂 | 查询延迟上升 | 直接查 PG，**不阻塞写入路径** |
| PG 短暂挂（<1h） | 写入堆积 | BatchWriter flush 到本地 WAL 文件；恢复后重放 |
| PG 长时间挂 | Writer WAL 目录打满 | 达到阈值 → 日志告警 + 丢弃最旧批次（宁可失真不宕机） |
| Scheduler 单点慢 | 探针 overlap | 记录 overlap metric；连续 3 轮 overlap 升级为 degraded 打点 |
| Alert 通知渠道挂 | 告警丢失 | `alert_events.status=firing` 持久化，渠道恢复后扫表补发（冷却保留） |

---

## 6. 多实例协同

参见 `IMPL_SPEC.md §4.4`。核心约定：

- 每个实例启动时 `UPSERT pulse_instances`；心跳 10s
- 分配器用 `pg_advisory_lock(1)` 选主（无 etcd/zk 依赖）
- `probes.assigned_instance` 字段决定该探针由哪个实例调度
- 实例 `last_seen > 30s` 视为死亡，其名下探针重分配（round-robin）
- LISTEN/NOTIFY `probe_changed` 实现跨实例的探针配置热更新

**约束**：MVP 阶段**不启用多实例逻辑**（`config.instance.multi_enabled=false`），但代码结构预留；第二阶段开启。

---

## 7. Edge 探测（多地域）

```
pulse (controller) ◀──────mTLS──────▶ pulse-probe --mode=edge
                         ▲
                         │ 1. GET  /internal/edge/assignments (10s poll)
                         │ 2. POST /api/v1/edge/results (batch, 5s)
                         ▼
                  arbitrator 仲裁：多 edge 报 down 才判 down；仅单 edge 报 down 记为 degraded
```

**仲裁规则**（伪代码）：
```go
if len(downReports) >= ceil(len(activeEdges)/2) {
    status = "down"
} else if len(downReports) >= 1 {
    status = "degraded"  // 视为区域性抖动
}
```

**目录分布**：Edge 节点跑在海外便宜 VPS（Vultr/Hetzner，$3-5/mo），仅需出站 HTTPS；无入站端口、无数据库连接，只靠 server 端分发任务。

---

## 8. 安全

| 层 | 机制 |
|----|------|
| 浏览器用户 → API | HttpOnly cookie（`pulse_at` + `pulse_rt`；`Secure; SameSite=Lax`；refresh cookie 限 Path=/api/v1/auth）自动携带；JS 读不到 token，XSS 无法窃取 |
| 第三方脚本 / SDK → API | `Authorization: Bearer <JWT>`（HS256；TTL 15min；refresh_token 7d 默认轮换可吊销） |
| CI/CD / 长期凭证 → API | `X-API-Key` header；SHA256 hash 存库（`api_keys.key_hash`） |
| 登录方式 | 本地邮箱密码（bcrypt）**或** OIDC（go-oidc + `identity_providers` 表） |
| Push endpoint | `push_token` in URL + HMAC-SHA256 签名验证（防 token 泄露重放） |
| Edge → API | mTLS（客户端证书）；`/api/v1/edge/*` 路由强制 TLS client cert 校验 |
| Webhook 出站 | 可选 HMAC secret；request body 为 JSON payload，header `X-Pulse-Signature: sha256=...` |
| 敏感字段 | `probes.auth` JSONB、`identity_providers.client_secret` **不返回前端**；IdP secret 入库前 AES-256-GCM 加密 |
| API Key 轮换 | 24h 宽限期（旧 key 标 deprecated，仍可用） |
| JWT 密钥管理 | `PULSE_JWT_SECRET` 环境变量；多实例共享；密钥轮换策略（双签双验）放 Phase 2+ |

认证中间件实现细节与 OIDC 授权流程见 `IMPL_SPEC.md §4.6`。

---

## 9. 可观测性

- **日志**：`slog` JSON 格式，字段固定（`probe_id`、`request_id`、`instance_id`）
- **指标**：Prometheus `/metrics`，关键指标：
  - `pulse_probe_results_total{protocol,status}`
  - `pulse_scheduler_overlap_total{probe_id}`
  - `pulse_writer_batch_size_bucket`
  - `pulse_alert_fired_total{rule_type}`
  - `pulse_cache_hit_ratio{layer=redis|pg_analysis}`
- **健康检查**：`GET /healthz`（无鉴权）返回 PG/Redis/调度器状态
- **Trace**：暂不接 OTel；后期视规模再说

---

## 10. 部署形态演进

| 阶段 | 目标场景 | 组件 | 存储 |
|------|---------|------|------|
| MVP | 个人 / 10 探针 | 单 `pulse` 二进制 | SQLite + 内存缓存 |
| V1 | 小团队 / 100 探针 | 单 `pulse` + 阿里云 RDS | PG + Redis |
| V2 | 中型 / 1k+ 探针 | 2-3 `pulse` 实例 + PG + Redis | PG 分区 + Redis |
| V3 | 多地域 | V2 + 多 `pulse-probe --mode=edge` | + 仲裁 |

**不跨阶段跳跃**——每阶段都需通过核心用例验证再进入下一阶段。

---

## 11. 技术决策记录（ADR 简版）

| # | 决策 | 备选 | 选择原因 |
|---|------|------|----------|
| 1 | 存储单一 PG（不用 ClickHouse/VM） | CH/VM/InfluxDB | 规模 < 10 亿打点时 PG 分区已足够；减少运维面 |
| 2 | 缓存用 Redis（不用内存 cache） | 内存 LRU | 多实例一致性；挂了可降级 |
| 3 | 调度用时间轮（不用 cron） | cron、quartz | 100ms 精度、无 GC 压力；百万探针量级性能 OK |
| 4 | pulse-probe 单二进制两模式 | 分两个 bin | 减少产物，配置差异通过 `--mode` 区分 |
| 5 | 多实例仲裁用 PG advisory lock | etcd、consul | 不引入新中间件；租约随 DB 一起存活 |
| 6 | 前端 inline styles + Context | Tailwind / CSS-in-JS | 已落地约定（见 `CLAUDE.md`），不重构 |
| 7 | API 字段命名采用 `_sec/_ms` 显式单位 | `_s` 或无后缀 | 消除 `timeout=5` 到底是 s 还是 ms 的歧义；见 `FRONTEND_GAPS.md §1` |
| 8 | 主键 ID 用 `int64` 数字（非字符串） | UUID / 字符串 ID | PG BIGSERIAL 天然是数字；JSON 里 JS 数字安全范围 2^53-1 对探针量级完全够；少一次 ↔ 转换；2026-04-19 决策 A |
| 9 | 前端保留 `mode=server/client` 视觉糖，后端只存 `protocol` | 完全只用 `protocol` | 用户视角 server vs client 比"选 protocol=push"直观；表单内部映射；2026-04-19 决策 D |
| 10 | 认证采用 JWT + refresh_token（可吊销）双 token 方案 | 单 session cookie / 单 JWT | 无状态 access + DB 存 refresh 的"准无状态"最合适多实例场景；可吊销；2026-04-19 补丁 |
| 11 | API 同时支持 Bearer JWT 与 X-API-Key | 仅 JWT 或仅 API Key | 人类用户用 JWT（短 TTL + refresh），CI/CD/第三方用 API Key（长期凭证）；同一中间件按优先级 fallback；2026-04-19 补丁 |
| 12 | OIDC IdP 配置租户级（`identity_providers` 表），支持多 IdP | 全局单 IdP / 硬编码 | 不同租户需要不同 SSO 提供方；auto_create 标志控制是否允许自注册；2026-04-19 补丁 |

---

## 12. 文档映射

| 关心的问题 | 去哪看 |
|-----------|--------|
| 完整数据库 schema / DDL | `IMPL_SPEC.md §2` 或 `DATABASE.md §2` |
| 完整 OpenAPI 定义 | `IMPL_SPEC.md §3` |
| API 用户手册（中文、含 mock 示例） | `SWAGGER_OPENAPI.md` |
| 分阶段实施计划 | `SERVER_ROADMAP.md` |
| 数据库运维速查 | `DATABASE.md` |
| 前端未完成项 / 字段冲突 | `FRONTEND_GAPS.md` |
| 编码约定、踩坑记录 | `CLAUDE.md`（项目根） |

---

## 变更记录

| 日期 | 变更 | Commit |
|------|------|--------|
| 2026-04-19 | 初版：从 `IMPL_SPEC.md` 提炼架构总览，明确模块边界、数据流、降级策略、演进阶段 | — |
| 2026-04-19 | 并入决策 A–K：补 `dns` 协议、补 ADR #8（int64 ID）、#9（`mode` 仅 UI 保留） | — |
| 2026-04-19 | 认证补丁：新增 JWT+refresh_token、Bearer+ApiKey 双模式、OIDC IdP 租户级配置；ADR #10–#12；安全章节改写 | — |
