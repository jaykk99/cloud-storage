# CloudVault — Secure Cloud Storage

A full-stack file storage app built with React + Supabase + Vercel.

## Features
- 🔒 Access key lock screen (default: `999`, override with `VITE_ACCESS_KEY`; remembered per tab session)
- 👤 Supabase Auth (sign up / sign in)
- 📁 File browser: grid/list views, folders + breadcrumbs, search, category filters, 6 sort orders
- ⬆️ Drag-and-drop multi-file uploads with real progress bars, concurrency, cancel, retry, and exponential-backoff retries
- 🖼️ File previews: images (with thumbnails), video/audio players, text preview, signed URLs
- ✏️ Rename files, 🗑️ delete with confirmation, ⬇️ downloads
- 📊 Dashboard with storage usage, per-category counts + bytes
- 🤖 AI Copilot powered by Gemini 2.0 Flash (graceful keyless mode)
- 🔔 Toast notifications, honest error messages (e.g. missing bucket / storage policies)
- 📱 Mobile-friendly responsive layout

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
3. Create a **Storage bucket** named `vault`, then run the storage policies below
   (the app uploads each user's files under `<user_id>/…`, so these policies scope
   every user to their own folder)

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

-- Storage policies: users may only touch objects inside their own <user_id>/ folder
create policy "Users can upload own files"
  on storage.objects for insert
  with check (bucket_id = 'vault' and auth.uid()::text = (storage.foldername(name))[1]);

create policy "Users can read own files"
  on storage.objects for select
  using (bucket_id = 'vault' and auth.uid()::text = (storage.foldername(name))[1]);

create policy "Users can update own files"
  on storage.objects for update
  using (bucket_id = 'vault' and auth.uid()::text = (storage.foldername(name))[1]);

create policy "Users can delete own files"
  on storage.objects for delete
  using (bucket_id = 'vault' and auth.uid()::text = (storage.foldername(name))[1]);
```

### 2. Environment Variables
Copy `.env.example` to `.env.local` and fill in:

```
VITE_SUPABASE_URL=https://your-project.supabase.co
VITE_SUPABASE_ANON_KEY=your-anon-key
VITE_GEMINI_API_KEY=your-gemini-key   # optional — for AI Copilot
VITE_MAX_UPLOAD_MB=50                # optional — per-file upload cap
VITE_ACCESS_KEY=999                  # optional — lock-screen code
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
- No Supabase vars → the app shows a setup notice (with a per-variable checklist and copy-paste `.env.local` snippet) instead of a broken login.
- No Gemini key → the AI Copilot tab explains itself and stays inert; the rest of the vault works normally.

## Upload reliability
Uploads go straight to the Supabase Storage REST API over `XMLHttpRequest` so progress
is real, not faked. Each upload gets 3 attempts with exponential backoff, can be
cancelled mid-flight, and failed items stay in the transfer panel with a one-click
retry. Up to 3 files upload concurrently. The per-file size cap defaults to 50 MB
(`VITE_MAX_UPLOAD_MB`).
