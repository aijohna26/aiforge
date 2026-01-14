-- Enable UUID extension
create extension if not exists "uuid-ossp";

-- Messages Table (Stores Chat History)
create table if not exists messages (
  id text primary key, -- Changed from UUID to TEXT to support AI SDK IDs
  role text not null check (role in ('user', 'assistant', 'system')),
  content text,
  created_at timestamptz default now()
);

-- Fragments Table (Stores Generated Code Snapshots)
create table if not exists fragments (
  id uuid primary key default uuid_generate_v4(),
  message_id text references messages(id) on delete cascade, -- Changed to TEXT
  project_id text, -- Optional: Link to a Project ID (e.g. from Plan)
  files jsonb, -- JSON Object: { "path/to/file": "content" }
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

-- Plan Tickets Table (Mirrors Plan functionality)
create table if not exists plan_tickets (
    id text primary key, -- Changed from UUID to TEXT (e.g. "PROJ-1")
    user_id uuid, -- Supabase Auth User ID
    project_id text,
    key text,
    title text,
    description text,
    type text,
    status text,
    priority text,
    acceptance_criteria text[],
    estimated_hours numeric,
    assigned_to text,
    related_screens text[],
    related_data_models text[],
    dependencies text[],
    labels text[],
    parallel boolean,
    order_index numeric,
    metadata jsonb, -- Stores Screen Analysis and extra details
    created_at timestamptz default now(),
    updated_at timestamptz default now()
);

-- RLS Policies (Row Level Security) - Optional but detailed
alter table messages enable row level security;
alter table fragments enable row level security;
alter table plan_tickets enable row level security;

-- Allow public access for now (Development Mode)
-- In production, restrict to auth.uid()
create policy "Allow all access for development" on messages for all using (true);
create policy "Allow all access for development" on fragments for all using (true);
create policy "Allow all access for development" on plan_tickets for all using (true);
