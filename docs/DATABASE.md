# Pulse — 数据库维护文档

> **定位**：告诉运维/开发"数据库长什么样 / 怎么迁移 / 怎么扩容 / 出事了怎么救"。
> **原始 DDL 源**：`IMPL_SPEC.md §2`。本文档负责维护**可操作层面**的细节。
>
> **维护约定**：任何 DDL 变更必须同步更新本文的 §2（schema 表）与 §5（变更记录）；
> schema 变更先出迁移脚本（`packages/server/migrations/NNN_*.sql`）再合库。

---

## 1. 存储选型策略

Pulse 的存储被抽象为 `internal/store` 接口层，允许两种后端：

| 模式 | `STORAGE_MODE` | 适用场景 | 限制 |
|------|---------------|---------|------|
| 嵌入式 | `embedded` | 开发、< 50 探针私有化部署 | 无分区、无 NOTIFY、单实例 |
| PostgreSQL | `postgres` | 生产、多实例、> 50 探针 | 需 PG 15+ |

**统一约束**：
- 所有 SQL 必须兼容 PG 语法（SQLite 跑时由 store 层做少量转换：`BIGSERIAL → INTEGER PRIMARY KEY AUTOINCREMENT`、`TIMESTAMPTZ → TEXT ISO8601`、`JSONB → JSON TEXT`）
- PG 专用特性（分区、LISTEN/NOTIFY、`pg_advisory_lock`）**不写入通用 SQL**，通过 `store` 接口的 Postgres 专属方法使用
- 迁移脚本是 PG 方言写的；SQLite 模式启动时由 store 层自动降级转换

> **MVP 期建议**：开发用 SQLite，生产直接上阿里云 RDS PG 15。

---

## 2. Schema 概览

完整 DDL 见 `IMPL_SPEC.md §2.1`。这里维护一张"索引+用途"总表，方便快速定位。

### 2.1 配置类（小表，< 10k 行）

| 表 | 用途 | 关键索引 | 生命周期 |
|----|------|---------|----------|
| `tenants` | 租户 | `slug UNIQUE` | 永久 |
| `users` | 用户账号（Phase 4+） | `email UNIQUE`、`tenant_id` | 永久 |
| `api_keys` | API Key（SHA256 hash） | `key_hash UNIQUE`、`tenant_id` | 支持软过期 |
| `services` | 服务（探针逻辑分组） | `idx_services_tenant` | 永久 |
| `probes` | 探针配置 | `idx_probes_tenant`（WHERE deleted_at IS NULL）、`idx_probes_assigned`、`idx_probes_service` | 软删除 |
| `notification_channels` | 通知渠道 | — | 永久 |
| `alert_rules` | 告警规则 | — | 永久 |
| `maintenance_windows` | 维护窗口 | — | 永久 |
| `edge_nodes` | Edge 节点注册 | — | 永久 |
| `pulse_instances` | 多实例注册（运行期表） | `instance_id PRIMARY KEY` | 30s 心跳超时自动清 |

### 2.2 时序/事件类（大表，按时间分区或 TTL）

| 表 | 用途 | 分区 | 关键索引 | 预估规模（100 探针/30s） |
|----|------|------|---------|-------------------------|
| `probe_results` | 原始探测打点 | **按月 RANGE** | `idx_results_probe_time (probe_id, scheduled_at DESC)` | ~8.6M 行/月 |
| `fault_intervals` | 故障区间 | 不分区（量小） | `idx_fault_probe_time` | 通常 < 10k 行 |
| `alert_events` | 告警历史 | 不分区（量小） | `idx_alert_events_tenant` | 通常 < 100k 行 |
| `probe_rollup_hourly` | 小时聚合 | 不分区 | PK(probe_id, hour) | ~72k 行/月（100 探针） |
| `probe_rollup_daily` | 日聚合 | 不分区 | PK(probe_id, day) | ~3k 行/月 |
| `analysis_results` | 离线分析结果 KV | 不分区 | `idx_analysis_expires` | < 10k 行 |

### 2.3 容量估算

| 场景 | 探针数 × interval | 月打点 | 原始表大小（PG，未压缩） | 建议保留 |
|------|------------------|--------|-------------------------|----------|
| 个人 | 10 × 60s | 43.2 万 | ~50 MB | 保留 6 分区 |
| 中型 | 100 × 30s | 864 万 | ~1 GB | 保留 3 分区 |
| 企业 | 1000 × 10s | 2.59 亿 | ~30 GB | 保留 2 分区 + rollup 永久 |

超期数据：**rollup 永久保留**（小），原始打点按保留策略删旧分区（见 §4）。

---

## 3. 迁移

### 3.1 工具链

- **采用** `golang-migrate/migrate` CLI（二进制 + Go 库双模式）
- 迁移文件目录：`packages/server/migrations/`
- 命名：`NNN_描述.up.sql` / `NNN_描述.down.sql`（NNN = 3 位连续编号）
- server 启动时**不自动跑迁移**（避免多实例同时执行），改由 Makefile / CI 显式触发

### 3.2 Makefile 约定

```makefile
migrate-up:
	migrate -path ./migrations -database "$$DATABASE_URL" up

migrate-down:
	migrate -path ./migrations -database "$$DATABASE_URL" down 1

migrate-new:
	migrate create -ext sql -dir ./migrations -seq $(name)
# 使用: make migrate-new name=add_probe_tags

migrate-force:
	# 迁移失败后修复版本号（慎用）
	migrate -path ./migrations -database "$$DATABASE_URL" force $(version)
```

### 3.3 写迁移的规则

1. **永远成对提交** up / down；down 脚本必须真的能回滚（别偷懒写空）
2. **加列要有默认值**；NOT NULL 列必须给 DEFAULT，否则老数据无法插入
3. **改列先加新列 → 双写双读 → 删旧列**（三次迁移，不要一次完成）
4. **索引 CONCURRENTLY**：生产 PG 加索引用 `CREATE INDEX CONCURRENTLY`，避免锁表
5. **大表 ALTER 慎用**：> 1GB 表的 `ADD COLUMN NOT NULL DEFAULT xxx` 会锁表很久；拆两步做
6. **迁移前 review**：任何涉及 `probe_results` / `fault_intervals` 的迁移必须另一个同事 review

### 3.4 Seed 数据

开发环境默认 seed（由 `migrations/seed.sql` 或 `make seed` 命令执行，不计入编号）：

```sql
INSERT INTO tenants (id, name, slug) VALUES (1, 'Default', 'default') ON CONFLICT DO NOTHING;
INSERT INTO api_keys (tenant_id, name, key_hash, key_prefix)
  VALUES (1, 'dev-default', '<sha256_of_dev_key>', 'pk_dev_') ON CONFLICT DO NOTHING;
```

---

## 4. 分区管理 (PG only)

### 4.1 策略

`probe_results` 按月 RANGE 分区。新分区**提前 3 个月**创建，避免写入失败。

### 4.2 自动化方案（推荐）

**pg_partman 扩展**：

```sql
CREATE EXTENSION IF NOT EXISTS pg_partman;

SELECT partman.create_parent(
    p_parent_table => 'public.probe_results',
    p_control      => 'scheduled_at',
    p_type         => 'range',
    p_interval     => '1 month',
    p_premake      => 3   -- 提前 3 个月
);

-- 日常维护（每天跑一次）
SELECT partman.run_maintenance('public.probe_results', p_analyze := true);
```

配合 `pg_cron` 每天调用 `run_maintenance()`。

### 4.3 手动兜底

没装 pg_partman 或 SQLite 模式时，`internal/aggregator` 中加一个每日 goroutine：

```go
// 伪代码
func ensureFuturePartitions(ctx context.Context, db *pgxpool.Pool) error {
    now := time.Now().UTC()
    for i := 0; i < 3; i++ {
        start := time.Date(now.Year(), now.Month()+time.Month(i), 1, 0, 0, 0, 0, time.UTC)
        end := start.AddDate(0, 1, 0)
        name := fmt.Sprintf("probe_results_%s", start.Format("2006_01"))
        _, err := db.Exec(ctx, fmt.Sprintf(`
            CREATE TABLE IF NOT EXISTS %s PARTITION OF probe_results
            FOR VALUES FROM ('%s') TO ('%s')
        `, name, start.Format("2006-01-02"), end.Format("2006-01-02")))
        if err != nil { return err }
    }
    return nil
}
```

### 4.4 数据保留 / 清理

保留策略（默认）：
- `probe_results`：保留 3 个月（通过 DROP 老分区实现，几毫秒）
- `probe_rollup_hourly`：保留 1 年
- `probe_rollup_daily`：永久
- `alert_events`：保留 1 年（DELETE by fired_at）
- `analysis_results`：按 `expires_at` 自动清（后台 goroutine）

清理脚本（可放进 pg_cron）：

```sql
-- 每月 1 号执行：删除 4 个月前的分区
DO $$
DECLARE part_name TEXT;
BEGIN
    part_name := 'probe_results_' || to_char(NOW() - INTERVAL '4 months', 'YYYY_MM');
    EXECUTE format('DROP TABLE IF EXISTS %I', part_name);
END $$;
```

---

## 5. 运维速查

### 5.1 连接与监控

```bash
# 连接（阿里云 RDS 建议用 SSL）
psql "postgres://user:pass@host:5432/pulse?sslmode=require"

# 查当前连接数
SELECT count(*) FROM pg_stat_activity WHERE state != 'idle';

# 慢查询（> 1s 的正在执行）
SELECT pid, now() - query_start AS duration, query
FROM pg_stat_activity
WHERE state != 'idle' AND now() - query_start > interval '1 second'
ORDER BY duration DESC;

# 各表大小
SELECT schemaname, tablename,
       pg_size_pretty(pg_total_relation_size(schemaname||'.'||tablename)) AS size
FROM pg_tables WHERE schemaname='public'
ORDER BY pg_total_relation_size(schemaname||'.'||tablename) DESC;

# 分区列表
SELECT c.relname AS partition, pg_size_pretty(pg_total_relation_size(c.oid))
FROM pg_inherits i
JOIN pg_class c ON c.oid = i.inhrelid
JOIN pg_class p ON p.oid = i.inhparent
WHERE p.relname = 'probe_results'
ORDER BY c.relname;

# 索引使用统计（找出低效/未用索引）
SELECT schemaname, relname, indexrelname, idx_scan
FROM pg_stat_user_indexes
WHERE idx_scan = 0 AND indexrelname NOT LIKE 'pg_%'
ORDER BY schemaname, relname;
```

### 5.2 故障救援

| 症状 | 诊断 | 处置 |
|------|------|------|
| 写入堆积，`probe_results` 增长停滞 | `SELECT * FROM pg_stat_activity WHERE wait_event IS NOT NULL` | 找锁表的事务 kill；检查分区是否齐全 |
| `probe_results_2026_MM does not exist` 错误 | 分区没提前建 | 手动 `CREATE TABLE ... PARTITION OF ...`；排查 aggregator 的 goroutine |
| 连接数打满 | `pool_timeout` 日志刷屏 | 先 `SELECT pg_terminate_backend(pid)` 清 idle；长期：加 pgbouncer 或增 `max_conns` |
| `advisory_lock` 卡死（多实例场景） | `SELECT * FROM pg_locks WHERE locktype='advisory'` | 重启获取锁的实例；极端情况 `pg_advisory_unlock_all()` |
| `analysis_results` 撑爆 | `expires_at` 清理 goroutine 挂了 | 手动 `DELETE FROM analysis_results WHERE expires_at < NOW()`；重启 server |
| 磁盘快满 | 分区没清 + WAL 没回收 | DROP 老分区；检查 `max_wal_size` 和 replication slot |

### 5.3 备份

**阿里云 RDS PG** 默认自动备份（每日全量 + 持续 WAL）。保留周期按等级。

**自建 PG / 单机** 推荐：
```bash
# 每日全量（压缩后 < 原始 1/10）
pg_dump -Fc -h $HOST -U $USER pulse > /backup/pulse-$(date +%Y%m%d).dump

# 增量 WAL（需配置 archive_mode=on + archive_command）
# 详见官方文档 PITR 章节
```

**SQLite 模式**：
```bash
sqlite3 /var/lib/pulse/pulse.db ".backup /backup/pulse-$(date +%Y%m%d).db"
```

### 5.4 恢复演练（每季度做一次）

1. 拉一份备份文件
2. 在测试实例恢复：`pg_restore -d pulse_test /backup/pulse-xxx.dump`
3. 跑一次 `SELECT count(*) FROM probe_results WHERE scheduled_at > NOW()-'1h'` 校验
4. 跑一次全量迁移（`migrate up`）确保 schema 最新

> **没做过恢复演练的备份不是备份，是愿望。**

---

## 6. 数据一致性约束

| 场景 | 约束 | 实现 |
|------|------|------|
| 删除 service | probes.service_id 置 NULL | FK `ON DELETE SET NULL` |
| 删除 probe（软删） | `fault_intervals`、`probe_results` **不删** | 应用层过滤 `deleted_at IS NULL`；保留历史可查 |
| 同一 probe 同一 scheduled_at 重复 | 允许重复（edge 多源上报） | 查询时按 `(probe_id, scheduled_at, edge_node_id)` 去重 |
| push_token 冲突 | UNIQUE | `probes.push_token UNIQUE`，重新生成时 INSERT 冲突 → retry |
| fault_interval 未闭合 | `fault_end IS NULL` 表示进行中 | 每个 probe 同一时间最多一个 open interval，Writer 层保证 |

---

## 7. Redis 缓存

| Key Pattern | TTL | 失效策略 | 备注 |
|-------------|-----|---------|------|
| `sla:{probe_id}:{window}` | 5min | 懒过期 + aggregator 预热 | 查询主入口 |
| `sla:{service_id}:{window}` | 5min | 同上 | — |
| `heatmap:{probe_id}:{year}` | 1h | aggregator 覆写 | 90d 热力图数据源 |
| `daily_sla:{probe_id}:{date}` | 24h | aggregator 覆写 | — |
| `probe:status:{probe_id}` | 2 × interval | Writer 每次更新 | 状态变更检测用 |
| `edge:last_seen:{edge_id}` | 5min | Edge 心跳刷新 | — |
| `analysis:{key}` | varies | 跟 PG analysis_results 的 expires_at 一致 | — |

**一致性策略**：Cache-aside 模式。**所有写操作先写 PG，再更新缓存或删 key**（不走 write-through）。

Redis 挂了全链路降级为"查 PG + 计算"，只影响延迟不影响正确性。

---

## 8. 变更记录

| 日期 | 变更 | 迁移编号 | Commit |
|------|------|---------|--------|
| 2026-04-19 | 初版：整理自 IMPL_SPEC，补充迁移约定、分区、运维速查 | — | — |
