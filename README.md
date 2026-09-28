# CloudVault — Secure Cloud Storage

A full-stack file storage app built with React + Supabase + Vercel.

## Features
- 🔒 Access key lock screen (default: `999`)
- 👤 Supabase Auth (sign up / sign in)
- 📁 File upload, download, delete (via Supabase Storage)
- 📊 Dashboard with storage usage & file categories
- 🤖 AI Copilot powered by Gemini 2.0 Flash

## Tech Stack
- **Frontend**: React + Vite + Tailwind CSS
- **Auth & Database**: Supabase Auth + Postgres
- **File Storage**: Supabase Storage (`vault` bucket)
- **AI**: Google Gemini 2.0 Flash API
- **Deployment**: Vercel

## Setup

### 1. Supabase Setup
1. Create a project at [supabase.com](https://supabase.com)
2. Run the SQL below in **SQL Editor**
3. Create a **Storage bucket** named `vault` (set to Public)

```sql
-- Create files table
create table files (
  id uuid default gen_random_uuid() primary key,
  user_id uuid references auth.users(id) on delete cascade not null,
  name text not null,
  size bigint default 0,
  type text default 'application/octet-stream',
  storage_path text not null,
  public_url text,
  created_at timestamptz default now()
);

-- Row level security
alter table files enable row level security;

create policy "Users can manage own files"
  on files for all
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);
```

### 2. Environment Variables
Copy `.env.example` to `.env.local` and fill in:

```
VITE_SUPABASE_URL=https://your-project.supabase.co
VITE_SUPABASE_ANON_KEY=your-anon-key
VITE_GEMINI_API_KEY=your-gemini-key   # optional — for AI Copilot
```

### 3. Run Locally
```bash
npm install
npm run dev
```

### 4. Deploy to Vercel
1. Push to GitHub
2. Import repo on [vercel.com](https://vercel.com)
3. Add the 3 environment variables in Vercel dashboard
4. Deploy!

## Default Access Key
The vault lock screen uses key: **`999`** (override with `VITE_ACCESS_KEY` in `.env.local` or Vercel env vars). Change it — the default is public.

## Graceful Degradation
- No Supabase vars → the app shows a setup notice instead of a broken login.
- No Gemini key → the AI Copilot tab explains itself and stays inert; the rest of the vault works normally.
