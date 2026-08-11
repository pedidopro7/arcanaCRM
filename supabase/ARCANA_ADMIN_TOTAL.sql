-- ============================================================
-- ARCANA — GARANTIR arcana@admin.com COMO ADMIN TOTAL
-- Pode ser executado antes ou depois de criar o usuário no Auth.
-- Se o usuário ainda não existir, a allowlist garante que ele vire
-- admin automaticamente assim que for criado em Authentication > Users.
-- ============================================================

create table if not exists public.admin_email_allowlist (
  email text primary key,
  created_at timestamptz not null default now()
);

insert into public.admin_email_allowlist(email)
values ('arcana@admin.com')
on conflict(email) do nothing;

-- Se o usuário já existe no Supabase Auth, promove imediatamente.
do $$
declare
  target_user uuid;
  target_org uuid;
begin
  select id into target_user
  from auth.users
  where lower(email)='arcana@admin.com'
  limit 1;

  select id into target_org
  from public.organizations
  where slug='agency-workspace'
  order by created_at asc
  limit 1;

  if target_org is null then
    insert into public.organizations(name,slug)
    values ('Arcana Workspace','agency-workspace')
    returning id into target_org;
  end if;

  if target_user is not null then
    insert into public.organization_members(organization_id,user_id,role)
    values(target_org,target_user,'admin')
    on conflict(organization_id,user_id)
    do update set role='admin';

    if to_regclass('public.profiles') is not null then
      insert into public.profiles(user_id,full_name,email,role,active,updated_at)
      select target_user,
             coalesce(raw_user_meta_data->>'full_name',raw_user_meta_data->>'name','Arcana Admin'),
             email,
             'admin',
             true,
             now()
      from auth.users
      where id=target_user
      on conflict(user_id)
      do update set role='admin',active=true,email=excluded.email,updated_at=now();
    end if;
  else
    raise notice 'arcana@admin.com ainda não existe em Authentication > Users. Crie a conta lá; a allowlist já está pronta e o trigger V3 dará role admin automaticamente.';
  end if;
end $$;

-- Conferência.
select
  u.id,
  u.email,
  om.role as workspace_role,
  p.role as profile_role,
  coalesce(p.active,true) as active
from auth.users u
left join public.organization_members om on om.user_id=u.id
left join public.profiles p on p.user_id=u.id
where lower(u.email)='arcana@admin.com';
