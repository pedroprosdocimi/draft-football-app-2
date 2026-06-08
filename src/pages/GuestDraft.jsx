import React, { useState, useEffect, useMemo, useRef } from 'react';
import { API_URL } from '../config.js';
import { getFormationPreviewLayout } from '../components/FormationPreview.jsx';
import FieldPlayerPreview from '../components/FieldPlayerPreview.jsx';
import PickPanel from '../components/PickPanel.jsx';
import PlayerFigure, { NATIONAL_KITS } from '../components/PlayerFigure.jsx';
import { getDetailedPositionLabel } from '../utils/positions.js';

/* ============================================================================
   GuestDraft — fase "drafting" dos 11 titulares sem login.
   Usa o mesmo pitch e PickPanel do Draft.jsx real, com jogadores demo.
   Props: formation (string), onConvert(starters, formationSlots), onBack()
   ============================================================================ */

const GRAY_KIT = NATIONAL_KITS['_'];

// Mapeamento de cor por detailed_position_id (1-13)
const DRAFT_DETAIL_TO_LINE = {
  1: 'var(--c-gk)',
  2: 'var(--c-def)', 3: 'var(--c-def)', 4: 'var(--c-def)',
  5: 'var(--c-mid)', 6: 'var(--c-mid)', 7: 'var(--c-mid)', 8: 'var(--c-mid)', 9: 'var(--c-mid)',
  10: 'var(--c-att)', 11: 'var(--c-att)', 12: 'var(--c-att)', 13: 'var(--c-att)',
};

const POS_FULL = {
  GOL: 'Goleiro', ZAG: 'Zagueiro', LD: 'Lateral Dir.', LE: 'Lateral Esq.',
  VOL: 'Volante', MC: 'Meio-campo', MEI: 'Meia', ATA: 'Atacante', PE: 'Ponta Esq.', PD: 'Ponta Dir.',
};

const DEMO_PLAYERS = [
  // ── GOL (1) ──────────────────────────────────────────────────────────────
  { id:  1, display_name: 'Memo Ochoa',          nationality: 'Mexico',         jersey_number: 13, detailed_position_id: 1,  avg_score: 7.2 },
  { id:  2, display_name: 'Gregor Kobel',         nationality: 'Switzerland',    jersey_number: 12, detailed_position_id: 1,  avg_score: 7.5 },
  { id:  3, display_name: 'Alisson',              nationality: 'Brazil',         jersey_number:  1, detailed_position_id: 1,  avg_score: 8.3 },
  { id:  4, display_name: 'Yassine Bounou',       nationality: 'Morocco',        jersey_number:  1, detailed_position_id: 1,  avg_score: 8.0 },
  { id:  5, display_name: 'Matt Turner',          nationality: 'United States',  jersey_number:  1, detailed_position_id: 1,  avg_score: 7.0 },
  { id:  6, display_name: 'Gastón Bueno',         nationality: 'Paraguay',       jersey_number:  1, detailed_position_id: 1,  avg_score: 6.8 },
  { id:  7, display_name: 'Manuel Neuer',         nationality: 'Germany',        jersey_number:  1, detailed_position_id: 1,  avg_score: 8.1 },
  { id:  8, display_name: 'Hernán Galíndez',      nationality: 'Ecuador',        jersey_number:  1, detailed_position_id: 1,  avg_score: 7.1 },
  { id:  9, display_name: 'Bart Verbruggen',      nationality: 'Netherlands',    jersey_number:  1, detailed_position_id: 1,  avg_score: 7.6 },
  { id: 10, display_name: 'Zion Suzuki',          nationality: 'Japan',          jersey_number:  1, detailed_position_id: 1,  avg_score: 7.3 },
  { id: 11, display_name: 'Thibaut Courtois',     nationality: 'Belgium',        jersey_number:  1, detailed_position_id: 1,  avg_score: 8.6 },
  { id: 12, display_name: 'David Raya',           nationality: 'Spain',          jersey_number:  1, detailed_position_id: 1,  avg_score: 7.9 },
  { id: 13, display_name: 'Sergio Rochet',        nationality: 'Uruguay',        jersey_number:  1, detailed_position_id: 1,  avg_score: 7.4 },
  { id: 14, display_name: 'Mike Maignan',         nationality: 'France',         jersey_number: 16, detailed_position_id: 1,  avg_score: 8.2 },
  { id: 15, display_name: 'Ørjan Nyland',         nationality: 'Norway',         jersey_number:  1, detailed_position_id: 1,  avg_score: 7.1 },
  { id: 16, display_name: 'Emiliano Martínez',    nationality: 'Argentina',      jersey_number: 23, detailed_position_id: 1,  avg_score: 8.7 },
  { id: 17, display_name: 'Diogo Costa',          nationality: 'Portugal',       jersey_number:  1, detailed_position_id: 1,  avg_score: 8.0 },
  { id: 18, display_name: 'Camilo Vargas',        nationality: 'Colombia',       jersey_number:  1, detailed_position_id: 1,  avg_score: 7.8 },
  { id: 19, display_name: 'Jordan Pickford',      nationality: 'England',        jersey_number:  1, detailed_position_id: 1,  avg_score: 7.9 },
  { id: 20, display_name: 'Dominik Livaković',    nationality: 'Croatia',        jersey_number:  1, detailed_position_id: 1,  avg_score: 8.0 },
  // ── ZAG (2) ──────────────────────────────────────────────────────────────
  { id: 21, display_name: 'César Montes',         nationality: 'Mexico',         jersey_number:  3, detailed_position_id: 2,  avg_score: 6.8 },
  { id: 22, display_name: 'Manuel Akanji',        nationality: 'Switzerland',    jersey_number:  5, detailed_position_id: 2,  avg_score: 7.8 },
  { id: 23, display_name: 'Marquinhos',           nationality: 'Brazil',         jersey_number:  4, detailed_position_id: 2,  avg_score: 8.0 },
  { id: 24, display_name: 'Nayef Aguerd',         nationality: 'Morocco',        jersey_number:  5, detailed_position_id: 2,  avg_score: 7.4 },
  { id: 25, display_name: 'Chris Richards',       nationality: 'United States',  jersey_number:  5, detailed_position_id: 2,  avg_score: 6.9 },
  { id: 26, display_name: 'Gustavo Gómez',        nationality: 'Paraguay',       jersey_number:  3, detailed_position_id: 2,  avg_score: 7.7 },
  { id: 27, display_name: 'Fabián Balbuena',      nationality: 'Paraguay',       jersey_number:  4, detailed_position_id: 2,  avg_score: 7.3 },
  { id: 28, display_name: 'Antonio Rüdiger',      nationality: 'Germany',        jersey_number:  2, detailed_position_id: 2,  avg_score: 8.0 },
  { id: 29, display_name: 'Willian Pacho',        nationality: 'Ecuador',        jersey_number:  3, detailed_position_id: 2,  avg_score: 8.0 },
  { id: 30, display_name: 'Virgil van Dijk',      nationality: 'Netherlands',    jersey_number:  4, detailed_position_id: 2,  avg_score: 8.8 },
  { id: 31, display_name: 'Ko Itakura',           nationality: 'Japan',          jersey_number:  4, detailed_position_id: 2,  avg_score: 7.2 },
  { id: 32, display_name: 'Jan Vertonghen',       nationality: 'Belgium',        jersey_number:  5, detailed_position_id: 2,  avg_score: 7.3 },
  { id: 33, display_name: 'Pau Cubarsí',          nationality: 'Spain',          jersey_number: 22, detailed_position_id: 2,  avg_score: 8.0 },
  { id: 34, display_name: 'Ronald Araújo',        nationality: 'Uruguay',        jersey_number:  4, detailed_position_id: 2,  avg_score: 8.2 },
  { id: 35, display_name: 'José Giménez',         nationality: 'Uruguay',        jersey_number:  3, detailed_position_id: 2,  avg_score: 7.8 },
  { id: 36, display_name: 'Dayot Upamecano',      nationality: 'France',         jersey_number:  4, detailed_position_id: 2,  avg_score: 7.9 },
  { id: 37, display_name: 'Leo Østigård',         nationality: 'Norway',         jersey_number:  5, detailed_position_id: 2,  avg_score: 7.0 },
  { id: 38, display_name: 'Kristoffer Ajer',      nationality: 'Norway',         jersey_number:  4, detailed_position_id: 2,  avg_score: 7.2 },
  { id: 39, display_name: 'Cristian Romero',      nationality: 'Argentina',      jersey_number: 13, detailed_position_id: 2,  avg_score: 8.1 },
  { id: 40, display_name: 'Nicolás Otamendi',     nationality: 'Argentina',      jersey_number: 19, detailed_position_id: 2,  avg_score: 7.7 },
  { id: 41, display_name: 'Rúben Dias',           nationality: 'Portugal',       jersey_number:  3, detailed_position_id: 2,  avg_score: 8.5 },
  { id: 42, display_name: 'Davinson Sánchez',     nationality: 'Colombia',       jersey_number:  2, detailed_position_id: 2,  avg_score: 7.6 },
  { id: 43, display_name: 'John Stones',          nationality: 'England',        jersey_number:  5, detailed_position_id: 2,  avg_score: 7.8 },
  { id: 44, display_name: 'Marc Guehi',           nationality: 'England',        jersey_number:  6, detailed_position_id: 2,  avg_score: 7.5 },
  { id: 45, display_name: 'Joško Gvardiol',       nationality: 'Croatia',        jersey_number:  3, detailed_position_id: 2,  avg_score: 8.5 },
  { id: 46, display_name: 'Duje Ćaleta-Car',      nationality: 'Croatia',        jersey_number:  6, detailed_position_id: 2,  avg_score: 7.5 },
  // ── LD (3) ───────────────────────────────────────────────────────────────
  { id: 47, display_name: 'Jorge Sánchez',        nationality: 'Mexico',         jersey_number: 22, detailed_position_id: 3,  avg_score: 6.5 },
  { id: 48, display_name: 'Achraf Hakimi',        nationality: 'Morocco',        jersey_number:  2, detailed_position_id: 3,  avg_score: 8.7 },
  { id: 49, display_name: 'Noussair Mazraoui',    nationality: 'Morocco',        jersey_number:  3, detailed_position_id: 3,  avg_score: 7.5 },
  { id: 50, display_name: 'Joshua Kimmich',       nationality: 'Germany',        jersey_number:  6, detailed_position_id: 3,  avg_score: 8.4 },
  { id: 51, display_name: 'Denzel Dumfries',      nationality: 'Netherlands',    jersey_number:  6, detailed_position_id: 3,  avg_score: 7.9 },
  { id: 52, display_name: 'Timothy Castagne',     nationality: 'Belgium',        jersey_number:  2, detailed_position_id: 3,  avg_score: 7.2 },
  { id: 53, display_name: 'João Cancelo',         nationality: 'Portugal',       jersey_number: 20, detailed_position_id: 3,  avg_score: 8.0 },
  // ── LE (4) ───────────────────────────────────────────────────────────────
  { id: 54, display_name: 'Ricardo Rodriguez',    nationality: 'Switzerland',    jersey_number: 13, detailed_position_id: 4,  avg_score: 6.9 },
  { id: 55, display_name: 'Antonee Robinson',     nationality: 'United States',  jersey_number:  3, detailed_position_id: 4,  avg_score: 7.3 },
  { id: 56, display_name: 'Piero Hincapié',       nationality: 'Ecuador',        jersey_number: 16, detailed_position_id: 4,  avg_score: 7.8 },
  { id: 57, display_name: 'Yuto Nagatomo',        nationality: 'Japan',          jersey_number:  5, detailed_position_id: 4,  avg_score: 6.8 },
  { id: 58, display_name: 'Alejandro Grimaldo',   nationality: 'Spain',          jersey_number:  3, detailed_position_id: 4,  avg_score: 8.1 },
  { id: 59, display_name: 'Theo Hernández',       nationality: 'France',         jersey_number: 22, detailed_position_id: 4,  avg_score: 8.1 },
  { id: 60, display_name: 'Nuno Mendes',          nationality: 'Portugal',       jersey_number: 25, detailed_position_id: 4,  avg_score: 7.8 },
  { id: 61, display_name: 'Johan Mojica',         nationality: 'Colombia',       jersey_number:  3, detailed_position_id: 4,  avg_score: 7.2 },
  // ── VOL (5) ──────────────────────────────────────────────────────────────
  { id: 62, display_name: 'Edson Álvarez',        nationality: 'Mexico',         jersey_number: 18, detailed_position_id: 5,  avg_score: 7.8 },
  { id: 63, display_name: 'Granit Xhaka',         nationality: 'Switzerland',    jersey_number: 10, detailed_position_id: 5,  avg_score: 8.1 },
  { id: 64, display_name: 'Casemiro',             nationality: 'Brazil',         jersey_number:  5, detailed_position_id: 5,  avg_score: 7.6 },
  { id: 65, display_name: 'Sofyan Amrabat',       nationality: 'Morocco',        jersey_number:  4, detailed_position_id: 5,  avg_score: 7.8 },
  { id: 66, display_name: 'Tyler Adams',          nationality: 'United States',  jersey_number:  4, detailed_position_id: 5,  avg_score: 7.6 },
  { id: 67, display_name: 'Andrés Cubas',         nationality: 'Paraguay',       jersey_number:  5, detailed_position_id: 5,  avg_score: 7.2 },
  { id: 68, display_name: 'Moisés Caicedo',       nationality: 'Ecuador',        jersey_number: 10, detailed_position_id: 5,  avg_score: 8.7 },
  { id: 69, display_name: 'Wataru Endo',          nationality: 'Japan',          jersey_number:  6, detailed_position_id: 5,  avg_score: 7.9 },
  { id: 70, display_name: 'Axel Witsel',          nationality: 'Belgium',        jersey_number:  6, detailed_position_id: 5,  avg_score: 7.5 },
  { id: 71, display_name: 'Rodri',                nationality: 'Spain',          jersey_number: 16, detailed_position_id: 5,  avg_score: 9.0 },
  { id: 72, display_name: 'Manuel Ugarte',        nationality: 'Uruguay',        jersey_number:  5, detailed_position_id: 5,  avg_score: 8.0 },
  { id: 73, display_name: 'Aurélien Tchouaméni',  nationality: 'France',         jersey_number:  8, detailed_position_id: 5,  avg_score: 8.3 },
  { id: 74, display_name: 'Sander Berge',         nationality: 'Norway',         jersey_number: 23, detailed_position_id: 5,  avg_score: 7.5 },
  { id: 75, display_name: 'Rodrigo De Paul',      nationality: 'Argentina',      jersey_number:  7, detailed_position_id: 5,  avg_score: 8.2 },
  { id: 76, display_name: 'Vitinha',              nationality: 'Portugal',       jersey_number: 23, detailed_position_id: 5,  avg_score: 8.1 },
  { id: 77, display_name: 'Richard Ríos',         nationality: 'Colombia',       jersey_number:  5, detailed_position_id: 5,  avg_score: 7.9 },
  { id: 78, display_name: 'Declan Rice',          nationality: 'England',        jersey_number:  4, detailed_position_id: 5,  avg_score: 8.6 },
  { id: 79, display_name: 'Mateo Kovačić',        nationality: 'Croatia',        jersey_number:  8, detailed_position_id: 5,  avg_score: 8.3 },
  // ── MC (6) ───────────────────────────────────────────────────────────────
  { id: 80, display_name: 'Remo Freuler',         nationality: 'Switzerland',    jersey_number:  8, detailed_position_id: 6,  avg_score: 7.2 },
  { id: 81, display_name: 'Azzedine Ounahi',      nationality: 'Morocco',        jersey_number:  8, detailed_position_id: 6,  avg_score: 7.6 },
  { id: 82, display_name: 'Weston McKennie',      nationality: 'United States',  jersey_number:  8, detailed_position_id: 6,  avg_score: 7.4 },
  { id: 83, display_name: 'Diego Gómez',          nationality: 'Paraguay',       jersey_number:  8, detailed_position_id: 6,  avg_score: 7.5 },
  { id: 84, display_name: 'Leon Goretzka',        nationality: 'Germany',        jersey_number:  8, detailed_position_id: 6,  avg_score: 7.5 },
  { id: 85, display_name: 'Frenkie de Jong',      nationality: 'Netherlands',    jersey_number: 10, detailed_position_id: 6,  avg_score: 8.5 },
  { id: 86, display_name: 'Tijjani Reijnders',    nationality: 'Netherlands',    jersey_number: 14, detailed_position_id: 6,  avg_score: 8.2 },
  { id: 87, display_name: 'Ao Tanaka',            nationality: 'Japan',          jersey_number:  7, detailed_position_id: 6,  avg_score: 7.4 },
  { id: 88, display_name: 'Pedri',                nationality: 'Spain',          jersey_number: 20, detailed_position_id: 6,  avg_score: 8.7 },
  { id: 89, display_name: 'Federico Valverde',    nationality: 'Uruguay',        jersey_number:  8, detailed_position_id: 6,  avg_score: 8.9 },
  { id: 90, display_name: 'Alexis Mac Allister',  nationality: 'Argentina',      jersey_number: 20, detailed_position_id: 6,  avg_score: 8.4 },
  { id: 91, display_name: 'Enzo Fernández',       nationality: 'Argentina',      jersey_number: 24, detailed_position_id: 6,  avg_score: 8.3 },
  { id: 92, display_name: 'Bruno Fernandes',      nationality: 'Portugal',       jersey_number:  8, detailed_position_id: 6,  avg_score: 8.8 },
  { id: 93, display_name: 'Jefferson Lerma',      nationality: 'Colombia',       jersey_number:  8, detailed_position_id: 6,  avg_score: 7.5 },
  // ── MEI (7) ──────────────────────────────────────────────────────────────
  { id: 94, display_name: 'Álvaro Fidalgo',       nationality: 'Mexico',         jersey_number: 10, detailed_position_id: 7,  avg_score: 7.4 },
  { id: 95, display_name: 'Neymar',               nationality: 'Brazil',         jersey_number: 10, detailed_position_id: 7,  avg_score: 8.8 },
  { id: 96, display_name: 'Brahim Díaz',          nationality: 'Morocco',        jersey_number: 10, detailed_position_id: 7,  avg_score: 8.2 },
  { id: 97, display_name: 'Christian Pulisic',    nationality: 'United States',  jersey_number: 10, detailed_position_id: 7,  avg_score: 8.3 },
  { id: 98, display_name: 'Miguel Almirón',       nationality: 'Paraguay',       jersey_number: 10, detailed_position_id: 7,  avg_score: 8.0 },
  { id: 99, display_name: 'Kendry Páez',          nationality: 'Ecuador',        jersey_number: 20, detailed_position_id: 7,  avg_score: 7.8 },
  { id:100, display_name: 'Florian Wirtz',        nationality: 'Germany',        jersey_number: 17, detailed_position_id: 7,  avg_score: 8.9 },
  { id:101, display_name: 'Jamal Musiala',        nationality: 'Germany',        jersey_number: 10, detailed_position_id: 7,  avg_score: 9.0 },
  { id:102, display_name: 'Kai Havertz',          nationality: 'Germany',        jersey_number:  7, detailed_position_id: 7,  avg_score: 8.0 },
  { id:103, display_name: 'Takefusa Kubo',        nationality: 'Japan',          jersey_number:  8, detailed_position_id: 7,  avg_score: 8.5 },
  { id:104, display_name: 'Kevin De Bruyne',      nationality: 'Belgium',        jersey_number:  7, detailed_position_id: 7,  avg_score: 9.2 },
  { id:105, display_name: 'Dani Olmo',            nationality: 'Spain',          jersey_number: 10, detailed_position_id: 7,  avg_score: 8.5 },
  { id:106, display_name: 'Giorgian De Arrascaeta', nationality: 'Uruguay',      jersey_number: 10, detailed_position_id: 7,  avg_score: 8.2 },
  { id:107, display_name: 'Michael Olise',        nationality: 'France',         jersey_number: 11, detailed_position_id: 7,  avg_score: 8.5 },
  { id:108, display_name: 'Martin Ødegaard',      nationality: 'Norway',         jersey_number:  8, detailed_position_id: 7,  avg_score: 8.9 },
  { id:109, display_name: 'Lionel Messi',         nationality: 'Argentina',      jersey_number: 10, detailed_position_id: 7,  avg_score: 9.6 },
  { id:110, display_name: 'Bernardo Silva',       nationality: 'Portugal',       jersey_number: 10, detailed_position_id: 7,  avg_score: 8.9 },
  // ── PE (11) ──────────────────────────────────────────────────────────────
  { id:111, display_name: 'César Huerta',         nationality: 'Mexico',         jersey_number: 11, detailed_position_id: 11, avg_score: 7.1 },
  { id:112, display_name: 'Vini Jr.',             nationality: 'Brazil',         jersey_number:  7, detailed_position_id: 11, avg_score: 9.1 },
  { id:113, display_name: 'Cody Gakpo',           nationality: 'Netherlands',    jersey_number: 18, detailed_position_id: 11, avg_score: 8.3 },
  { id:114, display_name: 'Leandro Trossard',     nationality: 'Belgium',        jersey_number: 10, detailed_position_id: 11, avg_score: 8.0 },
  { id:115, display_name: 'Nico Williams',        nationality: 'Spain',          jersey_number: 17, detailed_position_id: 11, avg_score: 8.9 },
  { id:116, display_name: 'Kylian Mbappé',        nationality: 'France',         jersey_number: 10, detailed_position_id: 11, avg_score: 9.5 },
  { id:117, display_name: 'Rafael Leão',          nationality: 'Portugal',       jersey_number: 17, detailed_position_id: 11, avg_score: 8.4 },
  { id:118, display_name: 'Luis Díaz',            nationality: 'Colombia',       jersey_number:  7, detailed_position_id: 11, avg_score: 8.8 },
  { id:119, display_name: 'Marcus Rashford',      nationality: 'England',        jersey_number: 11, detailed_position_id: 11, avg_score: 8.1 },
  { id:120, display_name: 'Ivan Perišić',         nationality: 'Croatia',        jersey_number:  4, detailed_position_id: 11, avg_score: 8.0 },
  { id:121, display_name: 'Julio Enciso',         nationality: 'Paraguay',       jersey_number: 11, detailed_position_id: 11, avg_score: 7.6 },
  // ── PD (12) ──────────────────────────────────────────────────────────────
  { id:122, display_name: 'Dan Ndoye',            nationality: 'Switzerland',    jersey_number: 23, detailed_position_id: 12, avg_score: 7.3 },
  { id:123, display_name: 'Raphinha',             nationality: 'Brazil',         jersey_number: 11, detailed_position_id: 12, avg_score: 8.4 },
  { id:124, display_name: 'Ángel Mena',           nationality: 'Ecuador',        jersey_number: 11, detailed_position_id: 12, avg_score: 7.3 },
  { id:125, display_name: 'Ritsu Doan',           nationality: 'Japan',          jersey_number: 10, detailed_position_id: 12, avg_score: 8.1 },
  { id:126, display_name: 'Jeremy Doku',          nationality: 'Belgium',        jersey_number: 11, detailed_position_id: 12, avg_score: 8.2 },
  { id:127, display_name: 'Lamine Yamal',         nationality: 'Spain',          jersey_number: 19, detailed_position_id: 12, avg_score: 9.3 },
  { id:128, display_name: 'Ousmane Dembélé',      nationality: 'France',         jersey_number:  7, detailed_position_id: 12, avg_score: 8.4 },
  { id:129, display_name: 'Leroy Sané',           nationality: 'Germany',        jersey_number: 19, detailed_position_id: 12, avg_score: 8.2 },
  { id:130, display_name: 'Bukayo Saka',          nationality: 'England',        jersey_number:  7, detailed_position_id: 12, avg_score: 8.9 },
  // ── ATA (10) ─────────────────────────────────────────────────────────────
  { id:131, display_name: 'Santiago Giménez',     nationality: 'Mexico',         jersey_number:  9, detailed_position_id: 10, avg_score: 8.5 },
  { id:132, display_name: 'Breel Embolo',         nationality: 'Switzerland',    jersey_number:  7, detailed_position_id: 10, avg_score: 7.9 },
  { id:133, display_name: 'Endrick',              nationality: 'Brazil',         jersey_number:  9, detailed_position_id: 10, avg_score: 8.0 },
  { id:134, display_name: 'Ricardo Pepi',         nationality: 'United States',  jersey_number:  9, detailed_position_id: 10, avg_score: 7.5 },
  { id:135, display_name: 'Enner Valencia',       nationality: 'Ecuador',        jersey_number: 13, detailed_position_id: 10, avg_score: 7.9 },
  { id:136, display_name: 'Memphis Depay',        nationality: 'Netherlands',    jersey_number: 19, detailed_position_id: 10, avg_score: 8.0 },
  { id:137, display_name: 'Daizen Maeda',         nationality: 'Japan',          jersey_number: 11, detailed_position_id: 10, avg_score: 7.5 },
  { id:138, display_name: 'Romelu Lukaku',        nationality: 'Belgium',        jersey_number:  9, detailed_position_id: 10, avg_score: 8.4 },
  { id:139, display_name: 'Darwin Núñez',         nationality: 'Uruguay',        jersey_number: 11, detailed_position_id: 10, avg_score: 8.7 },
  { id:140, display_name: 'Marcus Thuram',        nationality: 'France',         jersey_number:  9, detailed_position_id: 10, avg_score: 8.3 },
  { id:141, display_name: 'Jørgen Strand Larsen', nationality: 'Norway',         jersey_number: 11, detailed_position_id: 10, avg_score: 7.7 },
  { id:142, display_name: 'Erling Haaland',       nationality: 'Norway',         jersey_number:  9, detailed_position_id: 10, avg_score: 9.4 },
  { id:143, display_name: 'Julián Álvarez',       nationality: 'Argentina',      jersey_number:  9, detailed_position_id: 10, avg_score: 8.5 },
  { id:144, display_name: 'Lautaro Martínez',     nationality: 'Argentina',      jersey_number: 22, detailed_position_id: 10, avg_score: 8.8 },
  { id:145, display_name: 'Cristiano Ronaldo',    nationality: 'Portugal',       jersey_number:  7, detailed_position_id: 10, avg_score: 8.7 },
  { id:146, display_name: 'Jhon Córdoba',         nationality: 'Colombia',       jersey_number:  9, detailed_position_id: 10, avg_score: 7.4 },
  { id:147, display_name: 'Harry Kane',           nationality: 'England',        jersey_number:  9, detailed_position_id: 10, avg_score: 9.0 },
  { id:148, display_name: 'Andrej Kramarić',      nationality: 'Croatia',        jersey_number:  9, detailed_position_id: 10, avg_score: 8.1 },
];

const Emblem = ({ s = 26 }) => (
  <span className="demblem" dangerouslySetInnerHTML={{ __html:
    `<svg width="${s}" height="${s}" viewBox="0 0 100 100" fill="none" xmlns="http://www.w3.org/2000/svg">
      <defs><linearGradient id="tgg${s}" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#1f7a46"/><stop offset="1" stop-color="#0b3a20"/></linearGradient>
      <clipPath id="tcc${s}"><rect x="3" y="3" width="94" height="94" rx="26"/></clipPath></defs>
      <rect x="3" y="3" width="94" height="94" rx="26" fill="url(#tgg${s})"/>
      <g clip-path="url(#tcc${s})">
        <rect x="3" y="3" width="15.666" height="94" fill="#ffffff" opacity="0.05"/>
        <rect x="18.666" y="3" width="15.666" height="94" fill="#06351c" opacity="0.30"/>
        <rect x="34.333" y="3" width="15.666" height="94" fill="#ffffff" opacity="0.05"/>
        <rect x="50" y="3" width="15.666" height="94" fill="#06351c" opacity="0.30"/>
        <rect x="65.666" y="3" width="15.666" height="94" fill="#ffffff" opacity="0.05"/>
        <rect x="81.333" y="3" width="15.666" height="94" fill="#06351c" opacity="0.30"/>
        <rect x="3" y="3" width="94" height="48" rx="26" fill="#ffffff" opacity="0.05"/>
      </g>
      <rect x="7" y="7" width="86" height="86" rx="22" fill="none" stroke="#fbd07a" stroke-width="0.9" opacity="0.55"/>
      <text x="50" y="49" text-anchor="middle" dominant-baseline="central" font-family="'Bricolage Grotesque',sans-serif" font-weight="800" font-size="44" letter-spacing="-2" fill="#f6f8f6">11</text>
      <text x="50" y="72" text-anchor="middle" font-family="'Bricolage Grotesque',sans-serif" font-weight="700" font-size="8" letter-spacing="4" fill="#fbd07a">DRAFT</text>
    </svg>`
  }} />
);

const ArrowR = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round">
    <path d="M5 12h14"/><path d="m13 6 6 6-6 6"/>
  </svg>
);

export default function GuestDraft({ formation, onConvert, onBack }) {
  const [formationSlots, setFormationSlots] = useState([]);
  const [pickedPlayers, setPickedPlayers] = useState({}); // { slotPos: demoPlayer }
  const [activeSlot, setActiveSlot]         = useState(null);
  const [options, setOptions]               = useState(null);
  const [isAnimatingOut, setIsAnimatingOut] = useState(false);
  const [pendingPick, setPendingPick]       = useState(null);
  const [poppingSlot, setPoppingSlot]       = useState(null);
  const [loadingFormations, setLoadingFormations] = useState(true);
  const [isDesktop, setIsDesktop] = useState(() => typeof window !== 'undefined' && window.innerWidth >= 1024);
  const animTimeoutsRef = useRef([]);
  const fieldRef = useRef(null);

  // Fetch formations to get slot data for pitch rendering
  useEffect(() => {
    fetch(`${API_URL}/formations`)
      .then(r => r.json())
      .then(data => {
        const f = (data.data || []).find(f => f.name === formation);
        setFormationSlots(f?.slots || []);
      })
      .catch(() => {})
      .finally(() => setLoadingFormations(false));
  }, [formation]);

  useEffect(() => {
    const fn = () => setIsDesktop(window.innerWidth >= 1024);
    window.addEventListener('resize', fn);
    return () => window.removeEventListener('resize', fn);
  }, []);

  useEffect(() => () => {
    animTimeoutsRef.current.forEach(clearTimeout);
  }, []);

  // Compute pitch layout
  const starterPlacements = useMemo(() => {
    if (!formationSlots.length) return [];
    return getFormationPreviewLayout({ name: formation, slots: formationSlots });
  }, [formation, formationSlots]);

  // Next empty slot
  const activeNextSlot = useMemo(() =>
    starterPlacements.find(s => !pickedPlayers[s.position]) ?? null,
    [starterPlacements, pickedPlayers]
  );

  const pickedCount = Object.keys(pickedPlayers).length;
  const pct = (pickedCount / 11) * 100;

  // Player options for a slot — demo players not yet used
  const getOptionsForSlot = (slotDetailedPosId) => {
    const usedIds = new Set(Object.values(pickedPlayers).map(p => p.id));
    // matchesDetailedPositionSlot from PickPanel handles filtering by position
    return DEMO_PLAYERS.filter(p => !usedIds.has(p.id));
  };

  const handleSlotClick = (slotPosition) => {
    if (pickedPlayers[slotPosition]) return;
    setActiveSlot(slotPosition);
    const slot = starterPlacements.find(s => s.position === slotPosition);
    setOptions(getOptionsForSlot(slot?.detailed_position_id));
  };

  const handlePickPlayer = (player) => {
    const slotPosition = activeSlot;
    let applied = false;

    setPendingPick({ player, slotPosition });
    setIsAnimatingOut(true);

    const t1 = setTimeout(() => {
      applied = true;
      const next = { ...pickedPlayers, [slotPosition]: player };
      setPickedPlayers(next);
      setPoppingSlot(slotPosition);
      setOptions(null);
      setActiveSlot(null);
      setIsAnimatingOut(false);
      setPendingPick(null);
      animTimeoutsRef.current = animTimeoutsRef.current.filter(id => id !== t1);

      if (Object.keys(next).length >= 11) {
        const t2 = setTimeout(() => {
          onConvert(Object.values(next), formationSlots);
          animTimeoutsRef.current = animTimeoutsRef.current.filter(id => id !== t2);
        }, 600);
        animTimeoutsRef.current.push(t2);
      } else {
        const t2 = setTimeout(() => {
          setPoppingSlot(null);
          animTimeoutsRef.current = animTimeoutsRef.current.filter(id => id !== t2);
        }, 500);
        animTimeoutsRef.current.push(t2);
      }
    }, 300);
    animTimeoutsRef.current.push(t1);
  };

  const activeSlotDetailedPositionId = useMemo(() => {
    if (!activeSlot) return null;
    return starterPlacements.find(s => s.position === activeSlot)?.detailed_position_id ?? null;
  }, [activeSlot, starterPlacements]);

  if (loadingFormations) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <p className="text-gray-400 animate-pulse">Carregando...</p>
      </div>
    );
  }

  const renderPitch = () => (
    <div className="pitch" data-theme="stadium" ref={fieldRef}>
      <div className="pl pl-frame" /><div className="pl pl-half" /><div className="pl pl-circle" />
      <div className="pl pl-spot" /><div className="pl pl-boxT" /><div className="pl pl-boxB" />
      <div className="pl pl-gaT" /><div className="pl pl-gaB" />

      {starterPlacements.map((slot) => {
        const posLabel  = getDetailedPositionLabel(slot.detailed_position_id) || '?';
        const lineColor = DRAFT_DETAIL_TO_LINE[slot.detailed_position_id] ?? 'var(--c-mid)';
        const cardPlayer = pickedPlayers[slot.position] ?? null;
        const isNextPick = activeNextSlot?.position === slot.position;
        const cardAnim = poppingSlot === slot.position
          ? { animation: 'card-pop 0.45s cubic-bezier(0.34,1.56,0.64,1) both' }
          : undefined;
        const posFullLabel = POS_FULL[posLabel] ?? posLabel;

        return (
          <div key={slot.key} className="slot" data-filled={cardPlayer ? 'true' : undefined}
            style={{ top: `${slot.top}%`, left: `${slot.left}%` }}>
            {cardPlayer ? (
              <div style={{ ...cardAnim, cursor: 'default' }}>
                <FieldPlayerPreview
                  player={cardPlayer}
                  posLabel={posLabel}
                  slotPositionId={slot.detailed_position_id}
                />
              </div>
            ) : (
              <div
                className={`fcard is-empty${isNextPick ? ' is-active' : ''}`}
                style={{ '--line-c': lineColor }}
                onClick={() => handleSlotClick(slot.position)}
              >
                <div className="fcard-veil" />
                <PlayerFigure kit={GRAY_KIT} number="" surname="" uid={`sil-${slot.position}`} className="sil" />
                {isNextPick && <div className="nexttag">PRÓXIMA</div>}
                <div className="fcard-body">
                  <div className="fcard-head"><span /><span className="fcard-pos">{posLabel}</span></div>
                </div>
                <div className="e-plus">+</div>
                <div className="e-label">{posFullLabel}</div>
              </div>
            )}
          </div>
        );
      })}
    </div>
  );

  const renderMobile = () => (
    <>
      <div className="dhead">
        <div className="dhead-brand">
          <span className="wm bricol"><Emblem s={26} />draft<span className="g">11</span></span>
          <span className="wc-tag"><span className="star">★</span> COPA 2026</span>
        </div>
        <div className="dhead-ctrl">
          <button className="dback" onClick={onBack}>‹ Sair</button>
          <span className="dphase">Titulares <span className="fmt">· {formation}</span></span>
          <span className="land-chip" style={{ fontSize: 9.5, padding: '3px 9px' }}>DEMO</span>
        </div>
        <div className="dprog">
          <span className="lab">{pickedCount}/11</span>
          <div className="bar"><div className="fill" style={{ width: `${pct}%` }} /></div>
        </div>
      </div>
      <div className="dfieldwrap">{renderPitch()}</div>

      {activeNextSlot && (() => {
        const lc = DRAFT_DETAIL_TO_LINE[activeNextSlot.detailed_position_id] ?? 'var(--c-mid)';
        const pfl = POS_FULL[getDetailedPositionLabel(activeNextSlot.detailed_position_id)] ??
          getDetailedPositionLabel(activeNextSlot.detailed_position_id) ?? '?';
        return (
          <div className="ddock">
            <div className="ddock-inner">
              <div className="fcard is-empty is-active"
                style={{ '--line-c': lc, '--fcw': '50px', flexShrink: 0 }}
                onClick={() => handleSlotClick(activeNextSlot.position)}>
                <div className="fcard-veil" />
                <PlayerFigure kit={GRAY_KIT} number="" surname="" uid="dock-next" className="sil" />
                <div className="nexttag">PRÓXIMA</div>
                <div className="fcard-body"><div className="fcard-head"><span /></div></div>
                <div className="e-plus">+</div>
              </div>
              <div className="grow">
                <div style={{ fontFamily: "'Bricolage Grotesque',sans-serif", fontWeight: 800, fontSize: 15, color: 'var(--text)' }}>{pfl}</div>
                <div style={{ fontSize: 10.5, color: 'var(--text-3)', marginTop: 2 }}>Toque na carta para escolher</div>
              </div>
              <button className="btn-pick" style={{ margin: 0, width: 'auto', padding: '0 18px', height: 42, whiteSpace: 'nowrap' }}
                onClick={() => handleSlotClick(activeNextSlot.position)}>
                Escolher <ArrowR />
              </button>
            </div>
          </div>
        );
      })()}
    </>
  );

  const renderDesktop = () => {
    const nextSlot = activeNextSlot;
    const nextLc = nextSlot ? (DRAFT_DETAIL_TO_LINE[nextSlot.detailed_position_id] ?? 'var(--c-mid)') : 'var(--c-mid)';
    const nextPosLabel = nextSlot
      ? (POS_FULL[getDetailedPositionLabel(nextSlot.detailed_position_id)] ?? getDetailedPositionLabel(nextSlot.detailed_position_id) ?? '?')
      : '?';

    return (
      <>
        <div className="rail rail-l">
          <div style={{ display: 'flex', alignItems: 'center', gap: 11 }}>
            <Emblem s={34} />
            <span className="bricol" style={{ fontWeight: 800, fontSize: 20, color: 'var(--text)' }}>
              draft<span style={{ color: 'var(--gold)' }}>11</span>
            </span>
          </div>
          <span className="wc-tag"><span className="star">★</span> COPA DO MUNDO 2026</span>
          <div className="rcard">
            <h4>Seu Time</h4>
            <div className="rrow"><span className="k">Formação</span><span className="v gold">{formation}</span></div>
            <div className="rrow"><span className="k">Fase</span><span className="v">Titulares</span></div>
            <div className="rrow"><span className="k">Escalados</span><span className="v">{pickedCount} / 11</span></div>
            <div className="rrow"><span className="k">Modo</span><span className="v" style={{ color: 'var(--gold-soft)' }}>Demo</span></div>
          </div>
          <div className="rcard">
            <h4>Progresso</h4>
            <div className="dprog">
              <span className="lab">{pickedCount}/11</span>
              <div className="bar"><div className="fill" style={{ width: `${pct}%` }} /></div>
            </div>
          </div>
          <div className="rail-spacer" />
          <button className="dpill" style={{ justifyContent: 'center', height: 38 }} onClick={onBack}>Sair</button>
        </div>

        <div className="pitch-center">{renderPitch()}</div>

        <div className="rail rail-r">
          {nextSlot && (
            <div className="nextpick" style={{ '--puck': nextLc }}>
              <div className="eyebrow">Próxima escolha</div>
              <div className="np-row">
                <div className="fcard is-empty is-active"
                  style={{ '--line-c': nextLc, '--fcw': '68px', flexShrink: 0 }}
                  onClick={() => handleSlotClick(nextSlot.position)}>
                  <div className="fcard-veil" />
                  <PlayerFigure kit={GRAY_KIT} number="" surname="" uid="rail-next" className="sil" />
                  <div className="nexttag">PRÓXIMA</div>
                  <div className="fcard-body"><div className="fcard-head"><span /></div></div>
                  <div className="e-plus">+</div>
                </div>
                <div>
                  <div className="np-name">{nextPosLabel}</div>
                  <div className="np-sub">{options?.length ?? '–'} jogadores disponíveis</div>
                </div>
              </div>
              <button className="btn-pick" onClick={() => handleSlotClick(nextSlot.position)}>
                Escolher jogador <ArrowR />
              </button>
            </div>
          )}
          <div className="rcard">
            <h4>Posições</h4>
            <div className="legend">
              <div className="li"><span className="sw" style={{ background: 'var(--c-gk)' }} /> Goleiro</div>
              <div className="li"><span className="sw" style={{ background: 'var(--c-def)' }} /> Defesa</div>
              <div className="li"><span className="sw" style={{ background: 'var(--c-mid)' }} /> Meio-campo</div>
              <div className="li"><span className="sw" style={{ background: 'var(--c-att)' }} /> Ataque</div>
            </div>
          </div>
          <div className="rail-spacer" />
        </div>
      </>
    );
  };

  return (
    <>
      <style>{`@keyframes card-pop{0%{transform:scale(0.3);opacity:0}60%{transform:scale(1.08);opacity:1}100%{transform:scale(1);opacity:1}}`}</style>

      {options && (
        <PickPanel
          options={options}
          slotDetailedPositionId={activeSlotDetailedPositionId}
          slotPosition={activeSlot}
          onPickPlayer={handlePickPlayer}
          onClose={() => { setOptions(null); setActiveSlot(null); }}
          fadingOut={isAnimatingOut}
        />
      )}

      <div className="dscreen" data-device={isDesktop ? 'desktop' : 'mobile'}>
        {isDesktop ? renderDesktop() : renderMobile()}
      </div>
    </>
  );
}
