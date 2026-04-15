# src/ — Páginas e Componentes

---

## App.jsx — Estado global e roteamento

Estado global que todas as páginas consomem via props:

```javascript
user        // { id, name, email, is_admin } — null se não autenticado
page        // 'home' | 'draft' | 'end' | 'admin'
draftId     // UUID do draft em andamento
authPage    // 'login' | 'register' | 'forgot' — qual tela de auth mostrar
error       // mensagem de erro global (barra no topo)
```

No startup: valida `localStorage.draft_token` via `GET /api/v1/users/me`.

---

## pages/

### Login.jsx
- `POST /api/v1/auth/login` com `{ email, password }`
- Salva `token` em `localStorage.draft_token`, seta `user`
- Link para Register e ForgotPassword via `setAuthPage`

### Register.jsx
- Valida: senha ≥ 8 chars, confirmação bate
- `POST /api/v1/users` → cria conta
- Se sucesso, faz login automático (`POST /api/v1/auth/login`)

### ForgotPassword.jsx
- **Passo 1:** `POST /api/v1/api/auth/verify-identity` com `{ username, telefone }`
- **Passo 2:** `POST /api/v1/api/auth/reset-password` com `{ username, telefone, nova_senha }`
- (URLs com `/api/v1/api/` são legacy do backend antigo — manter como estão)

### Home.jsx
- `GET /api/v1/drafts/active` → lista de drafts em andamento
- `GET /api/v1/drafts/history` → lista de drafts concluídos
- `POST /api/v1/drafts` → cria novo draft → `setDraftId(data.id)` + `setPage('draft')`
- Mostra badge de admin se `user.is_admin`
- Clicando em draft ativo → `setDraftId` + `setPage('draft')`
- Clicando em draft histórico → abre `DraftDetail` modal

### Draft.jsx — Máquina de estados do draft

**Estado local principal:**
```javascript
draft          // objeto completo retornado pelo backend (status, formation, picks, etc.)
formations     // lista de formações disponíveis
options        // 5 jogadores oferecidos para o slot atual (null se nenhum slot aberto)
activeSlot     // slot sendo picado no momento (1–16)
pendingPick    // cartolaId do pick em progresso (otimista)
pickedPlayers  // mapa de slot → jogador (espelho local dos picks)
```

**Fluxo por fase:**

`formation_pick`:
1. `GET /api/v1/formations` → renderiza `FormationPickerPhase`
2. Usuário clica → `POST /api/v1/drafts/{id}/formation` → `draft.status` vira `drafting`

`drafting` (slots 1–11):
1. Renderiza `TeamSlots` com slots clicáveis
2. Clique em slot → `GET /api/v1/drafts/{id}/slots/{slot}/options` → abre `PickPanel`
3. Usuário escolhe → `POST /api/v1/drafts/{id}/picks` com `{ player_id, slot_position }`
4. UI otimista: card aparece imediatamente; se API falhar, reverte
5. Após 11 picks, backend retorna `status: 'bench_drafting'`

`bench_drafting` (slots 12–16):
- Mesmo fluxo, mas seção de banco
- Slot 12–13: defensores/goleiros · Slot 14–16: meias/atacantes

`captain_pick`:
1. Renderiza titulares clicáveis
2. `POST /api/v1/drafts/{id}/captain` com `{ player_id }`
3. Backend retorna `status: 'complete'` → `setPage('end')`

**Polling:** `Draft.jsx` faz `GET /api/v1/drafts/{id}` para recarregar estado quando necessário
(ex: volta para a aba após sair). Não há socket/websocket.

### EndScreen.jsx
- Recebe `draftId` como prop
- `GET /api/v1/drafts/{id}` → exibe time completo com posições e capitão
- Botão "Voltar" → `setPage('home')`

### Admin.jsx — Painel de administração (~2000 linhas)

Organizado em abas/seções. Cada seção tem estado local próprio.

**Seção: Pool de Jogadores**
- `GET /api/v1/api/players` — todos os jogadores com status e scores
- `GET /api/v1/api/admin/eligible` — IDs dos jogadores aprovados manualmente
- Tabela 1 "Titulares": `status_id == 7` (Provável) e na lista eligible
- Tabela 2 "Outros": restantes (lesionados, suspensos, excluídos)
- `POST /DELETE /api/v1/api/admin/eligible/{playerId}` — mover entre tabelas
- Filtros: posição, clube, busca, ordenação, paginação

**Seção: Sync**
- `GET /api/v1/api/sync/status` — quando foi o último sync
- `POST /api/v1/api/sync` — trigger sync de jogadores (SportMonks/Cartola)
- `POST /api/v1/api/sync/scores` — trigger sync de pontuações

**Seção: Rodada Ativa**
- `GET /api/v1/admin/seasons` → `GET /api/v1/admin/rounds?season_id={id}`
- `PUT /api/v1/admin/config/active-round` com `{ round_id }`
- Define qual rodada os usuários podem draftar

**Seção: Pesos de Stats**
- `GET/PUT /api/v1/admin/stat-weights` — peso global por stat (goals, assists, tackles…)
- `GET/PUT /api/v1/admin/position-stat-weights?detailed_position_id={id}` — peso por posição
- Tabela editável inline; salva tudo de uma vez via PUT com array completo

**Seção: Stats de Jogadores**
- `GET /api/v1/admin/player-stats?round_id={id}&team_id?&detailed_position_id?`
- Grid com ~50 colunas de stats por jogador por rodada
- `GET /api/v1/admin/players/{playerId}/stats` — histórico de rounds de um jogador
- Exibe breakdown de contribuição por categoria

**Seção: Cards de Jogadores**
- `GET /api/v1/admin/player-cards?team_id?&detailed_position_id?`
- Atributos agregados (0–10): ATA, COM, CRI, DEF, PAS, FIS, GOL

**Seção: Moedas (se habilitado)**
- `GET /api/v1/api/admin/users` — usuários com saldo
- `PATCH /api/v1/api/admin/users/{id}/coins` com `{ delta: number }`
- `GET /api/v1/api/admin/coin-transactions?user_id={id}` — histórico

---

## components/

### DraftPlayerCard.jsx
Card principal de jogador usado durante o draft.

Props: `player, onClick, isMyTurn, compact`

- Renderiza camisa (SVG) com cores do time do jogador
- Cores por posição: GK=azul · DEF=verde · MID=amarelo · ATT=vermelho
- Exibe: nome, médias (score, minutos), atributos (ATA/COM/CRI/DEF/PAS/FIS/GOL)
- Modo `compact` (140×180px) ou full (210px)
- Cores dos clubes hardcoded no topo do arquivo para ~18 times

### PlayerCard.jsx
Versão simplificada para listas e histórico.

Props: `player, onClick, isMyTurn, compact, card`

3 modos de render:
- `compact` → linha horizontal (lista)
- `card` → mini card
- default → card médio

### PickPanel.jsx
Overlay de seleção de jogador para o slot atual.

Props: `options, slotDetailedPositionId, onPickPlayer, onClose, fadingOut`

- Mostra 5 opções horizontais (scroll no mobile, grid no desktop)
- Badge de posição com cor por categoria
- Fecha ao clicar fora ou no X

### FormationPickerPhase.jsx
Props: `onPick`

- Busca `GET /api/v1/formations` internamente
- Renderiza botões de formação (4-3-3, 4-4-2, etc.)
- Desabilita após seleção (evita duplo clique)

### TeamSlots.jsx
Props: `formation, picks, captainId`

- Exibe campo visual com 11 slots por posição + 5 de banco
- Slots sem pick mostram placeholder clicável
- Destaca capitão com badge

### DraftOrder.jsx
Props: `draftOrder, participants, currentPickerId, participantId, pickNumber`

- Mostra os próximos 8 picks em ordem
- Destaca o picker atual

### Timer.jsx
Props: `timeLeft, isMyTurn`

- Barra de progresso de 15s
- Fica vermelha quando `timeLeft <= 5`

### DraftHistory.jsx
Histórico de um draft como board estilo snake draft.

- Desktop: tabela com colunas por participante e linhas por round
- Mobile: seletor de participante + lista vertical
- Seta → ou ← indica direção do round (snake)
- Tooltip mostra as 5 opções que foram oferecidas no momento do pick

### DraftDetail.jsx
Props: `roomCode, onClose`

Modal de draft concluído:
- Ranking de participantes por pontuação total
- Visão individual: titulares + banco com scores da rodada
- Substituições automáticas (reserva jogou, titular não jogou)
- Capitão com multiplicador 2×

### PlayerStatsModal.jsx
Props: `player, onClose`

- `GET /api/v1/admin/players/{playerId}/stats`
- Selector de rodada
- Breakdown por categoria (ataque, defesa, criacao, passes, fisico, comportamento, goleiro)
- Mostra stat_name, peso global, peso por posição, valor bruto, contribuição

### PlayerList.jsx
Props: `players, pickedIds, isMyTurn, onPick`

- Busca por nome + filtro por posição
- Lista scrollável
- Jogadores já picados (`pickedIds`) aparecem desabilitados

---

## utils/nationality.js

Mapa `{ "Brasil": "br", "Argentina": "ar", ... }` para ~70 nacionalidades.
Usado nos cards de jogador para renderizar bandeiras via `flag-icons` CDN.

**Para adicionar nova nacionalidade:** inclua `"Nome Cartola": "iso2"` no objeto exportado.
