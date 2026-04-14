import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState } from 'react'

/* ================================================================
   i18n
   ================================================================ */
const msg = {
  en: {
    brand: 'Pulse',
    tagline: 'SLA Monitoring',
    allProbes: 'All probes active',
    overview: 'Overview',
    probes: 'Probes',
    incidents: 'Incidents',
    settings: 'Settings',
    overallSLA: 'Overall SLA',
    servicesUp: 'Services Up',
    avgLatency: 'Avg Latency',
    probesSec: 'Probes/sec',
    breaching: '{n} breaching target',
    degradedDown: '{d} degraded · {x} down',
    p50All: 'p50 across all probes',
    servicesMixed: '{n} services × mixed intervals',
    all: 'All',
    operational: 'Operational',
    degraded: 'Degraded',
    down: 'Down',
    maintenance: 'Maintenance',
    service: 'Service',
    availability90: '90-Day Availability',
    sla: 'SLA',
    latency: 'Latency',
    status: 'Status',
    belowTarget: 'below target',
    target: 'target',
    selectHint: 'Select a service to view details',
    uptime90: 'Uptime (90d)',
    estDowntime: 'Est. Downtime/yr',
    avgLat: 'Avg Latency',
    responseTime: 'Response Time — 72h',
    availability: 'Availability — 90 Days',
    ago72: '72h ago',
    now: 'now',
    ago90: '90d ago',
    today: 'today',
    min: 'min',
    comingSoon: '— coming soon',
    advanced: 'Advanced',
    version: 'Pulse v0.1.0 · Go + React',
    day: 'Day',
    // probes
    serverProbes: 'Server-side Probes',
    clientProbes: 'Client-side Push',
    addProbe: 'Add Probe',
    probeName: 'Name',
    probeType: 'Type',
    probeUrl: 'Address',
    probeInterval: 'Interval',
    probeTimeout: 'Timeout',
    probeDesc: 'Description',
    edit: 'Edit',
    duplicate: 'Duplicate',
    delete: 'Delete',
    save: 'Save',
    cancel: 'Cancel',
    addNew: 'Add New Probe',
    editProbe: 'Edit Probe',
    duplicateProbe: 'Duplicate Probe',
    httpDesc: 'HTTP(S) Health Check',
    wsDesc: 'WebSocket Heartbeat',
    tcpDesc: 'TCP Port Probe',
    pushDesc: 'Client Push Heartbeat',
    confirmDelete: 'Are you sure you want to delete this probe?',
    confirm: 'Confirm',
    // settings
    projectName: 'Project Name',
    projectNameHint: 'Displayed in header and status page',
    dataRetention: 'Data Retention',
    dataRetentionHint:
      'How long raw probe data is kept. Older data is downsampled to hourly/daily aggregates.',
    slaWindow: 'SLA Reporting Period',
    slaWindowHint:
      'Rolling window for SLA calculation. The dashboard shows both the current window and the previous period for comparison.',
    slaTimezone: 'SLA Timezone',
    slaTimezoneHint: 'Defines period boundaries for SLA calculation.',
    webhookUrl: 'Webhook Notification URL',
    webhookHint: 'Sends POST requests when probe anomalies are detected',
    webhookLocalWarn:
      'localhost/127.0.0.1 is only reachable from the server host, not from external networks.',
    testWebhook: 'Test',
    webhookSuccess: 'Endpoint returned 200 — receiving normally',
    webhookFail: 'Endpoint did not return 200',
    webhookFailDetail: 'Endpoint returned HTTP {status} — expected 200',
    webhookFailNetwork: 'Could not reach endpoint — check that the URL is accessible',
    samplePayload: 'Request Body Example',
    payloadHint: 'POST request body sent by Pulse when a probe anomaly is detected',
    apiIntegration: 'API Integration',
    apiHint:
      'Use this API key to integrate with the Pulse REST API. Include it in the X-API-Key header for all requests. The API provides endpoints for querying probe status, SLA metrics, and managing probes programmatically.',
    apiKey: 'API Key',
    regenerate: 'Regenerate',
    regenerateConfirm:
      'A new API Key will be generated. The old key remains valid for 24 hours to allow migration.',
    regenerated: 'New key generated. Old key expires in 24h.',
    oldKey: 'Previous Key (valid 24h)',
    saveSettings: 'Save Settings',
    saving: 'Saving...',
    saved: 'Saved!',
    copied: 'Copied!',
    copy: 'Copy',
    r30d: '30 Days',
    r90d: '90 Days',
    r180d: '180 Days',
    r1y: '1 Year',
    r2y: '2 Years',
    w7d: 'Last 7 days',
    w30d: 'Last 30 days',
    w90d: 'Last 90 days',
    w180d: 'Last 180 days',
    w365d: 'Last 365 days',
  },
  zh: {
    brand: 'Pulse',
    tagline: 'SLA 可用性监控',
    allProbes: '所有探针正常运行',
    overview: '总览',
    probes: '探针',
    incidents: '事件',
    settings: '设置',
    overallSLA: '整体 SLA',
    servicesUp: '服务状态',
    avgLatency: '平均延迟',
    probesSec: '探测/秒',
    breaching: '{n} 个未达标',
    degradedDown: '{d} 个降级 · {x} 个宕机',
    p50All: '全部探针 p50',
    servicesMixed: '{n} 个服务 × 混合间隔',
    all: '全部',
    operational: '正常',
    degraded: '降级',
    down: '宕机',
    maintenance: '维护中',
    service: '服务',
    availability90: '90 天可用性',
    sla: 'SLA',
    latency: '延迟',
    status: '状态',
    belowTarget: '未达标',
    target: '目标',
    selectHint: '选择一个服务查看详情',
    uptime90: '可用率 (90天)',
    estDowntime: '预计年停机',
    avgLat: '平均延迟',
    responseTime: '响应时间 — 近 72 小时',
    availability: '可用性 — 近 90 天',
    ago72: '72小时前',
    now: '现在',
    ago90: '90天前',
    today: '今天',
    min: '分钟',
    comingSoon: '— 即将推出',
    advanced: '高级选项',
    version: 'Pulse v0.1.0 · Go + React',
    day: '第{n}天',
    serverProbes: '服务端探测',
    clientProbes: '客户端上报',
    addProbe: '添加探针',
    probeName: '名称',
    probeType: '类型',
    probeUrl: '地址',
    probeInterval: '间隔',
    probeTimeout: '超时',
    probeDesc: '描述',
    edit: '编辑',
    duplicate: '复制',
    delete: '删除',
    save: '保存',
    cancel: '取消',
    addNew: '添加探针',
    editProbe: '编辑探针',
    duplicateProbe: '复制探针',
    httpDesc: 'HTTP(S) 健康检查',
    wsDesc: 'WebSocket 心跳',
    tcpDesc: 'TCP 端口探测',
    pushDesc: '客户端推送心跳',
    confirmDelete: '确认删除该探针？',
    confirm: '确认',
    projectName: '项目名称',
    projectNameHint: '显示在顶部导航栏和状态页',
    dataRetention: '数据保留时长',
    dataRetentionHint: '原始探测数据的保留周期。超期数据会被降采样为小时/天粒度的聚合数据。',
    slaWindow: 'SLA 统计口径',
    slaWindowHint: 'SLA 计算的滚动窗口。仪表盘同时展示当前窗口与上一周期的对比数据。',
    slaTimezone: 'SLA 时区',
    slaTimezoneHint: '决定 SLA 统计周期的起止边界。',
    webhookUrl: 'Webhook 通知地址',
    webhookHint: '探测异常时会发送 POST 请求到此地址',
    webhookLocalWarn: 'localhost/127.0.0.1 仅服务器本机可达，外部网络无法接收通知。',
    testWebhook: '测试',
    webhookSuccess: '对端返回 200 — 接收正常',
    webhookFail: '对端未返回 200',
    webhookFailDetail: '对端返回 HTTP {status}，预期 200',
    webhookFailNetwork: '无法连接对端，请确认地址可达',
    samplePayload: '请求体示例',
    payloadHint: '探测异常时 Pulse 向此地址发送的 POST 请求体',
    apiIntegration: 'API 集成',
    apiHint:
      '使用此 API Key 对接 Pulse REST API。在所有请求的 X-API-Key 请求头中传入此密钥。API 提供探针状态查询、SLA 指标获取、探针管理等接口。',
    apiKey: 'API Key',
    regenerate: '重新生成',
    regenerateConfirm: 'API Key 将重新生成，旧密钥在 24 小时内仍然有效，便于迁移。',
    regenerated: '新密钥已生成，旧密钥 24 小时后失效。',
    oldKey: '旧密钥（24h 内有效）',
    saveSettings: '保存设置',
    saving: '保存中...',
    saved: '已保存！',
    copied: '已复制！',
    copy: '复制',
    r30d: '30 天',
    r90d: '90 天',
    r180d: '180 天',
    r1y: '1 年',
    r2y: '2 年',
    w7d: '近 7 天',
    w30d: '近 30 天',
    w90d: '近 90 天',
    w180d: '近 180 天',
    w365d: '近 365 天',
  },
}

/* ================================================================
   Themes
   ================================================================ */
const themes = {
  dark: {
    bg: {
      base: '#0f1117',
      card: '#161921',
      cardHover: '#1c1f2a',
      elevated: '#1e2130',
      input: '#12141c',
    },
    text: { primary: '#e2e4ed', secondary: '#8b8fa3', muted: '#5c6072', inverse: '#0f1117' },
    status: { up: '#34d399', degraded: '#fbbf24', down: '#f87171', maintenance: '#818cf8' },
    accent: '#6366f1',
    accentMuted: 'rgba(99,102,241,0.12)',
    border: 'rgba(255,255,255,0.06)',
    borderSubtle: 'rgba(255,255,255,0.03)',
    shadow: '0 1px 3px rgba(0,0,0,0.4)',
    scrollThumb: 'rgba(255,255,255,0.08)',
  },
  light: {
    bg: {
      base: '#f8f9fc',
      card: '#ffffff',
      cardHover: '#f5f6fa',
      elevated: '#eef0f6',
      input: '#f1f3f9',
    },
    text: { primary: '#111827', secondary: '#4b5563', muted: '#9ca3af', inverse: '#ffffff' },
    status: { up: '#059669', degraded: '#d97706', down: '#dc2626', maintenance: '#4f46e5' },
    accent: '#4338ca',
    accentMuted: 'rgba(67,56,202,0.07)',
    border: 'rgba(0,0,0,0.09)',
    borderSubtle: 'rgba(0,0,0,0.05)',
    shadow: '0 1px 3px rgba(0,0,0,0.08), 0 1px 2px rgba(0,0,0,0.04)',
    scrollThumb: 'rgba(0,0,0,0.15)',
  },
}
const F = {
  mono: "'JetBrains Mono','SF Mono',monospace",
  sans: "'DM Sans',-apple-system,sans-serif",
  display: "'Space Grotesk','DM Sans',sans-serif",
}
const R = { sm: '8px', md: '12px', lg: '16px' }
const typeColors = { http: '#60a5fa', websocket: '#a78bfa', tcp: '#34d399', push: '#fbbf24' }

/* ================================================================
   Context
   ================================================================ */
interface AppContextValue {
  t: (typeof themes)['dark']
  i18n: (typeof msg)['en']
  lang: string
  theme: string
}
const AppCtx = createContext<AppContextValue | null>(null)
const useApp = () => useContext(AppCtx) as AppContextValue

/* ================================================================
   Mock Data
   ================================================================ */
const genBar = (n = 90) =>
  Array.from({ length: n }, () => {
    const r = Math.random()
    return r > 0.97 ? 'down' : r > 0.93 ? 'degraded' : 'up'
  })
const genLd = (n = 72) => {
  let b = 45
  return Array.from({ length: n }, () => {
    b += (Math.random() - 0.5) * 15
    b = Math.max(12, Math.min(180, b))
    return { v: Math.round(b), p95: Math.round(b * 1.4 + Math.random() * 20) }
  })
}

const initProbes = [
  {
    id: 'p1',
    name: 'prod-api-health',
    type: 'http',
    url: 'https://api.example.com/health',
    interval: '10s',
    timeout: '5s',
    desc: 'http',
    mode: 'server',
    status: 'up',
  },
  {
    id: 'p2',
    name: 'ws-ping-pong',
    type: 'websocket',
    url: 'wss://ws.example.com/ping',
    interval: '10s',
    timeout: '3s',
    desc: 'websocket',
    mode: 'server',
    status: 'up',
  },
  {
    id: 'p3',
    name: 'db-tcp-check',
    type: 'tcp',
    url: 'db-primary.internal:5432',
    interval: '10s',
    timeout: '2s',
    desc: 'tcp',
    mode: 'server',
    status: 'up',
  },
  {
    id: 'p4',
    name: 'cdn-edge-check',
    type: 'http',
    url: 'https://cdn.example.com/probe',
    interval: '60s',
    timeout: '10s',
    desc: 'http',
    mode: 'server',
    status: 'up',
  },
  {
    id: 'p5',
    name: 'search-health',
    type: 'http',
    url: 'search.internal:9200/_cluster/health',
    interval: '30s',
    timeout: '5s',
    desc: 'http',
    mode: 'server',
    status: 'down',
  },
  {
    id: 'p6',
    name: 'mobile-heartbeat',
    type: 'push',
    url: '—',
    interval: '30s',
    timeout: '60s',
    desc: 'push',
    mode: 'client',
    status: 'up',
  },
  {
    id: 'p7',
    name: 'h5-heartbeat',
    type: 'push',
    url: '—',
    interval: '60s',
    timeout: '120s',
    desc: 'push',
    mode: 'client',
    status: 'up',
  },
]

const initSvcs = [
  {
    id: 'api-gw',
    name: 'API Gateway',
    nameZh: 'API 网关',
    group: 'Core',
    type: 'http',
    interval: '10s',
    sla: 99.97,
    target: 99.95,
    latency: 34,
    status: 'up',
    bar: genBar(),
    ld: genLd(),
  },
  {
    id: 'ws-broker',
    name: 'WebSocket Broker',
    nameZh: 'WebSocket 代理',
    group: 'Core',
    type: 'websocket',
    interval: '10s',
    sla: 99.94,
    target: 99.9,
    latency: 12,
    status: 'up',
    bar: genBar(),
    ld: genLd(),
  },
  {
    id: 'auth',
    name: 'Auth Service',
    nameZh: '认证服务',
    group: 'Core',
    type: 'http',
    interval: '30s',
    sla: 99.99,
    target: 99.95,
    latency: 28,
    status: 'up',
    bar: genBar(),
    ld: genLd(),
  },
  {
    id: 'order',
    name: 'Order Engine',
    nameZh: '订单引擎',
    group: 'Business',
    type: 'tcp',
    interval: '10s',
    sla: 99.82,
    target: 99.9,
    latency: 67,
    status: 'degraded',
    bar: genBar(),
    ld: genLd(),
  },
  {
    id: 'pay',
    name: 'Payment Gateway',
    nameZh: '支付网关',
    group: 'Business',
    type: 'http',
    interval: '15s',
    sla: 99.91,
    target: 99.95,
    latency: 89,
    status: 'up',
    bar: genBar(),
    ld: genLd(),
  },
  {
    id: 'search',
    name: 'Search Cluster',
    nameZh: '搜索集群',
    group: 'Infra',
    type: 'tcp',
    interval: '30s',
    sla: 98.72,
    target: 99.5,
    latency: 156,
    status: 'down',
    bar: genBar(),
    ld: genLd(),
  },
  {
    id: 'cdn',
    name: 'CDN Edge Nodes',
    nameZh: 'CDN 边缘节点',
    group: 'Infra',
    type: 'http',
    interval: '60s',
    sla: 99.98,
    target: 99.9,
    latency: 8,
    status: 'up',
    bar: genBar(),
    ld: genLd(),
  },
  {
    id: 'db',
    name: 'DB Primary',
    nameZh: '主库 RDS',
    group: 'Infra',
    type: 'tcp',
    interval: '10s',
    sla: 99.96,
    target: 99.95,
    latency: 5,
    status: 'up',
    bar: genBar(),
    ld: genLd(),
  },
]

/* ================================================================
   Helpers
   ================================================================ */
const fmtSLA = (v) => `${v.toFixed(2)}%`
const slaColor = (sla, tgt, t) =>
  sla >= tgt ? t.status.up : sla >= tgt - 0.5 ? t.status.degraded : t.status.down
const uid = () => `p${Date.now().toString(36)}${Math.random().toString(36).slice(2, 5)}`
const genApiKey = () =>
  `sk_${Array.from(
    { length: 32 },
    () => 'abcdefghijklmnopqrstuvwxyz0123456789'[Math.floor(Math.random() * 36)],
  ).join('')}`

/* ================================================================
   Shared UI atoms
   ================================================================ */
function StatusDot({ status, size = 8, pulse = true }) {
  const { t } = useApp()
  const c = t.status[status] || t.status.up
  return (
    <span
      style={{
        position: 'relative',
        display: 'inline-flex',
        alignItems: 'center',
        justifyContent: 'center',
        width: size + 8,
        height: size + 8,
      }}
    >
      {pulse && status === 'up' && (
        <span
          style={{
            position: 'absolute',
            width: size + 6,
            height: size + 6,
            borderRadius: '50%',
            backgroundColor: c,
            opacity: 0.3,
            animation: 'pulse-ring 2s ease-out infinite',
          }}
        />
      )}
      {status === 'down' && (
        <span
          style={{
            position: 'absolute',
            width: size + 6,
            height: size + 6,
            borderRadius: '50%',
            backgroundColor: c,
            opacity: 0.3,
            animation: 'pulse-ring 1.2s ease-out infinite',
          }}
        />
      )}
      <span
        style={{
          position: 'relative',
          width: size,
          height: size,
          borderRadius: '50%',
          backgroundColor: c,
          boxShadow: `0 0 ${size}px ${c}`,
        }}
      />
    </span>
  )
}

function Badge({
  children,
  color,
  bg,
}: { children: React.ReactNode; color?: string; bg?: string }) {
  const { t } = useApp()
  return (
    <span
      style={{
        display: 'inline-flex',
        alignItems: 'center',
        padding: '2px 8px',
        fontSize: 11,
        fontWeight: 500,
        borderRadius: 6,
        color: color || t.text.secondary,
        backgroundColor: bg || t.bg.elevated,
        letterSpacing: '.02em',
        fontFamily: F.mono,
      }}
    >
      {children}
    </span>
  )
}

function Btn({
  children,
  onClick,
  variant = 'default',
  loading = false,
  small = false,
  disabled = false,
  style: sx = {},
}) {
  const { t } = useApp()
  const styles = {
    primary: { backgroundColor: t.accent, color: '#fff', border: 'none' },
    danger: {
      backgroundColor: 'transparent',
      color: t.status.down,
      border: `1px solid ${t.status.down}44`,
    },
    default: {
      backgroundColor: t.bg.elevated,
      color: t.text.secondary,
      border: `1px solid ${t.border}`,
    },
    ghost: { backgroundColor: 'transparent', color: t.text.muted, border: `1px solid ${t.border}` },
  }
  return (
    <button
      type="button"
      onClick={disabled || loading ? undefined : onClick}
      disabled={disabled || loading}
      style={{
        ...styles[variant],
        borderRadius: 8,
        padding: small ? '4px 10px' : '8px 16px',
        fontSize: small ? 11 : 13,
        fontWeight: 500,
        cursor: disabled || loading ? 'not-allowed' : 'pointer',
        fontFamily: F.sans,
        transition: 'all .15s',
        opacity: disabled ? 0.5 : 1,
        display: 'inline-flex',
        alignItems: 'center',
        gap: 6,
        ...sx,
      }}
    >
      {loading && (
        <span
          style={{
            display: 'inline-block',
            width: 14,
            height: 14,
            border: '2px solid currentColor',
            borderTopColor: 'transparent',
            borderRadius: '50%',
            animation: 'spin .6s linear infinite',
          }}
        />
      )}
      {children}
    </button>
  )
}

function Input({
  value,
  onChange,
  placeholder,
  style: sx = {},
}: {
  value: string
  onChange: (v: string) => void
  placeholder?: string
  style?: React.CSSProperties
}) {
  const { t } = useApp()
  return (
    <input
      value={value}
      onChange={(e) => onChange(e.target.value)}
      placeholder={placeholder}
      style={{
        width: '100%',
        padding: '8px 12px',
        backgroundColor: t.bg.input,
        border: `1px solid ${t.border}`,
        borderRadius: 8,
        color: t.text.primary,
        fontSize: 13,
        fontFamily: F.sans,
        outline: 'none',
        transition: 'border-color .2s',
        ...sx,
      }}
      onFocus={(e) => {
        e.target.style.borderColor = `${t.accent}66`
      }}
      onBlur={(e) => {
        e.target.style.borderColor = t.border
      }}
    />
  )
}

function Select({ value, onChange, options }) {
  const { t } = useApp()
  const [open, setOpen] = useState(false)
  const ref = useRef<HTMLDivElement>(null)
  const selected = options.find((o) => o.value === value)
  useEffect(() => {
    if (!open) return
    const h = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false)
    }
    document.addEventListener('mousedown', h)
    return () => document.removeEventListener('mousedown', h)
  }, [open])
  return (
    <div ref={ref} style={{ position: 'relative', display: 'inline-block' }}>
      <button
        type="button"
        onClick={() => setOpen(!open)}
        style={{
          padding: '8px 32px 8px 12px',
          backgroundColor: t.bg.input,
          border: `1px solid ${open ? `${t.accent}66` : t.border}`,
          borderRadius: 8,
          color: t.text.primary,
          fontSize: 13,
          fontFamily: F.sans,
          cursor: 'pointer',
          textAlign: 'left',
          minWidth: 160,
          transition: 'border-color .2s',
          position: 'relative',
        }}
      >
        {selected?.label || value}
        <span
          style={{
            position: 'absolute',
            right: 10,
            top: '50%',
            transform: `translateY(-50%) rotate(${open ? 180 : 0}deg)`,
            transition: 'transform .2s',
            fontSize: 10,
            color: t.text.muted,
          }}
        >
          ▼
        </span>
      </button>
      {open && (
        <div
          style={{
            position: 'absolute',
            top: 'calc(100% + 4px)',
            left: 0,
            minWidth: '100%',
            backgroundColor: t.bg.card,
            border: `1px solid ${t.border}`,
            borderRadius: 8,
            boxShadow: '0 8px 24px rgba(0,0,0,.3)',
            zIndex: 100,
            overflow: 'hidden',
            animation: 'fadeSlide .15s ease',
          }}
        >
          {options.map((o) => (
            <button
              type="button"
              key={o.value}
              onClick={() => {
                onChange(o.value)
                setOpen(false)
              }}
              style={{
                display: 'block',
                width: '100%',
                padding: '8px 12px',
                background: o.value === value ? t.accentMuted : 'transparent',
                border: 'none',
                color: o.value === value ? t.text.primary : t.text.secondary,
                fontSize: 13,
                fontFamily: F.sans,
                cursor: 'pointer',
                textAlign: 'left',
                transition: 'background .1s',
              }}
              onMouseEnter={(e) => {
                if (o.value !== value) e.currentTarget.style.background = t.bg.cardHover
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.background = o.value === value ? t.accentMuted : 'transparent'
              }}
            >
              {o.label}
            </button>
          ))}
        </div>
      )}
    </div>
  )
}

function ChipSelect({ value, onChange, options }) {
  const { t } = useApp()
  return (
    <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', marginTop: 10 }}>
      {options.map((o) => (
        <button
          type="button"
          key={o.value}
          onClick={() => onChange(o.value)}
          style={{
            padding: '6px 14px',
            borderRadius: 8,
            fontSize: 12,
            fontWeight: 500,
            cursor: 'pointer',
            fontFamily: F.sans,
            transition: 'all .15s',
            border: `1px solid ${o.value === value ? `${t.accent}55` : t.border}`,
            backgroundColor: o.value === value ? t.accentMuted : 'transparent',
            color: o.value === value ? t.text.primary : t.text.secondary,
          }}
        >
          {o.label}
        </button>
      ))}
    </div>
  )
}

/* ================================================================
   SLA Gauge
   ================================================================ */
function SLAGauge({ value, target, size = 96 }) {
  const { t, i18n } = useApp()
  const c = slaColor(value, target, t)
  const r = (size - 10) / 2
  const circ = 2 * Math.PI * r
  const dash = (value / 100) * circ * 0.75
  return (
    <div style={{ position: 'relative', width: size, height: size }}>
      <svg viewBox={`0 0 ${size} ${size}`} style={{ transform: 'rotate(135deg)' }}>
        <title>SLA Gauge</title>
        <circle
          cx={size / 2}
          cy={size / 2}
          r={r}
          fill="none"
          stroke={t.border}
          strokeWidth={5}
          strokeDasharray={`${circ * 0.75} ${circ * 0.25}`}
          strokeLinecap="round"
        />
        <circle
          cx={size / 2}
          cy={size / 2}
          r={r}
          fill="none"
          stroke={c}
          strokeWidth={5}
          strokeDasharray={`${dash} ${circ - dash}`}
          strokeLinecap="round"
          style={{ filter: `drop-shadow(0 0 6px ${c})`, transition: 'stroke-dasharray .8s ease' }}
        />
      </svg>
      <div
        style={{
          position: 'absolute',
          inset: 0,
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
        }}
      >
        <span
          style={{
            fontSize: size * 0.22,
            fontWeight: 700,
            color: c,
            fontFamily: F.mono,
            fontFeatureSettings: "'tnum'",
          }}
        >
          {fmtSLA(value)}
        </span>
        <span style={{ fontSize: size * 0.1, color: t.text.muted, marginTop: 2 }}>
          {i18n.target} {fmtSLA(target)}
        </span>
      </div>
    </div>
  )
}

/* ================================================================
   Uptime Bar
   ================================================================ */
function UptimeBar({ data, barHeight = 28 }) {
  const { t, i18n, lang } = useApp()
  const [hi, setHi] = useState(null)
  const label = (s) =>
    ({
      up: i18n.operational,
      degraded: i18n.degraded,
      down: i18n.down,
      maintenance: i18n.maintenance,
    })[s]
  return (
    <div
      style={{
        display: 'flex',
        gap: 1.5,
        alignItems: 'flex-end',
        height: barHeight,
        width: '100%',
        position: 'relative',
      }}
    >
      {data.map((s, i) => {
        const c = t.status[s] || t.status.up
        const h = hi === i
        return (
          <div
            key={`bar-${i}-${s}`}
            role="img"
            onMouseEnter={() => setHi(i)}
            onMouseLeave={() => setHi(null)}
            style={{
              flex: 1,
              height: h ? barHeight : s === 'up' ? barHeight * 0.7 : barHeight,
              backgroundColor: c,
              borderRadius: 2,
              opacity: h ? 1 : 0.7,
              transition: 'all .15s ease',
              cursor: 'pointer',
              minWidth: 2,
              boxShadow: h ? `0 0 8px ${c}` : 'none',
            }}
          />
        )
      })}
      {hi !== null && (
        <div
          style={{
            position: 'absolute',
            top: -34,
            left: `${(hi / data.length) * 100}%`,
            transform: 'translateX(-50%)',
            padding: '3px 10px',
            borderRadius: 6,
            fontSize: 11,
            fontFamily: F.mono,
            whiteSpace: 'nowrap',
            backgroundColor: t.bg.elevated,
            color: t.text.primary,
            border: `1px solid ${t.border}`,
            boxShadow: '0 4px 12px rgba(0,0,0,.3)',
            pointerEvents: 'none',
            zIndex: 10,
          }}
        >
          {lang === 'zh' ? `第${data.length - hi}天` : `Day ${data.length - hi}`} ·{' '}
          {label(data[hi])}
        </div>
      )}
    </div>
  )
}

/* ================================================================
   Mini Chart
   ================================================================ */
function MiniChart({ data, width = 200, chartHeight = 48, color }) {
  const { t } = useApp()
  const c = color || t.status.up
  const max = Math.max(...data.map((d) => d.p95))
  const min = Math.min(...data.map((d) => d.v))
  const range = max - min || 1
  const toY = (v) => chartHeight - 4 - ((v - min) / range) * (chartHeight - 8)
  const toX = (i) => (i / (data.length - 1)) * width
  const line = data.map((d, i) => `${i === 0 ? 'M' : 'L'}${toX(i)},${toY(d.v)}`).join(' ')
  const p95 = data.map((d, i) => `${i === 0 ? 'M' : 'L'}${toX(i)},${toY(d.p95)}`).join(' ')
  const area = `${line} L${width},${chartHeight} L0,${chartHeight} Z`
  const gid = `g-${c.replace('#', '')}`
  return (
    <svg viewBox={`0 0 ${width} ${chartHeight}`} style={{ width: '100%', height: chartHeight }}>
      <title>Latency Chart</title>
      <defs>
        <linearGradient id={gid} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor={c} stopOpacity=".15" />
          <stop offset="100%" stopColor={c} stopOpacity="0" />
        </linearGradient>
      </defs>
      <path d={area} fill={`url(#${gid})`} />
      <path d={p95} fill="none" stroke={c} strokeWidth="1" strokeDasharray="3,3" opacity=".3" />
      <path
        d={line}
        fill="none"
        stroke={c}
        strokeWidth="1.5"
        strokeLinejoin="round"
        strokeLinecap="round"
      />
      <circle
        cx={toX(data.length - 1)}
        cy={toY(data[data.length - 1].v)}
        r="2.5"
        fill={c}
        style={{ filter: `drop-shadow(0 0 3px ${c})` }}
      />
    </svg>
  )
}

/* ================================================================
   Modal
   ================================================================ */
function Modal({ open, onClose, title, children, width = 480 }) {
  const { t } = useApp()
  if (!open) return null
  return (
    <div
      role="presentation"
      style={{
        position: 'fixed',
        inset: 0,
        zIndex: 1000,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: 16,
      }}
      onClick={onClose}
      onKeyDown={(e) => {
        if (e.key === 'Escape') onClose()
      }}
    >
      <div
        style={{
          position: 'absolute',
          inset: 0,
          backgroundColor: 'rgba(0,0,0,.6)',
          backdropFilter: 'blur(4px)',
        }}
      />
      <div
        role="presentation"
        onClick={(e) => e.stopPropagation()}
        onKeyDown={(e) => e.stopPropagation()}
        style={{
          position: 'relative',
          backgroundColor: t.bg.card,
          borderRadius: R.lg,
          border: `1px solid ${t.border}`,
          boxShadow: '0 20px 60px rgba(0,0,0,.5)',
          width: '100%',
          maxWidth: width,
          maxHeight: '90vh',
          overflow: 'auto',
          animation: 'fadeSlide .2s ease',
        }}
      >
        <div
          style={{
            padding: '20px 24px 0',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
          }}
        >
          <h3 style={{ fontSize: 16, fontWeight: 700, color: t.text.primary, margin: 0 }}>
            {title}
          </h3>
          <button
            type="button"
            onClick={onClose}
            style={{
              background: 'none',
              border: 'none',
              color: t.text.muted,
              fontSize: 18,
              cursor: 'pointer',
              padding: 4,
            }}
          >
            ✕
          </button>
        </div>
        <div style={{ padding: 24 }}>{children}</div>
      </div>
    </div>
  )
}

/* ================================================================
   Toast
   ================================================================ */
function Toast({ message, visible }) {
  const { t } = useApp()
  if (!visible) return null
  return (
    <div
      style={{
        position: 'fixed',
        bottom: 24,
        left: '50%',
        transform: 'translateX(-50%)',
        padding: '10px 20px',
        borderRadius: 10,
        backgroundColor: t.accent,
        color: '#fff',
        fontSize: 13,
        fontWeight: 600,
        zIndex: 2000,
        boxShadow: '0 8px 24px rgba(0,0,0,.3)',
        animation: 'fadeSlide .25s ease',
        fontFamily: F.sans,
      }}
    >
      {message}
    </div>
  )
}

/* ================================================================
   Overview Cards
   ================================================================ */
function OverviewCards() {
  const { t, i18n } = useApp()
  const S = initSvcs
  const total = S.length
  const up = S.filter((s) => s.status === 'up').length
  const deg = S.filter((s) => s.status === 'degraded').length
  const dn = S.filter((s) => s.status === 'down').length
  const avg = S.reduce((a, s) => a + s.sla, 0) / total
  const avgLat = Math.round(S.reduce((a, s) => a + s.latency, 0) / total)
  const breach = S.filter((s) => s.sla < s.target).length
  const cards = [
    {
      label: i18n.overallSLA,
      value: fmtSLA(avg),
      sub: i18n.breaching.replace('{n}', String(breach)),
      color: breach > 0 ? t.status.degraded : t.status.up,
      icon: '◎',
    },
    {
      label: i18n.servicesUp,
      value: `${up}/${total}`,
      sub: i18n.degradedDown.replace('{d}', String(deg)).replace('{x}', String(dn)),
      color: dn > 0 ? t.status.down : t.status.up,
      icon: '△',
    },
    {
      label: i18n.avgLatency,
      value: `${avgLat}ms`,
      sub: i18n.p50All,
      color: avgLat > 100 ? t.status.degraded : t.status.up,
      icon: '⟡',
    },
    {
      label: i18n.probesSec,
      value: '126',
      sub: i18n.servicesMixed.replace('{n}', String(total)),
      color: t.accent,
      icon: '⬡',
    },
  ]
  return (
    <div
      style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit,minmax(200px,1fr))',
        gap: 12,
      }}
    >
      {cards.map((c) => (
        <div
          key={c.label}
          style={{
            backgroundColor: t.bg.card,
            borderRadius: R.md,
            padding: '20px 20px 18px',
            border: `1px solid ${t.border}`,
            position: 'relative',
            overflow: 'hidden',
            transition: 'border-color .2s,transform .2s',
            boxShadow: t.shadow,
            cursor: 'default',
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.borderColor = `${c.color}33`
            e.currentTarget.style.transform = 'translateY(-1px)'
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.borderColor = t.border
            e.currentTarget.style.transform = 'none'
          }}
        >
          <div
            style={{
              position: 'absolute',
              top: 14,
              right: 16,
              fontSize: 20,
              opacity: 0.12,
              color: c.color,
            }}
          >
            {c.icon}
          </div>
          <div
            style={{
              fontSize: 11,
              color: t.text.muted,
              fontWeight: 500,
              letterSpacing: '.04em',
              textTransform: 'uppercase',
              marginBottom: 8,
            }}
          >
            {c.label}
          </div>
          <div
            style={{
              fontSize: 28,
              fontWeight: 700,
              fontFamily: F.mono,
              color: c.color,
              fontFeatureSettings: "'tnum'",
              lineHeight: 1,
            }}
          >
            {c.value}
          </div>
          <div style={{ fontSize: 12, color: t.text.muted, marginTop: 6 }}>{c.sub}</div>
        </div>
      ))}
    </div>
  )
}

/* ================================================================
   Service Row & Detail Panel (FIXED height bug)
   ================================================================ */
function ServiceRow({ svc, selected, onSelect }) {
  const { t, i18n, lang } = useApp()
  const c = slaColor(svc.sla, svc.target, t)
  const label = {
    up: i18n.operational,
    degraded: i18n.degraded,
    down: i18n.down,
    maintenance: i18n.maintenance,
  }[svc.status]
  const [hov, setHov] = useState(false)
  const dn = lang === 'zh' ? svc.nameZh : svc.name
  return (
    // biome-ignore lint/a11y/useSemanticElements: grid layout requires div, not button
    <div
      role="button"
      tabIndex={0}
      onClick={() => onSelect(svc.id)}
      onKeyDown={(e) => {
        if (e.key === 'Enter' || e.key === ' ') onSelect(svc.id)
      }}
      onMouseEnter={() => setHov(true)}
      onMouseLeave={() => setHov(false)}
      style={{
        display: 'grid',
        gridTemplateColumns: 'minmax(140px,1.2fr) minmax(160px,2fr) 80px 70px 76px',
        alignItems: 'center',
        gap: 14,
        padding: '12px 20px',
        backgroundColor: selected ? t.accentMuted : hov ? t.bg.cardHover : 'transparent',
        borderRadius: R.sm,
        cursor: 'pointer',
        transition: 'background-color .15s',
        borderLeft: selected ? `2px solid ${t.accent}` : '2px solid transparent',
      }}
    >
      <div style={{ display: 'flex', alignItems: 'center', gap: 10, minWidth: 0 }}>
        <StatusDot status={svc.status} size={7} />
        <div style={{ minWidth: 0 }}>
          <div
            style={{
              fontSize: 13,
              fontWeight: 600,
              color: t.text.primary,
              whiteSpace: 'nowrap',
              overflow: 'hidden',
              textOverflow: 'ellipsis',
            }}
          >
            {dn}
          </div>
          <div style={{ display: 'flex', gap: 5, marginTop: 3 }}>
            <Badge color={typeColors[svc.type]} bg={`${typeColors[svc.type]}18`}>
              {svc.type}
            </Badge>
            <Badge>{svc.interval}</Badge>
          </div>
        </div>
      </div>
      <div className="hide-mobile" style={{ width: '100%' }}>
        <UptimeBar data={svc.bar} barHeight={20} />
      </div>
      <div
        style={{
          fontFamily: F.mono,
          fontWeight: 600,
          fontSize: 13,
          color: c,
          fontFeatureSettings: "'tnum'",
          textAlign: 'right',
        }}
      >
        {fmtSLA(svc.sla)}
        {svc.sla < svc.target && (
          <span style={{ display: 'block', fontSize: 10, color: t.status.down, fontWeight: 400 }}>
            {i18n.belowTarget}
          </span>
        )}
      </div>
      <div
        className="hide-mobile"
        style={{
          fontFamily: F.mono,
          fontSize: 12,
          color: svc.latency > 100 ? t.status.degraded : t.text.secondary,
          textAlign: 'right',
          fontFeatureSettings: "'tnum'",
        }}
      >
        {svc.latency}ms
      </div>
      <div style={{ textAlign: 'right' }}>
        <span
          style={{
            display: 'inline-block',
            padding: '3px 10px',
            borderRadius: 6,
            fontSize: 11,
            fontWeight: 600,
            color: t.status[svc.status],
            backgroundColor: `${t.status[svc.status]}14`,
          }}
        >
          {label}
        </span>
      </div>
    </div>
  )
}

function DetailPanel({ svc }) {
  const { t, i18n, lang } = useApp()
  if (!svc)
    return (
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          height: 420,
          color: t.text.muted,
          fontSize: 13,
          fontStyle: 'italic',
          padding: 40,
          textAlign: 'center',
        }}
      >
        {i18n.selectHint}
      </div>
    )
  const c = slaColor(svc.sla, svc.target, t)
  const downMin = (((100 - svc.sla) / 100) * 365 * 24 * 60).toFixed(0)
  const sl = {
    up: i18n.operational,
    degraded: i18n.degraded,
    down: i18n.down,
    maintenance: i18n.maintenance,
  }[svc.status]
  const dn = lang === 'zh' ? svc.nameZh : svc.name
  return (
    <div style={{ padding: 24, animation: 'fadeSlide .25s ease' }}>
      <div
        style={{
          display: 'flex',
          alignItems: 'flex-start',
          justifyContent: 'space-between',
          marginBottom: 24,
          flexWrap: 'wrap',
          gap: 16,
        }}
      >
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 6 }}>
            <StatusDot status={svc.status} size={9} />
            <h2 style={{ fontSize: 17, fontWeight: 700, color: t.text.primary, margin: 0 }}>
              {dn}
            </h2>
          </div>
          <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
            <Badge color={typeColors[svc.type]} bg={`${typeColors[svc.type]}18`}>
              {svc.type.toUpperCase()}
            </Badge>
            <Badge>{lang === 'zh' ? `每 ${svc.interval}` : `every ${svc.interval}`}</Badge>
            <Badge color={t.status[svc.status]} bg={`${t.status[svc.status]}14`}>
              {sl}
            </Badge>
          </div>
        </div>
        <SLAGauge value={svc.sla} target={svc.target} size={92} />
      </div>
      <div
        className="resp-cols"
        style={{
          display: 'grid',
          gridTemplateColumns: '1fr 1fr 1fr',
          gap: 10,
          marginBottom: 24,
          minWidth: 0,
        }}
      >
        {[
          { l: i18n.uptime90, v: fmtSLA(svc.sla), cl: c },
          {
            l: i18n.estDowntime,
            v: `${downMin} ${i18n.min}`,
            cl: Number.parseInt(downMin) > 60 ? t.status.down : t.text.primary,
          },
          {
            l: i18n.avgLat,
            v: `${svc.latency}ms`,
            cl: svc.latency > 100 ? t.status.degraded : t.text.primary,
          },
        ].map((s) => (
          <div
            key={s.l}
            style={{ backgroundColor: t.bg.input, borderRadius: R.sm, padding: '12px 14px' }}
          >
            <div
              style={{
                fontSize: 10,
                color: t.text.muted,
                textTransform: 'uppercase',
                letterSpacing: '.04em',
                marginBottom: 4,
              }}
            >
              {s.l}
            </div>
            <div
              style={{
                fontSize: 16,
                fontWeight: 700,
                fontFamily: F.mono,
                color: s.cl,
                fontFeatureSettings: "'tnum'",
                whiteSpace: 'nowrap',
              }}
            >
              {s.v}
            </div>
          </div>
        ))}
      </div>
      <div style={{ marginBottom: 24 }}>
        <div
          style={{
            fontSize: 11,
            color: t.text.muted,
            fontWeight: 500,
            marginBottom: 10,
            textTransform: 'uppercase',
            letterSpacing: '.04em',
          }}
        >
          {i18n.responseTime}
        </div>
        <div style={{ backgroundColor: t.bg.input, borderRadius: R.sm, padding: '16px 12px 8px' }}>
          <MiniChart data={svc.ld} chartHeight={72} color={c} />
          <div
            style={{
              display: 'flex',
              justifyContent: 'space-between',
              marginTop: 6,
              fontSize: 10,
              color: t.text.muted,
              fontFamily: F.mono,
            }}
          >
            <span>{i18n.ago72}</span>
            <span style={{ display: 'flex', gap: 10 }}>
              <span style={{ display: 'inline-flex', alignItems: 'center', gap: 4 }}>
                <span
                  style={{
                    width: 12,
                    height: 1.5,
                    backgroundColor: c,
                    display: 'inline-block',
                    borderRadius: 1,
                  }}
                />{' '}
                p50
              </span>
              <span style={{ display: 'inline-flex', alignItems: 'center', gap: 4 }}>
                <span
                  style={{
                    width: 12,
                    height: 1,
                    opacity: 0.3,
                    display: 'inline-block',
                    borderTop: `1px dashed ${c}`,
                  }}
                />{' '}
                p95
              </span>
            </span>
            <span>{i18n.now}</span>
          </div>
        </div>
      </div>
      <div>
        <div
          style={{
            fontSize: 11,
            color: t.text.muted,
            fontWeight: 500,
            marginBottom: 10,
            textTransform: 'uppercase',
            letterSpacing: '.04em',
          }}
        >
          {i18n.availability}
        </div>
        <div style={{ backgroundColor: t.bg.input, borderRadius: R.sm, padding: '16px 14px 12px' }}>
          <UptimeBar data={svc.bar} barHeight={30} />
          <div
            style={{
              display: 'flex',
              justifyContent: 'space-between',
              marginTop: 8,
              fontSize: 10,
              color: t.text.muted,
              fontFamily: F.mono,
            }}
          >
            <span>{i18n.ago90}</span>
            <span>{i18n.today}</span>
          </div>
        </div>
      </div>
    </div>
  )
}

/* ================================================================
   PROBES PAGE — fully interactive
   ================================================================ */
function ProbeCard({ probe, onEdit, onDuplicate, onDelete }) {
  const { t, i18n } = useApp()
  const tc = typeColors[probe.type] || t.text.secondary
  const descMap = {
    http: i18n.httpDesc,
    websocket: i18n.wsDesc,
    tcp: i18n.tcpDesc,
    push: i18n.pushDesc,
  }
  return (
    <div
      style={{
        backgroundColor: t.bg.card,
        border: `1px solid ${t.border}`,
        borderRadius: R.md,
        padding: 16,
        transition: 'border-color .2s',
        boxShadow: t.shadow,
      }}
      onMouseEnter={(e) => {
        e.currentTarget.style.borderColor = `${tc}33`
      }}
      onMouseLeave={(e) => {
        e.currentTarget.style.borderColor = t.border
      }}
    >
      {/* Row 1: status + name + actions */}
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          marginBottom: 8,
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, minWidth: 0, flex: 1 }}>
          <StatusDot status={probe.status} size={7} />
          <span
            style={{
              fontSize: 14,
              fontWeight: 600,
              color: t.text.primary,
              whiteSpace: 'nowrap',
              overflow: 'hidden',
              textOverflow: 'ellipsis',
              maxWidth: 180,
            }}
          >
            {probe.name}
          </span>
        </div>
        <div style={{ display: 'flex', gap: 4, flexShrink: 0 }}>
          <Btn small variant="ghost" onClick={() => onEdit(probe)}>
            {i18n.edit}
          </Btn>
          <Btn small variant="ghost" onClick={() => onDuplicate(probe)}>
            {i18n.duplicate}
          </Btn>
          <Btn small variant="danger" onClick={() => onDelete(probe.id)}>
            {i18n.delete}
          </Btn>
        </div>
      </div>
      {/* Row 2: URL on its own line */}
      <div
        style={{
          fontSize: 12,
          fontFamily: F.mono,
          color: t.text.muted,
          marginBottom: 8,
          whiteSpace: 'nowrap',
          overflow: 'hidden',
          textOverflow: 'ellipsis',
        }}
      >
        {probe.url}
      </div>
      {/* Row 3: type badge + interval + timeout + desc */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
        <Badge color={tc} bg={`${tc}18`}>
          {probe.type}
        </Badge>
        <span style={{ fontSize: 11, color: t.text.secondary, fontFamily: F.mono }}>
          {probe.interval}
        </span>
        <span style={{ fontSize: 11, color: t.text.muted, fontFamily: F.mono }}>
          {probe.timeout}
        </span>
        <span style={{ fontSize: 11, color: t.text.muted, marginLeft: 'auto' }}>
          {descMap[probe.type]}
        </span>
      </div>
    </div>
  )
}

function ProbeForm({ probe, onSave, onCancel }) {
  const { t, i18n } = useApp()
  const [form, setForm] = useState(
    probe || {
      name: '',
      type: 'http',
      url: '',
      interval: '30s',
      timeout: '5s',
      desc: '',
      mode: 'server',
    },
  )
  const upd = (k, v) => setForm((p) => ({ ...p, [k]: v }))
  const typeOpts = [
    { value: 'http', label: 'HTTP(S)' },
    { value: 'websocket', label: 'WebSocket' },
    { value: 'tcp', label: 'TCP' },
    { value: 'push', label: 'Push' },
  ]
  const intervalOpts = [
    { value: '10s', label: '10s' },
    { value: '15s', label: '15s' },
    { value: '30s', label: '30s' },
    { value: '60s', label: '60s' },
    { value: '300s', label: '5m' },
    { value: '600s', label: '10m' },
    { value: '3600s', label: '1h' },
    { value: '86400s', label: '1d' },
  ]
  const timeoutOpts = [
    { value: '2s', label: '2s' },
    { value: '3s', label: '3s' },
    { value: '5s', label: '5s' },
    { value: '10s', label: '10s' },
    { value: '30s', label: '30s' },
    { value: '60s', label: '60s' },
  ]
  const modeOpts = [
    { value: 'server', label: i18n.serverProbes },
    { value: 'client', label: i18n.clientProbes },
  ]
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
      <div>
        <span style={{ fontSize: 12, color: t.text.muted, display: 'block', marginBottom: 4 }}>
          {i18n.probeName}
        </span>
        <Input value={form.name} onChange={(v) => upd('name', v)} placeholder="prod-api-health" />
      </div>
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
        <div>
          <span style={{ fontSize: 12, color: t.text.muted, display: 'block', marginBottom: 4 }}>
            {i18n.probeType}
          </span>
          <Select value={form.type} onChange={(v) => upd('type', v)} options={typeOpts} />
        </div>
        <div>
          <span style={{ fontSize: 12, color: t.text.muted, display: 'block', marginBottom: 4 }}>
            Mode
          </span>
          <Select value={form.mode} onChange={(v) => upd('mode', v)} options={modeOpts} />
        </div>
      </div>
      <div>
        <span style={{ fontSize: 12, color: t.text.muted, display: 'block', marginBottom: 4 }}>
          {i18n.probeUrl}
        </span>
        <Input
          value={form.url}
          onChange={(v) => upd('url', v)}
          placeholder="https://api.example.com/health"
        />
      </div>
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
        <div>
          <span style={{ fontSize: 12, color: t.text.muted, display: 'block', marginBottom: 4 }}>
            {i18n.probeInterval}
          </span>
          <Select
            value={form.interval}
            onChange={(v) => upd('interval', v)}
            options={intervalOpts}
          />
        </div>
        <div>
          <span style={{ fontSize: 12, color: t.text.muted, display: 'block', marginBottom: 4 }}>
            {i18n.probeTimeout}
          </span>
          <Select value={form.timeout} onChange={(v) => upd('timeout', v)} options={timeoutOpts} />
        </div>
      </div>
      <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 8, marginTop: 8 }}>
        <Btn variant="ghost" onClick={onCancel}>
          {i18n.cancel}
        </Btn>
        <Btn
          variant="primary"
          onClick={() =>
            onSave({ ...form, id: form.id || uid(), status: form.status || 'up', desc: form.type })
          }
        >
          {i18n.save}
        </Btn>
      </div>
    </div>
  )
}

function ProbesPage() {
  const { t, i18n } = useApp()
  const [probes, setProbes] = useState(initProbes)
  const [modal, setModal] = useState<{ type: string; probe?: (typeof initProbes)[number] } | null>(
    null,
  )
  const [delConfirm, setDelConfirm] = useState<string | null>(null)
  const [toast, setToast] = useState<string | null>(null)

  const flash = (msg) => {
    setToast(msg)
    setTimeout(() => setToast(null), 2000)
  }

  const serverProbes = probes.filter((p) => p.mode === 'server')
  const clientProbes = probes.filter((p) => p.mode === 'client')

  const handleSave = (form) => {
    if (modal?.type === 'edit') {
      setProbes((ps) => ps.map((p) => (p.id === form.id ? form : p)))
      flash(i18n.saved)
    } else {
      setProbes((ps) => [...ps, { ...form, id: uid() }])
      flash(i18n.saved)
    }
    setModal(null)
  }

  const handleDelete = (id) => {
    setProbes((ps) => ps.filter((p) => p.id !== id))
    setDelConfirm(null)
    flash(i18n.saved)
  }

  const GroupLabel = ({ children }) => (
    <div style={{ display: 'flex', alignItems: 'center', gap: 12, margin: '20px 0 12px' }}>
      <div style={{ height: 1, flex: 1, backgroundColor: t.border }} />
      <span style={{ fontSize: 12, color: t.text.muted, fontWeight: 500, whiteSpace: 'nowrap' }}>
        {children}
      </span>
      <div style={{ height: 1, flex: 1, backgroundColor: t.border }} />
    </div>
  )

  return (
    <div>
      <div
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          marginBottom: 16,
        }}
      >
        <div style={{ fontSize: 13, color: t.text.secondary }}>
          {probes.length} {i18n.probes.toLowerCase()}
        </div>
        <Btn variant="primary" onClick={() => setModal({ type: 'add' })}>
          + {i18n.addProbe}
        </Btn>
      </div>

      <GroupLabel>{i18n.serverProbes}</GroupLabel>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
        {serverProbes.map((p) => (
          <ProbeCard
            key={p.id}
            probe={p}
            onEdit={(pr) => setModal({ type: 'edit', probe: pr })}
            onDuplicate={(pr) =>
              setModal({ type: 'dup', probe: { ...pr, name: `${pr.name}-copy`, id: '' } })
            }
            onDelete={(id) => setDelConfirm(id)}
          />
        ))}
      </div>

      <GroupLabel>{i18n.clientProbes}</GroupLabel>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
        {clientProbes.map((p) => (
          <ProbeCard
            key={p.id}
            probe={p}
            onEdit={(pr) => setModal({ type: 'edit', probe: pr })}
            onDuplicate={(pr) =>
              setModal({ type: 'dup', probe: { ...pr, name: `${pr.name}-copy`, id: '' } })
            }
            onDelete={(id) => setDelConfirm(id)}
          />
        ))}
      </div>

      {/* Add/Edit/Dup modal */}
      <Modal
        open={!!modal}
        onClose={() => setModal(null)}
        title={
          modal?.type === 'edit'
            ? i18n.editProbe
            : modal?.type === 'dup'
              ? i18n.duplicateProbe
              : i18n.addNew
        }
      >
        {modal && (
          <ProbeForm
            probe={modal.probe || null}
            onSave={handleSave}
            onCancel={() => setModal(null)}
          />
        )}
      </Modal>

      {/* Delete confirm */}
      <Modal
        open={!!delConfirm}
        onClose={() => setDelConfirm(null)}
        title={i18n.delete}
        width={360}
      >
        <p style={{ color: t.text.secondary, fontSize: 13, marginBottom: 20 }}>
          {i18n.confirmDelete}
        </p>
        <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 8 }}>
          <Btn variant="ghost" onClick={() => setDelConfirm(null)}>
            {i18n.cancel}
          </Btn>
          <Btn variant="danger" onClick={() => handleDelete(delConfirm)}>
            {i18n.confirm}
          </Btn>
        </div>
      </Modal>

      <Toast message={toast} visible={!!toast} />
    </div>
  )
}

/* ================================================================
   SETTINGS PAGE — fully interactive
   ================================================================ */
const WEBHOOK_PAYLOAD_SAMPLE = JSON.stringify(
  {
    event: 'probe_anomaly',
    probe_id: 'prod-api-health',
    probe_name: 'prod-api-health',
    from: 'up',
    to: 'down',
    timestamp: '2026-04-14T13:22:01Z',
    latency_ms: 5023,
    status_code: 503,
    message: 'Health check failed: HTTP 503',
    error: {
      type: 'HTTP_ERROR',
      retry_count: 3,
      last_error: 'status 503 Service Unavailable',
    },
  },
  null,
  2,
)

/* ================================================================
   Settings layout atoms (OUTSIDE component to avoid remount)
   ================================================================ */
function SettingsSection({ children, t }) {
  return (
    <div
      style={{
        backgroundColor: t.bg.card,
        borderRadius: R.lg,
        border: `1px solid ${t.border}`,
        padding: 24,
        marginBottom: 16,
        boxShadow: t.shadow,
      }}
    >
      {children}
    </div>
  )
}
function SettingsLabel({ children, t }) {
  return (
    <span
      style={{
        fontSize: 13,
        fontWeight: 600,
        color: t.text.primary,
        display: 'block',
        marginBottom: 4,
      }}
    >
      {children}
    </span>
  )
}
function SettingsHint({ children, t }) {
  return (
    <p
      style={{ fontSize: 12, color: t.text.muted, marginTop: 4, marginBottom: 0, lineHeight: 1.5 }}
    >
      {children}
    </p>
  )
}

function SettingsPage({ projectName, setProjectName }) {
  const { t, i18n } = useApp()
  const [retention, setRetention] = useState('90d')
  const [slaWindow, setSlaWindow] = useState('30d')
  const [timezone, setTimezone] = useState('UTC')
  const [webhookUrl, setWebhookUrl] = useState('')
  const [apiKey, setApiKey] = useState(() => genApiKey())
  const [oldApiKey, setOldApiKey] = useState<string | null>(null)
  const [saveState, setSaveState] = useState('idle')
  const [webhookTested, setWebhookTested] = useState<string | null>(null)
  const [showPayload, setShowPayload] = useState(false)
  const [showAdvanced, setShowAdvanced] = useState(false)
  const [copied, setCopied] = useState(false)
  const [regenConfirm, setRegenConfirm] = useState(false)
  const [toast, setToast] = useState<string | null>(null)

  const flash = useCallback((m) => {
    setToast(m)
    setTimeout(() => setToast(null), 2200)
  }, [])

  const handleSave = useCallback(() => {
    setSaveState('saving')
    setTimeout(() => {
      setSaveState('saved')
      setTimeout(() => setSaveState('idle'), 1800)
    }, 1200)
  }, [])

  const [webhookError, setWebhookError] = useState('')
  const handleTestWebhook = useCallback(() => {
    if (!webhookUrl) return
    setWebhookTested('testing')
    setWebhookError('')
    fetch('/api/v1/settings/webhook/test', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ url: webhookUrl, body: WEBHOOK_PAYLOAD_SAMPLE }),
    })
      .then((res) => res.json())
      .then((data) => {
        if (data.success) {
          setWebhookTested('success')
          setTimeout(() => setWebhookTested(null), 4000)
        } else {
          setWebhookTested('fail')
          setWebhookError(
            data.status_code
              ? i18n.webhookFailDetail.replace('{status}', String(data.status_code))
              : data.error || i18n.webhookFailNetwork,
          )
        }
      })
      .catch(() => {
        setWebhookTested('fail')
        setWebhookError(i18n.webhookFailNetwork)
      })
  }, [webhookUrl, i18n.webhookFailDetail, i18n.webhookFailNetwork])

  const handleRegen = useCallback(() => {
    setOldApiKey(apiKey)
    setApiKey(genApiKey())
    setRegenConfirm(false)
    flash(i18n.regenerated)
  }, [apiKey, flash, i18n.regenerated])
  const handleCopy = useCallback((text: string) => {
    navigator.clipboard?.writeText(text)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }, [])

  const retentionOpts = useMemo(
    () => [
      { value: '30d', label: i18n.r30d },
      { value: '90d', label: i18n.r90d },
      { value: '180d', label: i18n.r180d },
      { value: '1y', label: i18n.r1y },
      { value: '2y', label: i18n.r2y },
    ],
    [i18n],
  )
  const windowOpts = useMemo(
    () => [
      { value: '7d', label: i18n.w7d },
      { value: '30d', label: i18n.w30d },
      { value: '90d', label: i18n.w90d },
      { value: '180d', label: i18n.w180d },
      { value: '365d', label: i18n.w365d },
    ],
    [i18n],
  )
  const tzOpts = useMemo(
    () => [
      { value: 'UTC', label: 'UTC' },
      { value: 'Asia/Shanghai', label: 'Asia/Shanghai (UTC+8)' },
      { value: 'Asia/Tokyo', label: 'Asia/Tokyo (UTC+9)' },
      { value: 'Asia/Singapore', label: 'Asia/Singapore (UTC+8)' },
      { value: 'America/New_York', label: 'America/New_York (UTC-4)' },
      { value: 'Europe/London', label: 'Europe/London (UTC+1)' },
    ],
    [],
  )

  const SettingsRow = ({
    label,
    hint,
    children: ctrl,
  }: { label: string; hint: string; children: React.ReactNode }) => (
    <div className="settings-row">
      <div>
        <SettingsLabel t={t}>{label}</SettingsLabel>
        <SettingsHint t={t}>{hint}</SettingsHint>
      </div>
      <div>{ctrl}</div>
    </div>
  )

  return (
    <div>
      {/* Project Name */}
      <SettingsSection t={t}>
        <SettingsRow label={i18n.projectName} hint={i18n.projectNameHint}>
          <Input value={projectName} onChange={setProjectName} />
        </SettingsRow>
      </SettingsSection>

      {/* SLA & Data */}
      <SettingsSection t={t}>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
          <SettingsRow label={i18n.slaTimezone} hint={i18n.slaTimezoneHint}>
            <Select value={timezone} onChange={setTimezone} options={tzOpts} />
          </SettingsRow>
          <SettingsRow label={i18n.slaWindow} hint={i18n.slaWindowHint}>
            <ChipSelect value={slaWindow} onChange={setSlaWindow} options={windowOpts} />
          </SettingsRow>
          <div style={{ borderTop: `1px solid ${t.border}`, paddingTop: 16 }}>
            <button
              type="button"
              onClick={() => setShowAdvanced((p) => !p)}
              style={{
                background: 'none',
                border: 'none',
                color: t.text.muted,
                fontSize: 12,
                cursor: 'pointer',
                padding: 0,
                fontFamily: F.sans,
                display: 'flex',
                alignItems: 'center',
                gap: 6,
              }}
            >
              <span
                style={{
                  fontSize: 10,
                  transition: 'transform .2s',
                  transform: showAdvanced ? 'rotate(90deg)' : 'none',
                }}
              >
                ▶
              </span>
              {i18n.advanced}
            </button>
            {showAdvanced && (
              <div style={{ marginTop: 16, animation: 'fadeSlide .2s ease' }}>
                <SettingsRow label={i18n.dataRetention} hint={i18n.dataRetentionHint}>
                  <ChipSelect value={retention} onChange={setRetention} options={retentionOpts} />
                </SettingsRow>
              </div>
            )}
          </div>
        </div>
      </SettingsSection>

      {/* Webhook */}
      <SettingsSection t={t}>
        <SettingsRow label={i18n.webhookUrl} hint={i18n.webhookHint}>
          <div>
            <div style={{ display: 'flex', gap: 8, alignItems: 'center', flexWrap: 'wrap' }}>
              <div style={{ flex: '1 1 200px', minWidth: 0 }}>
                <Input
                  value={webhookUrl}
                  onChange={setWebhookUrl}
                  placeholder="https://hooks.example.com/sentinel"
                />
              </div>
              <Btn
                variant="default"
                onClick={handleTestWebhook}
                loading={webhookTested === 'testing'}
                disabled={!webhookUrl}
              >
                {i18n.testWebhook}
              </Btn>
            </div>
            {/^https?:\/\/(localhost|127\.0\.0\.1)(:|\/|$)/.test(webhookUrl) && (
              <div
                style={{
                  marginTop: 8,
                  padding: '6px 10px',
                  fontSize: 12,
                  color: t.status.degraded,
                  backgroundColor: `${t.status.degraded}0a`,
                  border: `1px solid ${t.status.degraded}22`,
                  borderRadius: 8,
                  lineHeight: 1.5,
                }}
              >
                {i18n.webhookLocalWarn}
              </div>
            )}
            {webhookTested === 'success' && (
              <div
                style={{
                  marginTop: 10,
                  padding: '8px 12px',
                  fontSize: 12,
                  color: t.status.up,
                  backgroundColor: `${t.status.up}0a`,
                  border: `1px solid ${t.status.up}22`,
                  borderRadius: 8,
                  display: 'flex',
                  alignItems: 'center',
                  gap: 6,
                  animation: 'fadeSlide .2s ease',
                }}
              >
                <svg
                  width="14"
                  height="14"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2.5"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                >
                  <title>OK</title>
                  <polyline points="20 6 9 17 4 12" />
                </svg>
                {i18n.webhookSuccess}
              </div>
            )}
            {webhookTested === 'fail' && (
              <div
                style={{
                  marginTop: 10,
                  padding: '8px 12px',
                  fontSize: 12,
                  color: t.status.down,
                  backgroundColor: `${t.status.down}0a`,
                  border: `1px solid ${t.status.down}22`,
                  borderRadius: 8,
                  display: 'flex',
                  alignItems: 'flex-start',
                  gap: 6,
                  lineHeight: 1.5,
                }}
              >
                <svg
                  width="14"
                  height="14"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2.5"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  style={{ flexShrink: 0, marginTop: 2 }}
                >
                  <title>Error</title>
                  <circle cx="12" cy="12" r="10" />
                  <line x1="15" y1="9" x2="9" y2="15" />
                  <line x1="9" y1="9" x2="15" y2="15" />
                </svg>
                <span>{webhookError || i18n.webhookFail}</span>
              </div>
            )}

            <button
              type="button"
              onClick={() => setShowPayload((p) => !p)}
              style={{
                background: 'none',
                border: 'none',
                color: t.accent,
                fontSize: 12,
                cursor: 'pointer',
                marginTop: 12,
                padding: 0,
                fontFamily: F.sans,
              }}
            >
              {showPayload ? '▾' : '▸'} {i18n.samplePayload}
            </button>
            {showPayload && (
              <div style={{ marginTop: 10 }}>
                <div
                  style={{
                    fontSize: 11,
                    color: t.text.muted,
                    marginBottom: 6,
                  }}
                >
                  {i18n.payloadHint}
                </div>
                <pre
                  style={{
                    backgroundColor: t.bg.input,
                    padding: 12,
                    borderRadius: R.sm,
                    fontSize: 11,
                    fontFamily: F.mono,
                    color: t.text.secondary,
                    overflowX: 'auto',
                    margin: 0,
                    border: `1px solid ${t.border}`,
                    lineHeight: 1.6,
                    maxWidth: '100%',
                    whiteSpace: 'pre-wrap',
                    wordBreak: 'break-all',
                  }}
                >
                  {WEBHOOK_PAYLOAD_SAMPLE}
                </pre>
              </div>
            )}
          </div>
        </SettingsRow>
      </SettingsSection>

      {/* API Integration */}
      <SettingsSection t={t}>
        <SettingsRow label={i18n.apiIntegration} hint={i18n.apiHint}>
          <div>
            <div style={{ fontSize: 11, color: t.text.muted, fontWeight: 500, marginBottom: 6 }}>
              {i18n.apiKey}
            </div>
            <div style={{ display: 'flex', gap: 8, alignItems: 'center', flexWrap: 'wrap' }}>
              <code
                style={{
                  flex: '1 1 200px',
                  minWidth: 0,
                  padding: '8px 12px',
                  backgroundColor: t.bg.input,
                  borderRadius: 8,
                  fontFamily: F.mono,
                  fontSize: 12,
                  color: t.text.muted,
                  border: `1px solid ${t.border}`,
                  overflow: 'hidden',
                  textOverflow: 'ellipsis',
                  whiteSpace: 'nowrap',
                  letterSpacing: '.05em',
                }}
              >
                {`${apiKey.slice(0, 7)}${'•'.repeat(20)}${apiKey.slice(-4)}`}
              </code>
              <div style={{ display: 'flex', gap: 6, flexShrink: 0 }}>
                <button
                  type="button"
                  onClick={() => handleCopy(apiKey)}
                  title={i18n.copy}
                  style={{
                    background: 'none',
                    border: `1px solid ${copied ? `${t.status.up}55` : t.border}`,
                    borderRadius: 6,
                    padding: '6px 8px',
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    transition: 'all .2s',
                    color: copied ? t.status.up : t.text.muted,
                    backgroundColor: copied ? `${t.status.up}10` : 'transparent',
                  }}
                >
                  {copied ? (
                    <svg
                      width="14"
                      height="14"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="2.5"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      style={{ animation: 'checkPop .3s ease-out' }}
                    >
                      <title>Copied</title>
                      <polyline points="20 6 9 17 4 12" />
                    </svg>
                  ) : (
                    <svg
                      width="14"
                      height="14"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="2"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    >
                      <title>Copy</title>
                      <rect x="9" y="9" width="13" height="13" rx="2" ry="2" />
                      <path d="M5 15H4a2 2 0 01-2-2V4a2 2 0 012-2h9a2 2 0 012 2v1" />
                    </svg>
                  )}
                </button>
                <Btn small variant="danger" onClick={() => setRegenConfirm(true)}>
                  {i18n.regenerate}
                </Btn>
              </div>
            </div>
            {oldApiKey && (
              <div style={{ marginTop: 10 }}>
                <div
                  style={{
                    fontSize: 11,
                    color: t.status.degraded,
                    fontWeight: 500,
                    marginBottom: 4,
                  }}
                >
                  {i18n.oldKey}
                </div>
                <code
                  style={{
                    display: 'block',
                    padding: '6px 10px',
                    backgroundColor: t.bg.input,
                    borderRadius: 6,
                    fontFamily: F.mono,
                    fontSize: 11,
                    color: t.text.muted,
                    border: `1px dashed ${t.status.degraded}33`,
                    overflow: 'hidden',
                    textOverflow: 'ellipsis',
                    whiteSpace: 'nowrap',
                  }}
                >
                  {oldApiKey}
                </code>
              </div>
            )}
          </div>
        </SettingsRow>
      </SettingsSection>

      {/* Save button */}
      <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: 8, marginBottom: 24 }}>
        <button
          type="button"
          onClick={saveState === 'idle' ? handleSave : undefined}
          disabled={saveState !== 'idle'}
          style={{
            minWidth: 140,
            padding: '10px 24px',
            borderRadius: 10,
            fontSize: 13,
            fontWeight: 600,
            fontFamily: F.sans,
            cursor: saveState === 'idle' ? 'pointer' : 'default',
            display: 'inline-flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: 8,
            border: 'none',
            transition: 'all .3s ease',
            ...(saveState === 'saved'
              ? {
                  backgroundColor: t.status.up,
                  color: '#fff',
                  animation: 'savedPulse .6s ease-out',
                }
              : {
                  backgroundColor: t.accent,
                  color: '#fff',
                }),
          }}
        >
          {saveState === 'saving' && (
            <span
              style={{
                display: 'inline-block',
                width: 14,
                height: 14,
                border: '2px solid rgba(255,255,255,.3)',
                borderTopColor: '#fff',
                borderRadius: '50%',
                animation: 'spin .6s linear infinite',
              }}
            />
          )}
          {saveState === 'saved' && (
            <svg
              width="14"
              height="14"
              viewBox="0 0 24 24"
              fill="none"
              stroke="#fff"
              strokeWidth="2.5"
              strokeLinecap="round"
              strokeLinejoin="round"
              style={{ animation: 'checkPop .3s ease-out' }}
            >
              <title>Saved</title>
              <polyline points="20 6 9 17 4 12" />
            </svg>
          )}
          {saveState === 'saving'
            ? i18n.saving
            : saveState === 'saved'
              ? i18n.saved
              : i18n.saveSettings}
        </button>
      </div>

      {/* Regen confirm modal */}
      <Modal
        open={regenConfirm}
        onClose={() => setRegenConfirm(false)}
        title={i18n.regenerate}
        width={380}
      >
        <p style={{ color: t.text.secondary, fontSize: 13, marginBottom: 20 }}>
          {i18n.regenerateConfirm}
        </p>
        <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 8 }}>
          <Btn variant="ghost" onClick={() => setRegenConfirm(false)}>
            {i18n.cancel}
          </Btn>
          <Btn variant="danger" onClick={handleRegen}>
            {i18n.confirm}
          </Btn>
        </div>
      </Modal>

      <Toast message={toast} visible={!!toast} />
    </div>
  )
}

/* ================================================================
   Layout: Header, Tabs
   ================================================================ */
function Header({ theme, toggleTheme, lang, toggleLang, projectName }) {
  const { t, i18n } = useApp()
  const brandDisplay = projectName || i18n.brand
  return (
    <header
      style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        padding: '16px 0',
        marginBottom: 8,
        flexWrap: 'wrap',
        gap: 12,
      }}
    >
      <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
        <div
          style={{
            width: 34,
            height: 34,
            borderRadius: R.sm,
            background: `linear-gradient(135deg,${t.accent},#818cf8)`,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontSize: 15,
            fontWeight: 800,
            color: '#fff',
            fontFamily: F.mono,
            boxShadow: `0 0 20px ${t.accent}33`,
          }}
        >
          {brandDisplay.charAt(0).toUpperCase()}
        </div>
        <div>
          <h1
            style={{
              fontSize: 18,
              fontWeight: 700,
              color: t.text.primary,
              margin: 0,
              fontFamily: F.display,
              letterSpacing: '-.02em',
            }}
          >
            {brandDisplay}
          </h1>
          <span style={{ fontSize: 11, color: t.text.muted }}>{i18n.tagline}</span>
        </div>
      </div>
      <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
          <span
            style={{
              width: 6,
              height: 6,
              borderRadius: '50%',
              backgroundColor: t.status.up,
              boxShadow: `0 0 8px ${t.status.up}`,
            }}
          />
          <span style={{ fontSize: 12, color: t.text.secondary }}>{i18n.allProbes}</span>
        </div>
        <div style={{ width: 1, height: 20, backgroundColor: t.border }} />
        <button
          type="button"
          onClick={toggleLang}
          style={{
            background: t.bg.card,
            border: `1px solid ${t.border}`,
            borderRadius: 8,
            height: 36,
            padding: '0 12px',
            display: 'flex',
            alignItems: 'center',
            cursor: 'pointer',
            fontSize: 12,
            fontWeight: 600,
            color: t.text.secondary,
            fontFamily: F.mono,
            transition: 'all .2s',
          }}
        >
          {lang === 'en' ? '中文' : 'EN'}
        </button>
        <button
          type="button"
          onClick={toggleTheme}
          aria-label="Toggle theme"
          style={{
            background: t.bg.card,
            border: `1px solid ${t.border}`,
            borderRadius: 8,
            width: 36,
            height: 36,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            cursor: 'pointer',
            fontSize: 16,
            color: t.text.secondary,
            transition: 'all .2s',
          }}
        >
          {theme === 'dark' ? '☀️' : '🌙'}
        </button>
      </div>
    </header>
  )
}

function TabNav({ active, onChange }) {
  const { t, i18n } = useApp()
  const tabs = [
    { id: 'overview', label: i18n.overview },
    { id: 'probes', label: i18n.probes },
    { id: 'incidents', label: i18n.incidents },
    { id: 'settings', label: i18n.settings },
  ]
  return (
    <nav
      style={{
        display: 'flex',
        gap: 2,
        marginBottom: 20,
        borderBottom: `1px solid ${t.border}`,
        overflowX: 'auto',
      }}
    >
      {tabs.map((tb) => (
        <button
          type="button"
          key={tb.id}
          onClick={() => onChange(tb.id)}
          style={{
            background: 'none',
            border: 'none',
            cursor: 'pointer',
            padding: '8px 16px 12px',
            fontSize: 13,
            fontWeight: active === tb.id ? 600 : 400,
            color: active === tb.id ? t.text.primary : t.text.muted,
            borderBottom: active === tb.id ? `2px solid ${t.accent}` : '2px solid transparent',
            transition: 'all .15s',
            fontFamily: F.sans,
            whiteSpace: 'nowrap',
          }}
        >
          {tb.label}
        </button>
      ))}
    </nav>
  )
}

function ListHeader() {
  const { t, i18n } = useApp()
  return (
    <div
      style={{
        display: 'grid',
        gridTemplateColumns: 'minmax(140px,1.2fr) minmax(160px,2fr) 80px 70px 76px',
        gap: 14,
        padding: '8px 20px',
        fontSize: 11,
        fontWeight: 500,
        color: t.text.muted,
        textTransform: 'uppercase',
        letterSpacing: '.05em',
      }}
    >
      <span>{i18n.service}</span>
      <span className="hide-mobile">{i18n.availability90}</span>
      <span style={{ textAlign: 'right' }}>{i18n.sla}</span>
      <span className="hide-mobile" style={{ textAlign: 'right' }}>
        {i18n.latency}
      </span>
      <span style={{ textAlign: 'right' }}>{i18n.status}</span>
    </div>
  )
}

/* ================================================================
   ROOT APP
   ================================================================ */
export default function App() {
  const [theme, setTheme] = useState(() => {
    try {
      return (localStorage.getItem('pulse-theme') as 'dark' | 'light') || 'dark'
    } catch {
      return 'dark'
    }
  })
  const [lang, setLang] = useState(() => {
    try {
      return (localStorage.getItem('pulse-lang') as 'en' | 'zh') || 'zh'
    } catch {
      return 'zh'
    }
  })
  const [selectedId, setSelectedId] = useState(null)
  const validTabs = ['overview', 'probes', 'incidents', 'settings']
  const [tab, setTabState] = useState(() => {
    const hash = window.location.hash.slice(1)
    return validTabs.includes(hash) ? hash : 'overview'
  })
  const setTab = useCallback((id: string) => {
    setTabState(id)
    window.location.hash = id === 'overview' ? '' : id
  }, [])
  useEffect(() => {
    const onHash = () => {
      const hash = window.location.hash.slice(1)
      setTabState(validTabs.includes(hash) ? hash : 'overview')
    }
    window.addEventListener('hashchange', onHash)
    return () => window.removeEventListener('hashchange', onHash)
  }, [])
  const [filter, setFilter] = useState('all')
  const [projectName, setProjectName] = useState('Pulse')

  const toggleTheme = useCallback(() => {
    setTheme((p) => {
      const next = p === 'dark' ? 'light' : 'dark'
      try {
        localStorage.setItem('pulse-theme', next)
      } catch {
        /* noop */
      }
      return next
    })
  }, [])
  const toggleLang = useCallback(() => {
    setLang((p) => {
      const next = p === 'en' ? 'zh' : 'en'
      try {
        localStorage.setItem('pulse-lang', next)
      } catch {
        /* noop */
      }
      return next
    })
  }, [])

  const t = themes[theme]
  const i18n = msg[lang]
  const ctx = useMemo(() => ({ t, i18n, lang, theme }), [t, i18n, lang, theme])

  const filtered = useMemo(
    () => (filter === 'all' ? initSvcs : initSvcs.filter((s) => s.status === filter)),
    [filter],
  )
  const selectedSvc = initSvcs.find((s) => s.id === selectedId) || null

  return (
    <AppCtx.Provider value={ctx}>
      <div
        style={{
          minHeight: '100vh',
          backgroundColor: t.bg.base,
          color: t.text.primary,
          fontFamily: F.sans,
          WebkitFontSmoothing: 'antialiased',
          transition: 'background-color .3s,color .3s',
        }}
      >
        <style>{`
        @import url('https://fonts.googleapis.com/css2?family=DM+Sans:wght@400;500;600;700&family=JetBrains+Mono:wght@400;500;600;700&family=Space+Grotesk:wght@500;600;700&display=swap');
        *{box-sizing:border-box;margin:0;padding:0}
        ::-webkit-scrollbar{width:0;display:none}
        *{scrollbar-width:none}
        @keyframes pulse-ring{0%{transform:scale(.8);opacity:.4}100%{transform:scale(1.6);opacity:0}}
        @keyframes fadeSlide{from{opacity:0;transform:translateY(8px)}to{opacity:1;transform:none}}
        @keyframes spin{to{transform:rotate(360deg)}}
        @keyframes checkPop{0%{transform:scale(0) rotate(-45deg);opacity:0}50%{transform:scale(1.2) rotate(0deg);opacity:1}100%{transform:scale(1) rotate(0deg);opacity:1}}
        @keyframes savedPulse{0%{box-shadow:0 0 0 0 rgba(16,185,129,.4)}70%{box-shadow:0 0 0 10px rgba(16,185,129,0)}100%{box-shadow:0 0 0 0 rgba(16,185,129,0)}}
        .settings-row{display:grid;grid-template-columns:280px 1fr;gap:32px;align-items:start}
        @media(max-width:960px){.main-grid{grid-template-columns:1fr!important}.hide-mobile{display:none!important}.resp-cols{grid-template-columns:1fr!important}.settings-row{grid-template-columns:1fr!important;gap:8px!important}}
        @media(max-width:600px){.resp-cols{grid-template-columns:1fr!important}.stat-grid{grid-template-columns:1fr 1fr!important}}
      `}</style>

        <div style={{ maxWidth: 1400, margin: '0 auto', padding: '0 24px 40px' }}>
          <Header
            theme={theme}
            toggleTheme={toggleTheme}
            lang={lang}
            toggleLang={toggleLang}
            projectName={projectName}
          />
          <TabNav active={tab} onChange={setTab} />

          {/* ──── OVERVIEW ──── */}
          {tab === 'overview' && (
            <>
              <OverviewCards />
              <div style={{ display: 'flex', gap: 8, margin: '20px 0 12px', flexWrap: 'wrap' }}>
                {[
                  { id: 'all', label: i18n.all, count: initSvcs.length },
                  {
                    id: 'up',
                    label: i18n.operational,
                    count: initSvcs.filter((s) => s.status === 'up').length,
                  },
                  {
                    id: 'degraded',
                    label: i18n.degraded,
                    count: initSvcs.filter((s) => s.status === 'degraded').length,
                  },
                  {
                    id: 'down',
                    label: i18n.down,
                    count: initSvcs.filter((s) => s.status === 'down').length,
                  },
                ].map((f) => (
                  <button
                    type="button"
                    key={f.id}
                    onClick={() => setFilter(f.id)}
                    style={{
                      background: filter === f.id ? t.accentMuted : 'transparent',
                      border: `1px solid ${filter === f.id ? `${t.accent}44` : t.border}`,
                      borderRadius: 8,
                      padding: '6px 14px',
                      cursor: 'pointer',
                      fontSize: 12,
                      fontWeight: 500,
                      color: filter === f.id ? t.text.primary : t.text.secondary,
                      transition: 'all .15s',
                      fontFamily: F.sans,
                      display: 'flex',
                      alignItems: 'center',
                      gap: 6,
                    }}
                  >
                    {f.id !== 'all' && (
                      <span
                        style={{
                          width: 6,
                          height: 6,
                          borderRadius: '50%',
                          backgroundColor: t.status[f.id],
                        }}
                      />
                    )}
                    {f.label}
                    <span
                      style={{
                        fontFamily: F.mono,
                        fontSize: 11,
                        color: t.text.muted,
                        marginLeft: 2,
                      }}
                    >
                      {f.count}
                    </span>
                  </button>
                ))}
              </div>
              <div
                className="main-grid"
                style={{ display: 'grid', gridTemplateColumns: '1fr 380px', gap: 16, marginTop: 8 }}
              >
                <div
                  style={{
                    backgroundColor: t.bg.card,
                    borderRadius: R.lg,
                    border: `1px solid ${t.border}`,
                    overflow: 'hidden',
                    boxShadow: t.shadow,
                  }}
                >
                  <ListHeader />
                  <div style={{ borderTop: `1px solid ${t.borderSubtle}` }}>
                    {filtered.map((s) => (
                      <ServiceRow
                        key={s.id}
                        svc={s}
                        selected={selectedId === s.id}
                        onSelect={setSelectedId}
                      />
                    ))}
                    {filtered.length === 0 && (
                      <div
                        style={{
                          padding: 40,
                          textAlign: 'center',
                          color: t.text.muted,
                          fontSize: 13,
                        }}
                      >
                        —
                      </div>
                    )}
                  </div>
                </div>
                <div
                  style={{
                    backgroundColor: t.bg.card,
                    borderRadius: R.lg,
                    border: `1px solid ${t.border}`,
                    overflow: 'hidden',
                    minHeight: 420,
                    boxShadow: t.shadow,
                  }}
                >
                  <DetailPanel svc={selectedSvc} />
                </div>
              </div>
              <div
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  padding: '16px 0',
                  marginTop: 16,
                  borderTop: `1px solid ${t.border}`,
                  fontSize: 11,
                  color: t.text.muted,
                  flexWrap: 'wrap',
                  gap: 8,
                }}
              >
                <div style={{ display: 'flex', gap: 16, flexWrap: 'wrap' }}>
                  {[
                    { s: 'up', l: i18n.operational },
                    { s: 'degraded', l: i18n.degraded },
                    { s: 'down', l: i18n.down },
                    { s: 'maintenance', l: i18n.maintenance },
                  ].map((x) => (
                    <span key={x.s} style={{ display: 'flex', alignItems: 'center', gap: 5 }}>
                      <span
                        style={{
                          width: 8,
                          height: 8,
                          borderRadius: 2,
                          backgroundColor: t.status[x.s],
                        }}
                      />
                      {x.l}
                    </span>
                  ))}
                </div>
                <span style={{ fontFamily: F.mono, fontFeatureSettings: "'tnum'" }}>
                  {i18n.version}
                </span>
              </div>
            </>
          )}

          {/* ──── PROBES ──── */}
          {tab === 'probes' && <ProbesPage />}

          {/* ──── INCIDENTS ──── */}
          {tab === 'incidents' && (
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                height: 300,
                color: t.text.muted,
                fontSize: 14,
                backgroundColor: t.bg.card,
                borderRadius: R.lg,
                border: `1px solid ${t.border}`,
                boxShadow: t.shadow,
              }}
            >
              Incidents {i18n.comingSoon}
            </div>
          )}

          {/* ──── SETTINGS ──── */}
          {tab === 'settings' && (
            <SettingsPage projectName={projectName} setProjectName={setProjectName} />
          )}
        </div>
      </div>
    </AppCtx.Provider>
  )
}
