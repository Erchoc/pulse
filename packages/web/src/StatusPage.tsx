import { useEffect, useMemo, useRef, useState } from 'react'

/* ================================================================
   Fonts & constants
   ================================================================ */
const F = {
  mono: "'JetBrains Mono','SF Mono',monospace",
  sans: "'DM Sans',-apple-system,sans-serif",
  display: "'Space Grotesk','DM Sans',sans-serif",
}

const typeColors: Record<string, string> = {
  http: '#60a5fa',
  websocket: '#a78bfa',
  tcp: '#34d399',
  push: '#fbbf24',
}

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

const STATUS_BAR_DAYS = 90
const CACHE_KEY = 'pulse-status-cache'
const CACHE_TTL_MS = 5 * 60 * 1000

/* ================================================================
   Types
   ================================================================ */
interface BarDay {
  date: string
  status: string
  uptime: number
}

interface LdEntry {
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
  ld: LdEntry[]
  maintenance: boolean
  interval: string
}

interface Theme {
  bg: { base: string; card: string; elevated: string }
  border: string
  text: { primary: string; secondary: string; muted: string }
  status: {
    up: string
    degraded: string
    down: string
    maintenance: string
  }
  shadow: string
  accent: string
}

interface I18n {
  statusPageTitle: string
  allOperational: string
  partialOutage: string
  majorOutage: string
  underMaintenance: string
  statusUptime: string
  statusProtocol: string
  statusAddress: string
  poweredBy: string
  subscribe: string
  dayDowntime: string
  dayAvgLatency: string
  noDowntime: string
  statusDays: string
}

interface StatusPageProps {
  services: StatusService[]
  projectName: string
  t: Theme
  i18n: I18n
  lang: string
}

/* ================================================================
   Cache helpers — 5-minute browser-side cache
   ================================================================ */
function getCachedServices(): StatusService[] | null {
  try {
    const raw = sessionStorage.getItem(CACHE_KEY)
    if (!raw) return null
    const { ts, data } = JSON.parse(raw)
    if (Date.now() - ts > CACHE_TTL_MS) {
      sessionStorage.removeItem(CACHE_KEY)
      return null
    }
    return data
  } catch {
    return null
  }
}

function setCachedServices(services: StatusService[]) {
  try {
    sessionStorage.setItem(CACHE_KEY, JSON.stringify({ ts: Date.now(), data: services }))
  } catch {
    /* quota exceeded — ignore */
  }
}

/* ================================================================
   SVG Icons (replace emoji for consistent rendering)
   ================================================================ */
function CheckIcon() {
  return (
    <svg
      width="16"
      height="16"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="3"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <title>Operational</title>
      <polyline points="20 6 9 17 4 12" />
    </svg>
  )
}

function AlertIcon() {
  return (
    <svg
      width="16"
      height="16"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2.5"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <title>Degraded</title>
      <line x1="12" y1="9" x2="12" y2="13" />
      <line x1="12" y1="17" x2="12.01" y2="17" />
    </svg>
  )
}

function XIcon() {
  return (
    <svg
      width="16"
      height="16"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="3"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <title>Outage</title>
      <line x1="18" y1="6" x2="6" y2="18" />
      <line x1="6" y1="6" x2="18" y2="18" />
    </svg>
  )
}

function WrenchIcon() {
  return (
    <svg
      width="16"
      height="16"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2.5"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <title>Maintenance</title>
      <path d="M14.7 6.3a1 1 0 0 0 0 1.4l1.6 1.6a1 1 0 0 0 1.4 0l3.77-3.77a6 6 0 0 1-7.94 7.94l-6.91 6.91a2.12 2.12 0 0 1-3-3l6.91-6.91a6 6 0 0 1 7.94-7.94l-3.76 3.76z" />
    </svg>
  )
}

/* ================================================================
   Helpers
   ================================================================ */
function getOverallStatus(services: StatusService[]) {
  if (services.some((s) => s.status === 'down')) return 'major'
  if (services.some((s) => s.status === 'degraded')) return 'partial'
  if (services.some((s) => s.status === 'maintenance')) return 'maintenance'
  return 'operational'
}

function formatDowntime(minutes: number, noDowntimeLabel: string): string {
  if (minutes <= 0) return noDowntimeLabel
  if (minutes >= 60) {
    const h = Math.floor(minutes / 60)
    const m = Math.round(minutes % 60)
    return m > 0 ? `${h}h ${m}m` : `${h}h`
  }
  return `${Math.round(minutes)}m`
}

function statusColor(status: string, t: Theme): string {
  return t.status[status as keyof typeof t.status] ?? t.status.up
}

/* ================================================================
   DayPopover
   ================================================================ */
interface PopoverData {
  day: BarDay
  avgLatency: number
  rect: DOMRect
}

function DayPopover({
  data,
  t,
  i18n,
  lang,
}: { data: PopoverData; t: Theme; i18n: I18n; lang: string }) {
  const ref = useRef<HTMLDivElement>(null)
  const [pos, setPos] = useState({ top: 0, left: 0 })

  useEffect(() => {
    if (!ref.current) return
    const el = ref.current
    const bw = el.offsetWidth
    const bh = el.offsetHeight
    const vw = window.innerWidth
    const vh = window.innerHeight
    const r = data.rect

    let left = r.left + r.width / 2 - bw / 2
    let top = r.top - bh - 8

    if (left < 8) left = 8
    if (left + bw > vw - 8) left = vw - bw - 8
    if (top < 8) top = r.bottom + 8
    if (top + bh > vh - 8) top = vh - bh - 8

    setPos({ top, left })
  }, [data])

  const downMinutes = (100 - data.day.uptime) * 14.4
  const downtimeStr = formatDowntime(downMinutes, i18n.noDowntime)

  const dateObj = new Date(data.day.date)
  const dateStr = dateObj.toLocaleDateString(lang === 'zh' ? 'zh-CN' : 'en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  })

  return (
    <div
      ref={ref}
      style={{
        position: 'fixed',
        top: pos.top,
        left: pos.left,
        zIndex: 9999,
        background: t.bg.elevated,
        border: `1px solid ${t.border}`,
        borderRadius: 10,
        padding: '10px 14px',
        boxShadow: '0 8px 24px rgba(0,0,0,0.18)',
        minWidth: 180,
        fontFamily: F.sans,
        pointerEvents: 'none',
      }}
    >
      <div
        style={{
          fontSize: 12,
          fontWeight: 600,
          color: t.text.secondary,
          marginBottom: 8,
          fontFamily: F.display,
        }}
      >
        {dateStr}
      </div>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 5 }}>
        <div
          style={{
            display: 'flex',
            justifyContent: 'space-between',
            gap: 16,
          }}
        >
          <span style={{ fontSize: 12, color: t.text.muted }}>{i18n.statusUptime}</span>
          <span
            style={{
              fontSize: 12,
              fontWeight: 600,
              color: statusColor(data.day.status, t),
              fontFamily: F.mono,
            }}
          >
            {data.day.uptime.toFixed(2)}%
          </span>
        </div>
        <div
          style={{
            display: 'flex',
            justifyContent: 'space-between',
            gap: 16,
          }}
        >
          <span style={{ fontSize: 12, color: t.text.muted }}>{i18n.dayDowntime}</span>
          <span
            style={{
              fontSize: 12,
              fontWeight: 600,
              color: t.text.primary,
              fontFamily: F.mono,
            }}
          >
            {downtimeStr}
          </span>
        </div>
        <div
          style={{
            display: 'flex',
            justifyContent: 'space-between',
            gap: 16,
          }}
        >
          <span style={{ fontSize: 12, color: t.text.muted }}>{i18n.dayAvgLatency}</span>
          <span
            style={{
              fontSize: 12,
              fontWeight: 600,
              color: t.text.primary,
              fontFamily: F.mono,
            }}
          >
            {data.avgLatency > 0 ? `${data.avgLatency}ms` : '—'}
          </span>
        </div>
      </div>
    </div>
  )
}

/* ================================================================
   UptimeBar — flex layout, bars fill container naturally
   ================================================================ */
function UptimeBar({
  bar,
  ld,
  t,
  i18n,
  lang,
}: {
  bar: BarDay[]
  ld: LdEntry[]
  t: Theme
  i18n: I18n
  lang: string
}) {
  const [popover, setPopover] = useState<PopoverData | null>(null)

  // Take only last 90 days
  const days = useMemo(() => bar.slice(-STATUS_BAR_DAYS), [bar])

  const handleBarClick = (day: BarDay, idx: number, e: React.MouseEvent) => {
    e.stopPropagation()
    const rect = (e.currentTarget as HTMLElement).getBoundingClientRect()
    const ldIdx = Math.floor((idx / days.length) * ld.length)
    const avgLatency = ld[ldIdx]?.v ?? 0
    setPopover({ day, avgLatency: Math.round(avgLatency), rect })
  }

  const handleBarKeyDown = (day: BarDay, idx: number, e: React.KeyboardEvent) => {
    if (e.key === 'Enter' || e.key === ' ') {
      const rect = (e.currentTarget as HTMLElement).getBoundingClientRect()
      const ldIdx = Math.floor((idx / days.length) * ld.length)
      const avgLatency = ld[ldIdx]?.v ?? 0
      setPopover({ day, avgLatency: Math.round(avgLatency), rect })
    }
    if (e.key === 'Escape') setPopover(null)
  }

  useEffect(() => {
    if (!popover) return
    const handler = () => setPopover(null)
    window.addEventListener('click', handler)
    return () => window.removeEventListener('click', handler)
  }, [popover])

  return (
    <>
      <div
        style={{
          display: 'flex',
          alignItems: 'stretch',
          gap: 1.5,
          height: 32,
          width: '100%',
          minWidth: 0,
        }}
      >
        {days.map((day, idx) => (
          <div
            key={day.date}
            role="button"
            tabIndex={0}
            title={day.date}
            onClick={(e) => handleBarClick(day, idx, e)}
            onKeyDown={(e) => handleBarKeyDown(day, idx, e)}
            style={{
              flex: 1,
              minWidth: 0,
              background: statusColor(day.status, t),
              borderRadius: 2,
              cursor: 'pointer',
              opacity: 0.8,
              transition: 'opacity 0.1s',
            }}
            onMouseEnter={(e) => {
              ;(e.currentTarget as HTMLElement).style.opacity = '1'
            }}
            onMouseLeave={(e) => {
              ;(e.currentTarget as HTMLElement).style.opacity = '0.8'
            }}
          />
        ))}
      </div>
      {popover && <DayPopover data={popover} t={t} i18n={i18n} lang={lang} />}
    </>
  )
}

/* ================================================================
   ServiceCard
   ================================================================ */
function ServiceCard({
  svc,
  t,
  i18n,
  lang,
}: {
  svc: StatusService
  t: Theme
  i18n: I18n
  lang: string
}) {
  const address = addresses[svc.id] ?? `${svc.id}.example.com`
  const name = lang === 'zh' ? svc.nameZh : svc.name

  return (
    <div
      style={{
        background: t.bg.card,
        border: `1px solid ${t.border}`,
        borderRadius: 12,
        padding: '16px 20px',
        boxShadow: t.shadow,
      }}
    >
      {/* Header row */}
      <div
        className="status-svc-header"
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          marginBottom: 12,
          gap: 8,
        }}
      >
        {/* Left: dot + name */}
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: 8,
            minWidth: 0,
          }}
        >
          <span
            style={{
              width: 9,
              height: 9,
              borderRadius: '50%',
              background: statusColor(svc.status, t),
              flexShrink: 0,
              display: 'inline-block',
            }}
          />
          <span
            style={{
              fontFamily: F.display,
              fontWeight: 600,
              fontSize: 15,
              color: t.text.primary,
              overflow: 'hidden',
              textOverflow: 'ellipsis',
              whiteSpace: 'nowrap',
            }}
          >
            {name}
          </span>
        </div>

        {/* Right: meta badges */}
        <div
          className="status-svc-meta"
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: 8,
            flexShrink: 0,
          }}
        >
          <span
            style={{
              fontSize: 11,
              fontFamily: F.mono,
              fontWeight: 600,
              color: typeColors[svc.type] ?? t.text.muted,
              background: `${typeColors[svc.type] ?? t.text.muted}18`,
              border: `1px solid ${typeColors[svc.type] ?? t.text.muted}40`,
              borderRadius: 5,
              padding: '2px 7px',
              letterSpacing: '0.02em',
              textTransform: 'uppercase',
            }}
          >
            {svc.type}
          </span>
          <span
            className="status-address"
            style={{
              fontSize: 12,
              fontFamily: F.mono,
              color: t.text.secondary,
              overflow: 'hidden',
              textOverflow: 'ellipsis',
              whiteSpace: 'nowrap',
              maxWidth: 240,
            }}
          >
            {address}
          </span>
        </div>
      </div>

      {/* Bar row */}
      <div className="status-bar-row" style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
        <span
          className="status-days-label"
          style={{
            fontSize: 11,
            color: t.text.muted,
            fontFamily: F.mono,
            flexShrink: 0,
            minWidth: 36,
          }}
        >
          {i18n.statusDays.replace('{n}', String(STATUS_BAR_DAYS))}
        </span>

        <div style={{ flex: 1, overflow: 'hidden', minWidth: 0 }}>
          <UptimeBar bar={svc.bar} ld={svc.ld} t={t} i18n={i18n} lang={lang} />
        </div>

        <span
          className="status-uptime-pct"
          style={{
            fontSize: 13,
            fontFamily: F.mono,
            fontWeight: 600,
            color:
              svc.sla >= svc.target
                ? t.status.up
                : svc.sla >= svc.target - 0.5
                  ? t.status.degraded
                  : t.status.down,
            flexShrink: 0,
            minWidth: 56,
            textAlign: 'right',
          }}
        >
          {svc.sla.toFixed(2)}%
        </span>
        <span
          className="status-uptime-label"
          style={{ fontSize: 11, color: t.text.muted, flexShrink: 0 }}
        >
          {i18n.statusUptime}
        </span>
      </div>
    </div>
  )
}

/* ================================================================
   StatusBanner — SVG icons, clean design
   ================================================================ */
function StatusBanner({
  overall,
  t,
  i18n,
}: {
  overall: string
  t: Theme
  i18n: I18n
}) {
  const config: Record<string, { color: string; label: string; Icon: () => React.JSX.Element }> = {
    operational: { color: t.status.up, label: i18n.allOperational, Icon: CheckIcon },
    partial: { color: t.status.degraded, label: i18n.partialOutage, Icon: AlertIcon },
    major: { color: t.status.down, label: i18n.majorOutage, Icon: XIcon },
    maintenance: { color: t.status.maintenance, label: i18n.underMaintenance, Icon: WrenchIcon },
  }
  const { color, label, Icon } = config[overall] ?? config.operational

  return (
    <div
      style={{
        background: color,
        borderRadius: 12,
        padding: '14px 24px',
        display: 'flex',
        alignItems: 'center',
        gap: 12,
        marginBottom: 28,
      }}
    >
      <span
        style={{
          width: 28,
          height: 28,
          borderRadius: '50%',
          background: 'rgba(255,255,255,0.2)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          color: '#fff',
          flexShrink: 0,
        }}
      >
        <Icon />
      </span>
      <span
        style={{
          fontFamily: F.sans,
          fontWeight: 600,
          fontSize: 15,
          color: '#fff',
          letterSpacing: '0.01em',
        }}
      >
        {label}
      </span>
    </div>
  )
}

/* ================================================================
   StatusPage (default export)
   ================================================================ */
export default function StatusPage({ services, projectName, t, i18n, lang }: StatusPageProps) {
  // Cache services on mount
  useEffect(() => {
    setCachedServices(services)
  }, [services])

  // Sort by SLA ascending — worst availability first
  const sortedServices = useMemo(() => [...services].sort((a, b) => a.sla - b.sla), [services])

  const overall = useMemo(() => getOverallStatus(sortedServices), [sortedServices])

  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=DM+Sans:wght@400;500;600&family=JetBrains+Mono:wght@400;600&family=Space+Grotesk:wght@500;600;700&display=swap');

        @media(max-width:640px) {
          .status-svc-header { flex-direction:column!important; align-items:flex-start!important; gap:6px!important }
          .status-svc-meta { flex-direction:row!important; flex-wrap:wrap!important; gap:6px!important }
          .status-address { display:none!important }
          .status-bar-row { flex-wrap:wrap!important; gap:6px!important }
          .status-days-label { display:none!important }
          .status-uptime-label { display:none!important }
          .status-uptime-pct { order:1!important; font-size:12px!important; min-width:auto!important }
        }
      `}</style>

      <div
        style={{
          minHeight: '100vh',
          background: t.bg.base,
          fontFamily: F.sans,
          color: t.text.primary,
        }}
      >
        <div
          style={{
            maxWidth: 900,
            margin: '0 auto',
            padding: '0 20px 60px',
          }}
        >
          {/* Header */}
          <header
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              padding: '28px 0',
              borderBottom: `1px solid ${t.border}`,
              marginBottom: 32,
            }}
          >
            <div>
              <h1
                style={{
                  fontFamily: F.display,
                  fontWeight: 700,
                  fontSize: 22,
                  margin: 0,
                  color: t.text.primary,
                }}
              >
                {projectName}
              </h1>
              <p
                style={{
                  margin: '4px 0 0',
                  fontSize: 13,
                  color: t.text.muted,
                }}
              >
                {i18n.statusPageTitle}
              </p>
            </div>
            <button
              type="button"
              disabled
              style={{
                fontFamily: F.sans,
                fontSize: 13,
                fontWeight: 500,
                padding: '7px 16px',
                borderRadius: 8,
                border: `1px solid ${t.border}`,
                background: 'transparent',
                color: t.text.muted,
                cursor: 'not-allowed',
                opacity: 0.5,
              }}
            >
              {i18n.subscribe}
            </button>
          </header>

          {/* Status Banner */}
          <StatusBanner overall={overall} t={t} i18n={i18n} />

          {/* Service List — sorted by SLA asc (worst first) */}
          <div
            style={{
              display: 'flex',
              flexDirection: 'column',
              gap: 12,
            }}
          >
            {sortedServices.map((svc) => (
              <ServiceCard key={svc.id} svc={svc} t={t} i18n={i18n} lang={lang} />
            ))}
          </div>

          {/* Footer */}
          <footer
            style={{
              marginTop: 48,
              paddingTop: 20,
              borderTop: `1px solid ${t.border}`,
              textAlign: 'center',
              fontSize: 12,
              color: t.text.muted,
              fontFamily: F.mono,
            }}
          >
            <span>{i18n.poweredBy}</span>
          </footer>
        </div>
      </div>
    </>
  )
}
