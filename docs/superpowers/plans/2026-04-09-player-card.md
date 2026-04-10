# Player Card Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Enrich the draft slot-options endpoint with player stats and render a rich visual player card in the PickPanel.

**Architecture:** Backend extends `PoolPlayer` with avg_score, avg_minutes, nationality, alt_positions, and six attribute scores (computed via live SQL CTEs + a separate attribute query); frontend adds a `DraftPlayerCard` component that renders the v28 design and replaces the old `card` mode in `PickPanel`.

**Tech Stack:** Go + pgx (backend, `C:\Users\pA\Desktop\draft-football-api`), React + inline SVG + flag-icons CSS (frontend, `C:\Users\pA\Desktop\draft-football-app-2`)

---

## File Map

**Backend (`C:\Users\pA\Desktop\draft-football-api`)**
- Create: `migrations/000023_add_team_colors.up.sql`
- Create: `migrations/000023_add_team_colors.down.sql`
- Modify: `internal/domain/draft/draft.go` — add fields to `PoolPlayer`
- Modify: `internal/repository/postgres/draft.go` — enrich queries + new `getPlayerAttributes`
- Modify: `internal/controller/draft/dto.go` — extend `PoolPlayerResponse`
- Modify: `internal/controller/draft/handler.go` — update mapping in `GetOptions`

**Frontend (`C:\Users\pA\Desktop\draft-football-app-2`)**
- Modify: `index.html` — add flag-icons CDN link
- Create: `src/utils/nationality.js` — ISO2 lookup
- Create: `src/components/DraftPlayerCard.jsx` — new rich card
- Modify: `src/components/PickPanel.jsx` — use DraftPlayerCard

---

## Task 1: Migration — add team colors

**Repo:** `C:\Users\pA\Desktop\draft-football-api`

**Files:**
- Create: `migrations/000023_add_team_colors.up.sql`
- Create: `migrations/000023_add_team_colors.down.sql`

- [ ] **Step 1: Write up migration**

```sql
-- migrations/000023_add_team_colors.up.sql
ALTER TABLE teams
    ADD COLUMN IF NOT EXISTS primary_color   VARCHAR(7) NOT NULL DEFAULT '#1a1a1a',
    ADD COLUMN IF NOT EXISTS secondary_color VARCHAR(7) NOT NULL DEFAULT '#ffffff';
```

- [ ] **Step 2: Write down migration**

```sql
-- migrations/000023_add_team_colors.down.sql
ALTER TABLE teams
    DROP COLUMN IF EXISTS primary_color,
    DROP COLUMN IF EXISTS secondary_color;
```

- [ ] **Step 3: Run migration**

```bash
cd C:\Users\pA\Desktop\draft-football-api
migrate -path migrations -database "$DATABASE_URL" up
```

Expected: `000023/u add_team_colors OK`

- [ ] **Step 4: Commit**

```bash
git add migrations/000023_add_team_colors.up.sql migrations/000023_add_team_colors.down.sql
git commit -m "feat: add primary_color and secondary_color to teams"
```

---

## Task 2: Extend PoolPlayer domain struct

**Repo:** `C:\Users\pA\Desktop\draft-football-api`

**Files:**
- Modify: `internal/domain/draft/draft.go`

- [ ] **Step 1: Replace the PoolPlayer struct**

Replace lines 51–59 in `internal/domain/draft/draft.go`:

```go
type PoolPlayer struct {
	ID                 uuid.UUID
	Name               string
	DisplayName        string
	PositionID         int
	DetailedPositionID int
	TeamShortCode      string
	TeamLogoURL        string
	PrimaryColor       string
	SecondaryColor     string
	Nationality        string
	AltPositions       []int
	AvgScore           float64
	AvgMinutes         float64
	AttrAta            float64
	AttrGol            float64
	AttrCom            float64
	AttrCri            float64
	AttrDef            float64
	AttrPas            float64
	AttrFis            float64
}
```

- [ ] **Step 2: Verify build compiles**

```bash
cd C:\Users\pA\Desktop\draft-football-api
go build ./...
```

Expected: no errors (existing callers only read the old 7 fields, which still exist)

- [ ] **Step 3: Commit**

```bash
git add internal/domain/draft/draft.go
git commit -m "feat: extend PoolPlayer with stats and attribute fields"
```

---

## Task 3: Add getPlayerAttributes repository helper

**Repo:** `C:\Users\pA\Desktop\draft-football-api`

**Files:**
- Modify: `internal/repository/postgres/draft.go`

This private helper queries attribute scores per player per stat category using the `stat_weights` + `position_stat_weights` tables.

- [ ] **Step 1: Add helper function at the bottom of draft.go**

Add after line 266 (after `scanDraft`):

```go
// capAttr clamps a raw attribute score to the 0–10 range.
func capAttr(v float64) float64 {
	if v < 0 {
		return 0
	}
	if v > 10 {
		return 10
	}
	// round to 1 decimal
	return math.Round(v*10) / 10
}

// getPlayerAttributes returns category → score for each player.
// detailedPositionID is used to look up position_stat_weights.
// For bench picks where players have mixed positions, pass 0 to use
// each player's own detailed_position_id (joined from players table).
func (r *draftRepository) getPlayerAttributes(
	ctx context.Context,
	playerIDs []uuid.UUID,
	detailedPositionID int,
) (map[uuid.UUID]map[string]float64, error) {
	if len(playerIDs) == 0 {
		return nil, nil
	}

	// usePosArg controls whether we bind $1 as a fixed position ID
	// or join position_stat_weights per each player's own position.
	posJoin := `psw.detailed_position_id = $1`
	if detailedPositionID == 0 {
		posJoin = `psw.detailed_position_id = p.detailed_position_id`
	}

	query := fmt.Sprintf(`
WITH active_season AS (
    SELECT r.season_id
    FROM   rounds r
    WHERE  r.id = (SELECT value::uuid FROM draft_config WHERE key = 'active_round_id')
),
fixture_scores AS (
    SELECT
        ps.player_id,
        ps.fixture_id,
        sw.category,
        SUM(
            CASE sw.stat_name
                WHEN 'goals'                     THEN COALESCE(ps.goals, 0)
                WHEN 'assists'                   THEN COALESCE(ps.assists, 0)
                WHEN 'shots_total'               THEN COALESCE(ps.shots_total, 0)
                WHEN 'shots_on_target'           THEN COALESCE(ps.shots_on_target, 0)
                WHEN 'shots_off_target'          THEN COALESCE(ps.shots_off_target, 0)
                WHEN 'shots_blocked'             THEN COALESCE(ps.shots_blocked, 0)
                WHEN 'big_chances_created'       THEN COALESCE(ps.big_chances_created, 0)
                WHEN 'big_chances_missed'        THEN -COALESCE(ps.big_chances_missed, 0)
                WHEN 'expected_goals'            THEN COALESCE(ps.expected_goals, 0)::float
                WHEN 'expected_goals_on_target'  THEN COALESCE(ps.expected_goals_on_target, 0)::float
                WHEN 'shooting_performance'      THEN COALESCE(ps.shooting_performance, 0)::float
                WHEN 'penalties_scored'          THEN COALESCE(ps.penalties_scored, 0)
                WHEN 'penalties_missed'          THEN -COALESCE(ps.penalties_missed, 0)
                WHEN 'penalties_won'             THEN COALESCE(ps.penalties_won, 0)
                WHEN 'key_passes'                THEN COALESCE(ps.key_passes, 0)
                WHEN 'passes_in_final_third'     THEN COALESCE(ps.passes_in_final_third, 0)
                WHEN 'total_crosses'             THEN COALESCE(ps.total_crosses, 0)
                WHEN 'accurate_crosses'          THEN COALESCE(ps.accurate_crosses, 0)
                WHEN 'accurate_crosses_pct'      THEN COALESCE(ps.accurate_crosses_pct, 0)::float
                WHEN 'passes'                    THEN COALESCE(ps.passes, 0)::float / 100
                WHEN 'accurate_passes'           THEN COALESCE(ps.accurate_passes, 0)::float / 100
                WHEN 'accurate_passes_pct'       THEN COALESCE(ps.accurate_passes_pct, 0)::float
                WHEN 'backward_passes'           THEN COALESCE(ps.backward_passes, 0)
                WHEN 'long_balls'                THEN COALESCE(ps.long_balls, 0)
                WHEN 'long_balls_won'            THEN COALESCE(ps.long_balls_won, 0)
                WHEN 'long_balls_won_pct'        THEN COALESCE(ps.long_balls_won_pct, 0)::float
                WHEN 'tackles'                   THEN COALESCE(ps.tackles, 0)
                WHEN 'tackles_won'               THEN COALESCE(ps.tackles_won, 0)
                WHEN 'tackles_won_pct'           THEN COALESCE(ps.tackles_won_pct, 0)::float
                WHEN 'tackles_missed'            THEN -COALESCE(ps.tackles_missed, 0)
                WHEN 'interceptions'             THEN COALESCE(ps.interceptions, 0)
                WHEN 'clearances'                THEN COALESCE(ps.clearances, 0)
                WHEN 'blocked_shots'             THEN COALESCE(ps.blocked_shots, 0)
                WHEN 'goals_conceded'            THEN -COALESCE(ps.goals_conceded, 0)
                WHEN 'dribbled_past'             THEN -COALESCE(ps.dribbled_past, 0)
                WHEN 'duels_won'                 THEN COALESCE(ps.duels_won, 0)
                WHEN 'duels_lost'                THEN -COALESCE(ps.duels_lost, 0)
                WHEN 'duels_won_pct'             THEN COALESCE(ps.duels_won_pct, 0)::float
                WHEN 'total_duels'               THEN COALESCE(ps.total_duels, 0)
                WHEN 'dribble_attempts'          THEN COALESCE(ps.dribble_attempts, 0)
                WHEN 'successful_dribbles'       THEN COALESCE(ps.successful_dribbles, 0)
                WHEN 'ball_recovery'             THEN COALESCE(ps.ball_recovery, 0)
                WHEN 'possession_lost'           THEN -COALESCE(ps.possession_lost, 0)
                WHEN 'dispossessed'              THEN -COALESCE(ps.dispossessed, 0)
                WHEN 'touches'                   THEN COALESCE(ps.touches, 0)::float / 50
                WHEN 'aerials'                   THEN COALESCE(ps.aerials, 0)
                WHEN 'aerials_won'               THEN COALESCE(ps.aerials_won, 0)
                WHEN 'aerials_lost'              THEN -COALESCE(ps.aerials_lost, 0)
                WHEN 'aerials_won_pct'           THEN COALESCE(ps.aerials_won_pct, 0)::float
                WHEN 'saves'                     THEN COALESCE(ps.saves, 0)
                WHEN 'saves_insidebox'           THEN COALESCE(ps.saves_insidebox, 0)
                WHEN 'goalkeeper_goals_conceded' THEN -COALESCE(ps.goalkeeper_goals_conceded, 0)
                WHEN 'penalties_saved'           THEN COALESCE(ps.penalties_saved, 0)
                WHEN 'punches'                   THEN COALESCE(ps.punches, 0)
                WHEN 'yellowcards'               THEN -COALESCE(ps.yellowcards, 0)
                WHEN 'redcards'                  THEN -COALESCE(ps.redcards, 0)
                WHEN 'yellowred_cards'           THEN -COALESCE(ps.yellowred_cards, 0)
                WHEN 'fouls'                     THEN -COALESCE(ps.fouls, 0)
                WHEN 'fouls_drawn'               THEN COALESCE(ps.fouls_drawn, 0)
                WHEN 'penalties_committed'       THEN -COALESCE(ps.penalties_committed, 0)
                WHEN 'offsides'                  THEN -COALESCE(ps.offsides, 0)
                WHEN 'is_captain'                THEN CASE WHEN COALESCE(ps.is_captain, false) THEN 1.0 ELSE 0 END
                ELSE 0
            END * sw.weight * psw.weight / 10000.0
        ) AS fixture_score
    FROM player_stats ps
    JOIN players p ON p.id = ps.player_id
    JOIN fixtures f ON f.id = ps.fixture_id
    JOIN active_season acs ON f.season_id = acs.season_id
    JOIN stat_weights sw ON sw.enabled = true AND sw.active = true
    JOIN position_stat_weights psw ON psw.stat_name = sw.stat_name AND %s
    WHERE ps.player_id = ANY($2)
      AND COALESCE(ps.minutes_played, 0) > 0
    GROUP BY ps.player_id, ps.fixture_id, sw.category
)
SELECT player_id, category, ROUND(AVG(fixture_score)::numeric, 1) AS score
FROM   fixture_scores
GROUP  BY player_id, category
`, posJoin)

	var arg1 any
	if detailedPositionID == 0 {
		// posJoin uses player's own position — $1 is still needed as playerIDs
		// Shift: pass dummy and reuse arg; simpler: rebuild with $1=playerIDs only
		query = strings.ReplaceAll(query, "= $1", "= p.detailed_position_id")
		query = strings.ReplaceAll(query, "= ANY($2)", "= ANY($1)")
		arg1 = playerIDs
	} else {
		arg1 = detailedPositionID
	}

	var rows pgx.Rows
	var err error
	if detailedPositionID == 0 {
		rows, err = r.db.Query(ctx, query, playerIDs)
	} else {
		rows, err = r.db.Query(ctx, query, detailedPositionID, playerIDs)
	}
	if err != nil {
		return nil, fmt.Errorf("getPlayerAttributes: %w", err)
	}
	defer rows.Close()
	_ = arg1

	result := make(map[uuid.UUID]map[string]float64)
	for rows.Next() {
		var playerID uuid.UUID
		var category string
		var score float64
		if err := rows.Scan(&playerID, &category, &score); err != nil {
			return nil, err
		}
		if result[playerID] == nil {
			result[playerID] = make(map[string]float64)
		}
		result[playerID][category] = score
	}
	return result, rows.Err()
}
```

- [ ] **Step 2: Add `math` and `pgx` imports**

In `draft.go` imports add `"math"` and `"github.com/jackc/pgx/v5"` if not already present:

```go
import (
    "context"
    "fmt"
    "math"
    "strings"
    "time"

    "github.com/draft-football-api/internal/domain"
    "github.com/draft-football-api/internal/domain/draft"
    "github.com/google/uuid"
    "github.com/jackc/pgx/v5"
    "github.com/jackc/pgx/v5/pgxpool"
)
```

- [ ] **Step 3: Verify build**

```bash
go build ./...
```

Expected: no errors

- [ ] **Step 4: Commit**

```bash
git add internal/repository/postgres/draft.go
git commit -m "feat: add getPlayerAttributes query with weighted category scores"
```

---

## Task 4: Enrich queryPoolPlayers — base info CTE

**Repo:** `C:\Users\pA\Desktop\draft-football-api`

**Files:**
- Modify: `internal/repository/postgres/draft.go`

Replace both `GetOptionsByDetailedPosition` and `GetOptionsByPositionIDs` with enriched versions that include avg_score, avg_minutes, alt_positions, primary/secondary color, nationality. Also update `queryPoolPlayers` scan to handle the new fields.

- [ ] **Step 1: Replace GetOptionsByDetailedPosition (lines 157–169)**

```go
func (r *draftRepository) GetOptionsByDetailedPosition(ctx context.Context, draftID uuid.UUID, detailedPositionID int) ([]draft.PoolPlayer, error) {
	query := `
WITH active_season AS (
    SELECT r.season_id FROM rounds r
    WHERE  r.id = (SELECT value::uuid FROM draft_config WHERE key = 'active_round_id')
),
pool AS (
    SELECT p.id, p.name, COALESCE(p.display_name, p.name) AS display_name,
           p.position_id, p.detailed_position_id,
           COALESCE(t.short_code, '')       AS team_short_code,
           COALESCE(t.logo_url, '')         AS team_logo_url,
           COALESCE(t.primary_color, '#1a1a1a')   AS primary_color,
           COALESCE(t.secondary_color, '#ffffff')  AS secondary_color,
           COALESCE(p.nationality, '')      AS nationality
    FROM   players p
    LEFT JOIN teams t ON t.id = p.team_id
    WHERE  p.detailed_position_id = $1
      AND  p.id NOT IN (SELECT player_id FROM draft_picks WHERE draft_id = $2)
    ORDER  BY RANDOM()
    LIMIT  5
),
season_stats AS (
    SELECT ps.player_id,
           ROUND(AVG(COALESCE(ps.rating, 0))::numeric, 1)       AS avg_score,
           ROUND(AVG(COALESCE(ps.minutes_played, 0))::numeric, 0) AS avg_minutes
    FROM   player_stats ps
    JOIN   fixtures f ON f.id = ps.fixture_id
    JOIN   active_season acs ON f.season_id = acs.season_id
    WHERE  ps.player_id IN (SELECT id FROM pool)
      AND  COALESCE(ps.minutes_played, 0) > 0
    GROUP  BY ps.player_id
),
alt_pos AS (
    SELECT pph.player_id,
           (SELECT array_agg(pph2.detailed_position_id ORDER BY pph2.appearances DESC)
            FROM   player_positions_history pph2
            WHERE  pph2.player_id = pph.player_id
              AND  pph2.detailed_position_id != p.detailed_position_id
            LIMIT  2) AS alt_positions
    FROM   player_positions_history pph
    JOIN   players p ON p.id = pph.player_id
    WHERE  pph.player_id IN (SELECT id FROM pool)
    GROUP  BY pph.player_id, p.detailed_position_id
)
SELECT pool.id, pool.name, pool.display_name,
       pool.position_id, pool.detailed_position_id,
       pool.team_short_code, pool.team_logo_url,
       pool.primary_color, pool.secondary_color,
       pool.nationality,
       COALESCE(ss.avg_score, 0)           AS avg_score,
       COALESCE(ss.avg_minutes, 0)         AS avg_minutes,
       COALESCE(ap.alt_positions, '{}')    AS alt_positions
FROM   pool
LEFT   JOIN season_stats ss ON ss.player_id = pool.id
LEFT   JOIN alt_pos ap      ON ap.player_id = pool.id`

	players, err := r.queryPoolPlayers(ctx, query, detailedPositionID, draftID)
	if err != nil {
		return nil, err
	}

	playerIDs := make([]uuid.UUID, len(players))
	for i, p := range players {
		playerIDs[i] = p.ID
	}
	attrs, err := r.getPlayerAttributes(ctx, playerIDs, detailedPositionID)
	if err != nil {
		return nil, err
	}
	for i, p := range players {
		a := attrs[p.ID]
		players[i].AttrAta = capAttr(a["ataque"])
		players[i].AttrGol = capAttr(a["goleiro"])
		players[i].AttrCom = capAttr(a["comportamento"])
		players[i].AttrCri = capAttr(a["criacao"])
		players[i].AttrDef = capAttr(a["defesa"])
		players[i].AttrPas = capAttr(a["passes"])
		players[i].AttrFis = capAttr(a["fisico"])
	}
	return players, nil
}
```

- [ ] **Step 2: Replace GetOptionsByPositionIDs (lines 171–192)**

```go
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
WITH active_season AS (
    SELECT r.season_id FROM rounds r
    WHERE  r.id = (SELECT value::uuid FROM draft_config WHERE key = 'active_round_id')
),
pool AS (
    SELECT p.id, p.name, COALESCE(p.display_name, p.name) AS display_name,
           p.position_id, p.detailed_position_id,
           COALESCE(t.short_code, '')       AS team_short_code,
           COALESCE(t.logo_url, '')         AS team_logo_url,
           COALESCE(t.primary_color, '#1a1a1a')   AS primary_color,
           COALESCE(t.secondary_color, '#ffffff')  AS secondary_color,
           COALESCE(p.nationality, '')      AS nationality
    FROM   players p
    LEFT JOIN teams t ON t.id = p.team_id
    WHERE  p.position_id IN (%s)
      AND  p.id NOT IN (SELECT player_id FROM draft_picks WHERE draft_id = $1)
    ORDER  BY RANDOM()
    LIMIT  5
),
season_stats AS (
    SELECT ps.player_id,
           ROUND(AVG(COALESCE(ps.rating, 0))::numeric, 1)       AS avg_score,
           ROUND(AVG(COALESCE(ps.minutes_played, 0))::numeric, 0) AS avg_minutes
    FROM   player_stats ps
    JOIN   fixtures f ON f.id = ps.fixture_id
    JOIN   active_season acs ON f.season_id = acs.season_id
    WHERE  ps.player_id IN (SELECT id FROM pool)
      AND  COALESCE(ps.minutes_played, 0) > 0
    GROUP  BY ps.player_id
),
alt_pos AS (
    SELECT pph.player_id,
           (SELECT array_agg(pph2.detailed_position_id ORDER BY pph2.appearances DESC)
            FROM   player_positions_history pph2
            WHERE  pph2.player_id = pph.player_id
              AND  pph2.detailed_position_id != p.detailed_position_id
            LIMIT  2) AS alt_positions
    FROM   player_positions_history pph
    JOIN   players p ON p.id = pph.player_id
    WHERE  pph.player_id IN (SELECT id FROM pool)
    GROUP  BY pph.player_id, p.detailed_position_id
)
SELECT pool.id, pool.name, pool.display_name,
       pool.position_id, pool.detailed_position_id,
       pool.team_short_code, pool.team_logo_url,
       pool.primary_color, pool.secondary_color,
       pool.nationality,
       COALESCE(ss.avg_score, 0)           AS avg_score,
       COALESCE(ss.avg_minutes, 0)         AS avg_minutes,
       COALESCE(ap.alt_positions, '{}')    AS alt_positions
FROM   pool
LEFT   JOIN season_stats ss ON ss.player_id = pool.id
LEFT   JOIN alt_pos ap      ON ap.player_id = pool.id`,
		strings.Join(placeholders, ","))

	players, err := r.queryPoolPlayers(ctx, query, args...)
	if err != nil {
		return nil, err
	}

	playerIDs := make([]uuid.UUID, len(players))
	for i, p := range players {
		playerIDs[i] = p.ID
	}
	// Use detailedPositionID=0 → each player's own position is used for weights
	attrs, err := r.getPlayerAttributes(ctx, playerIDs, 0)
	if err != nil {
		return nil, err
	}
	for i, p := range players {
		a := attrs[p.ID]
		players[i].AttrAta = capAttr(a["ataque"])
		players[i].AttrGol = capAttr(a["goleiro"])
		players[i].AttrCom = capAttr(a["comportamento"])
		players[i].AttrCri = capAttr(a["criacao"])
		players[i].AttrDef = capAttr(a["defesa"])
		players[i].AttrPas = capAttr(a["passes"])
		players[i].AttrFis = capAttr(a["fisico"])
	}
	return players, nil
}
```

- [ ] **Step 3: Replace queryPoolPlayers helper to scan new fields (lines 233–249)**

```go
func (r *draftRepository) queryPoolPlayers(ctx context.Context, query string, args ...any) ([]draft.PoolPlayer, error) {
	rows, err := r.db.Query(ctx, query, args...)
	if err != nil {
		return nil, fmt.Errorf("postgres query pool players: %w", err)
	}
	defer rows.Close()
	var players []draft.PoolPlayer
	for rows.Next() {
		var p draft.PoolPlayer
		var altIDs []int32
		if err := rows.Scan(
			&p.ID, &p.Name, &p.DisplayName,
			&p.PositionID, &p.DetailedPositionID,
			&p.TeamShortCode, &p.TeamLogoURL,
			&p.PrimaryColor, &p.SecondaryColor,
			&p.Nationality,
			&p.AvgScore, &p.AvgMinutes,
			&altIDs,
		); err != nil {
			return nil, err
		}
		p.AltPositions = make([]int, len(altIDs))
		for i, v := range altIDs {
			p.AltPositions[i] = int(v)
		}
		players = append(players, p)
	}
	return players, rows.Err()
}
```

- [ ] **Step 4: Verify build**

```bash
go build ./...
```

Expected: no errors

- [ ] **Step 5: Commit**

```bash
git add internal/repository/postgres/draft.go
git commit -m "feat: enrich pool player queries with stats, alt_positions, team colors"
```

---

## Task 5: Extend PoolPlayerResponse DTO + handler mapping

**Repo:** `C:\Users\pA\Desktop\draft-football-api`

**Files:**
- Modify: `internal/controller/draft/dto.go`
- Modify: `internal/controller/draft/handler.go`

- [ ] **Step 1: Replace PoolPlayerResponse in dto.go (lines 46–54)**

```go
type PoolPlayerResponse struct {
	ID                 uuid.UUID `json:"id"`
	Name               string    `json:"name"`
	DisplayName        string    `json:"display_name"`
	PositionID         int       `json:"position_id"`
	DetailedPositionID int       `json:"detailed_position_id"`
	TeamShortCode      string    `json:"team_short_code"`
	TeamLogoURL        string    `json:"team_logo_url"`
	PrimaryColor       string    `json:"primary_color"`
	SecondaryColor     string    `json:"secondary_color"`
	Nationality        string    `json:"nationality"`
	AltPositions       []int     `json:"alt_positions"`
	AvgScore           float64   `json:"avg_score"`
	AvgMinutes         float64   `json:"avg_minutes"`
	AttrAta            float64   `json:"attr_ata"`
	AttrGol            float64   `json:"attr_gol"`
	AttrCom            float64   `json:"attr_com"`
	AttrCri            float64   `json:"attr_cri"`
	AttrDef            float64   `json:"attr_def"`
	AttrPas            float64   `json:"attr_pas"`
	AttrFis            float64   `json:"attr_fis"`
}
```

- [ ] **Step 2: Replace the mapping loop in GetOptions handler (lines 127–134)**

```go
data := make([]PoolPlayerResponse, len(players))
for i, p := range players {
    altPos := p.AltPositions
    if altPos == nil {
        altPos = []int{}
    }
    data[i] = PoolPlayerResponse{
        ID:                 p.ID,
        Name:               p.Name,
        DisplayName:        p.DisplayName,
        PositionID:         p.PositionID,
        DetailedPositionID: p.DetailedPositionID,
        TeamShortCode:      p.TeamShortCode,
        TeamLogoURL:        p.TeamLogoURL,
        PrimaryColor:       p.PrimaryColor,
        SecondaryColor:     p.SecondaryColor,
        Nationality:        p.Nationality,
        AltPositions:       altPos,
        AvgScore:           p.AvgScore,
        AvgMinutes:         p.AvgMinutes,
        AttrAta:            p.AttrAta,
        AttrGol:            p.AttrGol,
        AttrCom:            p.AttrCom,
        AttrCri:            p.AttrCri,
        AttrDef:            p.AttrDef,
        AttrPas:            p.AttrPas,
        AttrFis:            p.AttrFis,
    }
}
```

- [ ] **Step 3: Verify build**

```bash
go build ./...
```

Expected: no errors

- [ ] **Step 4: Manual smoke test**

```bash
# Start the API and call the options endpoint
curl -s -H "Authorization: Bearer <token>" \
  "http://localhost:8080/api/v1/drafts/<draft_id>/slots/1/options" | jq '.options[0]'
```

Expected: JSON with `avg_score`, `avg_minutes`, `primary_color`, `alt_positions`, `attr_ata`, etc.

- [ ] **Step 5: Commit**

```bash
git add internal/controller/draft/dto.go internal/controller/draft/handler.go
git commit -m "feat: expose enriched player fields in options endpoint"
```

---

## Task 6: Frontend — flag-icons + nationality utility

**Repo:** `C:\Users\pA\Desktop\draft-football-app-2`

**Files:**
- Modify: `index.html`
- Create: `src/utils/nationality.js`

- [ ] **Step 1: Add flag-icons CDN to index.html**

In `index.html`, add inside `<head>` before `</head>`:

```html
<link rel="stylesheet" href="https://cdn.jsdelivr.net/npm/flag-icons@7.2.3/css/flag-icons.min.css"/>
```

Full `index.html` after edit:

```html
<!DOCTYPE html>
<html lang="pt-BR">
  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <title>Draft Football</title>
    <link rel="icon" type="image/svg+xml" href="data:image/svg+xml,<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 100 100'><text y='.9em' font-size='90'>⚽</text></svg>" />
    <link rel="stylesheet" href="https://cdn.jsdelivr.net/npm/flag-icons@7.2.3/css/flag-icons.min.css"/>
  </head>
  <body>
    <div id="root"></div>
    <script type="module" src="/src/main.jsx"></script>
  </body>
</html>
```

- [ ] **Step 2: Create nationality utility**

Create `src/utils/nationality.js`:

```js
// Maps the `nationality` string from the API (from Sportmonks) to ISO 3166-1 alpha-2.
// Add entries as new nationalities appear in the player pool.
const NATIONALITY_ISO2 = {
  // South America
  'Brazilian':    'br',
  'Argentine':    'ar',
  'Uruguayan':    'uy',
  'Colombian':    'co',
  'Chilean':      'cl',
  'Paraguayan':   'py',
  'Bolivian':     'bo',
  'Peruvian':     'pe',
  'Ecuadorian':   'ec',
  'Venezuelan':   've',

  // Europe
  'Portuguese':   'pt',
  'Spanish':      'es',
  'French':       'fr',
  'German':       'de',
  'Italian':      'it',
  'English':      'gb-eng',
  'Dutch':        'nl',
  'Belgian':      'be',
  'Croatian':     'hr',
  'Serbian':      'rs',
  'Danish':       'dk',
  'Swedish':      'se',
  'Norwegian':    'no',
  'Swiss':        'ch',
  'Austrian':     'at',
  'Polish':       'pl',
  'Czech':        'cz',
  'Slovak':       'sk',
  'Hungarian':    'hu',
  'Romanian':     'ro',
  'Bulgarian':    'bg',
  'Ukrainian':    'ua',
  'Russian':      'ru',
  'Greek':        'gr',
  'Turkish':      'tr',

  // Africa
  'Senegalese':   'sn',
  'Nigerian':     'ng',
  'Ivorian':      'ci',
  'Ghanaian':     'gh',
  'Moroccan':     'ma',
  'Algerian':     'dz',
  'Tunisian':     'tn',
  'Egyptian':     'eg',
  'Cameroonian':  'cm',
  'Malian':       'ml',
  'Guinean':      'gn',

  // Others
  'Mexican':      'mx',
  'American':     'us',
  'Canadian':     'ca',
  'Japanese':     'jp',
  'South Korean': 'kr',
  'Australian':   'au',
};

/**
 * Returns the ISO2 country code for a nationality string.
 * Falls back to '' (renders nothing) if unknown.
 * @param {string} nationality
 * @returns {string}
 */
export function nationalityToIso2(nationality) {
  return NATIONALITY_ISO2[nationality] || '';
}
```

- [ ] **Step 3: Verify in browser**

Start dev server:
```bash
cd C:\Users\pA\Desktop\draft-football-app-2
npm run dev
```

Open browser → verify no console errors about flag-icons.

- [ ] **Step 4: Commit**

```bash
git add index.html src/utils/nationality.js
git commit -m "feat: add flag-icons CDN and nationality ISO2 utility"
```

---

## Task 7: Frontend — DraftPlayerCard component

**Repo:** `C:\Users\pA\Desktop\draft-football-app-2`

**Files:**
- Create: `src/components/DraftPlayerCard.jsx`

The card renders the v28 design: jersey SVG (solid primary_color fill, MVP), overlaid text, attribute grid.

- [ ] **Step 1: Create DraftPlayerCard.jsx**

```jsx
import React from 'react';
import { nationalityToIso2 } from '../utils/nationality.js';

// Maps detailed_position_id → abbreviated label (Portuguese)
const DETAILED_LABELS = {
  1:'GOL', 2:'ZAG', 3:'LD', 4:'LE', 5:'VOL',
  6:'MEI', 7:'MAT', 8:'ME', 9:'MD', 10:'CA', 11:'PE', 12:'PD', 13:'2AT'
};

// Card border color keyed to basic position_id
// 1=GK(blue), 2=DEF(green), 3=MID(green), 4=ATT(red)
const BORDER_COLORS = {
  1: '#3b82f6',
  2: '#22c55e',
  3: '#22c55e',
  4: '#ef4444',
};

// Attribute row config: [label, color, valueKey]
const OUTFIELD_ATTRS = [
  ['ATA', '#f87171', 'attr_ata'],
  ['COM', '#fbbf24', 'attr_com'],
  ['CRI', '#a78bfa', 'attr_cri'],
  ['DEF', '#4ade80', 'attr_def'],
  ['PAS', '#60a5fa', 'attr_pas'],
  ['FIS', '#22d3ee', 'attr_fis'],
];

const GOALKEEPER_ATTRS = [
  ['GOL', '#3b82f6', 'attr_gol'],
  ['COM', '#fbbf24', 'attr_com'],
  ['CRI', '#a78bfa', 'attr_cri'],
  ['DEF', '#4ade80', 'attr_def'],
  ['PAS', '#60a5fa', 'attr_pas'],
  ['FIS', '#22d3ee', 'attr_fis'],
];

function AttrRow({ label, color, value }) {
  const pct = Math.min(Math.max((value / 10) * 100, 0), 100);
  return (
    <div style={{ display:'flex', alignItems:'center', gap:4 }}>
      <span style={{
        fontSize:13, fontWeight:800, textTransform:'uppercase',
        width:34, flexShrink:0, color
      }}>{label}</span>
      <div style={{
        flex:1, height:4, background:'rgba(255,255,255,0.08)',
        borderRadius:2, overflow:'hidden'
      }}>
        <div style={{ height:'100%', width:`${pct}%`, background:color, borderRadius:2 }} />
      </div>
      <span style={{ fontSize:13, fontWeight:900, width:32, textAlign:'right', color }}>
        {value.toFixed(1)}
      </span>
    </div>
  );
}

export default function DraftPlayerCard({ player, onClick, isMyTurn }) {
  const isGoalkeeper = player.detailed_position_id === 1;
  const attrs = isGoalkeeper ? GOALKEEPER_ATTRS : OUTFIELD_ATTRS;
  const borderColor = BORDER_COLORS[player.position_id] || '#6b7280';
  const iso2 = nationalityToIso2(player.nationality || '');
  const displayName = player.display_name || player.name;
  const altPositions = (player.alt_positions || []).slice(0, 2);
  const avgScore = (player.avg_score || 0).toFixed(1);
  const avgMinutes = Math.round(player.avg_minutes || 0);
  const primaryColor = player.primary_color || '#1a1a1a';

  return (
    <button
      onClick={isMyTurn ? onClick : undefined}
      disabled={!isMyTurn}
      style={{
        width: 210,
        flexShrink: 0,
        borderRadius: 14,
        overflow: 'hidden',
        border: `1.5px solid ${borderColor}`,
        boxShadow: '0 8px 32px rgba(0,0,0,0.5)',
        background: 'transparent',
        cursor: isMyTurn ? 'pointer' : 'default',
        opacity: isMyTurn ? 1 : 0.8,
        textAlign: 'left',
        transition: 'transform 0.15s, box-shadow 0.15s',
        fontFamily: "'Inter', system-ui, sans-serif",
      }}
      onMouseEnter={e => { if (isMyTurn) e.currentTarget.style.transform = 'scale(1.04)'; }}
      onMouseLeave={e => { e.currentTarget.style.transform = 'scale(1)'; }}
    >
      {/* ── TOP ── */}
      <div style={{
        height: 120,
        background: '#1a2234',
        position: 'relative',
        overflow: 'hidden',
      }}>
        {/* Jersey — centered, bottom-aligned */}
        <div style={{
          position:'absolute', inset:0,
          display:'flex', alignItems:'flex-end', justifyContent:'center'
        }}>
          <svg viewBox="0 0 120 95" width={108} fill="none" xmlns="http://www.w3.org/2000/svg">
            <defs>
              <clipPath id={`jersey-${player.id}`}>
                <path d="M38 6 C36 6 24 9 6 20 L13 46 C19 40 25 38 30 38 L30 95 L90 95 L90 38 C95 38 101 40 107 46 L114 20 C96 9 84 6 82 6 C80 1 74 0 74 3 Q60 13 46 3 C46 0 40 1 38 6 Z"/>
              </clipPath>
            </defs>
            <g clipPath={`url(#jersey-${player.id})`}>
              <rect x="0" y="0" width="120" height="95" fill={primaryColor}/>
            </g>
          </svg>
        </div>

        {/* Top-left: score */}
        <div style={{ position:'absolute', top:9, left:11 }}>
          <div style={{ fontSize:26, fontWeight:800, color:'#fbbf24', lineHeight:1.05 }}>
            {avgScore}
          </div>
          <div style={{ fontSize:8, color:'#6b7280' }}>score méd.</div>
        </div>

        {/* Top-right: minutes + flag */}
        <div style={{
          position:'absolute', top:9, right:11,
          display:'flex', flexDirection:'column', alignItems:'flex-end', gap:8
        }}>
          <div style={{ textAlign:'right' }}>
            <div style={{ fontSize:14, fontWeight:700, color:'#d1d5db', lineHeight:1 }}>
              {avgMinutes}'
            </div>
            <div style={{ fontSize:8, color:'#6b7280' }}>méd. min.</div>
          </div>
          {iso2 && (
            <span
              className={`fi fi-${iso2}`}
              style={{ display:'inline-block', width:28, height:20, borderRadius:3, boxShadow:'0 1px 4px rgba(0,0,0,0.5)' }}
            />
          )}
        </div>

        {/* Bottom-left: alt positions + main position */}
        <div style={{
          position:'absolute', bottom:9, left:11,
          display:'flex', flexDirection:'column', alignItems:'flex-start', gap:2
        }}>
          {altPositions.map(posID => (
            <span key={posID} style={{
              fontSize:9, fontWeight:600, color:'#9ca3af',
              background:'rgba(255,255,255,0.08)',
              borderRadius:3, padding:'1px 5px', lineHeight:1.5, display:'block'
            }}>
              {DETAILED_LABELS[posID] || posID}
            </span>
          ))}
          <span style={{ fontSize:20, fontWeight:900, color:'#f9fafb', lineHeight:1, letterSpacing:'0.5px', marginTop:1 }}>
            {DETAILED_LABELS[player.detailed_position_id] || '?'}
          </span>
        </div>

        {/* Bottom-right: team code */}
        <div style={{ position:'absolute', bottom:9, right:11 }}>
          <span style={{ fontSize:11, fontWeight:700, color:'#6b7280', letterSpacing:'0.5px' }}>
            {player.team_short_code || '—'}
          </span>
        </div>
      </div>

      {/* ── BOTTOM ── */}
      <div style={{
        background:'#111827',
        padding:'8px 12px 17px',
        display:'flex', flexDirection:'column', gap:8,
      }}>
        {/* Player name */}
        <div style={{
          fontSize:15, fontWeight:800, color:'#f9fafb',
          textTransform:'uppercase', letterSpacing:'0.5px', textAlign:'center',
          whiteSpace:'nowrap', overflow:'hidden', textOverflow:'ellipsis',
          paddingBottom:8, borderBottom:'1px solid rgba(255,255,255,0.08)'
        }}>
          {displayName}
        </div>

        {/* Attribute grid — 3×2 */}
        <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:'6px 10px' }}>
          {attrs.map(([label, color, key]) => (
            <AttrRow key={label} label={label} color={color} value={player[key] || 0} />
          ))}
        </div>
      </div>
    </button>
  );
}
```

- [ ] **Step 2: Verify component renders in isolation**

Temporarily import in `src/pages/Draft.jsx` or another page and render with mock data:

```jsx
<DraftPlayerCard
  isMyTurn
  onClick={() => {}}
  player={{
    id: 'test', name: 'Pedro Ramirez', display_name: 'Pedro',
    position_id: 4, detailed_position_id: 10,
    team_short_code: 'ATM', primary_color: '#1a1a1a',
    nationality: 'Brazilian', alt_positions: [11, 13],
    avg_score: 8.4, avg_minutes: 73,
    attr_ata: 8.5, attr_gol: 0, attr_com: 7.2,
    attr_cri: 6.0, attr_def: 1.5, attr_pas: 5.5, attr_fis: 6.8,
  }}
/>
```

Expected: card renders correctly, jersey shows, flag visible.

Remove the temporary import after verification.

- [ ] **Step 3: Commit**

```bash
git add src/components/DraftPlayerCard.jsx
git commit -m "feat: add DraftPlayerCard component with jersey SVG and attribute grid"
```

---

## Task 8: Frontend — update PickPanel to use DraftPlayerCard

**Repo:** `C:\Users\pA\Desktop\draft-football-app-2`

**Files:**
- Modify: `src/components/PickPanel.jsx`

- [ ] **Step 1: Replace PickPanel.jsx**

```jsx
import React from 'react';
import DraftPlayerCard from './DraftPlayerCard.jsx';

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
            <DraftPlayerCard
              key={player.id}
              player={player}
              isMyTurn
              onClick={() => onPickPlayer(player.id)}
            />
          ))}
        </div>
        <button
          onClick={onClose}
          className="text-xs text-gray-600 hover:text-gray-400 border border-gray-700 px-4 py-2 rounded-lg"
        >
          ← Voltar
        </button>
      </div>
    </div>
  );
}
```

- [ ] **Step 2: Run dev server and open a draft**

```bash
npm run dev
```

Open a draft in the browser → select a slot → verify the new cards appear with jersey, score, flag, attributes.

- [ ] **Step 3: Commit**

```bash
git add src/components/PickPanel.jsx
git commit -m "feat: use DraftPlayerCard in PickPanel for enriched slot options"
```

---

## Self-Review Notes

- **Spec coverage:** all fields present in DTO (avg_score, avg_minutes, nationality, alt_positions, 6 attrs, team colors). Goalkeeper variant handled via `detailed_position_id === 1`. Flag icon via flag-icons. Jersey SVG uses solid primary_color (stripe patterns are a future enhancement; the migration adds secondary_color for future use).
- **Type consistency:** `AltPositions []int` → `alt_positions: []int` in JSON → `player.alt_positions` in JSX → mapped via `DETAILED_LABELS`. Consistent throughout.
- **No placeholders:** all SQL and code is complete.
- **Known limitation:** `getPlayerAttributes` with `detailedPositionID=0` uses a string replacement hack to avoid param collision. A cleaner alternative is two separate query strings (one with `$1=posID`, one without), but both produce correct results.
