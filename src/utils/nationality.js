// Maps the `nationality` string from the API (from Sportmonks) to ISO 3166-1 alpha-2.
// SportMonks returns country names (e.g. "Brazil"), not adjectives (e.g. "Brazilian").
// Both forms are mapped for compatibility.
const NATIONALITY_ISO2 = {
  // South America — country names (SportMonks format)
  'Brazil':       'br',
  'Argentina':    'ar',
  'Uruguay':      'uy',
  'Colombia':     'co',
  'Chile':        'cl',
  'Paraguay':     'py',
  'Bolivia':      'bo',
  'Peru':         'pe',
  'Ecuador':      'ec',
  'Venezuela':    've',

  // South America — adjective forms (fallback)
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

  // Europe — country names
  'Portugal':     'pt',
  'Spain':        'es',
  'France':       'fr',
  'Germany':      'de',
  'Italy':        'it',
  'England':      'gb-eng',
  'Netherlands':  'nl',
  'Belgium':      'be',
  'Croatia':      'hr',
  'Serbia':       'rs',
  'Denmark':      'dk',
  'Sweden':       'se',
  'Norway':       'no',
  'Switzerland':  'ch',
  'Austria':      'at',
  'Poland':       'pl',
  'Czech Republic': 'cz',
  'Slovakia':     'sk',
  'Hungary':      'hu',
  'Romania':      'ro',
  'Bulgaria':     'bg',
  'Ukraine':      'ua',
  'Russia':       'ru',
  'Greece':       'gr',
  'Turkey':       'tr',

  // Europe — adjective forms (fallback)
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

  // Africa — country names
  'Senegal':      'sn',
  'Nigeria':      'ng',
  "Côte d'Ivoire": 'ci',
  'Ghana':        'gh',
  'Morocco':      'ma',
  'Algeria':      'dz',
  'Tunisia':      'tn',
  'Egypt':        'eg',
  'Cameroon':     'cm',
  'Mali':         'ml',
  'Guinea':       'gn',

  // Africa — adjective forms (fallback)
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

  // Others — country names
  'Mexico':       'mx',
  'United States': 'us',
  'Canada':       'ca',
  'Japan':        'jp',
  'South Korea':  'kr',
  'Australia':    'au',

  // Others — adjective forms (fallback)
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
