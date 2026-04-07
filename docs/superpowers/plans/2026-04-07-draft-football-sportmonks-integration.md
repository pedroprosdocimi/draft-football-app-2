# Draft Football — SportMonks Integration Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Migrate draft-football-app-2 (React frontend) to consume draft-football-api (Go backend with SportMonks data), replacing the Cartola/Socket.IO stack with a pure REST solo draft flow.

**Architecture:** Backend gains three new migrations (draft_config, drafts, draft_picks) and a full draft domain following the existing layered pattern (domain → repository → usecase → controller). Frontend removes socket.io entirely and replaces every API call and component with the new SportMonks player contract.

**Tech Stack:** Go 1.25 + Gin + pgx/v5 (backend); React + Vite + Tailwind (frontend). No new dependencies in either project.

---

## File Map

### Backend — draft-football-api

| File | Action | Purpose |
|---|---|---|
| `migrations/000015_create_draft_config.*` | Create | draft_config table |
| `migrations/000016_create_drafts.*` | Create | drafts table |
| `migrations/000017_create_draft_picks.*` | Create | draft_picks table |
| `internal/domain/formation/formation.go` | Create | Formation entity + Repository interface |
| `internal/domain/draft/draft.go` | Create | Draft, Pick, PoolPlayer entities + Repository + UseCase interfaces |
| `internal/repository/postgres/formation.go` | Create | formation postgres repo |
| `internal/repository/postgres/draft.go` | Create | draft postgres repo |
| `internal/usecase/draft/usecase.go` | Create | UseCase interface + struct constructor |
| `internal/usecase/draft/create.go` | Create | Create method |
| `internal/usecase/draft/get.go` | Create | GetByID method |
| `internal/usecase/draft/formation.go` | Create | SetFormation method |
| `internal/usecase/draft/options.go` | Create | GetSlotOptions method |
| `internal/usecase/draft/pick.go` | Create | Pick method |
| `internal/usecase/draft/captain.go` | Create | SetCaptain method |
| `internal/usecase/draft/list.go` | Create | ListActive, ListComplete, GetPoolStats |
| `internal/usecase/draft/config.go` | Create | SetActiveRound method |
| `internal/controller/draft/dto.go` | Create | Draft HTTP request/response types |
| `internal/controller/draft/handler.go` | Create | Draft HTTP handlers + RegisterRoutes |
| `internal/controller/formation/dto.go` | Create | Formation HTTP response types |
| `internal/controller/formation/handler.go` | Create | Formation handler + RegisterRoutes |
| `internal/controller/admin/dto.go` | Modify | Add SetActiveRoundRequest |
| `internal/controller/admin/handler.go` | Modify | Add SetActiveRound handler + route |
| `internal/controller/user/handler.go` | Modify | Add GET /users/me handler |
| `cmd/api/main.go` | Modify | Wire formation + draft repos, usecases, controllers |

### Frontend — draft-football-app-2

| File | Action | Purpose |
|---|---|---|
| `package.json` | Modify | Remove socket.io-client |
| `src/config.js` | Modify | Point base URL to /api/v1 |
| `src/socket.js` | Delete | No longer needed |
| `src/pages/Login.jsx` | Modify | New auth contract (email/password) |
| `src/pages/Register.jsx` | Modify | New user fields (name/email/phone/password) |
| `src/pages/Lobby.jsx` | Delete | No lobby in solo mode |
| `src/App.jsx` | Rewrite | Remove socket, new navigation (draftId-based) |
| `src/components/PlayerCard.jsx` | Rewrite | SportMonks player contract |
| `src/components/PlayerList.jsx` | Modify | New position filters (basic 1-4) |
| `src/components/FormationPickerPhase.jsx` | Rewrite | Load formations from API |
| `src/components/PickPanel.jsx` | Rewrite | Solo REST flow, SportMonks positions |
| `src/components/SimDraft.jsx` | Delete | Unused in solo mode |
| `src/components/SimultaneousView.jsx` | Delete | Unused |
| `src/pages/Draft.jsx` | Rewrite | Pure REST fetch flow |
| `src/pages/Home.jsx` | Rewrite | REST create draft, list active/history |
| `src/pages/Admin.jsx` | Modify | Add active round control |
| `src/pages/EndScreen.jsx` | Modify | Use new draft/pick contract |

---

## PART 1: Backend — draft-football-api

---

### Task 1: Migrations

**Files:**
- Create: `migrations/000015_create_draft_config.up.sql`
- Create: `migrations/000015_create_draft_config.down.sql`
- Create: `migrations/000016_create_drafts.up.sql`
- Create: `migrations/000016_create_drafts.down.sql`
- Create: `migrations/000017_create_draft_picks.up.sql`
- Create: `migrations/000017_create_draft_picks.down.sql`

- [ ] **Step 1: Write draft_config migration**

`migrations/000015_create_draft_config.up.sql`:
```sql
CREATE TABLE draft_config (
    key        VARCHAR(50) PRIMARY KEY,
    value      TEXT,
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

INSERT INTO draft_config (key, value) VALUES ('active_round_id', NULL);
```

`migrations/000015_create_draft_config.down.sql`:
```sql
DROP TABLE IF EXISTS draft_config;
```

- [ ] **Step 2: Write drafts migration**

`migrations/000016_create_drafts.up.sql`:
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
-- valid statuses: formation_pick, drafting, bench_drafting, captain_pick, complete
```

`migrations/000016_create_drafts.down.sql`:
```sql
DROP TABLE IF EXISTS drafts;
```

- [ ] **Step 3: Write draft_picks migration**

`migrations/000017_create_draft_picks.up.sql`:
```sql
CREATE TABLE draft_picks (
    id                   UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    draft_id             UUID NOT NULL REFERENCES drafts(id) ON DELETE CASCADE,
    player_id            UUID NOT NULL REFERENCES players(id),
    slot_position        SMALLINT NOT NULL,
    detailed_position_id SMALLINT NOT NULL REFERENCES detailed_positions(id),
    overall_pick         SMALLINT NOT NULL,
    picked_at            TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    UNIQUE(draft_id, slot_position)
);
```

`migrations/000017_create_draft_picks.down.sql`:
```sql
DROP TABLE IF EXISTS draft_picks;
```

- [ ] **Step 4: Apply migrations**

```bash
# from draft-football-api root — adjust connection string as needed
migrate -path migrations -database "postgres://postgres:postgres@localhost:5432/draft_football?sslmode=disable" up
```

Expected output: `3/u create_draft_config`, `3/u create_drafts`, `3/u create_draft_picks`

- [ ] **Step 5: Commit**

```bash
git add migrations/
git commit -m "feat: add draft_config, drafts, draft_picks migrations"
```

---

### Task 2: Formation domain + repository

**Files:**
- Create: `internal/domain/formation/formation.go`
- Create: `internal/repository/postgres/formation.go`

- [ ] **Step 1: Write formation domain**

`internal/domain/formation/formation.go`:
```go
package formation

import "context"

type Slot struct {
	Position           int // slot number 1-11 in the formation
	DetailedPositionID int // references detailed_positions.id
}

type Formation struct {
	Name  string
	Slots []Slot
}

type Repository interface {
	FindAll(ctx context.Context) ([]Formation, error)
	FindByName(ctx context.Context, name string) (*Formation, error)
}
```

- [ ] **Step 2: Write formation postgres repository**

`internal/repository/postgres/formation.go`:
```go
package postgres

import (
	"context"
	"fmt"

	"github.com/draft-football-api/internal/domain"
	"github.com/draft-football-api/internal/domain/formation"
	"github.com/jackc/pgx/v5/pgxpool"
)

type formationRepository struct {
	db *pgxpool.Pool
}

func NewFormationRepository(db *pgxpool.Pool) formation.Repository {
	return &formationRepository{db: db}
}

func (r *formationRepository) FindAll(ctx context.Context) ([]formation.Formation, error) {
	query := `
		SELECT name,
		       position_1, position_2, position_3, position_4, position_5,
		       position_6, position_7, position_8, position_9, position_10, position_11
		FROM formations
		ORDER BY name ASC`
	rows, err := r.db.Query(ctx, query)
	if err != nil {
		return nil, fmt.Errorf("postgres find all formations: %w", err)
	}
	defer rows.Close()

	var results []formation.Formation
	for rows.Next() {
		f, err := scanFormation(rows.Scan)
		if err != nil {
			return nil, fmt.Errorf("postgres scan formation: %w", err)
		}
		results = append(results, f)
	}
	return results, rows.Err()
}

func (r *formationRepository) FindByName(ctx context.Context, name string) (*formation.Formation, error) {
	query := `
		SELECT name,
		       position_1, position_2, position_3, position_4, position_5,
		       position_6, position_7, position_8, position_9, position_10, position_11
		FROM formations WHERE name = $1`
	row := r.db.QueryRow(ctx, query, name)
	f, err := scanFormation(row.Scan)
	if err != nil {
		return nil, domain.ErrNotFound
	}
	return &f, nil
}

func scanFormation(scan func(...any) error) (formation.Formation, error) {
	var name string
	var p [11]int
	if err := scan(&name,
		&p[0], &p[1], &p[2], &p[3], &p[4],
		&p[5], &p[6], &p[7], &p[8], &p[9], &p[10],
	); err != nil {
		return formation.Formation{}, err
	}
	slots := make([]formation.Slot, 11)
	for i := range slots {
		slots[i] = formation.Slot{Position: i + 1, DetailedPositionID: p[i]}
	}
	return formation.Formation{Name: name, Slots: slots}, nil
}
```

- [ ] **Step 3: Verify it compiles**

```bash
cd C:/Users/pA/Desktop/draft-football-api
go build ./internal/domain/formation/...
go build ./internal/repository/postgres/...
```

Expected: no errors

- [ ] **Step 4: Commit**

```bash
git add internal/domain/formation/ internal/repository/postgres/formation.go
git commit -m "feat: add formation domain and postgres repository"
```

---

### Task 3: Draft domain

**Files:**
- Create: `internal/domain/draft/draft.go`

- [ ] **Step 1: Write draft domain**

`internal/domain/draft/draft.go`:
```go
package draft

import (
	"context"
	"errors"
	"time"

	"github.com/google/uuid"
)

type Status string

const (
	StatusFormationPick Status = "formation_pick"
	StatusDrafting      Status = "drafting"
	StatusBenchDrafting Status = "bench_drafting"
	StatusCaptainPick   Status = "captain_pick"
	StatusComplete      Status = "complete"
)

var (
	ErrNoActiveRound    = errors.New("no active round configured")
	ErrAlreadyDrafted   = errors.New("you already have a draft for this round")
	ErrWrongStatus      = errors.New("action not allowed in current draft status")
	ErrNotOwner         = errors.New("draft belongs to another user")
	ErrSlotAlreadyFilled = errors.New("slot already filled")
	ErrPlayerNotInOptions = errors.New("player not in current options")
)

type Draft struct {
	ID              uuid.UUID
	UserID          uuid.UUID
	RoundID         uuid.UUID
	Formation       string
	Status          Status
	CaptainPlayerID *uuid.UUID
	CreatedAt       time.Time
	UpdatedAt       time.Time
}

type Pick struct {
	ID                 uuid.UUID
	DraftID            uuid.UUID
	PlayerID           uuid.UUID
	SlotPosition       int
	DetailedPositionID int
	OverallPick        int
	PickedAt           time.Time
}

type PoolPlayer struct {
	ID                 uuid.UUID
	Name               string
	DisplayName        string
	PositionID         int
	DetailedPositionID int
	TeamShortCode      string
	TeamLogoURL        string
}

// BenchSlotPositions defines which basic position_ids are valid for each bench slot.
// Slots 12-13 accept defenders; 14-16 accept midfielders or attackers.
var BenchSlotPositions = map[int][]int{
	12: {2},
	13: {2},
	14: {3, 4},
	15: {3, 4},
	16: {3, 4},
}

// StarterSlotCount is the number of starter slots in any formation.
const StarterSlotCount = 11

type Repository interface {
	Create(ctx context.Context, d *Draft) error
	FindByID(ctx context.Context, id uuid.UUID) (*Draft, error)
	FindActiveByUserID(ctx context.Context, userID uuid.UUID) ([]Draft, error)
	FindCompleteByUserID(ctx context.Context, userID uuid.UUID) ([]Draft, error)
	UpdateFormation(ctx context.Context, id uuid.UUID, f string, status Status) error
	UpdateStatus(ctx context.Context, id uuid.UUID, status Status) error
	UpdateCaptain(ctx context.Context, id uuid.UUID, playerID uuid.UUID) error
	CreatePick(ctx context.Context, pick *Pick) error
	FindPicksByDraftID(ctx context.Context, draftID uuid.UUID) ([]Pick, error)
	CountPicksByDraftID(ctx context.Context, draftID uuid.UUID) (int, error)
	GetActiveRoundID(ctx context.Context) (*uuid.UUID, error)
	SetActiveRoundID(ctx context.Context, roundID uuid.UUID) error
	GetOptionsByDetailedPosition(ctx context.Context, draftID uuid.UUID, detailedPositionID int) ([]PoolPlayer, error)
	GetOptionsByPositionIDs(ctx context.Context, draftID uuid.UUID, positionIDs []int) ([]PoolPlayer, error)
	GetPoolStatsByPosition(ctx context.Context) (map[int]int, error)
}

type UseCase interface {
	Create(ctx context.Context, userID uuid.UUID) (*Draft, error)
	GetByID(ctx context.Context, draftID, userID uuid.UUID) (*Draft, []Pick, error)
	SetFormation(ctx context.Context, draftID, userID uuid.UUID, formationName string) (*Draft, error)
	GetSlotOptions(ctx context.Context, draftID, userID uuid.UUID, slotPosition int) ([]PoolPlayer, error)
	Pick(ctx context.Context, draftID, userID, playerID uuid.UUID, slotPosition int) (*Draft, error)
	SetCaptain(ctx context.Context, draftID, userID, playerID uuid.UUID) (*Draft, error)
	ListActive(ctx context.Context, userID uuid.UUID) ([]Draft, error)
	ListComplete(ctx context.Context, userID uuid.UUID) ([]Draft, error)
	GetPoolStats(ctx context.Context) (map[int]int, error)
	SetActiveRound(ctx context.Context, roundID uuid.UUID) error
}
```

- [ ] **Step 2: Verify compilation**

```bash
go build ./internal/domain/draft/...
```

Expected: no errors

- [ ] **Step 3: Commit**

```bash
git add internal/domain/draft/
git commit -m "feat: add draft domain entities and interfaces"
```

---

### Task 4: Draft postgres repository

**Files:**
- Create: `internal/repository/postgres/draft.go`

- [ ] **Step 1: Write draft repository**

`internal/repository/postgres/draft.go`:
```go
package postgres

import (
	"context"
	"fmt"
	"strings"
	"time"

	"github.com/draft-football-api/internal/domain"
	"github.com/draft-football-api/internal/domain/draft"
	"github.com/google/uuid"
	"github.com/jackc/pgx/v5/pgxpool"
)

type draftRepository struct {
	db *pgxpool.Pool
}

func NewDraftRepository(db *pgxpool.Pool) draft.Repository {
	return &draftRepository{db: db}
}

func (r *draftRepository) Create(ctx context.Context, d *draft.Draft) error {
	query := `
		INSERT INTO drafts (id, user_id, round_id, status, created_at, updated_at)
		VALUES ($1, $2, $3, $4, $5, $5)`
	_, err := r.db.Exec(ctx, query, d.ID, d.UserID, d.RoundID, d.Status, d.CreatedAt)
	if err != nil {
		if strings.Contains(err.Error(), "unique") {
			return domain.ErrAlreadyExists
		}
		return fmt.Errorf("postgres create draft: %w", err)
	}
	return nil
}

func (r *draftRepository) FindByID(ctx context.Context, id uuid.UUID) (*draft.Draft, error) {
	query := `
		SELECT id, user_id, round_id, COALESCE(formation,''), status, captain_player_id,
		       created_at, updated_at
		FROM drafts WHERE id = $1`
	row := r.db.QueryRow(ctx, query, id)
	d, err := scanDraft(row.Scan)
	if err != nil {
		return nil, domain.ErrNotFound
	}
	return d, nil
}

func (r *draftRepository) FindActiveByUserID(ctx context.Context, userID uuid.UUID) ([]draft.Draft, error) {
	query := `
		SELECT id, user_id, round_id, COALESCE(formation,''), status, captain_player_id,
		       created_at, updated_at
		FROM drafts
		WHERE user_id = $1 AND status != 'complete'
		ORDER BY created_at DESC`
	return r.queryDrafts(ctx, query, userID)
}

func (r *draftRepository) FindCompleteByUserID(ctx context.Context, userID uuid.UUID) ([]draft.Draft, error) {
	query := `
		SELECT id, user_id, round_id, COALESCE(formation,''), status, captain_player_id,
		       created_at, updated_at
		FROM drafts
		WHERE user_id = $1 AND status = 'complete'
		ORDER BY updated_at DESC
		LIMIT 50`
	return r.queryDrafts(ctx, query, userID)
}

func (r *draftRepository) UpdateFormation(ctx context.Context, id uuid.UUID, f string, status draft.Status) error {
	_, err := r.db.Exec(ctx,
		`UPDATE drafts SET formation = $1, status = $2, updated_at = NOW() WHERE id = $3`,
		f, status, id)
	return err
}

func (r *draftRepository) UpdateStatus(ctx context.Context, id uuid.UUID, status draft.Status) error {
	_, err := r.db.Exec(ctx,
		`UPDATE drafts SET status = $1, updated_at = NOW() WHERE id = $2`,
		status, id)
	return err
}

func (r *draftRepository) UpdateCaptain(ctx context.Context, id uuid.UUID, playerID uuid.UUID) error {
	_, err := r.db.Exec(ctx,
		`UPDATE drafts SET captain_player_id = $1, status = 'complete', updated_at = NOW() WHERE id = $2`,
		playerID, id)
	return err
}

func (r *draftRepository) CreatePick(ctx context.Context, pick *draft.Pick) error {
	_, err := r.db.Exec(ctx,
		`INSERT INTO draft_picks (id, draft_id, player_id, slot_position, detailed_position_id, overall_pick, picked_at)
		 VALUES ($1, $2, $3, $4, $5, $6, $7)`,
		pick.ID, pick.DraftID, pick.PlayerID, pick.SlotPosition,
		pick.DetailedPositionID, pick.OverallPick, pick.PickedAt)
	if err != nil {
		if strings.Contains(err.Error(), "unique") {
			return domain.ErrAlreadyExists
		}
		return fmt.Errorf("postgres create pick: %w", err)
	}
	return nil
}

func (r *draftRepository) FindPicksByDraftID(ctx context.Context, draftID uuid.UUID) ([]draft.Pick, error) {
	query := `
		SELECT id, draft_id, player_id, slot_position, detailed_position_id, overall_pick, picked_at
		FROM draft_picks WHERE draft_id = $1 ORDER BY overall_pick ASC`
	rows, err := r.db.Query(ctx, query, draftID)
	if err != nil {
		return nil, fmt.Errorf("postgres find picks: %w", err)
	}
	defer rows.Close()

	var picks []draft.Pick
	for rows.Next() {
		var p draft.Pick
		if err := rows.Scan(&p.ID, &p.DraftID, &p.PlayerID, &p.SlotPosition,
			&p.DetailedPositionID, &p.OverallPick, &p.PickedAt); err != nil {
			return nil, err
		}
		picks = append(picks, p)
	}
	return picks, rows.Err()
}

func (r *draftRepository) CountPicksByDraftID(ctx context.Context, draftID uuid.UUID) (int, error) {
	var count int
	err := r.db.QueryRow(ctx,
		`SELECT COUNT(*) FROM draft_picks WHERE draft_id = $1`, draftID).Scan(&count)
	return count, err
}

func (r *draftRepository) GetActiveRoundID(ctx context.Context) (*uuid.UUID, error) {
	var value *string
	err := r.db.QueryRow(ctx,
		`SELECT value FROM draft_config WHERE key = 'active_round_id'`).Scan(&value)
	if err != nil || value == nil || *value == "" {
		return nil, nil
	}
	id, err := uuid.Parse(*value)
	if err != nil {
		return nil, nil
	}
	return &id, nil
}

func (r *draftRepository) SetActiveRoundID(ctx context.Context, roundID uuid.UUID) error {
	_, err := r.db.Exec(ctx,
		`UPDATE draft_config SET value = $1, updated_at = NOW() WHERE key = 'active_round_id'`,
		roundID.String())
	return err
}

func (r *draftRepository) GetOptionsByDetailedPosition(ctx context.Context, draftID uuid.UUID, detailedPositionID int) ([]draft.PoolPlayer, error) {
	query := `
		SELECT p.id, p.name, COALESCE(p.display_name, p.name),
		       p.position_id, p.detailed_position_id,
		       COALESCE(t.short_code, ''), COALESCE(t.logo_url, '')
		FROM players p
		LEFT JOIN teams t ON t.id = p.team_id
		WHERE p.detailed_position_id = $1
		  AND p.id NOT IN (SELECT player_id FROM draft_picks WHERE draft_id = $2)
		ORDER BY RANDOM()
		LIMIT 5`
	return r.queryPoolPlayers(ctx, query, detailedPositionID, draftID)
}

func (r *draftRepository) GetOptionsByPositionIDs(ctx context.Context, draftID uuid.UUID, positionIDs []int) ([]draft.PoolPlayer, error) {
	if len(positionIDs) == 0 {
		return nil, nil
	}
	placeholders := make([]string, len(positionIDs))
	args := []any{draftID}
	for i, pid := range positionIDs {
		placeholders[i] = fmt.Sprintf("$%d", i+2)
		args = append(args, pid)
	}
	query := fmt.Sprintf(`
		SELECT p.id, p.name, COALESCE(p.display_name, p.name),
		       p.position_id, p.detailed_position_id,
		       COALESCE(t.short_code, ''), COALESCE(t.logo_url, '')
		FROM players p
		LEFT JOIN teams t ON t.id = p.team_id
		WHERE p.position_id IN (%s)
		  AND p.id NOT IN (SELECT player_id FROM draft_picks WHERE draft_id = $1)
		ORDER BY RANDOM()
		LIMIT 5`, strings.Join(placeholders, ","))
	return r.queryPoolPlayers(ctx, query, args...)
}

func (r *draftRepository) GetPoolStatsByPosition(ctx context.Context) (map[int]int, error) {
	rows, err := r.db.Query(ctx,
		`SELECT detailed_position_id, COUNT(*) FROM players
		 WHERE detailed_position_id IS NOT NULL
		 GROUP BY detailed_position_id`)
	if err != nil {
		return nil, err
	}
	defer rows.Close()
	result := make(map[int]int)
	for rows.Next() {
		var posID, count int
		if err := rows.Scan(&posID, &count); err != nil {
			return nil, err
		}
		result[posID] = count
	}
	return result, rows.Err()
}

// helpers

func (r *draftRepository) queryDrafts(ctx context.Context, query string, args ...any) ([]draft.Draft, error) {
	rows, err := r.db.Query(ctx, query, args...)
	if err != nil {
		return nil, fmt.Errorf("postgres query drafts: %w", err)
	}
	defer rows.Close()
	var drafts []draft.Draft
	for rows.Next() {
		d, err := scanDraft(rows.Scan)
		if err != nil {
			return nil, err
		}
		drafts = append(drafts, *d)
	}
	return drafts, rows.Err()
}

func (r *draftRepository) queryPoolPlayers(ctx context.Context, query string, args ...any) ([]draft.PoolPlayer, error) {
	rows, err := r.db.Query(ctx, query, args...)
	if err != nil {
		return nil, fmt.Errorf("postgres query pool players: %w", err)
	}
	defer rows.Close()
	var players []draft.PoolPlayer
	for rows.Next() {
		var p draft.PoolPlayer
		if err := rows.Scan(&p.ID, &p.Name, &p.DisplayName,
			&p.PositionID, &p.DetailedPositionID, &p.TeamShortCode, &p.TeamLogoURL); err != nil {
			return nil, err
		}
		players = append(players, p)
	}
	return players, rows.Err()
}

func scanDraft(scan func(...any) error) (*draft.Draft, error) {
	d := &draft.Draft{}
	var statusStr string
	var captain *uuid.UUID
	err := scan(&d.ID, &d.UserID, &d.RoundID, &d.Formation, &statusStr, &captain,
		&d.CreatedAt, &d.UpdatedAt)
	if err != nil {
		return nil, err
	}
	d.Status = draft.Status(statusStr)
	d.CaptainPlayerID = captain
	if d.CreatedAt.IsZero() {
		d.CreatedAt = time.Now()
	}
	return d, nil
}
```

- [ ] **Step 2: Verify compilation**

```bash
go build ./internal/repository/postgres/...
```

Expected: no errors

- [ ] **Step 3: Commit**

```bash
git add internal/repository/postgres/draft.go
git commit -m "feat: add draft postgres repository"
```

---

### Task 5: Draft usecase

**Files:**
- Create: `internal/usecase/draft/usecase.go`
- Create: `internal/usecase/draft/create.go`
- Create: `internal/usecase/draft/get.go`
- Create: `internal/usecase/draft/formation.go`
- Create: `internal/usecase/draft/options.go`
- Create: `internal/usecase/draft/pick.go`
- Create: `internal/usecase/draft/captain.go`
- Create: `internal/usecase/draft/list.go`
- Create: `internal/usecase/draft/config.go`

- [ ] **Step 1: Write usecase.go (struct + constructor)**

`internal/usecase/draft/usecase.go`:
```go
package draftusecase

import (
	"github.com/draft-football-api/internal/domain/draft"
	"github.com/draft-football-api/internal/domain/formation"
)

type useCase struct {
	repo          draft.Repository
	formationRepo formation.Repository
}

func New(repo draft.Repository, formationRepo formation.Repository) draft.UseCase {
	return &useCase{repo: repo, formationRepo: formationRepo}
}
```

- [ ] **Step 2: Write create.go**

`internal/usecase/draft/create.go`:
```go
package draftusecase

import (
	"context"
	"fmt"
	"time"

	"github.com/draft-football-api/internal/domain"
	"github.com/draft-football-api/internal/domain/draft"
	"github.com/google/uuid"
)

func (uc *useCase) Create(ctx context.Context, userID uuid.UUID) (*draft.Draft, error) {
	roundID, err := uc.repo.GetActiveRoundID(ctx)
	if err != nil {
		return nil, fmt.Errorf("getting active round: %w", err)
	}
	if roundID == nil {
		return nil, draft.ErrNoActiveRound
	}

	d := &draft.Draft{
		ID:        uuid.New(),
		UserID:    userID,
		RoundID:   *roundID,
		Status:    draft.StatusFormationPick,
		CreatedAt: time.Now(),
		UpdatedAt: time.Now(),
	}

	if err := uc.repo.Create(ctx, d); err != nil {
		if err == domain.ErrAlreadyExists {
			return nil, draft.ErrAlreadyDrafted
		}
		return nil, fmt.Errorf("creating draft: %w", err)
	}
	return d, nil
}
```

- [ ] **Step 3: Write get.go**

`internal/usecase/draft/get.go`:
```go
package draftusecase

import (
	"context"
	"fmt"

	"github.com/draft-football-api/internal/domain/draft"
	"github.com/google/uuid"
)

func (uc *useCase) GetByID(ctx context.Context, draftID, userID uuid.UUID) (*draft.Draft, []draft.Pick, error) {
	d, err := uc.repo.FindByID(ctx, draftID)
	if err != nil {
		return nil, nil, err
	}
	if d.UserID != userID {
		return nil, nil, draft.ErrNotOwner
	}
	picks, err := uc.repo.FindPicksByDraftID(ctx, draftID)
	if err != nil {
		return nil, nil, fmt.Errorf("fetching picks: %w", err)
	}
	return d, picks, nil
}
```

- [ ] **Step 4: Write formation.go**

`internal/usecase/draft/formation.go`:
```go
package draftusecase

import (
	"context"
	"fmt"

	"github.com/draft-football-api/internal/domain"
	"github.com/draft-football-api/internal/domain/draft"
	"github.com/google/uuid"
)

func (uc *useCase) SetFormation(ctx context.Context, draftID, userID uuid.UUID, formationName string) (*draft.Draft, error) {
	d, err := uc.repo.FindByID(ctx, draftID)
	if err != nil {
		return nil, err
	}
	if d.UserID != userID {
		return nil, draft.ErrNotOwner
	}
	if d.Status != draft.StatusFormationPick {
		return nil, draft.ErrWrongStatus
	}
	if _, err := uc.formationRepo.FindByName(ctx, formationName); err != nil {
		if err == domain.ErrNotFound {
			return nil, fmt.Errorf("formation %q not found", formationName)
		}
		return nil, err
	}
	if err := uc.repo.UpdateFormation(ctx, draftID, formationName, draft.StatusDrafting); err != nil {
		return nil, fmt.Errorf("updating formation: %w", err)
	}
	d.Formation = formationName
	d.Status = draft.StatusDrafting
	return d, nil
}
```

- [ ] **Step 5: Write options.go**

`internal/usecase/draft/options.go`:
```go
package draftusecase

import (
	"context"
	"fmt"

	"github.com/draft-football-api/internal/domain/draft"
	"github.com/google/uuid"
)

func (uc *useCase) GetSlotOptions(ctx context.Context, draftID, userID uuid.UUID, slotPosition int) ([]draft.PoolPlayer, error) {
	d, err := uc.repo.FindByID(ctx, draftID)
	if err != nil {
		return nil, err
	}
	if d.UserID != userID {
		return nil, draft.ErrNotOwner
	}
	if d.Status != draft.StatusDrafting && d.Status != draft.StatusBenchDrafting {
		return nil, draft.ErrWrongStatus
	}

	// Bench slot: positions defined by BenchSlotPositions map
	if slotPosition > draft.StarterSlotCount {
		posIDs, ok := draft.BenchSlotPositions[slotPosition]
		if !ok {
			return nil, fmt.Errorf("invalid bench slot %d", slotPosition)
		}
		return uc.repo.GetOptionsByPositionIDs(ctx, draftID, posIDs)
	}

	// Starter slot: get detailed_position_id from the formation
	f, err := uc.formationRepo.FindByName(ctx, d.Formation)
	if err != nil {
		return nil, fmt.Errorf("loading formation: %w", err)
	}
	if slotPosition < 1 || slotPosition > len(f.Slots) {
		return nil, fmt.Errorf("invalid slot position %d for formation %s", slotPosition, d.Formation)
	}
	detailedPosID := f.Slots[slotPosition-1].DetailedPositionID
	return uc.repo.GetOptionsByDetailedPosition(ctx, draftID, detailedPosID)
}
```

- [ ] **Step 6: Write pick.go**

`internal/usecase/draft/pick.go`:
```go
package draftusecase

import (
	"context"
	"fmt"
	"time"

	"github.com/draft-football-api/internal/domain"
	"github.com/draft-football-api/internal/domain/draft"
	"github.com/google/uuid"
)

func (uc *useCase) Pick(ctx context.Context, draftID, userID, playerID uuid.UUID, slotPosition int) (*draft.Draft, error) {
	d, err := uc.repo.FindByID(ctx, draftID)
	if err != nil {
		return nil, err
	}
	if d.UserID != userID {
		return nil, draft.ErrNotOwner
	}
	if d.Status != draft.StatusDrafting && d.Status != draft.StatusBenchDrafting {
		return nil, draft.ErrWrongStatus
	}

	pickCount, err := uc.repo.CountPicksByDraftID(ctx, draftID)
	if err != nil {
		return nil, fmt.Errorf("counting picks: %w", err)
	}

	// Resolve detailed_position_id for this slot
	var detailedPosID int
	if slotPosition > draft.StarterSlotCount {
		posIDs := draft.BenchSlotPositions[slotPosition]
		// Use the player's actual detailed_position_id (validated by query below)
		options, err := uc.repo.GetOptionsByPositionIDs(ctx, draftID, posIDs)
		if err != nil {
			return nil, err
		}
		for _, p := range options {
			if p.ID == playerID {
				detailedPosID = p.DetailedPositionID
				break
			}
		}
		if detailedPosID == 0 {
			return nil, draft.ErrPlayerNotInOptions
		}
	} else {
		f, err := uc.formationRepo.FindByName(ctx, d.Formation)
		if err != nil {
			return nil, err
		}
		detailedPosID = f.Slots[slotPosition-1].DetailedPositionID
	}

	pick := &draft.Pick{
		ID:                 uuid.New(),
		DraftID:            draftID,
		PlayerID:           playerID,
		SlotPosition:       slotPosition,
		DetailedPositionID: detailedPosID,
		OverallPick:        pickCount + 1,
		PickedAt:           time.Now(),
	}

	if err := uc.repo.CreatePick(ctx, pick); err != nil {
		if err == domain.ErrAlreadyExists {
			return nil, draft.ErrSlotAlreadyFilled
		}
		return nil, fmt.Errorf("saving pick: %w", err)
	}

	// Advance status when all starters are done
	if d.Status == draft.StatusDrafting && pickCount+1 == draft.StarterSlotCount {
		if err := uc.repo.UpdateStatus(ctx, draftID, draft.StatusBenchDrafting); err != nil {
			return nil, err
		}
		d.Status = draft.StatusBenchDrafting
	}

	// Advance to captain_pick when all bench slots are done (11 starters + 5 bench = 16)
	totalSlots := draft.StarterSlotCount + len(draft.BenchSlotPositions)
	if d.Status == draft.StatusBenchDrafting && pickCount+1 == totalSlots {
		if err := uc.repo.UpdateStatus(ctx, draftID, draft.StatusCaptainPick); err != nil {
			return nil, err
		}
		d.Status = draft.StatusCaptainPick
	}

	return d, nil
}
```

- [ ] **Step 7: Write captain.go**

`internal/usecase/draft/captain.go`:
```go
package draftusecase

import (
	"context"

	"github.com/draft-football-api/internal/domain/draft"
	"github.com/google/uuid"
)

func (uc *useCase) SetCaptain(ctx context.Context, draftID, userID, playerID uuid.UUID) (*draft.Draft, error) {
	d, err := uc.repo.FindByID(ctx, draftID)
	if err != nil {
		return nil, err
	}
	if d.UserID != userID {
		return nil, draft.ErrNotOwner
	}
	if d.Status != draft.StatusCaptainPick {
		return nil, draft.ErrWrongStatus
	}
	// Verify player is a starter pick (slot 1-11) in this draft
	picks, err := uc.repo.FindPicksByDraftID(ctx, draftID)
	if err != nil {
		return nil, err
	}
	isStarter := false
	for _, p := range picks {
		if p.PlayerID == playerID && p.SlotPosition <= draft.StarterSlotCount {
			isStarter = true
			break
		}
	}
	if !isStarter {
		return nil, draft.ErrPlayerNotInOptions
	}
	if err := uc.repo.UpdateCaptain(ctx, draftID, playerID); err != nil {
		return nil, err
	}
	d.CaptainPlayerID = &playerID
	d.Status = draft.StatusComplete
	return d, nil
}
```

- [ ] **Step 8: Write list.go**

`internal/usecase/draft/list.go`:
```go
package draftusecase

import (
	"context"

	"github.com/draft-football-api/internal/domain/draft"
	"github.com/google/uuid"
)

func (uc *useCase) ListActive(ctx context.Context, userID uuid.UUID) ([]draft.Draft, error) {
	return uc.repo.FindActiveByUserID(ctx, userID)
}

func (uc *useCase) ListComplete(ctx context.Context, userID uuid.UUID) ([]draft.Draft, error) {
	return uc.repo.FindCompleteByUserID(ctx, userID)
}

func (uc *useCase) GetPoolStats(ctx context.Context) (map[int]int, error) {
	return uc.repo.GetPoolStatsByPosition(ctx)
}
```

- [ ] **Step 9: Write config.go**

`internal/usecase/draft/config.go`:
```go
package draftusecase

import (
	"context"

	"github.com/google/uuid"
)

func (uc *useCase) SetActiveRound(ctx context.Context, roundID uuid.UUID) error {
	return uc.repo.SetActiveRoundID(ctx, roundID)
}
```

- [ ] **Step 10: Verify compilation**

```bash
go build ./internal/usecase/draft/...
```

Expected: no errors

- [ ] **Step 11: Commit**

```bash
git add internal/usecase/draft/
git commit -m "feat: add draft usecase"
```

---

### Task 6: Draft + Formation controllers

**Files:**
- Create: `internal/controller/formation/dto.go`
- Create: `internal/controller/formation/handler.go`
- Create: `internal/controller/draft/dto.go`
- Create: `internal/controller/draft/handler.go`

- [ ] **Step 1: Write formation controller**

`internal/controller/formation/dto.go`:
```go
package formationcontroller

type SlotResponse struct {
	Position           int    `json:"position"`
	DetailedPositionID int    `json:"detailed_position_id"`
}

type FormationResponse struct {
	Name  string         `json:"name"`
	Slots []SlotResponse `json:"slots"`
}
```

`internal/controller/formation/handler.go`:
```go
package formationcontroller

import (
	"net/http"

	"github.com/draft-football-api/internal/domain/formation"
	"github.com/gin-gonic/gin"
)

type Handler struct {
	repo formation.Repository
}

func NewHandler(repo formation.Repository) *Handler {
	return &Handler{repo: repo}
}

func (h *Handler) RegisterRoutes(rg *gin.RouterGroup, authMiddleware gin.HandlerFunc) {
	rg.GET("/formations", authMiddleware, h.List)
}

func (h *Handler) List(c *gin.Context) {
	formations, err := h.repo.FindAll(c.Request.Context())
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "internal server error"})
		return
	}
	data := make([]FormationResponse, len(formations))
	for i, f := range formations {
		slots := make([]SlotResponse, len(f.Slots))
		for j, s := range f.Slots {
			slots[j] = SlotResponse{Position: s.Position, DetailedPositionID: s.DetailedPositionID}
		}
		data[i] = FormationResponse{Name: f.Name, Slots: slots}
	}
	c.JSON(http.StatusOK, gin.H{"data": data})
}
```

- [ ] **Step 2: Write draft controller DTOs**

`internal/controller/draft/dto.go`:
```go
package draftcontroller

import (
	"time"

	"github.com/google/uuid"
)

// requests

type CreateDraftRequest struct{}

type SetFormationRequest struct {
	Formation string `json:"formation" validate:"required"`
}

type PickRequest struct {
	PlayerID     uuid.UUID `json:"player_id"     validate:"required"`
	SlotPosition int       `json:"slot_position" validate:"required,min=1,max=16"`
}

type CaptainRequest struct {
	PlayerID uuid.UUID `json:"player_id" validate:"required"`
}

// responses

type DraftResponse struct {
	ID              uuid.UUID   `json:"id"`
	RoundID         uuid.UUID   `json:"round_id"`
	Formation       string      `json:"formation"`
	Status          string      `json:"status"`
	CaptainPlayerID *uuid.UUID  `json:"captain_player_id"`
	Picks           []PickResponse `json:"picks"`
	CreatedAt       time.Time   `json:"created_at"`
	UpdatedAt       time.Time   `json:"updated_at"`
}

type PickResponse struct {
	SlotPosition       int       `json:"slot_position"`
	PlayerID           uuid.UUID `json:"player_id"`
	DetailedPositionID int       `json:"detailed_position_id"`
	OverallPick        int       `json:"overall_pick"`
}

type PoolPlayerResponse struct {
	ID                 uuid.UUID `json:"id"`
	Name               string    `json:"name"`
	DisplayName        string    `json:"display_name"`
	PositionID         int       `json:"position_id"`
	DetailedPositionID int       `json:"detailed_position_id"`
	TeamShortCode      string    `json:"team_short_code"`
	TeamLogoURL        string    `json:"team_logo_url"`
}

type DraftSummaryResponse struct {
	ID        uuid.UUID `json:"id"`
	RoundID   uuid.UUID `json:"round_id"`
	Formation string    `json:"formation"`
	Status    string    `json:"status"`
	CreatedAt time.Time `json:"created_at"`
	UpdatedAt time.Time `json:"updated_at"`
}
```

- [ ] **Step 3: Write draft controller handler**

`internal/controller/draft/handler.go`:
```go
package draftcontroller

import (
	"errors"
	"net/http"
	"strconv"

	"github.com/draft-football-api/internal/domain/draft"
	"github.com/draft-football-api/internal/middleware"
	draftusecase "github.com/draft-football-api/internal/usecase/draft"
	"github.com/gin-gonic/gin"
	"github.com/go-playground/validator/v10"
	"github.com/google/uuid"
)

type Handler struct {
	uc       draft.UseCase
	validate *validator.Validate
}

func NewHandler(uc draft.UseCase) *Handler {
	return &Handler{uc: uc, validate: validator.New()}
}

func (h *Handler) RegisterRoutes(rg *gin.RouterGroup, authMiddleware gin.HandlerFunc) {
	g := rg.Group("/drafts")
	g.Use(authMiddleware)
	g.POST("", h.Create)
	g.GET("/active", h.ListActive)
	g.GET("/history", h.ListComplete)
	g.GET("/pool-stats", h.PoolStats)
	g.GET("/:id", h.Get)
	g.POST("/:id/formation", h.SetFormation)
	g.GET("/:id/slots/:slot/options", h.GetOptions)
	g.POST("/:id/picks", h.Pick)
	g.POST("/:id/captain", h.SetCaptain)
}

func (h *Handler) Create(c *gin.Context) {
	userID, ok := middleware.GetUserID(c)
	if !ok {
		c.JSON(http.StatusUnauthorized, gin.H{"error": "unauthorized"})
		return
	}
	d, err := h.uc.Create(c.Request.Context(), userID)
	if err != nil {
		switch {
		case errors.Is(err, draft.ErrNoActiveRound):
			c.JSON(http.StatusConflict, gin.H{"error": err.Error()})
		case errors.Is(err, draft.ErrAlreadyDrafted):
			c.JSON(http.StatusConflict, gin.H{"error": err.Error()})
		default:
			c.JSON(http.StatusInternalServerError, gin.H{"error": "internal server error"})
		}
		return
	}
	c.JSON(http.StatusCreated, toDraftResponse(d, nil))
}

func (h *Handler) Get(c *gin.Context) {
	userID, ok := middleware.GetUserID(c)
	if !ok {
		c.JSON(http.StatusUnauthorized, gin.H{"error": "unauthorized"})
		return
	}
	draftID, err := uuid.Parse(c.Param("id"))
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "invalid draft id"})
		return
	}
	d, picks, err := h.uc.GetByID(c.Request.Context(), draftID, userID)
	if err != nil {
		h.handleDraftError(c, err)
		return
	}
	c.JSON(http.StatusOK, toDraftResponse(d, picks))
}

func (h *Handler) SetFormation(c *gin.Context) {
	userID, ok := middleware.GetUserID(c)
	if !ok {
		c.JSON(http.StatusUnauthorized, gin.H{"error": "unauthorized"})
		return
	}
	draftID, err := uuid.Parse(c.Param("id"))
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "invalid draft id"})
		return
	}
	var req SetFormationRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}
	if err := h.validate.Struct(req); err != nil {
		c.JSON(http.StatusUnprocessableEntity, gin.H{"error": err.Error()})
		return
	}
	d, err := h.uc.SetFormation(c.Request.Context(), draftID, userID, req.Formation)
	if err != nil {
		h.handleDraftError(c, err)
		return
	}
	c.JSON(http.StatusOK, toDraftResponse(d, nil))
}

func (h *Handler) GetOptions(c *gin.Context) {
	userID, ok := middleware.GetUserID(c)
	if !ok {
		c.JSON(http.StatusUnauthorized, gin.H{"error": "unauthorized"})
		return
	}
	draftID, err := uuid.Parse(c.Param("id"))
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "invalid draft id"})
		return
	}
	slot, err := strconv.Atoi(c.Param("slot"))
	if err != nil || slot < 1 || slot > 16 {
		c.JSON(http.StatusBadRequest, gin.H{"error": "invalid slot"})
		return
	}
	players, err := h.uc.GetSlotOptions(c.Request.Context(), draftID, userID, slot)
	if err != nil {
		h.handleDraftError(c, err)
		return
	}
	data := make([]PoolPlayerResponse, len(players))
	for i, p := range players {
		data[i] = PoolPlayerResponse{
			ID: p.ID, Name: p.Name, DisplayName: p.DisplayName,
			PositionID: p.PositionID, DetailedPositionID: p.DetailedPositionID,
			TeamShortCode: p.TeamShortCode, TeamLogoURL: p.TeamLogoURL,
		}
	}
	c.JSON(http.StatusOK, gin.H{"options": data})
}

func (h *Handler) Pick(c *gin.Context) {
	userID, ok := middleware.GetUserID(c)
	if !ok {
		c.JSON(http.StatusUnauthorized, gin.H{"error": "unauthorized"})
		return
	}
	draftID, err := uuid.Parse(c.Param("id"))
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "invalid draft id"})
		return
	}
	var req PickRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}
	if err := h.validate.Struct(req); err != nil {
		c.JSON(http.StatusUnprocessableEntity, gin.H{"error": err.Error()})
		return
	}
	d, err := h.uc.Pick(c.Request.Context(), draftID, userID, req.PlayerID, req.SlotPosition)
	if err != nil {
		h.handleDraftError(c, err)
		return
	}
	picks, _ := h.uc.GetByID(c.Request.Context(), draftID, userID)
	_ = picks
	c.JSON(http.StatusOK, toDraftResponse(d, nil))
}

func (h *Handler) SetCaptain(c *gin.Context) {
	userID, ok := middleware.GetUserID(c)
	if !ok {
		c.JSON(http.StatusUnauthorized, gin.H{"error": "unauthorized"})
		return
	}
	draftID, err := uuid.Parse(c.Param("id"))
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "invalid draft id"})
		return
	}
	var req CaptainRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}
	d, err := h.uc.SetCaptain(c.Request.Context(), draftID, userID, req.PlayerID)
	if err != nil {
		h.handleDraftError(c, err)
		return
	}
	c.JSON(http.StatusOK, toDraftResponse(d, nil))
}

func (h *Handler) ListActive(c *gin.Context) {
	userID, ok := middleware.GetUserID(c)
	if !ok {
		c.JSON(http.StatusUnauthorized, gin.H{"error": "unauthorized"})
		return
	}
	drafts, err := h.uc.ListActive(c.Request.Context(), userID)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "internal server error"})
		return
	}
	data := make([]DraftSummaryResponse, len(drafts))
	for i, d := range drafts {
		data[i] = toSummaryResponse(&d)
	}
	c.JSON(http.StatusOK, gin.H{"drafts": data})
}

func (h *Handler) ListComplete(c *gin.Context) {
	userID, ok := middleware.GetUserID(c)
	if !ok {
		c.JSON(http.StatusUnauthorized, gin.H{"error": "unauthorized"})
		return
	}
	drafts, err := h.uc.ListComplete(c.Request.Context(), userID)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "internal server error"})
		return
	}
	data := make([]DraftSummaryResponse, len(drafts))
	for i, d := range drafts {
		data[i] = toSummaryResponse(&d)
	}
	c.JSON(http.StatusOK, gin.H{"drafts": data})
}

func (h *Handler) PoolStats(c *gin.Context) {
	stats, err := h.uc.GetPoolStats(c.Request.Context())
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "internal server error"})
		return
	}
	c.JSON(http.StatusOK, gin.H{"stats": stats})
}

// helpers

func (h *Handler) handleDraftError(c *gin.Context, err error) {
	switch {
	case errors.Is(err, draft.ErrNotOwner):
		c.JSON(http.StatusForbidden, gin.H{"error": err.Error()})
	case errors.Is(err, draft.ErrWrongStatus), errors.Is(err, draft.ErrSlotAlreadyFilled),
		errors.Is(err, draft.ErrPlayerNotInOptions):
		c.JSON(http.StatusConflict, gin.H{"error": err.Error()})
	default:
		c.JSON(http.StatusInternalServerError, gin.H{"error": "internal server error"})
	}
}

// Fix the Pick handler — it has an unused variable, replace with proper response
func toDraftResponse(d *draft.Draft, picks []draftusecase.Pick) DraftResponse {
	var pr []PickResponse
	for _, p := range picks {
		pr = append(pr, PickResponse{
			SlotPosition: p.SlotPosition, PlayerID: p.PlayerID,
			DetailedPositionID: p.DetailedPositionID, OverallPick: p.OverallPick,
		})
	}
	if pr == nil {
		pr = []PickResponse{}
	}
	return DraftResponse{
		ID: d.ID, RoundID: d.RoundID, Formation: d.Formation,
		Status: string(d.Status), CaptainPlayerID: d.CaptainPlayerID,
		Picks: pr, CreatedAt: d.CreatedAt, UpdatedAt: d.UpdatedAt,
	}
}

func toSummaryResponse(d *draft.Draft) DraftSummaryResponse {
	return DraftSummaryResponse{
		ID: d.ID, RoundID: d.RoundID, Formation: d.Formation,
		Status: string(d.Status), CreatedAt: d.CreatedAt, UpdatedAt: d.UpdatedAt,
	}
}
```

> **Note:** The `toDraftResponse` function references `draftusecase.Pick` — fix the import. The type is `draft.Pick`, not `draftusecase.Pick`. Replace the function signature:

```go
func toDraftResponse(d *draft.Draft, picks []draft.Pick) DraftResponse {
```

And remove the `draftusecase` import from the file.

- [ ] **Step 4: Verify compilation**

```bash
go build ./internal/controller/...
```

Expected: no errors

- [ ] **Step 5: Commit**

```bash
git add internal/controller/formation/ internal/controller/draft/
git commit -m "feat: add formation and draft controllers"
```

---

### Task 7: Wire up + admin config + /users/me

**Files:**
- Modify: `internal/controller/admin/dto.go`
- Modify: `internal/controller/admin/handler.go`
- Modify: `internal/controller/user/handler.go`
- Modify: `cmd/api/main.go`

- [ ] **Step 1: Add SetActiveRound to admin controller**

In `internal/controller/admin/dto.go`, add at the end:
```go
type SetActiveRoundRequest struct {
	RoundID uuid.UUID `json:"round_id" validate:"required"`
}
```

In `internal/controller/admin/handler.go`:

Add `draftRepo` field and import to the Handler struct. First read the file, then apply changes:

Add field to Handler:
```go
type Handler struct {
	seasonRepo     season.Repository
	roundRepo      round.Repository
	teamRepo       team.Repository
	playerRepo     player.Repository
	statWeightRepo stat_weight.Repository
	draftRepo      draftdomain.Repository  // add this
}
```

Add import: `draftdomain "github.com/draft-football-api/internal/domain/draft"`

Add to `NewHandler` params: `draftRepo draftdomain.Repository`

Add to constructor body: `draftRepo: draftRepo,`

Add route in `RegisterRoutes`:
```go
admin.PUT("/config/active-round", h.SetActiveRound)
```

Add handler method:
```go
func (h *Handler) SetActiveRound(c *gin.Context) {
	var req SetActiveRoundRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}
	if err := h.draftRepo.SetActiveRoundID(c.Request.Context(), req.RoundID); err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "internal server error"})
		return
	}
	c.JSON(http.StatusOK, gin.H{"ok": true})
}
```

- [ ] **Step 2: Add GET /users/me to user controller**

In `internal/controller/user/handler.go`, add to `RegisterRoutes` protected group:
```go
protected.GET("/me", h.Me)
```

Add handler method:
```go
func (h *Handler) Me(c *gin.Context) {
	userID, ok := middleware.GetUserID(c)
	if !ok {
		c.JSON(http.StatusUnauthorized, gin.H{"error": "unauthorized"})
		return
	}
	u, err := h.uc.FindByID(c.Request.Context(), userID)
	if err != nil {
		c.JSON(http.StatusNotFound, gin.H{"error": "user not found"})
		return
	}
	c.JSON(http.StatusOK, gin.H{"user": toResponse(u)})
}
```

Add import if missing: `"github.com/draft-football-api/internal/middleware"`

- [ ] **Step 3: Wire everything in main.go**

In `cmd/api/main.go`, add after existing repo declarations:

```go
formationRepo := postgres.NewFormationRepository(db)
draftRepo := postgres.NewDraftRepository(db)
```

Add after existing use case declarations:
```go
draftUC := draftusecase.New(draftRepo, formationRepo)
```

Add import: `draftusecase "github.com/draft-football-api/internal/usecase/draft"`

Update admin handler constructor call:
```go
adminHandler := admincontroller.NewHandler(seasonRepo, roundRepo, teamRepo, playerRepo, statWeightRepo, draftRepo)
```

Add new handlers:
```go
formationHandler := formationcontroller.NewHandler(formationRepo)
draftHandler := draftcontroller.NewHandler(draftUC)
```

Add imports:
```go
draftcontroller "github.com/draft-football-api/internal/controller/draft"
formationcontroller "github.com/draft-football-api/internal/controller/formation"
```

Register routes (after existing route registrations):
```go
formationHandler.RegisterRoutes(v1, middleware.Auth(cfg.JWT.Secret))
draftHandler.RegisterRoutes(v1, middleware.Auth(cfg.JWT.Secret))
```

- [ ] **Step 4: Build and verify**

```bash
go build ./...
```

Expected: no errors

- [ ] **Step 5: Smoke test with curl**

```bash
# Start the server first
go run ./cmd/api/main.go

# Login (use an existing user)
TOKEN=$(curl -s -X POST http://localhost:8080/api/v1/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"test@test.com","password":"password123"}' | jq -r .token)

# List formations
curl -s http://localhost:8080/api/v1/formations \
  -H "Authorization: Bearer $TOKEN" | jq .

# Set active round (get a round ID first)
ROUND_ID=$(curl -s "http://localhost:8080/api/v1/admin/rounds?season_id=<your-season-id>" \
  -H "Authorization: Bearer $TOKEN" | jq -r '.data[0].id')

curl -s -X PUT http://localhost:8080/api/v1/admin/config/active-round \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d "{\"round_id\": \"$ROUND_ID\"}" | jq .

# Create a draft
curl -s -X POST http://localhost:8080/api/v1/drafts \
  -H "Authorization: Bearer $TOKEN" | jq .
```

Expected: formations list, `{"ok":true}`, draft object with `status: "formation_pick"`

- [ ] **Step 6: Commit**

```bash
git add cmd/api/main.go internal/controller/admin/ internal/controller/user/
git commit -m "feat: wire draft+formation routes, add admin active-round and users/me endpoints"
```

---

## PART 2: Frontend — draft-football-app-2

---

### Task 8: Remove socket.io + update API paths + fix auth pages

**Files:**
- Modify: `package.json`
- Modify: `src/config.js`
- Delete: `src/socket.js`
- Modify: `src/pages/Login.jsx`
- Modify: `src/pages/Register.jsx`

- [ ] **Step 1: Remove socket.io-client**

```bash
cd C:/Users/pA/Desktop/draft-football-app-2
npm uninstall socket.io-client
```

Delete `src/socket.js`:
```bash
rm src/socket.js
```

- [ ] **Step 2: Update config.js**

Replace `src/config.js` entirely:
```js
export const API_URL = (import.meta.env.VITE_API_URL || '') + '/api/v1';
```

- [ ] **Step 3: Rewrite Login.jsx**

The new backend uses `email` + `password` (not `username` + `senha`). The response is `{ token, user: { id, name, email, is_admin } }`.

Replace `src/pages/Login.jsx`:
```jsx
import React, { useState } from 'react';
import { API_URL } from '../config.js';

export default function Login({ onLogin, onGoRegister, onGoForgot }) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!email.trim() || !password) return;
    setError('');
    setLoading(true);
    try {
      const res = await fetch(`${API_URL}/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: email.trim(), password }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error || 'Erro ao fazer login.');
        return;
      }
      localStorage.setItem('draft_token', data.token);
      onLogin(data.user);
    } catch {
      setError('Erro de conexão com o servidor.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex flex-col items-center justify-center p-4">
      <div className="w-full max-w-sm">
        <div className="text-center mb-8">
          <div className="text-6xl mb-4">⚽</div>
          <h1 className="text-3xl font-bold text-white mb-1">Draft Football</h1>
          <p className="text-gray-400 text-sm">Entre na sua conta para continuar</p>
        </div>
        <div className="card">
          <h2 className="text-lg font-semibold text-white mb-6">Login</h2>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-400 mb-1">Email</label>
              <input type="email" className="input-field" placeholder="seu@email.com"
                value={email} onChange={e => setEmail(e.target.value)} autoFocus />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-400 mb-1">Senha</label>
              <input type="password" className="input-field" placeholder="••••••••"
                value={password} onChange={e => setPassword(e.target.value)} />
            </div>
            {error && <p className="text-red-400 text-sm">{error}</p>}
            <button type="submit" disabled={loading} className="btn-primary w-full">
              {loading ? 'Entrando...' : 'Entrar'}
            </button>
          </form>
          <div className="mt-4 text-center space-y-2">
            <button onClick={onGoForgot} className="text-xs text-gray-600 hover:text-gray-400">
              Esqueci minha senha
            </button>
            <div>
              <button onClick={onGoRegister} className="text-xs text-gray-600 hover:text-draft-green">
                Criar conta
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
```

- [ ] **Step 4: Rewrite Register.jsx**

New user fields: `name`, `email`, `phone` (optional), `password`.

Replace `src/pages/Register.jsx`:
```jsx
import React, { useState } from 'react';
import { API_URL } from '../config.js';

export default function Register({ onLogin, onGoLogin }) {
  const [form, setForm] = useState({ name: '', email: '', phone: '', password: '', confirm: '' });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const set = (field) => (e) => setForm(f => ({ ...f, [field]: e.target.value }));

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    if (!form.name.trim() || !form.email.trim() || !form.password) {
      return setError('Nome, email e senha são obrigatórios.');
    }
    if (form.password !== form.confirm) return setError('As senhas não coincidem.');
    if (form.password.length < 8) return setError('Senha deve ter pelo menos 8 caracteres.');

    setLoading(true);
    try {
      const res = await fetch(`${API_URL}/users`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: form.name.trim(),
          email: form.email.trim(),
          phone: form.phone.trim() || undefined,
          password: form.password,
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error || 'Erro ao criar conta.');
        return;
      }
      // Auto-login after register
      const loginRes = await fetch(`${API_URL}/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: form.email.trim(), password: form.password }),
      });
      const loginData = await loginRes.json();
      if (loginRes.ok) {
        localStorage.setItem('draft_token', loginData.token);
        onLogin(loginData.user);
      } else {
        // Registration worked but email verification needed
        setError('Conta criada! Verifique seu email para ativar.');
      }
    } catch {
      setError('Erro de conexão.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex flex-col items-center justify-center p-4">
      <div className="w-full max-w-sm">
        <div className="text-center mb-8">
          <div className="text-6xl mb-4">⚽</div>
          <h1 className="text-3xl font-bold text-white mb-1">Draft Football</h1>
        </div>
        <div className="card">
          <h2 className="text-lg font-semibold text-white mb-6">Criar conta</h2>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-400 mb-1">Nome</label>
              <input type="text" className="input-field" placeholder="Seu nome"
                value={form.name} onChange={set('name')} />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-400 mb-1">Email</label>
              <input type="email" className="input-field" placeholder="seu@email.com"
                value={form.email} onChange={set('email')} />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-400 mb-1">Telefone (opcional)</label>
              <input type="tel" className="input-field" placeholder="+5511999999999"
                value={form.phone} onChange={set('phone')} />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-400 mb-1">Senha</label>
              <input type="password" className="input-field" placeholder="mínimo 8 caracteres"
                value={form.password} onChange={set('password')} />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-400 mb-1">Confirmar senha</label>
              <input type="password" className="input-field"
                value={form.confirm} onChange={set('confirm')} />
            </div>
            {error && <p className="text-red-400 text-sm">{error}</p>}
            <button type="submit" disabled={loading} className="btn-primary w-full">
              {loading ? 'Criando...' : 'Criar conta'}
            </button>
          </form>
          <div className="mt-4 text-center">
            <button onClick={onGoLogin} className="text-xs text-gray-600 hover:text-draft-green">
              Já tenho conta
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
```

- [ ] **Step 5: Verify Vite starts without socket.io errors**

```bash
npm run dev
```

Expected: no import errors for socket.js

- [ ] **Step 6: Commit**

```bash
git add package.json package-lock.json src/config.js src/pages/Login.jsx src/pages/Register.jsx
git rm src/socket.js
git commit -m "feat: remove socket.io, update auth pages for new user contract"
```

---

### Task 9: Rewrite App.jsx

**Files:**
- Modify: `src/App.jsx`
- Delete: `src/pages/Lobby.jsx`
- Delete: `src/components/SimDraft.jsx`
- Delete: `src/components/SimultaneousView.jsx`

- [ ] **Step 1: Remove unused component files**

```bash
git rm src/pages/Lobby.jsx
git rm src/components/SimDraft.jsx
git rm src/components/SimultaneousView.jsx
```

- [ ] **Step 2: Rewrite App.jsx**

Replace `src/App.jsx`:
```jsx
import React, { useState, useEffect } from 'react';
import { API_URL } from './config.js';
import Login from './pages/Login.jsx';
import Register from './pages/Register.jsx';
import ForgotPassword from './pages/ForgotPassword.jsx';
import Home from './pages/Home.jsx';
import Draft from './pages/Draft.jsx';
import EndScreen from './pages/EndScreen.jsx';
import Admin from './pages/Admin.jsx';

export default function App() {
  const [authPage, setAuthPage] = useState('login');
  const [user, setUser] = useState(null);
  const [page, setPage] = useState('home');
  const [draftId, setDraftId] = useState(null);
  const [error, setError] = useState(null);

  // Validate stored token on startup
  useEffect(() => {
    const token = localStorage.getItem('draft_token');
    if (!token) return;
    fetch(`${API_URL}/users/me`, { headers: { Authorization: `Bearer ${token}` } })
      .then(r => r.json())
      .then(data => {
        if (data.user) setUser(data.user);
        else localStorage.removeItem('draft_token');
      })
      .catch(() => localStorage.removeItem('draft_token'));
  }, []);

  const handleLogin = (userData) => {
    setUser(userData);
    setPage('home');
  };

  const handleLogout = () => {
    localStorage.removeItem('draft_token');
    setUser(null);
    setAuthPage('login');
    setPage('home');
    setDraftId(null);
  };

  const handleStartDraft = (id) => {
    setDraftId(id);
    setPage('draft');
  };

  const handleDraftComplete = (id) => {
    setDraftId(id);
    setPage('end');
  };

  if (!user) {
    return (
      <div className="min-h-screen">
        {authPage === 'login' && (
          <Login onLogin={handleLogin}
            onGoRegister={() => setAuthPage('register')}
            onGoForgot={() => setAuthPage('forgot')} />
        )}
        {authPage === 'register' && (
          <Register onLogin={handleLogin} onGoLogin={() => setAuthPage('login')} />
        )}
        {authPage === 'forgot' && (
          <ForgotPassword onGoLogin={() => setAuthPage('login')} />
        )}
      </div>
    );
  }

  return (
    <div className="min-h-screen">
      {error && (
        <div className="fixed top-4 left-1/2 -translate-x-1/2 z-50 bg-red-900 border border-red-600 text-red-100 px-6 py-3 rounded-lg shadow-lg">
          {error}
        </div>
      )}
      {page === 'home' && (
        <Home user={user} onLogout={handleLogout}
          onGoAdmin={() => setPage('admin')}
          onStartDraft={handleStartDraft} />
      )}
      {page === 'admin' && <Admin onBack={() => setPage('home')} />}
      {page === 'draft' && draftId && (
        <Draft draftId={draftId} user={user}
          onGoHome={() => setPage('home')}
          onComplete={handleDraftComplete} />
      )}
      {page === 'end' && draftId && (
        <EndScreen draftId={draftId} onGoHome={() => { setDraftId(null); setPage('home'); }} />
      )}
    </div>
  );
}
```

- [ ] **Step 3: Verify Vite starts**

```bash
npm run dev
```

Expected: app loads, login page shows, no console errors

- [ ] **Step 4: Commit**

```bash
git add src/App.jsx
git commit -m "feat: rewrite App.jsx for REST-only solo draft flow"
```

---

### Task 10: Rewrite PlayerCard + PlayerList

**Files:**
- Modify: `src/components/PlayerCard.jsx`
- Modify: `src/components/PlayerList.jsx`

- [ ] **Step 1: Define new player contract constants**

The new player from the API has:
```js
{ id, name, display_name, position_id (1-4), detailed_position_id (1-13),
  team_short_code, team_logo_url }
```

Position groupings:
- 1 = GOL (Goalkeeper)
- 2 = DEF (all defenders)
- 3 = MEI (all midfielders)
- 4 = ATA (all attackers)

Detailed position abbreviations:
```js
const DETAILED_LABELS = {
  1:'GOL', 2:'ZAG', 3:'LD', 4:'LE', 5:'VOL',
  6:'MEI', 7:'MAT', 8:'ME', 9:'MD', 10:'CA', 11:'PE', 12:'PD', 13:'2AT'
};
```

Position colors by basic position_id:
```js
const POS_COLORS = {
  1: { bg: 'bg-blue-600', glow: 'hover:shadow-blue-600/40' },
  2: { bg: 'bg-green-700', glow: 'hover:shadow-green-700/40' },
  3: { bg: 'bg-yellow-600', glow: 'hover:shadow-yellow-600/40' },
  4: { bg: 'bg-red-600', glow: 'hover:shadow-red-600/40' },
};
```

- [ ] **Step 2: Rewrite PlayerCard.jsx**

Replace `src/components/PlayerCard.jsx`:
```jsx
import React from 'react';

const DETAILED_LABELS = {
  1:'GOL', 2:'ZAG', 3:'LD', 4:'LE', 5:'VOL',
  6:'MEI', 7:'MAT', 8:'ME', 9:'MD', 10:'CA', 11:'PE', 12:'PD', 13:'2AT'
};

const POS_COLORS = {
  1: { bg: 'bg-blue-600', border: 'border-blue-500', btn: 'border-blue-500 bg-blue-900/60 hover:bg-blue-800/80', glow: 'hover:shadow-blue-600/40' },
  2: { bg: 'bg-green-700', border: 'border-green-600', btn: 'border-green-600 bg-green-900/60 hover:bg-green-800/80', glow: 'hover:shadow-green-700/40' },
  3: { bg: 'bg-yellow-600', border: 'border-yellow-500', btn: 'border-yellow-500 bg-yellow-900/60 hover:bg-yellow-800/80', glow: 'hover:shadow-yellow-600/40' },
  4: { bg: 'bg-red-600', border: 'border-red-500', btn: 'border-red-500 bg-red-900/60 hover:bg-red-800/80', glow: 'hover:shadow-red-600/40' },
};

const DEFAULT_COLORS = { bg: 'bg-gray-600', border: 'border-gray-500', btn: 'border-gray-500 bg-gray-800', glow: '' };

export default function PlayerCard({ player, onClick, isMyTurn, compact = false, card = false, isCaptain = false }) {
  const colors = POS_COLORS[player.position_id] || DEFAULT_COLORS;
  const posLabel = DETAILED_LABELS[player.detailed_position_id] || '?';
  const displayName = player.display_name || player.name;

  if (compact) {
    return (
      <button
        onClick={onClick}
        disabled={!isMyTurn}
        className={`w-full flex items-center gap-3 px-3 py-2 rounded-lg text-left transition-all ${
          isMyTurn ? 'hover:bg-gray-700 cursor-pointer active:scale-95' : 'opacity-60 cursor-default'
        }`}
      >
        <div className={`w-8 h-8 rounded-full ${colors.bg} overflow-hidden flex-shrink-0 flex items-center justify-center`}>
          {player.team_logo_url
            ? <img src={player.team_logo_url} alt={player.team_short_code} className="w-5 h-5 object-contain" />
            : <span className="text-white text-xs font-bold">{player.team_short_code?.slice(0,3) || '?'}</span>}
        </div>
        <div className="flex-1 min-w-0">
          <div className="font-medium text-sm text-white truncate">{displayName}</div>
          <div className="text-xs text-gray-400">{player.team_short_code || '—'}</div>
        </div>
        <span className={`${colors.bg} text-white text-xs font-bold px-1.5 py-0.5 rounded flex-shrink-0`}>
          {posLabel}
        </span>
      </button>
    );
  }

  if (card) {
    return (
      <button
        onClick={isMyTurn ? onClick : undefined}
        disabled={!isMyTurn}
        className={`w-40 flex-shrink-0 flex flex-col bg-gray-800 border rounded-xl overflow-hidden transition-all text-left
          ${isMyTurn
            ? `${colors.border} hover:border-draft-green hover:scale-105 hover:shadow-lg ${colors.glow} cursor-pointer active:scale-100`
            : 'border-gray-700 opacity-80 cursor-default'
          }`}
      >
        <div className="relative bg-gray-900 h-36 w-full overflow-hidden flex-shrink-0">
          <div className={`absolute top-0 left-0 right-0 h-1.5 z-10 ${colors.bg}`} />
          {player.team_logo_url
            ? <img src={player.team_logo_url} alt={player.team_short_code}
                className="absolute inset-0 w-full h-full object-contain p-6 opacity-20" />
            : null}
          <div className={`absolute bottom-0 left-0 right-0 z-20 ${colors.bg} text-white text-sm font-bold py-1 text-center`}>
            {posLabel}
          </div>
          {isCaptain && (
            <div className="absolute top-2 right-2 z-20 w-6 h-6 bg-black rounded-full flex items-center justify-center border-2 border-gray-300 shadow-lg">
              <span className="text-white text-xs font-black leading-none">C</span>
            </div>
          )}
        </div>
        <div className="flex flex-col p-2 gap-1.5 flex-1 items-center">
          <span className="font-extrabold text-white text-sm leading-tight line-clamp-2 text-center">
            {displayName}
          </span>
          <span className="text-xs text-gray-400">{player.team_short_code || '—'}</span>
        </div>
      </button>
    );
  }

  return (
    <button
      onClick={onClick}
      disabled={!isMyTurn}
      className={`card text-left w-full transition-all ${
        isMyTurn ? 'hover:border-draft-green hover:bg-gray-800 cursor-pointer active:scale-95' : 'opacity-50 cursor-default'
      }`}
    >
      <div className="flex items-center gap-3">
        <div className={`w-12 h-12 rounded-full ${colors.bg} overflow-hidden flex-shrink-0 flex items-center justify-center`}>
          {player.team_logo_url
            ? <img src={player.team_logo_url} alt={player.team_short_code} className="w-8 h-8 object-contain" />
            : <span className="text-white text-sm font-bold">{player.team_short_code?.slice(0,3) || '?'}</span>}
        </div>
        <div className="flex-1 min-w-0">
          <div className="font-semibold text-white truncate">{displayName}</div>
          <div className="text-sm text-gray-400">{player.team_short_code || '—'}</div>
        </div>
        <span className={`${colors.bg} text-white text-xs font-bold px-2 py-0.5 rounded`}>{posLabel}</span>
      </div>
    </button>
  );
}
```

- [ ] **Step 3: Rewrite PlayerList.jsx**

Replace `src/components/PlayerList.jsx`:
```jsx
import React, { useState, useMemo } from 'react';
import PlayerCard from './PlayerCard.jsx';

const POSITION_FILTERS = [
  { id: 0, label: 'Todos' },
  { id: 1, label: 'GOL' },
  { id: 2, label: 'DEF' },
  { id: 3, label: 'MEI' },
  { id: 4, label: 'ATA' },
];

export default function PlayerList({ players, pickedIds = new Set(), isMyTurn, onPick }) {
  const [search, setSearch] = useState('');
  const [posFilter, setPosFilter] = useState(0);

  const available = useMemo(() => {
    return players
      .filter(p => !pickedIds.has(p.id))
      .filter(p => posFilter === 0 || p.position_id === posFilter)
      .filter(p => {
        if (!search.trim()) return true;
        const q = search.toLowerCase();
        return (p.display_name || p.name)?.toLowerCase().includes(q) ||
               p.team_short_code?.toLowerCase().includes(q);
      });
  }, [players, pickedIds, posFilter, search]);

  return (
    <div className="flex flex-col h-full">
      <div className="mb-3">
        <input type="text" className="input-field text-sm" placeholder="Buscar jogador ou clube..."
          value={search} onChange={e => setSearch(e.target.value)} />
      </div>
      <div className="flex gap-1 mb-3 flex-wrap">
        {POSITION_FILTERS.map(({ id, label }) => (
          <button key={id} onClick={() => setPosFilter(id)}
            className={`px-2 py-1 rounded text-xs font-medium transition-colors ${
              posFilter === id ? 'bg-draft-green text-white' : 'bg-gray-800 text-gray-400 hover:bg-gray-700'
            }`}>{label}</button>
        ))}
      </div>
      <div className="text-xs text-gray-600 mb-2">{available.length} jogadores disponíveis</div>
      <div className="flex-1 overflow-y-auto space-y-0.5">
        {available.map(player => (
          <PlayerCard key={player.id} player={player} compact isMyTurn={isMyTurn}
            onClick={() => onPick(player.id)} />
        ))}
      </div>
    </div>
  );
}
```

- [ ] **Step 4: Commit**

```bash
git add src/components/PlayerCard.jsx src/components/PlayerList.jsx
git commit -m "feat: rewrite PlayerCard and PlayerList for SportMonks player contract"
```

---

### Task 11: Rewrite FormationPickerPhase + PickPanel

**Files:**
- Modify: `src/components/FormationPickerPhase.jsx`
- Modify: `src/components/PickPanel.jsx`

- [ ] **Step 1: Rewrite FormationPickerPhase.jsx**

Now loads formations from API instead of hardcoded list.

Replace `src/components/FormationPickerPhase.jsx`:
```jsx
import React, { useState, useEffect } from 'react';
import { API_URL } from '../config.js';

export default function FormationPickerPhase({ onPick }) {
  const [formations, setFormations] = useState([]);
  const [chosen, setChosen] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const token = localStorage.getItem('draft_token');
    fetch(`${API_URL}/formations`, { headers: { Authorization: `Bearer ${token}` } })
      .then(r => r.json())
      .then(data => setFormations(data.data || []))
      .finally(() => setLoading(false));
  }, []);

  const handlePick = (name) => {
    if (chosen) return;
    setChosen(name);
    onPick(name);
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <p className="text-gray-400 animate-pulse">Carregando formações...</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col items-center justify-center p-4">
      <div className="bg-gray-900 border border-gray-700 rounded-2xl p-6 w-full max-w-md space-y-5">
        <div className="text-center">
          <h2 className="text-xl font-bold text-white">Escolha sua Formação</h2>
          <p className="text-gray-400 text-sm mt-1">
            {chosen ? 'Formação escolhida!' : 'Selecione a formação do seu time'}
          </p>
        </div>
        <div className="space-y-2">
          {formations.map(f => {
            const isChosen = chosen === f.name;
            return (
              <button key={f.name} onClick={() => handlePick(f.name)}
                disabled={!!chosen}
                className={`w-full text-left px-4 py-3 rounded-lg border transition-all ${
                  isChosen
                    ? 'border-draft-green bg-draft-green/20 text-white'
                    : chosen
                      ? 'border-gray-700 text-gray-600 cursor-not-allowed'
                      : 'border-gray-700 hover:border-gray-500 text-gray-300 hover:text-white'
                }`}
              >
                <span className="font-mono font-bold text-lg">{f.name}</span>
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
}
```

- [ ] **Step 2: Rewrite PickPanel.jsx**

The new PickPanel only needs to show 5 player cards and let the user pick. No timer, no bench slot type picker (the parent Draft handles that), no socket events.

Replace `src/components/PickPanel.jsx`:
```jsx
import React from 'react';
import PlayerCard from './PlayerCard.jsx';

// Maps detailed_position_id → basic position_id (for color grouping)
const DETAILED_TO_BASIC = {
  1:1, 2:2, 3:2, 4:2, 5:3, 6:3, 7:3, 8:3, 9:3, 10:4, 11:4, 12:4, 13:4
};

const DETAILED_LABELS = {
  1:'GOL', 2:'ZAG', 3:'LD', 4:'LE', 5:'VOL',
  6:'MEI', 7:'MAT', 8:'ME', 9:'MD', 10:'CA', 11:'PE', 12:'PD', 13:'2AT'
};

const POS_COLORS = {
  1: 'border-blue-500 bg-blue-900/60 text-blue-300',
  2: 'border-green-600 bg-green-900/60 text-green-300',
  3: 'border-yellow-500 bg-yellow-900/60 text-yellow-300',
  4: 'border-red-500 bg-red-900/60 text-red-300',
};

export default function PickPanel({ options, slotDetailedPositionId, isCaptainPick = false, onPickPlayer, onClose }) {
  if (!options) return null;

  const basicPos = DETAILED_TO_BASIC[slotDetailedPositionId] || 1;
  const posLabel = isCaptainPick ? 'CAPITÃO' : (DETAILED_LABELS[slotDetailedPositionId] || '?');
  const badgeClass = isCaptainPick
    ? 'border-yellow-500 bg-yellow-900/30 text-yellow-300'
    : (POS_COLORS[basicPos] || POS_COLORS[1]);

  return (
    <div className="fixed inset-0 bg-black/80 z-50 overflow-y-auto">
      <div className="flex flex-col items-center justify-center min-h-full p-3 sm:p-4 gap-4 sm:gap-6">
        <div className="text-center">
          <span className={`border text-sm font-bold px-4 py-1.5 rounded-lg ${badgeClass}`}>
            {isCaptainPick ? '👑 CAPITÃO' : posLabel}
          </span>
          <p className="text-draft-gold font-semibold mt-2">Escolha um jogador</p>
        </div>
        <div className="flex flex-nowrap gap-3 overflow-x-auto w-full pb-2 sm:flex-wrap sm:justify-center sm:overflow-x-visible">
          {options.map(player => (
            <PlayerCard
              key={player.id}
              player={player}
              card
              isMyTurn
              onClick={() => onPickPlayer(player.id)}
            />
          ))}
        </div>
        <button onClick={onClose}
          className="text-xs text-gray-600 hover:text-gray-400 border border-gray-700 px-4 py-2 rounded-lg">
          ← Voltar
        </button>
      </div>
    </div>
  );
}
```

- [ ] **Step 3: Commit**

```bash
git add src/components/FormationPickerPhase.jsx src/components/PickPanel.jsx
git commit -m "feat: rewrite FormationPickerPhase (API-loaded) and PickPanel (solo REST)"
```

---

### Task 12: Rewrite Draft.jsx

**Files:**
- Modify: `src/pages/Draft.jsx`

- [ ] **Step 1: Write new Draft.jsx**

The new Draft.jsx manages the entire solo draft flow via REST. It receives `draftId`, loads the draft from the API, and handles all pick interactions.

Replace `src/pages/Draft.jsx`:
```jsx
import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { API_URL } from '../config.js';
import FormationPickerPhase from '../components/FormationPickerPhase.jsx';
import PickPanel from '../components/PickPanel.jsx';
import TeamSlots from '../components/TeamSlots.jsx';
import Timer from '../components/Timer.jsx';

// Maps detailed_position_id → basic position_id
const DETAILED_TO_BASIC = {
  1:1, 2:2, 3:2, 4:2, 5:3, 6:3, 7:3, 8:3, 9:3, 10:4, 11:4, 12:4, 13:4
};

const DETAILED_LABELS = {
  1:'GOL', 2:'ZAG', 3:'LD', 4:'LE', 5:'VOL',
  6:'MEI', 7:'MAT', 8:'ME', 9:'MD', 10:'CA', 11:'PE', 12:'PD', 13:'2AT'
};

// Bench slot definitions
const BENCH_SLOTS = [
  { slot: 12, label: 'DEF RES 1', sub: 'Defensor' },
  { slot: 13, label: 'DEF RES 2', sub: 'Defensor' },
  { slot: 14, label: 'M/A RES 1', sub: 'Meia ou Atacante' },
  { slot: 15, label: 'M/A RES 2', sub: 'Meia ou Atacante' },
  { slot: 16, label: 'M/A RES 3', sub: 'Meia ou Atacante' },
];

function authFetch(url, options = {}) {
  const token = localStorage.getItem('draft_token');
  return fetch(url, {
    ...options,
    headers: {
      Authorization: `Bearer ${token}`,
      'Content-Type': 'application/json',
      ...options.headers,
    },
  });
}

export default function Draft({ draftId, user, onGoHome, onComplete }) {
  const [draft, setDraft] = useState(null);
  const [formations, setFormations] = useState(null); // { name, slots: [{position, detailed_position_id}] }
  const [options, setOptions] = useState(null);       // 5 players for current slot
  const [activeSlot, setActiveSlot] = useState(null); // slot number being picked
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  // Map slotPosition → pick for quick lookup
  const picksBySlot = useMemo(() => {
    const map = {};
    for (const p of draft?.picks || []) {
      map[p.slot_position] = p;
    }
    return map;
  }, [draft]);

  // Formation slots indexed 1-11
  const formationSlots = useMemo(() => {
    if (!formations || !draft?.formation) return [];
    const f = formations.find(f => f.name === draft.formation);
    return f ? f.slots : [];
  }, [formations, draft]);

  const loadDraft = useCallback(async () => {
    try {
      const res = await authFetch(`${API_URL}/drafts/${draftId}`);
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      setDraft(data);
      if (data.status === 'complete') onComplete(draftId);
    } catch (e) {
      setError(e.message);
    }
  }, [draftId, onComplete]);

  const loadFormations = useCallback(async () => {
    try {
      const res = await authFetch(`${API_URL}/formations`);
      const data = await res.json();
      setFormations(data.data || []);
    } catch {}
  }, []);

  useEffect(() => {
    loadDraft();
    loadFormations();
  }, [loadDraft, loadFormations]);

  const handleSetFormation = async (formationName) => {
    setLoading(true);
    try {
      const res = await authFetch(`${API_URL}/drafts/${draftId}/formation`, {
        method: 'POST',
        body: JSON.stringify({ formation: formationName }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      await loadDraft();
    } catch (e) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  };

  const handleSlotClick = async (slotPosition) => {
    if (picksBySlot[slotPosition]) return; // already filled
    setActiveSlot(slotPosition);
    setLoading(true);
    try {
      const res = await authFetch(`${API_URL}/drafts/${draftId}/slots/${slotPosition}/options`);
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      setOptions(data.options || []);
    } catch (e) {
      setError(e.message);
      setActiveSlot(null);
    } finally {
      setLoading(false);
    }
  };

  const handlePickPlayer = async (playerId) => {
    setLoading(true);
    try {
      const res = await authFetch(`${API_URL}/drafts/${draftId}/picks`, {
        method: 'POST',
        body: JSON.stringify({ player_id: playerId, slot_position: activeSlot }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      setOptions(null);
      setActiveSlot(null);
      await loadDraft();
    } catch (e) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  };

  const handleCaptain = async (playerId) => {
    setLoading(true);
    try {
      const res = await authFetch(`${API_URL}/drafts/${draftId}/captain`, {
        method: 'POST',
        body: JSON.stringify({ player_id: playerId }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      await loadDraft();
    } catch (e) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  };

  if (!draft) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin text-4xl mb-4">⚽</div>
          <p className="text-gray-400">Carregando draft...</p>
        </div>
      </div>
    );
  }

  // Formation pick phase
  if (draft.status === 'formation_pick') {
    return <FormationPickerPhase onPick={handleSetFormation} />;
  }

  // Captain pick phase — show starters as selectable cards
  if (draft.status === 'captain_pick') {
    const starterPicks = (draft.picks || []).filter(p => p.slot_position <= 11);
    return (
      <div className="min-h-screen flex flex-col items-center justify-center p-4">
        <div className="w-full max-w-2xl">
          <h2 className="text-xl font-bold text-white text-center mb-2">Escolha seu Capitão</h2>
          <p className="text-gray-400 text-sm text-center mb-6">
            O capitão multiplica sua pontuação
          </p>
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
            {starterPicks.map(pick => {
              const posLabel = DETAILED_LABELS[pick.detailed_position_id] || '?';
              return (
                <button key={pick.slot_position}
                  onClick={() => handleCaptain(pick.player_id)}
                  className="bg-gray-800 border border-gray-700 hover:border-draft-gold hover:bg-gray-700 rounded-xl p-3 text-left transition-all">
                  <div className="text-xs text-gray-500 mb-1">Slot {pick.slot_position} · {posLabel}</div>
                  <div className="text-sm font-semibold text-white truncate">{pick.player_id.slice(0,8)}…</div>
                </button>
              );
            })}
          </div>
        </div>
        {error && <p className="text-red-400 text-sm mt-4 text-center">{error}</p>}
      </div>
    );
  }

  // Main drafting / bench drafting
  const isBenchPhase = draft.status === 'bench_drafting';
  const starterSlots = formationSlots; // 11 items

  return (
    <div className="min-h-screen flex flex-col p-4 max-w-2xl mx-auto">
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <button onClick={onGoHome} className="text-xs text-gray-600 hover:text-white">← Sair</button>
        <span className="text-xs text-gray-500 font-mono uppercase">
          {isBenchPhase ? 'Reservas' : 'Titulares'} · {draft.formation}
        </span>
        <span className="text-xs text-gray-600">{(draft.picks || []).length}/16 picks</span>
      </div>

      {error && (
        <div className="mb-4 bg-red-900/30 border border-red-700 text-red-300 text-sm rounded-lg px-4 py-2">
          {error}
        </div>
      )}

      {loading && (
        <div className="text-center text-gray-500 text-sm py-4 animate-pulse">Carregando...</div>
      )}

      {/* Starter slots — field layout */}
      {!isBenchPhase && (
        <div className="bg-green-950/40 border border-green-900/30 rounded-2xl p-3 mb-4">
          <div className="flex flex-col gap-2">
            {/* Group slots by row: ATA (pos 4), MEI (pos 3), DEF (pos 2), GOL (pos 1) */}
            {[4, 3, 2, 1].map(basicPos => {
              const rowSlots = starterSlots.filter(s =>
                DETAILED_TO_BASIC[s.detailed_position_id] === basicPos
              );
              if (rowSlots.length === 0) return null;
              return (
                <div key={basicPos} className="flex gap-2 justify-center">
                  {rowSlots.map(s => {
                    const pick = picksBySlot[s.position];
                    const posLabel = DETAILED_LABELS[s.detailed_position_id] || '?';
                    if (pick) {
                      return (
                        <div key={s.position}
                          className="w-16 h-20 sm:w-20 sm:h-24 flex flex-col bg-gray-800 border border-gray-600 rounded-xl overflow-hidden items-center justify-center p-1">
                          <span className="text-xs font-bold text-gray-300">{posLabel}</span>
                          <span className="text-[10px] text-gray-400 text-center truncate w-full mt-1">
                            {pick.player_id.slice(0,8)}
                          </span>
                        </div>
                      );
                    }
                    return (
                      <button key={s.position}
                        onClick={() => handleSlotClick(s.position)}
                        className="w-16 h-20 sm:w-20 sm:h-24 flex flex-col items-center justify-center rounded-xl border-2 border-dashed border-gray-600 hover:border-draft-green hover:bg-draft-green/10 transition-all">
                        <span className="text-xs font-bold text-gray-400">{posLabel}</span>
                        <span className="text-[10px] text-gray-600 mt-1">+</span>
                      </button>
                    );
                  })}
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Bench slots */}
      {isBenchPhase && (
        <div className="mb-4">
          <p className="text-sm font-semibold text-white mb-3">Reservas</p>
          <div className="flex flex-col gap-2 sm:flex-row sm:flex-wrap">
            {BENCH_SLOTS.map(({ slot, label, sub }) => {
              const pick = picksBySlot[slot];
              if (pick) {
                return (
                  <div key={slot} className="flex-1 min-w-[120px] bg-gray-800 border border-gray-600 rounded-xl p-3">
                    <div className="text-xs text-gray-500 mb-1">{label}</div>
                    <div className="text-xs text-gray-300 truncate">{pick.player_id.slice(0,8)}…</div>
                  </div>
                );
              }
              return (
                <button key={slot}
                  onClick={() => handleSlotClick(slot)}
                  className="flex-1 min-w-[120px] border-2 border-dashed border-gray-600 hover:border-draft-green hover:bg-draft-green/10 rounded-xl p-3 transition-all text-left">
                  <div className="text-sm font-bold text-gray-300">{label}</div>
                  <div className="text-xs text-gray-500 mt-0.5">{sub}</div>
                </button>
              );
            })}
          </div>
        </div>
      )}

      {/* Player options overlay */}
      {options && (
        <PickPanel
          options={options}
          slotDetailedPositionId={
            activeSlot > 11
              ? null
              : (formationSlots[activeSlot - 1]?.detailed_position_id ?? null)
          }
          onPickPlayer={handlePickPlayer}
          onClose={() => { setOptions(null); setActiveSlot(null); }}
        />
      )}
    </div>
  );
}
```

> **Note:** The captain pick phase shows `pick.player_id` as raw UUID because player names aren't stored in the picks. Task 13 or a follow-up can improve the captain display by caching player data. This is intentional minimal scope.

- [ ] **Step 2: Commit**

```bash
git add src/pages/Draft.jsx
git commit -m "feat: rewrite Draft.jsx for solo REST draft flow"
```

---

### Task 13: Rewrite Home.jsx + update Admin.jsx + EndScreen

**Files:**
- Modify: `src/pages/Home.jsx`
- Modify: `src/pages/Admin.jsx`
- Modify: `src/pages/EndScreen.jsx`

- [ ] **Step 1: Rewrite Home.jsx**

Replace `src/pages/Home.jsx`:
```jsx
import React, { useState, useEffect } from 'react';
import { API_URL } from '../config.js';

function authFetch(url, options = {}) {
  const token = localStorage.getItem('draft_token');
  return fetch(url, {
    ...options,
    headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json', ...options.headers },
  });
}

export default function Home({ user, onLogout, onGoAdmin, onStartDraft }) {
  const [activeDrafts, setActiveDrafts] = useState([]);
  const [historyDrafts, setHistoryDrafts] = useState([]);
  const [creating, setCreating] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    authFetch(`${API_URL}/drafts/active`)
      .then(r => r.json())
      .then(data => { if (data.drafts) setActiveDrafts(data.drafts); })
      .catch(() => {});
    authFetch(`${API_URL}/drafts/history`)
      .then(r => r.json())
      .then(data => { if (data.drafts) setHistoryDrafts(data.drafts); })
      .catch(() => {});
  }, []);

  const handleCreateDraft = async () => {
    setCreating(true);
    setError(null);
    try {
      const res = await authFetch(`${API_URL}/drafts`, { method: 'POST' });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      onStartDraft(data.id);
    } catch (e) {
      setError(e.message);
    } finally {
      setCreating(false);
    }
  };

  const STATUS_LABELS = {
    formation_pick: 'Escolha de formação',
    drafting: 'Titulares',
    bench_drafting: 'Reservas',
    captain_pick: 'Capitão',
    complete: 'Finalizado',
  };

  return (
    <div className="min-h-screen flex flex-col items-center justify-center p-4">
      <div className="w-full max-w-md">
        <div className="text-center mb-10">
          <div className="text-6xl mb-4">⚽</div>
          <h1 className="text-4xl font-bold text-white mb-2">Draft Football</h1>
          <div className="flex items-center justify-center gap-3 mt-4">
            <span className="text-gray-400 text-sm">
              Olá, <span className="text-white font-medium">{user.name?.split(' ')[0]}</span>
              {user.is_admin && (
                <span className="ml-2 text-xs bg-draft-gold/20 text-draft-gold border border-draft-gold/30 px-2 py-0.5 rounded-full">
                  admin
                </span>
              )}
            </span>
            <button onClick={onLogout} className="text-xs text-gray-600 hover:text-red-400 transition-colors">
              Sair
            </button>
          </div>
        </div>

        {/* Active drafts */}
        {activeDrafts.length > 0 && (
          <div className="mb-4">
            <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2">Seus drafts ativos</p>
            <div className="space-y-2">
              {activeDrafts.map(draft => (
                <div key={draft.id} className="rounded-xl border border-gray-700 bg-gray-800/60 px-4 py-3 flex items-center gap-3">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="font-mono font-bold text-white text-sm">{draft.formation || '—'}</span>
                      <span className="text-xs px-1.5 py-0.5 rounded bg-draft-green/20 text-green-400 border border-draft-green/30">
                        {STATUS_LABELS[draft.status] || draft.status}
                      </span>
                    </div>
                  </div>
                  <button onClick={() => onStartDraft(draft.id)}
                    className="flex-shrink-0 btn-primary text-sm py-1.5 px-4">
                    Continuar
                  </button>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Create draft */}
        <div className="card">
          {error && <p className="text-red-400 text-sm mb-3">{error}</p>}
          <button onClick={handleCreateDraft} disabled={creating} className="btn-primary w-full">
            {creating ? '⚽ Criando...' : '✨ Criar Novo Draft'}
          </button>
        </div>

        {/* History */}
        {historyDrafts.length > 0 && (
          <div className="mt-6">
            <p className="text-sm font-semibold text-white mb-3">🏆 Drafts anteriores</p>
            <div className="space-y-2">
              {historyDrafts.map(draft => (
                <div key={draft.id}
                  className="rounded-xl border border-gray-700 bg-gray-800/50 px-4 py-3">
                  <div className="flex items-center justify-between gap-2">
                    <span className="font-mono font-bold text-white text-sm">{draft.formation}</span>
                    <span className="text-xs text-green-500 bg-green-950/40 border border-green-900/60 px-1.5 py-0.5 rounded">
                      finalizado
                    </span>
                  </div>
                  <p className="text-xs text-gray-500 mt-1">
                    {new Date(draft.updated_at).toLocaleDateString('pt-BR', { day:'2-digit', month:'2-digit', year:'2-digit' })}
                  </p>
                </div>
              ))}
            </div>
          </div>
        )}

        {user.is_admin && (
          <div className="mt-4 text-center">
            <button onClick={onGoAdmin}
              className="text-xs text-gray-600 hover:text-draft-gold border border-gray-800 hover:border-gray-600 px-4 py-2 rounded-lg transition-colors">
              ⚙️ Painel Admin
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
```

- [ ] **Step 2: Add active round control to Admin.jsx**

Read the current `Admin.jsx` top section to find where to add the active round panel. Add a new section at the top of the admin panel after the existing `onBack` header:

In `src/pages/Admin.jsx`, after the imports add:

```jsx
// At the top of the component, add state and fetch for active round:
const [rounds, setRounds] = useState([]);
const [seasons, setSeasons] = useState([]);
const [activeRoundId, setActiveRoundId] = useState('');
const [roundMsg, setRoundMsg] = useState(null);
const [loadingRound, setLoadingRound] = useState(false);

useEffect(() => {
  const token = localStorage.getItem('draft_token');
  // Fetch seasons to get rounds
  fetch(`${API_URL}/admin/seasons`, { headers: { Authorization: `Bearer ${token}` } })
    .then(r => r.json())
    .then(data => setSeasons(data.data || []));
}, []);

const loadRounds = (seasonId) => {
  const token = localStorage.getItem('draft_token');
  fetch(`${API_URL}/admin/rounds?season_id=${seasonId}`, { headers: { Authorization: `Bearer ${token}` } })
    .then(r => r.json())
    .then(data => setRounds(data.data || []));
};

const handleSetActiveRound = async () => {
  if (!activeRoundId) return;
  setLoadingRound(true);
  setRoundMsg(null);
  const token = localStorage.getItem('draft_token');
  try {
    const res = await fetch(`${API_URL}/admin/config/active-round`, {
      method: 'PUT',
      headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({ round_id: activeRoundId }),
    });
    const data = await res.json();
    setRoundMsg(res.ok ? '✅ Rodada ativa definida!' : `❌ ${data.error}`);
  } catch {
    setRoundMsg('❌ Erro de conexão');
  } finally {
    setLoadingRound(false);
  }
};
```

And add this JSX section at the top of the returned admin content (before other sections):

```jsx
{/* Active round control */}
<div className="card mb-6">
  <h2 className="text-lg font-semibold text-white mb-4">🔵 Rodada Ativa do Draft</h2>
  <div className="space-y-3">
    <div>
      <label className="block text-sm text-gray-400 mb-1">Temporada</label>
      <select className="input-field" onChange={e => loadRounds(e.target.value)}>
        <option value="">Selecionar...</option>
        {seasons.map(s => (
          <option key={s.id} value={s.id}>{s.name} ({s.year})</option>
        ))}
      </select>
    </div>
    {rounds.length > 0 && (
      <div>
        <label className="block text-sm text-gray-400 mb-1">Rodada</label>
        <select className="input-field" value={activeRoundId} onChange={e => setActiveRoundId(e.target.value)}>
          <option value="">Selecionar...</option>
          {rounds.map(r => (
            <option key={r.id} value={r.id}>{r.name} (#{r.number})</option>
          ))}
        </select>
      </div>
    )}
    <button onClick={handleSetActiveRound} disabled={!activeRoundId || loadingRound}
      className="btn-primary w-full disabled:opacity-40">
      {loadingRound ? 'Salvando...' : 'Definir Rodada Ativa'}
    </button>
    {roundMsg && <p className="text-sm mt-2">{roundMsg}</p>}
  </div>
</div>
```

- [ ] **Step 3: Update EndScreen.jsx**

Read `src/pages/EndScreen.jsx` to understand its current contract, then update it to accept `draftId` and load the draft detail from `GET /api/v1/drafts/:id`.

The new EndScreen signature: `({ draftId, onGoHome })`.

It fetches `GET /api/v1/drafts/:id` and shows the picks.

Add to EndScreen:
```jsx
import React, { useState, useEffect } from 'react';
import { API_URL } from '../config.js';

export default function EndScreen({ draftId, onGoHome }) {
  const [draft, setDraft] = useState(null);

  useEffect(() => {
    const token = localStorage.getItem('draft_token');
    fetch(`${API_URL}/drafts/${draftId}`, { headers: { Authorization: `Bearer ${token}` } })
      .then(r => r.json())
      .then(data => setDraft(data));
  }, [draftId]);

  if (!draft) return (
    <div className="min-h-screen flex items-center justify-center">
      <p className="text-gray-400 animate-pulse">Carregando resultado...</p>
    </div>
  );

  const DETAILED_LABELS = {
    1:'GOL', 2:'ZAG', 3:'LD', 4:'LE', 5:'VOL',
    6:'MEI', 7:'MAT', 8:'ME', 9:'MD', 10:'CA', 11:'PE', 12:'PD', 13:'2AT'
  };

  const starters = (draft.picks || []).filter(p => p.slot_position <= 11)
    .sort((a, b) => a.slot_position - b.slot_position);
  const bench = (draft.picks || []).filter(p => p.slot_position > 11)
    .sort((a, b) => a.slot_position - b.slot_position);

  return (
    <div className="min-h-screen flex flex-col items-center p-4">
      <div className="w-full max-w-md">
        <div className="text-center mb-8 mt-8">
          <div className="text-5xl mb-3">🏆</div>
          <h1 className="text-3xl font-bold text-white">Draft Completo!</h1>
          <p className="text-gray-400 text-sm mt-1">{draft.formation}</p>
        </div>

        <div className="card mb-4">
          <h2 className="text-sm font-semibold text-gray-400 uppercase tracking-wide mb-3">Titulares</h2>
          <div className="space-y-2">
            {starters.map(p => (
              <div key={p.slot_position} className="flex items-center gap-3 py-1">
                <span className="text-xs font-mono text-gray-500 w-6">{p.slot_position}</span>
                <span className="text-xs bg-gray-700 text-gray-300 px-1.5 py-0.5 rounded font-bold">
                  {DETAILED_LABELS[p.detailed_position_id] || '?'}
                </span>
                <span className="text-sm text-white font-mono truncate flex-1">
                  {p.player_id.slice(0, 8)}…
                  {draft.captain_player_id === p.player_id && (
                    <span className="ml-1 text-draft-gold text-xs">👑</span>
                  )}
                </span>
              </div>
            ))}
          </div>
        </div>

        {bench.length > 0 && (
          <div className="card mb-4">
            <h2 className="text-sm font-semibold text-gray-400 uppercase tracking-wide mb-3">Reservas</h2>
            <div className="space-y-2">
              {bench.map(p => (
                <div key={p.slot_position} className="flex items-center gap-3 py-1">
                  <span className="text-xs font-mono text-gray-500 w-6">{p.slot_position}</span>
                  <span className="text-xs bg-gray-700 text-gray-300 px-1.5 py-0.5 rounded font-bold">
                    {DETAILED_LABELS[p.detailed_position_id] || '?'}
                  </span>
                  <span className="text-sm text-white font-mono truncate flex-1">
                    {p.player_id.slice(0, 8)}…
                  </span>
                </div>
              ))}
            </div>
          </div>
        )}

        <button onClick={onGoHome} className="btn-primary w-full">← Voltar para início</button>
      </div>
    </div>
  );
}
```

- [ ] **Step 4: Build and verify**

```bash
npm run build
```

Expected: build succeeds with no errors

- [ ] **Step 5: Commit**

```bash
git add src/pages/Home.jsx src/pages/Admin.jsx src/pages/EndScreen.jsx
git commit -m "feat: rewrite Home, update Admin (active round), update EndScreen for new draft contract"
```

---

## Self-Review Checklist

**Spec coverage:**
- ✅ draft_config migration → Task 1
- ✅ drafts migration → Task 1
- ✅ draft_picks migration → Task 1
- ✅ Formation domain + repo → Task 2
- ✅ Draft domain → Task 3
- ✅ Draft repository → Task 4
- ✅ Draft usecase (create, get, formation, options, pick, captain, list, config) → Task 5
- ✅ Draft + Formation controllers → Task 6
- ✅ Wire up main.go + admin config endpoint + users/me → Task 7
- ✅ Remove socket.io + update auth pages → Task 8
- ✅ App.jsx rewrite (no socket, draftId navigation) → Task 9
- ✅ PlayerCard + PlayerList for SportMonks contract → Task 10
- ✅ FormationPickerPhase (API-loaded) + PickPanel (REST) → Task 11
- ✅ Draft.jsx REST flow → Task 12
- ✅ Home.jsx create draft + Admin active round + EndScreen → Task 13

**Known limitations (intentional, out of scope):**
- EndScreen shows player UUID instead of name (scores/names require fetching players separately)
- Captain pick shows UUID (same reason)
- No reroll mechanic
- No score calculation
