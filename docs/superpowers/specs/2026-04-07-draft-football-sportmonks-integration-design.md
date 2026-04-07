# Design: Integração draft-football-app-2 com draft-football-api (SportMonks)

**Data:** 2026-04-07  
**Status:** Aprovado  

## Contexto

`draft-football-app-2` é o frontend extraído do monorepo `projeto draft-cartola`. O backend original era Node.js com Socket.IO e dados da API do Cartola FC. O objetivo é migrar para consumir `draft-football-api` (Go + Gin + PostgreSQL), que usa dados do SportMonks como fonte de estatísticas.

### O que muda fundamentalmente

| | Original (Cartola) | Novo (SportMonks) |
|---|---|---|
| Fonte de dados | Cartola FC API | SportMonks (já populado no DB) |
| Modalidade de draft | Real-time, múltiplos jogadores, salas | Solo, assíncrono, individual |
| ID do jogador | `cartola_id` (integer) | UUID |
| Posições | 5 simplificadas (GOL/LAT/ZAG/MEI/ATA) | 13 detailed_positions do SportMonks |
| Formações | Hardcoded no frontend | Vêm da API (tabela `formations`) |
| Score médio | `average_score` da Cartola | Ignorado por enquanto (a definir) |
| Transporte | Socket.IO | REST puro |
| Rodada ativa | Round atual | Admin define via endpoint |

---

## Seção 1: Dados e Posições

### Posições do SportMonks

O banco já possui duas tabelas de posições sem necessidade de migration adicional:

**`positions`** (básicas, usadas para filtro):
- 1 = Goalkeeper (Goleiro)
- 2 = Defender (Defensor)
- 3 = Midfielder (Meio-campista)
- 4 = Attacker (Atacante)

**`detailed_positions`** (usadas nos slots das formações):
- 1 = Goalkeeper
- 2 = Centre Back
- 3 = Right Back
- 4 = Left Back
- 5 = Defensive Midfield
- 6 = Central Midfield
- 7 = Attacking Midfield
- 8 = Left Midfield
- 9 = Right Midfield
- 10 = Centre Forward
- 11 = Left Wing
- 12 = Right Wing
- 13 = Secondary Striker

O frontend usa `position_id` (1-4) para filtrar jogadores por grupo e `detailed_position_id` para identificar o slot de cada pick.

### Score

O campo `average_score` é ignorado nesta fase. A lógica de pontuação será definida posteriormente com base nas estatísticas do SportMonks (`player_stats` + `stat_weights`).

### Rodada ativa

O admin define qual rodada está ativa via endpoint. O pool de jogadores elegíveis é baseado nos jogadores com lineup registrado na rodada ativa.

---

## Seção 2: Backend — Migrations e Endpoints

### Novas migrations

**`draft_config`** — configuração global do sistema:
```sql
CREATE TABLE draft_config (
    key        VARCHAR(50) PRIMARY KEY,
    value      TEXT,
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
INSERT INTO draft_config (key, value) VALUES ('active_round_id', NULL);
```

**`drafts`** — um draft por usuário por rodada:
```sql
CREATE TABLE drafts (
    id                UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id           UUID NOT NULL REFERENCES users(id),
    round_id          UUID NOT NULL REFERENCES rounds(id),
    formation         VARCHAR(20) REFERENCES formations(name),
    status            VARCHAR(20) NOT NULL DEFAULT 'formation_pick',
    captain_player_id UUID REFERENCES players(id),
    created_at        TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at        TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    UNIQUE(user_id, round_id)
);
-- status lifecycle: formation_pick → drafting → bench_drafting → captain_pick → complete
```

**`draft_picks`** — cada escolha do usuário:
```sql
CREATE TABLE draft_picks (
    id                   UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    draft_id             UUID NOT NULL REFERENCES drafts(id),
    player_id            UUID NOT NULL REFERENCES players(id),
    slot_position        SMALLINT NOT NULL,
    detailed_position_id SMALLINT REFERENCES detailed_positions(id),
    overall_pick         SMALLINT NOT NULL,
    picked_at            TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    UNIQUE(draft_id, slot_position)
);
```

### Novos endpoints

```
# Admin
PUT  /api/v1/admin/config/active-round          — define rodada ativa (body: { round_id })

# Formações (público autenticado)
GET  /api/v1/formations                          — lista todas as formações disponíveis

# Pool de jogadores (público autenticado)
GET  /api/v1/drafts/pool-stats                   — capacidade do pool por posição para a rodada ativa

# Drafts
POST /api/v1/drafts                              — cria draft para a rodada ativa
GET  /api/v1/drafts/active                       — drafts em andamento do usuário autenticado
GET  /api/v1/drafts/history                      — drafts completos do usuário autenticado
GET  /api/v1/drafts/history/:id                  — detalhe completo de um draft concluído (com scores quando disponíveis)
GET  /api/v1/drafts/:id                          — estado atual do draft
POST /api/v1/drafts/:id/formation                — submete formação escolhida (body: { formation: "4-3-3" })
GET  /api/v1/drafts/:id/slots/:slot/options      — 5 opções aleatórias de jogadores para o slot
POST /api/v1/drafts/:id/picks                    — confirma escolha (body: { player_id, slot_position })
POST /api/v1/drafts/:id/captain                  — define capitão (body: { player_id })
```

### Estrutura interna do backend (draft-football-api)

Seguindo os padrões já estabelecidos no projeto:

```
internal/
  domain/draft/         — entidades Draft, DraftPick, DraftConfig + interfaces Repository/UseCase
  usecase/draft/        — lógica: criar draft, gerar opções, registrar pick, definir capitão
  controller/draft/     — handlers HTTP + DTOs
  repository/postgres/  — implementações das queries
migrations/
  000015_create_draft_config.up.sql
  000016_create_drafts.up.sql
  000017_create_draft_picks.up.sql
```

---

## Seção 3: Frontend — O que muda

### O que é removido

- `src/socket.js` e dependência `socket.io-client`
- `src/pages/Lobby.jsx`
- Toda lógica de sala em tempo real (`create_room`, `join_room`, `reconnect_participant`, etc.)
- Lógica de modo paralelo, simultâneo, timer de turno em `Draft.jsx`
- `FORMATIONS_CLIENT` hardcodado em `Draft.jsx`
- `SimDraft.jsx`, `SimultaneousView.jsx` (modos não utilizados)

### O que é adaptado

- `src/config.js` — base URL aponta para `/api/v1`
- `src/pages/Home.jsx` — remove criação de sala com socket; botão "Criar Draft" chama REST; mantém lista de drafts ativos/histórico
- `src/pages/Draft.jsx` — fluxo via REST com polling simples; sem socket events
- `src/components/PlayerList.jsx` — filtro por `position_id` básico (GOL/DEF/MEI/ATA); exibe `detailed_position` no card
- `src/components/PlayerCard.jsx` — usa UUID em vez de `cartola_id`; sem `average_score`
- `src/components/FormationPickerPhase.jsx` — formações carregadas via `GET /api/v1/formations`
- `src/pages/Admin.jsx` — adiciona painel de rodada ativa

### Novo fluxo do Draft

```
Home
  → [Criar Draft]  →  POST /api/v1/drafts
  → FormationPicker  →  GET /api/v1/formations
                     →  POST /api/v1/drafts/:id/formation

  → Loop titulares (11 slots da formação):
       GET  /api/v1/drafts/:id/slots/:slot/options   (5 opções)
       PickPanel: usuário escolhe
       POST /api/v1/drafts/:id/picks

  → Loop reservas (bench slots):
       mesmo padrão

  → Captain pick
       POST /api/v1/drafts/:id/captain

  → Draft completo → EndScreen (GET /api/v1/drafts/history/:id)
```

### Contrato do jogador (novo)

```js
// Antes (Cartola)
{
  cartola_id: 12345,
  nickname: "Hulk",
  position_id: 5,        // 1-5 simplificado
  average_score: 7.2,
  status_id: 7,
  club: { abbreviation: "CAM" }
}

// Depois (SportMonks)
{
  id: "uuid-...",
  name: "Hulk",
  display_name: "Hulk",
  position_id: 4,           // 1-4: GOL/DEF/MEI/ATA
  detailed_position_id: 10, // 1-13: posição específica
  team: {
    id: "uuid-...",
    short_code: "CAM",
    logo_url: "https://..."
  }
}
```

---

## Dependências entre projetos

```
draft-football-api (backend)
  └── migrations 15-17 (draft_config, drafts, draft_picks)
  └── domain/usecase/controller/repository para draft
  └── endpoints de formações e admin/config

draft-football-app-2 (frontend)
  └── depende de draft-football-api rodando com migrations aplicadas
  └── remove socket.io-client
  └── adapta todos os componentes de draft
```

## O que está fora do escopo desta fase

- Cálculo de score / pontuação por rodada
- Modo multiplayer ou draft em grupo
- Reroll de opções (pode ser reintroduzido depois)
- Sincronização automática de dados do SportMonks (já existe via worker separado)
