# TUKUBI — Database & Supabase Migration Audit
## Document Reference: TUKUBI-EXCELLENCE-DB-001

### 1. Database Architecture Overview
TUKUBI utilizes PostgreSQL hosted on Supabase, managed via 118 versioned migration scripts in `supabase/migrations/`.
All schema alterations adhere strictly to:
- Backward-compatible DDL operations.
- Zero mutable column balance increments.
- Mandatory Row Level Security (RLS) on all client-accessible tables.
- Proper foreign key indexing to prevent full table scans.

---

### 2. Migration Timeline & Recent Hardening

| Migration Range | Key Scope & Capabilities |
| :--- | :--- |
| `00001` – `00050` | Core tables (`profiles`, `posts`, `comments`, `reactions`, `follows`, `friendships`, `conversations`, `messages`) |
| `00051` – `00090` | Double-entry financial ledger (`ledger_accounts`, `ledger_entries`, `trg_ledger_sum_zero`), wallets, escrow |
| `00091` – `00110` | Communities, Pages 2.0, Events, Relief campaigns, Shorts vertical video storage & indexing |
| `00111` – `00116` | Legal consent, account lifecycle, advertising production hardening, dual-host livestreams, RPC security |

---

### 3. Row Level Security (RLS) Posture

- **100% RLS Coverage:** Every table exposed to PostgREST API has `ROW LEVEL SECURITY` enabled.
- **Bi-Directional Block Enforcement:**
  ```sql
  CREATE POLICY "Posts are visible to non-blocked users"
  ON posts FOR SELECT
  USING (
    NOT EXISTS (
      SELECT 1 FROM blocks
      WHERE (blocker_id = posts.user_id AND blocked_id = auth.uid())
         OR (blocker_id = auth.uid() AND blocked_id = posts.user_id)
    )
  );
  ```
- **Financial Account Protection:**
  ```sql
  CREATE POLICY "Users can only read their own ledger accounts"
  ON ledger_accounts FOR SELECT
  USING (auth.uid() = user_id);
  ```

---

### 4. Query Performance & Indexing Analysis
- **Post Feeds:** Indexed on `(user_id, created_at DESC)` and `(community_id, created_at DESC)`.
- **Direct Messaging:** Compound index on `(conversation_id, created_at ASC)` for rapid chat thread loading.
- **Search:** GIN indexes with `gin_trgm_ops` on `profiles.username`, `profiles.display_name`, `posts.content`, and `communities.name`.
