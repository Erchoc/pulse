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
