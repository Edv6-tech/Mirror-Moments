-- Enable UUID extension
create extension if not exists "uuid-ossp";

-- Profiles table
create table public.profiles (
  id uuid references auth.users on delete cascade primary key,
  display_name text,
  default_body_path text,
  delete_originals boolean default true,
  created_at timestamptz default now()
);
alter table public.profiles enable row level security;
create policy "Users can view own profile" on public.profiles for select using (auth.uid() = id);
create policy "Users can update own profile" on public.profiles for update using (auth.uid() = id);

-- Trigger to create profile on signup
create or replace function public.handle_new_user()
returns trigger as $$
begin
  insert into public.profiles (id, display_name)
  values (new.id, new.raw_user_meta_data->>'full_name');
  return new;
end;
$$ language plpgsql security definer;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_user();

-- Dresses table
create table public.dresses (
  id uuid default uuid_generate_v4() primary key,
  user_id uuid references auth.users on delete cascade not null,
  name text not null default 'Untitled dress',
  original_path text,
  lifted_path text not null,
  garment_path text not null,
  coverage real not null default 0,
  worn_detected boolean not null default false,
  store_url text,
  price_text text,
  note text check (char_length(note) <= 140),
  created_at timestamptz default now()
);
alter table public.dresses enable row level security;
create policy "Users can manage own dresses" on public.dresses for all using (auth.uid() = user_id);

-- Looks table
create table public.looks (
  id uuid default uuid_generate_v4() primary key,
  user_id uuid references auth.users on delete cascade not null,
  dress_id uuid references public.dresses on delete set null,
  body_path text not null,
  result_path text,
  youcam_task_id text not null default '',
  status text not null default 'processing' check (status in ('processing','succeeded','failed')),
  error_code text,
  is_favourite boolean not null default false,
  created_at timestamptz default now()
);
alter table public.looks enable row level security;
create policy "Users can manage own looks" on public.looks for all using (auth.uid() = user_id);

-- Usage counters (service role only for writes)
create table public.usage_counters (
  day date not null,
  subject text not null,
  count integer not null default 0,
  primary key (day, subject)
);
alter table public.usage_counters enable row level security;
create policy "Service role only" on public.usage_counters for all using (false);

-- Shortlists
create table public.shortlists (
  id uuid default uuid_generate_v4() primary key,
  user_id uuid references auth.users on delete cascade not null,
  name text not null,
  event_date date,
  chosen_look_id uuid,
  share_token text unique,
  share_allow_comments boolean default true,
  share_closes_at timestamptz,
  created_at timestamptz default now()
);
alter table public.shortlists enable row level security;
create policy "Users can manage own shortlists" on public.shortlists for all using (auth.uid() = user_id);

-- Shortlist looks (junction)
create table public.shortlist_looks (
  shortlist_id uuid references public.shortlists on delete cascade,
  look_id uuid references public.looks on delete cascade,
  position integer not null default 0,
  primary key (shortlist_id, look_id)
);
alter table public.shortlist_looks enable row level security;
create policy "Owners can manage shortlist_looks" on public.shortlist_looks for all
  using (exists (select 1 from public.shortlists where id = shortlist_id and user_id = auth.uid()));

-- Votes
create table public.votes (
  id uuid default uuid_generate_v4() primary key,
  shortlist_id uuid references public.shortlists on delete cascade not null,
  look_id uuid references public.looks on delete cascade not null,
  voter_key text not null,
  voter_name text check (char_length(voter_name) <= 40),
  comment text check (char_length(comment) <= 140),
  created_at timestamptz default now(),
  unique (shortlist_id, voter_key)
);
alter table public.votes enable row level security;
create policy "No direct access to votes" on public.votes for all using (false);
