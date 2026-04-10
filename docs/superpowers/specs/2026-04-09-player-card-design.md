# Player Card (Draft Screen) Design Spec

## Overview

A rich player card displayed during draft slot selection. Each card presents a player's key info — jersey, identity, score, position, and six attribute ratings — in a compact, visually distinct format. Goalkeepers use a variant attribute set.

---

## Visual Layout

### Card dimensions

- **Width:** 210px
- **Top section (jersey area):** 120px tall, background `#1a2234`
- **Bottom section (stats area):** variable height, background `#111827`, padding `8px 12px 17px`
- **Border radius:** 14px
- **Border:** 1.5px solid, color keyed to position category (see below)
- **Box shadow:** `0 8px 32px rgba(0,0,0,0.5)`

### Position category → border color

| Category | Border |
|----------|--------|
| Atacante (CA, PE, 2AT, etc.) | `#ef4444` (red) |
| Goleiro (GOL) | `#3b82f6` (blue) |
| Defensor / Volante / Meia / Lateral | `#22c55e` (green) |

---

## Top Section

Jersey SVG centered horizontally, bottom-aligned (touching the divider).

**Jersey SVG spec:**
- `viewBox="0 0 120 95"`, rendered width `108px`
- ClipPath path: `M38 6 C36 6 24 9 6 20 L13 46 C19 40 25 38 30 38 L30 95 L90 95 L90 38 C95 38 101 40 107 46 L114 20 C96 9 84 6 82 6 C80 1 74 0 74 3 Q60 13 46 3 C46 0 40 1 38 6 Z`
- No stroke — flat design, neckhole only
- Fill pattern (rects clipped to shape): primary color base + secondary color stripes/hoops
- `filter: drop-shadow(0 4px 14px rgba(0,0,0,0.7))`

**Overlay elements (absolute positioned):**

| Position | Content |
|----------|---------|
| Top-left | Score number (26px, 800, `#fbbf24`) + label "score méd." (8px, `#6b7280`) below |
| Top-right | Minutes value (14px, 700, `#d1d5db`) + label "méd. min." (8px) + flag icon below |
| Bottom-left | Alt positions (one per line, 9px badge) stacked above main position (20px, 900, `#f9fafb`) |
| Bottom-right | Team short code (11px, 700, `#6b7280`) |

**Flag icons:** `flag-icons` CSS library (`fi fi-{iso2}`), 28×20px, border-radius 3px.

---

## Bottom Section

**Player name:** 15px, 800, uppercase, centered, `text-overflow: ellipsis`. Separator line below (`rgba(255,255,255,0.08)`). Gap between name and stats: 8px.

**Attribute grid:** 3 rows × 2 columns. Each cell: label (13px, 800) + thin bar (4px, full width) + value (13px, 900).

### Outfield player attributes

| Row | Col 1 | Col 2 |
|-----|-------|-------|
| 1 | ATA (red `#f87171`) | COM (amber `#fbbf24`) |
| 2 | CRI (purple `#a78bfa`) | DEF (green `#4ade80`) |
| 3 | PAS (blue `#60a5fa`) | FIS (cyan `#22d3ee`) |

### Goalkeeper attributes

| Row | Col 1 | Col 2 |
|-----|-------|-------|
| 1 | **GOL** (blue `#3b82f6`) | COM (amber `#fbbf24`) |
| 2 | CRI (purple `#a78bfa`) | DEF (green `#4ade80`) |
| 3 | PAS (blue `#60a5fa`) | FIS (cyan `#22d3ee`) |

Attribute values: 0.0–10.0. Bar width = `value / 10 * 100%`.

---

## Data Requirements

### New fields on `PoolPlayer` domain struct + `PoolPlayerResponse` DTO

| Field | Type | Description |
|-------|------|-------------|
| `avg_score` | float64 | Weighted avg score across rounds played |
| `avg_minutes` | float64 | Avg minutes played per round |
| `nationality_iso2` | string | ISO 3166-1 alpha-2 country code (e.g. `"br"`, `"ar"`) |
| `alt_positions` | []string | Top 2 secondary positions by frequency in `player_positions_history`, excluding the primary position (e.g. `["PE", "2AT"]`). Empty slice if none. |
| `attr_ata` | float64 | Weighted avg of ATA-category stats (outfield) |
| `attr_gol` | float64 | Weighted avg of GOL-category stats (goalkeeper only) |
| `attr_com` | float64 | Weighted avg of COM-category stats |
| `attr_cri` | float64 | Weighted avg of CRI-category stats |
| `attr_def` | float64 | Weighted avg of DEF-category stats |
| `attr_pas` | float64 | Weighted avg of PAS-category stats |
| `attr_fis` | float64 | Weighted avg of FIS-category stats |

### Team colors

Add `primary_color` (hex string) and `secondary_color` (hex string) columns to the `teams` table. Used by frontend to render jersey SVG fills dynamically.

### Computation approach: Live SQL CTE (Option A)

Extend `queryPoolPlayers` in `internal/repository/postgres/draft.go` with CTEs:
- Compute `avg_score` and `avg_minutes` from player stat history
- Compute each attribute score: `SUM(stat_value * position_weight) / rounds_played` grouped by `stat_weights.category`
- JOIN `players` table for `nationality_iso2`
- Subquery `player_positions_history` for `alt_positions`

Only 5 players are returned per call, so query complexity is acceptable.

### Frontend nationality mapping

Utility function `nationalityToIso2(nationality: string): string` mapping common nationalities to ISO2 codes (e.g. `"Brazilian" → "br"`, `"Argentine" → "ar"`). Defined in `src/utils/nationality.js`.

---

## Component Changes

### `src/components/PlayerCard.jsx`

Add a new `draftCard` render mode (alongside existing `compact`, `card`, default). When `draftCard={true}`:
- Renders the full card as specified above
- Accepts all new data fields as props
- Determines goalkeeper variant by checking if the player's primary position abbreviation is `"GOL"`

### `src/components/PickPanel.jsx`

Pass new fields from pool player data to `PlayerCard` when rendering slot options.

---

## Out of Scope

- Animated transitions on card reveal
- Player photo / avatar
- Historical stat sparklines
- Card flip interaction
