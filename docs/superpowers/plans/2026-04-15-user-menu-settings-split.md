# User Menu + Settings Split Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add user dropdown menu to Header, move Webhook/OpenAPI into Modals, restrict Settings tab to admins, fix PWA bottom spacing on Probes page.

**Architecture:** All changes are in `packages/web/src/App.tsx` (monolithic SPA). New components: `UserMenu`, `WebhookModal`, `ApiKeyModal`. State additions: `isAdmin` (from URL param + sessionStorage), modal open states lifted to App. TabNav receives filtered tab list based on role.

**Tech Stack:** React 19, TypeScript, inline styles, existing Modal/Btn/Input components.

---

### File Map

- **Modify:** `packages/web/src/App.tsx`
  - Add i18n keys (lines ~27-232, ~233-432): `webhookNotif`, `apiIntegrationShort`, `darkMode`, `logout`, `userMenu` (en + zh)
  - Add `isAdmin` state + sessionStorage caching (in `App()` function, ~line 5261)
  - New component `UserMenu` (after Header definition, ~line 4963)
  - New component `WebhookModal` (after SettingsPage, ~line 4818)
  - New component `ApiKeyModal` (after WebhookModal)
  - Modify `Header` (~line 4851): add UserMenu trigger, hide theme button on mobile
  - Modify `TabNav` (~line 5034): accept `isAdmin` prop, filter tabs
  - Modify `SettingsPage` (~line 4272): remove Webhook + OpenAPI sections
  - Modify `App()` render (~line 5400): pass `isAdmin`, add modal states, guard settings tab
  - Modify `ProbesPage` or its container (~line 5787): add PWA bottom padding

---

### Task 1: Add i18n Keys

**Files:**
- Modify: `packages/web/src/App.tsx:27-232` (en block) and `packages/web/src/App.tsx:233-432` (zh block)

- [ ] **Step 1: Add English i18n keys**

In the `msg.en` object, after the `copy: 'Copy',` line (~line 191), add:

```typescript
    webhookNotif: 'Webhook Notification',
    apiIntegrationShort: 'API Integration',
    darkMode: 'Dark Mode',
    logout: 'Sign Out',
```

- [ ] **Step 2: Add Chinese i18n keys**

In the `msg.zh` object, after the `copy: '复制',` line (~line 391), add:

```typescript
    webhookNotif: 'Webhook 通知',
    apiIntegrationShort: 'API 接入',
    darkMode: '深色模式',
    logout: '退出登录',
```

- [ ] **Step 3: Verify no TypeScript errors**

Run: `cd /Users/longye/AgentRun/pulse && pnpm --filter @pulse/web typecheck`
Expected: No errors (both msg objects have the same shape due to `noImplicitAny: false`)

- [ ] **Step 4: Commit**

```bash
cd /Users/longye/AgentRun/pulse && git add packages/web/src/App.tsx
```
```bash
cd /Users/longye/AgentRun/pulse && git commit -m "feat: add i18n keys for user menu and modals

Co-Authored-By: Claude Opus 4.6 (1M context) <noreply@anthropic.com>"
```

---

### Task 2: Add `isAdmin` State with sessionStorage Caching

**Files:**
- Modify: `packages/web/src/App.tsx:5261-5278` (App function state declarations)

- [ ] **Step 1: Add isAdmin state after isPWA**

In the `App()` function, right after `const isPWA = useIsPWA()` (line 5262), add:

```typescript
  const [isAdmin] = useState(() => {
    const fromUrl = new URLSearchParams(window.location.search).get('role') === 'admin'
    if (fromUrl) {
      try { sessionStorage.setItem('pulse-role', 'admin') } catch { /* noop */ }
      return true
    }
    try { return sessionStorage.getItem('pulse-role') === 'admin' } catch { return false }
  })
```

- [ ] **Step 2: Verify typecheck passes**

Run: `cd /Users/longye/AgentRun/pulse && pnpm --filter @pulse/web typecheck`
Expected: PASS

- [ ] **Step 3: Commit**

```bash
cd /Users/longye/AgentRun/pulse && git add packages/web/src/App.tsx
```
```bash
cd /Users/longye/AgentRun/pulse && git commit -m "feat: add isAdmin state with sessionStorage caching

Co-Authored-By: Claude Opus 4.6 (1M context) <noreply@anthropic.com>"
```

---

### Task 3: Create WebhookModal Component

**Files:**
- Modify: `packages/web/src/App.tsx` — add new function after SettingsPage (~line 4818)

- [ ] **Step 1: Add WebhookModal component**

Insert after the SettingsPage closing brace (line 4818), before the `/* Layout: Header, Tabs */` comment:

```typescript
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
      onClose()
      setTimeout(() => setSaveState('idle'), 300)
    }, 800)
  }, [onClose])

  return (
    <Modal open={open} onClose={onClose} title={i18n.webhookNotif} width={520}>
      <div style={{ padding: '16px 24px 24px' }}>
        <div style={{ fontSize: 12, color: t.text.secondary, marginBottom: 16, lineHeight: 1.6 }}>
          {i18n.webhookHint}
        </div>
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
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
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
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" style={{ flexShrink: 0, marginTop: 2 }}>
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
        <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 8, marginTop: 20 }}>
          <Btn variant="ghost" onClick={onClose}>{i18n.cancel}</Btn>
          <Btn variant="default" onClick={handleSave} loading={saveState === 'saving'} disabled={!webhookUrl}>
            {i18n.save}
          </Btn>
        </div>
      </div>
    </Modal>
  )
}
```

- [ ] **Step 2: Verify typecheck passes**

Run: `cd /Users/longye/AgentRun/pulse && pnpm --filter @pulse/web typecheck`
Expected: PASS

- [ ] **Step 3: Commit**

```bash
cd /Users/longye/AgentRun/pulse && git add packages/web/src/App.tsx
```
```bash
cd /Users/longye/AgentRun/pulse && git commit -m "feat: add WebhookModal component

Co-Authored-By: Claude Opus 4.6 (1M context) <noreply@anthropic.com>"
```

---

### Task 4: Create ApiKeyModal Component

**Files:**
- Modify: `packages/web/src/App.tsx` — add new function right after WebhookModal

- [ ] **Step 1: Add ApiKeyModal component**

Insert immediately after the WebhookModal closing brace:

```typescript
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

  const handleCopy = useCallback((text: string) => {
    navigator.clipboard?.writeText(text)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }, [])

  const handleRegen = useCallback(() => {
    setOldApiKey(apiKey)
    setApiKey(genApiKey())
    setRegenConfirm(false)
    flash(i18n.regenerated)
  }, [apiKey, flash, i18n.regenerated])

  return (
    <Modal open={open} onClose={onClose} title={i18n.apiIntegrationShort} width={520}>
      <div style={{ padding: '16px 24px 24px' }}>
        <div style={{ fontSize: 12, color: t.text.secondary, marginBottom: 12, lineHeight: 1.6 }}>
          {i18n.apiHint}{' '}
          <a href="/doc" target="_blank" rel="noopener noreferrer" style={{ color: t.accent }}>
            {i18n.apiDocLink} →
          </a>
        </div>
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
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" style={{ animation: 'checkPop .3s ease-out' }}>
                  <title>Copied</title>
                  <polyline points="20 6 9 17 4 12" />
                </svg>
              ) : (
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
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
            <div style={{ fontSize: 11, color: t.status.degraded, fontWeight: 500, marginBottom: 4 }}>
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

        {/* Inline regen confirm */}
        {regenConfirm && (
          <div
            style={{
              marginTop: 16,
              padding: '12px 16px',
              backgroundColor: `${t.status.down}08`,
              border: `1px solid ${t.status.down}22`,
              borderRadius: 8,
              animation: 'fadeSlide .2s ease',
            }}
          >
            <p style={{ color: t.text.secondary, fontSize: 12, marginBottom: 12, lineHeight: 1.5 }}>
              {i18n.regenerateConfirm}
            </p>
            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 8 }}>
              <Btn variant="ghost" onClick={() => setRegenConfirm(false)}>{i18n.cancel}</Btn>
              <Btn variant="danger" onClick={handleRegen}>{i18n.confirm}</Btn>
            </div>
          </div>
        )}

        <Toast message={toast} visible={!!toast} />
      </div>
    </Modal>
  )
}
```

- [ ] **Step 2: Verify typecheck passes**

Run: `cd /Users/longye/AgentRun/pulse && pnpm --filter @pulse/web typecheck`
Expected: PASS

- [ ] **Step 3: Commit**

```bash
cd /Users/longye/AgentRun/pulse && git add packages/web/src/App.tsx
```
```bash
cd /Users/longye/AgentRun/pulse && git commit -m "feat: add ApiKeyModal component

Co-Authored-By: Claude Opus 4.6 (1M context) <noreply@anthropic.com>"
```

---

### Task 5: Create UserMenu Component

**Files:**
- Modify: `packages/web/src/App.tsx` — add new function after TAB_ICONS (~line 5032)

- [ ] **Step 1: Add UserMenu component**

Insert after the `TAB_ICONS` object closing brace (before the `TabNav` function):

```typescript
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

  const initial = user.name.charAt(0).toUpperCase()

  return (
    <div ref={menuRef} style={{ position: 'relative' }}>
      {/* Desktop: name button; Mobile: avatar circle */}
      <button
        type="button"
        onClick={() => setOpen((p) => !p)}
        className="hide-mobile"
        style={{
          background: t.bg.card,
          border: `1px solid ${t.border}`,
          borderRadius: 8,
          height: 32,
          padding: '0 12px',
          display: 'flex',
          alignItems: 'center',
          gap: 6,
          cursor: 'pointer',
          fontSize: 12,
          fontWeight: 500,
          color: t.text.secondary,
          fontFamily: F.sans,
          transition: 'all .2s',
          whiteSpace: 'nowrap',
        }}
      >
        <span
          style={{
            width: 20,
            height: 20,
            borderRadius: '50%',
            backgroundColor: t.accent,
            color: '#fff',
            fontSize: 10,
            fontWeight: 700,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontFamily: F.sans,
          }}
        >
          {initial}
        </span>
        {user.name}
        <span style={{ fontSize: 8, opacity: 0.6 }}>▼</span>
      </button>
      <button
        type="button"
        onClick={() => setOpen((p) => !p)}
        className="show-mobile-only"
        style={{
          background: t.bg.card,
          border: `1px solid ${t.border}`,
          borderRadius: '50%',
          width: 32,
          height: 32,
          display: 'none',
          alignItems: 'center',
          justifyContent: 'center',
          cursor: 'pointer',
          fontSize: 12,
          fontWeight: 700,
          color: '#fff',
          backgroundColor: t.accent,
          transition: 'all .2s',
        }}
      >
        {initial}
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
            backgroundColor: t.bg.card,
            border: `1px solid ${t.border}`,
            borderRadius: R.md,
            boxShadow: '0 8px 32px rgba(0,0,0,.25)',
            zIndex: 1000,
            animation: 'fadeSlide .15s ease',
            overflow: 'hidden',
          }}
        >
          {/* User info */}
          <div style={{ padding: '14px 16px', borderBottom: `1px solid ${t.border}` }}>
            <div style={{ fontSize: 13, fontWeight: 600, color: t.text.primary }}>{user.name}</div>
            <div style={{ fontSize: 11, color: t.text.muted, marginTop: 2 }}>{user.email}</div>
          </div>

          {/* Actions */}
          <div style={{ padding: '6px 0' }}>
            <button
              type="button"
              onClick={() => { setOpen(false); onOpenWebhook() }}
              style={{
                width: '100%',
                display: 'flex',
                alignItems: 'center',
                gap: 10,
                padding: '10px 16px',
                background: 'none',
                border: 'none',
                cursor: 'pointer',
                fontSize: 13,
                color: t.text.primary,
                fontFamily: F.sans,
                transition: 'background .1s',
              }}
              onMouseEnter={(e) => { e.currentTarget.style.backgroundColor = t.bg.cardHover }}
              onMouseLeave={(e) => { e.currentTarget.style.backgroundColor = 'transparent' }}
            >
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke={t.text.muted} strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
                <title>Webhook</title>
                <path d="M18 8A6 6 0 006 8c0 7-3 9-3 9h18s-3-2-3-9" />
                <path d="M13.73 21a2 2 0 01-3.46 0" />
              </svg>
              {i18n.webhookNotif}
            </button>
            <button
              type="button"
              onClick={() => { setOpen(false); onOpenApiKey() }}
              style={{
                width: '100%',
                display: 'flex',
                alignItems: 'center',
                gap: 10,
                padding: '10px 16px',
                background: 'none',
                border: 'none',
                cursor: 'pointer',
                fontSize: 13,
                color: t.text.primary,
                fontFamily: F.sans,
                transition: 'background .1s',
              }}
              onMouseEnter={(e) => { e.currentTarget.style.backgroundColor = t.bg.cardHover }}
              onMouseLeave={(e) => { e.currentTarget.style.backgroundColor = 'transparent' }}
            >
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke={t.text.muted} strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
                <title>API Key</title>
                <path d="M21 2l-2 2m-7.61 7.61a5.5 5.5 0 11-7.778 7.778 5.5 5.5 0 017.777-7.777zm0 0L15.5 7.5m0 0l3 3L22 7l-3-3m-3.5 3.5L19 4" />
              </svg>
              {i18n.apiIntegrationShort}
            </button>
          </div>

          {/* Theme toggle — mobile only */}
          <div className="show-mobile-only" style={{ display: 'none', borderTop: `1px solid ${t.border}`, padding: '6px 0' }}>
            <button
              type="button"
              onClick={() => { toggleTheme(); setOpen(false) }}
              style={{
                width: '100%',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                padding: '10px 16px',
                background: 'none',
                border: 'none',
                cursor: 'pointer',
                fontSize: 13,
                color: t.text.primary,
                fontFamily: F.sans,
              }}
            >
              <span style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                <span style={{ fontSize: 16 }}>{theme === 'dark' ? '🌙' : '☀️'}</span>
                {i18n.darkMode}
              </span>
              <span
                style={{
                  width: 36,
                  height: 20,
                  borderRadius: 10,
                  backgroundColor: theme === 'dark' ? t.accent : t.bg.elevated,
                  border: `1px solid ${t.border}`,
                  position: 'relative',
                  transition: 'all .2s',
                }}
              >
                <span
                  style={{
                    position: 'absolute',
                    top: 2,
                    left: theme === 'dark' ? 18 : 2,
                    width: 14,
                    height: 14,
                    borderRadius: '50%',
                    backgroundColor: '#fff',
                    transition: 'left .2s',
                    boxShadow: '0 1px 3px rgba(0,0,0,.2)',
                  }}
                />
              </span>
            </button>
          </div>

          {/* Logout placeholder */}
          <div style={{ borderTop: `1px solid ${t.border}`, padding: '6px 0' }}>
            <button
              type="button"
              disabled
              style={{
                width: '100%',
                display: 'flex',
                alignItems: 'center',
                gap: 10,
                padding: '10px 16px',
                background: 'none',
                border: 'none',
                cursor: 'not-allowed',
                fontSize: 13,
                color: t.text.muted,
                fontFamily: F.sans,
                opacity: 0.5,
              }}
            >
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
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
```

- [ ] **Step 2: Add CSS class `.show-mobile-only` to the style block**

In the `<style>` block inside App's render (around line 5416-5432), add to the existing CSS:

After the `@media(max-width:960px)` rule's closing brace, add:
```css
.show-mobile-only{display:none!important}
@media(max-width:960px){.show-mobile-only{display:flex!important}}
```

- [ ] **Step 3: Verify typecheck passes**

Run: `cd /Users/longye/AgentRun/pulse && pnpm --filter @pulse/web typecheck`
Expected: PASS

- [ ] **Step 4: Commit**

```bash
cd /Users/longye/AgentRun/pulse && git add packages/web/src/App.tsx
```
```bash
cd /Users/longye/AgentRun/pulse && git commit -m "feat: add UserMenu dropdown component

Co-Authored-By: Claude Opus 4.6 (1M context) <noreply@anthropic.com>"
```

---

### Task 6: Modify Header to Include UserMenu

**Files:**
- Modify: `packages/web/src/App.tsx` — Header function (~line 4851)

- [ ] **Step 1: Add new props to Header**

Change the Header function signature from:
```typescript
function Header({
  theme,
  toggleTheme,
  lang,
  toggleLang,
  projectName,
  timeRange,
  onTimeRangeChange,
}) {
```
to:
```typescript
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
```

- [ ] **Step 2: Replace theme button with UserMenu, hide theme button on mobile**

In the Header's right section (the `<div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>` block), replace the theme toggle button (the `<button>` with `{theme === 'dark' ? '☀️' : '🌙'}`):

Replace:
```typescript
        <button
          type="button"
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
```

With:
```typescript
        <button
          type="button"
          onClick={toggleTheme}
          aria-label="Toggle theme"
          className="hide-mobile"
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
```

- [ ] **Step 3: Verify typecheck passes**

Run: `cd /Users/longye/AgentRun/pulse && pnpm --filter @pulse/web typecheck`
Expected: PASS

- [ ] **Step 4: Commit**

```bash
cd /Users/longye/AgentRun/pulse && git add packages/web/src/App.tsx
```
```bash
cd /Users/longye/AgentRun/pulse && git commit -m "feat: integrate UserMenu into Header

Co-Authored-By: Claude Opus 4.6 (1M context) <noreply@anthropic.com>"
```

---

### Task 7: Modify TabNav for Role-Based Tabs

**Files:**
- Modify: `packages/web/src/App.tsx` — TabNav function (~line 5034)

- [ ] **Step 1: Add isAdmin prop to TabNav**

Change TabNav signature from:
```typescript
function TabNav({
  active,
  onChange,
  pwa,
}: { active: string; onChange: (id: string) => void; pwa?: boolean }) {
```
to:
```typescript
function TabNav({
  active,
  onChange,
  pwa,
  isAdmin,
}: { active: string; onChange: (id: string) => void; pwa?: boolean; isAdmin?: boolean }) {
```

- [ ] **Step 2: Filter tabs based on isAdmin**

Replace the `pwaTabs` array (line ~5044):
```typescript
    const pwaTabs = [
      { id: 'overview', label: i18n.overview },
      { id: 'probes', label: i18n.probes },
      { id: 'events', label: i18n.eventsShort },
      { id: 'settings', label: i18n.settings },
    ]
```
with:
```typescript
    const pwaTabs = [
      { id: 'overview', label: i18n.overview },
      { id: 'probes', label: i18n.probes },
      { id: 'events', label: i18n.eventsShort },
      ...(isAdmin ? [{ id: 'settings', label: i18n.settings }] : []),
    ]
```

Replace the `pcTabs` array (line ~5119):
```typescript
  const pcTabs = [
    { id: 'overview', label: i18n.overview },
    { id: 'probes', label: i18n.probes },
    { id: 'events', label: i18n.events },
    { id: 'settings', label: i18n.settings },
  ]
```
with:
```typescript
  const pcTabs = [
    { id: 'overview', label: i18n.overview },
    { id: 'probes', label: i18n.probes },
    { id: 'events', label: i18n.events },
    ...(isAdmin ? [{ id: 'settings', label: i18n.settings }] : []),
  ]
```

- [ ] **Step 3: Verify typecheck passes**

Run: `cd /Users/longye/AgentRun/pulse && pnpm --filter @pulse/web typecheck`
Expected: PASS

- [ ] **Step 4: Commit**

```bash
cd /Users/longye/AgentRun/pulse && git add packages/web/src/App.tsx
```
```bash
cd /Users/longye/AgentRun/pulse && git commit -m "feat: filter Settings tab by admin role in TabNav

Co-Authored-By: Claude Opus 4.6 (1M context) <noreply@anthropic.com>"
```

---

### Task 8: Remove Webhook & OpenAPI from SettingsPage

**Files:**
- Modify: `packages/web/src/App.tsx` — SettingsPage function (~line 4272)

- [ ] **Step 1: Remove webhook-related state and handlers**

In SettingsPage, remove these state declarations and handlers:
- `const [webhookUrl, setWebhookUrl] = useState('')` (line ~4277)
- `const [webhookTested, setWebhookTested] = useState<string | null>(null)` (~4282)
- `const [showPayload, setShowPayload] = useState(false)` (~4282)
- `const [webhookError, setWebhookError] = useState('')` (~4301)
- `const handleTestWebhook = useCallback(...)` (~4302-4329)

Remove API key state and handlers:
- `const [apiKey, setApiKey] = useState(() => genApiKey())` (~4278)
- `const [oldApiKey, setOldApiKey] = useState<string | null>(null)` (~4279)
- `const [copied, setCopied] = useState(false)` (~4284)
- `const [regenConfirm, setRegenConfirm] = useState(false)` (~4285)
- `const [toast, setToast] = useState<string | null>(null)` (~4286)
- `const flash = useCallback(...)` (~4288-4291)
- `const handleRegen = useCallback(...)` (~4331-4336)
- `const handleCopy = useCallback(...)` (~4337-4341)

- [ ] **Step 2: Remove Webhook JSX section**

Remove the entire `{/* Webhook */}` SettingsSection block (~lines 4433-4587):
```
      {/* Webhook */}
      <SettingsSection t={t}>
        <SettingsRow label={i18n.webhookUrl} hint={i18n.webhookHint}>
          ...
        </SettingsRow>
      </SettingsSection>
```

- [ ] **Step 3: Remove API Integration JSX section**

Remove the entire `{/* API Integration */}` SettingsSection block (~lines 4599-4724):
```
      {/* API Integration */}
      <SettingsSection t={t}>
        <SettingsRow label={i18n.apiIntegration} hint={...}>
          ...
        </SettingsRow>
      </SettingsSection>
```

- [ ] **Step 4: Remove the regen confirm Modal and Toast**

Remove the regen confirm Modal (~lines 4796-4813):
```
      <Modal open={regenConfirm} onClose={...} title={...} width={380}>
        ...
      </Modal>
```

Remove the Toast at the bottom (~line 4815):
```
      <Toast message={toast} visible={!!toast} />
```

- [ ] **Step 5: Verify typecheck passes**

Run: `cd /Users/longye/AgentRun/pulse && pnpm --filter @pulse/web typecheck`
Expected: PASS

- [ ] **Step 6: Commit**

```bash
cd /Users/longye/AgentRun/pulse && git add packages/web/src/App.tsx
```
```bash
cd /Users/longye/AgentRun/pulse && git commit -m "refactor: remove Webhook and OpenAPI sections from SettingsPage

Co-Authored-By: Claude Opus 4.6 (1M context) <noreply@anthropic.com>"
```

---

### Task 9: Wire Everything in App Root

**Files:**
- Modify: `packages/web/src/App.tsx` — App function render (~line 5400)

- [ ] **Step 1: Add modal states in App function**

After the `isAdmin` state (added in Task 2), add:
```typescript
  const [webhookModalOpen, setWebhookModalOpen] = useState(false)
  const [apiKeyModalOpen, setApiKeyModalOpen] = useState(false)
```

- [ ] **Step 2: Guard settings tab for non-admin**

In the `setTab` callback (~line 5288), change from:
```typescript
  const setTab = useCallback((id: string) => {
    setTabState(id)
    const idx = validTabs.indexOf(id) + 1
    window.location.hash = idx <= 1 ? '' : `tab=${idx}`
  }, [])
```
to:
```typescript
  const setTab = useCallback((id: string) => {
    if (id === 'settings' && !isAdmin) { setTabState('overview'); window.location.hash = ''; return }
    setTabState(id)
    const idx = validTabs.indexOf(id) + 1
    window.location.hash = idx <= 1 ? '' : `tab=${idx}`
  }, [isAdmin])
```

Also update `parseTabFromHash` to guard:
```typescript
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
```

- [ ] **Step 3: Pass new props to Header**

Change the Header invocation from:
```typescript
            <Header
              theme={theme}
              toggleTheme={toggleTheme}
              lang={lang}
              toggleLang={toggleLang}
              projectName={projectName}
              timeRange={timeRange}
              onTimeRangeChange={setTimeRange}
            />
```
to:
```typescript
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
```

- [ ] **Step 4: Pass isAdmin to both TabNav usages**

Change `{!isPWA && <TabNav active={tab} onChange={setTab} />}` to:
```typescript
            {!isPWA && <TabNav active={tab} onChange={setTab} isAdmin={isAdmin} />}
```

Change `{isPWA && <TabNav active={tab} onChange={setTab} pwa />}` to:
```typescript
          {isPWA && <TabNav active={tab} onChange={setTab} pwa isAdmin={isAdmin} />}
```

- [ ] **Step 5: Render Modals before the closing tag**

Before the closing `{isPWA && <TabNav ...` line, add the two modals:

```typescript
          <WebhookModal open={webhookModalOpen} onClose={() => setWebhookModalOpen(false)} />
          <ApiKeyModal open={apiKeyModalOpen} onClose={() => setApiKeyModalOpen(false)} />
```

- [ ] **Step 6: Verify typecheck passes**

Run: `cd /Users/longye/AgentRun/pulse && pnpm --filter @pulse/web typecheck`
Expected: PASS

- [ ] **Step 7: Commit**

```bash
cd /Users/longye/AgentRun/pulse && git add packages/web/src/App.tsx
```
```bash
cd /Users/longye/AgentRun/pulse && git commit -m "feat: wire user menu, modals, and admin role into App root

Co-Authored-By: Claude Opus 4.6 (1M context) <noreply@anthropic.com>"
```

---

### Task 10: Fix Probes Page PWA Bottom Spacing

**Files:**
- Modify: `packages/web/src/App.tsx` — Probes tab render (~line 5787)

- [ ] **Step 1: Wrap ProbesPage with padding container**

Change:
```typescript
            {/* ──── PROBES ──── */}
            {tab === 'probes' && <ProbesPage />}
```
to:
```typescript
            {/* ──── PROBES ──── */}
            {tab === 'probes' && (
              <div style={{ paddingBottom: isPWA ? 80 : 0 }}>
                <ProbesPage />
              </div>
            )}
```

- [ ] **Step 2: Verify typecheck passes**

Run: `cd /Users/longye/AgentRun/pulse && pnpm --filter @pulse/web typecheck`
Expected: PASS

- [ ] **Step 3: Run biome check**

Run: `cd /Users/longye/AgentRun/pulse && pnpm biome check packages/web/src/App.tsx`
Expected: PASS (or only pre-existing warnings)

- [ ] **Step 4: Commit**

```bash
cd /Users/longye/AgentRun/pulse && git add packages/web/src/App.tsx
```
```bash
cd /Users/longye/AgentRun/pulse && git commit -m "fix: add bottom padding to Probes page in PWA mode

Co-Authored-By: Claude Opus 4.6 (1M context) <noreply@anthropic.com>"
```

---

### Task 11: Manual Visual QA

- [ ] **Step 1: Start dev server**

Run: `cd /Users/longye/AgentRun/pulse && pnpm dev`

- [ ] **Step 2: Verify desktop view**

Open `http://localhost:5173/` — should see 3 tabs (no Settings). User menu shows in header. Click username → dropdown with Webhook/API/Logout.

- [ ] **Step 3: Verify admin desktop view**

Open `http://localhost:5173/?role=admin` — should see 4 tabs (with Settings). Settings page has 3 sections (no Webhook/OpenAPI).

- [ ] **Step 4: Verify mobile view**

Open DevTools → mobile viewport. Theme button hidden. Avatar circle visible. Click avatar → dropdown with theme toggle. Bottom nav: 3 tabs for regular, 4 for admin.

- [ ] **Step 5: Verify PWA Probes spacing**

Open `http://localhost:5173/?pwa#tab=2` — Probes list should have visible breathing room above bottom nav.

- [ ] **Step 6: Verify Modals**

Click Webhook in dropdown → Modal opens with URL input + test button. Click API Integration → Modal with masked key + copy + regenerate.
