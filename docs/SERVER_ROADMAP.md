# Pulse — 服务端工作方向

> **定位**：告诉服务端开发者"下一步该做什么 / 为什么要这个顺序"。
> **配套文档**：`ARCHITECTURE.md`（为什么这么设计）、`DATABASE.md`（数据层细节）、`IMPL_SPEC.md`（完整规格源）。
>
> **维护约定**：每个阶段完工后在表格里打 ✅ 并填 commit / PR 链接；新增任务追加到对应阶段末尾。
> 阶段之间的**门槛（Exit Criteria）**必须先通过才能开下一阶段的卡。

---

## 0. 现状盘点 (2026-04-19)

| 维度 | 当前状态 | 目标状态 |
|------|----------|----------|
| 后端入口 | `cmd/pulse/main.go`（启动 Echo） | 不变 |
| 模块结构 | 仅 `internal/api`（stub 路由） | `config` / `store` / `scheduler` / `worker` / `writer` / `alert` / `aggregator` / `handler` |
| 存储 | 无 | SQLite (dev) + PG (prod)，通过 `store` 接口隔离 |
| 缓存 | 无 | Redis（允许无） |
| 探测 | 无 | HTTP / TCP / WS / ICMP / Push |
| 告警 | 无 | Webhook 起步，email/slack 渐进 |
| 鉴权 | 无 | `X-API-Key` 中间件 |
| 多实例 | 不支持 | V2 阶段启用 |
| Edge | 不支持 | V3 阶段启用 |
| pulse-probe | heartbeat loop only | push 模式完善 + edge 模式实现 |

---

## Phase 0 — 地基 (目标 1~2 周)

**目标**：**搭好骨架，能端到端 CRUD 一个 HTTP 探针**，数据真正落 DB 但尚未执行探测。

### 交付清单

- [ ] **项目结构重排**（按 `ARCHITECTURE.md §4` 目录约定）
  - 新建空包 + README 每个目录放一句职责说明
- [ ] **配置层 `internal/config`**
  - Viper 加载 `config.yaml` + 环境变量（`PULSE_DATABASE_URL` 覆盖 yaml）
  - 配置示例 `config.example.yaml` 入仓
- [ ] **存储层 `internal/store`**
  - 定义接口：`ProbeStore`、`ServiceStore`、`ResultStore`、`APIKeyStore`、`CacheStore`（Cache 可先返回 noop）
  - SQLite 实现（开发用，嵌入 `database/sql + modernc.org/sqlite`）
  - PG 实现（pgx/v5），通过 `STORAGE_MODE=embedded|postgres` 切换
- [ ] **迁移工具链**
  - 采用 `golang-migrate`，迁移文件入仓 `packages/server/migrations/`
  - 首批迁移：`001_init.up.sql`（见 `DATABASE.md §2`）
  - Makefile 加 `make migrate-up / migrate-down / migrate-new`
- [ ] **认证模块**（`internal/auth`，完整版 — 补丁 2026-04-19）
  - [ ] **JWT 签发/验证**（`jwt.go`）HS256；claims `{sub, tenant_id, role, exp, iat, jti}`；secret 来自 `PULSE_JWT_SECRET`
  - [ ] **密码哈希**（`password.go`）bcrypt cost=12
  - [ ] **双模式中间件**（`middleware.go`）
    - 优先 `Authorization: Bearer <JWT>` → 验证后注入 user_id/tenant_id/role
    - 回落 `X-API-Key: <raw>` → SHA256 查 `api_keys.key_hash` 注入 tenant_id
    - 白名单：`/healthz`、`/metrics`、`/api/v1/auth/*`、`/api/v1/push/*`、`/api/v1/edge/*`
    - 白名单未命中且两种凭证都缺/都失败 → 401
  - [ ] **本地账号流程**（`handler/auth.go`）
    - `POST /auth/register`（首用户自动 owner；其余按默认 `member`）
    - `POST /auth/login` / `POST /auth/refresh` / `POST /auth/logout`
    - `GET /auth/me`
    - `refresh_token` 存 `refresh_tokens` 表（SHA256 hash + 显式 revoked_at）
    - （可选）refresh 轮换：每次 refresh 吊销旧 token 发新 token
  - [ ] **OIDC 流程**（`oidc.go` + `handler/auth.go`）
    - `GET /auth/oidc/{provider_id}/authorize` 生成 state+nonce 入 HttpOnly cookie，302 到 IdP
    - `GET /auth/oidc/callback` 校验 state → go-oidc 换 token → 验证 id_token → 按 `(oidc_provider, sub)` 查/建 user → 签 JWT → 302 到前端
    - `auto_create=false` 且用户未预创建 → 返回 403
  - [ ] **IdP 管理**（`handler/identity_provider.go`）
    - `/identity-providers` CRUD；仅 `role=owner|admin` 可访问
    - `client_secret` 入库前 AES-256-GCM 加密（key=`PULSE_SECRETS_KEY`）；返回时永不出 secret
  - [ ] **refresh_token 清理**（集成进 `aggregator`）每日删 `expires_at < NOW()-'30d'`
  - [ ] **seed**：测试环境可用 `make seed` 建一个默认 owner + 一把默认 API Key
- [ ] **Probes CRUD**（`internal/handler/probe.go`）
  - `GET/POST /api/v1/probes`、`GET/PATCH/DELETE /api/v1/probes/{id}`
  - 软删除（`deleted_at`），列表默认过滤
  - 参数校验：`interval_sec ∈ [10, 86400]`、`protocol` 枚举、`target` 非空
- [ ] **Services CRUD**（`internal/handler/service.go`）
  - `GET/POST /api/v1/services`、`GET/PATCH/DELETE /api/v1/services/{id}`
  - 级联策略：删除 service 时 probes.service_id 置 NULL
- [ ] **Health 接口充实**
  - 查 PG `SELECT 1`、Redis PING（如启用）、返回实例元数据
- [ ] **测试**
  - `internal/store` 实现用 testcontainers 起一个 PG 跑端到端
  - handler 用 `httptest` + mock store 跑单元测试

### 门槛（必须全部通过才能开 Phase 1）

- `pnpm --filter server build` 无错
- `go test ./...` 全绿、覆盖率 ≥ 60%
- `curl -H 'X-API-Key: xxx' POST /api/v1/probes` 能成功写库并回查
- `POST /auth/register` → `POST /auth/login` → 用返回的 `Bearer` 调 `GET /auth/me` 全链路通
- 至少一个真实 OIDC IdP（建议用 dex 本地起一个）跑通 authorize → callback → 用户自动创建 → token 签发
- 迁移能在 SQLite 和 PG 上双向跑（SQLite 不支持部分唯一索引，用 trigger 模拟）
- OpenAPI 字段命名与前端对齐（见 `FRONTEND_GAPS.md §1` 决议后再定死）

---

## Phase 1 — 探测内核 (目标 2 周)

**目标**：**探针真的在跑**，结果落库、状态变更能形成故障区间、基础 SLA 可查询。

### 交付清单

- [ ] **时间轮调度器 `internal/scheduler`**
  - 100ms tick，槽位存 probe_id
  - 启动时从 DB 加载所有 `enabled=true AND protocol!=push` 的探针
  - 支持运行时增删（监听 DB 变更或 handler 直接调 `scheduler.Upsert/Remove`）
- [ ] **Worker Pool `internal/worker`**
  - 512 worker 默认，channel buffer 10k
  - sync.Pool 复用 `ProbeResult` struct 避免 GC 抖动
  - `in_flight` 原子标记防重入，记录 `overlap_total` 指标
- [ ] **探测器**
  - [ ] `http.go`：`net/http.Client`，支持自签证书开关
  - [ ] `tcp.go`：`net.DialTimeout`
  - [ ] `ws.go`：`gorilla/websocket`，upgrade 成功即算 up（可选发送 ping 包）
  - [ ] `dns.go`：`net.Resolver` + 自定义 nameserver；支持 A/AAAA/CNAME/TXT record 校验；`target` 格式 `host@nameserver?type=A`
  - [ ] `icmp.go`：需 raw socket，失败降级为 `net.Dial("ip4:icmp", ...)`；Docker 部署需 `CAP_NET_RAW`
- [ ] **expect 规则引擎**（`worker/assertion.go`）
  - `status_codes`、`keyword`（substring）、`max_latency_ms`
  - 返回明确的 `down`/`degraded` 分层
- [ ] **BatchWriter `internal/writer`**
  - 每 1s 或满 2000 条 → PG `COPY FROM STDIN`（SQLite 用 `INSERT ... VALUES (batch)`）
  - 写入失败 → 本地 WAL 文件（`var/pulse-wal/<unix_ts>.jsonl`）
  - 后台 goroutine 重放 WAL
- [ ] **Push 接收**（`handler/push.go`）
  - `POST /api/v1/push/{push_token}`：查 probe、校验 HMAC（可选）、生成 result 直投 writerCh
  - 超时判定：Aggregator 定期扫描 `probe_results` 末条 > `push_timeout_sec` 的推 down
- [ ] **故障区间维护**（Writer 内）
  - 状态变更检测（读 Redis `probe:status:{id}` 对比）
  - up→down 开 interval、down→up 关 interval
- [ ] **SLA 实时查询**（`handler/sla.go`）
  - `GET /api/v1/probes/{id}/sla?window=30d`：从 `fault_intervals` 做区间交集计算
  - 维护窗口扣除：与 `maintenance_windows` 做集合差
  - 结果写 `analysis_results` + Redis（TTL 5min）
- [ ] **打点查询**（`handler/probe.go`）
  - `GET /api/v1/probes/{id}/results?from=&to=&granularity=raw|1h|1d`
  - raw 直接查 `probe_results`；1h/1d 查 rollup 表（Phase 2 再完善，这阶段用 raw on-the-fly 聚合兜底）
- [ ] **/metrics 端点**（`internal/metrics`）
  - 注册调度/执行/写入关键指标

### 门槛

- 配置 1 个 HTTP 探针 10s interval，持续 10min 后查 `probe_results` 有 60 条，打点误差 ≤ 1 秒
- 手动让目标返回 500 持续 30s，`fault_intervals` 表有对应记录，`SLA` 接口结果正确
- `pulse-probe --mode=push` 能连到 server 并写入结果
- 压测：100 探针 × 30s interval 稳定运行 1h 无 overlap 告警

---

## Phase 2 — 告警与聚合 (目标 2 周)

**目标**：**异常能通知出去 + 长窗口 SLA 可用**。

### 交付清单

- [ ] **通知渠道**
  - [ ] `notification_channels` CRUD（含 test 接口）
  - [ ] Webhook（HMAC 可选，超时 10s，结果入 log）
  - [ ] Email（smtp，需要配置 SMTP_HOST/USER/PASS）
  - [ ] Slack（incoming webhook URL）
  - [ ] PagerDuty（Events API v2）
  - [ ] **延期**：钉钉/飞书/Telegram（放 Phase 3 或按需求插队）
- [ ] **告警规则引擎** `internal/alert`
  - `alert_rules` CRUD
  - 触发类型：
    - `consecutive_fail`：连续 N 次 down
    - `sla_below`：滚动窗口 SLA < 阈值
    - `latency_above`：连续 N 次 latency > 阈值
    - `status_changed`：断言 changed 触发
  - 冷却期（`cooldown_sec`）：同规则冷却期内不重复发
  - 维护窗口内告警**只记录不通知**（`alert_events.status=firing` + `muted_by_maintenance=true`）
- [ ] **告警事件**
  - `GET /api/v1/alert-events?status=firing|resolved&from=&to=&page=&per_page=`
  - fired/resolved 状态机：触发即 fire，下次探测 up 且持续 1 次即 resolve
- [ ] **聚合任务** `internal/aggregator`
  - 每小时（:05）：`probe_results → probe_rollup_hourly`
  - 每天（00:15 UTC）：`probe_rollup_hourly → probe_rollup_daily`
  - 同时产出当日 SLA / 热力图写 `analysis_results`
  - Redis 高频 key 预热
- [ ] **Dashboard overview 接口**
  - `GET /api/v1/dashboard/overview`：总探针数、up/down/degraded 分布、overall_sla_30d、activeAlerts、服务列表
  - 整体 200ms 内返回（全部走缓存）
- [ ] **维护窗口**
  - `maintenance_windows` CRUD
  - RRULE 递归规则（`teambition/rrule-go`）
  - SLA 查询自动扣除
- [ ] **Push 超时检测**（Aggregator 补充）
  - 每 30s 扫 `protocol=push` 且 `last_result_at < NOW() - push_timeout_sec` 的探针，注入 down 结果

### 门槛

- 触发一次连续失败，Webhook 确实收到 payload 且格式匹配 `SWAGGER_OPENAPI.md`
- 手动创建当日的维护窗口，SLA 在此区间内不下降
- 90d SLA 查询 < 100ms（缓存命中）、< 500ms（缓存未命中）

---

## Phase 3 — 多实例与 Edge (目标 2~3 周，视需求启动)

**目标**：**水平扩容 + 多地域探测**，企业化场景支撑。

### 交付清单

- [ ] **实例注册 + 心跳** `internal/arbitrator`
  - `pulse_instances` 表 UPSERT + 10s 心跳 goroutine
  - 启动时 `LISTEN probe_changed`
- [ ] **探针分配器**
  - `pg_advisory_lock(1)` 选主，30s 触发一次 rebalance
  - 死亡实例 probes.assigned_instance 重分配（round-robin）
  - Scheduler 启动时只加载 `assigned_instance = self.id`
- [ ] **Edge 节点管理**
  - `edge_nodes` CRUD
  - 注册时生成 mTLS 证书（或由运维手动导入）
  - `GET /api/v1/internal/edge/assignments?edge_id=xxx`（10s poll，返回该 edge 分配的探针）
  - `POST /api/v1/edge/results`（批量上报）
- [ ] **仲裁逻辑**
  - 多 edge 报同一探针：过半 down 才判 down；单 edge down 记 degraded
  - edge_nodes.status=quarantined 时忽略其上报（避免毒源）
- [ ] **pulse-probe --mode=edge**
  - 独立配置：`edge_id`、`region`、mTLS cert/key/ca
  - 本地 10k buffer，批量上报 5s / 500 条
  - 证书快过期告警（<14d）

### 门槛

- 3 实例启动，杀掉 1 个后 30s 内所有探针被剩余实例接管
- 2 个 edge 在不同 region 同时跑，结果正确汇总

---

## Phase 4+ — 长期演进（无明确时间，按需求插队）

| 方向 | 说明 | 先决条件 |
|------|------|---------|
| SSO / OIDC | 企业客户需求 | 多租户完整（API Key 已可用） |
| 操作审计 | 合规需求 | 增加 `audit_logs` 表 |
| SLA PDF/CSV 导出 | 商业功能 | Phase 2 聚合完成 |
| Grafana 数据源 | 让 Pulse 作为 SLA 数据源 | `/metrics` 足够丰富 |
| K8s Operator / Helm | 部署复杂场景 | V2 稳定 |
| 自定义 Dashboard | 用户拖拽 | 前端重构 |

---

## 风险与依赖清单

| 风险 | 影响 | 缓解 |
|------|------|------|
| ICMP 需要 root / CAP_NET_RAW | Docker 部署受限 | 文档明写；降级用 `net.Dial("ip4:icmp")`；K8s 用 `securityContext.capabilities` |
| PG 分区维护 | 分区未建会导致写入失败 | pg_partman 或 `aggregator` 中自建 3 个月 buffer |
| WAL 降级目录打满 | 写入丢失 | 监控 `pulse_writer_wal_bytes`，阈值告警 |
| pulse-probe 版本漂移 | 新版 server 不兼容旧 probe 上报 | Edge 上报 header 带 `X-Probe-Version`，server 记录，老版拒绝需 2 版本缓冲期 |
| Redis 挂导致查询雪崩 | SLA 接口变慢 | 所有 cache miss 走 PG；SLA 接口限流（`golang.org/x/time/rate`） |
| 前端字段命名未统一 | 前端对接时返工 | Phase 0 之前必须完成 `FRONTEND_GAPS.md §1` 决议 |
| `PULSE_JWT_SECRET` 泄露 | 所有 JWT 被伪造 | 秘钥 32+ 字节随机；支持轮换（Phase 2+ 双密钥双验）；日志不打印 |
| `PULSE_SECRETS_KEY` 丢失 | IdP.client_secret 无法解密 | master key 与备份分离存放；丢失后需重录所有 IdP 配置 |
| OIDC callback 回调 URL 不稳定 | 多实例/子域场景登录失败 | `oidc_redirect_base` 配置公网固定域名；不同实例共享；放 LB/Ingress 后 |

---

## 变更记录

| 日期 | 变更 | Commit |
|------|------|--------|
| 2026-04-19 | 初版：4 阶段路线，明确门槛与依赖 | — |
| 2026-04-19 | 并入决策 C：Phase 1 加入 `dns.go` 探测器（原建议 P2 做） | — |
| 2026-04-19 | 认证补丁：Phase 0 的 "API Key 中间件" 升级为完整认证模块（本地账号 + OIDC + JWT 双模式 + IdP 管理） | — |
