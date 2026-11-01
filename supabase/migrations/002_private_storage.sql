-- Private media buckets. Browser clients cannot read or write these objects;
-- server routes use the service-role key and issue short-lived signed URLs.
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values
  ('dresses', 'dresses', false, 10485760, array['image/jpeg', 'image/png', 'image/webp']),
  ('bodies', 'bodies', false, 10485760, array['image/jpeg', 'image/png']),
  ('results', 'results', false, 20971520, array['image/jpeg', 'image/png', 'image/webp'])
on conflict (id) do update
set public = false,
    file_size_limit = excluded.file_size_limit,
    allowed_mime_types = excluded.allowed_mime_types;

create table if not exists public.hair_references (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users on delete cascade,
  name text not null default 'Custom Hairstyle',
  reference_path text not null,
  thumbnail_path text not null,
  created_at timestamptz not null default now()
);
alter table public.hair_references enable row level security;
drop policy if exists "Users can manage own hair references" on public.hair_references;
create policy "Users can manage own hair references" on public.hair_references
  for all using (auth.uid() = user_id) with check (auth.uid() = user_id);

create table if not exists public.generated_looks (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users on delete cascade,
  category text not null,
  name text not null,
  result_path text not null,
  is_favourite boolean not null default false,
  created_at timestamptz not null default now()
);
alter table public.generated_looks enable row level security;
drop policy if exists "Users can manage own generated looks" on public.generated_looks;
create policy "Users can manage own generated looks" on public.generated_looks
  for all using (auth.uid() = user_id) with check (auth.uid() = user_id);

drop policy if exists "Users can create own profile" on public.profiles;
create policy "Users can create own profile" on public.profiles
  for insert with check (auth.uid() = id);

create or replace function public.consume_tryon_quota(
  p_day date,
  p_subject text,
  p_subject_limit integer,
  p_global_limit integer
) returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  v_subject_used integer;
  v_global_used integer;
begin
  if p_day is null or p_subject is null or length(p_subject) > 128 or p_subject_limit < 1 or p_global_limit < 1 then
    raise exception 'Invalid quota parameters';
  end if;

  insert into public.usage_counters(day, subject, count)
  values (p_day, '__global__', 0), (p_day, p_subject, 0)
  on conflict (day, subject) do nothing;

  -- Lock the global row first so concurrent requests cannot overspend the budget.
  select count into v_global_used from public.usage_counters
  where day = p_day and subject = '__global__' for update;
  select count into v_subject_used from public.usage_counters
  where day = p_day and subject = p_subject for update;

  if v_global_used >= p_global_limit then
    return jsonb_build_object('allowed', false, 'used', v_subject_used, 'remaining', greatest(0, p_subject_limit - v_subject_used), 'reason', 'global_limit');
  end if;
  if v_subject_used >= p_subject_limit then
    return jsonb_build_object('allowed', false, 'used', v_subject_used, 'remaining', 0, 'reason', 'subject_limit');
  end if;

  update public.usage_counters set count = count + 1
  where day = p_day and subject = '__global__';
  update public.usage_counters set count = count + 1
  where day = p_day and subject = p_subject;

  return jsonb_build_object('allowed', true, 'used', v_subject_used + 1, 'remaining', greatest(0, p_subject_limit - v_subject_used - 1), 'reason', null);
end;
$$;
revoke all on function public.consume_tryon_quota(date, text, integer, integer) from public, anon, authenticated;
grant execute on function public.consume_tryon_quota(date, text, integer, integer) to service_role;
