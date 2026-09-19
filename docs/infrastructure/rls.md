# TUKUBI Row-Level Security (RLS) Architecture & Policy Matrix

**Status:** Production Ready  
**Version:** September 2026 Master Baseline  
**Total Tables Protected by RLS:** 208 (100% of public schema tables & partitions)  
**Tables with RLS Enabled but 0 Policies:** **0**  

---

## 1. Architectural Mandate

Row-Level Security is TUKUBI's primary data defense barrier. Under no circumstances may client software directly read, insert, update, or delete rows outside of explicit, evaluated RLS policies.

- **Default Deny:** Every table has `ALTER TABLE <name> ENABLE ROW LEVEL SECURITY;` executed. Without an explicit matching policy, all queries return empty sets or fail.
- **Role Separation:** Policies differentiate between `anon` (unauthenticated public views), `authenticated` (verified platform members), and `service_role` (system background jobs).
- **PostgREST Schema Cache Awareness:** While PostgreSQL 17 handles partition routing through the parent table, PostgREST inspects child partition tables in the `public` schema. Therefore, all partitioned children maintain explicit, mirror RLS policies to eliminate security advisor warnings and guarantee defense-in-depth.

---

## 2. RLS Security Helper Functions

To avoid complex multi-table joins inside hot RLS paths, optimized cached security helper functions are utilized:

### 2.1 `is_admin(user_id UUID) RETURNS BOOLEAN`
Inspects `public.admin_roles` to verify if the given user has platform superadmin or operator status.

### 2.2 `is_community_moderator(p_community_id UUID, p_user_id UUID) RETURNS BOOLEAN`
Joins `public.community_members cm` and `public.community_roles cr` on `cr.id = cm.role_id`:
```sql
SELECT EXISTS (
  SELECT 1 FROM public.community_members cm
  JOIN public.community_roles cr ON cr.id = cm.role_id
  WHERE cm.community_id = p_community_id
    AND cm.user_id = p_user_id
    AND cr.can_moderate = true
);
```

### 2.3 `is_business_member(p_business_id UUID, p_user_id UUID, required_roles TEXT[]) RETURNS BOOLEAN`
Queries `public.business_members` to verify user belongs to the page/business with sufficient role privilege (`owner`, `admin`, `editor`).

### 2.4 `is_conversation_participant(p_conversation_id UUID, p_user_id UUID) RETURNS BOOLEAN`
Checks membership in `public.conversation_participants` where `left_at IS NULL`.

---

## 3. Policy Classification Matrix

| Domain | Table / Partition Set | Permitted Operations | RLS Evaluation Logic |
| :--- | :--- | :--- | :--- |
| **Profiles** | `public.profiles` | `SELECT` (Public)<br>`UPDATE` (Owner) | Anyone can view public profiles. Only `id = auth.uid()` can update personal data. |
| **Settings** | `public.user_settings` | `ALL` (Owner) | Strictly `user_id = auth.uid()`. Never visible to other users. |
| **Posts** | `public.posts` | `SELECT` (Filtered)<br>`INSERT/UPDATE` (Author) | Visibility: `visibility = 'public'` OR (followers if `visibility = 'followers'`) OR author. Updates: `author_id = auth.uid()`. |
| **Messaging** | `public.chat_messages` & `chat_messages_p[0-7]` | `SELECT/INSERT` (Participant) | Evaluates `is_conversation_participant(conversation_id, auth.uid())`. Sender must be `auth.uid()`. |
| **Timelines** | `public.feed_activity_timeline` & partitions | `SELECT` (Owner) | Strictly `user_id = auth.uid()`. Users only see their own calculated timeline items. |
| **Businesses** | `public.businesses` | `SELECT` (Public)<br>`UPDATE` (Admin) | Public directory accessible. Updates require `is_business_member(id, auth.uid(), ARRAY['owner', 'admin'])`. |
| **Communities**| `public.communities` | `SELECT` (Rules)<br>`UPDATE` (Owner/Admin) | Public hubs visible to all. Private hubs visible only to active members. Updates restricted to community admins. |
| **Marketplace**| `public.marketplace_listings` | `SELECT` (Active)<br>`WRITE` (Seller) | Public can browse active listings. Only merchant owner can mutate listing and inventory. |
| **Orders** | `public.marketplace_orders` | `SELECT/UPDATE` (Parties) | Accessible only by `buyer_id = auth.uid()` OR merchant business owner/admin. |
| **Ledger** | `public.ledger_*` & `wallets` | `SELECT` (Owner)<br>`INSERT` (Service) | Wallets readable by owner (`user_id = auth.uid()`). Direct ledger tables accessible exclusively by `service_role`. |
| **Telemetry** | `public.analytics_events` & partitions | `INSERT` (Auth/Anon)<br>`SELECT` (Admin/Service) | Anyone can log privacy-sanitized events. Reading restricted to platform telemetry jobs. |
| **Reconciliation**| `public.reconciliation_reports` | `ALL` (Service Role) | Internal financial ledger integrity reports strictly accessible by `service_role`. |

---

## 4. Partition RLS Hardening Verification

In Migration `00093`, all 28 partitions and internal tables that triggered Supabase advisor findings were hardened with explicit policies:
1. `reconciliation_reports`: Secured with service-role-only policy.
2. `analytics_events_2026_01` through `12` and default: Added explicit insert and admin read policies.
3. `chat_messages_p0` through `p7`: Added explicit participant read/insert policies.
4. `feed_activity_timeline_2026_08` through `12` and default: Added explicit owner timeline policies.

**Current Live Audit Count:** `0` tables with RLS enabled and 0 policies.
