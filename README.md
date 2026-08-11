# Arcana OS V3 — Mega Update

Sistema operacional para agência de influencer marketing, feito em Next.js + Supabase + Google Workspace.

## Módulos
- Dashboard operacional
- Meu Dia: lista/board, prioridades e dependências
- Clientes e workspaces
- Campanhas e pipeline
- Casting
- Influenciadores
- Contratos
- Conteúdo
- Produtos & Envios
- Financeiro operacional
- Arquivos + Google Drive
- Formulário público de creator
- Integrações
- Usuários e acessos
- Busca global / command palette
- Notificações operacionais

## Banco
Se o schema base já existe, execute:
`supabase/migrations/20260811193000_megaupdate_v3.sql`

Para garantir `arcana@admin.com` como admin total, execute:
`supabase/ARCANA_ADMIN_TOTAL.sql`

Se `arcana@admin.com` ainda não existe no Supabase Auth, crie a conta em Authentication > Users. A allowlist da V3 fará o vínculo como admin automaticamente.

## Ambiente
Copie `.env.example` para `.env.local` e preencha Supabase e Google OAuth.

## Deploy
1. `npm install`
2. `npm run build`
3. subir em GitHub/Vercel quando aprovado

Este ZIP foi preparado para revisão local e não depende de alterações automáticas no GitHub.
