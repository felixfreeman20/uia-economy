# VoxBank — School Economy Platform

A full-stack school economy platform with real accounts, stock markets, QR payments, gambling, factions, government, and more. Built with Next.js 14 + Supabase + Vercel.

---

## Stack

- **Frontend/Backend**: Next.js 14 (App Router)
- **Database + Auth**: Supabase (Postgres + Row Level Security)
- **Deployment**: Vercel
- **Styling**: Tailwind CSS

---

## Setup Guide

### 1. Supabase

1. Go to [supabase.com](https://supabase.com) → New Project
2. Once created, go to **SQL Editor**
3. Paste the entire contents of `supabase/schema.sql` and run it
4. Go to **Project Settings → API** and copy:
   - `Project URL`
   - `anon public` key
   - `service_role` key (keep this secret)

### 2. Local Development

```bash
# Clone your repo
git clone https://github.com/yourusername/voxbank
cd voxbank

# Install dependencies
npm install

# Set up environment
cp .env.local.example .env.local
# Fill in your Supabase credentials in .env.local

# Run dev server
npm run dev
```

Open [http://localhost:3000](http://localhost:3000)

### 3. Deploy to Vercel

1. Push to GitHub
2. Go to [vercel.com](https://vercel.com) → Import repository
3. Add environment variables:
   - `NEXT_PUBLIC_SUPABASE_URL`
   - `NEXT_PUBLIC_SUPABASE_ANON_KEY`
   - `SUPABASE_SERVICE_ROLE_KEY`
   - `NEXT_PUBLIC_APP_URL` (your vercel URL)
4. Deploy

---

## Features

| Feature | Status |
|---|---|
| Real accounts & auth | ✅ Supabase Auth |
| VOX wallet & transfers | ✅ Atomic DB transactions |
| QR payments | ✅ Generate & scan |
| Stock market (6 stocks) | ✅ Live price simulation |
| Item shop (8 items, rarity tiers) | ✅ |
| Player marketplace | ✅ |
| Inventory system | ✅ |
| Casino (coinflip, dice, slots) | ✅ |
| Loans & debt | ✅ 10% interest |
| Leaderboard | ✅ Top 50 |
| Government & elections | ✅ Admin-managed |
| Factions/gangs | ✅ Admin-managed |
| Economy events | ✅ DB-driven |
| Black market | 🔧 Schema ready, UI extendable |
| Businesses | 🔧 Schema ready, UI extendable |
| Daily challenges | 🔧 Schema ready, UI extendable |

---

## Admin Setup

To make yourself admin:
1. Register an account normally
2. Go to Supabase → Table Editor → `profiles`
3. Find your row and set `role` to `admin`

Admins can:
- Create economy events
- Create elections
- Pass government policies
- Ban users
- Set up factions

---

## Stock Price Updates

Stock prices update via `PUT /api/stock`. To automate this:

1. In Vercel, set up a **Cron Job** (Pro plan) or use [cron-job.org](https://cron-job.org) (free)
2. Point it at `https://yourdomain.com/api/stock` with method `PUT`
3. Set frequency to every 10-30 minutes

---

## Currency

**VOX** — All balances stored as integers (no decimals). Starting balance: **1,000 VOX** per new account.
