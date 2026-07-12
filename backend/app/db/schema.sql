-- SortHire Postgres schema (Supabase)
-- Run in Supabase SQL editor. Assumes auth.users already exists (Supabase Auth).

create extension if not exists "uuid-ossp";
create extension if not exists pgcrypto;

-- ============ PROFILES ============
create table if not exists profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  full_name text,
  email text,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

-- ============ RESUMES (current + history; only one "active" per user) ============
create table if not exists resumes (
  id uuid primary key default uuid_generate_v4(),
  user_id uuid not null references auth.users(id) on delete cascade,
  file_path text not null,          -- path in Supabase Storage bucket "resumes"
  file_name text not null,
  is_active boolean default true,
  raw_text text,
  parsed_json jsonb default '{}',   -- {skills:[], education:[], experience:[], projects:[]}
  ats_score numeric,
  ats_feedback jsonb default '{}',
  embedding vector(384),            -- requires pgvector extension; see note below
  created_at timestamptz default now()
);

-- Enable pgvector if available: create extension if not exists vector;
-- If pgvector is unavailable on your plan, drop the embedding column and
-- store embeddings as float8[] instead, and do cosine similarity in Python.

create unique index if not exists one_active_resume_per_user
  on resumes(user_id) where (is_active);

-- ============ JOBS ============
create table if not exists jobs (
  id uuid primary key default uuid_generate_v4(),
  user_id uuid not null references auth.users(id) on delete cascade,
  company_name text not null,
  role text not null,
  job_link text,
  job_description text not null,
  location text,
  created_at timestamptz default now()
);

-- ============ MATCH RESULTS ============
create table if not exists match_results (
  id uuid primary key default uuid_generate_v4(),
  job_id uuid not null references jobs(id) on delete cascade,
  resume_id uuid not null references resumes(id) on delete cascade,
  match_score numeric not null,       -- 0-100
  skill_match jsonb default '[]',     -- matched skills
  missing_skills jsonb default '[]',
  recommendation text,                -- LLM-generated 1-2 sentence rationale
  status text check (status in ('green','red')) not null,
  created_at timestamptz default now(),
  unique(job_id, resume_id)
);

-- ============ COMPANY INFO (cached enrichment) ============
create table if not exists companies (
  id uuid primary key default uuid_generate_v4(),
  name text unique not null,
  logo_url text,
  description text,
  company_type text,          -- Startup / LLP / MNC
  employee_count text,
  industry text,
  founded_year int,
  headquarters text,
  ceo_founder text,
  rating numeric,
  work_culture_rating numeric,
  work_life_balance_rating numeric,
  working_days text,
  saturday_working boolean,
  work_mode text,              -- Hybrid / Remote / Office
  source text,                 -- clearbit / crunchbase / wikipedia / manual
  updated_at timestamptz default now()
);

-- Manually curatable overrides for fields no free API reliably provides
-- (glassdoor-style culture ratings, Saturday-working policy, etc.)
create table if not exists company_overrides (
  company_name text primary key,
  overrides jsonb default '{}'
);

-- ============ SALARY DETAILS ============
create table if not exists salary_details (
  id uuid primary key default uuid_generate_v4(),
  job_id uuid unique not null references jobs(id) on delete cascade,
  ctc text,
  in_hand_estimate text,
  bonus text,
  joining_bonus text,
  variable_pay text,
  benefits jsonb default '[]'
);

-- ============ OFFICE INFO ============
create table if not exists office_info (
  id uuid primary key default uuid_generate_v4(),
  job_id uuid unique not null references jobs(id) on delete cascade,
  address text,
  latitude numeric,
  longitude numeric,
  nearest_metro text,
  nearest_bus text,
  nearest_railway text,
  distance_from_station_km numeric,
  transportation_notes text
);

-- ============ WORKPLACE IMAGES ============
create table if not exists workplace_images (
  id uuid primary key default uuid_generate_v4(),
  company_name text not null,
  image_url text not null,
  source text
);

-- ============ RLS ============
alter table profiles enable row level security;
alter table resumes enable row level security;
alter table jobs enable row level security;
alter table match_results enable row level security;
alter table salary_details enable row level security;
alter table office_info enable row level security;

create policy "own profile" on profiles for all using (auth.uid() = id);
create policy "own resumes" on resumes for all using (auth.uid() = user_id);
create policy "own jobs" on jobs for all using (auth.uid() = user_id);
create policy "own match results" on match_results for all using (
  exists (select 1 from jobs where jobs.id = match_results.job_id and jobs.user_id = auth.uid())
);
create policy "own salary" on salary_details for all using (
  exists (select 1 from jobs where jobs.id = salary_details.job_id and jobs.user_id = auth.uid())
);
create policy "own office" on office_info for all using (
  exists (select 1 from jobs where jobs.id = office_info.job_id and jobs.user_id = auth.uid())
);
-- companies + workplace_images are shared/cached lookup tables, readable by all authenticated users
alter table companies enable row level security;
alter table workplace_images enable row level security;
create policy "read companies" on companies for select using (auth.role() = 'authenticated');
create policy "read images" on workplace_images for select using (auth.role() = 'authenticated');
