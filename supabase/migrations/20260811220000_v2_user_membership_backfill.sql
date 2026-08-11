-- Arcana OS V2: safe/idempotent auth membership upgrade for databases
-- that may have applied the initial schema before automatic membership existed.

create schema if not exists app_private;

insert into public.organizations(name,slug)
values ('Agency Workspace','agency-workspace')
on conflict(slug) do nothing;

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

with default_org as (
  select id from public.organizations where slug='agency-workspace' limit 1
), ranked_users as (
  select id,row_number() over(order by created_at,id) as rn from auth.users
)
insert into public.organization_members(organization_id,user_id,role)
select o.id,u.id,case when u.rn=1 then 'admin' else 'operator' end
from ranked_users u
cross join default_org o
on conflict(organization_id,user_id) do nothing;
