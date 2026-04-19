# Pulse — TODO

## 长期维护文档（Source of Truth）

| 文档 | 用途 |
|------|------|
| `docs/ARCHITECTURE.md` | 架构设计总览、模块边界、数据流、演进阶段 |
| `docs/SERVER_ROADMAP.md` | 服务端分阶段实施路线（Phase 0 → 4+） |
| `docs/DATABASE.md` | Schema 速查、迁移、分区、运维、备份恢复 |
| `docs/FRONTEND_GAPS.md` | 前端未完成项 + 字段/枚举冲突 + 待决产品决策 |
| `IMPL_SPEC.md` | 完整技术规格（DDL + OpenAPI 源） |
| `SWAGGER_OPENAPI.md` | 用户向 API 手册 |

> 新增服务端功能前先读 `ARCHITECTURE.md`；
> 改 schema 必须更新 `DATABASE.md` + 新增 migration；
> 动 API 字段先看 `FRONTEND_GAPS.md` 是否有未决冲突。

---

## P0: 前端产品化（这两天搞定）

### PWA 适配
- [ ] `manifest.json`（name、icons、theme_color、display: standalone）
- [ ] Service Worker 离线缓存（Vite PWA 插件 or 手写）
- [ ] 各尺寸图标（192/512 + maskable）
- [ ] iOS meta tags（apple-touch-icon、apple-mobile-web-app-capable）
- [ ] 离线 fallback 页面

### 事件页 (Incidents)
- [ ] 事件时间线列表（时间、服务、状态变更、持续时长）
- [ ] 按时间范围筛选（24h / 7d / 30d / 90d）
- [ ] 按服务 / 状态筛选
- [ ] 事件详情展开（影响范围、恢复过程）

### 告警页 (Alerts)
- [ ] 告警规则列表（服务、条件、通知渠道、启停）
- [ ] 新建 / 编辑告警规则表单
- [ ] 告警历史记录
- [ ] 通知渠道配置（Webhook / 邮件 / Slack / 钉钉 / 飞书 / Telegram）

### 公开状态页 (Public Status Page)
- [ ] 独立的只读页面（可分享链接）
- [ ] 服务状态总览 + 可用性条形图
- [ ] 事件公告 / 维护通知
- [ ] 自定义品牌（logo、颜色、域名）

### 探针管理完善
- [ ] 探针分组 & 标签
- [ ] 批量操作（启停、删除）
- [ ] 探针健康状态实时指示

### Settings 完善
- [ ] 通知渠道管理（多渠道 CRUD）
- [ ] 通知测试按钮（各渠道独立测试）
- [ ] 团队成员管理 UI（为 RBAC 预留）

### UI / UX 打磨
- [ ] 空状态设计（无服务、无探针、无事件时的引导）
- [ ] 加载骨架屏（Skeleton）
- [ ] 错误边界 + 友好错误提示
- [ ] 键盘导航完善（Tab 焦点、Escape 关闭 Modal）
- [ ] 响应式 < 600px 小屏适配检查

---

## P1: 后端 & CLI（前端完成后集中搞）

### 数据持久化
- [ ] SQLite 存储层（services、probes、events、settings）
- [ ] 数据库 migration 方案
- [ ] 前端 API 对接（替换 mock 数据）

### 探针执行引擎
- [ ] HTTP 探针（状态码 + 延迟 + 证书检查）
- [ ] TCP 探针（连接 + 延迟）
- [ ] WebSocket 探针（连接 + 消息往返）
- [ ] DNS 探针
- [ ] 调度器（按 interval 执行、重试、超时）
- [ ] 指标聚合（p50/p95/p99、可用率计算）

### 事件 & 告警引擎
- [ ] 状态变更检测（up → down / degraded）
- [ ] 告警规则评估
- [ ] 通知分发（webhook / 邮件 / IM）
- [ ] 静默 & 抑制规则
- [ ] 维护窗口自动静默

### 认证 & 权限
- [ ] 本地账号（用户名 + 密码 bcrypt）
- [ ] JWT / Session 认证
- [ ] API Key 校验（当前只生成不验证）
- [ ] RBAC（admin / editor / viewer）

### CLI
- [ ] `pulse-cli` 命令行工具
- [ ] 服务 / 探针 CRUD
- [ ] 告警规则管理
- [ ] 状态查看
- [ ] 配置导入导出（YAML）

---

## P2: 进阶功能

- [ ] SSO / OIDC 企业登录
- [ ] 操作审计日志
- [ ] SLA 报告导出（PDF / CSV）
- [ ] 多探针节点（多地理位置检测）
- [ ] OpenAPI 文档自动生成
- [ ] 国际化扩展（日语、韩语）
- [ ] Grafana / Prometheus 集成
- [ ] 自定义 Dashboard
