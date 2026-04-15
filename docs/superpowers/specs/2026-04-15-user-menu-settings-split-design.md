# User Menu + Settings Split Design

Date: 2026-04-15

## Summary

Four related UI changes:
1. Add user info display with dropdown menu in Header
2. Move Webhook & OpenAPI settings from Settings page into Modal dialogs accessible from user menu
3. Split Settings tab to admin-only, controlled by `role=admin` URL parameter
4. Fix Probes list bottom spacing in PWA mode

## 1. User Menu Component

### Trigger (Header Right)

- **Desktop**: Text button `用户名 ▾` placed after theme toggle button
- **Mobile**: Initial-letter avatar circle (e.g. "A"), replaces username text

### Dropdown Panel

```
┌─────────────────────┐
│  Admin               │
│  admin@example.com   │
│─────────────────────│
│  Webhook 通知        │  → opens WebhookModal
│  API 集成            │  → opens ApiKeyModal
│─────────────────────│
│  深色模式  [toggle]   │  ← mobile only
│─────────────────────│
│  登出                │  ← grayed out, not implemented
└─────────────────────┘
```

- Closes on outside click or Esc key
- Absolute positioned, `right: 0` to prevent overflow
- Mobile panel: `min-width: 260px`; Desktop: `280px`

### Mobile Header Optimization

- Hide theme toggle button (moved into user dropdown)
- Keep: TimeRangeSelector, language toggle, user avatar

## 2. Webhook & API Key Modals

### WebhookModal

- Title: "Webhook 通知"
- Content: Reuse existing Webhook section UI from SettingsPage (URL input, test button, status feedback, payload preview collapse)
- Logic unchanged, just extracted into a Modal

### ApiKeyModal

- Title: "API 集成"
- Content: Reuse existing API Key section UI (key display, copy button, regenerate button, old key display, doc link)
- Regenerate confirmation: inline confirm state within the Modal (no nested Modal)

### Modal Styling

- Reuse existing project Modal component
- Desktop: centered, `maxWidth: 520px`
- Mobile: slide up from bottom, top border-radius, near full-width
- Backdrop click to close

## 3. Settings Tab Access Control

### Role Detection

- Parse `role=admin` from `window.location.search`
- Store as App-level state: `isAdmin: boolean`
- PWA mode: cache in `sessionStorage` to survive in-app navigation

### Tab Rendering

- **Admin** (`isAdmin=true`): Overview, Probes, Events, Settings → 4 tabs, equal width
- **Regular user** (`isAdmin=false`): Overview, Probes, Events → 3 tabs, equal width
- Desktop top TabNav and PWA bottom nav share the same tab list

### Settings Page Content (Admin Only)

- Remove Webhook and OpenAPI sections (moved to user menu Modals)
- Keep: Project Name, SLA & Data Settings, Site Notification
- 3 sections, more compact layout

### URL Protection

- Non-admin navigating to `#tab=4` (Settings) → redirect to Overview

## 4. Probes List PWA Bottom Spacing

- **Problem**: PWA bottom nav bar (fixed, ~60px + safe-area-inset) overlaps end of probe list
- **Fix**: Add `paddingBottom: 80px` to Probes tab list container when `isPWA` is true
- Desktop layout unaffected
- Only targets Probes tab specifically
