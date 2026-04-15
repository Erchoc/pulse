# Status Page Design

## Overview

为 Pulse 平台新增公开状态页功能，允许外部用户通过 URL 查看服务的近期可用性情况，类似 status.claude.com。

## URL 结构

- `/status` — 展示该项目所有服务的公开状态页
- `/status/:slug` — 展示用户自定义的服务子集

## 路由与入口

- 同一个 SPA，同一个 `index.html`
- App 组件顶层通过 `window.location.pathname` 判断：
  - 匹配 `/status*` → 渲染 `<StatusPage />` 组件（不渲染管理后台 UI）
  - 其他路径 → 渲染现有管理后台
- Go 后端：`/status*` 路径 fallback 到同一个 `index.html`

## StatusPage 组件布局

参考 status.claude.com，单列居中布局。

### Header

- 左侧：项目名称（来自 Settings 的 project_name）
- 右侧：「Subscribe」按钮（暂不实现，占位）
- 下方：全局状态摘要 banner — "All Systems Operational" / "Partial Outage" / "Major Outage"，背景色随状态变化（绿/黄/红）

### 服务列表

每个服务一行：

- 服务名称
- 协议类型（HTTP / TCP / WebSocket 等）
- 目标地址
- 当前状态图标
- 90 天可用性条形图（每天一格，颜色表示状态）
- 90 天可用性百分比

交互：

- 点击某天的格子 → popover/tooltip 显示该天的宕机时长和 RT 变化信息
- 维护中的服务正常展示，用蓝色标识（不算入宕机）

### Footer

- "Powered by Pulse" 简单标识

### 响应式

- Mac 13"/16" 单页展示完（11 个服务不需要滚动）
- 移动端：条形图格子缩窄，信息堆叠换行

### 组件复用

可用性条形图、状态 badge、主题色等从现有 App.tsx 中提取复用。

## 自定义状态页管理（Settings）

Settings 页新增「Status Pages」区域：

- 已创建的自定义状态页列表，每项显示：名称、slug（可复制 URL）、包含服务数、创建时间、编辑/删除操作
- 「新建状态页」按钮 → Modal：
  - 名称（必填）
  - Slug（自动根据名称生成，可手动编辑，唯一校验）
  - 服务选择（多选列表）

## API 设计

### 管理 API（需认证）

- `GET /api/v1/status-pages` — 状态页列表
- `POST /api/v1/status-pages` — 创建状态页
- `PUT /api/v1/status-pages/:id` — 更新状态页
- `DELETE /api/v1/status-pages/:id` — 删除状态页

### 公开 API（无需认证）

- `GET /api/v1/status/services` — 全量服务状态（供 `/status` 用）
- `GET /api/v1/status/:slug` — 自定义状态页的服务状态

## Mock 数据调整

硬编码服务从 8 个增加到 11 个，保留 120 个随机生成的服务。

| # | 名称 | 组 | 状态 | SLA |
|---|------|-----|------|-----|
| 1 | API Gateway | Core | UP | 99.97% |
| 2 | WebSocket Broker | Core | UP | 99.94% |
| 3 | Auth Service | Core | UP | 99.99% |
| 4 | Order Engine | Business | DEGRADED | 99.82% |
| 5 | Payment Gateway | Business | UP | 99.91% |
| 6 | Search Cluster | Infra | UP | 99.88% |
| 7 | CDN Edge Nodes | Infra | UP | 99.98% |
| 8 | DB Primary | Infra | UP | 99.96% |
| 9 | Notification Hub | Business | DOWN | 97.65% |
| 10 | Cache Layer | Infra | MAINTENANCE | 99.95% |
| 11 | Log Pipeline | Infra | UP | 99.93% |

关键点：维护中的 Cache Layer SLA 99.95%，是健康服务做计划维护，避免用户误解维护 = 宕机。
