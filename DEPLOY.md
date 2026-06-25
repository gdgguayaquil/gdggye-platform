# Deployment — Vercel + Supabase Cloud

End-to-end recipe for deploying the GDG Guayaquil platform. Two halves:
backend (Supabase Cloud) first, because Vercel needs its URL + keys.

## Topology

- **Backend:** one Supabase Cloud project (Postgres + Auth + Storage). Shared
  across all front-ends.
- **Frontend:** three Vercel projects, one per Next.js app, all pointing at the
  same GitHub repo with different root directories.

| Vercel project   | Root directory       | Production domain              |
| ---------------- | -------------------- | ------------------------------ |
| gdggye-web       | `apps/web-main`      | `gdggye.org`, `www.gdggye.org` |
| gdggye-bwai-2026 | `apps/web-bwai-2026` | `2026.bwai.gdggye.org`         |
| gdggye-admin     | `apps/web-admin`     | `admin.gdggye.org` (private)   |

---

## 1) Supabase Cloud (backend)

### 1.1 Create + link the project

```bash
# In supabase.com: New project → pick a region close to Guayaquil (us-east-1).
# Save the project ref (e.g. abcdefghijkl) and the DB password.

cd /path/to/gdggye-platform
npx supabase login
npx supabase link --project-ref <project-ref>
npx supabase db push           # applies migrations 0001–0006 to cloud
npm run supabase:types         # regenerate types against linked project
```

Commit the regenerated `packages/types/src/database.ts`.

### 1.2 Configure auth in the dashboard

**Authentication → URL Configuration**

- Site URL: `https://gdggye.org`
- Additional Redirect URLs (every host that will sign users in):
  - `https://*.vercel.app` (so preview deploys work)
  - `https://gdggye.org/**`
  - `https://2026.bwai.gdggye.org/**`
  - `https://admin.gdggye.org/**`

**Authentication → Providers → Google**

1. Enable Google.
2. Paste the same client ID + secret you set up locally.
3. In Google Cloud Console → Credentials → your OAuth client, **add** the cloud
   redirect URI: `https://<project-ref>.supabase.co/auth/v1/callback`.

**Authentication → Hooks → Custom Access Token**

- Enable, point at `public.custom_access_token_hook`.
- The function itself ships in migration `0003_access_token_hook.sql`, but the
  hook **must be toggled on in the dashboard** — it does not auto-register from
  the SQL definition.

### 1.3 Grab the API keys

**Project Settings → API**:

| Key              | Use as env var                  | Exposure        |
| ---------------- | ------------------------------- | --------------- |
| Project URL      | `NEXT_PUBLIC_SUPABASE_URL`      | public          |
| anon public key  | `NEXT_PUBLIC_SUPABASE_ANON_KEY` | public          |
| service_role key | `SUPABASE_SERVICE_ROLE_KEY`     | **server-only** |

---

## 2) Vercel (frontend) — three projects, one repo

Create three Vercel projects pointing at the same GitHub repo. Per project:

- **Framework preset:** Next.js
- **Root Directory:** the app folder from the topology table above
- **Install Command:** leave default (Vercel detects npm workspaces at the
  repo root)
- **Build Command** (swap the package name per project):
  ```
  cd ../.. && npx turbo run build --filter=@gdggye/web-main
  ```
  Turbo's filter ensures shared packages build first; remote-cache cuts cold
  builds significantly.
- **Output Directory:** `.next` (default)
- **Node version:** 20

### 2.1 Environment variables

Set these in **Settings → Environment Variables** for each project. Mark
non-`NEXT_PUBLIC_*` vars as **Production + Preview** only — never expose
service-role to the browser.

**web-main, web-bwai-2026, web-admin (all):**

```
NEXT_PUBLIC_SUPABASE_URL=https://<project-ref>.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=<anon key>
```

**web-bwai-2026 (additional):**

```
SUPABASE_SERVICE_ROLE_KEY=<service role key>
QR_SIGNING_SECRET=<openssl rand -hex 32>
```

**web-admin (additional):**

```
SUPABASE_SERVICE_ROLE_KEY=<service role key>
QR_SIGNING_SECRET=<same value as bwai>
```

> `QR_SIGNING_SECRET` **must be identical** in every app that mints or verifies
> tokens, otherwise scans will be rejected. Generate once with
> `openssl rand -hex 32`, then paste it into every project. 32+ chars required.

---

## 3) Domains

Per Vercel project → Domains:

- `gdggye.org` + `www.gdggye.org` on **web-main** (Vercel guides DNS: usually
  `A 76.76.21.21` on the apex and `CNAME cname.vercel-dns.com` on `www`).
- `2026.bwai.gdggye.org` on **web-bwai-2026** (CNAME).
- `admin.gdggye.org` on **web-admin** (CNAME). Consider Vercel Password
  Protection on top of the invite-only SQL flow.

After domains resolve, return to Supabase → Authentication → URL Configuration
and **replace** the `*.vercel.app` entries with the real domains.

---

## 4) Promote the first admin

Admin is invite-only. After deploy, sign in once with your Google account
through `admin.gdggye.org`, then in Supabase SQL Editor:

```sql
update public.profiles set system_role = 'admin' where email = 'you@example.com';
```

`signInBootstrap` defaults new users to `attendee` — promotion only happens
via SQL.

---

## 5) CI / DX niceties (optional)

- **Turborepo remote cache:** run `npx turbo login && npx turbo link` locally.
  Vercel uses its own remote cache automatically, which dramatically cuts cold
  builds for shared packages.
- **PR previews:** the GitHub ↔ Vercel integration auto-deploys PR previews
  per project. All three apps get their own preview URL on the same PR.
- **Schema-drift guard:** add a GitHub Action that runs
  `supabase db push --dry-run` against a shadow DB to catch breaking migrations
  before merge.
- **Per-app build filters:** in each Vercel project, set **Ignored Build Step**
  to `npx turbo-ignore @gdggye/web-main` (swap the package name). Each app
  then redeploys only when its files or its dependency packages actually
  change.

---

## Gotchas

- **Cross-subdomain sessions.** By default each subdomain has its own auth
  session. If you ever want `gdggye.org` and `2026.bwai.gdggye.org` to share a
  signed-in user, set Supabase Auth → Cookie domain to `.gdggye.org`. Fine to
  leave separate for Phase 2.
- **Type drift breaks builds.** If `packages/types/src/database.ts` doesn't
  match the live cloud schema, web-admin builds will fail with cryptic
  property errors. Always run `npm run supabase:types` after `db push` and
  commit the result.
- **`server-only` enforcement.** Local `next dev` is permissive about
  accidental client→server imports; the Vercel build catches them. That's the
  safety net working — fix the import, don't silence it.
- **Custom Access Token hook is a dashboard toggle.** It is the most common
  reason `system_role` is missing from JWTs in production after a fresh
  `db push`. Verify the hook is enabled in the dashboard, then sign out + back
  in to refresh the token.
- **PWA on Vercel.** The service worker is generated at build time and served
  from `/sw.js` at the edge — no extra config needed.

---

## Quick reference

| Need                                | Command                                                     |
| ----------------------------------- | ----------------------------------------------------------- |
| Apply migrations to cloud           | `npx supabase db push`                                      |
| Regenerate types from cloud schema  | `npm run supabase:types`                                    |
| Promote a user to admin             | `update public.profiles set system_role='admin' where ...;` |
| Generate a 32+ char QR signing key  | `openssl rand -hex 32`                                      |
| Link Turborepo remote cache locally | `npx turbo login && npx turbo link`                         |
