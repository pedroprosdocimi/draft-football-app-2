// confrontoPlayers.js — Copa 2026 player data and game utilities

export const TEAM_ISO = {
  'Algeria': 'dz', 'Argentina': 'ar', 'Australia': 'au', 'Austria': 'at',
  'Belgium': 'be', 'Bosnia and Herzegovina': 'ba', 'Brazil': 'br', 'Canada': 'ca',
  'Cape Verde': 'cv', 'Colombia': 'co', "Côte d'Ivoire": 'ci', 'Croatia': 'hr',
  'Curaçao': 'cw', 'Czechia': 'cz', 'DR Congo': 'cd', 'Ecuador': 'ec',
  'Egypt': 'eg', 'England': 'gb-eng', 'France': 'fr', 'Germany': 'de',
  'Ghana': 'gh', 'Haiti': 'ht', 'Iran': 'ir', 'Iraq': 'iq', 'Japan': 'jp',
  'Jordan': 'jo', 'Mexico': 'mx', 'Morocco': 'ma', 'Netherlands': 'nl',
  'New Zealand': 'nz', 'Norway': 'no', 'Panama': 'pa', 'Paraguay': 'py',
  'Portugal': 'pt', 'Qatar': 'qa', 'Saudi Arabia': 'sa', 'Scotland': 'gb-sct',
  'Senegal': 'sn', 'South Africa': 'za', 'South Korea': 'kr', 'Spain': 'es',
  'Sweden': 'se', 'Switzerland': 'ch', 'Tunisia': 'tn', 'Turkey': 'tr',
  'Uruguay': 'uy', 'USA': 'us', 'Uzbekistan': 'uz',
};

export const TEAM_PT = {
  'Algeria': 'Argélia', 'Argentina': 'Argentina', 'Australia': 'Austrália',
  'Austria': 'Áustria', 'Belgium': 'Bélgica', 'Bosnia and Herzegovina': 'Bósnia',
  'Brazil': 'Brasil', 'Canada': 'Canadá', 'Cape Verde': 'Cabo Verde',
  'Colombia': 'Colômbia', "Côte d'Ivoire": 'Costa do Marfim', 'Croatia': 'Croácia',
  'Curaçao': 'Curaçao', 'Czechia': 'Rep. Tcheca', 'DR Congo': 'RD Congo',
  'Ecuador': 'Equador', 'Egypt': 'Egito', 'England': 'Inglaterra',
  'France': 'França', 'Germany': 'Alemanha', 'Ghana': 'Gana', 'Haiti': 'Haiti',
  'Iran': 'Irã', 'Iraq': 'Iraque', 'Japan': 'Japão', 'Jordan': 'Jordânia',
  'Mexico': 'México', 'Morocco': 'Marrocos', 'Netherlands': 'Holanda',
  'New Zealand': 'Nova Zelândia', 'Norway': 'Noruega', 'Panama': 'Panamá',
  'Paraguay': 'Paraguai', 'Portugal': 'Portugal', 'Qatar': 'Catar',
  'Saudi Arabia': 'Arábia Saudita', 'Scotland': 'Escócia', 'Senegal': 'Senegal',
  'South Africa': 'África do Sul', 'South Korea': 'Coreia do Sul', 'Spain': 'Espanha',
  'Sweden': 'Suécia', 'Switzerland': 'Suíça', 'Tunisia': 'Tunísia',
  'Turkey': 'Turquia', 'Uruguay': 'Uruguai', 'USA': 'EUA', 'Uzbekistan': 'Uzbequistão',
};

export const FC26_TO_SLOT = {
  GK: 'gol', CB: 'zag', SW: 'zag',
  RB: 'ld', RWB: 'ld',
  LB: 'le', LWB: 'le',
  CDM: 'vol', DM: 'vol',
  CM: 'mc',
  CAM: 'mei', AM: 'mei',
  LM: 'pe', LW: 'pe',
  RM: 'pd', RW: 'pd',
  ST: 'ata', CF: 'ata', SS: 'ata',
};

export const FORMATIONS = {
  '4-3-3': {
    tag: 'Ataque pelos lados',
    dots: [
      ['att',23,18],['att',50,12],['att',77,18],
      ['mid',28,40],['mid',50,45],['mid',72,40],
      ['def',16,66],['def',39,68],['def',61,68],['def',84,66],
      ['gk',50,88],
    ],
    slots: [
      { key:'gol', pos:'GOL', line:'gk',  top:87, left:50, slotType:'gol' },
      { key:'le',  pos:'LE',  line:'def', top:64, left:15, slotType:'le'  },
      { key:'zg1', pos:'ZAG', line:'def', top:67, left:39, slotType:'zag' },
      { key:'zg2', pos:'ZAG', line:'def', top:67, left:61, slotType:'zag' },
      { key:'ld',  pos:'LD',  line:'def', top:64, left:85, slotType:'ld'  },
      { key:'vol', pos:'VOL', line:'mid', top:38, left:26, slotType:'vol' },
      { key:'mc',  pos:'MC',  line:'mid', top:43, left:50, slotType:'mc'  },
      { key:'mei', pos:'MEI', line:'mid', top:38, left:74, slotType:'mei' },
      { key:'pe',  pos:'PE',  line:'att', top:16, left:22, slotType:'pe'  },
      { key:'ata', pos:'ATA', line:'att', top:11, left:50, slotType:'ata' },
      { key:'pd',  pos:'PD',  line:'att', top:16, left:78, slotType:'pd'  },
    ],
  },
  '4-4-2': {
    tag: 'Clássico equilibrado',
    dots: [
      ['att',38,15],['att',62,15],
      ['mid',16,42],['mid',39,44],['mid',61,44],['mid',84,42],
      ['def',16,68],['def',39,69],['def',61,69],['def',84,68],
      ['gk',50,88],
    ],
    slots: [
      { key:'gol', pos:'GOL', line:'gk',  top:87, left:50, slotType:'gol' },
      { key:'le',  pos:'LE',  line:'def', top:65, left:15, slotType:'le'  },
      { key:'zg1', pos:'ZAG', line:'def', top:67, left:38, slotType:'zag' },
      { key:'zg2', pos:'ZAG', line:'def', top:67, left:62, slotType:'zag' },
      { key:'ld',  pos:'LD',  line:'def', top:65, left:85, slotType:'ld'  },
      { key:'pe',  pos:'PE',  line:'mid', top:40, left:15, slotType:'pe'  },
      { key:'mc1', pos:'MC',  line:'mid', top:43, left:38, slotType:'mc'  },
      { key:'mc2', pos:'MC',  line:'mid', top:43, left:62, slotType:'mc'  },
      { key:'pd',  pos:'PD',  line:'mid', top:40, left:85, slotType:'pd'  },
      { key:'at1', pos:'ATA', line:'att', top:13, left:37, slotType:'ata' },
      { key:'at2', pos:'ATA', line:'att', top:13, left:63, slotType:'ata' },
    ],
  },
  '3-5-2': {
    tag: 'Meio sufocante',
    dots: [
      ['att',38,15],['att',62,15],
      ['mid',14,44],['mid',34,40],['mid',50,46],['mid',66,40],['mid',86,44],
      ['def',30,69],['def',50,71],['def',70,69],
      ['gk',50,88],
    ],
    slots: [
      { key:'gol', pos:'GOL', line:'gk',  top:87, left:50, slotType:'gol' },
      { key:'zg1', pos:'ZAG', line:'def', top:68, left:30, slotType:'zag' },
      { key:'zg2', pos:'ZAG', line:'def', top:70, left:50, slotType:'zag' },
      { key:'zg3', pos:'ZAG', line:'def', top:68, left:70, slotType:'zag' },
      { key:'le',  pos:'LE',  line:'mid', top:43, left:13, slotType:'le'  },
      { key:'vol', pos:'VOL', line:'mid', top:39, left:33, slotType:'vol' },
      { key:'mc',  pos:'MC',  line:'mid', top:45, left:50, slotType:'mc'  },
      { key:'mei', pos:'MEI', line:'mid', top:39, left:67, slotType:'mei' },
      { key:'ld',  pos:'LD',  line:'mid', top:43, left:87, slotType:'ld'  },
      { key:'at1', pos:'ATA', line:'att', top:13, left:37, slotType:'ata' },
      { key:'at2', pos:'ATA', line:'att', top:13, left:63, slotType:'ata' },
    ],
  },
  '4-2-3-1': {
    tag: 'Camisa 10 livre',
    dots: [
      ['att',50,13],
      ['mid',28,30],['mid',50,34],['mid',72,30],
      ['mid',36,52],['mid',64,52],
      ['def',16,70],['def',39,71],['def',61,71],['def',84,70],
      ['gk',50,88],
    ],
    slots: [
      { key:'gol',  pos:'GOL', line:'gk',  top:87, left:50, slotType:'gol' },
      { key:'le',   pos:'LE',  line:'def', top:69, left:15, slotType:'le'  },
      { key:'zg1',  pos:'ZAG', line:'def', top:70, left:38, slotType:'zag' },
      { key:'zg2',  pos:'ZAG', line:'def', top:70, left:62, slotType:'zag' },
      { key:'ld',   pos:'LD',  line:'def', top:69, left:85, slotType:'ld'  },
      { key:'vol1', pos:'VOL', line:'mid', top:51, left:35, slotType:'vol' },
      { key:'vol2', pos:'VOL', line:'mid', top:51, left:65, slotType:'vol' },
      { key:'pe',   pos:'PE',  line:'mid', top:29, left:27, slotType:'pe'  },
      { key:'mei',  pos:'MEI', line:'mid', top:33, left:50, slotType:'mei' },
      { key:'pd',   pos:'PD',  line:'mid', top:29, left:73, slotType:'pd'  },
      { key:'ata',  pos:'ATA', line:'att', top:12, left:50, slotType:'ata' },
    ],
  },
  '3-4-3': {
    tag: 'Pressão total',
    dots: [
      ['att',24,16],['att',50,12],['att',76,16],
      ['mid',18,42],['mid',40,45],['mid',60,45],['mid',82,42],
      ['def',30,69],['def',50,71],['def',70,69],
      ['gk',50,88],
    ],
    slots: [
      { key:'gol', pos:'GOL', line:'gk',  top:87, left:50, slotType:'gol' },
      { key:'zg1', pos:'ZAG', line:'def', top:68, left:30, slotType:'zag' },
      { key:'zg2', pos:'ZAG', line:'def', top:70, left:50, slotType:'zag' },
      { key:'zg3', pos:'ZAG', line:'def', top:68, left:70, slotType:'zag' },
      { key:'le',  pos:'LE',  line:'mid', top:44, left:17, slotType:'le'  },
      { key:'mc1', pos:'MC',  line:'mid', top:44, left:39, slotType:'mc'  },
      { key:'mc2', pos:'MC',  line:'mid', top:44, left:61, slotType:'mc'  },
      { key:'ld',  pos:'LD',  line:'mid', top:44, left:83, slotType:'ld'  },
      { key:'pe',  pos:'PE',  line:'att', top:15, left:23, slotType:'pe'  },
      { key:'ata', pos:'ATA', line:'att', top:11, left:50, slotType:'ata' },
      { key:'pd',  pos:'PD',  line:'att', top:15, left:77, slotType:'pd'  },
    ],
  },
};

let _cache = null;

export async function loadPlayers() {
  if (_cache) return _cache;
  const res = await fetch('/data/jogadores.csv');
  const text = await res.text();
  const lines = text.trim().split('\n');
  const header = lines[0].split(',');
  const idx = (col) => header.indexOf(col);

  const iSel  = idx('Seleção');
  const iNum  = idx('Nº');
  const iNome = idx('Nome');
  const iPos  = idx('FC26_Posição');
  const iOvr  = idx('Overall');

  const players = [];
  for (let i = 1; i < lines.length; i++) {
    const cols = lines[i].split(',');
    if (cols.length < 10) continue;
    const ovr = parseInt(cols[iOvr], 10);
    if (isNaN(ovr)) continue;
    const team = cols[iSel]?.trim();
    const fc26pos = cols[iPos]?.trim();
    const slotType = FC26_TO_SLOT[fc26pos] || null;
    if (!slotType || !team || !TEAM_ISO[team]) continue;
    const iso = TEAM_ISO[team];
    const name = cols[iNome]?.trim() || '';
    players.push({
      id: `${team}-${cols[iNum]}-${i}`,
      team,
      teamPt: TEAM_PT[team] || team,
      iso,
      number: parseInt(cols[iNum], 10) || 0,
      name,
      surname: makeSurname(name),
      slotType,
      ovr,
    });
  }

  players.sort((a, b) => b.ovr - a.ovr);
  _cache = players;
  return players;
}

function makeSurname(name) {
  if (!name) return '';
  const parts = name.trim().split(' ');
  const last = parts[parts.length - 1].toUpperCase();
  return last.length > 7 ? last.slice(0, 6) + '.' : last;
}

export function getOptionsForSlot(players, slotType, usedIds = new Set()) {
  const pool = players.filter(p => p.slotType === slotType && !usedIds.has(p.id));
  if (pool.length === 0) return [];
  const top2 = pool.slice(0, 2);
  const rest = [...pool.slice(2)].sort(() => Math.random() - 0.5).slice(0, 3);
  const combined = [...top2, ...rest];
  return combined.sort(() => Math.random() - 0.5);
}

export function buildGroupDraw(players) {
  const allTeams = Object.keys(TEAM_ISO);
  const shuffled = [...allTeams].sort(() => Math.random() - 0.5);
  const letters = 'ABCDEFGHIJKL';
  const letter = letters[Math.floor(Math.random() * 12)];
  const opponents = shuffled.slice(0, 3).map(t => ({
    name: t,
    namePt: TEAM_PT[t] || t,
    iso: TEAM_ISO[t],
    strength: getTeamStrength(players, t),
  }));
  return { letter, opponents };
}

export function buildKODraw(players, groupTeams) {
  const allTeams = Object.keys(TEAM_ISO).filter(t => !groupTeams.includes(t));
  const shuffled = [...allTeams].sort(() => Math.random() - 0.5).slice(0, 5);
  return shuffled.map(t => ({
    name: t,
    namePt: TEAM_PT[t] || t,
    iso: TEAM_ISO[t],
    strength: getTeamStrength(players, t),
  }));
}

export function getTeamStrength(players, teamName) {
  const tp = players.filter(p => p.team === teamName);
  if (tp.length === 0) return 72;
  return Math.round(tp.reduce((s, p) => s + p.ovr, 0) / tp.length);
}
