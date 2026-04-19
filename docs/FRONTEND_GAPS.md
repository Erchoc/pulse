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

## 1. 字段/枚举命名冲突 ★ 需立即拍板 ★

前后端目前有三份"真相源"：
- **前端 App.tsx**（事实上使用的字段名）
- **SWAGGER_OPENAPI.md**（中文 API 文档，字段跟前端对齐）
- **IMPL_SPEC.md §3**（完整 OpenAPI spec，字段按"显式单位"规则）

三者打架的具体字段：

| 语义 | 前端 & Swagger | IMPL_SPEC | 建议 | 原因 |
|------|----------------|-----------|------|------|
| 检测间隔 | `interval_s` (int 秒) | `interval_sec` (int 秒) | **统一为 `interval_sec`** | 单位后缀显式，避免 `_s` 被误认为"复数/string" |
| 超时 | `timeout_s` (int 秒) | `timeout_ms` (int 毫秒) | **统一为 `timeout_ms`** | 毫秒精度对 HTTP 探测有意义；后端大概率需要 ms |
| 协议 | `type` ∈ {http, tcp, websocket, dns, icmp, push} | `protocol` ∈ {http, tcp, ws, icmp, push} | **统一为 `protocol`**；值用 `ws`（不是 websocket），**去掉 dns**（Phase 1 不支持） | `type` 是保留词易冲突；`ws` 和代码库 `gorilla/websocket` 对齐 |
| 采集方式 | `mode` ∈ {server, client} | （用 `protocol=push` 表达） | **仅 `protocol`，去掉 `mode`** | 用 protocol 语义更一致；push 就是一种 protocol |
| 列表响应包装 | `{ data: [], total: N }` | `{ data: [], pagination: {total,page,per_page} }` | **用 `pagination` 对象** | 便于未来加 `next_cursor` 等字段；`total` 裸字段太扁 |
| 错误包装 | `{ error: { code, message, details } }` | `{ error, message }` | **用带 code 的嵌套对象** | 前端已在用这套；code 方便国际化 |
| ID 类型 | 字符串 `"probe-1"` | `int64` | **用 int64（数字）** | PG BIGSERIAL 天然是数字；前端 JSON 里 JS 数字最大 2^53-1，探针量级远够；少一次字符串 ↔ 数字转换 |
| 服务 SLA 字段 | `sla`（实时值） | `current_sla`（实时）+ `sla_target`（目标） | **拆两个字段** | 目标可编辑、实时是计算结果，合成一个字段会丢信息 |
| 维护窗口名 | `reason` | `title` | **`title` 主字段 + `reason` 可选详情** | 列表展示需要短标题；reason 可写长描述 |

**影响面**：前端几乎所有 probe/service 表单、列表需要改字段名；后端从 0 做不受历史包袱；`IMPL_SPEC.md` 保持为权威。

### 待大哥拍板

- [ ] **决策 A**：字段命名是否按上表"建议"列统一？（推荐**是**）
- [ ] **决策 B**：如拍板统一，是否 **前端一次性重构**到新字段？还是**后端 API 先做老字段兼容**过渡？
  - 推荐：前端一次性重构（成本集中但干净）；后端从第一天就用新字段
- [ ] **决策 C**：dns 探测是否 Phase 1 就做？（推荐延后到 Phase 2）
- [ ] **决策 D**：`mode=server/client` 前端 UI 要不要保留？（推荐**保留 UI 二选一**，但后端接口字段用 protocol；前端选 client 时自动把 protocol 置为 push）

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

### 待大哥拍板

- [ ] **决策 E**：高级配置（expect/assertions/auth/edge_policy）Phase 1 全部做 UI，还是仅做 expect？
  - 推荐：**expect + auth（bearer/basic/apikey）先做**；assertions 和 oauth2 放 Phase 2

---

## 3. Events / Incidents 页（#tab=3）

**现状**：只有推送能力检测 + 权限提示；事件日志是一行"No events yet"占位。

### 必须实现

- [ ] 事件列表（来源：`GET /api/v1/alert-events` + `fault_intervals`）
- [ ] 列显示：时间（start/end）、持续时长、服务/探针、状态变更（up→down）、是否在维护中
- [ ] 筛选：时间范围（24h/7d/30d/90d）、服务、状态（firing/resolved）
- [ ] 点击展开详情（复用已有的 `IncidentDetailModal` 组件）

### 待大哥拍板

- [ ] **决策 F**：Events 页的数据源是"告警事件流"还是"故障区间流"？
  - 建议：**融合视图**——一条记录包含 fault_interval + 触发的 alert_event。后端加一个合成接口 `GET /api/v1/incidents`
- [ ] **决策 G**：维护窗口内的故障是否在 Events 页展示？
  - 建议：**默认不展示**，加"包含维护期"筛选开关

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

### 待大哥拍板

- [ ] **决策 H**：是否重排 tab？还是只在 Settings 下加子菜单？
  - 推荐：**重排成 6 个一级 tab**
- [ ] **决策 I**：第一版通知渠道支持哪几种？
  - 推荐：**webhook + email** 两个 P0；slack + pagerduty 做 P1；钉钉/飞书 视需求

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

### 待大哥拍板

- [ ] **决策 J**：第一版是单 status page（就一个公开地址）还是多 status page？
  - 推荐：**先单页**，品牌自定义（logo + 颜色）Phase 2

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

### 待大哥拍板

- [ ] **决策 K**：PWA 离线缓存做到什么程度？
  - 推荐：**App shell 离线（Overview 框架 + 最近缓存数据）**，告警通知不依赖 Web Push（用 webhook/邮件即可；Web Push 需要后端维护 VAPID 和 endpoint，复杂度高收益低）

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

## 10. 已结决策记录（当决议完成后从 §1-§8 移到这里）

| 决策编号 | 结论 | 日期 | 备注 |
|---------|------|------|------|
| （空） | | | |

---

## 变更记录

| 日期 | 变更 | Commit |
|------|------|--------|
| 2026-04-19 | 初版：盘点前端现状，列出 11 个待决产品决策与 3 档优先级清单 | — |
