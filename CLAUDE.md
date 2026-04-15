# Pulse — Coding Conventions

## 项目结构

```
packages/
  web/        — Vite + React SPA (TypeScript, inline styles)
  go-server/  — Go API Server (Echo framework)
  probe/      — Go 采集端二进制 (pulse-probe)
  server/     — Node.js Fastify server (暂不使用)
  shared/     — 共享 TypeScript 类型
```

## 技术栈

- **前端**: React 19 + Vite 6 + TypeScript (strict, 但 `noImplicitAny: false`)
- **后端**: Go 1.23 + Echo v4
- **Lint**: Biome (recommended rules, 不放松规则 — 修代码而非关规则)
- **Hooks**: Lefthook pre-commit (biome check + typecheck)
- **工具链**: mise (Node 24 + Go 1.23), pnpm workspace

## 领域模型

```
Service (服务) ─── 业务单元，用户关心的监控对象
  └── Probe (探针) ─── 技术检测点，执行实际健康检查
```

- **探针 → 服务: N:1**（多个探针属于一个服务，一个探针只属于一个服务）
- 服务的 SLA = 其所有探针综合可用性的计算结果
- 维护模式设在**服务级别**：维护期间该服务下所有探针的故障不计入 SLA，告警仅通知操作人

## 前端规范

### 样式
- 使用 inline styles，不引入 CSS-in-JS 或 Tailwind
- 主题通过 React Context (`AppCtx`) 传递，theme token 定义在 `themes` 对象
- 字体: DM Sans (body) + JetBrains Mono (code) + Space Grotesk (display)
- 响应式用 CSS class + `<style>` 块里的 `@media` 查询（如 `.settings-row`, `.main-grid`）

### 组件模式
- 所有 UI 原子组件（Badge, Btn, Input, Select, Modal 等）在 App.tsx 内定义
- 使用 `useApp()` hook 获取 `{ t, i18n, lang, theme }`
- i18n 用纯对象字典 `msg.en` / `msg.zh`，不引 i18next

### 状态管理
- 全局状态通过 App 组件 useState + Context 传递
- 持久化: theme/lang 存 localStorage
- Tab 路由: URL hash (`#probes`, `#settings`)，overview 无 hash

## Biome 规则

**不放松规则，修代码**。以下是常见 lint 修法：

| 规则 | 修法 |
|------|------|
| `noExplicitAny` | 定义 interface/type，用 `React.ReactNode` 替代 `any` children |
| `noAssignInExpressions` | `(e) => (e.style.x = y)` → `(e) => { e.style.x = y }` |
| `noSvgWithoutTitle` | SVG 内加 `<title>` 子元素 |
| `useKeyWithClickEvents` | div onClick → 加 `role="button" tabIndex={0} onKeyDown` |
| `noLabelWithoutControl` | 纯视觉 label → 改用 `<span>` |
| `useButtonType` | 所有 `<button>` 加 `type="button"` |
| `noArrayIndexKey` | map key 用有意义的值替代 index |

## Go 规范

- Go 1.23+，Echo v4 框架
- `slog` 结构化日志
- `CGO_ENABLED=1` for go-server (SQLite), `CGO_ENABLED=0` for probe
- Go proxy: `GOPROXY=https://goproxy.cn,direct` (配置在 .mise.toml)
- 测试: `go test ./...`

## Git 规范

- Conventional Commits: `feat:` / `fix:` / `chore:`
- **禁止** `git add && git commit` 链式操作（RTK hook 导致 index.lock 竞态）
- `git add` 和 `git commit` 分成两个独立的 Bash tool call
- **git 命令必须从 repo 根目录执行**（`cd /Users/longye/AgentRun/pulse && git add ...`），从子目录执行容易路径不匹配或触发 RTK 异常
- git 操作失败后等 1-2 秒再重试，给 RTK 进程释放 lock 的时间；如遇 index.lock 残留，`rm -f .git/index.lock` 后重试
- Co-Author 行: `Co-Authored-By: Claude Opus 4.6 (1M context) <noreply@anthropic.com>`

## 踩坑记录

### 1. React 受控 Input 与 Ctrl+Z
**问题**: React 受控组件 (`value` + `onChange`) 每次 setState 会清除浏览器原生 undo 栈。
**尝试过的方案**:
- `defaultValue` + `useEffect` 同步 → 每次按键 effect 重设 value，导致光标重置、打字卡顿
- `defaultValue` + `onBlur` 同步 → 打字流畅但 parent state 延迟更新，导致依赖该值的 UI（如 disabled 按钮）不响应
**最终方案**: 回到受控模式。Ctrl+Z 是 React 已知限制，但实时状态同步更重要（按钮 disabled 状态、实时校验等都依赖它）。
**教训**: 非受控 Input 不适合有下游依赖的表单场景。

### 2. Biome pre-commit 与移植代码
**问题**: 从 JSX 移植的代码有大量 lint 错误（any、a11y、style rules），曾经通过关闭规则绕过。
**教训**: 不要放松 lint 规则。逐个修复代码：定义类型接口、加 SVG title、加 keyboard handlers、button type 等。

### 3. Webhook 测试跨域
**问题**: 前端直接 fetch 外部 URL → CORS 拦截；`mode: 'no-cors'` → 拿不到状态码，非 200 也显示成功。
**方案**: 走 Go 后端代理 `POST /api/v1/settings/webhook/test`，服务端无 CORS 限制。Vite dev proxy 转发 `/api` 到 Go server。

### 4. 亮色主题配色
**问题**: 初始亮色主题文字色太浅 (`#6b7084`)、状态色不够饱和，在白底上对比度不足。
**方案**: 文字加深 (`#111827`)，状态色加饱和 (`up: #059669`, `down: #dc2626`)，背景带微蓝底色 (`#f8f9fc`)，双层 shadow。

### 5. Settings 布局
**问题**: `maxWidth: 640` 太窄留白多；去掉 maxWidth 全宽又太散。
**方案**: 双栏 grid (`280px | 1fr`)，移动端通过 `.settings-row` media query 切成单栏。

### 6. API Key 重新生成
**问题**: 旧密钥立即失效对用户不友好，没时间做密钥轮转。
**方案**: 24 小时宽限期，重新生成后展示旧密钥（虚线边框 + 黄色标签）供迁移。

### 7. 复制按钮布局抖动
**问题**: 点击复制后文字从"复制"变"已复制！"导致按钮宽度变化，触发 layout reflow。
**方案**: 改用 SVG 图标按钮（clipboard → checkmark 动画），固定宽度零布局偏移。

### 8. SVG 图表左右留白
**问题**: MiniChart 的 SVG 用 `viewBox="0 0 200 80"` + `style={{ width: '100%' }}`，当容器比 viewBox 宽高比更宽时，SVG 默认 `preserveAspectRatio="xMidYMid meet"` 会保持宽高比并在左右留白居中。调 padding、margin、leftPad 都无效。
**尝试过的方案**:
- 缩减容器 padding → 无效，空白来自 SVG 自身
- 负 margin 突破父级 padding → 卡片比其他区域更宽，视觉不一致
- SVG 内部 leftPad 给 Y 轴标注 → 压缩绘图区，曲线更短
**最终方案**: 设置 `preserveAspectRatio="none"`，SVG 内容拉伸填满容器宽高，曲线撑满全宽。Y 轴 min/max 标注改用 HTML 绝对定位浮在图表上方。
**教训**: SVG `width: 100%` 不等于内容撑满——`preserveAspectRatio` 才是控制 viewBox 到 viewport 映射的关键属性。

### 9. Subagent 链式 git 操作
**问题**: 分派 subagent 执行 Go API 任务时，subagent 在 prompt 中明确收到"git add 和 git commit 分两个 Bash 调用"的指示，但仍然用了 `git add && git commit` 链式操作。
**原因**: Subagent 有独立的上下文窗口，RTK hook 的限制写在全局 CLAUDE.md 和 prompt 中，但 subagent 倾向于合并"简单"的 git 操作。
**教训**: 给 subagent 的 prompt 中，git 规范必须用 **加粗+大写** 强调，并在 commit 步骤中显式写成两个独立命令块而非一个代码块。

### 10. Stat card 标题高度不一致（反复出现 ×4）
**问题**: 多处 stat card 的标题（如 UPTIME (90D) vs AVG LATENCY）因文字长度不同导致高度不一致，下方数值不在同一水平线。
**出现位置**: LatencyDetailModal、AvailabilityDetailModal、IncidentDetailModal、DetailPanel 主面板——每次只修了一个地方，其他地方忘了。
**方案**: 标题 div 加 `minHeight: 28, display: 'flex', alignItems: 'center'`。
**教训**: 项目中有多处重复的 stat card 模式但没有抽成共享组件，修一处容易漏其他。如果同一模式出现 3+ 次，应该抽组件。

### 11. 移动端 filter chip 换行
**问题**: 移动端 filter chips 用 `grid-template-columns: repeat(4, 1fr)` 硬编码 4 列，当 chip 数量变化（如加入"维护中"变成 5 个）就会换行，且 chip 内中文文字在窄 button 中折行。
**方案**: 改为 `display: flex` + `flex: 1` + `white-space: nowrap` + 缩小 padding/font，让任意数量 chip 均在一行内等宽排布。
**教训**: 响应式布局不要硬编码列数，用 flex 自适应或 `auto-fit` 才能应对内容动态变化。

### 12. 服务列表分页兜底值
**问题**: 左侧服务列表高度随数据条数变化频繁跳动，视觉不稳定。
**方案**: `PAGE_SIZE = 8`，动态计算 `Math.max(8, ...)` 兜底 8 行，对齐右侧详情面板最小高度。
**教训**: 分页兜底值应与布局约束对齐，避免列表高度在数据变化时频繁重排。

### 13. RTK index.lock 不止链式操作会触发
**问题**: 两个独立的 `git add` Bash 调用间隔太短，RTK hook 把每个 git 命令改写成 `rtk git ...` 子进程，前一个 rtk 还没释放 lock 后一个就启动了，一样撞 `index.lock`。
**错误操作**: 直接 `rm -f .git/index.lock` 强删——可能破坏正在进行的 git 操作。
**正确做法**: git 操作失败后等 1-2 秒再重试，让 RTK 进程自然释放 lock。只有确认没有其他 git 进程运行时才 `rm -f`。
**教训**: 不只是 `git add && git commit` 会冲突，任何两个紧密连续的 git 写操作都可能撞 lock，包括两次 `git add`。

## 文档维护

- **SWAGGER_OPENAPI.md**: API 接口文档（参数、响应、mock 示例），每次改动服务端接口必须同步更新
- **测试报告**: `pnpm test` 自动在 `test-reports/` 目录输出报告文件（web.json、go-server.txt、probe.txt）
