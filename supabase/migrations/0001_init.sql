-- Profiles: extends auth.users
create table if not exists public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  display_name text,
  avatar_url text,
  created_at timestamptz default now() not null
);

-- Auto-create profile when a user signs up
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer set search_path = ''
as $$
begin
  insert into public.profiles (id, display_name)
  values (
    new.id,
    new.raw_user_meta_data ->> 'display_name'
  );
  return new;
end;
$$;

create or replace trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

-- Companies
create table if not exists public.companies (
  id uuid primary key default gen_random_uuid(),
  slug text unique not null,
  name text not null,
  domain text,
  logo_url text,
  description text,
  category text,
  created_by uuid references public.profiles(id) on delete set null,
  created_at timestamptz default now() not null
);

-- Reviews (one per user per company)
create table if not exists public.reviews (
  id uuid primary key default gen_random_uuid(),
  company_id uuid not null references public.companies(id) on delete cascade,
  user_id uuid not null references public.profiles(id) on delete cascade,
  rating smallint not null check (rating between 1 and 5),
  title text not null,
  body text not null,
  created_at timestamptz default now() not null,
  unique (company_id, user_id)
);

-- View: average rating + count per company
create or replace view public.company_ratings
with (security_invoker = true)
as
  select
    company_id,
    round(avg(rating)::numeric, 1) as avg_rating,
    count(*) as review_count
  from public.reviews
  group by company_id;

-- RLS
alter table public.profiles enable row level security;
alter table public.companies enable row level security;
alter table public.reviews enable row level security;

-- Profiles policies
create policy "profiles_select_all" on public.profiles
  for select using (true);

create policy "profiles_update_own" on public.profiles
  for update using (auth.uid() = id);

-- Companies policies
create policy "companies_select_all" on public.companies
  for select using (true);

create policy "companies_insert_authenticated" on public.companies
  for insert with check (auth.uid() = created_by);

create policy "companies_update_own" on public.companies
  for update using (auth.uid() = created_by);

-- Reviews policies
create policy "reviews_select_all" on public.reviews
  for select using (true);

create policy "reviews_insert_authenticated" on public.reviews
  for insert with check (auth.uid() = user_id);

create policy "reviews_update_own" on public.reviews
  for update using (auth.uid() = user_id);

create policy "reviews_delete_own" on public.reviews
  for delete using (auth.uid() = user_id);
