-- Mirror Moment accounts now use the app's SQLite credential store rather
-- than Supabase Auth. Server routes use the Supabase service role and scope
-- every owner query to the signed SQLite session's UUID. Remove Auth-only
-- foreign keys while keeping the UUID ownership columns and RLS policies.

alter table public.profiles drop constraint if exists profiles_id_fkey;
alter table public.dresses drop constraint if exists dresses_user_id_fkey;
alter table public.looks drop constraint if exists looks_user_id_fkey;
alter table public.shortlists drop constraint if exists shortlists_user_id_fkey;
alter table public.hair_references drop constraint if exists hair_references_user_id_fkey;
alter table public.generated_looks drop constraint if exists generated_looks_user_id_fkey;
