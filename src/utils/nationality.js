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
