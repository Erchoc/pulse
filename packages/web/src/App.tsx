import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState } from 'react'
import StatusPage from './StatusPage'

/* ================================================================
   PWA standalone detection
   ================================================================ */
function useIsPWA() {
  const [isPWA, setIsPWA] = useState(
    () =>
      new URLSearchParams(window.location.search).has('pwa') ||
      window.matchMedia('(display-mode: standalone)').matches ||
      (navigator as unknown as { standalone?: boolean }).standalone === true,
  )
  useEffect(() => {
    const mq = window.matchMedia('(display-mode: standalone)')
    const handler = (e: MediaQueryListEvent) => setIsPWA(e.matches)
    mq.addEventListener('change', handler)
    return () => mq.removeEventListener('change', handler)
  }, [])
  return isPWA
}

/* ================================================================
   i18n
   ================================================================ */
const msg = {
  en: {
    brand: 'Pulse',
    tagline: 'Global Probe · Real-time SLA',
    allProbes: 'All probes active',
    rangeToday: 'Today',
    rangeLast7d: '7 Days',
    rangeLast30d: '30 Days',
    rangeLast3m: '3 Months',
    rangeLast6m: '6 Months',
    rangeLast1y: '1 Year',
    realtime: 'Real-time',
    cached: 'Cached',
    overview: 'Overview',
    probes: 'Probes',
    incidents: 'Incidents',
    alerts: 'Alerts',
    events: 'Events & Alerts',
    eventsShort: 'Events',
    alertsComingSoon: 'Alert rules coming soon',
    siteNotification: 'Site Notification',
    siteNotifHint: 'Send a notification banner to all users visiting this page.',
    notifMessage: 'Message',
    notifMessagePlaceholder: 'e.g. Scheduled maintenance tonight 22:00–02:00',
    notifType: 'Type',
    notifTypeInfo: 'Info',
    notifTypeWarning: 'Warning',
    notifTypeCritical: 'Critical',
    publishNotif: 'Publish',
    clearNotif: 'Clear',
    notifPublished: 'Notification published',
    notifCleared: 'Notification cleared',
    enablePush: 'Enable Push',
    pushEnabled: 'Push enabled',
    pushDenied: 'Push permission denied',
    apiDocLink: 'View API documentation',
    settings: 'Settings',
    overallSLA: 'Overall SLA',
    servicesUp: 'Services Up',
    avgLatency: 'Avg Latency',
    probesSec: '{r} Checks',
    breaching: '{n} services breaching target',
    degradedDown: '{d} degraded · {x} down',
    tipDegraded: 'Latency exceeds threshold or partial probe failures',
    tipDown: 'Service unreachable — all probes failing',
    tipMaintenance: 'Manually set — alerts suppressed during window',
    p50All: 'p50 across all probes',
    servicesMixed: '{n} services monitored',
    all: 'All',
    operational: 'Operational',
    degraded: 'Degraded',
    down: 'Down',
    maintenance: 'Maintenance',
    service: 'Service',
    availability90: '{n} Availability',
    sla: 'SLA',
    latency: 'Latency',
    status: 'Status',
    belowTarget: 'below target',
    target: 'target',
    editTarget: 'Edit SLA Target',
    slaTarget: 'SLA Target (%)',
    search: 'Search services...',
    prev: 'Previous',
    next: 'Next',
    pageInfo: '{from}-{to} of {total}',
    selectHint: 'Select a service to view details',
    uptime90: 'Uptime ({n})',
    estDowntime: 'Est. Downtime/yr',
    avgLat: 'Avg Latency',
    responseTime: 'Response Time — {n}',
    details: 'Details',
    availability: 'Availability — {n}',
    incidentHistory: 'Incident History — {n}',
    totalIncidents: 'Total Incidents',
    avgDuration: 'Avg Duration',
    longestDown: 'Longest Down',
    daysClean: 'Days Clean',
    noIncidents: 'No incidents in this period',
    nMore: '+{n} more',
    dUnit: 'd',
    loadMore: 'Load more events',
    ago72: '{n} ago',
    now: 'now',
    ago90: '{n} ago',
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
    probeRegion: 'Deploy Region',
    regionZjk: 'Zhangjiakou',
    regionSz: 'Shenzhen',
    regionSh: 'Shanghai',
    regionHk: 'Hong Kong',
    regionSea: 'Southeast Asia',
    regionEu: 'Europe',
    regionUsEast: 'US East',
    regionUsWest: 'US West',
    regionDomesticHint:
      'Default 3-region domestic deployment to avoid false positives from ISP network issues. For overseas services, select at least one overseas probe.',
    regionOverseasWarn:
      'Overseas probes are used to monitor services deployed in the corresponding regions. May incur minor cross-border bandwidth costs.',
    probeDesc: 'Description',
    probeMode: 'Probe Mode',
    nameTooLong: 'Name must be 32 characters or less',
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
    apiIntegration: 'OpenAPI Integration',
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
    webhookNotif: 'Webhook Notification',
    apiIntegrationShort: 'API Integration',
    darkMode: 'Dark Mode',
    logout: 'Sign Out',
    // events & push diagnostics
    eventsTitle: 'Events & Alerts',
    pushDiagnostics: 'Push Notification Diagnostics',
    pushDiagHint: 'Test browser and system push capabilities across different devices and modes.',
    pushCapability: 'Capability Detection',
    pushPermission: 'Permission Status',
    pushTest: 'Send Test',
    notificationApi: 'Notification API',
    pushManagerApi: 'Push Manager API',
    serviceWorkerApi: 'Service Worker',
    supported: 'Supported',
    notSupported: 'Not Supported',
    permDefault: 'Not Asked',
    permGranted: 'Granted',
    permDenied: 'Denied',
    permUnavailable: 'Unavailable',
    requestPermission: 'Request Permission',
    sendTestPush: 'Send Test Notification',
    testPushTitle: 'Pulse Test',
    testPushBody: 'This is a test notification from Pulse push diagnostics.',
    pushSent: 'Notification sent!',
    pushBlocked: 'Permission denied. Go to browser settings to reset.',
    pushNotSupported: 'Push notifications are not supported in this browser/mode.',
    envInfo: 'Environment',
    envStandalone: 'Standalone (PWA)',
    envBrowser: 'Browser',
    envSecure: 'Secure Context (HTTPS)',
    envInsecure: 'Insecure Context (HTTP)',
    iosNote: 'iOS requires PWA mode (Add to Home Screen) for push. Safari 16.4+.',
    deniedNote:
      'Permission was denied. Reset in browser/system notification settings, then reload.',
    incidentLog: 'Incident Log',
    incidentLogHint:
      'Historical incident and alert records will appear here once monitoring is active.',
    noEvents: 'No events yet',
    setMaintenance: 'Set Maintenance',
    endMaintenance: 'End Maintenance',
    maintenanceReason: 'Reason',
    maintenanceReasonPlaceholder: 'e.g. Database migration',
    maintenanceEndTime: 'Estimated End Time',
    maintenanceEndTimePlaceholder: 'Leave empty for manual end',
    maintenanceNotify: 'Notify Users',
    maintenanceOperator: 'Operator',
    maintenanceStarted: 'Maintenance started',
    maintenanceEnded: 'Maintenance ended',
    maintenanceSince: 'Since',
    maintenanceUntil: 'Until',
    maintenanceManualEnd: 'Manual end',
    maintenanceActive: 'In Maintenance',
    confirmEndMaintenance: 'End maintenance for this service?',
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
  },
  zh: {
    brand: 'Pulse',
    tagline: '全球探针 · 实时 SLA',
    allProbes: '所有探针正常运行',
    rangeToday: '今日',
    rangeLast7d: '近7天',
    rangeLast30d: '近30天',
    rangeLast3m: '近3个月',
    rangeLast6m: '近半年',
    rangeLast1y: '近一年',
    realtime: '实时',
    cached: '缓存',
    overview: '总览',
    probes: '探针',
    incidents: '事件',
    alerts: '告警',
    events: '事件告警',
    eventsShort: '事件',
    alertsComingSoon: '告警规则即将推出',
    siteNotification: '本站通知',
    siteNotifHint: '向所有访问本页的用户发送通知横幅。',
    notifMessage: '消息内容',
    notifMessagePlaceholder: '例如：今晚 22:00–02:00 计划维护',
    notifType: '类型',
    notifTypeInfo: '信息',
    notifTypeWarning: '警告',
    notifTypeCritical: '紧急',
    publishNotif: '发布',
    clearNotif: '清除',
    notifPublished: '通知已发布',
    notifCleared: '通知已清除',
    enablePush: '开启推送',
    pushEnabled: '推送已开启',
    pushDenied: '推送权限被拒绝',
    apiDocLink: '查看接入文档',
    settings: '设置',
    overallSLA: '整体 SLA',
    servicesUp: '服务状态',
    avgLatency: '平均延迟',
    probesSec: '{r}检查次数',
    breaching: '{n} 个服务未达标',
    degradedDown: '{d} 个降级 · {x} 个宕机',
    tipDegraded: '响应延迟超阈值，或部分探针检测失败',
    tipDown: '服务完全不可达，所有探针检测失败',
    tipMaintenance: '人工设置维护中，维护期间告警静默',
    p50All: '全部探针 p50',
    servicesMixed: '监控 {n} 个服务',
    all: '全部',
    operational: '正常',
    degraded: '降级',
    down: '宕机',
    maintenance: '维护中',
    service: '服务',
    availability90: '{n}可用性',
    sla: 'SLA',
    latency: '延迟',
    status: '状态',
    belowTarget: '未达标',
    target: '目标',
    editTarget: '编辑 SLA 目标',
    slaTarget: 'SLA 目标 (%)',
    search: '搜索服务...',
    prev: '上一页',
    next: '下一页',
    pageInfo: '{from}-{to} / 共 {total}',
    selectHint: '选择一个服务查看详情',
    uptime90: '可用率 ({n})',
    estDowntime: '预计年停机',
    avgLat: '平均延迟',
    responseTime: '响应时间 — {n}',
    details: '详情',
    availability: '可用性 — {n}',
    incidentHistory: '事件历史 — {n}',
    totalIncidents: '总事件数',
    avgDuration: '平均时长',
    longestDown: '最长宕机',
    daysClean: '无故障天数',
    noIncidents: '该时段无事件',
    nMore: '+{n} 更多',
    dUnit: '天',
    loadMore: '加载更多事件',
    ago72: '{n}前',
    now: '现在',
    ago90: '{n}前',
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
    probeRegion: '部署区域',
    regionZjk: '张家口',
    regionSz: '深圳',
    regionSh: '上海',
    regionHk: '香港',
    regionSea: '东南亚',
    regionEu: '欧洲',
    regionUsEast: '美东',
    regionUsWest: '美西',
    regionDomesticHint:
      '默认国内三区部署探针程序，避免 ISP 网络原因导致误识别服务宕机。海外部署的项目请至少勾选一个海外探针。',
    regionOverseasWarn:
      '海外探针主要用于请求对应国家/区域部署的服务，防止国内跨境链路波动导致 SLA 统计偏差, 可能产生少量的跨境带宽使用成本。',
    probeDesc: '描述',
    probeMode: '探测模式',
    nameTooLong: '名称不超过 32 个字符',
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
    apiIntegration: 'OpenAPI 接入集成',
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
    webhookNotif: 'Webhook 通知',
    apiIntegrationShort: 'API 接入',
    darkMode: '深色模式',
    logout: '退出登录',
    // events & push diagnostics
    eventsTitle: '事件告警',
    pushDiagnostics: '推送通知诊断',
    pushDiagHint: '测试各设备与模式下浏览器和系统推送能力。',
    pushCapability: '能力检测',
    pushPermission: '权限状态',
    pushTest: '发送测试',
    notificationApi: 'Notification API',
    pushManagerApi: 'Push Manager API',
    serviceWorkerApi: 'Service Worker',
    supported: '支持',
    notSupported: '不支持',
    permDefault: '未询问',
    permGranted: '已授权',
    permDenied: '已拒绝',
    permUnavailable: '不可用',
    requestPermission: '请求权限',
    sendTestPush: '发送测试通知',
    testPushTitle: 'Pulse 测试',
    testPushBody: '这是一条来自 Pulse 推送诊断的测试通知。',
    pushSent: '通知已发送！',
    pushBlocked: '权限被拒绝，请前往浏览器设置重置后刷新页面。',
    pushNotSupported: '当前浏览器/模式不支持推送通知。',
    envInfo: '运行环境',
    envStandalone: '独立模式 (PWA)',
    envBrowser: '浏览器模式',
    envSecure: '安全上下文 (HTTPS)',
    envInsecure: '非安全上下文 (HTTP)',
    iosNote: 'iOS 需要 PWA 模式（添加到主屏幕）才能使用推送，要求 Safari 16.4+。',
    deniedNote: '权限已被拒绝。请在浏览器/系统通知设置中重置，然后刷新页面。',
    incidentLog: '事件记录',
    incidentLogHint: '监控启动后，历史事件和告警记录将显示在此处。',
    noEvents: '暂无事件',
    setMaintenance: '设置维护',
    endMaintenance: '结束维护',
    maintenanceReason: '维护原因',
    maintenanceReasonPlaceholder: '例如：数据库迁移',
    maintenanceEndTime: '预计结束时间',
    maintenanceEndTimePlaceholder: '留空则手动结束',
    maintenanceNotify: '通知用户',
    maintenanceOperator: '操作人',
    maintenanceStarted: '维护已开始',
    maintenanceEnded: '维护已结束',
    maintenanceSince: '开始于',
    maintenanceUntil: '预计结束',
    maintenanceManualEnd: '手动结束',
    maintenanceActive: '维护中',
    confirmEndMaintenance: '确定结束该服务的维护状态？',
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
  rangeLabel: string
}
const AppCtx = createContext<AppContextValue | null>(null)
const useApp = () => useContext(AppCtx) as AppContextValue

/* ================================================================
   Mock Data
   ================================================================ */
const genBar = (n = 100) => {
  const today = new Date()
  const bars: { date: string; status: string; uptime: number }[] = []
  // Generate non-overlapping incidents
  const incidents: { start: number; len: number; severity: string }[] = []
  const numIncidents = 1 + Math.floor(Math.random() * 20) // 1-20
  const used = new Set<number>()
  for (let k = 0; k < numIncidents; k++) {
    let start: number
    let attempts = 0
    do {
      start = 2 + Math.floor(Math.random() * (n - 4))
      attempts++
    } while (used.has(start) && attempts < 50)
    if (attempts >= 50) continue
    const len = 1 + Math.floor(Math.random() * 2) // 1-2 days
    const severity = Math.random() > 0.4 ? 'degraded' : 'down'
    for (let j = start; j < start + len && j < n; j++) used.add(j)
    incidents.push({ start, len, severity })
  }
  for (let i = 0; i < n; i++) {
    const d = new Date(today)
    d.setDate(d.getDate() - (n - 1 - i))
    const dateStr = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`
    let status = 'up'
    let uptime = 99.9 + Math.random() * 0.1
    for (const inc of incidents) {
      if (i >= inc.start && i < inc.start + inc.len) {
        status = inc.severity
        uptime = status === 'down' ? 80 + Math.random() * 15 : 95 + Math.random() * 4
        break
      }
      // degraded recovery day after incident
      if (i === inc.start + inc.len) {
        status = 'degraded'
        uptime = 97 + Math.random() * 2
        break
      }
    }
    bars.push({ date: dateStr, status, uptime: Math.round(uptime * 100) / 100 })
  }
  return bars
}
const genLd = (n = 72) => {
  let b = 45
  return Array.from({ length: n }, () => {
    b += (Math.random() - 0.5) * 15
    b = Math.max(12, Math.min(180, b))
    return { v: Math.round(b), p95: Math.round(b * 1.4 + Math.random() * 20) }
  })
}

const _initProbes = [
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
    timeout: '3s',
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
    timeout: '8s',
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

const _initSvcs = [
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
    maintenance: false,
    maintenanceReason: '',
    maintenanceStartAt: null as string | null,
    maintenanceEndAt: null as string | null,
    maintenanceOperator: '',
    maintenanceNotifyUsers: [] as string[],
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
    maintenance: false,
    maintenanceReason: '',
    maintenanceStartAt: null as string | null,
    maintenanceEndAt: null as string | null,
    maintenanceOperator: '',
    maintenanceNotifyUsers: [] as string[],
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
    maintenance: false,
    maintenanceReason: '',
    maintenanceStartAt: null as string | null,
    maintenanceEndAt: null as string | null,
    maintenanceOperator: '',
    maintenanceNotifyUsers: [] as string[],
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
    maintenance: false,
    maintenanceReason: '',
    maintenanceStartAt: null as string | null,
    maintenanceEndAt: null as string | null,
    maintenanceOperator: '',
    maintenanceNotifyUsers: [] as string[],
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
    maintenance: false,
    maintenanceReason: '',
    maintenanceStartAt: null as string | null,
    maintenanceEndAt: null as string | null,
    maintenanceOperator: '',
    maintenanceNotifyUsers: [] as string[],
  },
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
    maintenance: false,
    maintenanceReason: '',
    maintenanceStartAt: null as string | null,
    maintenanceEndAt: null as string | null,
    maintenanceOperator: '',
    maintenanceNotifyUsers: [] as string[],
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
    maintenance: false,
    maintenanceReason: '',
    maintenanceStartAt: null as string | null,
    maintenanceEndAt: null as string | null,
    maintenanceOperator: '',
    maintenanceNotifyUsers: [] as string[],
  },
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
  {
    id: 'mq',
    name: 'Message Queue',
    nameZh: '消息队列',
    group: 'Infra',
    type: 'tcp',
    interval: '10s',
    sla: 99.97,
    target: 99.9,
    latency: 4,
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
  {
    id: 'config',
    name: 'Config Center',
    nameZh: '配置中心',
    group: 'Core',
    type: 'http',
    interval: '30s',
    sla: 99.98,
    target: 99.9,
    latency: 15,
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
  {
    id: 'scheduler',
    name: 'Scheduler',
    nameZh: '调度器',
    group: 'Business',
    type: 'http',
    interval: '30s',
    sla: 99.87,
    target: 99.9,
    latency: 45,
    status: 'degraded',
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
    id: 'analytics',
    name: 'Analytics Engine',
    nameZh: '分析引擎',
    group: 'Business',
    type: 'tcp',
    interval: '60s',
    sla: 99.92,
    target: 99.9,
    latency: 120,
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
]

const mockUsers = [
  { id: 'user-1', name: 'Admin', email: 'admin@example.com' },
  { id: 'user-2', name: '张三', email: 'zhangsan@example.com' },
  { id: 'user-3', name: '李四', email: 'lisi@example.com' },
]

/* ================================================================
   Mock Page Data (URL param mock_page=true)
   ================================================================ */
const isMockPage = new URLSearchParams(window.location.search).has('mock_page')

const svcNames = [
  ['User Service', '用户服务'],
  ['Notification Hub', '通知中心'],
  ['File Storage', '文件存储'],
  ['Message Queue', '消息队列'],
  ['Cache Layer', '缓存层'],
  ['Log Collector', '日志采集'],
  ['Config Center', '配置中心'],
  ['Gateway Proxy', '网关代理'],
  ['Scheduler', '调度器'],
  ['Analytics Engine', '分析引擎'],
  ['Billing Service', '计费服务'],
  ['Email Sender', '邮件发送'],
  ['SMS Gateway', 'SMS 网关'],
  ['Image Processor', '图片处理'],
  ['Video Transcoder', '视频转码'],
  ['Recommendation', '推荐引擎'],
  ['Geo Service', '地理服务'],
  ['Rate Limiter', '限流器'],
  ['Session Store', 'Session 存储'],
  ['Audit Logger', '审计日志'],
  ['Health Monitor', '健康监控'],
  ['Data Pipeline', '数据管道'],
  ['Feature Flags', '特性开关'],
  ['A/B Testing', 'A/B 测试'],
  ['OAuth Provider', 'OAuth 提供方'],
  ['Webhook Relay', 'Webhook 中继'],
  ['PDF Generator', 'PDF 生成'],
  ['Export Service', '导出服务'],
  ['Import Service', '导入服务'],
  ['Sync Worker', '同步 Worker'],
]
const probeNames = [
  'api-health',
  'db-check',
  'cache-ping',
  'queue-depth',
  'cdn-edge',
  'dns-resolve',
  'ssl-cert',
  'ws-echo',
  'grpc-health',
  'smtp-check',
  'redis-ping',
  'es-cluster',
  'mongo-rs',
  'kafka-lag',
  'etcd-health',
  'vault-seal',
  'consul-leader',
  'k8s-api',
  'nginx-status',
  'envoy-admin',
  'prometheus-up',
  'grafana-health',
  'jaeger-query',
  'minio-health',
  'rabbitmq-mgmt',
  'clickhouse-ping',
  'influx-health',
  'nats-varz',
]
const types = ['http', 'websocket', 'tcp']
const intervals = ['10s', '30s', '60s', '300s']
const statuses = ['up', 'up', 'up', 'up', 'up', 'degraded', 'down', 'maintenance']

function genMockSvcs(n = 120) {
  return Array.from({ length: n }, (_, i) => {
    const [name, nameZh] = svcNames[i % svcNames.length]
    const suffix = i >= svcNames.length ? ` ${Math.floor(i / svcNames.length) + 1}` : ''
    const st = statuses[Math.floor(Math.random() * statuses.length)]
    const sla =
      st === 'down'
        ? 95 + Math.random() * 4
        : st === 'degraded'
          ? 98 + Math.random() * 1.5
          : 99.5 + Math.random() * 0.49
    return {
      id: `svc-${i}`,
      name: `${name}${suffix}`,
      nameZh: `${nameZh}${suffix}`,
      group: ['Core', 'Business', 'Infra', 'Edge'][i % 4],
      type: types[i % types.length],
      interval: intervals[i % intervals.length],
      sla: Math.round(sla * 100) / 100,
      target: 99.9,
      latency: Math.round(5 + Math.random() * 200),
      status: st,
      bar: genBar(),
      ld: genLd(),
      maintenance: st === 'maintenance',
      maintenanceReason: st === 'maintenance' ? 'Database migration & index rebuild' : '',
      maintenanceStartAt:
        st === 'maintenance'
          ? new Date(Date.now() - 45 * 60000).toISOString()
          : (null as string | null),
      maintenanceEndAt:
        st === 'maintenance'
          ? new Date(Date.now() + 60 * 60000).toISOString()
          : (null as string | null),
      maintenanceOperator: st === 'maintenance' ? 'ops-team' : '',
      maintenanceNotifyUsers: [] as string[],
    }
  })
}

function genMockProbes(n = 110) {
  return Array.from({ length: n }, (_, i) => {
    const isClient = i % 5 === 0
    return {
      id: `mp-${i}`,
      name: `${probeNames[i % probeNames.length]}${i >= probeNames.length ? `-${Math.floor(i / probeNames.length)}` : ''}`,
      type: isClient ? 'push' : types[i % types.length],
      url: isClient ? '—' : `https://svc-${i}.example.com/health`,
      interval: intervals[i % intervals.length],
      timeout: ['3s', '5s', '8s'][i % 3],
      desc: isClient ? 'push' : types[i % types.length],
      mode: isClient ? 'client' : 'server',
      status: statuses[Math.floor(Math.random() * statuses.length)],
    }
  })
}

const _allSvcs = isMockPage ? genMockSvcs() : _initSvcs
const allProbes = isMockPage ? genMockProbes() : _initProbes

/* ================================================================
   Helpers
   ================================================================ */
const PAGE_SIZE = 10

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
   Pagination
   ================================================================ */
function Pagination({
  total,
  page,
  pageSize,
  onPageChange,
}: { total: number; page: number; pageSize: number; onPageChange: (p: number) => void }) {
  const { t, i18n } = useApp()
  const totalPages = Math.ceil(total / pageSize)
  if (totalPages <= 1) return null
  const from = (page - 1) * pageSize + 1
  const to = Math.min(page * pageSize, total)
  return (
    <div
      style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 12,
        padding: '12px 0',
        fontSize: 12,
        color: t.text.muted,
      }}
    >
      <button
        type="button"
        disabled={page <= 1}
        onClick={() => onPageChange(page - 1)}
        style={{
          padding: '4px 10px',
          borderRadius: 6,
          border: `1px solid ${t.border}`,
          backgroundColor: 'transparent',
          color: page <= 1 ? t.text.muted : t.text.primary,
          cursor: page <= 1 ? 'default' : 'pointer',
          opacity: page <= 1 ? 0.4 : 1,
          fontSize: 12,
          fontFamily: F.sans,
        }}
      >
        {i18n.prev}
      </button>
      <span style={{ fontFamily: F.mono, fontFeatureSettings: "'tnum'" }}>
        {i18n.pageInfo
          .replace('{from}', String(from))
          .replace('{to}', String(to))
          .replace('{total}', String(total))}
      </span>
      <button
        type="button"
        disabled={page >= totalPages}
        onClick={() => onPageChange(page + 1)}
        style={{
          padding: '4px 10px',
          borderRadius: 6,
          border: `1px solid ${t.border}`,
          backgroundColor: 'transparent',
          color: page >= totalPages ? t.text.muted : t.text.primary,
          cursor: page >= totalPages ? 'default' : 'pointer',
          opacity: page >= totalPages ? 0.4 : 1,
          fontSize: 12,
          fontFamily: F.sans,
        }}
      >
        {i18n.next}
      </button>
    </div>
  )
}

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

function Tooltip({ text, children }: { text: string; children: React.ReactNode }) {
  const { t } = useApp()
  const [show, setShow] = useState(false)
  const ref = useRef<HTMLSpanElement>(null)
  if (!text) return <>{children}</>
  return (
    <span
      ref={ref}
      onMouseEnter={() => setShow(true)}
      onMouseLeave={() => setShow(false)}
      onTouchStart={() => setShow((p) => !p)}
      style={{ position: 'relative', cursor: 'help' }}
    >
      {children}
      {show && (
        <span
          style={{
            position: 'absolute',
            bottom: '100%',
            left: '50%',
            transform: 'translateX(-50%)',
            marginBottom: 6,
            padding: '6px 10px',
            borderRadius: 6,
            backgroundColor: t.bg.card,
            border: `1px solid ${t.border}`,
            boxShadow: '0 4px 12px rgba(0,0,0,.25)',
            fontSize: 11,
            lineHeight: 1.4,
            color: t.text.secondary,
            whiteSpace: 'nowrap',
            zIndex: 9999,
            pointerEvents: 'none',
          }}
        >
          {text}
        </span>
      )}
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
  maxLength,
  style: sx = {},
}: {
  value: string
  onChange: (v: string) => void
  placeholder?: string
  maxLength?: number
  style?: React.CSSProperties
}) {
  const { t } = useApp()
  return (
    <input
      value={value}
      onChange={(e) => onChange(e.target.value)}
      maxLength={maxLength}
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
  const [pos, setPos] = useState<{ top: number; left: number; width: number; dropUp: boolean }>({
    top: 0,
    left: 0,
    width: 0,
    dropUp: false,
  })
  const ref = useRef<HTMLDivElement>(null)
  const btnRef = useRef<HTMLButtonElement>(null)
  const selected = options.find((o) => o.value === value)
  useEffect(() => {
    if (!open) return
    const h = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false)
    }
    document.addEventListener('mousedown', h)
    return () => document.removeEventListener('mousedown', h)
  }, [open])
  const handleOpen = () => {
    if (!open && btnRef.current) {
      const rect = btnRef.current.getBoundingClientRect()
      const spaceBelow = window.innerHeight - rect.bottom
      const up = spaceBelow < 200
      setPos({
        top: up ? rect.top : rect.bottom + 4,
        left: rect.left,
        width: rect.width,
        dropUp: up,
      })
    }
    setOpen(!open)
  }
  return (
    <div ref={ref} style={{ position: 'relative' }}>
      <button
        ref={btnRef}
        type="button"
        onClick={handleOpen}
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
          width: '100%',
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
            position: 'fixed',
            top: pos.dropUp ? 'auto' : pos.top,
            bottom: pos.dropUp ? `${window.innerHeight - pos.top + 4}px` : 'auto',
            left: pos.left,
            width: pos.width,
            backgroundColor: t.bg.card,
            border: `1px solid ${t.border}`,
            borderRadius: 8,
            boxShadow: '0 8px 24px rgba(0,0,0,.3)',
            zIndex: 1100,
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
  const { t } = useApp()
  const [hi, setHi] = useState(null)
  return (
    <div
      style={{
        display: 'flex',
        gap: 1.5,
        alignItems: 'stretch',
        height: barHeight,
        width: '100%',
        minWidth: 0,
        overflow: 'hidden',
        position: 'relative',
      }}
    >
      {data.map((d, i) => {
        const s = typeof d === 'string' ? d : d.status
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
              backgroundColor: c,
              borderRadius: 2,
              opacity: h ? 1 : 0.75,
              transition: 'opacity .12s',
              cursor: 'pointer',
              minWidth: 0,
            }}
          />
        )
      })}
      {hi !== null && (
        <div
          style={{
            position: 'absolute',
            top: -30,
            left: `${(hi / data.length) * 100}%`,
            transform: 'translateX(-50%)',
            padding: '2px 8px',
            borderRadius: 4,
            fontSize: 11,
            fontFamily: F.mono,
            whiteSpace: 'nowrap',
            backgroundColor: t.bg.elevated,
            color: t.text.primary,
            border: `1px solid ${t.border}`,
            boxShadow: '0 2px 8px rgba(0,0,0,.2)',
            pointerEvents: 'none',
            zIndex: 10,
          }}
        >
          {typeof data[hi] === 'string' ? '' : data[hi].date}
        </div>
      )}
    </div>
  )
}

/* ================================================================
   Mini Chart
   ================================================================ */
function MiniChart({
  data,
  width = 200,
  chartHeight = 48,
  color,
  showAxis = false,
  interactive = false,
}) {
  const { t } = useApp()
  const c = color || t.status.up
  const maxVal = Math.max(...data.map((d) => d.p95))
  const minVal = Math.min(...data.map((d) => d.v))
  const range = maxVal - minVal || 1
  const pad = 4
  const leftPad = showAxis ? 32 : 0
  const plotW = width - leftPad
  const toY = (v) => chartHeight - pad - ((v - minVal) / range) * (chartHeight - pad * 2)
  const toX = (i) => leftPad + (i / (data.length - 1)) * plotW
  const line = data.map((d, i) => `${i === 0 ? 'M' : 'L'}${toX(i)},${toY(d.v)}`).join(' ')
  const p95Line = data.map((d, i) => `${i === 0 ? 'M' : 'L'}${toX(i)},${toY(d.p95)}`).join(' ')
  const area = `${line} L${toX(data.length - 1)},${chartHeight} L${leftPad},${chartHeight} Z`
  const gid = `g-${c.replace('#', '')}-${showAxis ? 'a' : 'b'}`
  const [hoverIdx, setHoverIdx] = useState<number | null>(null)
  const containerRef = useRef<HTMLDivElement>(null)

  const handleMouseMove = useCallback(
    (e: React.MouseEvent) => {
      if (!interactive || !containerRef.current) return
      const rect = containerRef.current.getBoundingClientRect()
      const xPct = (e.clientX - rect.left) / rect.width
      const idx = Math.round(xPct * (data.length - 1))
      setHoverIdx(Math.max(0, Math.min(data.length - 1, idx)))
    },
    [interactive, data.length],
  )

  const hd = hoverIdx !== null ? data[hoverIdx] : null
  const hoursAgo = hoverIdx !== null ? data.length - 1 - hoverIdx : 0

  return (
    <div
      ref={containerRef}
      style={{ position: 'relative' }}
      onMouseMove={handleMouseMove}
      onMouseLeave={() => setHoverIdx(null)}
    >
      <svg
        viewBox={`0 0 ${width} ${chartHeight}`}
        preserveAspectRatio="none"
        style={{ width: '100%', height: chartHeight, display: 'block' }}
      >
        <title>Latency Chart</title>
        <defs>
          <linearGradient id={gid} x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor={c} stopOpacity=".15" />
            <stop offset="100%" stopColor={c} stopOpacity="0" />
          </linearGradient>
        </defs>
        {showAxis && (
          <>
            <text
              x={leftPad - 4}
              y={toY(maxVal) + 3}
              textAnchor="end"
              fontSize="8"
              fill={t.text.muted}
              fontFamily={F.mono}
            >
              {maxVal}ms
            </text>
            <text
              x={leftPad - 4}
              y={toY(minVal) + 3}
              textAnchor="end"
              fontSize="8"
              fill={t.text.muted}
              fontFamily={F.mono}
            >
              {minVal}ms
            </text>
            <line
              x1={leftPad}
              y1={toY(maxVal)}
              x2={width}
              y2={toY(maxVal)}
              stroke={t.border}
              strokeWidth=".5"
              strokeDasharray="2,2"
            />
            <line
              x1={leftPad}
              y1={toY(minVal)}
              x2={width}
              y2={toY(minVal)}
              stroke={t.border}
              strokeWidth=".5"
              strokeDasharray="2,2"
            />
          </>
        )}
        <path d={area} fill={`url(#${gid})`} />
        <path
          d={p95Line}
          fill="none"
          stroke={c}
          strokeWidth="1"
          strokeDasharray="3,3"
          opacity=".3"
        />
        <path
          d={line}
          fill="none"
          stroke={c}
          strokeWidth="1.5"
          strokeLinejoin="round"
          strokeLinecap="round"
        />
        {interactive && hoverIdx !== null && (
          <>
            <line
              x1={toX(hoverIdx)}
              y1={0}
              x2={toX(hoverIdx)}
              y2={chartHeight}
              stroke={t.text.muted}
              strokeWidth=".5"
              strokeDasharray="3,3"
            />
            <circle
              cx={toX(hoverIdx)}
              cy={toY(data[hoverIdx].v)}
              r="3.5"
              fill={c}
              stroke={t.bg.card}
              strokeWidth="1.5"
            />
            <circle
              cx={toX(hoverIdx)}
              cy={toY(data[hoverIdx].p95)}
              r="2.5"
              fill="none"
              stroke={c}
              strokeWidth="1"
              opacity=".5"
            />
          </>
        )}
        {hoverIdx === null && (
          <circle
            cx={toX(data.length - 1)}
            cy={toY(data[data.length - 1].v)}
            r="2.5"
            fill={c}
            style={{ filter: `drop-shadow(0 0 3px ${c})` }}
          />
        )}
      </svg>
      {interactive && hd && hoverIdx !== null && (
        <div
          style={{
            position: 'absolute',
            top: -4,
            left: `${(hoverIdx / (data.length - 1)) * 100}%`,
            transform: `translateX(${hoverIdx > data.length * 0.7 ? '-100%' : '0'})`,
            backgroundColor: t.bg.card,
            border: `1px solid ${t.border}`,
            borderRadius: 6,
            padding: '6px 10px',
            fontSize: 11,
            fontFamily: F.mono,
            color: t.text.primary,
            pointerEvents: 'none',
            whiteSpace: 'nowrap',
            boxShadow: '0 2px 8px rgba(0,0,0,.15)',
            zIndex: 10,
          }}
        >
          <div style={{ fontSize: 10, color: t.text.muted, marginBottom: 3 }}>
            {hoursAgo === 0 ? 'now' : `${hoursAgo}h ago`}
          </div>
          <div style={{ display: 'flex', gap: 12 }}>
            <span>
              <span style={{ color: c }}>p50</span> {hd.v}ms
            </span>
            <span style={{ opacity: 0.6 }}>
              <span style={{ color: c }}>p95</span> {hd.p95}ms
            </span>
          </div>
        </div>
      )}
    </div>
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
          display: 'flex',
          flexDirection: 'column',
          animation: 'fadeSlide .2s ease',
        }}
      >
        <div
          style={{
            padding: '20px 24px 0',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            flexShrink: 0,
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
        <div style={{ padding: 24, overflow: 'auto', flex: 1 }}>{children}</div>
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
function OverviewCards({ svcs }) {
  const { t, i18n, rangeLabel } = useApp()
  const S = svcs
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
      color: up === total ? t.status.up : t.text.primary,
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
      label: i18n.probesSec.replace('{r}', rangeLabel),
      value: String(
        S.reduce((sum, s) => {
          const sec = Number.parseInt(s.interval) || 30
          return sum + Math.floor(86400 / sec)
        }, 0),
      ),
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
function ServiceRow({ svc, selected, onSelect }: { svc; selected: boolean; onSelect }) {
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
    <button
      type="button"
      className="svc-row"
      onClick={() => onSelect(svc.id)}
      onMouseEnter={() => setHov(true)}
      onMouseLeave={() => setHov(false)}
      style={{
        display: 'grid',
        gridTemplateColumns: 'minmax(140px,1.2fr) minmax(160px,2fr) 76px 70px 80px',
        alignItems: 'center',
        gap: 14,
        padding: '12px 20px',
        backgroundColor: selected ? t.accentMuted : hov ? t.bg.cardHover : 'transparent',
        borderRadius: R.sm,
        cursor: 'pointer',
        transition: 'background-color .15s',
        border: 'none',
        borderLeft: selected ? `2px solid ${t.accent}` : '2px solid transparent',
        width: '100%',
        textAlign: 'left',
        font: 'inherit',
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
      <div style={{ textAlign: 'center' }}>
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
      <div
        className="hide-mobile hide-tablet"
        style={{
          fontFamily: F.mono,
          fontSize: 12,
          color: svc.latency > 100 ? t.status.degraded : t.text.secondary,
          textAlign: 'center',
          fontFeatureSettings: "'tnum'",
        }}
      >
        {svc.latency}ms
      </div>
      <div
        style={{
          fontFamily: F.mono,
          fontWeight: 600,
          fontSize: 13,
          color: c,
          fontFeatureSettings: "'tnum'",
          textAlign: 'center',
        }}
      >
        {fmtSLA(svc.sla)}
        {svc.sla < svc.target && (
          <span style={{ display: 'block', fontSize: 10, color: t.status.down, fontWeight: 400 }}>
            {i18n.belowTarget}
          </span>
        )}
      </div>
    </button>
  )
}

function DetailPanel({ svc, totalSvcs = 0, onToggleMaintenance }) {
  const { t, i18n, lang, rangeLabel } = useApp()
  const [latencyOpen, setLatencyOpen] = useState(false)
  const [availOpen, setAvailOpen] = useState(false)
  const [incidentOpen, setIncidentOpen] = useState(false)
  const [maintModalOpen, setMaintModalOpen] = useState(false)
  const [endMaintConfirm, setEndMaintConfirm] = useState(false)
  const [logOpen, setLogOpen] = useState(false)
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
  const downTotalMin = ((100 - svc.sla) / 100) * 365 * 24 * 60
  const fmtDown = (m: number, isZh: boolean) => {
    if (m < 60) return `${Math.round(m)}${isZh ? '分' : 'min'}`
    const h = m / 60
    if (h < 24) return `${h.toFixed(1)}${isZh ? '小时' : 'h'}`
    const d = h / 24
    return `${d.toFixed(1)}${isZh ? '天' : 'd'}`
  }
  const downStr = fmtDown(downTotalMin, lang === 'zh')
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
          <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', marginTop: 6 }}>
            {!svc.maintenance && (
              <Btn small variant="ghost" onClick={() => setMaintModalOpen(true)}>
                {i18n.setMaintenance}
              </Btn>
            )}
            {svc.maintenance && (
              <Btn small variant="danger" onClick={() => setEndMaintConfirm(true)}>
                {i18n.endMaintenance}
              </Btn>
            )}
          </div>
        </div>
        <SLAGauge value={svc.sla} target={svc.target} size={92} />
      </div>
      {svc.maintenance && (
        <div
          style={{
            backgroundColor: `${t.status.maintenance}15`,
            border: `1px solid ${t.status.maintenance}30`,
            borderRadius: R.sm,
            padding: '10px 14px',
            marginBottom: 16,
            fontSize: 12,
          }}
        >
          <div style={{ color: t.status.maintenance, fontWeight: 600, marginBottom: 4 }}>
            {i18n.maintenanceActive}
          </div>
          {svc.maintenanceReason && (
            <div style={{ color: t.text.secondary, marginBottom: 2 }}>{svc.maintenanceReason}</div>
          )}
          <div
            style={{
              color: t.text.muted,
              fontFamily: F.mono,
              fontSize: 11,
              display: 'flex',
              flexDirection: 'column',
              gap: 2,
            }}
          >
            <span>
              {i18n.maintenanceSince}{' '}
              {new Date(svc.maintenanceStartAt).toLocaleString(undefined, {
                year: 'numeric',
                month: '2-digit',
                day: '2-digit',
                hour: '2-digit',
                minute: '2-digit',
              })}
            </span>
            {svc.maintenanceEndAt && (
              <span>
                {i18n.maintenanceUntil}{' '}
                {new Date(svc.maintenanceEndAt).toLocaleString(undefined, {
                  year: 'numeric',
                  month: '2-digit',
                  day: '2-digit',
                  hour: '2-digit',
                  minute: '2-digit',
                })}
              </span>
            )}
            {!svc.maintenanceEndAt && <span>{i18n.maintenanceManualEnd}</span>}
          </div>
        </div>
      )}
      {svc.maintenance &&
        (() => {
          const logs = [
            {
              time: '10:00',
              action: lang === 'zh' ? '维护窗口开始' : 'Maintenance window started',
            },
            { time: '10:02', action: lang === 'zh' ? '流量已切走' : 'Traffic drained' },
            {
              time: '10:05',
              action: lang === 'zh' ? '数据库备份完成' : 'Database backup completed',
            },
            {
              time: '10:12',
              action: lang === 'zh' ? '模式迁移执行中' : 'Schema migration running',
            },
            { time: '10:18', action: lang === 'zh' ? '索引重建中' : 'Index rebuild in progress' },
            { time: '10:25', action: lang === 'zh' ? '数据验证通过' : 'Data validation passed' },
            { time: '10:30', action: lang === 'zh' ? '缓存预热中' : 'Cache warming up' },
            {
              time: '10:35',
              action: lang === 'zh' ? '健康检查通过 (3/5)' : 'Health check passed (3/5)',
            },
            {
              time: '10:38',
              action: lang === 'zh' ? '等待剩余节点就绪' : 'Waiting for remaining nodes',
            },
            { time: '10:42', action: lang === 'zh' ? '全部节点就绪' : 'All nodes ready' },
            {
              time: '10:45',
              action: lang === 'zh' ? '灰度流量 10% 导入' : 'Canary traffic 10% routed',
            },
            { time: '10:50', action: lang === 'zh' ? '灰度验证正常' : 'Canary validation OK' },
          ]
          return (
            <div style={{ marginBottom: 16 }}>
              <button
                type="button"
                onClick={() => setLogOpen((p) => !p)}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  width: '100%',
                  background: 'none',
                  border: 'none',
                  cursor: 'pointer',
                  fontSize: 11,
                  color: t.text.muted,
                  fontWeight: 500,
                  padding: '0 0 8px',
                  textTransform: 'uppercase',
                  letterSpacing: '.04em',
                  fontFamily: F.sans,
                }}
              >
                <span>{lang === 'zh' ? '维护活动日志' : 'Maintenance Activity Log'}</span>
                <svg
                  width="12"
                  height="12"
                  viewBox="0 0 12 12"
                  fill="none"
                  style={{
                    transform: logOpen ? 'rotate(180deg)' : 'none',
                    transition: 'transform .2s',
                  }}
                >
                  <title>{logOpen ? 'Collapse' : 'Expand'}</title>
                  <path
                    d="M3 4.5L6 7.5L9 4.5"
                    stroke="currentColor"
                    strokeWidth="1.5"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                </svg>
              </button>
              {logOpen && (
                <div
                  style={{
                    backgroundColor: t.bg.input,
                    borderRadius: R.sm,
                    padding: '10px 14px',
                    fontSize: 12,
                  }}
                >
                  {logs.map((log, i) => (
                    <div
                      key={log.time}
                      style={{
                        display: 'flex',
                        gap: 10,
                        padding: '6px 0',
                        alignItems: 'center',
                        borderBottom: i < logs.length - 1 ? `1px solid ${t.borderSubtle}` : 'none',
                      }}
                    >
                      <span
                        style={{
                          fontFamily: F.mono,
                          fontSize: 11,
                          color: t.text.muted,
                          flexShrink: 0,
                          width: 42,
                        }}
                      >
                        {log.time}
                      </span>
                      <span
                        style={{
                          width: 6,
                          height: 6,
                          borderRadius: '50%',
                          backgroundColor: t.status.maintenance,
                          flexShrink: 0,
                        }}
                      />
                      <span style={{ color: t.text.secondary }}>{log.action}</span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )
        })()}
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
          { l: i18n.uptime90.replace('{n}', rangeLabel), v: fmtSLA(svc.sla), cl: c },
          {
            l: i18n.estDowntime,
            v: downStr,
            cl: downTotalMin > 60 ? t.status.down : t.text.primary,
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
                minHeight: 28,
                display: 'flex',
                alignItems: 'center',
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
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
          }}
        >
          {i18n.responseTime.replace('{n}', rangeLabel)}
          <button
            type="button"
            onClick={() => setLatencyOpen(true)}
            style={{
              background: 'none',
              border: `1px solid ${t.border}`,
              borderRadius: 6,
              padding: '2px 8px',
              fontSize: 10,
              color: t.text.secondary,
              cursor: 'pointer',
              fontFamily: F.sans,
              textTransform: 'none',
              letterSpacing: 0,
            }}
          >
            {i18n.details}
          </button>
        </div>
        <div
          style={{
            backgroundColor: t.bg.input,
            borderRadius: R.sm,
            position: 'relative',
            overflow: 'hidden',
            padding: '6px 0 0',
          }}
        >
          <div
            style={{
              position: 'absolute',
              top: 4,
              left: 8,
              fontSize: 9,
              fontFamily: F.mono,
              color: t.text.muted,
              pointerEvents: 'none',
              zIndex: 1,
            }}
          >
            {Math.max(...svc.ld.map((d) => d.p95))}ms
          </div>
          <div style={{ marginBottom: -6 }}>
            <MiniChart data={svc.ld} chartHeight={80} color={c} />
          </div>
          <div
            style={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              padding: '0 8px 6px',
              fontSize: 10,
              color: t.text.muted,
              fontFamily: F.mono,
              position: 'relative',
              zIndex: 1,
            }}
          >
            <span>{i18n.ago72.replace('{n}', rangeLabel)}</span>
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
      <div style={{ marginBottom: 24 }}>
        <div
          style={{
            fontSize: 11,
            color: t.text.muted,
            fontWeight: 500,
            marginBottom: 10,
            textTransform: 'uppercase',
            letterSpacing: '.04em',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
          }}
        >
          {i18n.availability.replace('{n}', rangeLabel)}
          <button
            type="button"
            onClick={() => setAvailOpen(true)}
            style={{
              background: 'none',
              border: `1px solid ${t.border}`,
              borderRadius: 6,
              padding: '2px 8px',
              fontSize: 10,
              color: t.text.secondary,
              cursor: 'pointer',
              fontFamily: F.sans,
              textTransform: 'none',
              letterSpacing: 0,
            }}
          >
            {i18n.details}
          </button>
        </div>
        <div
          style={{
            backgroundColor: t.bg.input,
            borderRadius: R.sm,
            padding: '16px 14px 12px',
            overflow: 'hidden',
          }}
        >
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
            <span>{i18n.ago90.replace('{n}', rangeLabel)}</span>
            <span>{i18n.today}</span>
          </div>
        </div>
      </div>
      {totalSvcs > PAGE_SIZE && (
        <div>
          <div
            style={{
              fontSize: 11,
              color: t.text.muted,
              fontWeight: 500,
              marginBottom: 10,
              textTransform: 'uppercase',
              letterSpacing: '.04em',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
            }}
          >
            {i18n.incidentHistory.replace('{n}', rangeLabel)}
            <button
              type="button"
              onClick={() => setIncidentOpen(true)}
              style={{
                background: 'none',
                border: `1px solid ${t.border}`,
                borderRadius: 6,
                padding: '2px 8px',
                fontSize: 10,
                color: t.text.secondary,
                cursor: 'pointer',
                fontFamily: F.sans,
                textTransform: 'none',
                letterSpacing: 0,
              }}
            >
              {i18n.details}
            </button>
          </div>
          <IncidentTimeline data={svc.bar} maxItems={3} />
        </div>
      )}
      <Modal
        open={latencyOpen}
        onClose={() => setLatencyOpen(false)}
        title={`${dn} — ${i18n.responseTime.replace('{n}', rangeLabel)}`}
        width={640}
      >
        <LatencyDetailModal data={svc.ld} color={c} />
      </Modal>
      <Modal
        open={availOpen}
        onClose={() => setAvailOpen(false)}
        title={`${dn} — ${i18n.availability.replace('{n}', rangeLabel)}`}
        width={640}
      >
        <AvailabilityDetailModal data={svc.bar} sla={svc.sla} target={svc.target} />
      </Modal>
      <Modal
        open={incidentOpen}
        onClose={() => setIncidentOpen(false)}
        title={`${dn} — ${i18n.incidentHistory.replace('{n}', rangeLabel)}`}
        width={640}
      >
        <IncidentDetailModal data={svc.bar} />
      </Modal>
      <Modal
        open={maintModalOpen}
        onClose={() => setMaintModalOpen(false)}
        title={i18n.setMaintenance}
      >
        <MaintenanceModal
          svc={svc}
          onConfirm={(data) => {
            onToggleMaintenance(svc.id, data)
            setMaintModalOpen(false)
          }}
        />
      </Modal>
      <Modal
        open={endMaintConfirm}
        onClose={() => setEndMaintConfirm(false)}
        title={i18n.endMaintenance}
        width={360}
      >
        <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          <p style={{ margin: 0, fontSize: 13, color: t.text.secondary }}>
            {i18n.confirmEndMaintenance}
          </p>
          <div style={{ display: 'flex', gap: 8, justifyContent: 'flex-end' }}>
            <Btn variant="ghost" onClick={() => setEndMaintConfirm(false)}>
              {i18n.cancel}
            </Btn>
            <Btn
              variant="danger"
              onClick={() => {
                onToggleMaintenance(svc.id, null)
                setEndMaintConfirm(false)
              }}
            >
              {i18n.confirm}
            </Btn>
          </div>
        </div>
      </Modal>
    </div>
  )
}

function LatencyDetailModal({ data, color }) {
  const { t, i18n, rangeLabel } = useApp()
  const vals = data.map((d) => d.v)
  const p95s = data.map((d) => d.p95)
  const avg = Math.round(vals.reduce((a, b) => a + b, 0) / vals.length)
  const minV = Math.min(...vals)
  const maxV = Math.max(...vals)
  const avgP95 = Math.round(p95s.reduce((a, b) => a + b, 0) / p95s.length)
  const current = vals[vals.length - 1]
  const stats = [
    { label: 'Current', value: `${current}ms` },
    { label: 'Avg (p50)', value: `${avg}ms` },
    { label: 'Min', value: `${minV}ms` },
    { label: 'Max', value: `${maxV}ms` },
    { label: 'Avg (p95)', value: `${avgP95}ms` },
  ]
  return (
    <div>
      <div
        style={{ display: 'grid', gridTemplateColumns: 'repeat(5, 1fr)', gap: 8, marginBottom: 20 }}
      >
        {stats.map((s) => (
          <div
            key={s.label}
            style={{
              backgroundColor: t.bg.input,
              borderRadius: R.sm,
              padding: '10px 12px',
              textAlign: 'center',
            }}
          >
            <div
              style={{
                fontSize: 10,
                color: t.text.muted,
                marginBottom: 4,
                textTransform: 'uppercase',
                letterSpacing: '.03em',
                minHeight: 28,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              {s.label}
            </div>
            <div
              style={{
                fontSize: 16,
                fontWeight: 700,
                fontFamily: F.mono,
                color: t.text.primary,
                fontFeatureSettings: "'tnum'",
              }}
            >
              {s.value}
            </div>
          </div>
        ))}
      </div>
      <div style={{ backgroundColor: t.bg.input, borderRadius: R.sm, padding: '16px 8px 8px' }}>
        <MiniChart data={data} chartHeight={120} color={color} showAxis interactive width={560} />
        <div
          style={{
            display: 'flex',
            justifyContent: 'space-between',
            marginTop: 6,
            fontSize: 10,
            color: t.text.muted,
            fontFamily: F.mono,
            padding: '0 4px',
          }}
        >
          <span>{i18n.ago72.replace('{n}', rangeLabel)}</span>
          <span style={{ display: 'flex', gap: 10 }}>
            <span style={{ display: 'inline-flex', alignItems: 'center', gap: 4 }}>
              <span
                style={{
                  width: 12,
                  height: 1.5,
                  backgroundColor: color,
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
                  borderTop: `1px dashed ${color}`,
                }}
              />{' '}
              p95
            </span>
          </span>
          <span>{i18n.now}</span>
        </div>
      </div>
    </div>
  )
}

function MaintenanceModal({ svc, onConfirm }) {
  const { t, i18n } = useApp()
  const [reason, setReason] = useState(svc.maintenanceReason || '')
  const [endAt, setEndAt] = useState('')
  const [notifyUsers, setNotifyUsers] = useState<string[]>(svc.maintenanceNotifyUsers || [])

  const handleSubmit = () => {
    onConfirm({
      maintenance: true,
      maintenanceReason: reason,
      maintenanceStartAt: new Date().toISOString(),
      maintenanceEndAt: endAt ? new Date(endAt).toISOString() : null,
      maintenanceOperator: 'user-1',
      maintenanceNotifyUsers: notifyUsers,
      status: 'maintenance',
    })
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
      <div>
        <span style={{ fontSize: 12, color: t.text.muted, display: 'block', marginBottom: 4 }}>
          {i18n.maintenanceReason}
        </span>
        <Input
          value={reason}
          onChange={setReason}
          placeholder={i18n.maintenanceReasonPlaceholder}
        />
      </div>
      <div>
        <span style={{ fontSize: 12, color: t.text.muted, display: 'block', marginBottom: 4 }}>
          {i18n.maintenanceEndTime}
        </span>
        <input
          type="datetime-local"
          value={endAt}
          onChange={(e) => {
            setEndAt(e.target.value)
          }}
          style={{
            width: '100%',
            padding: '8px 12px',
            borderRadius: 8,
            border: `1px solid ${t.border}`,
            backgroundColor: t.bg.input,
            color: t.text.primary,
            fontSize: 13,
            fontFamily: F.sans,
            outline: 'none',
          }}
        />
      </div>
      <div>
        <span style={{ fontSize: 12, color: t.text.muted, display: 'block', marginBottom: 8 }}>
          {i18n.maintenanceNotify}
        </span>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
          {mockUsers.map((u) => (
            <button
              type="button"
              key={u.id}
              onClick={() => {
                setNotifyUsers((prev) =>
                  prev.includes(u.id) ? prev.filter((id) => id !== u.id) : [...prev, u.id],
                )
              }}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: 8,
                fontSize: 13,
                color: t.text.primary,
                cursor: 'pointer',
                padding: '4px 8px',
                borderRadius: 6,
                backgroundColor: notifyUsers.includes(u.id) ? `${t.accent}18` : 'transparent',
                border: 'none',
                fontFamily: F.sans,
                width: '100%',
                textAlign: 'left',
              }}
            >
              <span
                style={{
                  width: 16,
                  height: 16,
                  borderRadius: 4,
                  border: `1.5px solid ${notifyUsers.includes(u.id) ? t.accent : t.border}`,
                  backgroundColor: notifyUsers.includes(u.id) ? t.accent : 'transparent',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  flexShrink: 0,
                }}
              >
                {notifyUsers.includes(u.id) && (
                  <svg width="10" height="10" viewBox="0 0 10 10" fill="none">
                    <title>Checked</title>
                    <path
                      d="M2 5l2.5 2.5L8 3"
                      stroke="#fff"
                      strokeWidth="1.5"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    />
                  </svg>
                )}
              </span>
              {u.name} <span style={{ color: t.text.muted, fontSize: 11 }}>({u.email})</span>
            </button>
          ))}
        </div>
      </div>
      <Btn variant="primary" onClick={handleSubmit} style={{ marginTop: 8 }}>
        {i18n.setMaintenance}
      </Btn>
    </div>
  )
}

function IncidentTimeline({ data, maxItems = 4 }) {
  const { t, i18n } = useApp()
  // Extract incidents: consecutive non-up days
  const incidents: { start: number; end: number; severity: string; date: string }[] = []
  let cur: { start: number; severity: string; date: string } | null = null
  for (let i = 0; i < data.length; i++) {
    const s = typeof data[i] === 'string' ? data[i] : data[i].status
    if (s !== 'up') {
      if (!cur) cur = { start: i, severity: s, date: data[i].date || `${i18n.day} ${i + 1}` }
      if (s === 'down') cur.severity = 'down'
    } else if (cur) {
      incidents.push({ ...cur, end: i - 1, date: cur.date })
      cur = null
    }
  }
  if (cur) incidents.push({ ...cur, end: data.length - 1, date: cur.date })
  const upDays = data.filter((d) => (typeof d === 'string' ? d : d.status) === 'up').length
  const sevLabel = { down: i18n.down, degraded: i18n.degraded, maintenance: i18n.maintenance }
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
      {incidents.length === 0 ? (
        <div
          style={{
            backgroundColor: t.bg.input,
            borderRadius: R.sm,
            fontSize: 12,
            color: t.text.muted,
            textAlign: 'center',
            padding: '14px 0',
          }}
        >
          {upDays}/{data.length} {i18n.daysClean}
        </div>
      ) : (
        <>
          {incidents.slice(0, maxItems).map((inc) => {
            const dur = inc.end - inc.start + 1
            return (
              <div
                key={inc.start}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: 10,
                  backgroundColor: t.bg.input,
                  borderRadius: R.sm,
                  padding: '10px 14px',
                  fontSize: 12,
                  fontFamily: F.mono,
                }}
              >
                <span
                  style={{
                    width: 8,
                    height: 8,
                    borderRadius: '50%',
                    backgroundColor: t.status[inc.severity],
                    flexShrink: 0,
                  }}
                />
                <span style={{ color: t.text.primary }}>{inc.date}</span>
                <span style={{ color: t.text.muted }}>
                  {dur}
                  {i18n.dUnit}
                </span>
                <span
                  style={{
                    marginLeft: 'auto',
                    fontSize: 10,
                    padding: '2px 8px',
                    borderRadius: 4,
                    backgroundColor: `${t.status[inc.severity]}18`,
                    color: t.status[inc.severity],
                    fontWeight: 600,
                  }}
                >
                  {sevLabel[inc.severity] || inc.severity}
                </span>
              </div>
            )
          })}
          {incidents.length > maxItems && (
            <div
              style={{ fontSize: 10, color: t.text.muted, textAlign: 'center', padding: '4px 0' }}
            >
              {i18n.nMore.replace('{n}', String(incidents.length - maxItems))}
            </div>
          )}
        </>
      )}
    </div>
  )
}

function AvailabilityDetailModal({ data, sla, target }) {
  const { t, i18n, rangeLabel } = useApp()
  const upDays = data.filter((d) => (typeof d === 'string' ? d : d.status) === 'up').length
  const degradedDays = data.filter(
    (d) => (typeof d === 'string' ? d : d.status) === 'degraded',
  ).length
  const downDays = data.filter((d) => (typeof d === 'string' ? d : d.status) === 'down').length
  const stats = [
    { label: 'SLA', value: `${sla.toFixed(2)}%`, cl: sla >= target ? t.status.up : t.status.down },
    { label: i18n.target, value: `${target}%`, cl: t.text.primary },
    { label: i18n.operational, value: `${upDays}d`, cl: t.status.up },
    { label: i18n.degraded, value: `${degradedDays}d`, cl: t.status.degraded },
    { label: i18n.down, value: `${downDays}d`, cl: t.status.down },
  ]
  return (
    <div>
      <div
        style={{ display: 'grid', gridTemplateColumns: 'repeat(5, 1fr)', gap: 8, marginBottom: 20 }}
      >
        {stats.map((s) => (
          <div
            key={s.label}
            style={{
              backgroundColor: t.bg.input,
              borderRadius: R.sm,
              padding: '10px 12px',
              textAlign: 'center',
            }}
          >
            <div
              style={{
                fontSize: 10,
                color: t.text.muted,
                marginBottom: 4,
                textTransform: 'uppercase',
                letterSpacing: '.03em',
                minHeight: 28,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              {s.label}
            </div>
            <div
              style={{
                fontSize: 16,
                fontWeight: 700,
                fontFamily: F.mono,
                color: s.cl,
                fontFeatureSettings: "'tnum'",
              }}
            >
              {s.value}
            </div>
          </div>
        ))}
      </div>
      <div
        style={{
          backgroundColor: t.bg.input,
          borderRadius: R.sm,
          padding: '16px 14px 12px',
          overflow: 'hidden',
        }}
      >
        <UptimeBar data={data} barHeight={40} />
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
          <span>{i18n.ago90.replace('{n}', rangeLabel)}</span>
          <span>{i18n.today}</span>
        </div>
      </div>
      <div style={{ marginTop: 16 }}>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', gap: 3 }}>
          {data.map((d, i) => {
            const s = typeof d === 'string' ? d : d.status
            return (
              <div
                key={`cell-${typeof d === 'string' ? i : d.date}`}
                title={typeof d === 'string' ? '' : `${d.date}: ${d.uptime?.toFixed(1)}%`}
                style={{
                  aspectRatio: '1',
                  borderRadius: 3,
                  backgroundColor: t.status[s],
                  opacity: 0.7,
                }}
              />
            )
          })}
        </div>
        <div
          style={{
            display: 'flex',
            justifyContent: 'flex-end',
            gap: 8,
            marginTop: 8,
            fontSize: 10,
            color: t.text.muted,
            fontFamily: F.mono,
          }}
        >
          <span style={{ display: 'inline-flex', alignItems: 'center', gap: 3 }}>
            <span
              style={{
                width: 8,
                height: 8,
                borderRadius: 2,
                backgroundColor: t.status.up,
                opacity: 0.7,
              }}
            />{' '}
            {i18n.operational}
          </span>
          <span style={{ display: 'inline-flex', alignItems: 'center', gap: 3 }}>
            <span
              style={{
                width: 8,
                height: 8,
                borderRadius: 2,
                backgroundColor: t.status.degraded,
                opacity: 0.7,
              }}
            />{' '}
            {i18n.degraded}
          </span>
          <span style={{ display: 'inline-flex', alignItems: 'center', gap: 3 }}>
            <span
              style={{
                width: 8,
                height: 8,
                borderRadius: 2,
                backgroundColor: t.status.down,
                opacity: 0.7,
              }}
            />{' '}
            {i18n.down}
          </span>
        </div>
      </div>
    </div>
  )
}

function IncidentDetailModal({ data }) {
  const { t, i18n, rangeLabel } = useApp()
  const [showCount, setShowCount] = useState(5)
  const incidents: {
    start: number
    end: number
    severity: string
    date: string
    endDate: string
  }[] = []
  let cur: { start: number; severity: string; date: string } | null = null
  for (let i = 0; i < data.length; i++) {
    const s = typeof data[i] === 'string' ? data[i] : data[i].status
    if (s !== 'up') {
      if (!cur) cur = { start: i, severity: s, date: data[i].date || '' }
      if (s === 'down') cur.severity = 'down'
    } else if (cur) {
      incidents.push({ ...cur, end: i - 1, endDate: data[i - 1].date || '' })
      cur = null
    }
  }
  if (cur)
    incidents.push({ ...cur, end: data.length - 1, endDate: data[data.length - 1].date || '' })

  const durations = incidents.map((inc) => inc.end - inc.start + 1)
  const avgDur = durations.length
    ? (durations.reduce((a, b) => a + b, 0) / durations.length).toFixed(1)
    : '0'
  const longest = durations.length ? Math.max(...durations) : 0
  const upDays = data.filter((d) => (typeof d === 'string' ? d : d.status) === 'up').length
  const sevLabel = { down: i18n.down, degraded: i18n.degraded, maintenance: i18n.maintenance }
  const visible = incidents.slice(0, showCount)
  const hasMore = incidents.length > showCount

  const stats = [
    { label: i18n.totalIncidents, value: `${incidents.length}` },
    { label: i18n.avgDuration, value: `${avgDur}${i18n.dUnit}` },
    { label: i18n.longestDown, value: `${longest}${i18n.dUnit}` },
    { label: i18n.daysClean, value: `${upDays}/${data.length}` },
  ]
  return (
    <div>
      <div
        style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 8, marginBottom: 20 }}
      >
        {stats.map((s) => (
          <div
            key={s.label}
            style={{
              backgroundColor: t.bg.input,
              borderRadius: R.sm,
              padding: '10px 12px',
              textAlign: 'center',
            }}
          >
            <div
              style={{
                fontSize: 10,
                color: t.text.muted,
                marginBottom: 4,
                textTransform: 'uppercase',
                letterSpacing: '.03em',
                minHeight: 28,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              {s.label}
            </div>
            <div
              style={{
                fontSize: 16,
                fontWeight: 700,
                fontFamily: F.mono,
                color: t.text.primary,
                fontFeatureSettings: "'tnum'",
              }}
            >
              {s.value}
            </div>
          </div>
        ))}
      </div>
      {incidents.length === 0 ? (
        <div style={{ textAlign: 'center', padding: 24, color: t.text.muted, fontSize: 13 }}>
          {i18n.noIncidents}
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
          {visible.map((inc) => {
            const dur = inc.end - inc.start + 1
            return (
              <div
                key={inc.start}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: 10,
                  backgroundColor: t.bg.input,
                  borderRadius: R.sm,
                  padding: '10px 14px',
                  fontSize: 12,
                  fontFamily: F.mono,
                }}
              >
                <span
                  style={{
                    width: 8,
                    height: 8,
                    borderRadius: '50%',
                    backgroundColor: t.status[inc.severity],
                    flexShrink: 0,
                  }}
                />
                <span style={{ color: t.text.primary }}>{inc.date}</span>
                {inc.date !== inc.endDate && (
                  <span style={{ color: t.text.muted }}>→ {inc.endDate}</span>
                )}
                <span style={{ color: t.text.muted }}>
                  {dur}
                  {i18n.dUnit}
                </span>
                <span
                  style={{
                    marginLeft: 'auto',
                    fontSize: 10,
                    padding: '2px 8px',
                    borderRadius: 4,
                    backgroundColor: `${t.status[inc.severity]}18`,
                    color: t.status[inc.severity],
                    fontWeight: 600,
                  }}
                >
                  {sevLabel[inc.severity] || inc.severity}
                </span>
              </div>
            )
          })}
          {hasMore && (
            <button
              type="button"
              onClick={() => setShowCount((c) => c + 5)}
              style={{
                background: 'none',
                border: `1px dashed ${t.border}`,
                borderRadius: R.sm,
                padding: '10px 0',
                fontSize: 12,
                color: t.text.secondary,
                cursor: 'pointer',
                fontFamily: F.sans,
                transition: 'border-color .2s, color .2s',
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.borderColor = t.accent
                e.currentTarget.style.color = t.accent
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.borderColor = t.border
                e.currentTarget.style.color = t.text.secondary
              }}
            >
              {i18n.loadMore} ({incidents.length - showCount})
            </button>
          )}
        </div>
      )}
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
  const { t, i18n, lang } = useApp()
  const [form, setForm] = useState(
    probe || {
      name: '',
      type: 'http',
      url: '',
      interval: '60s',
      timeout: '5s',
      regions: ['zhangjiakou', 'shenzhen', 'shanghai'],
      desc: '',
      mode: 'server',
      target: 99,
    },
  )
  const upd = (k, v) => setForm((p) => ({ ...p, [k]: v }))
  const nameError = form.name.length > 32
  const isClient = form.mode === 'client'

  const serverTypeOpts = [
    { value: 'http', label: 'HTTP(S)' },
    { value: 'websocket', label: 'WebSocket' },
    { value: 'tcp', label: 'TCP' },
  ]
  const intervalOpts = [
    { value: '10s', label: '10s' },
    { value: '30s', label: '30s' },
    { value: '60s', label: '60s' },
    { value: '300s', label: '5m' },
    { value: '600s', label: '10m' },
    { value: '3600s', label: '1h' },
  ]
  const timeoutOpts = [
    { value: '3s', label: '3s' },
    { value: '5s', label: '5s' },
    { value: '8s', label: '8s' },
  ]
  const modeOpts = [
    { value: 'server', label: i18n.serverProbes },
    { value: 'client', label: i18n.clientProbes },
  ]

  // When switching to client mode, force type to push
  const handleModeChange = (v: string) => {
    upd('mode', v)
    if (v === 'client') upd('type', 'push')
    else if (form.type === 'push') upd('type', 'http')
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
      <div>
        <span
          style={{
            fontSize: 12,
            color: nameError ? t.status.down : t.text.muted,
            display: 'block',
            marginBottom: 4,
          }}
        >
          {i18n.probeName}
        </span>
        <Input
          value={form.name}
          onChange={(v) => upd('name', v)}
          placeholder={lang === 'zh' ? '测试服务' : 'Test Service'}
          maxLength={32}
        />
        {nameError && (
          <span style={{ fontSize: 11, color: t.status.down, marginTop: 4, display: 'block' }}>
            {i18n.nameTooLong}
          </span>
        )}
      </div>
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
        <div>
          <span style={{ fontSize: 12, color: t.text.muted, display: 'block', marginBottom: 4 }}>
            {i18n.probeMode}
          </span>
          <Select value={form.mode} onChange={handleModeChange} options={modeOpts} />
        </div>
        <div>
          <span style={{ fontSize: 12, color: t.text.muted, display: 'block', marginBottom: 4 }}>
            {i18n.probeType}
          </span>
          {isClient ? (
            <div
              style={{
                padding: '8px 12px',
                backgroundColor: t.bg.input,
                border: `1px solid ${t.border}`,
                borderRadius: 8,
                fontSize: 13,
                color: t.text.muted,
                fontFamily: F.sans,
              }}
            >
              Push
            </div>
          ) : (
            <Select value={form.type} onChange={(v) => upd('type', v)} options={serverTypeOpts} />
          )}
        </div>
      </div>
      <div>
        <span style={{ fontSize: 12, color: t.text.muted, display: 'block', marginBottom: 4 }}>
          {i18n.probeUrl}
        </span>
        {isClient ? (
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: 8,
            }}
          >
            <div
              style={{
                flex: 1,
                padding: '8px 12px',
                backgroundColor: t.bg.input,
                border: `1px solid ${t.border}`,
                borderRadius: 8,
                fontSize: 13,
                color: t.text.muted,
                fontFamily: F.mono,
                userSelect: 'all',
              }}
            >
              https://pulse.longye.site/metrics/push
            </div>
            <a
              href="https://www.baidu.com"
              target="_blank"
              rel="noopener noreferrer"
              title={lang === 'zh' ? '查看接入文档' : 'View integration docs'}
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                width: 32,
                height: 32,
                borderRadius: 6,
                backgroundColor: t.bg.input,
                border: `1px solid ${t.border}`,
                color: t.text.muted,
                textDecoration: 'none',
                flexShrink: 0,
                transition: 'color .15s',
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.color = t.accent
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.color = t.text.muted
              }}
            >
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
                <title>{lang === 'zh' ? '查看接入文档' : 'View integration docs'}</title>
                <path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6" />
                <polyline points="15 3 21 3 21 9" />
                <line x1="10" y1="14" x2="21" y2="3" />
              </svg>
            </a>
          </div>
        ) : (
          <Input
            value={form.url}
            onChange={(v) => upd('url', v)}
            placeholder={
              form.type === 'websocket'
                ? 'wss://api.example.com/ws'
                : form.type === 'tcp'
                  ? 'api.example.com:3306'
                  : 'https://api.example.com/health'
            }
          />
        )}
      </div>
      <div>
        <span style={{ fontSize: 12, color: t.text.muted, display: 'block', marginBottom: 4 }}>
          {i18n.probeInterval}
        </span>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 6 }}>
          {intervalOpts.map((o) => (
            <button
              type="button"
              key={o.value}
              onClick={() => upd('interval', o.value)}
              style={{
                padding: '6px 0',
                borderRadius: 6,
                fontSize: 12,
                fontFamily: F.mono,
                cursor: 'pointer',
                border: `1px solid ${o.value === form.interval ? `${t.accent}55` : t.border}`,
                backgroundColor: o.value === form.interval ? t.accentMuted : 'transparent',
                color: o.value === form.interval ? t.text.primary : t.text.secondary,
                transition: 'all .15s',
              }}
            >
              {o.label}
            </button>
          ))}
        </div>
      </div>
      <div>
        <span style={{ fontSize: 12, color: t.text.muted, display: 'block', marginBottom: 4 }}>
          {i18n.probeRegion}
        </span>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 6 }}>
          {[
            { value: 'zhangjiakou', label: i18n.regionZjk },
            { value: 'shenzhen', label: i18n.regionSz },
            { value: 'shanghai', label: i18n.regionSh },
            { value: 'hongkong', label: i18n.regionHk },
            { value: 'sea', label: i18n.regionSea },
            { value: 'eu', label: i18n.regionEu },
            { value: 'us-east', label: i18n.regionUsEast },
            { value: 'us-west', label: i18n.regionUsWest },
          ].map((o) => {
            const selected = (form.regions || []).includes(o.value)
            return (
              <button
                type="button"
                key={o.value}
                onClick={() => {
                  const cur: string[] = form.regions || []
                  const next = selected ? cur.filter((r) => r !== o.value) : [...cur, o.value]
                  if (next.length > 0) upd('regions', next)
                }}
                style={{
                  padding: '6px 0',
                  borderRadius: 6,
                  fontSize: 12,
                  fontFamily: F.sans,
                  cursor: 'pointer',
                  border: `1px solid ${selected ? `${t.accent}55` : t.border}`,
                  backgroundColor: selected ? t.accentMuted : 'transparent',
                  color: selected ? t.text.primary : t.text.secondary,
                  transition: 'all .15s',
                }}
              >
                {o.label}
              </button>
            )
          })}
        </div>
        <div style={{ marginTop: 4, display: 'flex', flexDirection: 'column', gap: 4 }}>
          <div
            style={{
              padding: '6px 10px',
              borderRadius: 6,
              fontSize: 11,
              lineHeight: 1.5,
              color: t.text.muted,
              backgroundColor: t.bg.input,
            }}
          >
            {i18n.regionDomesticHint}
          </div>
          {(form.regions || []).some((r) =>
            ['hongkong', 'sea', 'eu', 'us-east', 'us-west'].includes(r),
          ) && (
            <div
              style={{
                padding: '6px 10px',
                borderRadius: 6,
                fontSize: 11,
                lineHeight: 1.5,
                color: t.status.down,
                backgroundColor: `${t.status.down}12`,
                border: `1px solid ${t.status.down}25`,
              }}
            >
              {i18n.regionOverseasWarn}
            </div>
          )}
        </div>
      </div>
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
        <div>
          <span style={{ fontSize: 12, color: t.text.muted, display: 'block', marginBottom: 4 }}>
            {i18n.probeTimeout}
          </span>
          <Select value={form.timeout} onChange={(v) => upd('timeout', v)} options={timeoutOpts} />
        </div>
        <div>
          <span style={{ fontSize: 12, color: t.text.muted, display: 'block', marginBottom: 4 }}>
            {i18n.slaTarget}
          </span>
          <Input
            value={String(form.target ?? 99)}
            onChange={(v) => {
              const filtered = v.replace(/[^0-9.]/g, '')
              if (filtered.length <= 5) upd('target', filtered)
            }}
            placeholder="99.9"
            maxLength={5}
          />
        </div>
      </div>
      <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 8, marginTop: 8 }}>
        <Btn variant="ghost" onClick={onCancel}>
          {i18n.cancel}
        </Btn>
        <Btn
          variant="primary"
          disabled={nameError || !form.name}
          onClick={() =>
            onSave({
              ...form,
              id: form.id || uid(),
              status: form.status || 'up',
              desc: form.type,
              target: Number(form.target) || 99,
            })
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
  const [probes, setProbes] = useState(allProbes)
  const [modal, setModal] = useState<{ type: string; probe?: (typeof allProbes)[number] } | null>(
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

  const [probeTab, setProbeTab] = useState<'server' | 'client'>('server')
  const visibleProbes = probeTab === 'server' ? serverProbes : clientProbes
  const [probePage, setProbePage] = useState(1)
  const pagedProbes = visibleProbes.slice((probePage - 1) * PAGE_SIZE, probePage * PAGE_SIZE)

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
        <div
          style={{
            display: 'flex',
            gap: 0,
            borderRadius: 8,
            overflow: 'hidden',
            border: `1px solid ${t.border}`,
          }}
        >
          {[
            { key: 'server' as const, label: i18n.serverProbes },
            { key: 'client' as const, label: i18n.clientProbes },
          ].map((tb) => (
            <button
              type="button"
              key={tb.key}
              onClick={() => {
                setProbeTab(tb.key)
                setProbePage(1)
              }}
              style={{
                padding: '6px 16px',
                fontSize: 12,
                fontWeight: 600,
                fontFamily: F.sans,
                cursor: 'pointer',
                border: 'none',
                backgroundColor: probeTab === tb.key ? t.accent : 'transparent',
                color: probeTab === tb.key ? '#fff' : t.text.secondary,
                transition: 'all .15s',
              }}
            >
              {tb.label}
            </button>
          ))}
        </div>
        <Btn
          variant="primary"
          onClick={() =>
            setModal({
              type: 'add',
              probe:
                probeTab === 'client'
                  ? {
                      id: '',
                      name: '',
                      type: 'push',
                      url: '',
                      interval: '30s',
                      timeout: '5s',
                      desc: '',
                      mode: 'client',
                      status: 'up',
                    }
                  : undefined,
            })
          }
        >
          + {i18n.addProbe}
        </Btn>
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
        {pagedProbes.map((p) => (
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
        {visibleProbes.length === 0 && (
          <div style={{ textAlign: 'center', padding: 40, color: t.text.muted, fontSize: 13 }}>
            {probeTab === 'server' ? i18n.serverProbes : i18n.clientProbes} — {'No data'}
          </div>
        )}
      </div>
      <Pagination
        total={visibleProbes.length}
        page={probePage}
        pageSize={PAGE_SIZE}
        onPageChange={setProbePage}
      />

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
   EVENTS PAGE — incidents, alerts, push diagnostics
   ================================================================ */
function PushCapRow({
  label,
  value,
  ok,
  t,
}: { label: string; value: string; ok: boolean; t: (typeof themes)['dark'] }) {
  return (
    <div
      style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        padding: '10px 0',
        borderBottom: `1px solid ${t.borderSubtle}`,
      }}
    >
      <span style={{ fontSize: 12, fontFamily: F.mono, color: t.text.secondary }}>{label}</span>
      <span
        style={{
          fontSize: 11,
          fontWeight: 600,
          fontFamily: F.mono,
          padding: '3px 10px',
          borderRadius: 6,
          color: ok ? t.status.up : t.text.muted,
          backgroundColor: ok ? `${t.status.up}12` : `${t.text.muted}10`,
          border: `1px solid ${ok ? `${t.status.up}25` : `${t.text.muted}15`}`,
        }}
      >
        {value}
      </span>
    </div>
  )
}

function EventsPage({ isPWA }: { isPWA: boolean }) {
  const { t, i18n } = useApp()

  // ── Capability detection ──
  const hasNotifAPI = typeof Notification !== 'undefined'
  const hasPushManager = 'PushManager' in window
  const hasSW = 'serviceWorker' in navigator
  const isSecure = window.isSecureContext
  const isStandalone =
    window.matchMedia('(display-mode: standalone)').matches ||
    (navigator as unknown as { standalone?: boolean }).standalone === true
  const isIOS = /iPad|iPhone|iPod/.test(navigator.userAgent)

  // ── Platform detection (navigator.platform lies on Apple Silicon) ──
  const [platformLabel, setPlatformLabel] = useState(() => {
    if (isIOS) return 'iOS'
    const ua = navigator.userAgent
    if (/Android/.test(ua)) return 'Android'
    if (/Mac/.test(ua)) return 'macOS'
    if (/Win/.test(ua)) return 'Windows'
    if (/Linux/.test(ua)) return 'Linux'
    return navigator.platform
  })
  useEffect(() => {
    const uad = (
      navigator as unknown as {
        userAgentData?: {
          getHighEntropyValues?: (
            h: string[],
          ) => Promise<{ architecture?: string; platform?: string }>
        }
      }
    ).userAgentData
    if (uad?.getHighEntropyValues) {
      uad
        .getHighEntropyValues(['architecture', 'platform'])
        .then((v) => {
          const arch = v.architecture === 'arm' ? 'Apple Silicon' : v.architecture || ''
          const plat = v.platform || platformLabel
          setPlatformLabel(arch ? `${plat} (${arch})` : plat)
        })
        .catch(() => {
          /* noop */
        })
    }
  }, [platformLabel])

  // ── Permission state ──
  const [permission, setPermission] = useState<string>(() =>
    hasNotifAPI ? Notification.permission : 'unavailable',
  )
  const [toast, setToast] = useState<string | null>(null)

  const flash = useCallback((m: string) => {
    setToast(m)
    setTimeout(() => setToast(null), 3000)
  }, [])

  const handleRequestPermission = useCallback(async () => {
    if (!hasNotifAPI) {
      flash(i18n.pushNotSupported)
      return
    }
    const result = await Notification.requestPermission()
    setPermission(result)
    if (result === 'denied') {
      flash(i18n.pushBlocked)
    }
  }, [hasNotifAPI, flash, i18n.pushNotSupported, i18n.pushBlocked])

  const handleTestPush = useCallback(() => {
    if (!hasNotifAPI || Notification.permission !== 'granted') {
      flash(permission === 'denied' ? i18n.pushBlocked : i18n.pushNotSupported)
      return
    }
    new Notification(i18n.testPushTitle, {
      body: i18n.testPushBody,
      icon: '/icon-192.png',
      badge: '/favicon.png',
    })
    flash(i18n.pushSent)
  }, [hasNotifAPI, permission, flash, i18n])

  // Permission color mapping
  const permColor =
    permission === 'granted'
      ? t.status.up
      : permission === 'denied'
        ? t.status.down
        : t.status.degraded
  const permLabel =
    permission === 'granted'
      ? i18n.permGranted
      : permission === 'denied'
        ? i18n.permDenied
        : permission === 'default'
          ? i18n.permDefault
          : i18n.permUnavailable

  const cardStyle: React.CSSProperties = {
    backgroundColor: t.bg.card,
    borderRadius: R.lg,
    border: `1px solid ${t.border}`,
    boxShadow: t.shadow,
    padding: '24px',
    marginBottom: 16,
  }

  const sectionTitle: React.CSSProperties = {
    fontSize: 14,
    fontWeight: 700,
    fontFamily: F.display,
    color: t.text.primary,
    letterSpacing: '-.01em',
    marginBottom: 4,
  }

  return (
    <div style={{ paddingBottom: isPWA ? 32 : 0 }}>
      {/* ── Push Diagnostics ── */}
      <div style={cardStyle}>
        <div style={{ marginBottom: 20 }}>
          <h2 style={sectionTitle}>{i18n.pushDiagnostics}</h2>
          <p style={{ fontSize: 12, color: t.text.muted, margin: 0, lineHeight: 1.5 }}>
            {i18n.pushDiagHint}
          </p>
        </div>

        <div
          className="resp-cols"
          style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 16 }}
        >
          {/* Column 1: Capability */}
          <div
            style={{
              backgroundColor: t.bg.base,
              borderRadius: R.md,
              padding: '16px 18px',
              border: `1px solid ${t.borderSubtle}`,
            }}
          >
            <div
              style={{
                fontSize: 10,
                fontWeight: 600,
                textTransform: 'uppercase',
                letterSpacing: '.08em',
                color: t.text.muted,
                marginBottom: 12,
                fontFamily: F.mono,
              }}
            >
              {i18n.pushCapability}
            </div>
            <PushCapRow
              label={i18n.notificationApi}
              value={hasNotifAPI ? i18n.supported : i18n.notSupported}
              ok={hasNotifAPI}
              t={t}
            />
            <PushCapRow
              label={i18n.pushManagerApi}
              value={hasPushManager ? i18n.supported : i18n.notSupported}
              ok={hasPushManager}
              t={t}
            />
            <PushCapRow
              label={i18n.serviceWorkerApi}
              value={hasSW ? i18n.supported : i18n.notSupported}
              ok={hasSW}
              t={t}
            />
          </div>

          {/* Column 2: Permission & Actions */}
          <div
            style={{
              backgroundColor: t.bg.base,
              borderRadius: R.md,
              padding: '16px 18px',
              border: `1px solid ${t.borderSubtle}`,
            }}
          >
            <div
              style={{
                fontSize: 10,
                fontWeight: 600,
                textTransform: 'uppercase',
                letterSpacing: '.08em',
                color: t.text.muted,
                marginBottom: 12,
                fontFamily: F.mono,
              }}
            >
              {i18n.pushPermission}
            </div>

            {/* Current status */}
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: 10,
                padding: '12px 14px',
                borderRadius: 8,
                backgroundColor: `${permColor}08`,
                border: `1px solid ${permColor}20`,
                marginBottom: 14,
              }}
            >
              <span
                style={{
                  width: 10,
                  height: 10,
                  borderRadius: '50%',
                  backgroundColor: permColor,
                  boxShadow: `0 0 8px ${permColor}60`,
                  flexShrink: 0,
                }}
              />
              <span style={{ fontSize: 13, fontWeight: 600, color: permColor }}>{permLabel}</span>
            </div>

            {/* Denied warning */}
            {permission === 'denied' && (
              <div
                style={{
                  fontSize: 11,
                  color: t.status.down,
                  lineHeight: 1.5,
                  marginBottom: 14,
                  padding: '8px 10px',
                  borderRadius: 6,
                  backgroundColor: `${t.status.down}08`,
                  border: `1px solid ${t.status.down}15`,
                }}
              >
                {i18n.deniedNote}
              </div>
            )}

            {/* iOS note */}
            {isIOS && !isStandalone && (
              <div
                style={{
                  fontSize: 11,
                  color: t.status.degraded,
                  lineHeight: 1.5,
                  marginBottom: 14,
                  padding: '8px 10px',
                  borderRadius: 6,
                  backgroundColor: `${t.status.degraded}08`,
                  border: `1px solid ${t.status.degraded}15`,
                }}
              >
                {i18n.iosNote}
              </div>
            )}

            {/* Action buttons */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              {permission === 'default' && (
                <Btn onClick={handleRequestPermission}>{i18n.requestPermission}</Btn>
              )}
              <Btn
                variant={permission === 'granted' ? 'default' : 'ghost'}
                onClick={handleTestPush}
                disabled={permission !== 'granted'}
              >
                {i18n.sendTestPush}
              </Btn>
            </div>
          </div>

          {/* Column 3: Environment */}
          <div
            style={{
              backgroundColor: t.bg.base,
              borderRadius: R.md,
              padding: '16px 18px',
              border: `1px solid ${t.borderSubtle}`,
            }}
          >
            <div
              style={{
                fontSize: 10,
                fontWeight: 600,
                textTransform: 'uppercase',
                letterSpacing: '.08em',
                color: t.text.muted,
                marginBottom: 12,
                fontFamily: F.mono,
              }}
            >
              {i18n.envInfo}
            </div>
            <PushCapRow
              label="Mode"
              value={isStandalone ? i18n.envStandalone : i18n.envBrowser}
              ok={isStandalone}
              t={t}
            />
            <PushCapRow
              label="Context"
              value={isSecure ? i18n.envSecure : i18n.envInsecure}
              ok={isSecure}
              t={t}
            />
            <PushCapRow label="Platform" value={platformLabel} ok t={t} />

            <div
              style={{
                marginTop: 12,
                padding: '8px 10px',
                borderRadius: 6,
                backgroundColor: t.bg.input,
                border: `1px solid ${t.borderSubtle}`,
              }}
            >
              <div
                style={{
                  fontSize: 10,
                  fontWeight: 500,
                  color: t.text.muted,
                  marginBottom: 4,
                  fontFamily: F.mono,
                }}
              >
                User-Agent
              </div>
              <div
                style={{
                  fontSize: 10,
                  color: t.text.secondary,
                  fontFamily: F.mono,
                  lineHeight: 1.5,
                  wordBreak: 'break-all',
                }}
              >
                {navigator.userAgent}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* ── Incident Log (placeholder) ── */}
      <div style={cardStyle}>
        <h2 style={sectionTitle}>{i18n.incidentLog}</h2>
        <p style={{ fontSize: 12, color: t.text.muted, margin: '4px 0 0', lineHeight: 1.5 }}>
          {i18n.incidentLogHint}
        </p>
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            padding: '48px 0',
            color: t.text.muted,
            fontSize: 13,
          }}
        >
          <div style={{ textAlign: 'center' }}>
            <svg
              width="40"
              height="40"
              viewBox="0 0 24 24"
              fill="none"
              stroke={t.text.muted}
              strokeWidth="1.2"
              strokeLinecap="round"
              strokeLinejoin="round"
              style={{ opacity: 0.4, marginBottom: 12 }}
            >
              <title>No events</title>
              <path d="M18 8A6 6 0 006 8c0 7-3 9-3 9h18s-3-2-3-9" />
              <path d="M13.73 21a2 2 0 01-3.46 0" />
              <line x1="1" y1="1" x2="23" y2="23" />
            </svg>
            <div>{i18n.noEvents}</div>
          </div>
        </div>
      </div>

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

function SettingsRow({
  label,
  hint,
  children,
}: { label: string; hint: React.ReactNode; children: React.ReactNode }) {
  const { t } = useApp()
  return (
    <div className="settings-row">
      <div>
        <SettingsLabel t={t}>{label}</SettingsLabel>
        <SettingsHint t={t}>{hint}</SettingsHint>
      </div>
      <div>{children}</div>
    </div>
  )
}

function SiteNotifSection({ t, i18n, siteNotif, onNotifChange, isPWA }) {
  const [msg, setMsg] = useState(siteNotif?.message || '')
  const [type, setType] = useState<'info' | 'warning' | 'critical'>(siteNotif?.type || 'info')
  const [pushStatus, setPushStatus] = useState<'idle' | 'granted' | 'denied'>(() =>
    typeof Notification !== 'undefined' && Notification.permission === 'granted'
      ? 'granted'
      : 'idle',
  )

  const handlePublish = () => {
    if (!msg.trim()) return
    onNotifChange({ message: msg.trim(), type })
    // PWA: send native notification
    if (isPWA && typeof Notification !== 'undefined' && Notification.permission === 'granted') {
      new Notification('Pulse', { body: msg.trim(), icon: '/icon-192.png', badge: '/favicon.png' })
    }
  }
  const handleClear = () => {
    onNotifChange(null)
    setMsg('')
  }
  const handleEnablePush = async () => {
    if (typeof Notification === 'undefined') return
    const perm = await Notification.requestPermission()
    setPushStatus(perm === 'granted' ? 'granted' : 'denied')
  }

  const typeOpts = [
    { value: 'info', label: i18n.notifTypeInfo, color: '#3b82f6' },
    { value: 'warning', label: i18n.notifTypeWarning, color: '#f59e0b' },
    { value: 'critical', label: i18n.notifTypeCritical, color: '#ef4444' },
  ]

  return (
    <SettingsSection t={t}>
      <SettingsRow label={i18n.siteNotification} hint={i18n.siteNotifHint}>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          <div>
            <div style={{ fontSize: 11, color: t.text.muted, fontWeight: 500, marginBottom: 6 }}>
              {i18n.notifMessage}
            </div>
            <Input value={msg} onChange={setMsg} placeholder={i18n.notifMessagePlaceholder} />
          </div>
          <div>
            <div style={{ fontSize: 11, color: t.text.muted, fontWeight: 500, marginBottom: 6 }}>
              {i18n.notifType}
            </div>
            <div style={{ display: 'flex', gap: 6 }}>
              {typeOpts.map((o) => (
                <button
                  type="button"
                  key={o.value}
                  onClick={() => setType(o.value as 'info' | 'warning' | 'critical')}
                  style={{
                    padding: '5px 12px',
                    fontSize: 11,
                    fontWeight: 500,
                    fontFamily: F.sans,
                    borderRadius: 6,
                    cursor: 'pointer',
                    transition: 'all .15s',
                    border: type === o.value ? `1.5px solid ${o.color}` : `1px solid ${t.border}`,
                    backgroundColor: type === o.value ? `${o.color}18` : 'transparent',
                    color: type === o.value ? o.color : t.text.muted,
                  }}
                >
                  {o.label}
                </button>
              ))}
            </div>
          </div>
          <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
            <Btn small onClick={handlePublish} disabled={!msg.trim()}>
              {i18n.publishNotif}
            </Btn>
            {siteNotif && (
              <Btn small variant="ghost" onClick={handleClear}>
                {i18n.clearNotif}
              </Btn>
            )}
            {isPWA && pushStatus !== 'granted' && (
              <Btn small variant="ghost" onClick={handleEnablePush}>
                {pushStatus === 'denied' ? i18n.pushDenied : i18n.enablePush}
              </Btn>
            )}
            {isPWA && pushStatus === 'granted' && (
              <span
                style={{
                  fontSize: 11,
                  color: t.status.up,
                  display: 'flex',
                  alignItems: 'center',
                  gap: 4,
                }}
              >
                ✓ {i18n.pushEnabled}
              </span>
            )}
          </div>
          {siteNotif && (
            <div
              style={{
                padding: '8px 12px',
                borderRadius: 6,
                fontSize: 11,
                backgroundColor: { info: '#3b82f618', warning: '#f59e0b18', critical: '#ef444418' }[
                  siteNotif.type
                ],
                border: `1px solid ${{ info: '#3b82f633', warning: '#f59e0b33', critical: '#ef444433' }[siteNotif.type]}`,
                color: { info: '#3b82f6', warning: '#f59e0b', critical: '#ef4444' }[siteNotif.type],
              }}
            >
              {i18n.notifTypeInfo === 'Info' ? 'Active' : '当前'}: {siteNotif.message}
            </div>
          )}
        </div>
      </SettingsRow>
    </SettingsSection>
  )
}

function SettingsPage({ projectName, setProjectName, siteNotif, onNotifChange, isPWA }) {
  const { t, i18n } = useApp()
  const [retention, setRetention] = useState('90d')
  const [slaWindow, setSlaWindow] = useState('30d')
  const [timezone, setTimezone] = useState('UTC')
  const [saveState, setSaveState] = useState('idle')
  const [showAdvanced, setShowAdvanced] = useState(false)

  const handleSave = useCallback(() => {
    setSaveState('saving')
    setTimeout(() => {
      setSaveState('saved')
      setTimeout(() => setSaveState('idle'), 1800)
    }, 1200)
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

      {/* Site Notification */}
      <SiteNotifSection
        t={t}
        i18n={i18n}
        siteNotif={siteNotif}
        onNotifChange={onNotifChange}
        isPWA={isPWA}
      />

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
    </div>
  )
}

/* ================================================================
   WebhookModal
   ================================================================ */
function WebhookModal({ open, onClose }: { open: boolean; onClose: () => void }) {
  const { t, i18n } = useApp()
  const [webhookUrl, setWebhookUrl] = useState('')
  const [webhookTested, setWebhookTested] = useState<string | null>(null)
  const [webhookError, setWebhookError] = useState('')
  const [showPayload, setShowPayload] = useState(false)
  const [saveState, setSaveState] = useState('idle')

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

  const handleSave = useCallback(() => {
    setSaveState('saving')
    setTimeout(() => {
      setSaveState('saved')
      setTimeout(() => {
        setSaveState('idle')
        onClose()
      }, 1200)
    }, 1000)
  }, [onClose])

  return (
    <Modal open={open} onClose={onClose} title={i18n.webhookNotif} width={520}>
      <div style={{ padding: '16px 24px 24px' }}>
        <p style={{ color: t.text.secondary, fontSize: 13, margin: '0 0 16px', lineHeight: 1.6 }}>
          {i18n.webhookHint}
        </p>

        {/* URL input + Test button */}
        <div
          style={{
            display: 'flex',
            gap: 8,
            alignItems: 'center',
            flexWrap: 'wrap',
            marginBottom: 8,
          }}
        >
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

        {/* Localhost warning */}
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

        {/* Success feedback */}
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

        {/* Fail feedback */}
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

        {/* Collapsible payload preview */}
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
            <div style={{ fontSize: 11, color: t.text.muted, marginBottom: 6 }}>
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

        {/* Bottom row */}
        <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 8, marginTop: 20 }}>
          <Btn variant="ghost" onClick={onClose}>
            {i18n.cancel}
          </Btn>
          <Btn
            variant="default"
            onClick={handleSave}
            loading={saveState === 'saving'}
            disabled={saveState !== 'idle'}
          >
            {saveState === 'saved' ? i18n.saved : i18n.save}
          </Btn>
        </div>
      </div>
    </Modal>
  )
}

/* ================================================================
   ApiKeyModal
   ================================================================ */
function ApiKeyModal({ open, onClose }: { open: boolean; onClose: () => void }) {
  const { t, i18n } = useApp()
  const [apiKey, setApiKey] = useState(() => genApiKey())
  const [oldApiKey, setOldApiKey] = useState<string | null>(null)
  const [copied, setCopied] = useState(false)
  const [regenConfirm, setRegenConfirm] = useState(false)
  const [toast, setToast] = useState<string | null>(null)

  const flash = useCallback((m: string) => {
    setToast(m)
    setTimeout(() => setToast(null), 2200)
  }, [])

  const handleCopy = useCallback(() => {
    navigator.clipboard?.writeText(apiKey)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }, [apiKey])

  const handleRegen = useCallback(() => {
    setOldApiKey(apiKey)
    setApiKey(genApiKey())
    setRegenConfirm(false)
    flash(i18n.regenerated)
  }, [apiKey, flash, i18n.regenerated])

  return (
    <Modal open={open} onClose={onClose} title={i18n.apiIntegrationShort} width={520}>
      <div style={{ padding: '16px 24px 24px' }}>
        <p style={{ color: t.text.secondary, fontSize: 13, margin: '0 0 16px', lineHeight: 1.6 }}>
          {i18n.apiHint}{' '}
          <a href="/doc" target="_blank" rel="noopener noreferrer" style={{ color: t.accent }}>
            {i18n.apiDocLink} →
          </a>
        </p>

        <div style={{ fontSize: 11, color: t.text.muted, fontWeight: 500, marginBottom: 6 }}>
          {i18n.apiKey}
        </div>

        {/* Masked key + copy + regen */}
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
              onClick={handleCopy}
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

        {/* Old key display */}
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

        {/* Inline regen confirmation (not a nested Modal) */}
        {regenConfirm && (
          <div
            style={{
              marginTop: 14,
              padding: '12px 14px',
              backgroundColor: `${t.status.down}08`,
              border: `1px solid ${t.status.down}22`,
              borderRadius: 8,
              animation: 'fadeSlide .2s ease',
            }}
          >
            <p
              style={{ color: t.text.secondary, fontSize: 13, margin: '0 0 12px', lineHeight: 1.5 }}
            >
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
          </div>
        )}

        <Toast message={toast} visible={!!toast} />
      </div>
    </Modal>
  )
}

/* ================================================================
   Layout: Header, Tabs
   ================================================================ */
const RANGE_DAYS: Record<string, number> = {
  today: 1,
  '7d': 7,
  '30d': 30,
  '3m': 90,
  '6m': 180,
  '1y': 365,
}

function rangeDaysLabel(range: string, lang: string): string {
  if (range === 'today') return lang === 'zh' ? '今日' : 'Today'
  const d = RANGE_DAYS[range] || 90
  return lang === 'zh' ? `${d}天` : `${d}d`
}

function TimeRangeSelector({ value, onChange }: { value: string; onChange: (v: string) => void }) {
  const { i18n } = useApp()
  const options = [
    { value: 'today', label: i18n.rangeToday },
    { value: '7d', label: i18n.rangeLast7d },
    { value: '30d', label: i18n.rangeLast30d },
    { value: '3m', label: i18n.rangeLast3m },
    { value: '6m', label: i18n.rangeLast6m },
    { value: '1y', label: i18n.rangeLast1y },
  ]
  return <Select value={value} onChange={onChange} options={options} />
}

function Header({
  theme,
  toggleTheme,
  lang,
  toggleLang,
  projectName,
  timeRange,
  onTimeRangeChange,
  onOpenWebhook,
  onOpenApiKey,
}) {
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
        gap: 8,
      }}
    >
      <div style={{ display: 'flex', alignItems: 'center', gap: 10, minWidth: 0 }}>
        <img
          src="/favicon.png"
          alt={brandDisplay}
          style={{ width: 32, height: 32, borderRadius: R.sm, flexShrink: 0 }}
        />
        <div style={{ minWidth: 0 }}>
          <h1
            style={{
              fontSize: 16,
              fontWeight: 700,
              color: t.text.primary,
              margin: 0,
              fontFamily: F.display,
              letterSpacing: '-.02em',
              whiteSpace: 'nowrap',
              overflow: 'hidden',
              textOverflow: 'ellipsis',
            }}
          >
            {brandDisplay}
          </h1>
          <span className="hide-mobile" style={{ fontSize: 11, color: t.text.muted }}>
            {i18n.tagline}
          </span>
        </div>
      </div>
      <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
        <TimeRangeSelector value={timeRange} onChange={onTimeRangeChange} />
        <div className="hide-mobile" style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <div style={{ width: 1, height: 20, backgroundColor: t.border }} />
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
        </div>
        <button
          type="button"
          onClick={toggleLang}
          style={{
            background: t.bg.card,
            border: `1px solid ${t.border}`,
            borderRadius: 8,
            height: 32,
            padding: '0 10px',
            display: 'flex',
            alignItems: 'center',
            cursor: 'pointer',
            fontSize: 11,
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
          className="hide-mobile"
          onClick={toggleTheme}
          aria-label="Toggle theme"
          style={{
            background: t.bg.card,
            border: `1px solid ${t.border}`,
            borderRadius: 8,
            width: 32,
            height: 32,
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
        <UserMenu
          theme={theme}
          toggleTheme={toggleTheme}
          onOpenWebhook={onOpenWebhook}
          onOpenApiKey={onOpenApiKey}
        />
      </div>
    </header>
  )
}

function UserMenu({
  theme,
  toggleTheme,
  onOpenWebhook,
  onOpenApiKey,
}: {
  theme: string
  toggleTheme: () => void
  onOpenWebhook: () => void
  onOpenApiKey: () => void
}) {
  const { t, i18n } = useApp()
  const [open, setOpen] = useState(false)
  const menuRef = useRef<HTMLDivElement>(null)
  const user = { name: 'Admin', email: 'admin@example.com' }

  useEffect(() => {
    if (!open) return
    const handleClick = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) setOpen(false)
    }
    const handleKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setOpen(false)
    }
    document.addEventListener('mousedown', handleClick)
    document.addEventListener('keydown', handleKey)
    return () => {
      document.removeEventListener('mousedown', handleClick)
      document.removeEventListener('keydown', handleKey)
    }
  }, [open])

  const avatarStyle: React.CSSProperties = {
    width: 20,
    height: 20,
    borderRadius: '50%',
    backgroundColor: t.accent,
    color: '#fff',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    fontSize: 11,
    fontWeight: 700,
    flexShrink: 0,
  }

  return (
    <div ref={menuRef} style={{ position: 'relative' }}>
      {/* Desktop trigger */}
      <button
        type="button"
        className="hide-mobile"
        onClick={() => setOpen((v) => !v)}
        style={{
          background: t.bg.card,
          border: `1px solid ${t.border}`,
          borderRadius: 8,
          height: 32,
          padding: '0 10px',
          display: 'flex',
          alignItems: 'center',
          gap: 7,
          cursor: 'pointer',
          fontSize: 12,
          fontWeight: 600,
          color: t.text.secondary,
          transition: 'all .2s',
        }}
      >
        <span style={avatarStyle}>{user.name[0]}</span>
        <span>{user.name}</span>
        <span style={{ fontSize: 10, color: t.text.muted }}>▼</span>
      </button>

      {/* Mobile trigger */}
      <button
        type="button"
        className="show-mobile-only"
        onClick={() => setOpen((v) => !v)}
        style={{
          display: 'none',
          width: 32,
          height: 32,
          borderRadius: '50%',
          backgroundColor: t.accent,
          color: '#fff',
          border: 'none',
          alignItems: 'center',
          justifyContent: 'center',
          cursor: 'pointer',
          fontSize: 14,
          fontWeight: 700,
        }}
      >
        {user.name[0]}
      </button>

      {/* Dropdown panel */}
      {open && (
        <div
          style={{
            position: 'absolute',
            top: '100%',
            right: 0,
            marginTop: 6,
            minWidth: 260,
            background: t.bg.card,
            border: `1px solid ${t.border}`,
            borderRadius: R.md,
            boxShadow: '0 8px 24px rgba(0,0,0,.15)',
            zIndex: 1000,
            animation: 'fadeSlide .15s ease',
            overflow: 'hidden',
          }}
        >
          {/* User info */}
          <div style={{ padding: '14px 16px' }}>
            <div style={{ fontSize: 13, fontWeight: 600, color: t.text.primary }}>{user.name}</div>
            <div style={{ fontSize: 11, color: t.text.muted, marginTop: 2 }}>{user.email}</div>
          </div>

          {/* Actions */}
          <div style={{ borderTop: `1px solid ${t.border}`, padding: '6px 0' }}>
            <MenuItem
              icon={
                <svg
                  width="16"
                  height="16"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke={t.text.muted}
                  strokeWidth="1.8"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                >
                  <title>Webhook</title>
                  <path d="M18 8A6 6 0 006 8c0 7-3 9-3 9h18s-3-2-3-9" />
                  <path d="M13.73 21a2 2 0 01-3.46 0" />
                </svg>
              }
              label={i18n.webhookNotif}
              onClick={() => {
                onOpenWebhook()
                setOpen(false)
              }}
              t={t}
            />
            <MenuItem
              icon={
                <svg
                  width="16"
                  height="16"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke={t.text.muted}
                  strokeWidth="1.8"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                >
                  <title>API Key</title>
                  <path d="M21 2l-2 2m-7.61 7.61a5.5 5.5 0 11-7.778 7.778 5.5 5.5 0 017.777-7.777zm0 0L15.5 7.5m0 0l3 3L22 7l-3-3m-3.5 3.5L19 4" />
                </svg>
              }
              label={i18n.apiIntegrationShort}
              onClick={() => {
                onOpenApiKey()
                setOpen(false)
              }}
              t={t}
            />
          </div>

          {/* Theme toggle (mobile only) */}
          <div
            className="show-mobile-only"
            style={{
              display: 'none',
              borderTop: `1px solid ${t.border}`,
              padding: '6px 0',
            }}
          >
            <button
              type="button"
              onClick={toggleTheme}
              style={{
                width: '100%',
                padding: '10px 16px',
                display: 'flex',
                alignItems: 'center',
                gap: 10,
                background: 'none',
                border: 'none',
                cursor: 'pointer',
                color: t.text.secondary,
                fontSize: 13,
              }}
            >
              {/* Toggle track */}
              <div
                style={{
                  width: 36,
                  height: 20,
                  borderRadius: 10,
                  backgroundColor: theme === 'dark' ? t.accent : t.border,
                  position: 'relative',
                  transition: 'background-color .2s',
                  flexShrink: 0,
                }}
              >
                <div
                  style={{
                    position: 'absolute',
                    top: 3,
                    left: theme === 'dark' ? 18 : 3,
                    width: 14,
                    height: 14,
                    borderRadius: '50%',
                    backgroundColor: '#fff',
                    transition: 'left .2s',
                  }}
                />
              </div>
              <span>{theme === 'dark' ? '🌙' : '☀️'}</span>
              <span>{i18n.darkMode}</span>
            </button>
          </div>

          {/* Logout (disabled placeholder) */}
          <div style={{ borderTop: `1px solid ${t.border}`, padding: '6px 0' }}>
            <button
              type="button"
              disabled
              style={{
                width: '100%',
                padding: '10px 16px',
                display: 'flex',
                alignItems: 'center',
                gap: 10,
                background: 'none',
                border: 'none',
                cursor: 'not-allowed',
                color: t.text.muted,
                fontSize: 13,
                opacity: 0.5,
              }}
            >
              <svg
                width="16"
                height="16"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="1.8"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <title>Sign out</title>
                <path d="M9 21H5a2 2 0 01-2-2V5a2 2 0 012-2h4" />
                <polyline points="16 17 21 12 16 7" />
                <line x1="21" y1="12" x2="9" y2="12" />
              </svg>
              {i18n.logout}
            </button>
          </div>
        </div>
      )}
    </div>
  )
}

function MenuItem({
  icon,
  label,
  onClick,
  t,
}: {
  icon: React.ReactNode
  label: string
  onClick: () => void
  t: ReturnType<typeof useApp>['t']
}) {
  const [hovered, setHovered] = useState(false)
  return (
    <button
      type="button"
      onClick={onClick}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      style={{
        width: '100%',
        padding: '10px 16px',
        display: 'flex',
        alignItems: 'center',
        gap: 10,
        background: hovered ? t.bg.cardHover : 'none',
        border: 'none',
        cursor: 'pointer',
        color: t.text.secondary,
        fontSize: 13,
        transition: 'background .15s',
        textAlign: 'left',
      }}
    >
      {icon}
      {label}
    </button>
  )
}

const TAB_ICONS: Record<string, (active: boolean, color: string) => React.ReactNode> = {
  overview: (a, c) => (
    <svg
      width="20"
      height="20"
      viewBox="0 0 24 24"
      fill="none"
      stroke={c}
      strokeWidth={a ? 2.2 : 1.8}
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <title>Overview</title>
      <rect x="3" y="3" width="7" height="7" rx="1" />
      <rect x="14" y="3" width="7" height="7" rx="1" />
      <rect x="3" y="14" width="7" height="7" rx="1" />
      <rect x="14" y="14" width="7" height="7" rx="1" />
    </svg>
  ),
  probes: (a, c) => (
    <svg
      width="20"
      height="20"
      viewBox="0 0 24 24"
      fill="none"
      stroke={c}
      strokeWidth={a ? 2.2 : 1.8}
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <title>Probes</title>
      <path d="M22 12h-4l-3 9L9 3l-3 9H2" />
    </svg>
  ),
  events: (a, c) => (
    <svg
      width="20"
      height="20"
      viewBox="0 0 24 24"
      fill="none"
      stroke={c}
      strokeWidth={a ? 2.2 : 1.8}
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <title>Events</title>
      <path d="M18 8A6 6 0 006 8c0 7-3 9-3 9h18s-3-2-3-9" />
      <path d="M13.73 21a2 2 0 01-3.46 0" />
      <line x1="12" y1="2" x2="12" y2="4" />
    </svg>
  ),
  settings: (a, c) => (
    <svg
      width="20"
      height="20"
      viewBox="0 0 24 24"
      fill="none"
      stroke={c}
      strokeWidth={a ? 2.2 : 1.8}
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <title>Settings</title>
      <circle cx="12" cy="12" r="3" />
      <path d="M19.4 15a1.65 1.65 0 00.33 1.82l.06.06a2 2 0 010 2.83 2 2 0 01-2.83 0l-.06-.06a1.65 1.65 0 00-1.82-.33 1.65 1.65 0 00-1 1.51V21a2 2 0 01-4 0v-.09A1.65 1.65 0 009 19.4a1.65 1.65 0 00-1.82.33l-.06.06a2 2 0 01-2.83-2.83l.06-.06A1.65 1.65 0 004.68 15a1.65 1.65 0 00-1.51-1H3a2 2 0 010-4h.09A1.65 1.65 0 004.6 9a1.65 1.65 0 00-.33-1.82l-.06-.06a2 2 0 012.83-2.83l.06.06A1.65 1.65 0 009 4.68a1.65 1.65 0 001-1.51V3a2 2 0 014 0v.09a1.65 1.65 0 001 1.51 1.65 1.65 0 001.82-.33l.06-.06a2 2 0 012.83 2.83l-.06.06A1.65 1.65 0 0019.4 9a1.65 1.65 0 001.51 1H21a2 2 0 010 4h-.09a1.65 1.65 0 00-1.51 1z" />
    </svg>
  ),
}

function TabNav({
  active,
  onChange,
  pwa,
  isAdmin,
}: { active: string; onChange: (id: string) => void; pwa?: boolean; isAdmin?: boolean }) {
  const { t, i18n } = useApp()
  // PWA: 4 tabs (events = incidents + alerts merged), PC: 5 tabs
  const isEventsActive = active === 'events' || active === 'incidents' || active === 'alerts'

  if (pwa) {
    const pwaTabs = [
      { id: 'overview', label: i18n.overview },
      { id: 'probes', label: i18n.probes },
      { id: 'events', label: i18n.eventsShort },
      ...(isAdmin ? [{ id: 'settings', label: i18n.settings }] : []),
    ]
    return (
      <nav
        className="pwa-tab-bar"
        style={{
          position: 'fixed',
          bottom: 0,
          left: 0,
          right: 0,
          zIndex: 9999,
          display: 'flex',
          justifyContent: 'space-around',
          alignItems: 'stretch',
          backgroundColor: t.bg.card,
          borderTop: `1px solid ${t.border}`,
          paddingBottom: 'env(safe-area-inset-bottom, 0px)',
          backdropFilter: 'blur(20px)',
          WebkitBackdropFilter: 'blur(20px)',
        }}
      >
        {pwaTabs.map((tb) => {
          const isActive = tb.id === 'events' ? isEventsActive : active === tb.id
          const color = isActive ? t.accent : t.text.muted
          return (
            <button
              type="button"
              key={tb.id}
              onClick={() => onChange(tb.id)}
              style={{
                flex: 1,
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                justifyContent: 'center',
                gap: 2,
                background: 'none',
                border: 'none',
                cursor: 'pointer',
                padding: '8px 0 6px',
                color,
                fontSize: 10,
                fontWeight: isActive ? 600 : 400,
                fontFamily: F.sans,
                transition: 'color .15s',
                position: 'relative',
              }}
            >
              {TAB_ICONS[tb.id](isActive, color)}
              <span>{tb.label}</span>
              {isActive && (
                <span
                  style={{
                    position: 'absolute',
                    bottom: 0,
                    left: '50%',
                    transform: 'translateX(-50%)',
                    width: 20,
                    height: 2,
                    borderRadius: 1,
                    backgroundColor: t.accent,
                  }}
                />
              )}
            </button>
          )
        })}
      </nav>
    )
  }

  const pcTabs = [
    { id: 'overview', label: i18n.overview },
    { id: 'probes', label: i18n.probes },
    { id: 'events', label: i18n.events },
    ...(isAdmin ? [{ id: 'settings', label: i18n.settings }] : []),
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
      {pcTabs.map((tb) => {
        const isActive = tb.id === 'events' ? isEventsActive : active === tb.id
        return (
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
              fontWeight: isActive ? 600 : 400,
              color: isActive ? t.text.primary : t.text.muted,
              borderBottom: isActive ? `2px solid ${t.accent}` : '2px solid transparent',
              transition: 'all .15s',
              fontFamily: F.sans,
              whiteSpace: 'nowrap',
            }}
          >
            {tb.label}
          </button>
        )
      })}
    </nav>
  )
}

function SortableHeader({
  label,
  field,
  sort,
  onSort,
  align = 'left',
  className,
}: {
  label: string
  field: string
  sort: string
  onSort: (s: string) => void
  align?: string
  className?: string
}) {
  const { t } = useApp()
  const asc = `${field}-asc`
  const desc = `${field}-desc`
  const isAsc = sort === asc
  const isDesc = sort === desc
  const active = isAsc || isDesc
  const next = isAsc ? desc : asc
  return (
    <button
      type="button"
      className={className}
      onClick={() => onSort(active && isDesc ? 'default' : next)}
      style={{
        background: 'none',
        border: 'none',
        padding: 0,
        cursor: 'pointer',
        fontSize: 'inherit',
        fontWeight: 'inherit',
        fontFamily: 'inherit',
        textTransform: 'inherit' as React.CSSProperties['textTransform'],
        letterSpacing: 'inherit',
        color: active ? t.text.primary : t.text.muted,
        textAlign: align as React.CSSProperties['textAlign'],
        display: 'flex',
        alignItems: 'center',
        justifyContent: align === 'center' ? 'center' : 'flex-start',
        gap: 3,
        transition: 'color .15s',
      }}
    >
      {label}
      <span style={{ fontSize: 9, opacity: active ? 1 : 0.3 }}>{isDesc ? '▼' : '▲'}</span>
    </button>
  )
}

function ListHeader({ sort, onSort }: { sort: string; onSort: (s: string) => void }) {
  const { t, i18n, rangeLabel } = useApp()
  return (
    <div
      className="svc-row"
      style={{
        display: 'grid',
        gridTemplateColumns: 'minmax(140px,1.2fr) minmax(160px,2fr) 76px 70px 80px',
        gap: 14,
        padding: '8px 20px',
        fontSize: 11,
        fontWeight: 500,
        color: t.text.muted,
        textTransform: 'uppercase',
        letterSpacing: '.05em',
      }}
    >
      <SortableHeader label={i18n.service} field="name" sort={sort} onSort={onSort} />
      <span className="hide-mobile">{i18n.availability90.replace('{n}', rangeLabel)}</span>
      <span style={{ textAlign: 'center' }}>{i18n.status}</span>
      <SortableHeader
        label={i18n.latency}
        field="latency"
        sort={sort}
        onSort={onSort}
        align="center"
        className="hide-mobile hide-tablet"
      />
      <SortableHeader label={i18n.sla} field="sla" sort={sort} onSort={onSort} align="center" />
    </div>
  )
}

/* ================================================================
   ROOT APP
   ================================================================ */
// Redirect non-root paths to / (SPA uses hash routing only, except /doc and /status)
if (
  window.location.pathname !== '/' &&
  !window.location.pathname.startsWith('/doc') &&
  !window.location.pathname.startsWith('/status')
) {
  window.location.replace(`/${window.location.hash}`)
}

export default function App() {
  const isPWA = useIsPWA()
  const [isAdmin] = useState(() => {
    const fromUrl = new URLSearchParams(window.location.search).get('role') === 'admin'
    if (fromUrl) {
      try {
        sessionStorage.setItem('pulse-role', 'admin')
      } catch {
        /* noop */
      }
      return true
    }
    try {
      return sessionStorage.getItem('pulse-role') === 'admin'
    } catch {
      return false
    }
  })
  const [webhookModalOpen, setWebhookModalOpen] = useState(false)
  const [apiKeyModalOpen, setApiKeyModalOpen] = useState(false)
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
  const validTabs = ['overview', 'probes', 'events', 'settings']
  const parseTabFromHash = useCallback(() => {
    const m = window.location.hash.match(/tab=(\d+)/)
    if (m) {
      const idx = Number(m[1]) - 1
      const parsed = validTabs[idx] || 'overview'
      if (parsed === 'settings' && !isAdmin) return 'overview'
      return parsed
    }
    return 'overview'
  }, [isAdmin])
  const [tab, setTabState] = useState(parseTabFromHash)
  const setTab = useCallback(
    (id: string) => {
      if (id === 'settings' && !isAdmin) {
        setTabState('overview')
        window.location.hash = ''
        return
      }
      setTabState(id)
      const idx = validTabs.indexOf(id) + 1
      window.location.hash = idx <= 1 ? '' : `tab=${idx}`
    },
    [isAdmin],
  )
  useEffect(() => {
    const onHash = () => setTabState(parseTabFromHash())
    window.addEventListener('hashchange', onHash)
    return () => window.removeEventListener('hashchange', onHash)
  }, [parseTabFromHash])
  const [filter, setFilter] = useState('all')
  const [projectName, setProjectName] = useState('Pulse')
  const [allSvcs, setSvcs] = useState(_allSvcs)
  const [siteNotif, setSiteNotif] = useState<{
    message: string
    type: 'info' | 'warning' | 'critical'
  } | null>(null)
  const [notifDismissed, setNotifDismissed] = useState(false)
  const [timeRange, setTimeRange] = useState<'today' | '7d' | '30d' | '3m' | '6m' | '1y'>('today')
  const isStatusPage = window.location.pathname.startsWith('/status')

  const toggleMaintenance = useCallback((svcId: string, data: Record<string, unknown> | null) => {
    setSvcs((prev) =>
      prev.map((s) => {
        if (s.id !== svcId) return s
        if (data === null) {
          return {
            ...s,
            status: 'up',
            maintenance: false,
            maintenanceReason: '',
            maintenanceStartAt: null,
            maintenanceEndAt: null,
            maintenanceOperator: '',
            maintenanceNotifyUsers: [],
          }
        }
        return { ...s, ...data }
      }),
    )
  }, [])

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
  const rangeLabel = rangeDaysLabel(timeRange, lang)

  // Sync theme-color meta for PWA status bar
  useEffect(() => {
    const meta = document.querySelector('meta[name="theme-color"]')
    if (meta) meta.setAttribute('content', t.bg.base)
  }, [t.bg.base])
  const ctx = useMemo(
    () => ({ t, i18n, lang, theme, rangeLabel }),
    [t, i18n, lang, theme, rangeLabel],
  )

  const [search, setSearch] = useState('')
  const [sort, setSort] = useState('sla-asc')
  const searchRef = useRef<HTMLInputElement>(null)
  useEffect(() => {
    const h = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault()
        searchRef.current?.focus()
      }
    }
    window.addEventListener('keydown', h)
    return () => window.removeEventListener('keydown', h)
  }, [])
  const filtered = useMemo(() => {
    let list = filter === 'all' ? allSvcs : allSvcs.filter((s) => s.status === filter)
    if (search.trim()) {
      const q = search.trim().toLowerCase()
      list = list.filter(
        (s) => s.name.toLowerCase().includes(q) || s.nameZh.toLowerCase().includes(q),
      )
    }
    if (sort === 'latency-asc') list = [...list].sort((a, b) => a.latency - b.latency)
    else if (sort === 'latency-desc') list = [...list].sort((a, b) => b.latency - a.latency)
    else if (sort === 'sla-asc') list = [...list].sort((a, b) => a.sla - b.sla)
    else if (sort === 'sla-desc') list = [...list].sort((a, b) => b.sla - a.sla)
    else if (sort === 'name-asc') list = [...list].sort((a, b) => a.name.localeCompare(b.name))
    else if (sort === 'name-desc') list = [...list].sort((a, b) => b.name.localeCompare(a.name))
    return list
  }, [allSvcs, filter, search, sort])
  const [svcPage, setSvcPage] = useState(1)
  const pagedSvcs = filtered.slice((svcPage - 1) * PAGE_SIZE, svcPage * PAGE_SIZE)
  const selectedSvc = allSvcs.find((s) => s.id === selectedId) || null

  return (
    <AppCtx.Provider value={ctx}>
      {isStatusPage ? (
        <StatusPage services={allSvcs} projectName={projectName} t={t} i18n={i18n} lang={lang} />
      ) : (
        <div
          className={isPWA ? 'pwa-safe-top' : undefined}
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
        html,body{overscroll-behavior:none;-webkit-overflow-scrolling:touch}
        @media all and (display-mode:standalone){.pwa-safe-top{padding-top:env(safe-area-inset-top,20px)}}
        ::-webkit-scrollbar{width:0;display:none}
        *{scrollbar-width:none}
        @keyframes pulse-ring{0%{transform:scale(.8);opacity:.4}100%{transform:scale(1.6);opacity:0}}
        @keyframes fadeSlide{from{opacity:0;transform:translateY(8px)}to{opacity:1;transform:none}}
        @keyframes spin{to{transform:rotate(360deg)}}
        @keyframes checkPop{0%{transform:scale(0) rotate(-45deg);opacity:0}50%{transform:scale(1.2) rotate(0deg);opacity:1}100%{transform:scale(1) rotate(0deg);opacity:1}}
        @keyframes savedPulse{0%{box-shadow:0 0 0 0 rgba(16,185,129,.4)}70%{box-shadow:0 0 0 10px rgba(16,185,129,0)}100%{box-shadow:0 0 0 0 rgba(16,185,129,0)}}
        .detail-scroll::-webkit-scrollbar{display:none}.detail-scroll{scrollbar-width:none}
        .settings-row{display:grid;grid-template-columns:280px 1fr;gap:32px;align-items:start}
        @media(max-width:1200px){.main-grid{grid-template-columns:1fr 320px!important}.svc-row{grid-template-columns:minmax(120px,1.2fr) minmax(120px,1.5fr) 76px 80px!important}.hide-tablet{display:none!important;width:0!important;min-width:0!important;overflow:hidden!important;padding:0!important;margin:0!important}}
        @media(max-width:960px){.main-grid{grid-template-columns:1fr!important}.hide-mobile{display:none!important;width:0!important;min-width:0!important;overflow:hidden!important;padding:0!important;margin:0!important}.resp-cols{grid-template-columns:1fr!important}.settings-row{grid-template-columns:1fr!important;gap:8px!important}.svc-row{grid-template-columns:1fr 80px 76px!important;gap:8px!important}.filter-bar{flex-wrap:wrap!important}.filter-chips{display:flex!important;width:100%!important;gap:4px!important}.filter-chips button{flex:1!important;min-width:0!important;justify-content:center!important;white-space:nowrap!important;padding:6px 6px!important;font-size:12px!important}.search-box{max-width:none!important;width:100%!important;flex:auto!important}}
        @media(max-width:600px){.resp-cols{grid-template-columns:1fr!important}.stat-grid{grid-template-columns:1fr 1fr!important}}
        .show-mobile-only{display:none!important}
        @media(max-width:960px){.show-mobile-only{display:flex!important}}
      `}</style>

          {siteNotif &&
            !notifDismissed &&
            (() => {
              const colors = {
                info: { bg: '#3b82f6', text: '#fff' },
                warning: { bg: '#f59e0b', text: '#000' },
                critical: { bg: '#ef4444', text: '#fff' },
              }
              const c = colors[siteNotif.type]
              return (
                <div
                  style={{
                    backgroundColor: c.bg,
                    color: c.text,
                    fontSize: 12,
                    fontWeight: 500,
                    fontFamily: F.sans,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: 8,
                    padding: '6px 16px',
                    position: 'relative',
                  }}
                >
                  <span style={{ flex: 1, textAlign: 'center' }}>{siteNotif.message}</span>
                  <button
                    type="button"
                    onClick={() => setNotifDismissed(true)}
                    style={{
                      background: 'none',
                      border: 'none',
                      cursor: 'pointer',
                      color: c.text,
                      opacity: 0.7,
                      padding: 4,
                      lineHeight: 1,
                      fontSize: 16,
                      fontWeight: 700,
                      position: 'absolute',
                      right: 8,
                    }}
                  >
                    ×
                  </button>
                </div>
              )
            })()}

          <div
            style={{
              maxWidth: 1400,
              margin: '0 auto',
              padding: isPWA ? '0 24px 80px' : '0 24px 24px',
            }}
          >
            <Header
              theme={theme}
              toggleTheme={toggleTheme}
              lang={lang}
              toggleLang={toggleLang}
              projectName={projectName}
              timeRange={timeRange}
              onTimeRangeChange={setTimeRange}
              onOpenWebhook={() => setWebhookModalOpen(true)}
              onOpenApiKey={() => setApiKeyModalOpen(true)}
            />
            {!isPWA && <TabNav active={tab} onChange={setTab} isAdmin={isAdmin} />}

            {/* ──── OVERVIEW ──── */}
            {tab === 'overview' && (
              <>
                <OverviewCards svcs={allSvcs} />
                <div
                  className="filter-bar"
                  style={{ display: 'flex', alignItems: 'center', gap: 8, margin: '20px 0 12px' }}
                >
                  <div className="filter-chips" style={{ display: 'flex', gap: 6, flexShrink: 0 }}>
                    {[
                      { id: 'all', label: i18n.all, count: allSvcs.length, tip: '' },
                      {
                        id: 'up',
                        label: i18n.operational,
                        count: allSvcs.filter((s) => s.status === 'up').length,
                        tip: '',
                      },
                      {
                        id: 'degraded',
                        label: i18n.degraded,
                        count: allSvcs.filter((s) => s.status === 'degraded').length,
                        tip: i18n.tipDegraded,
                      },
                      {
                        id: 'down',
                        label: i18n.down,
                        count: allSvcs.filter((s) => s.status === 'down').length,
                        tip: i18n.tipDown,
                      },
                      ...(allSvcs.some((s) => s.status === 'maintenance')
                        ? [
                            {
                              id: 'maintenance',
                              label: i18n.maintenance,
                              count: allSvcs.filter((s) => s.status === 'maintenance').length,
                              tip: i18n.tipMaintenance,
                            },
                          ]
                        : []),
                    ].map((f) => (
                      <Tooltip key={f.id} text={f.tip}>
                        <button
                          type="button"
                          onClick={() => {
                            setFilter(f.id)
                            setSvcPage(1)
                          }}
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
                      </Tooltip>
                    ))}
                  </div>
                  {allSvcs.length > PAGE_SIZE && (
                    <div
                      className="search-box"
                      style={{
                        position: 'relative',
                        minWidth: 0,
                        maxWidth: 280,
                        marginLeft: 'auto',
                        width: 280,
                      }}
                    >
                      <svg
                        width="14"
                        height="14"
                        viewBox="0 0 24 24"
                        fill="none"
                        stroke={t.text.muted}
                        strokeWidth="2"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        style={{
                          position: 'absolute',
                          left: 10,
                          top: '50%',
                          transform: 'translateY(-50%)',
                          pointerEvents: 'none',
                        }}
                      >
                        <title>search</title>
                        <circle cx="11" cy="11" r="8" />
                        <line x1="21" y1="21" x2="16.65" y2="16.65" />
                      </svg>
                      <input
                        ref={searchRef}
                        value={search}
                        onChange={(e) => {
                          setSearch(e.target.value)
                          setSvcPage(1)
                        }}
                        placeholder={i18n.search}
                        style={{
                          width: '100%',
                          padding: '7px 48px 7px 32px',
                          backgroundColor: t.bg.input,
                          border: `1px solid ${t.border}`,
                          borderRadius: 8,
                          color: t.text.primary,
                          fontSize: 12,
                          fontFamily: F.sans,
                          outline: 'none',
                          transition: 'border-color .2s',
                        }}
                        onFocus={(e) => {
                          e.target.style.borderColor = `${t.accent}66`
                        }}
                        onBlur={(e) => {
                          e.target.style.borderColor = t.border
                        }}
                      />
                      <kbd
                        style={{
                          position: 'absolute',
                          right: 8,
                          top: '50%',
                          transform: 'translateY(-50%)',
                          padding: '2px 6px',
                          borderRadius: 4,
                          fontSize: 10,
                          fontFamily: F.mono,
                          color: t.text.muted,
                          backgroundColor: t.bg.card,
                          border: `1px solid ${t.border}`,
                          pointerEvents: 'none',
                          lineHeight: 1.4,
                        }}
                      >
                        ⌘K
                      </kbd>
                    </div>
                  )}
                </div>
                <div
                  className="main-grid"
                  style={{
                    display: 'grid',
                    gridTemplateColumns: '1fr 380px',
                    gap: 16,
                  }}
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
                    <ListHeader
                      sort={sort}
                      onSort={(s) => {
                        setSort(s)
                        setSvcPage(1)
                      }}
                    />
                    <div style={{ borderTop: `1px solid ${t.borderSubtle}` }}>
                      {pagedSvcs.map((s) => (
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
                      <Pagination
                        total={filtered.length}
                        page={svcPage}
                        pageSize={PAGE_SIZE}
                        onPageChange={setSvcPage}
                      />
                    </div>
                  </div>
                  <div
                    className="detail-scroll"
                    style={{
                      backgroundColor: t.bg.card,
                      borderRadius: R.lg,
                      border: `1px solid ${t.border}`,
                      overflowY: 'auto',
                      overflowX: 'hidden',
                      minHeight: 420,
                      boxShadow: t.shadow,
                    }}
                  >
                    <DetailPanel
                      svc={selectedSvc}
                      totalSvcs={allSvcs.length}
                      onToggleMaintenance={toggleMaintenance}
                    />
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
                      { s: 'up', l: i18n.operational, tip: '' },
                      { s: 'degraded', l: i18n.degraded, tip: i18n.tipDegraded },
                      { s: 'down', l: i18n.down, tip: i18n.tipDown },
                      { s: 'maintenance', l: i18n.maintenance, tip: i18n.tipMaintenance },
                    ].map((x) => (
                      <Tooltip key={x.s} text={x.tip}>
                        <span style={{ display: 'flex', alignItems: 'center', gap: 5 }}>
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
                      </Tooltip>
                    ))}
                  </div>
                  <span style={{ fontFamily: F.mono, fontFeatureSettings: "'tnum'" }}>
                    {timeRange === 'today' ? i18n.realtime : `${i18n.cached} (T+1)`}
                  </span>
                </div>
              </>
            )}

            {/* ──── PROBES ──── */}
            {tab === 'probes' && (
              <div style={{ paddingBottom: isPWA ? 32 : 0 }}>
                <ProbesPage />
              </div>
            )}

            {/* ──── EVENTS (incidents + alerts) ──── */}
            {tab === 'events' && <EventsPage isPWA={isPWA} />}

            {/* ──── SETTINGS ──── */}
            {tab === 'settings' && (
              <SettingsPage
                projectName={projectName}
                setProjectName={setProjectName}
                siteNotif={siteNotif}
                onNotifChange={(n) => {
                  setSiteNotif(n)
                  setNotifDismissed(false)
                }}
                isPWA={isPWA}
              />
            )}
          </div>
          <WebhookModal open={webhookModalOpen} onClose={() => setWebhookModalOpen(false)} />
          <ApiKeyModal open={apiKeyModalOpen} onClose={() => setApiKeyModalOpen(false)} />
          {isPWA && <TabNav active={tab} onChange={setTab} pwa isAdmin={isAdmin} />}
        </div>
      )}
    </AppCtx.Provider>
  )
}
