create extension if not exists pgcrypto;
create schema if not exists app_private;

create table public.organizations (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  slug text not null unique,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.organization_members (
  organization_id uuid not null references public.organizations(id) on delete cascade,
  user_id uuid not null references auth.users(id) on delete cascade,
  role text not null default 'operator' check (role in ('admin','manager','operator','finance','viewer')),
  created_at timestamptz not null default now(),
  primary key (organization_id,user_id)
);

create table public.clients (
  id uuid primary key default gen_random_uuid(), organization_id uuid not null references public.organizations(id) on delete cascade,
  name text not null, legal_name text, cnpj text, category text, website text, instagram text, status text not null default 'active',
  owner_user_id uuid references auth.users(id), notes text, created_at timestamptz not null default now(), updated_at timestamptz not null default now()
);
create index clients_org_idx on public.clients(organization_id);

create table public.client_contacts (
  id uuid primary key default gen_random_uuid(), organization_id uuid not null references public.organizations(id) on delete cascade,
  client_id uuid not null references public.clients(id) on delete cascade, name text not null, role_title text, email text, phone text, whatsapp text,
  is_primary boolean not null default false, notes text, created_at timestamptz not null default now()
);
create index client_contacts_client_idx on public.client_contacts(client_id);

create table public.client_guidelines (
  id uuid primary key default gen_random_uuid(), organization_id uuid not null references public.organizations(id) on delete cascade,
  client_id uuid not null unique references public.clients(id) on delete cascade, preferred_niches text[] default '{}', preferred_regions text[] default '{}',
  preferred_audience text, competitors text[] default '{}', restrictions text, usage_rules text, approval_notes text, updated_at timestamptz not null default now()
);

create table public.campaigns (
  id uuid primary key default gen_random_uuid(), organization_id uuid not null references public.organizations(id) on delete cascade,
  client_id uuid not null references public.clients(id) on delete cascade, name text not null, objective text, status text not null default 'planning',
  phase text not null default 'briefing', starts_at date, ends_at date, casting_due_at timestamptz, content_due_at timestamptz, publication_due_at timestamptz,
  budget_total numeric(14,2), budget_creators numeric(14,2), description text, audience text, platforms text[] default '{}', briefing_json jsonb not null default '{}',
  owner_user_id uuid references auth.users(id), created_at timestamptz not null default now(), updated_at timestamptz not null default now()
);
create index campaigns_org_client_idx on public.campaigns(organization_id,client_id);

create table public.influencers (
  id uuid primary key default gen_random_uuid(), organization_id uuid not null references public.organizations(id) on delete cascade,
  full_name text not null, stage_name text, cpf text, birth_date date, email text not null, phone text, cnpj text, company_name text, trade_name text,
  instagram text, tiktok text, youtube text, niche text, instagram_followers integer, city_state text,
  postal_code text, street text, street_number text, complement text, district text, city text, state text,
  shoe_size text, shirt_size text, pants_size text, status text not null default 'new_intake', intake_source text, internal_rating text, notes text,
  created_at timestamptz not null default now(), updated_at timestamptz not null default now(), unique(organization_id,email)
);
create index influencers_org_status_idx on public.influencers(organization_id,status);
create index influencers_org_instagram_idx on public.influencers(organization_id,instagram);

create table public.campaign_influencers (
  id uuid primary key default gen_random_uuid(), organization_id uuid not null references public.organizations(id) on delete cascade,
  campaign_id uuid not null references public.campaigns(id) on delete cascade, influencer_id uuid not null references public.influencers(id) on delete cascade,
  casting_stage text not null default 'mapped', rejection_reason text, approval_notes text, proposed_fee numeric(14,2), agreed_fee numeric(14,2),
  negotiation_status text, current_step text, publication_at timestamptz, created_at timestamptz not null default now(), updated_at timestamptz not null default now(),
  unique(campaign_id,influencer_id)
);
create index campaign_influencers_flow_idx on public.campaign_influencers(organization_id,campaign_id,casting_stage);

create table public.products (
  id uuid primary key default gen_random_uuid(), organization_id uuid not null references public.organizations(id) on delete cascade,
  campaign_id uuid references public.campaigns(id) on delete cascade, client_id uuid references public.clients(id) on delete cascade,
  name text not null, sku text, color text, variant text, notes text, created_at timestamptz not null default now()
);

create table public.shipments (
  id uuid primary key default gen_random_uuid(), organization_id uuid not null references public.organizations(id) on delete cascade,
  campaign_id uuid not null references public.campaigns(id) on delete cascade, influencer_id uuid not null references public.influencers(id) on delete cascade,
  product_id uuid references public.products(id) on delete set null, status text not null default 'to_prepare', carrier text, tracking_code text,
  shipped_at timestamptz, delivered_at timestamptz, shipping_address_snapshot jsonb not null default '{}', notes text, created_at timestamptz not null default now(), updated_at timestamptz not null default now()
);

create table public.contracts (
  id uuid primary key default gen_random_uuid(), organization_id uuid not null references public.organizations(id) on delete cascade,
  campaign_id uuid references public.campaigns(id) on delete cascade, influencer_id uuid not null references public.influencers(id) on delete cascade,
  client_id uuid references public.clients(id) on delete set null, status text not null default 'needed', owner_user_id uuid references auth.users(id),
  agreed_fee numeric(14,2), scope_summary text, missing_fields text[] default '{}', prepared_at timestamptz, sent_at timestamptz, signed_at timestamptz,
  external_document_url text, notes text, created_at timestamptz not null default now(), updated_at timestamptz not null default now()
);
create index contracts_org_status_idx on public.contracts(organization_id,status);

create table public.deliverables (
  id uuid primary key default gen_random_uuid(), organization_id uuid not null references public.organizations(id) on delete cascade,
  campaign_id uuid not null references public.campaigns(id) on delete cascade, influencer_id uuid not null references public.influencers(id) on delete cascade,
  type text not null, quantity integer not null default 1, status text not null default 'not_started', script_due_at timestamptz, content_due_at timestamptz,
  publication_due_at timestamptz, published_url text, published_at timestamptz, notes text, created_at timestamptz not null default now(), updated_at timestamptz not null default now()
);

create table public.content_versions (
  id uuid primary key default gen_random_uuid(), organization_id uuid not null references public.organizations(id) on delete cascade,
  deliverable_id uuid not null references public.deliverables(id) on delete cascade, version_number integer not null default 1, status text not null default 'received',
  feedback text, external_file_url text, received_at timestamptz not null default now(), reviewed_at timestamptz, unique(deliverable_id,version_number)
);

create table public.tasks (
  id uuid primary key default gen_random_uuid(), organization_id uuid not null references public.organizations(id) on delete cascade,
  title text not null, description text, type text not null default 'general', status text not null default 'todo', priority text not null default 'medium',
  waiting_for text not null default 'internal', assignee_user_id uuid references auth.users(id), client_id uuid references public.clients(id) on delete cascade,
  campaign_id uuid references public.campaigns(id) on delete cascade, influencer_id uuid references public.influencers(id) on delete cascade,
  contract_id uuid references public.contracts(id) on delete cascade, due_at timestamptz, completed_at timestamptz, checklist jsonb not null default '[]',
  created_at timestamptz not null default now(), updated_at timestamptz not null default now()
);
create index tasks_org_due_idx on public.tasks(organization_id,status,due_at);

create table public.files (
  id uuid primary key default gen_random_uuid(), organization_id uuid not null references public.organizations(id) on delete cascade,
  client_id uuid references public.clients(id) on delete cascade, campaign_id uuid references public.campaigns(id) on delete cascade,
  influencer_id uuid references public.influencers(id) on delete cascade, contract_id uuid references public.contracts(id) on delete cascade,
  name text not null, category text, provider text not null default 'google_drive', external_id text, external_url text, mime_type text,
  version integer not null default 1, created_by uuid references auth.users(id), created_at timestamptz not null default now()
);
create index files_org_context_idx on public.files(organization_id,client_id,campaign_id,influencer_id);

create table public.payments (
  id uuid primary key default gen_random_uuid(), organization_id uuid not null references public.organizations(id) on delete cascade,
  campaign_id uuid references public.campaigns(id) on delete cascade, influencer_id uuid references public.influencers(id) on delete cascade,
  amount numeric(14,2), status text not null default 'awaiting_invoice', invoice_url text, due_at date, paid_at timestamptz, proof_url text,
  created_at timestamptz not null default now(), updated_at timestamptz not null default now()
);

create table public.integrations (
  id uuid primary key default gen_random_uuid(), organization_id uuid not null references public.organizations(id) on delete cascade,
  provider text not null, status text not null default 'disconnected', refresh_token_encrypted text, metadata jsonb not null default '{}',
  created_at timestamptz not null default now(), updated_at timestamptz not null default now(), unique(organization_id,provider)
);

create table public.activity_logs (
  id bigint generated always as identity primary key, organization_id uuid not null references public.organizations(id) on delete cascade,
  actor_user_id uuid references auth.users(id), client_id uuid references public.clients(id) on delete cascade, campaign_id uuid references public.campaigns(id) on delete cascade,
  influencer_id uuid references public.influencers(id) on delete cascade, event_type text not null, description text, metadata jsonb not null default '{}',
  created_at timestamptz not null default now()
);
create index activity_logs_org_created_idx on public.activity_logs(organization_id,created_at desc);

insert into public.organizations(name,slug) values ('Agency Workspace','agency-workspace') on conflict(slug) do nothing;

-- Any user created in Supabase Auth is automatically attached to the default workspace.
-- The first user becomes admin; subsequent users start as operator.
create or replace function app_private.attach_new_user_to_workspace()
returns trigger
language plpgsql
security definer
set search_path = public, auth
as $$
declare
  target_org uuid;
  initial_role text;
begin
  select id into target_org from public.organizations where slug='agency-workspace' limit 1;
  if target_org is null then
    insert into public.organizations(name,slug) values ('Agency Workspace','agency-workspace') returning id into target_org;
  end if;
  if exists(select 1 from public.organization_members where organization_id=target_org) then
    initial_role := 'operator';
  else
    initial_role := 'admin';
  end if;
  insert into public.organization_members(organization_id,user_id,role)
  values(target_org,new.id,initial_role)
  on conflict(organization_id,user_id) do nothing;
  return new;
end;
$$;

drop trigger if exists on_auth_user_created_attach_workspace on auth.users;
create trigger on_auth_user_created_attach_workspace
after insert on auth.users
for each row execute function app_private.attach_new_user_to_workspace();

-- Backfill users that may already exist before this migration is applied.
insert into public.organization_members(organization_id,user_id,role)
select o.id, u.id,
  case when row_number() over(order by u.created_at, u.id)=1 then 'admin' else 'operator' end
from auth.users u
cross join lateral (select id from public.organizations where slug='agency-workspace' limit 1) o
on conflict(organization_id,user_id) do nothing;

create or replace function app_private.is_org_member(target_org uuid)
returns boolean language sql stable security definer set search_path = public, auth
as $$ select exists(select 1 from public.organization_members m where m.organization_id=target_org and m.user_id=auth.uid()); $$;
revoke all on function app_private.is_org_member(uuid) from public;
grant execute on function app_private.is_org_member(uuid) to authenticated;

alter table public.organizations enable row level security;
alter table public.organization_members enable row level security;
alter table public.clients enable row level security;
alter table public.client_contacts enable row level security;
alter table public.client_guidelines enable row level security;
alter table public.campaigns enable row level security;
alter table public.influencers enable row level security;
alter table public.campaign_influencers enable row level security;
alter table public.products enable row level security;
alter table public.shipments enable row level security;
alter table public.contracts enable row level security;
alter table public.deliverables enable row level security;
alter table public.content_versions enable row level security;
alter table public.tasks enable row level security;
alter table public.files enable row level security;
alter table public.payments enable row level security;
alter table public.integrations enable row level security;
alter table public.activity_logs enable row level security;

create policy organizations_member_select on public.organizations for select to authenticated using (app_private.is_org_member(id));
create policy members_self_select on public.organization_members for select to authenticated using (user_id=auth.uid());

-- Internal workspace policies. Public form writes only through the server-side service role route.
create policy clients_member_all on public.clients for all to authenticated using (app_private.is_org_member(organization_id)) with check (app_private.is_org_member(organization_id));
create policy contacts_member_all on public.client_contacts for all to authenticated using (app_private.is_org_member(organization_id)) with check (app_private.is_org_member(organization_id));
create policy guidelines_member_all on public.client_guidelines for all to authenticated using (app_private.is_org_member(organization_id)) with check (app_private.is_org_member(organization_id));
create policy campaigns_member_all on public.campaigns for all to authenticated using (app_private.is_org_member(organization_id)) with check (app_private.is_org_member(organization_id));
create policy influencers_member_all on public.influencers for all to authenticated using (app_private.is_org_member(organization_id)) with check (app_private.is_org_member(organization_id));
create policy campaign_influencers_member_all on public.campaign_influencers for all to authenticated using (app_private.is_org_member(organization_id)) with check (app_private.is_org_member(organization_id));
create policy products_member_all on public.products for all to authenticated using (app_private.is_org_member(organization_id)) with check (app_private.is_org_member(organization_id));
create policy shipments_member_all on public.shipments for all to authenticated using (app_private.is_org_member(organization_id)) with check (app_private.is_org_member(organization_id));
create policy contracts_member_all on public.contracts for all to authenticated using (app_private.is_org_member(organization_id)) with check (app_private.is_org_member(organization_id));
create policy deliverables_member_all on public.deliverables for all to authenticated using (app_private.is_org_member(organization_id)) with check (app_private.is_org_member(organization_id));
create policy content_versions_member_all on public.content_versions for all to authenticated using (app_private.is_org_member(organization_id)) with check (app_private.is_org_member(organization_id));
create policy tasks_member_all on public.tasks for all to authenticated using (app_private.is_org_member(organization_id)) with check (app_private.is_org_member(organization_id));
create policy files_member_all on public.files for all to authenticated using (app_private.is_org_member(organization_id)) with check (app_private.is_org_member(organization_id));
create policy payments_member_all on public.payments for all to authenticated using (app_private.is_org_member(organization_id)) with check (app_private.is_org_member(organization_id));
create policy integrations_member_all on public.integrations for all to authenticated using (app_private.is_org_member(organization_id)) with check (app_private.is_org_member(organization_id));
create policy activity_logs_member_select on public.activity_logs for select to authenticated using (app_private.is_org_member(organization_id));

-- Data API grants are explicit; RLS remains the authorization layer.
grant usage on schema public to authenticated;
grant select,insert,update,delete on all tables in schema public to authenticated;
revoke all on public.integrations from anon;
revoke all on public.activity_logs from anon;
