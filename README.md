# Reply Monitor Dashboard

Claude-inspired dark dashboard for monitoring Instantly.ai campaign replies.
Built with React + Vite + Supabase. Deployed on Railway.

## Stack
- React 18 + Vite
- Supabase (realtime + DB)
- Railway (hosting)
- DM Sans + DM Mono fonts

## Features
- Realtime reply feed (Supabase realtime)
- Filter by campaign / status / POC / search
- Status update per reply (New, Hot Lead, Follow Up, Replied, Not Interested)
- SDR notes per reply
- Right-panel detail view (email thread style)
- Metric cards at top
- Collapsible sidebar

---

## Setup

### 1. Supabase — Create Table

Run in Supabase SQL Editor:

```sql
create table instantly_replies (
  id                bigint generated always as identity primary key,
  timestamp         timestamptz default now(),
  campaign_name     text,
  lead_email        text,
  lead_name         text,
  reply_subject     text,
  reply_body        text,
  campaign_id       text,
  sending_email     text,
  sent_email_body   text,
  status            text default 'New',
  poc               text,
  sdr_notes         text,
  created_at        timestamptz default now()
);

create index on instantly_replies (campaign_name);
create index on instantly_replies (status);
create index on instantly_replies (poc);

alter table instantly_replies enable row level security;

create policy "insert_allowed" on instantly_replies for insert with check (true);
create policy "read_allowed" on instantly_replies for select using (true);
create policy "update_allowed" on instantly_replies for update using (true);
```

Enable Realtime on the table:
Supabase → Table Editor → instantly_replies → Realtime → Enable

### 2. Local Development

```bash
cp .env.example .env
# Fill in your Supabase URL and anon key

npm install
npm run dev
```

### 3. Deploy to Railway

1. Push this folder to a GitHub repo
2. Railway → New Project → Deploy from GitHub repo
3. Add environment variables in Railway:
   - VITE_SUPABASE_URL
   - VITE_SUPABASE_ANON_KEY
4. Railway auto-detects Vite and builds

### 4. Apps Script — write to Supabase

In your Google Apps Script, set:
```js
const SUPABASE_URL = "https://YOUR_PROJECT.supabase.co"
const SUPABASE_KEY = "your_anon_key"
```

The script POSTs to `/rest/v1/instantly_replies` on every reply received.

---

## POC Mapping

Edit `POC_MAP` in Apps Script to assign campaigns to POCs:

```js
const POC_MAP = {
  "Harry Potter - Wave 1": "Ajeet",
  "SLED Outreach Q2":      "Priya",
  "CloudTech Campaign":    "Rahul",
}
```
