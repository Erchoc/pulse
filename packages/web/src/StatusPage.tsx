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
  status: { up: string; degraded: string; down: string; maintenance: string }
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
    /* quota exceeded */
  }
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
   DayPopover — shown when clicking a bar segment
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
    const bw = ref.current.offsetWidth
    const bh = ref.current.offsetHeight
    const vw = window.innerWidth
    const r = data.rect
    let left = r.left + r.width / 2 - bw / 2
    let top = r.top - bh - 8
    if (left < 8) left = 8
    if (left + bw > vw - 8) left = vw - bw - 8
    if (top < 8) top = r.bottom + 8
    setPos({ top, left })
  }, [data])

  const downMinutes = (100 - data.day.uptime) * 14.4
  const downtimeStr = formatDowntime(downMinutes, i18n.noDowntime)
  const dateStr = new Date(data.day.date).toLocaleDateString(lang === 'zh' ? 'zh-CN' : 'en-US', {
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
        borderRadius: 8,
        padding: '8px 12px',
        boxShadow: '0 8px 24px rgba(0,0,0,0.18)',
        minWidth: 170,
        fontFamily: F.sans,
        pointerEvents: 'none',
      }}
    >
      <div
        style={{
          fontSize: 11,
          fontWeight: 600,
          color: t.text.secondary,
          marginBottom: 6,
          fontFamily: F.display,
        }}
      >
        {dateStr}
      </div>
      {[
        {
          label: i18n.statusUptime,
          value: `${data.day.uptime.toFixed(2)}%`,
          color: statusColor(data.day.status, t),
        },
        { label: i18n.dayDowntime, value: downtimeStr, color: t.text.primary },
        {
          label: i18n.dayAvgLatency,
          value: data.avgLatency > 0 ? `${data.avgLatency}ms` : '—',
          color: t.text.primary,
        },
      ].map((row) => (
        <div
          key={row.label}
          style={{ display: 'flex', justifyContent: 'space-between', gap: 12, marginTop: 3 }}
        >
          <span style={{ fontSize: 11, color: t.text.muted }}>{row.label}</span>
          <span style={{ fontSize: 11, fontWeight: 600, color: row.color, fontFamily: F.mono }}>
            {row.value}
          </span>
        </div>
      ))}
    </div>
  )
}

/* ================================================================
   ServiceRow — compact single-row per service (status.claude.com style)
   ================================================================ */
function ServiceRow({
  svc,
  t,
  i18n,
  lang,
}: { svc: StatusService; t: Theme; i18n: I18n; lang: string }) {
  const [popover, setPopover] = useState<PopoverData | null>(null)
  const days = useMemo(() => svc.bar.slice(-STATUS_BAR_DAYS), [svc.bar])
  const address = addresses[svc.id] ?? `${svc.id}.example.com`
  const name = lang === 'zh' ? svc.nameZh : svc.name

  const handleBarClick = (day: BarDay, idx: number, e: React.MouseEvent) => {
    e.stopPropagation()
    const rect = (e.currentTarget as HTMLElement).getBoundingClientRect()
    const ldIdx = Math.floor((idx / days.length) * svc.ld.length)
    setPopover({ day, avgLatency: Math.round(svc.ld[ldIdx]?.v ?? 0), rect })
  }

  useEffect(() => {
    if (!popover) return
    const handler = () => setPopover(null)
    window.addEventListener('click', handler)
    return () => window.removeEventListener('click', handler)
  }, [popover])

  const slaColor =
    svc.sla >= svc.target
      ? t.status.up
      : svc.sla >= svc.target - 0.5
        ? t.status.degraded
        : t.status.down

  return (
    <div style={{ padding: '5px 0' }}>
      {/* Name row: dot + name + protocol + address */}
      <div
        className="sp-name-row"
        style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 3 }}
      >
        <span
          style={{
            width: 7,
            height: 7,
            borderRadius: '50%',
            background: statusColor(svc.status, t),
            flexShrink: 0,
          }}
        />
        <span style={{ fontWeight: 600, fontSize: 13, color: t.text.primary }}>{name}</span>
        <span
          style={{
            fontSize: 10,
            fontFamily: F.mono,
            fontWeight: 600,
            color: typeColors[svc.type] ?? t.text.muted,
            background: `${typeColors[svc.type] ?? t.text.muted}15`,
            borderRadius: 4,
            padding: '1px 5px',
            textTransform: 'uppercase',
            letterSpacing: '.03em',
          }}
        >
          {svc.type}
        </span>
        <span
          className="sp-address"
          style={{ fontSize: 11, fontFamily: F.mono, color: t.text.muted, marginLeft: 'auto' }}
        >
          {address}
        </span>
      </div>

      {/* Bar row: bars fill width, percentage at end */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
        <div
          style={{
            flex: 1,
            display: 'flex',
            alignItems: 'stretch',
            gap: 1,
            height: 18,
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
              onKeyDown={(e) => {
                if (e.key === 'Enter' || e.key === ' ')
                  handleBarClick(day, idx, e as unknown as React.MouseEvent)
                if (e.key === 'Escape') setPopover(null)
              }}
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
        <span
          style={{
            fontSize: 13,
            fontFamily: F.mono,
            fontWeight: 600,
            color: slaColor,
            flexShrink: 0,
            minWidth: 54,
            textAlign: 'right',
          }}
        >
          {svc.sla.toFixed(2)}%
        </span>
      </div>
      {popover && <DayPopover data={popover} t={t} i18n={i18n} lang={lang} />}
    </div>
  )
}

/* ================================================================
   StatusBanner — subtle, professional
   ================================================================ */
function StatusBanner({ overall, t, i18n }: { overall: string; t: Theme; i18n: I18n }) {
  const config: Record<string, { color: string; label: string }> = {
    operational: { color: t.status.up, label: i18n.allOperational },
    partial: { color: t.status.degraded, label: i18n.partialOutage },
    major: { color: t.status.down, label: i18n.majorOutage },
    maintenance: { color: t.status.maintenance, label: i18n.underMaintenance },
  }
  const { color, label } = config[overall] ?? config.operational

  return (
    <div
      style={{
        background: `${color}14`,
        border: `1px solid ${color}30`,
        borderRadius: 8,
        padding: '8px 16px',
        display: 'flex',
        alignItems: 'center',
        gap: 8,
        marginBottom: 10,
      }}
    >
      <span
        style={{
          width: 8,
          height: 8,
          borderRadius: '50%',
          background: color,
          flexShrink: 0,
          boxShadow: `0 0 6px ${color}60`,
        }}
      />
      <span style={{ fontFamily: F.sans, fontWeight: 600, fontSize: 13, color }}>{label}</span>
    </div>
  )
}

/* ================================================================
   StatusPage
   ================================================================ */
export default function StatusPage({ services, projectName, t, i18n, lang }: StatusPageProps) {
  useEffect(() => {
    setCachedServices(services)
  }, [services])

  const sortedServices = useMemo(() => [...services].sort((a, b) => a.sla - b.sla), [services])
  const overall = useMemo(() => getOverallStatus(sortedServices), [sortedServices])

  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=DM+Sans:wght@400;500;600&family=JetBrains+Mono:wght@400;600&family=Space+Grotesk:wght@500;600;700&display=swap');
        @media(max-width:640px) {
          .sp-address { display:none!important }
          .sp-name-row { flex-wrap:wrap!important }
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
        <div style={{ maxWidth: 860, margin: '0 auto', padding: '0 20px 24px' }}>
          {/* Header */}
          <header
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              padding: '16px 0',
              borderBottom: `1px solid ${t.border}`,
              marginBottom: 10,
            }}
          >
            <div>
              <h1
                style={{
                  fontFamily: F.display,
                  fontWeight: 700,
                  fontSize: 20,
                  margin: 0,
                  color: t.text.primary,
                }}
              >
                {projectName}
              </h1>
              <p style={{ margin: '2px 0 0', fontSize: 12, color: t.text.muted }}>
                {i18n.statusPageTitle}
              </p>
            </div>
            <button
              type="button"
              disabled
              style={{
                fontFamily: F.sans,
                fontSize: 12,
                fontWeight: 500,
                padding: '6px 14px',
                borderRadius: 6,
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

          {/* Service List — compact rows, no cards */}
          <div
            style={{
              background: t.bg.card,
              border: `1px solid ${t.border}`,
              borderRadius: 12,
              padding: '4px 16px',
              boxShadow: t.shadow,
            }}
          >
            {/* Range labels */}
            <div
              style={{
                display: 'flex',
                justifyContent: 'space-between',
                padding: '4px 0 0',
                fontSize: 10,
                color: t.text.muted,
                fontFamily: F.mono,
              }}
            >
              <span>{i18n.statusDays.replace('{n}', String(STATUS_BAR_DAYS))}</span>
              <span>{i18n.statusUptime}</span>
            </div>

            {sortedServices.map((svc, idx) => (
              <div key={svc.id}>
                {idx > 0 && <div style={{ height: 1, background: t.border, opacity: 0.5 }} />}
                <ServiceRow svc={svc} t={t} i18n={i18n} lang={lang} />
              </div>
            ))}
          </div>

          {/* Footer */}
          <footer
            style={{
              marginTop: 20,
              textAlign: 'center',
              fontSize: 11,
              color: t.text.muted,
              fontFamily: F.mono,
            }}
          >
            {i18n.poweredBy}
          </footer>
        </div>
      </div>
    </>
  )
}
