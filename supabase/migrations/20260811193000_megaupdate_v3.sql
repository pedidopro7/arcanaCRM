-- ============================================================
-- ARCANA OS V3 — MEGA UPDATE
-- Incremental migration. Run AFTER the initial Agency OS schema.
-- ============================================================

create extension if not exists pgcrypto;
create schema if not exists app_private;

-- Product/design-supporting fields ------------------------------------------------
alter table public.clients add column if not exists logo_url text;
alter table public.clients add column if not exists brand_color text;
alter table public.clients add column if not exists archived_at timestamptz;

alter table public.campaigns add column if not exists health text not null default 'good'
  check (health in ('good','watch','risk'));
alter table public.campaigns add column if not exists briefing_url text;
alter table public.campaigns add column if not exists budget_spent numeric(14,2);

alter table public.influencers add column if not exists tiktok_followers integer;
alter table public.influencers add column if not exists youtube_followers integer;
alter table public.influencers add column if not exists engagement_rate numeric(6,2);
alter table public.influencers add column if not exists audience_summary text;
alter table public.influencers add column if not exists preferred boolean not null default false;

alter table public.campaign_influencers add column if not exists sent_to_client_at timestamptz;
alter table public.campaign_influencers add column if not exists approved_at timestamptz;
alter table public.campaign_influencers add column if not exists confirmed_at timestamptz;
alter table public.campaign_influencers add column if not exists client_feedback text;

alter table public.contracts add column if not exists reviewed_at timestamptz;
alter table public.contracts add column if not exists review_notes text;

alter table public.deliverables add column if not exists client_feedback text;
alter table public.deliverables add column if not exists internal_feedback text;

alter table public.tasks add column if not exists sort_order integer not null default 0;
alter table public.tasks add column if not exists archived_at timestamptz;

alter table public.files add column if not exists size_bytes bigint;

-- Collaboration -----------------------------------------------------------------
create table if not exists public.task_comments (
  id bigint generated always as identity primary key,
  organization_id uuid not null references public.organizations(id) on delete cascade,
  task_id uuid not null references public.tasks(id) on delete cascade,
  user_id uuid references auth.users(id) on delete set null,
  body text not null,
  created_at timestamptz not null default now()
);
create index if not exists task_comments_task_idx on public.task_comments(task_id,created_at);

create table if not exists public.notifications (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations(id) on delete cascade,
  user_id uuid references auth.users(id) on delete cascade,
  type text not null default 'general',
  title text not null,
  body text,
  href text,
  priority text not null default 'normal' check (priority in ('low','normal','high')),
  read_at timestamptz,
  created_at timestamptz not null default now()
);
create index if not exists notifications_user_idx on public.notifications(user_id,read_at,created_at desc);

create table if not exists public.saved_views (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations(id) on delete cascade,
  user_id uuid not null references auth.users(id) on delete cascade,
  module text not null,
  name text not null,
  filters jsonb not null default '{}',
  is_default boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique(user_id,module,name)
);

-- Profiles and admin allowlist ---------------------------------------------------
create table if not exists public.profiles (
  user_id uuid primary key references auth.users(id) on delete cascade,
  full_name text,
  email text,
  role text not null default 'operator' check (role in ('admin','manager','operator','finance','viewer')),
  active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.admin_email_allowlist (
  email text primary key,
  created_at timestamptz not null default now()
);

insert into public.admin_email_allowlist(email)
values ('adscompedro@gmail.com'), ('arcana@admin.com')
on conflict(email) do nothing;

-- Unified user/workspace trigger -------------------------------------------------
drop trigger if exists on_auth_user_created_attach_workspace on auth.users;
drop trigger if exists on_arcana_auth_user_created on auth.users;

drop function if exists app_private.attach_new_user_to_workspace() cascade;

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
  where slug='agency-workspace'
  order by created_at asc
  limit 1;

  if workspace_id is null then
    insert into public.organizations(name,slug)
    values ('Arcana Workspace','agency-workspace')
    returning id into workspace_id;
  end if;

  workspace_role := case
    when exists(
      select 1 from public.admin_email_allowlist a
      where lower(a.email)=lower(coalesce(new.email,''))
    ) then 'admin'
    else 'operator'
  end;

  insert into public.profiles(user_id,full_name,email,role,active,updated_at)
  values (
    new.id,
    coalesce(new.raw_user_meta_data->>'full_name',new.raw_user_meta_data->>'name',split_part(coalesce(new.email,''),'@',1)),
    new.email,
    workspace_role,
    true,
    now()
  )
  on conflict(user_id) do update set
    email=excluded.email,
    full_name=coalesce(nullif(excluded.full_name,''),public.profiles.full_name),
    role=case when excluded.role='admin' then 'admin' else public.profiles.role end,
    active=true,
    updated_at=now();

  insert into public.organization_members(organization_id,user_id,role)
  values(workspace_id,new.id,workspace_role)
  on conflict(organization_id,user_id) do update set
    role=case when excluded.role='admin' then 'admin' else public.organization_members.role end;

  return new;
end;
$$;

revoke all on function public.arcana_handle_auth_user() from public;

create trigger on_arcana_auth_user_created
after insert or update of email, raw_user_meta_data
on auth.users
for each row execute procedure public.arcana_handle_auth_user();

-- Backfill every existing Auth user ------------------------------------------------
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
    workspace_role := case
      when exists(select 1 from public.admin_email_allowlist a where lower(a.email)=lower(coalesce(u.email,''))) then 'admin'
      else 'operator'
    end;

    insert into public.profiles(user_id,full_name,email,role,active,updated_at)
    values(u.id,coalesce(u.raw_user_meta_data->>'full_name',u.raw_user_meta_data->>'name',split_part(coalesce(u.email,''),'@',1)),u.email,workspace_role,true,now())
    on conflict(user_id) do update set
      email=excluded.email,
      full_name=coalesce(nullif(excluded.full_name,''),public.profiles.full_name),
      role=case when excluded.role='admin' then 'admin' else public.profiles.role end,
      active=true,
      updated_at=now();

    insert into public.organization_members(organization_id,user_id,role)
    values(workspace_id,u.id,workspace_role)
    on conflict(organization_id,user_id) do update set
      role=case when excluded.role='admin' then 'admin' else public.organization_members.role end;
  end loop;
end;
$$;

select public.arcana_backfill_auth_users();

-- RLS ---------------------------------------------------------------------------
alter table public.profiles enable row level security;
alter table public.task_comments enable row level security;
alter table public.notifications enable row level security;
alter table public.saved_views enable row level security;
alter table public.admin_email_allowlist enable row level security;

drop policy if exists profiles_self_select on public.profiles;
create policy profiles_self_select on public.profiles for select to authenticated using (user_id=auth.uid());

drop policy if exists task_comments_member_all on public.task_comments;
create policy task_comments_member_all on public.task_comments for all to authenticated
using (app_private.is_org_member(organization_id))
with check (app_private.is_org_member(organization_id));

drop policy if exists notifications_own_select on public.notifications;
create policy notifications_own_select on public.notifications for select to authenticated
using (user_id=auth.uid() and app_private.is_org_member(organization_id));

drop policy if exists notifications_own_update on public.notifications;
create policy notifications_own_update on public.notifications for update to authenticated
using (user_id=auth.uid() and app_private.is_org_member(organization_id))
with check (user_id=auth.uid() and app_private.is_org_member(organization_id));

drop policy if exists saved_views_own_all on public.saved_views;
create policy saved_views_own_all on public.saved_views for all to authenticated
using (user_id=auth.uid() and app_private.is_org_member(organization_id))
with check (user_id=auth.uid() and app_private.is_org_member(organization_id));

-- The allowlist is server/admin only.
revoke all on public.admin_email_allowlist from anon, authenticated;
grant select on public.profiles to authenticated;
grant select,insert,update,delete on public.task_comments to authenticated;
grant select,update on public.notifications to authenticated;
grant select,insert,update,delete on public.saved_views to authenticated;

-- Helpful indexes ----------------------------------------------------------------
create index if not exists campaigns_health_idx on public.campaigns(organization_id,health,status);
create index if not exists influencers_followers_idx on public.influencers(organization_id,instagram_followers desc);
create index if not exists deliverables_status_idx on public.deliverables(organization_id,status,publication_due_at);
create index if not exists shipments_status_idx on public.shipments(organization_id,status,created_at desc);
create index if not exists payments_status_idx on public.payments(organization_id,status,due_at);

-- Role-aware authorization --------------------------------------------------------
create or replace function app_private.has_org_role(target_org uuid, allowed_roles text[])
returns boolean
language sql
stable
security definer
set search_path = public, auth
as $$
  select exists(
    select 1 from public.organization_members m
    where m.organization_id=target_org
      and m.user_id=auth.uid()
      and m.role = any(allowed_roles)
  );
$$;
revoke all on function app_private.has_org_role(uuid,text[]) from public;
grant execute on function app_private.has_org_role(uuid,text[]) to authenticated;

-- Remove broad V1 write policies so roles have real meaning.
drop policy if exists clients_member_all on public.clients;
drop policy if exists contacts_member_all on public.client_contacts;
drop policy if exists guidelines_member_all on public.client_guidelines;
drop policy if exists campaigns_member_all on public.campaigns;
drop policy if exists influencers_member_all on public.influencers;
drop policy if exists campaign_influencers_member_all on public.campaign_influencers;
drop policy if exists products_member_all on public.products;
drop policy if exists shipments_member_all on public.shipments;
drop policy if exists contracts_member_all on public.contracts;
drop policy if exists deliverables_member_all on public.deliverables;
drop policy if exists content_versions_member_all on public.content_versions;
drop policy if exists tasks_member_all on public.tasks;
drop policy if exists files_member_all on public.files;
drop policy if exists payments_member_all on public.payments;
drop policy if exists integrations_member_all on public.integrations;

-- General operating tables: every member can read, admin/manager/operator can write.
do $$
declare
  t text;
begin
  foreach t in array array['clients','client_contacts','client_guidelines','campaigns','influencers','campaign_influencers','products','shipments','contracts','deliverables','content_versions','tasks','files']
  loop
    execute format('drop policy if exists %I on public.%I', t||'_member_select_v3', t);
    execute format('drop policy if exists %I on public.%I', t||'_operator_insert_v3', t);
    execute format('drop policy if exists %I on public.%I', t||'_operator_update_v3', t);
    execute format('drop policy if exists %I on public.%I', t||'_operator_delete_v3', t);
    execute format('create policy %I on public.%I for select to authenticated using (app_private.is_org_member(organization_id))', t||'_member_select_v3', t);
    execute format('create policy %I on public.%I for insert to authenticated with check (app_private.has_org_role(organization_id, ARRAY[''admin'',''manager'',''operator'']))', t||'_operator_insert_v3', t);
    execute format('create policy %I on public.%I for update to authenticated using (app_private.has_org_role(organization_id, ARRAY[''admin'',''manager'',''operator''])) with check (app_private.has_org_role(organization_id, ARRAY[''admin'',''manager'',''operator'']))', t||'_operator_update_v3', t);
    execute format('create policy %I on public.%I for delete to authenticated using (app_private.has_org_role(organization_id, ARRAY[''admin'',''manager'',''operator'']))', t||'_operator_delete_v3', t);
  end loop;
end $$;

-- Finance: finance role can write payments in addition to admin/manager.
drop policy if exists payments_member_select_v3 on public.payments;
drop policy if exists payments_finance_insert_v3 on public.payments;
drop policy if exists payments_finance_update_v3 on public.payments;
drop policy if exists payments_finance_delete_v3 on public.payments;
create policy payments_member_select_v3 on public.payments for select to authenticated using (app_private.is_org_member(organization_id));
create policy payments_finance_insert_v3 on public.payments for insert to authenticated with check (app_private.has_org_role(organization_id,ARRAY['admin','manager','finance']));
create policy payments_finance_update_v3 on public.payments for update to authenticated using (app_private.has_org_role(organization_id,ARRAY['admin','manager','finance'])) with check (app_private.has_org_role(organization_id,ARRAY['admin','manager','finance']));
create policy payments_finance_delete_v3 on public.payments for delete to authenticated using (app_private.has_org_role(organization_id,ARRAY['admin','manager']));

-- Integrations: only admin/manager can mutate OAuth records.
drop policy if exists integrations_member_select_v3 on public.integrations;
drop policy if exists integrations_admin_insert_v3 on public.integrations;
drop policy if exists integrations_admin_update_v3 on public.integrations;
drop policy if exists integrations_admin_delete_v3 on public.integrations;
create policy integrations_member_select_v3 on public.integrations for select to authenticated using (app_private.is_org_member(organization_id));
create policy integrations_admin_insert_v3 on public.integrations for insert to authenticated with check (app_private.has_org_role(organization_id,ARRAY['admin','manager']));
create policy integrations_admin_update_v3 on public.integrations for update to authenticated using (app_private.has_org_role(organization_id,ARRAY['admin','manager'])) with check (app_private.has_org_role(organization_id,ARRAY['admin','manager']));
create policy integrations_admin_delete_v3 on public.integrations for delete to authenticated using (app_private.has_org_role(organization_id,ARRAY['admin']));
