# Status Page Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add a public status page at `/status` (all services) and `/status/:slug` (custom subset) that shows 90-day availability bars, service protocol/address, and per-day detail popovers — styled like status.claude.com.

**Architecture:** Same SPA, same `index.html`. The App component checks `window.location.pathname` — if it matches `/status*`, it renders a dedicated `StatusPage` component instead of the admin dashboard. The Vite dev server gets a middleware to rewrite `/status*` to `/index.html` for SPA fallback. Go backend gets stub APIs for public status data and status-page CRUD.

**Tech Stack:** React 19, TypeScript, inline styles, Go Echo v4, Vite 6

---

## File Structure

| Action | File | Responsibility |
|--------|------|---------------|
| Modify | `packages/web/src/App.tsx` | Add 3 new mock services (8→11), fix maintenance SLA, add pathname routing at top of App component, add i18n keys for status page |
| Create | `packages/web/src/StatusPage.tsx` | Public status page component — header, status banner, service list with 90-day bars, detail popovers, footer, responsive layout |
| Modify | `packages/web/vite.config.ts` | Add dev server middleware to rewrite `/status*` → `/index.html` |
| Modify | `packages/server/internal/api/server.go` | Add public status API routes + status-page CRUD stubs |
| Modify | `packages/server/internal/api/server_test.go` | Tests for new endpoints |

---

### Task 1: Mock Data — Expand to 11 Services + Fix Maintenance SLA

**Files:**
- Modify: `packages/web/src/App.tsx:599-760` (the `_initSvcs` array)

- [ ] **Step 1: Modify `_initSvcs` to have 11 services**

In `packages/web/src/App.tsx`, replace the `_initSvcs` array (lines 599-760) with the updated 11-service version. Key changes:
- **Search Cluster**: change `status: 'maintenance'` → `status: 'up'`, `sla: 98.72` → `sla: 99.88`, `maintenance: true` → `maintenance: false`, clear maintenance fields
- Add 3 new services after DB Primary:
  - **Notification Hub** (Business, DOWN, sla: 97.65)
  - **Cache Layer** (Infra, MAINTENANCE, sla: 99.95) — the healthy service under planned maintenance
  - **Log Pipeline** (Infra, UP, sla: 99.93)

```typescript
// Replace the Search Cluster entry (id: 'search') with:
  {
    id: 'search',
    name: 'Search Cluster',
    nameZh: '搜索集群',
    group: 'Infra',
    type: 'tcp',
    interval: '30s',
    sla: 99.88,
    target: 99.5,
    latency: 42,
    status: 'up',
    bar: genBar(),
    ld: genLd(),
    maintenance: false,
    maintenanceReason: '',
    maintenanceStartAt: null as string | null,
    maintenanceEndAt: null as string | null,
    maintenanceOperator: '',
    maintenanceNotifyUsers: [] as string[],
  },

// After DB Primary, add these 3 new entries:
  {
    id: 'notif-hub',
    name: 'Notification Hub',
    nameZh: '通知中心',
    group: 'Business',
    type: 'http',
    interval: '15s',
    sla: 97.65,
    target: 99.9,
    latency: 230,
    status: 'down',
    bar: genBar(),
    ld: genLd(),
    maintenance: false,
    maintenanceReason: '',
    maintenanceStartAt: null as string | null,
    maintenanceEndAt: null as string | null,
    maintenanceOperator: '',
    maintenanceNotifyUsers: [] as string[],
  },
  {
    id: 'cache',
    name: 'Cache Layer',
    nameZh: '缓存层',
    group: 'Infra',
    type: 'tcp',
    interval: '10s',
    sla: 99.95,
    target: 99.9,
    latency: 3,
    status: 'maintenance',
    bar: genBar(),
    ld: genLd(),
    maintenance: true,
    maintenanceReason: 'Redis cluster rolling upgrade',
    maintenanceStartAt: new Date(Date.now() - 2 * 3600_000).toISOString(),
    maintenanceEndAt: new Date(Date.now() + 4 * 3600_000).toISOString(),
    maintenanceOperator: 'user-1',
    maintenanceNotifyUsers: ['user-2'],
  },
  {
    id: 'log-pipe',
    name: 'Log Pipeline',
    nameZh: '日志管道',
    group: 'Infra',
    type: 'http',
    interval: '30s',
    sla: 99.93,
    target: 99.9,
    latency: 18,
    status: 'up',
    bar: genBar(),
    ld: genLd(),
    maintenance: false,
    maintenanceReason: '',
    maintenanceStartAt: null as string | null,
    maintenanceEndAt: null as string | null,
    maintenanceOperator: '',
    maintenanceNotifyUsers: [] as string[],
  },
```

- [ ] **Step 2: Verify the app still renders**

Run: `cd /Users/longye/AgentRun/pulse && pnpm typecheck`
Expected: PASS with no errors

- [ ] **Step 3: Commit**

```bash
git add packages/web/src/App.tsx
```
```bash
git commit -m "feat: expand mock services to 11, fix maintenance SLA"
```

---

### Task 2: Vite SPA Fallback for `/status*`

**Files:**
- Modify: `packages/web/vite.config.ts:36-44` (the `doc-page` plugin section)

- [ ] **Step 1: Extend the existing Vite plugin to rewrite `/status*` paths**

In `packages/web/vite.config.ts`, find the `doc-page` plugin's `configureServer` middleware and add a check for `/status` paths. Rename the plugin to `spa-routes` since it now handles more than just `/doc`:

```typescript
    {
      name: 'spa-routes',
      configureServer(server) {
        server.middlewares.use((req, _res, next) => {
          if (req.url === '/doc' || req.url === '/doc/') {
            req.url = '/doc/index.html'
          }
          if (req.url?.startsWith('/status')) {
            req.url = '/index.html'
          }
          next()
        })
      },
    },
```

- [ ] **Step 2: Verify dev server starts**

Run: `cd /Users/longye/AgentRun/pulse && pnpm typecheck`
Expected: PASS

- [ ] **Step 3: Commit**

```bash
git add packages/web/vite.config.ts
```
```bash
git commit -m "feat: add /status* SPA fallback in Vite dev server"
```

---

### Task 3: Add Status Page i18n Keys

**Files:**
- Modify: `packages/web/src/App.tsx:25-420` (the `msg` object, both `en` and `zh` sections)

- [ ] **Step 1: Add i18n entries for the status page**

Add these keys at the end of `msg.en` (before the closing `}`):

```typescript
    // status page
    statusPageTitle: 'Service Status',
    allOperational: 'All Systems Operational',
    partialOutage: 'Partial System Outage',
    majorOutage: 'Major System Outage',
    underMaintenance: 'Scheduled Maintenance',
    statusUptime: 'Uptime',
    statusProtocol: 'Protocol',
    statusAddress: 'Address',
    poweredBy: 'Powered by Pulse',
    subscribe: 'Subscribe',
    dayDowntime: 'Downtime',
    dayAvgLatency: 'Avg Latency',
    noDowntime: 'No downtime',
    statusDays: '{n}-Day',
```

Add matching keys at the end of `msg.zh`:

```typescript
    // status page
    statusPageTitle: '服务状态',
    allOperational: '所有系统正常运行',
    partialOutage: '部分系统异常',
    majorOutage: '严重系统故障',
    underMaintenance: '计划维护中',
    statusUptime: '可用率',
    statusProtocol: '协议',
    statusAddress: '地址',
    poweredBy: 'Powered by Pulse',
    subscribe: '订阅',
    dayDowntime: '宕机时长',
    dayAvgLatency: '平均延迟',
    noDowntime: '无宕机',
    statusDays: '{n} 天',
```

- [ ] **Step 2: Verify typecheck passes**

Run: `cd /Users/longye/AgentRun/pulse && pnpm typecheck`
Expected: PASS

- [ ] **Step 3: Commit**

```bash
git add packages/web/src/App.tsx
```
```bash
git commit -m "feat: add status page i18n keys (en + zh)"
```

---

### Task 4: Create StatusPage Component

**Files:**
- Create: `packages/web/src/StatusPage.tsx`

This is the main deliverable. The component receives the full service list and renders a status.claude.com-style page.

- [ ] **Step 1: Create `packages/web/src/StatusPage.tsx`**

The component needs:
- Props: `{ services, projectName, theme, lang }` — receives mock data from App
- Import `useApp` context from App for theme/i18n access
- Light background (#FAF9F5 light / dark theme base), single column, max-width ~900px centered

**Layout structure:**

```
┌─────────────────────────────────────────┐
│  [Project Name]            [Subscribe]  │  ← Header
├─────────────────────────────────────────┤
│  ● All Systems Operational              │  ← Status banner (green/yellow/red bg)
├─────────────────────────────────────────┤
│  Service Name        protocol  address  │
│  ████████████████████████████  99.97%   │  ← 90-day bar + uptime %
│                                         │
│  Service Name        protocol  address  │
│  ████████████████████████████  99.94%   │
│  ...                                    │
├─────────────────────────────────────────┤
│         Powered by Pulse                │  ← Footer
└─────────────────────────────────────────┘
```

Write the full component:

```tsx
import { useCallback, useMemo, useState } from 'react'

// Re-export context hook — imported by App.tsx indirection
// We'll receive context via props instead to keep this file independent

const F = {
  mono: "'JetBrains Mono','SF Mono',monospace",
  sans: "'DM Sans',-apple-system,sans-serif",
  display: "'Space Grotesk','DM Sans',sans-serif",
}

interface BarDay {
  date: string
  status: string
  uptime: number
}

interface LdPoint {
  v: number
  p95: number
}

interface StatusService {
  id: string
  name: string
  nameZh: string
  type: string
  status: string
  sla: number
  target: number
  latency: number
  bar: BarDay[]
  ld: LdPoint[]
  maintenance: boolean
  interval: string
}

interface StatusPageProps {
  services: StatusService[]
  projectName: string
  t: Record<string, unknown> // theme object from App
  i18n: Record<string, string>
  lang: string
}

// Status banner logic
function getOverallStatus(services: StatusService[]) {
  const hasDown = services.some((s) => s.status === 'down')
  const hasDegraded = services.some((s) => s.status === 'degraded')
  const hasMaintenance = services.some((s) => s.status === 'maintenance')
  if (hasDown) return 'major'
  if (hasDegraded) return 'partial'
  if (hasMaintenance) return 'maintenance'
  return 'operational'
}

function StatusBanner({
  status,
  i18n,
  t,
}: { status: string; i18n: Record<string, string>; t: Record<string, unknown> }) {
  const bannerConfig = {
    operational: {
      bg: (t as { status: { up: string } }).status.up,
      text: '#fff',
      label: i18n.allOperational,
    },
    partial: {
      bg: (t as { status: { degraded: string } }).status.degraded,
      text: '#fff',
      label: i18n.partialOutage,
    },
    major: {
      bg: (t as { status: { down: string } }).status.down,
      text: '#fff',
      label: i18n.majorOutage,
    },
    maintenance: {
      bg: (t as { status: { maintenance: string } }).status.maintenance,
      text: '#fff',
      label: i18n.underMaintenance,
    },
  }
  const cfg = bannerConfig[status] || bannerConfig.operational
  return (
    <div
      style={{
        backgroundColor: cfg.bg,
        color: cfg.text,
        padding: '16px 24px',
        borderRadius: 12,
        fontSize: 15,
        fontWeight: 600,
        fontFamily: F.sans,
        display: 'flex',
        alignItems: 'center',
        gap: 10,
        marginBottom: 24,
      }}
    >
      <span
        style={{
          width: 10,
          height: 10,
          borderRadius: '50%',
          backgroundColor: '#fff',
          flexShrink: 0,
        }}
      />
      {cfg.label}
    </div>
  )
}

// Day detail popover for a single bar
function DayPopover({
  day,
  position,
  i18n,
  t,
  ld,
  dayIndex,
}: {
  day: BarDay
  position: { left: number; top: number }
  i18n: Record<string, string>
  t: Record<string, unknown>
  ld: LdPoint[]
  dayIndex: number
}) {
  const theme = t as {
    bg: { card: string; elevated: string }
    border: string
    text: { primary: string; secondary: string; muted: string }
    status: Record<string, string>
    shadow: string
  }

  const downMinutes = day.uptime < 100 ? Math.round((100 - day.uptime) * 14.4) : 0
  const downtimeStr =
    downMinutes === 0
      ? i18n.noDowntime
      : downMinutes >= 60
        ? `${Math.floor(downMinutes / 60)}h ${downMinutes % 60}m`
        : `${downMinutes}m`

  // Map bar index to approximate ld index (ld has 72 points for ~3 days of hourly data, bar has 90/100 days)
  // For simplicity, use the latency from the ld array proportionally
  const ldIdx = ld.length > 0 ? Math.min(Math.floor((dayIndex / 90) * ld.length), ld.length - 1) : 0
  const avgLat = ld.length > 0 ? ld[ldIdx].v : 0

  return (
    <div
      style={{
        position: 'fixed',
        left: position.left,
        top: position.top,
        transform: 'translate(-50%, -100%)',
        marginTop: -8,
        padding: '10px 14px',
        borderRadius: 8,
        backgroundColor: theme.bg.card,
        border: `1px solid ${theme.border}`,
        boxShadow: '0 4px 16px rgba(0,0,0,.25)',
        fontSize: 12,
        fontFamily: F.sans,
        color: theme.text.primary,
        zIndex: 9999,
        pointerEvents: 'none',
        minWidth: 160,
      }}
    >
      <div
        style={{
          fontWeight: 600,
          marginBottom: 6,
          fontFamily: F.mono,
          fontSize: 11,
          display: 'flex',
          alignItems: 'center',
          gap: 6,
        }}
      >
        <span
          style={{
            width: 6,
            height: 6,
            borderRadius: '50%',
            backgroundColor: theme.status[day.status] || theme.status.up,
          }}
        />
        {day.date}
      </div>
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'auto 1fr',
          gap: '3px 12px',
          fontSize: 11,
          color: theme.text.secondary,
        }}
      >
        <span>{i18n.statusUptime}</span>
        <span style={{ fontFamily: F.mono, textAlign: 'right' }}>{day.uptime.toFixed(2)}%</span>
        <span>{i18n.dayDowntime}</span>
        <span style={{ fontFamily: F.mono, textAlign: 'right' }}>{downtimeStr}</span>
        <span>{i18n.dayAvgLatency}</span>
        <span style={{ fontFamily: F.mono, textAlign: 'right' }}>{avgLat}ms</span>
      </div>
    </div>
  )
}

// 90-day uptime bar for status page — shows date popover on click/hover
function StatusUptimeBar({
  data,
  ld,
  i18n,
  t,
}: { data: BarDay[]; ld: LdPoint[]; i18n: Record<string, string>; t: Record<string, unknown> }) {
  const theme = t as { status: Record<string, string> }
  const [activeDay, setActiveDay] = useState<{
    idx: number
    rect: { left: number; top: number }
  } | null>(null)

  const handleBarClick = useCallback(
    (idx: number, e: React.MouseEvent) => {
      const rect = (e.target as HTMLElement).getBoundingClientRect()
      if (activeDay?.idx === idx) {
        setActiveDay(null)
      } else {
        setActiveDay({ idx, rect: { left: rect.left + rect.width / 2, top: rect.top } })
      }
    },
    [activeDay],
  )

  return (
    <div style={{ position: 'relative' }}>
      <div
        style={{
          display: 'flex',
          gap: 1.5,
          alignItems: 'stretch',
          height: 32,
          width: '100%',
          minWidth: 0,
          overflow: 'hidden',
        }}
      >
        {data.map((d, i) => {
          const c = theme.status[d.status] || theme.status.up
          const isActive = activeDay?.idx === i
          return (
            <div
              key={`sbar-${d.date}`}
              role="button"
              tabIndex={0}
              onClick={(e) => handleBarClick(i, e)}
              onKeyDown={(e) => {
                if (e.key === 'Enter' || e.key === ' ') handleBarClick(i, e as unknown as React.MouseEvent)
              }}
              style={{
                flex: 1,
                backgroundColor: c,
                borderRadius: 2,
                opacity: isActive ? 1 : 0.75,
                transition: 'opacity .12s',
                cursor: 'pointer',
                minWidth: 0,
              }}
            />
          )
        })}
      </div>
      {activeDay && data[activeDay.idx] && (
        <DayPopover
          day={data[activeDay.idx]}
          position={activeDay.rect}
          i18n={i18n}
          t={t}
          ld={ld}
          dayIndex={activeDay.idx}
        />
      )}
    </div>
  )
}

// Protocol badge
function ProtocolBadge({ type, t }: { type: string; t: Record<string, unknown> }) {
  const theme = t as { bg: { elevated: string }; text: { secondary: string } }
  const typeColors: Record<string, string> = {
    http: '#60a5fa',
    websocket: '#a78bfa',
    tcp: '#34d399',
    push: '#fbbf24',
  }
  return (
    <span
      style={{
        display: 'inline-flex',
        alignItems: 'center',
        padding: '2px 8px',
        fontSize: 11,
        fontWeight: 500,
        borderRadius: 6,
        color: typeColors[type] || theme.text.secondary,
        backgroundColor: `${typeColors[type] || theme.text.secondary}18`,
        fontFamily: F.mono,
        textTransform: 'uppercase',
        letterSpacing: '.03em',
      }}
    >
      {type}
    </span>
  )
}

// Main status page component
export default function StatusPage({ services, projectName, t, i18n, lang }: StatusPageProps) {
  const theme = t as {
    bg: { base: string; card: string; elevated: string }
    border: string
    text: { primary: string; secondary: string; muted: string }
    status: Record<string, string>
    shadow: string
    accent: string
  }
  const overallStatus = useMemo(() => getOverallStatus(services), [services])

  // Close popover when clicking outside
  const handleBgClick = useCallback(() => {
    // Each StatusUptimeBar manages its own popover state
  }, [])

  // Derive target/address from service type for display
  const getAddress = (svc: StatusService) => {
    // In real implementation this would come from the API
    const addresses: Record<string, string> = {
      'api-gw': 'api.example.com/health',
      'ws-broker': 'wss://ws.example.com/ping',
      auth: 'auth.example.com/health',
      order: 'order.internal:9090',
      pay: 'pay.example.com/health',
      search: 'search.internal:9200',
      cdn: 'cdn.example.com/probe',
      db: 'db-primary.internal:5432',
      'notif-hub': 'notify.example.com/health',
      cache: 'cache.internal:6379',
      'log-pipe': 'logs.example.com/health',
    }
    return addresses[svc.id] || `${svc.name.toLowerCase().replace(/\s+/g, '-')}.example.com`
  }

  return (
    <div onClick={handleBgClick} style={{ minHeight: '100vh', backgroundColor: theme.bg.base }}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=DM+Sans:wght@400;500;600;700&family=JetBrains+Mono:wght@400;500;600;700&family=Space+Grotesk:wght@500;600;700&display=swap');
        *{box-sizing:border-box;margin:0;padding:0}
        @media(max-width:640px){.status-svc-meta{flex-direction:column!important;align-items:flex-start!important;gap:4px!important}.status-svc-header{flex-direction:column!important;align-items:flex-start!important;gap:6px!important}.status-bar-row{flex-direction:column!important;gap:4px!important}.status-bar-row .status-uptime-pct{text-align:left!important}}
      `}</style>

      <div
        style={{
          maxWidth: 900,
          margin: '0 auto',
          padding: '40px 24px',
          fontFamily: F.sans,
          color: theme.text.primary,
        }}
      >
        {/* Header */}
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            marginBottom: 32,
          }}
        >
          <span
            style={{
              fontSize: 22,
              fontWeight: 700,
              fontFamily: F.display,
              letterSpacing: '-.02em',
            }}
          >
            {projectName}
          </span>
          <button
            type="button"
            disabled
            style={{
              padding: '8px 16px',
              borderRadius: 8,
              border: `1px solid ${theme.border}`,
              backgroundColor: 'transparent',
              color: theme.text.muted,
              fontSize: 13,
              fontFamily: F.sans,
              cursor: 'not-allowed',
              opacity: 0.5,
            }}
          >
            {i18n.subscribe}
          </button>
        </div>

        {/* Status Banner */}
        <StatusBanner status={overallStatus} i18n={i18n} t={t} />

        {/* Service List */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          {services.map((svc) => (
            <div
              key={svc.id}
              style={{
                backgroundColor: theme.bg.card,
                border: `1px solid ${theme.border}`,
                borderRadius: 12,
                padding: '16px 20px',
                boxShadow: theme.shadow,
              }}
            >
              {/* Service header row */}
              <div
                className="status-svc-header"
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  marginBottom: 10,
                }}
              >
                <div
                  className="status-svc-meta"
                  style={{ display: 'flex', alignItems: 'center', gap: 10 }}
                >
                  <span
                    style={{
                      width: 8,
                      height: 8,
                      borderRadius: '50%',
                      backgroundColor: theme.status[svc.status] || theme.status.up,
                      flexShrink: 0,
                    }}
                  />
                  <span
                    style={{
                      fontSize: 14,
                      fontWeight: 600,
                    }}
                  >
                    {lang === 'zh' ? svc.nameZh : svc.name}
                  </span>
                  <ProtocolBadge type={svc.type} t={t} />
                  <span
                    style={{
                      fontSize: 12,
                      color: theme.text.muted,
                      fontFamily: F.mono,
                    }}
                  >
                    {getAddress(svc)}
                  </span>
                </div>
              </div>

              {/* 90-day bar + uptime % */}
              <div
                className="status-bar-row"
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: 16,
                }}
              >
                <div style={{ flex: 1, minWidth: 0 }}>
                  <StatusUptimeBar data={svc.bar} ld={svc.ld} i18n={i18n} t={t} />
                </div>
                <span
                  className="status-uptime-pct"
                  style={{
                    fontSize: 14,
                    fontWeight: 600,
                    fontFamily: F.mono,
                    color:
                      svc.sla >= svc.target
                        ? theme.status.up
                        : svc.sla >= svc.target - 0.5
                          ? theme.status.degraded
                          : theme.status.down,
                    whiteSpace: 'nowrap',
                    textAlign: 'right',
                    minWidth: 64,
                  }}
                >
                  {svc.sla.toFixed(2)}%
                </span>
              </div>

              {/* Date range label */}
              <div
                style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  marginTop: 6,
                  fontSize: 11,
                  color: theme.text.muted,
                  fontFamily: F.mono,
                }}
              >
                <span>{i18n.statusDays.replace('{n}', '90')}</span>
                <span>{i18n.statusUptime}</span>
              </div>
            </div>
          ))}
        </div>

        {/* Footer */}
        <div
          style={{
            textAlign: 'center',
            marginTop: 48,
            paddingTop: 24,
            borderTop: `1px solid ${theme.border}`,
            fontSize: 12,
            color: theme.text.muted,
            fontFamily: F.sans,
          }}
        >
          {i18n.poweredBy}
        </div>
      </div>
    </div>
  )
}
```

- [ ] **Step 2: Verify typecheck**

Run: `cd /Users/longye/AgentRun/pulse && pnpm typecheck`
Expected: PASS

- [ ] **Step 3: Commit**

```bash
git add packages/web/src/StatusPage.tsx
```
```bash
git commit -m "feat: create StatusPage component with 90-day bars and day detail popovers"
```

---

### Task 5: Wire StatusPage into App via Pathname Routing

**Files:**
- Modify: `packages/web/src/App.tsx:5086-5230` (the `App` component's top-level rendering)

- [ ] **Step 1: Add StatusPage import and pathname detection in App**

At the top of `packages/web/src/App.tsx`, add the import:

```typescript
import StatusPage from './StatusPage'
```

In the `App` component (around line 5086), add pathname detection right after state declarations (after `const [timeRange, setTimeRange] = ...` around line 5131):

```typescript
  // Status page detection — check pathname before rendering admin UI
  const isStatusPage = window.location.pathname.startsWith('/status')
  const statusSlug = window.location.pathname.match(/^\/status\/(.+)/)?.[1] || null
```

Then in the JSX return, wrap the entire admin UI in a conditional. Right after `<AppCtx.Provider value={ctx}>`, before the main `<div>`:

```typescript
  return (
    <AppCtx.Provider value={ctx}>
      {isStatusPage ? (
        <StatusPage
          services={allSvcs.filter(s => !s.maintenance || s.status === 'maintenance')}
          projectName={projectName}
          t={t}
          i18n={i18n}
          lang={lang}
        />
      ) : (
        <div
          className={isPWA ? 'pwa-safe-top' : undefined}
          style={{
            minHeight: '100vh',
            // ... existing styles
          }}
        >
          {/* ... existing admin UI ... */}
        </div>
      )}
    </AppCtx.Provider>
  )
```

Pass all services (not filtered) to StatusPage — the status page shows everything.

- [ ] **Step 2: Verify typecheck**

Run: `cd /Users/longye/AgentRun/pulse && pnpm typecheck`
Expected: PASS

- [ ] **Step 3: Verify lint**

Run: `cd /Users/longye/AgentRun/pulse && pnpm lint`
Expected: PASS (fix any Biome issues)

- [ ] **Step 4: Commit**

```bash
git add packages/web/src/App.tsx
```
```bash
git commit -m "feat: wire StatusPage into App with pathname-based routing"
```

---

### Task 6: Go Backend — Add Public Status API + Status Page CRUD Stubs

**Files:**
- Modify: `packages/server/internal/api/server.go`
- Modify: `packages/server/internal/api/server_test.go`

- [ ] **Step 1: Add routes and handlers in server.go**

In `NewServer()`, add these routes after the existing Settings group:

```go
	// Status Pages (management — authenticated)
	v1.GET("/status-pages", listStatusPages)
	v1.POST("/status-pages", createStatusPage)
	v1.PUT("/status-pages/:id", updateStatusPage)
	v1.DELETE("/status-pages/:id", deleteStatusPage)

	// Public status (no auth required)
	v1.GET("/status/services", getPublicStatus)
	v1.GET("/status/:slug", getStatusBySlug)
```

Add the stub handlers:

```go
func listStatusPages(c echo.Context) error {
	return c.JSON(http.StatusOK, map[string]any{"data": []any{}, "total": 0})
}

func createStatusPage(c echo.Context) error {
	var req struct {
		Name       string   `json:"name"`
		Slug       string   `json:"slug"`
		ServiceIDs []string `json:"service_ids"`
	}
	if err := c.Bind(&req); err != nil || req.Name == "" || req.Slug == "" {
		return c.JSON(http.StatusBadRequest, map[string]any{
			"error": map[string]string{"code": "INVALID_REQUEST", "message": "name and slug are required"},
		})
	}
	return c.JSON(http.StatusCreated, map[string]any{
		"data": map[string]any{
			"id":          "sp-" + req.Slug,
			"name":        req.Name,
			"slug":        req.Slug,
			"service_ids": req.ServiceIDs,
			"created_at":  time.Now().UTC().Format(time.RFC3339),
		},
	})
}

func updateStatusPage(c echo.Context) error {
	id := c.Param("id")
	var req struct {
		Name       string   `json:"name"`
		Slug       string   `json:"slug"`
		ServiceIDs []string `json:"service_ids"`
	}
	if err := c.Bind(&req); err != nil {
		return c.JSON(http.StatusBadRequest, map[string]any{
			"error": map[string]string{"code": "INVALID_REQUEST", "message": "invalid request body"},
		})
	}
	return c.JSON(http.StatusOK, map[string]any{
		"data": map[string]any{
			"id":          id,
			"name":        req.Name,
			"slug":        req.Slug,
			"service_ids": req.ServiceIDs,
			"updated_at":  time.Now().UTC().Format(time.RFC3339),
		},
	})
}

func deleteStatusPage(c echo.Context) error {
	return c.JSON(http.StatusOK, map[string]any{"data": map[string]string{"status": "deleted"}})
}

func getPublicStatus(c echo.Context) error {
	return c.JSON(http.StatusOK, map[string]any{"data": []any{}, "total": 0})
}

func getStatusBySlug(c echo.Context) error {
	slug := c.Param("slug")
	return c.JSON(http.StatusOK, map[string]any{
		"data": map[string]any{
			"slug":     slug,
			"services": []any{},
		},
	})
}
```

- [ ] **Step 2: Add tests in server_test.go**

Add these test cases to the existing test function (or add a new test function):

```go
func TestStatusPageRoutes(t *testing.T) {
	e := NewServer()

	tests := []struct {
		name   string
		method string
		path   string
		body   string
		status int
	}{
		{"list status pages", http.MethodGet, "/api/v1/status-pages", "", http.StatusOK},
		{"create status page", http.MethodPost, "/api/v1/status-pages", `{"name":"Public","slug":"public","service_ids":["svc-1"]}`, http.StatusCreated},
		{"create status page missing fields", http.MethodPost, "/api/v1/status-pages", `{"name":""}`, http.StatusBadRequest},
		{"update status page", http.MethodPut, "/api/v1/status-pages/sp-1", `{"name":"Updated","slug":"updated"}`, http.StatusOK},
		{"delete status page", http.MethodDelete, "/api/v1/status-pages/sp-1", "", http.StatusOK},
		{"get public status", http.MethodGet, "/api/v1/status/services", "", http.StatusOK},
		{"get status by slug", http.MethodGet, "/api/v1/status/my-page", "", http.StatusOK},
	}

	for _, tc := range tests {
		t.Run(tc.name, func(t *testing.T) {
			var body io.Reader
			if tc.body != "" {
				body = strings.NewReader(tc.body)
			}
			req := httptest.NewRequest(tc.method, tc.path, body)
			if tc.body != "" {
				req.Header.Set("Content-Type", "application/json")
			}
			rec := httptest.NewRecorder()
			e.ServeHTTP(rec, req)
			if rec.Code != tc.status {
				t.Errorf("expected %d, got %d, body: %s", tc.status, rec.Code, rec.Body.String())
			}
		})
	}
}
```

Make sure to add `"strings"` to the import block if not already present.

- [ ] **Step 3: Run tests**

Run: `cd /Users/longye/AgentRun/pulse/packages/server && go test -v -count=1 ./...`
Expected: ALL PASS

- [ ] **Step 4: Commit**

```bash
git add packages/server/internal/api/server.go packages/server/internal/api/server_test.go
```
```bash
git commit -m "feat: add status page CRUD stubs and public status API endpoints"
```

---

### Task 7: Full Integration Verification

- [ ] **Step 1: Run full test suite**

Run: `cd /Users/longye/AgentRun/pulse && pnpm test`
Expected: All tests pass (web + server + probe)

- [ ] **Step 2: Run lint + typecheck**

Run: `cd /Users/longye/AgentRun/pulse && pnpm lint && pnpm typecheck`
Expected: PASS

- [ ] **Step 3: Visual verification**

Run: `cd /Users/longye/AgentRun/pulse && pnpm dev`
Then open `http://localhost:3000/status` in browser. Verify:
- Status banner shows correct aggregate status
- 11 hardcoded services are listed with correct status/SLA
- Clicking a day bar shows popover with downtime + latency
- Cache Layer shows as maintenance (blue) with 99.95% SLA
- Notification Hub shows as down (red) with 97.65% SLA
- Responsive: resize to mobile width, verify layout stacks

- [ ] **Step 4: Final commit with CI fix**

```bash
git add .github/workflows/ci.yml
```
```bash
git commit -m "chore: fix CI — add FORCE_JAVASCRIPT_ACTIONS_TO_NODE24, fix Go cache path"
```
