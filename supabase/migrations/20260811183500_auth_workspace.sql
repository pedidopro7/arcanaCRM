-- Arcana OS V2 — automatic workspace membership for Supabase Auth users

create table if not exists public.profiles (
  user_id uuid primary key references auth.users(id) on delete cascade,
  full_name text,
  email text,
  role text not null default 'operator' check (role in ('admin','manager','operator','finance','viewer')),
  active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table public.profiles enable row level security;

drop policy if exists profiles_self_select on public.profiles;
create policy profiles_self_select on public.profiles
for select to authenticated
using (user_id = auth.uid());

grant select on public.profiles to authenticated;

create or replace function public.arcana_handle_auth_user()
returns trigger
language plpgsql
security definer
set search_path = public, auth
as $$
declare
  workspace_id uuid;
  workspace_role text;
begin
  select id into workspace_id
  from public.organizations
  where slug = 'agency-workspace'
  order by created_at asc
  limit 1;

  if workspace_id is null then
    insert into public.organizations(name, slug)
    values ('Arcana Workspace', 'agency-workspace')
    returning id into workspace_id;
  end if;

  workspace_role := case
    when lower(coalesce(new.email, '')) = 'adscompedro@gmail.com' then 'admin'
    else 'operator'
  end;

  insert into public.profiles(user_id, full_name, email, role, active, updated_at)
  values (
    new.id,
    coalesce(new.raw_user_meta_data->>'full_name', new.raw_user_meta_data->>'name', split_part(coalesce(new.email,''), '@', 1)),
    new.email,
    workspace_role,
    true,
    now()
  )
  on conflict (user_id) do update set
    email = excluded.email,
    full_name = coalesce(nullif(excluded.full_name,''), public.profiles.full_name),
    role = case when excluded.email = 'adscompedro@gmail.com' then 'admin' else public.profiles.role end,
    active = true,
    updated_at = now();

  insert into public.organization_members(organization_id, user_id, role)
  values (workspace_id, new.id, workspace_role)
  on conflict (organization_id, user_id) do update set
    role = case when lower(coalesce(new.email,'')) = 'adscompedro@gmail.com' then 'admin' else public.organization_members.role end;

  return new;
end;
$$;

revoke all on function public.arcana_handle_auth_user() from public;

drop trigger if exists on_arcana_auth_user_created on auth.users;
create trigger on_arcana_auth_user_created
after insert or update of email, raw_user_meta_data on auth.users
for each row execute procedure public.arcana_handle_auth_user();

-- Backfill all users that already exist in Supabase Auth.
do $$
declare
  u auth.users%rowtype;
begin
  for u in select * from auth.users loop
    perform public.arcana_handle_auth_user_backfill(u.id, u.email, u.raw_user_meta_data);
  end loop;
exception when undefined_function then
  null;
end $$;

-- Helper used only to make the backfill deterministic.
create or replace function public.arcana_backfill_auth_users()
returns void
language plpgsql
security definer
set search_path = public, auth
as $$
declare
  u record;
  workspace_id uuid;
  workspace_role text;
begin
  select id into workspace_id from public.organizations where slug='agency-workspace' limit 1;
  if workspace_id is null then
    insert into public.organizations(name,slug) values ('Arcana Workspace','agency-workspace') returning id into workspace_id;
  end if;

  for u in select id,email,raw_user_meta_data from auth.users loop
    workspace_role := case when lower(coalesce(u.email,''))='adscompedro@gmail.com' then 'admin' else 'operator' end;
    insert into public.profiles(user_id,full_name,email,role,active)
    values (u.id,coalesce(u.raw_user_meta_data->>'full_name',u.raw_user_meta_data->>'name',split_part(coalesce(u.email,''),'@',1)),u.email,workspace_role,true)
    on conflict(user_id) do update set email=excluded.email, active=true,
      role=case when excluded.email='adscompedro@gmail.com' then 'admin' else public.profiles.role end,
      updated_at=now();
    insert into public.organization_members(organization_id,user_id,role)
    values(workspace_id,u.id,workspace_role)
    on conflict(organization_id,user_id) do update set role=case when lower(coalesce(u.email,''))='adscompedro@gmail.com' then 'admin' else public.organization_members.role end;
  end loop;
end;
$$;

select public.arcana_backfill_auth_users();
