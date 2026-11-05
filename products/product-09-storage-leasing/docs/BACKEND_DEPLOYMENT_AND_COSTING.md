# P09 Storage & Leasing — Backend, Deployment & Costing (documented 2026-11-05)

## Purpose
Durable record of: (1) the current data/persistence model, (2) the separate-repo push/sync state, (3) Cloudflare deployment constraints, (4) approximate costing, and (5) a 1st-principles evaluation of backend approaches. **Pricing and product limits change; verify current vendor pricing/limits before committing.**

## 1. Current persistence & deployment state (as implemented)
- **Client:** `src/engine/storageClient.ts`
  - `SERVER_URL = http://127.0.0.1:5182`
  - `STORAGE_KEY = p09-state-v2` (frozen localStorage fallback key)
  - Persisted shape (`schemaVersion: 1`): `facility, tenants, leases, ledger, maintenance, meterReadings, receipts`
  - Behavior: treats loopback server as authoritative when reachable; falls back to `localStorage` on failure.
- **Server:** `packages/storage-server/server.mjs` (Node, loopback)
  - Listens on `127.0.0.1:5182`, CORS allow-list limited to localhost ports 5170–5181.
  - Writes to `.local/storage-server/store.json` (mode 600, atomic rename). Normalizes to known `STATE_KEYS` (drops unknown keys).
- **Current dataset (observed):** ~2.5 KB JSON; 1 facility, 1 tenant, 1 lease, 1 ledger entry, 1 receipt, 0 maintenance/meter readings.
- **Implication:** no hosted API, no auth, no multi-user/tenant isolation, no cloud DB. “Prod” today = serve `dist/` + run the Node storage server on the same trusted host/network. A static Cloudflare Pages frontend **cannot** reach `127.0.0.1:5182`.

## 2. Repo / push state (verified 2026-11-05)
- **Monorepo:** `origin https://github.com/pranaysuyash/trucking.git` (branch `main`). Latest relevant P09 commits pushed: `269cd82` (Mantine v9 overhaul), `f4a005f` (tenant multi-space/different renters), `f233579` (sync gstInvoice/offlineOutbox + type/billing additions + durable doc/motto artifacts). Validation at `f233579`: `tsc --noEmit` ✅, `npm test` ✅ (10 files, 82 tests).
- **Separate product repo:** `https://github.com/pranaysuyash/storage-leasing.git` (public, `main`). Verified by fresh clone + `diff -rq` vs monorepo P09 (excluding `node_modules/dist/.git/.agent/.chrome-profile/.vite`): content was in sync (already contained Mantine overhaul, tenant multi-space, gstInvoice/offlineOutbox). Synced doc artifacts and pushed `7fee7bd..dc4d4f2` (`chore(p09): sync from trucking monorepo (f233579)`).
- **No automated per-product sync script/remotes** found in the monorepo (`scripts/` has no push/subtree-to-storage-leasing flow). Sync performed explicitly by mirroring P09 directory contents to a clone of `storage-leasing` and pushing.

## 3. Cloudflare deployment constraints
| Layer | Feasible? | Notes |
|---|---:|---|
| **Frontend (`dist/`) on Pages** | Yes | Static Vite build. P01 already deploys via `wrangler pages deploy dist --project-name=...`; P09 has no `wrangler.toml`/deploy script yet. |
| **Backend/data “as-is”** | No | Client hardcodes loopback URL; server is file-backed + localhost CORS. |
| **Cloud-native backend** | Yes, with redesign | Requires hosted API (e.g. Worker), persistent store (D1/KV/R2/external DB), CORS for Pages domain, auth/tenancy decisions, migration of `p09-state-v2`/`store.json`, and updated `storageClient` config/env.

## 4. Approximate costing (USD/month estimates; verify current rates)
Assumptions: small payloads (KBs–low MBs/facility), save-on-mutation/load-on-start, modest traffic. **Plan floors dominate at P09 scale; usage overages are usually ~$0 initially.**

| Component | Pricing basis (published; verify) |
|---|---|
| **Cloudflare Pages** | Free tier typically sufficient for static frontend. |
| **Workers** | Free: 100k req/day, 10ms CPU/req. **Workers Paid ~$5/mo** includes 10M req/mo + 30M CPU-ms/mo, then usage overages (verify exact overage rates/limits). |
| **D1** | Serverless SQL; meaningful prod commonly paired with Workers Paid. Includes baseline storage + rows read/written with overages (verify current D1 included units & overage pricing). |
| **KV (alternative)** | Per read/write/storage; simple blob keys, weaker querying/audit. |
| **R2 (backups/exports)** | Storage + ops; generally no egress fees — good for periodic JSON/CSV backups, not primary transactional store. |
| **Auth** | Not included. Cloudflare Access/Zero Trust has its own pricing; rolling auth in a Worker shifts cost to engineering/complexity. Domain/TLS: TLS included; domain registration separate. |

| Scenario | Shape | Likely monthly infra |
|---|---:|---:|
| Solo/dev/very low traffic | 1 facility/user, <1k req/day | **~$0–$5** (Free if constraints acceptable; **$5/mo** typical prod floor with Workers Paid + D1) |
| Small business (realistic P09) | 1–5 facilities, few staff, <50k req/mo, <100 MB | **~$5–$10** (floor dominates) |
| Growing/multi-tenant SaaS | many tenants/users, auth, audit, exports, higher QPS | **~$5–$25+ infra** (plus auth/product costs/decisions) |

**Bottom line:** infra is likely **~$5/mo** for a small Cloudflare deployment; the dominant costs/risks are **product/engineering decisions (auth, tenancy, data model, migration, compliance/audit)**, not raw D1/Workers overages at this scale.

## 5. 1st-principles backend evaluation — is Workers+D1 “best”?

### 1st principles (what problem are we actually solving?)
1. **Durable, authoritative state** accessible from where users run the app (not just localhost).
2. **Correctness & trust:** rent/ledger/receipts are financial-adjacent records — need integrity, auditability, backups/export, and predictable migrations.
3. **Access control:** who can read/write which facility’s data? (Currently **undefined/none** — the key unresolved variable.)
4. **Operational simplicity:** low traffic, small team, prefer low fixed cost and low ops burden.
5. **Evolution path:** from single landlord → possibly multi-facility/multi-user/tenant portal without a rewrite.
6. **Preserve current invariants where valuable:** `p09-state-v2` shape, local fallback/offline tolerance (optional), and the engine logic.

### Options compared
| Option | Cost (small) | Scale path | Ops burden | Auth/tenancy | Data/audit fit | Portability | Fit for P09 now |
|---|---:|---:|---:|---|---|---:|---|
| **Keep local loopback + Pages impossible for data** | $0 | Poor (not internet-accessible) | Low local, broken remote | None | File blob | N/A | Only local/dev |
| **Workers + D1 (normalized or blob row)** | **~$5/mo** | Good for this workload; edge-simple | **Low** (serverless) | BYO or Access | Good with SQL schema; blob possible | Medium (SQL portable, Workers runtime specifics) | **Strong if single/few users & scope clear** |
| **Workers + KV (blob-per-facility)** | ~$5/mo+ | Fine for blob reads/writes | Low | BYO | Weak for queries/reporting/audit/migrations | Medium | OK short-term, limiting for ledger/reporting |
| **Durable Objects** | ~$5/mo+ (usage nuances) | Strong for coordination/per-tenant state | Medium | BYO | Good for single-tenant coordination | Lower (Cloudflare-specific) | Overkill unless real-time/collab/strong per-tenant serialization needed |
| **Supabase (Postgres + Auth + RLS + Storage)** | **$0 tier limited; ~$25/mo** Pro typical for real prod headroom | **Very good** | Low–medium | **Built-in (major advantage)** | **Excellent** (Postgres, RLS, backups, SQL) | **High** (standard Postgres) | **Strong if multi-user/auth/tenant portal needed soon** |
| **Neon/managed Postgres + thin API (Worker/Node/serverless)** | ~$0–$19+ DB + API host | Very good | Low–medium | BYO | Excellent | High | Strong, flexible; a bit more assembly than Supabase |
| **Firebase/Firestore** | Variable; can be cheap then spiky | Good | Low | Built-in | Good doc model; SQL/reporting/export differ | Medium (vendor model) | Viable, but less natural for ledger/relational reporting than SQL |
| **Small VPS (Fly/Render/Railway) + SQLite/Postgres** | ~$5–$15+/mo | Good | **Medium** (patching/deploys/monitoring) | BYO | Good | High | Fine, but more ops than needed for this scale |

### Recommendation (conditional, 1st-principles)
- **If the near-term goal is “get P09 working online for a single landlord/trusted small team, cheapest/fastest, low ops”:** **Cloudflare Pages + Workers + D1** is a **cost-effective, scalable-enough, pragmatic** choice. Use **D1** (not KV) so ledger/tenants/receipts remain queryable/auditable; keep schema simple (even a JSON state row per facility initially, with a migration path to normalized tables). **Not sufficient alone for secure multi-user production** until auth/authorization is designed.
- **If multi-user access, tenant portal, role-based access, or “real SaaS” is likely soon:** prefer a backend with **first-class auth + row-level security** (often **Supabase/Postgres + RLS**) even if baseline cost is higher (~$25/mo vs ~$5/mo). The avoided auth/authorization mistakes and faster safe iteration usually dominate infra savings for financial-adjacent data.
- **Long-term/1st-principles “best”:** the approach that makes **authorization explicit, data auditable/exportable, migrations safe, and vendor lock-in bounded**. For P09 specifically: **a SQL-backed store (D1 or Postgres) + explicit authz model + backup/export** beats a blob-only/KV design. Cloudflare is excellent on cost/ops; Postgres/Supabase is often better on **auth, portability, and relational maturity**.

### Decision required before backend implementation
1. **Access model:** single user/shared secret, or multi-user with roles? Tenant self-service portal?
2. **Auth now?** (strongly recommended before exposing real data publicly)
3. **Data model:** blob-per-facility (fastest migration) vs normalized D1/Postgres tables (better long-term)
4. **Offline/local fallback:** keep `localStorage` fallback or make cloud authoritative-only when logged in?
5. **Compliance/audit needs:** GST invoices/receipts/ledger retention/export requirements?

## 6. Known unrelated console noise (user-reported)
- `contentscript.js` `MaxListenersExceededWarning` / `ObjectMultiplex - orphaned data` (`app-init-liveness`, `background-liveness`) — consistent with browser extension (e.g., wallet) content scripts, **not P09**.
- Vite `Failed to reload /src/ui/App.tsx ... 500` — observed as **transient HMR failures during edits**; resolved state verified by typecheck/build/tests and dev-server transform response.

## 7. Next step (when authorized)
Produce and execute a backend plan tailored to the confirmed access/auth/data-model decisions: API design, schema, `storageClient` migration (env-based URL), CORS/auth, migration of `p09-state-v2`/`store.json`, backups/export, P09 Pages deploy config, and verification (including failure/retry/idempotency where applicable).
