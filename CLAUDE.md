# draft-football-app-2 — Contexto Geral

Frontend React do sistema de draft de fantasy football do Brasileirão.
Consome a API REST do `draft-football-api` (Go, porta 3001).

## O que este app faz

Interface onde o usuário cria um draft, escolhe uma formação, seleciona 11 titulares
e 5 reservas slot por slot, e designa um capitão. O app também tem um painel de admin
completo para gerenciar pool de jogadores, pesos de pontuação e configuração de rodada ativa.

## Stack

| | |
|--|--|
| Framework | React 18 (hooks, sem Redux/Zustand/Context global) |
| Build | Vite 5 (dev na porta 5173, proxy `/api` → `localhost:3001`) |
| Estilo | Tailwind CSS 3 + PostCSS |
| Estado | `useState` / `useEffect` local por página; estado global só em `App.jsx` |
| HTTP | `fetch` nativo com `Authorization: Bearer {token}` |
| Sem Socket.io | Draft é single-user, sem real-time entre usuários |

## Estrutura de diretórios

```
src/
  App.jsx               — Roteamento por estado + estado global (user, page, draftId)
  config.js             — Exporta API_URL = VITE_API_URL + '/api/v1'
  main.jsx              — Entry point React
  index.css             — Tailwind imports + classes utilitárias customizadas
  pages/
    Login.jsx           — Autenticação
    Register.jsx        — Criação de conta
    ForgotPassword.jsx  — Reset de senha (2 passos)
    Home.jsx            — Dashboard: drafts ativos, histórico, criar novo
    Draft.jsx           — Experiência principal de draft (máquina de estados)
    EndScreen.jsx       — Resumo do draft concluído
    Admin.jsx           — Painel de admin (~2000 linhas)
  components/           — ver src/CLAUDE.md
utils/
  nationality.js        — Mapa de nacionalidade → código ISO2 (para bandeiras)
```

## Variáveis de ambiente

```
VITE_API_URL=http://localhost:3001   # vazio em produção (usa URL relativa)
```

Definida em `.env` local. Em produção o app roda junto ao backend e usa URL relativa.

## Auth

- Token JWT guardado em `localStorage.draft_token`
- Toda requisição: `Authorization: Bearer ${token}`
- No startup (`App.jsx` `useEffect`): `GET /api/v1/users/me` para revalidar token
  - Válido → seta `user` e exibe app
  - Inválido/ausente → exibe tela de login
- Logout: `localStorage.removeItem('draft_token')` + reseta `user` para null

## Roteamento

Sem React Router. Navegação por `page` em `useState` no `App.jsx`:

| `page` | Exibido |
|--------|---------|
| `'home'` | `Home.jsx` |
| `'draft'` | `Draft.jsx` |
| `'end'` | `EndScreen.jsx` |
| `'admin'` | `Admin.jsx` |
| `null` + `!user` | `Login / Register / ForgotPassword` |

Para navegar: chame `setPage('draft')` passada como prop.

## Fluxo do draft (status refletido no backend)

```
formation_pick  → usuário escolhe formação
drafting        → pica 11 titulares (slots 1–11)
bench_drafting  → pica 5 reservas (slots 12–16)
captain_pick    → designa capitão entre os 11 titulares
complete        → EndScreen
```

`Draft.jsx` lê o `status` retornado pelo backend e renderiza a fase correspondente.
Não há gerenciamento local do status — o backend é a fonte da verdade.

## Padrões de código

- **Sem camada de service/api:** chamadas `fetch` feitas diretamente nas páginas
- **Estado otimista no draft:** card do jogador picado aparece antes da confirmação da API
- **Tailwind puro:** sem libs de componentes (MUI, shadcn, etc.)
- **Mobile-first:** layout responsivo; algumas views têm variante mobile específica
- **Cores dos clubes:** hardcoded em `DraftPlayerCard.jsx` para ~18 times do Brasileirão

## Como rodar

```bash
npm install
npm run dev      # dev server em localhost:5173
npm run build    # build para dist/
```

Backend (`draft-football-api`) precisa estar rodando em `localhost:3001`.
