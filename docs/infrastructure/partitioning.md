# TUKUBI Partitioning Architecture & Lifecycle Management

**Status:** Production Ready  
**Version:** September 2026 Master Baseline  

---

## 1. Partitioning Strategy Overview

To maintain predictable single-digit millisecond query latencies as user activity scales across the Caribbean and diaspora, TUKUBI implements native PostgreSQL 17 declarative partitioning on high-volume tables.

```
Partition Topology:
├── analytics_events (RANGE by created_at - Monthly)
│   ├── analytics_events_2026_01 ... 2026_12
│   └── analytics_events_default
├── feed_activity_timeline (RANGE by created_at - Monthly)
│   ├── feed_activity_timeline_2026_08 ... 2026_12
│   └── feed_activity_timeline_default
└── chat_messages (HASH by conversation_id - 8 Buckets)
    ├── chat_messages_p0
    ├── chat_messages_p1
    ├── chat_messages_p2
    ├── chat_messages_p3
    ├── chat_messages_p4
    ├── chat_messages_p5
    ├── chat_messages_p6
    └── chat_messages_p7
```

---

## 2. Partitioned Entity Specifications

### 2.1 `chat_messages` (Hash Partitioning)
- **Partition Key:** `conversation_id` (UUID).
- **Modulus / Buckets:** 8 hash partitions (`chat_messages_p0` through `chat_messages_p7`).
- **Pruning Mechanism:** Every chat message query includes `WHERE conversation_id = $1`. PostgreSQL's query planner automatically prunes 7 of the 8 partitions, reading exclusively from the single matching partition bucket.
- **Index Distribution:** Each partition maintains local B-tree indexes on `(conversation_id, created_at DESC)` and `(sender_id)`.

### 2.2 `analytics_events` (Monthly Range Partitioning)
- **Partition Key:** `created_at` (TIMESTAMPTZ).
- **Range Boundaries:** 1st day of month 00:00:00 UTC to 1st day of next month 00:00:00 UTC.
- **Default Partition:** Catches any events falling outside active pre-provisioned month ranges.
- **Retention & Archival:** Partitions older than 180 days can be detached (`ALTER TABLE ... DETACH PARTITION`) and exported to cold storage (Parquet / S3 Glacier) without taking locks on the active table.

### 2.3 `feed_activity_timeline` (Monthly Range Partitioning)
- **Partition Key:** `created_at` (TIMESTAMPTZ).
- **Fan-Out Optimization:** Timeline writes distribute posts into follower timelines. Range partitioning ensures recent timeline reads hit memory-cached active partitions, preventing random disk I/O on historical archives.

---

## 3. Automated Partition Provisioning Pipeline

Partitions are provisioned ahead of time using the hardened administrative RPC:

```sql
SELECT public.create_monthly_partition('analytics_events', 2026, 10);
SELECT public.create_monthly_partition('feed_activity_timeline', 2026, 10);
```

### Automation Architecture:
- **Scheduler:** Triggered on the 25th day of every month at 02:00 UTC via a scheduled Edge Worker / `pg_cron` invoking Supabase Management API.
- **Security Isolation:** Migration `00093` explicitly revoked execution from `PUBLIC`, `anon`, and `authenticated`. Only `service_role` can execute partition creation.
- **Idempotency:** The provisioning function checks `to_regclass(partition_name)` and skips execution if the target partition already exists.
- **Universal RLS Propagation:** Every dynamically created partition inherits and establishes explicit RLS policies, preventing post-creation advisor findings.
