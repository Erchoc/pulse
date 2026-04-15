# Maintenance Mode Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Allow users to set services into maintenance mode, excluding downtime from SLA and suppressing alerts during maintenance windows.

**Architecture:** Frontend-first implementation using mock data (backend is still stubs). Add maintenance state to service data model, maintenance modal UI, filter chip, and detail panel controls. Backend API endpoints added as stubs matching the existing pattern.

**Tech Stack:** React 19 (inline styles), Go Echo v4, TypeScript, SQLite (planned)

---

## File Structure

| File | Action | Responsibility |
|------|--------|----------------|
| `packages/web/src/App.tsx` | Modify | i18n strings, mock data, service state, MaintenanceModal, filter chip, DetailPanel controls |
| `packages/go-server/internal/api/server.go` | Modify | Maintenance API stub endpoints |
| `packages/go-server/internal/api/server_test.go` | Modify | Tests for new endpoints |

---

### Task 1: Add i18n strings for maintenance mode UI

**Files:**
- Modify: `packages/web/src/App.tsx:6-265` (msg object)

- [ ] **Step 1: Add English i18n strings**

In the `msg` object's `en` section (around line 6), add after existing maintenance-related entries:

```typescript
// Add to msg.en (around line 100-ish, after existing strings)
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
```

- [ ] **Step 2: Add Chinese i18n strings**

In the `msg` object's `zh` section (around line 140), add matching Chinese translations:

```typescript
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
```

- [ ] **Step 3: Verify biome check passes**

Run: `npx biome check packages/web/src/App.tsx --max-diagnostics=5`
Expected: No lint errors

- [ ] **Step 4: Commit**

```bash
git add packages/web/src/App.tsx
git commit -m "feat: add i18n strings for maintenance mode UI"
```

---

### Task 2: Update service data model and mock data

**Files:**
- Modify: `packages/web/src/App.tsx:458-571` (_initSvcs), `packages/web/src/App.tsx:576-642` (mock generation)

- [ ] **Step 1: Add maintenance fields to mock service data**

Update `_initSvcs` to add maintenance fields. Set one service (e.g. `search`) to maintenance status as demo data:

```typescript
// Add to each service object in _initSvcs:
// Normal services get:
maintenance: false,
maintenanceReason: '',
maintenanceStartAt: null as string | null,
maintenanceEndAt: null as string | null,
maintenanceOperator: '',
maintenanceNotifyUsers: [] as string[],

// For 'search' service (id: 'search'), set as in maintenance:
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
  status: 'maintenance',
  bar: genBar(),
  ld: genLd(),
  maintenance: true,
  maintenanceReason: 'Elasticsearch rolling upgrade',
  maintenanceStartAt: new Date(Date.now() - 2 * 3600_000).toISOString(),
  maintenanceEndAt: new Date(Date.now() + 4 * 3600_000).toISOString(),
  maintenanceOperator: 'user-1',
  maintenanceNotifyUsers: ['user-2'],
},
```

- [ ] **Step 2: Add mock users data**

Add after `_initSvcs` (around line 572):

```typescript
const mockUsers = [
  { id: 'user-1', name: 'Admin', email: 'admin@example.com' },
  { id: 'user-2', name: '张三', email: 'zhangsan@example.com' },
  { id: 'user-3', name: '李四', email: 'lisi@example.com' },
]
```

- [ ] **Step 3: Update genMockSvcs if it exists**

In the `genMockSvcs` function (around line 624), ensure generated services include maintenance fields:

```typescript
// Add to each generated mock service:
maintenance: false,
maintenanceReason: '',
maintenanceStartAt: null,
maintenanceEndAt: null,
maintenanceOperator: '',
maintenanceNotifyUsers: [],
```

- [ ] **Step 4: Verify biome check passes**

Run: `npx biome check packages/web/src/App.tsx --max-diagnostics=5`
Expected: No lint errors

- [ ] **Step 5: Commit**

```bash
git add packages/web/src/App.tsx
git commit -m "feat: add maintenance fields to service data model and mock data"
```

---

### Task 3: Add maintenance filter chip to Overview page

**Files:**
- Modify: `packages/web/src/App.tsx:3692-3726` (filter chips area)

- [ ] **Step 1: Add maintenance filter chip**

Find the filter chips array (around line 3692) and add the maintenance entry:

```typescript
{[
  { id: 'all', label: i18n.all, count: allSvcs.length },
  { id: 'up', label: i18n.operational, count: allSvcs.filter((s) => s.status === 'up').length },
  { id: 'degraded', label: i18n.degraded, count: allSvcs.filter((s) => s.status === 'degraded').length },
  { id: 'down', label: i18n.down, count: allSvcs.filter((s) => s.status === 'down').length },
  { id: 'maintenance', label: i18n.maintenance, count: allSvcs.filter((s) => s.status === 'maintenance').length },
].map((f) => (
```

- [ ] **Step 2: Verify biome check passes**

Run: `npx biome check packages/web/src/App.tsx --max-diagnostics=5`

- [ ] **Step 3: Commit**

```bash
git add packages/web/src/App.tsx
git commit -m "feat: add maintenance filter chip to overview page"
```

---

### Task 4: Add MaintenanceModal component

**Files:**
- Modify: `packages/web/src/App.tsx` (add new component near other modals, around line 1920)

- [ ] **Step 1: Create MaintenanceModal component**

Add after `LatencyDetailModal` (around line 1967), before `IncidentTimeline`:

```tsx
function MaintenanceModal({ svc, onConfirm, onClose }) {
  const { t, i18n } = useApp()
  const [reason, setReason] = useState(svc.maintenanceReason || '')
  const [endAt, setEndAt] = useState(svc.maintenanceEndAt ? svc.maintenanceEndAt.slice(0, 16) : '')
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
      {/* Reason */}
      <div>
        <span style={{ fontSize: 12, color: t.text.muted, display: 'block', marginBottom: 4 }}>
          {i18n.maintenanceReason}
        </span>
        <Input
          value={reason}
          onChange={(e) => { setReason(e.target.value) }}
          placeholder={i18n.maintenanceReasonPlaceholder}
        />
      </div>

      {/* End time */}
      <div>
        <span style={{ fontSize: 12, color: t.text.muted, display: 'block', marginBottom: 4 }}>
          {i18n.maintenanceEndTime}
        </span>
        <input
          type="datetime-local"
          value={endAt}
          onChange={(e) => { setEndAt(e.target.value) }}
          style={{
            width: '100%',
            padding: '8px 12px',
            borderRadius: 8,
            border: `1px solid ${t.border}`,
            backgroundColor: t.bg.input,
            color: t.text.primary,
            fontSize: 13,
            fontFamily: 'inherit',
            outline: 'none',
          }}
          placeholder={i18n.maintenanceEndTimePlaceholder}
        />
      </div>

      {/* Notify users (checkboxes) */}
      <div>
        <span style={{ fontSize: 12, color: t.text.muted, display: 'block', marginBottom: 4 }}>
          {i18n.maintenanceNotify}
        </span>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
          {mockUsers.map((u) => (
            <label key={u.id} style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 13, color: t.text.primary, cursor: 'pointer' }}>
              <input
                type="checkbox"
                checked={notifyUsers.includes(u.id)}
                onChange={(e) => {
                  setNotifyUsers(
                    e.target.checked
                      ? [...notifyUsers, u.id]
                      : notifyUsers.filter((id) => id !== u.id)
                  )
                }}
                style={{ accentColor: t.accent }}
              />
              {u.name} <span style={{ color: t.text.muted, fontSize: 11 }}>({u.email})</span>
            </label>
          ))}
        </div>
      </div>

      {/* Submit button */}
      <Btn onClick={handleSubmit} style={{ marginTop: 8 }}>
        {i18n.setMaintenance}
      </Btn>
    </div>
  )
}
```

- [ ] **Step 2: Verify biome check passes**

Run: `npx biome check packages/web/src/App.tsx --max-diagnostics=5`
Fix any lint issues (e.g., label without control → switch to `<span>` with onClick, add keyboard handlers, etc.)

- [ ] **Step 3: Commit**

```bash
git add packages/web/src/App.tsx
git commit -m "feat: add MaintenanceModal component"
```

---

### Task 5: Add maintenance controls to DetailPanel

**Files:**
- Modify: `packages/web/src/App.tsx:1636-1922` (DetailPanel function)

- [ ] **Step 1: Add maintenance state and modal trigger to DetailPanel**

In the DetailPanel function, add state for the maintenance modal and a handler for toggling maintenance:

```tsx
// Add inside DetailPanel function (after existing useState calls):
const [maintModalOpen, setMaintModalOpen] = useState(false)
```

- [ ] **Step 2: Add maintenance banner in DetailPanel header**

After the status badge in the DetailPanel header section (around line 1700), add a maintenance info banner that shows when the service is in maintenance:

```tsx
{svc.maintenance && (
  <div style={{
    backgroundColor: `${t.status.maintenance}15`,
    border: `1px solid ${t.status.maintenance}30`,
    borderRadius: R.sm,
    padding: '10px 14px',
    marginTop: 12,
    fontSize: 12,
  }}>
    <div style={{ color: t.status.maintenance, fontWeight: 600, marginBottom: 4 }}>
      {i18n.maintenanceActive}
    </div>
    {svc.maintenanceReason && (
      <div style={{ color: t.text.secondary, marginBottom: 2 }}>{svc.maintenanceReason}</div>
    )}
    <div style={{ color: t.text.muted, fontFamily: F.mono, fontSize: 11 }}>
      {i18n.maintenanceSince} {new Date(svc.maintenanceStartAt).toLocaleString()}
      {svc.maintenanceEndAt && (
        <> · {i18n.maintenanceUntil} {new Date(svc.maintenanceEndAt).toLocaleString()}</>
      )}
      {!svc.maintenanceEndAt && (
        <> · {i18n.maintenanceManualEnd}</>
      )}
    </div>
  </div>
)}
```

- [ ] **Step 3: Add maintenance toggle button**

Add a button near the top of DetailPanel (after the header section) that toggles maintenance mode. The button label changes depending on current state:

```tsx
<Btn
  small
  variant={svc.maintenance ? 'danger' : 'ghost'}
  onClick={() => {
    if (svc.maintenance) {
      // End maintenance - call onEndMaintenance prop
      if (confirm(i18n.confirmEndMaintenance)) {
        onToggleMaintenance(svc.id, null)
      }
    } else {
      setMaintModalOpen(true)
    }
  }}
  style={{ marginTop: 8 }}
>
  {svc.maintenance ? i18n.endMaintenance : i18n.setMaintenance}
</Btn>
```

- [ ] **Step 4: Add MaintenanceModal render**

At the bottom of DetailPanel's return, add the modal:

```tsx
<Modal open={maintModalOpen} onClose={() => setMaintModalOpen(false)} title={i18n.setMaintenance}>
  <MaintenanceModal
    svc={svc}
    onConfirm={(data) => {
      onToggleMaintenance(svc.id, data)
      setMaintModalOpen(false)
    }}
    onClose={() => setMaintModalOpen(false)}
  />
</Modal>
```

- [ ] **Step 5: Update DetailPanel signature**

Add the `onToggleMaintenance` prop to DetailPanel:

```tsx
function DetailPanel({ svc, totalSvcs = 0, onToggleMaintenance })
```

- [ ] **Step 6: Verify biome check passes**

Run: `npx biome check packages/web/src/App.tsx --max-diagnostics=5`

- [ ] **Step 7: Commit**

```bash
git add packages/web/src/App.tsx
git commit -m "feat: add maintenance controls to service detail panel"
```

---

### Task 6: Wire up maintenance state management in App component

**Files:**
- Modify: `packages/web/src/App.tsx:3545+` (App component)

- [ ] **Step 1: Convert allSvcs to stateful**

Change `allSvcs` from a const to a useState so services can be updated:

```tsx
const [svcs, setSvcs] = useState(() => isMockPage ? genMockSvcs() : _initSvcs)
```

Update all references from `allSvcs` to `svcs` in the App component scope.

- [ ] **Step 2: Add toggleMaintenance handler**

```tsx
const toggleMaintenance = (svcId: string, data: Record<string, unknown> | null) => {
  setSvcs((prev) =>
    prev.map((s) => {
      if (s.id !== svcId) return s
      if (data === null) {
        // End maintenance
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
      // Start maintenance
      return { ...s, ...data }
    })
  )
}
```

- [ ] **Step 3: Pass handler to DetailPanel**

Find where `<DetailPanel>` is rendered (around line 3825) and add the prop:

```tsx
<DetailPanel svc={selectedSvc} totalSvcs={svcs.length} onToggleMaintenance={toggleMaintenance} />
```

- [ ] **Step 4: Verify biome check passes**

Run: `npx biome check packages/web/src/App.tsx --max-diagnostics=5`

- [ ] **Step 5: Commit**

```bash
git add packages/web/src/App.tsx
git commit -m "feat: wire up maintenance state management in App"
```

---

### Task 7: Add maintenance API stub endpoints to Go server

**Files:**
- Modify: `packages/go-server/internal/api/server.go`
- Modify: `packages/go-server/internal/api/server_test.go`

- [ ] **Step 1: Add maintenance route registrations**

In `NewServer()` function, after the services routes (line 40):

```go
// Maintenance
v1.POST("/services/:id/maintenance", startMaintenance)
v1.DELETE("/services/:id/maintenance", endMaintenance)
v1.GET("/services/:id/maintenance/history", getMaintenanceHistory)
```

- [ ] **Step 2: Add stub handlers**

After the existing handlers:

```go
func startMaintenance(c echo.Context) error {
	id := c.Param("id")
	var req struct {
		Reason      string   `json:"reason"`
		EndAt       *string  `json:"end_at"`
		NotifyUsers []string `json:"notify_users"`
	}
	if err := c.Bind(&req); err != nil {
		return c.JSON(http.StatusBadRequest, map[string]any{
			"error": map[string]string{"code": "INVALID_REQUEST", "message": "invalid request body"},
		})
	}
	return c.JSON(http.StatusOK, map[string]any{
		"data": map[string]any{
			"service_id":   id,
			"maintenance":  true,
			"reason":       req.Reason,
			"end_at":       req.EndAt,
			"notify_users": req.NotifyUsers,
			"start_at":     time.Now().UTC().Format(time.RFC3339),
		},
	})
}

func endMaintenance(c echo.Context) error {
	id := c.Param("id")
	return c.JSON(http.StatusOK, map[string]any{
		"data": map[string]any{
			"service_id":  id,
			"maintenance": false,
			"ended_at":    time.Now().UTC().Format(time.RFC3339),
		},
	})
}

func getMaintenanceHistory(c echo.Context) error {
	return c.JSON(http.StatusOK, map[string]any{"data": []any{}, "total": 0})
}
```

- [ ] **Step 3: Add tests**

In `server_test.go`, add:

```go
func TestStartMaintenance(t *testing.T) {
	srv := NewServer()
	body := `{"reason":"DB migration","end_at":"2026-04-15T18:00:00Z","notify_users":["user-1"]}`
	req := httptest.NewRequest(http.MethodPost, "/api/v1/services/svc-1/maintenance", strings.NewReader(body))
	req.Header.Set("Content-Type", "application/json")
	rec := httptest.NewRecorder()
	srv.ServeHTTP(rec, req)
	if rec.Code != http.StatusOK {
		t.Errorf("expected 200, got %d", rec.Code)
	}
}

func TestEndMaintenance(t *testing.T) {
	srv := NewServer()
	req := httptest.NewRequest(http.MethodDelete, "/api/v1/services/svc-1/maintenance", nil)
	rec := httptest.NewRecorder()
	srv.ServeHTTP(rec, req)
	if rec.Code != http.StatusOK {
		t.Errorf("expected 200, got %d", rec.Code)
	}
}

func TestGetMaintenanceHistory(t *testing.T) {
	srv := NewServer()
	req := httptest.NewRequest(http.MethodGet, "/api/v1/services/svc-1/maintenance/history", nil)
	rec := httptest.NewRecorder()
	srv.ServeHTTP(rec, req)
	if rec.Code != http.StatusOK {
		t.Errorf("expected 200, got %d", rec.Code)
	}
}
```

Add `"strings"` to the imports in server_test.go.

- [ ] **Step 4: Run Go tests**

Run: `cd packages/go-server && go test ./... -v`
Expected: All tests pass

- [ ] **Step 5: Commit**

```bash
git add packages/go-server/
git commit -m "feat: add maintenance mode API stub endpoints"
```

---

### Task 8: Final integration verification

- [ ] **Step 1: Run full biome check**

Run: `npx biome check packages/web/src/App.tsx --max-diagnostics=20`
Expected: No lint errors

- [ ] **Step 2: Run TypeScript check**

Run: `cd packages/web && npx tsc --noEmit`
Expected: No type errors (note: `noImplicitAny: false` so some looseness is OK)

- [ ] **Step 3: Run Go tests**

Run: `cd packages/go-server && go test ./... -v`
Expected: All tests pass

- [ ] **Step 4: Final commit with all remaining changes**

If any loose changes remain, commit them.

```bash
git add -A
git commit -m "feat: maintenance mode — complete frontend + API stubs"
```
