# Maintenance Mode — Design Spec

## 概述

允许用户对服务设置"维护中"状态。维护期间：
1. 该服务下所有探针的故障**不计入 SLA**（视为中性时段，既不算 uptime 也不算 downtime）
2. **屏蔽该服务的 SLA 告警**，仅将告警消息推送给操作人和操作人指定的用户
3. 前端展示靛蓝色"维护中"状态徽标

## 领域模型

```
Service (N:1) Probe
  - 一个服务可以有多个探针
  - 一个探针只属于一个服务
  - 维护模式在服务级别设置
```

## 数据模型变更

### services 表新增字段

| 字段 | 类型 | 默认值 | 说明 |
|------|------|--------|------|
| maintenance | BOOLEAN | FALSE | 是否处于维护模式 |
| maintenance_reason | TEXT | NULL | 维护原因（可选） |
| maintenance_start_at | TIMESTAMPTZ | NULL | 维护开始时间 |
| maintenance_end_at | TIMESTAMPTZ | NULL | 维护预计结束时间（NULL = 手动结束） |
| maintenance_notify_users | TEXT | NULL | 额外通知用户 ID 列表（JSON array，用户系统 Mock） |
| maintenance_operator | TEXT | NULL | 操作人（Mock 用户 ID） |

### maintenance_windows 表（历史记录）

```sql
CREATE TABLE maintenance_windows (
    id          TEXT PRIMARY KEY,
    service_id  TEXT NOT NULL REFERENCES services(id),
    reason      TEXT,
    start_at    TIMESTAMPTZ NOT NULL,
    end_at      TIMESTAMPTZ,          -- NULL = 未结束
    operator    TEXT,
    created_at  TIMESTAMPTZ DEFAULT NOW()
);
```

用途：SLA 计算时排除历史维护窗口。

## API 端点

### 开启维护模式
```
POST /api/v1/services/{id}/maintenance
Body: {
  "reason": "数据库迁移",
  "end_at": "2026-04-15T18:00:00Z",   // 可选，NULL = 手动结束
  "notify_users": ["user-1", "user-2"] // 可选
}
```

### 关闭维护模式
```
DELETE /api/v1/services/{id}/maintenance
```
将当前维护窗口写入 `maintenance_windows` 并清除 services 表的维护字段。

### 查询维护历史
```
GET /api/v1/services/{id}/maintenance/history
```

## SLA 计算

```
有效监控时间 = 总时间 - 维护窗口时间
SLA = (有效监控时间 - 故障时间) / 有效监控时间 * 100
```

维护窗口内的探针数据照常采集存储，但 SLA 计算时跳过这些时段。

## 告警行为

| 场景 | 行为 |
|------|------|
| 服务正常 | 正常告警流程（Webhook 推送给所有订阅者） |
| 服务维护中 + 探针故障 | **不触发 SLA 告警**，仅推送给操作人 + 指定用户 |
| 服务维护中 + 维护到期 | 自动结束维护，恢复正常告警 |

告警 payload 增加字段：
```json
{
  "event": "probe_anomaly",
  "maintenance": true,
  "maintenance_reason": "数据库迁移"
}
```

## 前端 UI

### 已就绪（代码中已存在）
- 主题色：`maintenance: '#818cf8'`（暗）/ `'#4f46e5'`（亮）
- i18n：`maintenance: '维护中'` / `'Maintenance'`
- StatusDot、ServiceRow 状态映射已支持

### 需要新增

1. **Overview 筛选器** — 添加"维护中"筛选标签
2. **服务行操作** — 服务行右键/更多菜单中增加"设置维护"入口
3. **维护设置弹窗** — Modal 表单：
   - 维护原因（可选，文本输入）
   - 预计结束时间（可选，日期时间选择器，NULL = 手动结束）
   - 通知用户（多选，Mock 用户列表）
4. **维护中标识** — 服务行显示靛蓝色徽标 + 维护原因提示
5. **维护倒计时** — 如果设了结束时间，显示剩余时间

### 用户系统 Mock

暂无登录系统，Mock 数据：
```typescript
const mockUsers = [
  { id: 'user-1', name: 'Admin', email: 'admin@example.com' },
  { id: 'user-2', name: '张三', email: 'zhangsan@example.com' },
  { id: 'user-3', name: '李四', email: 'lisi@example.com' },
]
```

操作人默认为 `user-1`（Admin），后续接入真实用户系统时替换。

## 不做的事

- 不做定时维护（cron 表达式）—— 后续迭代
- 不做探针级维护 —— 只支持服务级
- 不做维护审批流 —— 无登录系统
- 不做维护日历视图 —— 后续迭代
