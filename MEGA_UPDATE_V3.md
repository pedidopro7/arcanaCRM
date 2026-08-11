# Arcana OS V3 — o que mudou

## Produto
- Nova arquitetura visual com sidebar recolhível, command palette, busca global, notificações, drawers e estados vazios.
- Dashboard orientado a prioridade em vez de apenas métricas.
- Meu Dia com Lista/Board e separação de trabalho interno vs. aguardando terceiros.
- Casting como módulo de primeira classe.
- Conteúdo, Logística e Financeiro agora têm páginas operacionais reais.
- Google Drive ganhou upload contextual e caminho visível Cliente/Campanha/Creator/Categoria.
- Equipe ganhou criação de usuários via Supabase Auth.

## Design
- Menos gradientes decorativos e menos arredondamento genérico.
- Hierarquia tipográfica mais sóbria.
- Tokens de surface, spacing, radius, status, shadow e brand.
- Layout responsivo com bottom navigation no mobile.
- Tabelas densas e legíveis, drawers para contexto e feedback visual consistente.

## Segurança
- Upload do Drive exige bearer token válido e membership no workspace.
- API de usuários exige admin/manager.
- `admin_email_allowlist` permite garantir administradores por e-mail sem gravar senha no código.
