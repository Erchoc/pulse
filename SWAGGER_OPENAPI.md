# Pulse API 接口文档

> **Base URL**: `https://<your-pulse-instance>`
> **API 版本**: v1
> **前缀**: `/api/v1`
> **认证**: `X-API-Key` Header（待实现）
> **Content-Type**: `application/json`

---

## 目录

- [通用约定](#通用约定)
- [1. 健康检查](#1-健康检查)
- [2. 探针管理](#2-探针管理)
- [3. 客户端推送](#3-客户端推送)
- [4. 服务管理](#4-服务管理)
- [5. 维护模式](#5-维护模式)
- [6. 设置管理](#6-设置管理)
- [数据模型](#数据模型)
- [错误码表](#错误码表)
- [Webhook 推送载荷](#webhook-推送载荷)

---

## 通用约定

### 响应包装格式

**列表响应**:
```json
{
  "data": [],
  "total": 0
}
```

**单对象响应**:
```json
{
  "data": { ... }
}
```

**错误响应**:
```json
{
  "error": {
    "code": "ERROR_CODE",
    "message": "human readable message",
    "details": {}
  }
}
```

### 时间格式

所有时间字段使用 **RFC 3339** 格式: `2026-04-15T10:00:00Z`

---

## 1. 健康检查

### `GET /healthz`

服务健康检查，不需要认证。

**Response** `200 OK`:
```json
{
  "status": "ok"
}
```

**Mock 示例**:
```bash
curl http://localhost:8080/healthz
# => {"status":"ok"}
```

---

## 2. 探针管理

### 2.1 `GET /api/v1/probes` — 获取探针列表

**Query Parameters**:

| 参数 | 类型 | 必填 | 说明 | 示例 |
|------|------|------|------|------|
| `mode` | string | 否 | 过滤探针模式 | `server` / `client` |
| `type` | string | 否 | 过滤探针类型 | `http` / `tcp` / `dns` / `icmp` / `websocket` / `push` |
| `enabled` | boolean | 否 | 过滤启用状态 | `true` / `false` |
| `service_id` | string | 否 | 按服务 ID 过滤 | `svc-1` |
| `page` | int | 否 | 页码，默认 1 | `1` |
| `page_size` | int | 否 | 每页数量，默认 8 | `20` |

**Response** `200 OK`:
```json
{
  "data": [
    {
      "id": "probe-1",
      "name": "Prod API Health",
      "type": "http",
      "mode": "server",
      "target": "https://api.example.com/healthz",
      "interval_s": 30,
      "timeout_s": 5,
      "retries": 1,
      "expect": {
        "status_codes": [200],
        "keyword": "ok"
      },
      "metadata": {
        "region": "us-east-1",
        "team": "platform"
      },
      "enabled": true,
      "service_id": "svc-1",
      "created_at": "2026-01-15T08:00:00Z",
      "updated_at": "2026-04-10T12:30:00Z"
    }
  ],
  "total": 1
}
```

**Mock 示例**:
```bash
curl http://localhost:8080/api/v1/probes
# => {"data":[],"total":0}

curl "http://localhost:8080/api/v1/probes?type=http&enabled=true"
# => {"data":[],"total":0}
```

---

### 2.2 `POST /api/v1/probes` — 创建探针

**Request Body**:
```json
{
  "name": "Prod API Health",
  "type": "http",
  "mode": "server",
  "target": "https://api.example.com/healthz",
  "interval_s": 30,
  "timeout_s": 5,
  "retries": 1,
  "expect": {
    "status_codes": [200],
    "keyword": "ok"
  },
  "metadata": {
    "region": "us-east-1"
  },
  "enabled": true,
  "service_id": "svc-1"
}
```

| 字段 | 类型 | 必填 | 默认值 | 说明 |
|------|------|------|--------|------|
| `name` | string | **是** | — | 探针显示名称 |
| `type` | string | **是** | — | `http` \| `tcp` \| `websocket` \| `dns` \| `icmp` \| `push` |
| `mode` | string | **是** | — | `server`（主动探测）\| `client`（被动接收） |
| `target` | string | **是** | — | 检测目标 URL / host:port / push token |
| `interval_s` | int | 否 | `30` | 检测间隔（秒） |
| `timeout_s` | int | 否 | `5` | 超时时间（秒） |
| `retries` | int | 否 | `1` | 失败重试次数 |
| `expect` | object | 否 | `null` | 预期条件 |
| `expect.status_codes` | int[] | 否 | — | 预期 HTTP 状态码列表 |
| `expect.keyword` | string | 否 | — | 响应体中必须包含的关键词 |
| `metadata` | object | 否 | `{}` | 自定义标签键值对 |
| `enabled` | boolean | 否 | `true` | 是否启用 |
| `service_id` | string | 否 | `null` | 关联服务 ID |

**Response** `201 Created`:
```json
{
  "data": {
    "id": "probe-abc123",
    "name": "Prod API Health",
    "type": "http",
    "mode": "server",
    "target": "https://api.example.com/healthz",
    "interval_s": 30,
    "timeout_s": 5,
    "retries": 1,
    "expect": {
      "status_codes": [200],
      "keyword": "ok"
    },
    "metadata": {
      "region": "us-east-1"
    },
    "enabled": true,
    "service_id": "svc-1",
    "created_at": "2026-04-15T10:00:00Z",
    "updated_at": "2026-04-15T10:00:00Z"
  }
}
```

**Error** `400 Bad Request`:
```json
{
  "error": {
    "code": "INVALID_REQUEST",
    "message": "name is required"
  }
}
```

**Mock 示例**:
```bash
curl -X POST http://localhost:8080/api/v1/probes \
  -H 'Content-Type: application/json' \
  -d '{"name":"test","type":"http","mode":"server","target":"https://example.com"}'
# => {"data":null}  (stub 当前返回 null)
```

---

## 3. 客户端推送

### `POST /api/v1/push/:token` — 接收客户端心跳

用于 client 模式探针主动上报状态（如 IoT 设备、内网服务等无法被外部探测的场景）。

**Path Parameters**:

| 参数 | 类型 | 必填 | 说明 |
|------|------|------|------|
| `token` | string | **是** | 探针的 push token |

**Request Body**（可选）:
```json
{
  "status": "up",
  "latency_ms": 42,
  "message": "all systems normal"
}
```

| 字段 | 类型 | 必填 | 说明 |
|------|------|------|------|
| `status` | string | 否 | `up` \| `degraded`，默认 `up` |
| `latency_ms` | number | 否 | 客户端自测延迟（毫秒） |
| `message` | string | 否 | 附加信息 |

**Response** `200 OK`:
```json
{
  "ok": true
}
```

**Mock 示例**:
```bash
curl -X POST http://localhost:8080/api/v1/push/my-device-token
# => {"ok":true}

curl -X POST http://localhost:8080/api/v1/push/my-device-token \
  -H 'Content-Type: application/json' \
  -d '{"status":"up","latency_ms":42}'
# => {"ok":true}
```

---

## 4. 服务管理

### `GET /api/v1/services` — 获取服务列表

**Query Parameters**:

| 参数 | 类型 | 必填 | 说明 |
|------|------|------|------|
| `page` | int | 否 | 页码，默认 1 |
| `page_size` | int | 否 | 每页数量，默认 8 |

**Response** `200 OK`:
```json
{
  "data": [
    {
      "id": "svc-1",
      "name": "Production API",
      "description": "主要生产环境 API 集群",
      "sla_target": 99.9,
      "maintenance": false,
      "maintenance_reason": null,
      "maintenance_start_at": null,
      "maintenance_end_at": null,
      "probe_count": 3,
      "created_at": "2026-01-01T00:00:00Z",
      "updated_at": "2026-04-10T12:00:00Z"
    }
  ],
  "total": 1
}
```

**Mock 示例**:
```bash
curl http://localhost:8080/api/v1/services
# => {"data":[],"total":0}
```

---

## 5. 维护模式

### 5.1 `POST /api/v1/services/:id/maintenance` — 开启维护

**Path Parameters**:

| 参数 | 类型 | 必填 | 说明 |
|------|------|------|------|
| `id` | string | **是** | 服务 ID |

**Request Body**:
```json
{
  "reason": "DB migration",
  "end_at": "2026-04-15T18:00:00Z",
  "notify_users": ["user-1"]
}
```

| 字段 | 类型 | 必填 | 说明 |
|------|------|------|------|
| `reason` | string | **是** | 维护原因 |
| `end_at` | string | 否 | 预计结束时间（RFC3339），`null` 表示手动结束 |
| `notify_users` | string[] | 否 | 需要通知的用户 ID 列表 |

**Response** `200 OK`:
```json
{
  "data": {
    "service_id": "svc-1",
    "maintenance": true,
    "reason": "DB migration",
    "end_at": "2026-04-15T18:00:00Z",
    "notify_users": ["user-1"],
    "start_at": "2026-04-15T10:00:00Z"
  }
}
```

**Error** `400 Bad Request`:
```json
{
  "error": {
    "code": "INVALID_REQUEST",
    "message": "invalid request body"
  }
}
```

**Mock 示例**:
```bash
curl -X POST http://localhost:8080/api/v1/services/svc-1/maintenance \
  -H 'Content-Type: application/json' \
  -d '{"reason":"DB migration","end_at":"2026-04-15T18:00:00Z","notify_users":["user-1"]}'
```

---

### 5.2 `DELETE /api/v1/services/:id/maintenance` — 结束维护

**Path Parameters**:

| 参数 | 类型 | 必填 | 说明 |
|------|------|------|------|
| `id` | string | **是** | 服务 ID |

**Response** `200 OK`:
```json
{
  "data": {
    "service_id": "svc-1",
    "maintenance": false,
    "ended_at": "2026-04-15T14:00:00Z"
  }
}
```

**Mock 示例**:
```bash
curl -X DELETE http://localhost:8080/api/v1/services/svc-1/maintenance
```

---

### 5.3 `GET /api/v1/services/:id/maintenance/history` — 维护历史

**Path Parameters**:

| 参数 | 类型 | 必填 | 说明 |
|------|------|------|------|
| `id` | string | **是** | 服务 ID |

**Query Parameters**:

| 参数 | 类型 | 必填 | 说明 |
|------|------|------|------|
| `page` | int | 否 | 页码，默认 1 |
| `page_size` | int | 否 | 每页数量，默认 8 |

**Response** `200 OK`:
```json
{
  "data": [
    {
      "id": "maint-1",
      "service_id": "svc-1",
      "reason": "DB migration",
      "start_at": "2026-04-15T10:00:00Z",
      "end_at": "2026-04-15T14:00:00Z",
      "operator": "user-1",
      "created_at": "2026-04-15T10:00:00Z"
    }
  ],
  "total": 1
}
```

**Mock 示例**:
```bash
curl http://localhost:8080/api/v1/services/svc-1/maintenance/history
# => {"data":[],"total":0}
```

---

## 6. 设置管理

### 6.1 `GET /api/v1/settings` — 获取全局设置

**Response** `200 OK`:
```json
{
  "data": {
    "project_name": "Pulse",
    "data_retention": "90d",
    "sla_window": "30d",
    "sla_timezone": "Asia/Shanghai",
    "webhook_url": "https://hooks.example.com/pulse",
    "api_key": "pk_live_****abcd"
  }
}
```

| 字段 | 类型 | 说明 |
|------|------|------|
| `project_name` | string | 项目显示名称 |
| `data_retention` | string | 数据保留周期，如 `90d` |
| `sla_window` | string | SLA 计算窗口: `7d` / `30d` / `90d` |
| `sla_timezone` | string | SLA 计算时区 |
| `webhook_url` | string \| null | Webhook 通知 URL |
| `api_key` | string \| null | API Key（脱敏展示） |

**Mock 示例**:
```bash
curl http://localhost:8080/api/v1/settings
# => {"data":{"project_name":"Pulse"}}
```

---

### 6.2 `POST /api/v1/settings/webhook/test` — 测试 Webhook

通过服务端代理发送测试请求到 Webhook URL（绕过前端 CORS 限制）。

**Request Body**:
```json
{
  "url": "https://hooks.example.com/pulse",
  "body": "{\"text\":\"Pulse test notification\"}"
}
```

| 字段 | 类型 | 必填 | 说明 |
|------|------|------|------|
| `url` | string | **是** | 目标 Webhook URL |
| `body` | string | 否 | 自定义 JSON 载荷字符串 |

**Response** `200 OK`（成功）:
```json
{
  "success": true,
  "status_code": 200,
  "response_body": "ok"
}
```

**Response** `200 OK`（连接失败）:
```json
{
  "success": false,
  "error": "dial tcp: lookup hooks.invalid: no such host",
  "status_code": 0
}
```

**Error** `400 Bad Request`:
```json
{
  "error": {
    "code": "INVALID_REQUEST",
    "message": "url is required"
  }
}
```

**Mock 示例**:
```bash
curl -X POST http://localhost:8080/api/v1/settings/webhook/test \
  -H 'Content-Type: application/json' \
  -d '{"url":"https://httpbin.org/post","body":"{\"test\":true}"}'
```

---

## 数据模型

### Probe（探针）

```typescript
interface Probe {
  id: string              // 主键，自动生成
  name: string            // 探针名称
  type: 'http' | 'tcp' | 'websocket' | 'dns' | 'icmp' | 'push'
  mode: 'server' | 'client'
  target: string          // URL / host:port / push token
  interval_s: number      // 检测间隔（秒），默认 30
  timeout_s: number       // 超时时间（秒），默认 5
  retries: number         // 重试次数，默认 1
  expect?: {
    status_codes?: number[]
    keyword?: string
  }
  metadata: Record<string, any>  // 自定义标签
  enabled: boolean        // 是否启用，默认 true
  service_id?: string     // 关联服务 ID
  created_at: string      // RFC3339
  updated_at: string      // RFC3339
}
```

### Service（服务）

```typescript
interface Service {
  id: string
  name: string
  description?: string
  sla_target: number      // SLA 目标百分比，默认 99.9
  maintenance: boolean    // 是否维护中
  maintenance_reason?: string
  maintenance_start_at?: string
  maintenance_end_at?: string    // null = 手动结束
  probe_count: number     // 关联探针数量
  created_at: string
  updated_at: string
}
```

### MaintenanceWindow（维护窗口）

```typescript
interface MaintenanceWindow {
  id: string
  service_id: string
  reason?: string
  start_at: string        // RFC3339
  end_at?: string         // null = 进行中
  operator?: string       // 操作人 ID
  created_at: string
}
```

### Settings（全局设置）

```typescript
interface Settings {
  project_name: string
  data_retention: string  // e.g. "90d"
  sla_window: string      // "7d" | "30d" | "90d"
  sla_timezone: string    // e.g. "Asia/Shanghai"
  webhook_url?: string
  api_key?: string        // 展示时脱敏
}
```

---

## 错误码表

| HTTP 状态码 | 错误码 | 说明 |
|-------------|--------|------|
| 400 | `INVALID_REQUEST` | 请求参数校验失败 |
| 401 | `UNAUTHORIZED` | 未提供或无效的 API Key |
| 403 | `FORBIDDEN` | 无权限执行此操作 |
| 404 | `PROBE_NOT_FOUND` | 探针不存在 |
| 404 | `SERVICE_NOT_FOUND` | 服务不存在 |
| 409 | `ALREADY_IN_MAINTENANCE` | 服务已在维护中 |
| 409 | `NOT_IN_MAINTENANCE` | 服务未在维护中 |
| 429 | `RATE_LIMITED` | 请求频率超限 |
| 500 | `INTERNAL_ERROR` | 服务内部错误 |

---

## Webhook 推送载荷

当探针检测到状态变化时，系统向配置的 Webhook URL 推送如下载荷：

```json
{
  "event": "probe_anomaly",
  "probe_id": "probe-1",
  "probe_name": "Prod API Health",
  "service_id": "svc-1",
  "service_name": "Production API",
  "from": "up",
  "to": "down",
  "timestamp": "2026-04-14T13:22:01Z",
  "latency_ms": 5023,
  "status_code": 503,
  "message": "Health check failed: HTTP 503",
  "maintenance": false,
  "maintenance_reason": null,
  "error": {
    "type": "HTTP_ERROR",
    "retry_count": 3,
    "last_error": "status 503 Service Unavailable"
  }
}
```

| 字段 | 类型 | 说明 |
|------|------|------|
| `event` | string | 事件类型: `probe_anomaly` \| `probe_recovery` \| `maintenance_start` \| `maintenance_end` |
| `from` / `to` | string | 状态变化: `up` \| `down` \| `degraded` |
| `maintenance` | boolean | 当前是否在维护模式，维护期间的 anomaly 仅做记录不计入 SLA |

---

## 接口实现状态

| 接口 | 状态 | 备注 |
|------|------|------|
| `GET /healthz` | ✅ Stub | 返回固定 `{"status":"ok"}` |
| `GET /api/v1/probes` | ✅ Stub | 返回空列表，待接存储层 |
| `POST /api/v1/probes` | ✅ Stub | 返回 `null`，待接存储层 |
| `POST /api/v1/push/:token` | ✅ Stub | 返回 `{"ok":true}` |
| `GET /api/v1/services` | ✅ Stub | 返回空列表，待接存储层 |
| `POST /api/v1/services/:id/maintenance` | ✅ Mock | 返回模拟数据 |
| `DELETE /api/v1/services/:id/maintenance` | ✅ Mock | 返回模拟数据 |
| `GET /api/v1/services/:id/maintenance/history` | ✅ Stub | 返回空列表 |
| `GET /api/v1/settings` | ✅ Stub | 返回 `project_name` 固定值 |
| `POST /api/v1/settings/webhook/test` | ✅ 完整 | 真实发送 HTTP 请求 |

> **Stub**: 路由已注册，返回硬编码空数据
> **Mock**: 路由已注册，返回模拟数据（带请求解析）
> **完整**: 有实际业务逻辑
