# Pulse — 前端未完成 / 冲突清单

> **定位**：盘点前端现状与 `IMPL_SPEC.md` / `SWAGGER_OPENAPI.md` 的差距，
> 识别需要**产品拍板**的决策点，给出优先级，作为后端联调的前置条件。
>
> **配套文档**：`ARCHITECTURE.md`、`SERVER_ROADMAP.md`。
>
> **维护约定**：产品决策一经拍板就**立即同步**到 `IMPL_SPEC.md` / `SWAGGER_OPENAPI.md`，
> 本文档只保留尚未决策的冲突；已解决的移到文末"已结决策记录"表。

---

## 0. 当前前端整体评估

| 模块 | 完成度 | 关键缺口 |
|------|--------|---------|
| Overview (#tab=1) | 90% | — 基本完成 |
| Probes 列表 (#tab=2) | 80% | 缺高级配置（expect/assertions/auth/edge_policy）、无 service 关联选择器、无 push token 生成按钮 |
| Events (#tab=3) | **5%** | **仅占位文案**，无事件时间线 / 筛选 / 详情 |
| Settings (#tab=4) | 70% | 缺 Services CRUD、无多通知渠道、无告警规则管理 |
| Alerts | **0%** | **完全未做**，文案 `alertsComingSoon` 占位 |
| Public Status Page | 95% | 单页；多 slug / 品牌自定义未做 |
| PWA / Push | 70% | 权限请求做了，Service Worker 未注册、manifest 缺失 |
| i18n / 主题 | 95% | 双语完整；部分 mock 文本硬编码英文 |

**后端当前**：仅 stub 路由，无真实存储，所有数据在前端本地 mock。**前端 API 集成唯一做了的**：`POST /api/v1/settings/webhook/test`。

---

## 1. 字段/枚举命名规范（已统一，权威）

以下规范以 `IMPL_SPEC.md` / `SWAGGER_OPENAPI.md` 为权威，前端需一次性重构到位：

| 语义 | 字段名 | 类型 | 示例 |
|------|--------|------|------|
| 检测间隔 | `interval_sec` | int（秒）| `30` |
| 超时 | `timeout_ms` | int（毫秒）| `5000` |
| 协议 | `protocol` | enum | `http` / `tcp` / `ws` / `dns` / `icmp` / `push` |
| 采集方式（UI 糖） | `mode`（仅前端 UI 保留） | enum | `server` / `client`；UI 选 `client` 自动置 `protocol=push` |
| 列表响应包装 | `{ data, pagination: { total, page, per_page } }` | — | — |
| 错误包装 | `{ error: { code, message, details } }` | — | — |
| 主键 ID | `int64`（JSON 数字）| — | `42` |
| 服务 SLA | `sla_target`（可编辑目标）+ `current_sla`（计算值）| number | `99.9` / `99.97` |
| 维护窗口名 | `title` 主 + `reason` 可选详情 | string | — |

**影响面**：`packages/web/src/App.tsx`、`StatusPage.tsx` 所有 probe/service 表单与列表、mock 数据（`_initProbes`、`_initSvcs`、`genMock*`）、ID 字符串（`"probe-1"`）全部需改。后端从 Phase 0 第一天就按此规范写。

---

## 2. 探针管理缺失功能

### 2.1 高级配置（目前 0%）

前端 Probes 表单仅支持基础字段，IMPL_SPEC 定义的以下字段**UI 完全缺失**：

| 字段 | 用途 | UI 建议 |
|------|------|--------|
| `expect.status_codes` | 预期 HTTP 状态码（默认 [200]） | multi-chip 输入 |
| `expect.keyword` | 响应体关键字 | 文本框 |
| `expect.max_latency_ms` | 延迟阈值，超过判 degraded | 数字输入 |
| `assertions[]` | 断言链（json_path/header/body_hash） | 可增减行的动态表单 |
| `auth` | 认证配置（none/apikey/bearer/basic/oauth2） | 类型切换 + 对应子表单 |
| `edge_policy` | auto / edge_only / local_only | 单选 radio |
| `retries` | 失败重试次数（前端已有但未暴露） | 数字输入 |

### 2.2 其他功能

- [ ] **Service 关联选择器**：探针表单无 `service_id` 下拉
- [ ] **Push token 生成按钮**：当前 UI 显示假地址 `https://pulse.longye.site/metrics/push`，需改为"生成 token"按钮 → 调 `POST /api/v1/probes` 后展示返回的 token
- [ ] **启停开关**（`enabled` 字段）：列表行内无快速切换
- [ ] **批量操作**：多选 → 启停 / 删除（P2 优先级）
- [ ] **标签 / 分组**：`metadata` 字段未暴露到 UI（P2 优先级）

**已决**：Phase 1 做 `expect` 全集 + `auth`（bearer/basic/apikey）。`assertions` 与 `oauth2` 推后到 Phase 2；`edge_policy` 跟 Edge 探测一起放 Phase 3。

---

## 3. Events / Incidents 页（#tab=3）

**现状**：只有推送能力检测 + 权限提示；事件日志是一行"No events yet"占位。

### 必须实现

- [ ] 事件列表（来源：`GET /api/v1/alert-events` + `fault_intervals`）
- [ ] 列显示：时间（start/end）、持续时长、服务/探针、状态变更（up→down）、是否在维护中
- [ ] 筛选：时间范围（24h/7d/30d/90d）、服务、状态（firing/resolved）
- [ ] 点击展开详情（复用已有的 `IncidentDetailModal` 组件）

**已决**：
- Events 数据源为**融合视图**，后端合成 `GET /api/v1/incidents`（一条记录 = fault_interval + 关联的 alert_event）
- 维护期内故障**默认不展示**，列表顶部加"包含维护期"开关

---

## 4. Alerts 页（当前不存在）

**现状**：UI 里只有 `msg.alertsComingSoon` 的占位；整块 alert 规则/渠道管理无任何代码。

### 必须实现（P0）

- [ ] **告警规则 CRUD** 页面
  - 表单：名称 / 关联服务或探针 / 条件类型（consecutive_fail / sla_below / latency_above / status_changed）/ 条件参数 / 通知渠道多选 / 冷却期 / 启停
- [ ] **通知渠道 CRUD**
  - 类型选择：webhook / email / slack / pagerduty（钉钉/飞书/Telegram 放 P2）
  - 每种类型有独立的 config 子表单
  - 测试按钮：`POST /api/v1/notification-channels/{id}/test`
- [ ] **告警历史** 列表（复用 Events 页数据源或单独页签）

### 建议信息架构

当前 tab 结构：`Overview / Probes / Events / Settings`。推荐改为：

```
Overview  |  Services  |  Probes  |  Incidents  |  Alerts  |  Settings
```

- Services 独立出来（当前 Overview 里的服务卡片功能太重）
- Events → Incidents（术语统一，行业通用）
- Alerts 独立成一级 tab

**已决**：
- Tab 重排为 `Overview / Services / Probes / Incidents / Alerts / Settings` 六个一级 tab
- 第一版通知渠道：**Webhook + Email**（P0）；Slack + PagerDuty 放 P1；钉钉/飞书视需求插队

---

## 5. Settings 页缺失

| 缺失项 | 说明 | 优先级 |
|--------|------|--------|
| Services CRUD | 目前只能在 Overview 看服务，不能建/改/删 | P0 |
| 通知渠道集中管理 | 当前 WebhookModal 是孤岛，需独立 section | P0 |
| 告警规则入口 | 如不做 Alerts tab，则 Settings 里必须有 | 取决决策 H |
| SLA 目标编辑 | `sla_target` 字段前端只读 | P1 |
| 用户 / 角色管理 | Phase 2+ | P2 |
| 数据导出 | PDF/CSV 报表 | P2 |

---

## 6. Public Status Page

**现状**：`StatusPage.tsx` 独立页，单 slug，功能完整度高。

### 缺失

- [ ] **多状态页 / slug**：当前只有一个全局状态页，规格中 tenant.slug 可做多页
- [ ] **自定义品牌**：logo、主色
- [ ] **订阅邮件**：按钮 disabled，未实现
- [ ] **事件公告 / 维护横幅**：维护期间应在状态页顶部高亮

### 后端依赖

- [ ] `GET /api/v1/status/{slug}`：按 slug 返回该 status page 的服务列表 + 90d bar
- [ ] `POST /api/v1/status-pages` CRUD（stub 已在 `api/server.go` 有骨架，未实装）

**已决**：第一版**单页**（全局公开地址）；多 slug + 品牌自定义（logo/配色）推后到 Phase 2。

---

## 7. PWA / Push 通知

**现状**：
- ✅ 检测 Notification / PushManager API
- ✅ 权限请求 + 本地 `new Notification(...)`
- ❌ 没有 `manifest.json`
- ❌ 没有 Service Worker 注册 / 离线缓存
- ❌ 没有 Web Push subscription 发给服务端

### 补齐建议

- [ ] 引入 `vite-plugin-pwa`（自动生成 manifest + SW）
- [ ] 各尺寸图标（192 / 512 / maskable）
- [ ] iOS meta tags（apple-touch-icon、apple-mobile-web-app-capable）
- [ ] Service Worker push 事件处理 → 弹系统通知
- [ ] 后端 `POST /api/v1/push-subscriptions` 存储订阅 endpoint（Phase 2+）

**已决**：**仅 App shell 离线**（Overview 框架 + 最近缓存数据）；**不做 Web Push**（告警走 webhook/邮件即可，Web Push 的 VAPID/endpoint 运维成本不划算）。

---

## 8. 优先级清单（给大哥选单）

按"交付价值 × 改动成本"排：

### P0 — 必做，阻塞后端联调

1. **决策 A/B/C/D**（字段命名统一）→ 如果不拍板，后端 Phase 0 没法开始
2. **Incidents 页**从占位升级到可用（故障时间线 + 筛选）
3. **Alerts 页** 从 0 到 1（规则 CRUD + webhook/email 两个渠道）
4. **Settings → Services CRUD**（建/改/删服务 + 编辑 SLA target）
5. **Probes 表单补 service_id 选择器 + push token 生成按钮**
6. **字段名重构**（`interval_s → interval_sec` 等）

### P1 — 核心体验

7. **Probes 高级配置**：expect 完整支持 + auth（bearer/basic/apikey）
8. **通知渠道管理独立 section**（Settings 或 Alerts tab 下）
9. **Tab 重排**（如决策 H = 是）
10. **PWA 基础**（manifest + icons + SW 注册）

### P2 — 增值

11. 告警批量操作 / 探针标签 / 探针分组
12. Public Status Page 多 slug + 品牌自定义
13. 数据导出 PDF/CSV
14. Web Push 完整链路

---

## 9. 冲突修复路径建议

推荐的执行顺序（每一步都独立可交付）：

```
Step 1: 开一个 brainstorming 会议，拍板决策 A-K (~1h)
Step 2: 更新 IMPL_SPEC.md + SWAGGER_OPENAPI.md 为权威版本（以决策结果为准）
Step 3: 前端重构（字段名 + tab 结构）—— 1~2 天
Step 4: 前端补缺 P0 UI（Incidents / Alerts / Services CRUD）—— 3~5 天
        同步启动后端 Phase 0（存储 + Probes/Services CRUD）—— 1~2 周
Step 5: 前后端联调，切掉前端 mock
Step 6: 启动后端 Phase 1（探测内核），前端同步做 P1 项
```

**关键约束**：**Step 1 未完成前不要开任何 API / 数据库代码**——否则返工成本指数级。

---

## 10. 已结决策记录

| # | 决策 | 结论 | 日期 |
|---|------|------|------|
| A | 字段命名统一（`interval_sec`/`timeout_ms`/`protocol`/`pagination`/`int64` ID） | ✅ 同意；权威规范见 §1 | 2026-04-19 |
| B | 前端重构路径 | ✅ 前端一次性改到新字段；后端 Phase 0 直接按新字段实现，不做兼容层 | 2026-04-19 |
| C | DNS 探测优先级 | ✅ **Phase 1 就做**；`protocol` 枚举补 `dns` | 2026-04-19 |
| D | `mode=server/client` 前端 UI | ✅ **保留 UI**（视觉二选一），后端只存 `protocol`；选 `client` 时前端自动置 `protocol=push` | 2026-04-19 |
| E | Probes 高级配置第一版范围 | ✅ `expect` 全集 + `auth`(bearer/basic/apikey) 做；`assertions` + `oauth2` → Phase 2；`edge_policy` → Phase 3 | 2026-04-19 |
| F | Events 数据源 | ✅ 融合视图，后端合成 `GET /api/v1/incidents`（fault_interval + alert_event 合并为一条） | 2026-04-19 |
| G | 维护期内故障展示 | ✅ 默认不展示，顶部加"包含维护期"开关 | 2026-04-19 |
| H | Tab 重排 | ✅ 六个一级 tab：`Overview / Services / Probes / Incidents / Alerts / Settings` | 2026-04-19 |
| I | 第一版通知渠道 | ✅ Webhook + Email（P0）；Slack + PagerDuty 放 P1；钉钉/飞书视需求 | 2026-04-19 |
| J | Public Status Page 第一版 | ✅ 单页（全局地址）；多 slug + 品牌自定义放 Phase 2 | 2026-04-19 |
| K | PWA 离线策略 | ✅ 仅 App shell 离线；不做 Web Push | 2026-04-19 |

---

## 变更记录

| 日期 | 变更 | Commit |
|------|------|--------|
| 2026-04-19 | 初版：盘点前端现状，列出 11 个待决产品决策与 3 档优先级清单 | — |
| 2026-04-19 | 决策 A–K 落定；§1 从"冲突表"改为"已统一规范"；新增 §10 决策记录 | — |
