# Agency OS — Influencer Operations · V1.5

Sistema operacional interno para agência de influencer marketing. A V1.5 mantém a arquitetura funcional da V1 e aplica um redesign completo baseado na identidade visual enviada pela agência: navy, índigo, violeta, magenta e coral.

## O que mudou na V1.5
- Logo oficial aplicada no shell, formulário público e favicon/app icon.
- Sidebar redesenhada com identidade navy/índigo e navegação agrupada.
- Item ativo e CTAs usando o degradê da marca de forma controlada.
- Dashboard, cards, tabelas, filtros, tabs, badges e progressos redesenhados.
- Workspaces de cliente e campanha com hero visual da marca.
- Novo sistema de espaçamento, sombras, bordas e tipografia.
- Formulário público totalmente alinhado à identidade visual.
- Mobile com drawer + bottom navigation de 5 destinos.
- Tokens de design centralizados em `src/app/globals.css` para facilitar updates futuros.
- Design system documentado em `DESIGN_SYSTEM_V1.5.md`.

## Stack
- Next.js 15 + React 19 + TypeScript
- TailwindCSS
- Supabase (Postgres + Auth/RLS)
- Vercel
- GitHub
- Google OAuth 2.0 + Drive API + Docs API

## Fluxo principal
1. Influencer recebe o formulário público.
2. Ao enviar, o backend cria/atualiza o cadastro no Supabase.
3. O influencer entra como `new_intake`.
4. O sistema cria a tarefa `Revisar novo cadastro`.
5. A equipe revisa manualmente.
6. Quando aprovado, o fluxo operacional pode avançar para contrato pendente.
7. O contrato é preparado e revisado por uma pessoa.
8. Ao fazer upload pelo sistema, o arquivo pode ser organizado no Google Drive.
9. Casting, negociação, logística, conteúdo, publicação, métricas e financeiro ficam visíveis na campanha.

**A V1.5 continua sem gerar, alterar ou enviar contratos automaticamente.**

## Módulos presentes
- Dashboard operacional
- Meu Dia / CRM de tarefas
- Clientes / workspace da marca
- Campanhas / workspace da campanha
- Casting e aprovação da marca
- Base de influenciadores
- Perfil completo do influencer
- Dados para contrato
- Contratos
- Produtos e logística (estrutura no banco/campanha)
- Conteúdos e entregáveis (estrutura no banco/campanha)
- Arquivos
- Formulário público de influencer
- Integrações Google Drive / Docs

## Banco
Migração inicial:

`supabase/migrations/20260811155100_initial_agency_ops.sql`

Ela cria as entidades de organização, clientes, contatos, diretrizes, campanhas, influenciadores, participações, produtos, envios, contratos, entregáveis, versões de conteúdo, tarefas, arquivos, pagamentos, integrações e histórico.

As tabelas operacionais têm RLS. O formulário público passa pelo backend e não recebe acesso direto ao banco.

## Google Drive / Docs
```env
GOOGLE_CLIENT_ID=
GOOGLE_CLIENT_SECRET=
GOOGLE_REDIRECT_URI=https://SEU-DOMINIO/api/google/oauth/callback
GOOGLE_DRIVE_ROOT_FOLDER_ID=
APP_ENCRYPTION_KEY=
```

Scopes usados:
- `drive.file`
- `documents`

Estrutura sugerida:
```text
CLIENTES/
  Marca/
    Campanha/
      Influencer/
        Contratos/
        Conteúdos/
        Métricas/
        Financeiro/
```

## Supabase
```env
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY=
SUPABASE_SERVICE_ROLE_KEY=
```

`SUPABASE_SERVICE_ROLE_KEY` é exclusivamente server-side.

## Desenvolvimento
```bash
npm install
cp .env.example .env.local
npm run dev
```

## Próximas conexões
1. Criar repositório GitHub exclusivo para o Agency OS.
2. Criar projeto Supabase exclusivo em `sa-east-1`.
3. Aplicar a migração.
4. Configurar usuários e `organization_members`.
5. Configurar variáveis na Vercel.
6. Criar credenciais OAuth no Google Cloud.
7. Trocar os dados demonstrativos por queries Supabase.
8. Adicionar autenticação obrigatória antes da produção.

## Filosofia da V1.5
Organizar primeiro, automatizar depois. O sistema reduz procura, duplicação, esquecimento e retrabalho sem remover a revisão humana de contratos, negociações, aprovações e decisões de campanha.
