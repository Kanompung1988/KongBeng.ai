# KongBeng AI — Vercel Deployment Checklist

## Phase 5 — Prompt 10: Deployment Guide

---

## 1. Environment Variables (Vercel Dashboard)

Set these in Vercel → Project Settings → Environment Variables:

| Variable | Value | Where to get |
|---|---|---|
| `NEXT_PUBLIC_SUPABASE_URL` | `https://xxx.supabase.co` | Supabase → Settings → API |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | `eyJ...` | Supabase → Settings → API |
| `DATABASE_URL` | Pooler URL (port 6543) | Supabase → Settings → Database |
| `DIRECT_URL` | Direct URL (port 5432) | Supabase → Settings → Database |
| `GEMINI_API_KEY` | `AIza...` | Google AI Studio |
| `NEXT_PUBLIC_APP_URL` | `https://kongbeng.com` | Your domain |
| `NEXT_PUBLIC_APP_NAME` | `KongBeng Strategist` | — |
| `NEXTAUTH_SECRET` | `openssl rand -base64 32` | your terminal |

---

## 2. Supabase Setup

```bash
# 1. Create project at supabase.com

# 2. Enable Row Level Security on all tables
# (Prisma manages migrations, but enable RLS in Supabase dashboard)

# 3. Push schema
npx prisma db push

# 4. Create admin user in Supabase Auth → Users → Add user
```

---

## 3. Database Caching Strategy

To reduce DB cost, use these ISR (Incremental Static Regeneration) settings:

```tsx
// In /stock/[symbol]/page.tsx, add:
export const revalidate = 3600; // Cache for 1 hour

// For the homepage:
export const revalidate = 900; // Cache for 15 min
```

**Additional optimizations:**
- Enable Supabase connection pooling (PgBouncer) — already configured via `DATABASE_URL` port 6543
- Use `prisma.stock.findUnique` (primary key lookup) — O(1) cost
- The `viewCount` increment is fire-and-forget (won't block page render)

---

## 4. Vercel Build Command

```
prisma generate && next build
```

Add this in: Vercel → Project Settings → Build & Output Settings → Build Command

---

## 5. Pre-Deployment Checklist

- [ ] All env vars set in Vercel dashboard
- [ ] `prisma db push` run on production database
- [ ] At least 1 admin user created in Supabase Auth
- [ ] At least 1 published stock added via `/admin`
- [ ] Test `/stock/CPALL` renders correctly
- [ ] Test AI chat drawer responds
- [ ] Test `⌘K` search works
- [ ] Test share card download
- [ ] Verify OG meta tags at `opengraph.xyz`
- [ ] Add custom domain in Vercel → Domains

---

## 6. Performance Notes

| Page | Strategy | Expected TTL |
|---|---|---|
| `/` (homepage) | ISR 15min | ~50ms (cached) |
| `/stock/[symbol]` | ISR 1hr | ~50ms (cached) |
| `/api/stocks/search` | No cache (dynamic) | ~200ms |
| `/api/chat` | Streaming (no cache) | Streaming |
| `/api/share-card` | Cache 24hr | ~300ms first, ~10ms cached |

---

## 7. Domain Setup (kongbeng.com)

```
Vercel → Project → Domains → Add Domain → kongbeng.com
```

Then add DNS records at your registrar:
- `A` record: `76.76.21.21`
- `CNAME` for `www`: `cname.vercel-dns.com`
