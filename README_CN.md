<div align="center">

# Pulse

**轻量级 SLA 监控平台，全球探针覆盖**

[![Go](https://img.shields.io/badge/Go-1.23+-00ADD8?logo=go&logoColor=white)](https://go.dev)
[![React](https://img.shields.io/badge/React-19-61DAFB?logo=react&logoColor=white)](https://react.dev)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.0-3178C6?logo=typescript&logoColor=white)](https://www.typescriptlang.org)
[![License](https://img.shields.io/badge/License-Apache_2.0-blue.svg)](LICENSE)

[English](README.md) | [中文](README_CN.md)

<img src="docs/screenshots/dashboard-dark.png" alt="Pulse 仪表盘 — 暗色主题" width="100%">

</div>

---

Pulse 是一个可自托管的正常运行时间监控与 SLA 追踪平台。在全球多个区域部署轻量级探针，通过 HTTP、TCP、WebSocket、DNS、ICMP 或客户端心跳等协议监控服务，获得实时可用性仪表盘和事件历史记录。

## 界面预览

| 暗色主题 | 亮色主题 |
|:---:|:---:|
| ![暗色](docs/screenshots/dashboard-dark.png) | ![亮色](docs/screenshots/dashboard-light.png) |

| 服务详情面板 |
|:---:|
| ![详情](docs/screenshots/service-detail-dark.png) |

## 功能特性

- **多协议监控** — 支持 HTTP(S)、WebSocket、TCP、DNS、ICMP 和客户端推送（心跳模式）
- **全球探针部署** — 可部署至国内（张家口 / 深圳 / 上海）、香港、东南亚、欧洲、美东 / 美西
- **实时 SLA 仪表盘** — 实时可用率 %、延迟指标（p50/p95/p99）、正常运行时间图表、事件时间线
- **服务级 SLA 目标** — 按服务设置 SLA 目标，支持可配置的统计窗口（滚动 7 天 – 365 天）
- **维护窗口** — 计划内维护期间自动抑制告警，停机时间不计入 SLA
- **事件追踪** — 自动检测状态变更（正常 / 降级 / 宕机），记录持续时间和恢复信息
- **Webhook 告警** — 支持将异常通知推送至 Slack、钉钉、飞书或任意 Webhook 地址
- **明暗主题** — 精心设计的 UI，支持主题切换，桌面端和移动端均已适配
- **国际化** — 完整的中英文双语支持
- **PWA 支持** — 可安装为渐进式 Web 应用，支持离线缓存
- **单二进制部署** — Go 服务端内嵌 SPA 静态文件，一个二进制文件即可运行
- **API Key 认证** — 安全的 API 访问控制，支持密钥重新生成和 24 小时宽限期

## 架构概览

```
┌─────────────────────────────────────────────────────────┐
│                   浏览器 (React SPA)                     │
│          仪表盘 · 探针管理 · 设置 · 事件记录              │
└──────────────────────────┬──────────────────────────────┘
                           │ REST API
┌──────────────────────────▼──────────────────────────────┐
│                  Go API 服务端 (Echo)                     │
│           SQLite · 探针调度器 · 告警引擎                   │
└──────┬───────────────────────────────────┬──────────────┘
       │                                   │
  ┌────▼─────┐                       ┌─────▼────┐
  │  主动探测  │                       │  客户端   │
  │ HTTP/TCP/ │                       │   推送    │
  │ WS/DNS/  │                       │ (pulse-  │
  │  ICMP     │                       │  probe)  │
  └──────────┘                       └──────────┘
       │                                   │
  全球区域：                           IoT / 内部
  国内 · 香港 · 东南亚 · 欧洲 · 美国     服务
```

## 快速开始

### 环境要求

- [Node.js](https://nodejs.org) 24+（推荐通过 [mise](https://mise.jdx.dev) 管理）
- [Go](https://go.dev) 1.23+
- [pnpm](https://pnpm.io) 10+

### 本地开发

```bash
# 安装依赖
pnpm install

# 同时启动前端 (端口 3000) + Go 服务端 (端口 7758)
pnpm dev

# 运行全部测试 (web + go-server + probe)
pnpm test

# 完整验证：lint + 类型检查 + 测试 + 构建
pnpm verify
```

### 生产构建

```bash
# 构建前端 SPA + Go 服务端二进制
pnpm build

# 构建独立探针采集端
pnpm build:probe
```

## 部署方式

### Docker

```bash
docker compose up -d
```

### Docker（手动）

```bash
docker build -t pulse .
docker run -p 3000:3000 pulse
```

### Fly.io

```bash
pnpm ship   # 部署到 Fly.io
```

### 独立二进制

构建 Go 服务端（内嵌 SPA），直接运行即可——生产环境无需 Node.js。

## 项目结构

```
packages/
  web/          React 19 + Vite 6 前端 SPA（TypeScript，内联样式）
  go-server/    Go API 服务端（Echo v4，SQLite）
  probe/        独立探针采集端二进制（pulse-probe）
  server/       Node.js Fastify 静态文件服务（旧版）
  shared/       共享 TypeScript 类型定义
```

## 技术栈

| 层级 | 技术方案 |
|------|---------|
| 前端 | React 19、Vite 6、TypeScript |
| 后端 | Go 1.23、Echo v4、SQLite |
| 样式 | 内联 CSS，字体：DM Sans + JetBrains Mono + Space Grotesk |
| 代码检查 | Biome |
| 测试 | Vitest（前端）、Go test（后端 + 探针） |
| CI/CD | GitHub Actions |
| 部署 | Docker、Fly.io、独立二进制 |

## API 文档

完整的 REST API 接口文档请参阅 [SWAGGER_OPENAPI.md](SWAGGER_OPENAPI.md)，包含请求/响应示例。

## 参与贡献

欢迎贡献代码！请遵循以下流程：

1. Fork 本仓库
2. 创建功能分支（`git checkout -b feat/amazing-feature`）
3. 提交前运行 `pnpm verify` 确保通过
4. 提交 Pull Request

## 开源协议

[Apache License 2.0](LICENSE)

---

<div align="center">
  <sub>基于 Go + React 构建，为可靠的服务监控而生。</sub>
</div>
