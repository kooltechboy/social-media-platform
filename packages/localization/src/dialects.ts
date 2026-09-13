/**
 * TUKUBI Caribbean Dialect Subsystem & Linguistic Lexicons
 * Authentic dialect detection, phonetic markers, and bidirectional translation matrices
 * for Jamaican Patois, Haitian Creole, Papiamentu, Trinidadian Creole, Guyanese, and Bahamian.
 */

export type CaribbeanDialect =
  | 'jam' // Jamaican Patois
  | 'ht'  // Haitian Creole (Kreyòl Ayisyen)
  | 'pap' // Papiamentu / Papiamento
  | 'tri' // Trinidadian Creole
  | 'guy' // Guyanese Creole
  | 'bah' // Bahamian Creole
  | 'general';

export interface DialectMeta {
  code: CaribbeanDialect;
  name: string;
  nativeName: string;
  flag: string;
  territory: string;
  sampleGreeting: string;
}

export const CARIBBEAN_DIALECT_DETAILS: Record<CaribbeanDialect, DialectMeta> = {
  jam: {
    code: 'jam',
    name: 'Jamaican Patois',
    nativeName: 'Patwa',
    flag: '🇯🇲',
    territory: 'Jamaica & Diaspora',
    sampleGreeting: 'Wah gwaan!',
  },
  ht: {
    code: 'ht',
    name: 'Haitian Creole',
    nativeName: 'Kreyòl Ayisyen',
    flag: '🇭🇹',
    territory: 'Haiti & Diaspora',
    sampleGreeting: 'Sak pase!',
  },
  pap: {
    code: 'pap',
    name: 'Papiamentu',
    nativeName: 'Papiamentu',
    flag: '🇨🇼',
    territory: 'Curaçao, Aruba, Bonaire',
    sampleGreeting: 'Con ta bay!',
  },
  tri: {
    code: 'tri',
    name: 'Trinidadian Creole',
    nativeName: 'Trini Creole',
    flag: '🇹🇹',
    territory: 'Trinidad & Tobago',
    sampleGreeting: 'Aye, how yuh doin lime!',
  },
  guy: {
    code: 'guy',
    name: 'Guyanese Creole',
    nativeName: 'Creolese',
    flag: '🇬🇾',
    territory: 'Guyana & Diaspora',
    sampleGreeting: 'Awe deh pon lime!',
  },
  bah: {
    code: 'bah',
    name: 'Bahamian Creole',
    nativeName: 'Bahamian Dialect',
    flag: '🇧🇸',
    territory: 'The Bahamas',
    sampleGreeting: 'What da vibe is!',
  },
  general: {
    code: 'general',
    name: 'Caribbean English',
    nativeName: 'Caribbean Vernacular',
    flag: '🌴',
    territory: 'Pan-Caribbean',
    sampleGreeting: 'Bless up!',
  },
};

/**
 * Phonetic & Lexical Dialect Markers used for high-precision dialect classification.
 */
export const DIALECT_LEXICON_MARKERS: Record<CaribbeanDialect, { words: RegExp[]; phrases: RegExp[] }> = {
  jam: {
    words: [
      /\b(wah|gwaan|deh|yah|likkle|pickney|nyam|irie|brawta|bredren|sistren|dutty|nuh|inna|fi|dem|unnu|mi|yuh|suh|pon|di|gyal|bwoy|banton|riddim|chander|mashup|tallup)\b/i,
      /\b(soon come|big up|seen|boonoonoonoos|walk good|hold a vibes)\b/i,
    ],
    phrases: [
      /\bwah\s+gwaan\b/i,
      /\bmi\s+deh\s+yah\b/i,
      /\bevery\s+ting\s+criss\b/i,
      /\bbig\s+up\s+unu\b/i,
      /\bwicked\s+and\s+wild\b/i,
      /\bhold\s+a\s+vibe\b/i,
    ],
  },
  ht: {
    words: [
      /\b(sak|pase|boule|mwen|ou|li|nou|yo|bel|koman|kòman|zanmi|chache|fè|tout|bagay|konnen|pale|lakay|kote|kijan|pouki|menm|ankò|voye|pataje|pibliye)\b/i,
      /\b(k'ap|m'ap|l'ap|pa gen|nap boule|an nou|tout moun)\b/i,
    ],
    phrases: [
      /\bsak\s+pase\b/i,
      /\bn('?ap|ap)\s+boule\b/i,
      /\bk(o|ò)man\s+ou\s+ye\b/i,
      /\bmwen\s+la\b/i,
      /\btout\s+moun\b/i,
      /\blakay\s+se\s+lakay\b/i,
    ],
  },
  pap: {
    words: [
      /\b(bon|dushi|hopi|danki|tur|kos|ku|pa|ta|di|mi|bo|nos|nan|kiko|con|tardi|anochi|warda|kas|hende|kombersashon|amigu|bida|awor|kuminda)\b/i,
      /\b(con ta bay|bon bini|pasa un bon dia|tur kos bon|dushi yiu)\b/i,
    ],
    phrases: [
      /\bcon\s+ta\s+bay\b/i,
      /\bbon\s+bini\b/i,
      /\btur\s+kos\s+bon\b/i,
      /\bhopi\s+dushi\b/i,
      /\bmasha\s+danki\b/i,
      /\bbon\s+tardi\b/i,
    ],
  },
  tri: {
    words: [
      /\b(lime|liming|bacchanal|tabanca|chutney|soca|doubles|doh|yuh|crapaud|steups|bobol|mamaguy|gyul|fete|parang|roti|ting)\b/i,
      /\b(doh study dat|we lime|crapo smoke he pipe|le we go)\b/i,
    ],
    phrases: [
      /\bdoh\s+study\s+dat\b/i,
      /\blet\s+we\s+lime\b/i,
      /\bhot\s+doubles\b/i,
      /\bplay\s+mas\b/i,
      /\bsweet\s+soca\b/i,
    ],
  },
  guy: {
    words: [
      /\b(awe|deh|pon|lime|skettel|daffy|rooti|bake|koker|bush|matt|plait|chowmein|banna)\b/i,
      /\b(awe deh pon|leh we go|nah man)\b/i,
    ],
    phrases: [
      /\bawe\s+deh\s+pon\b/i,
      /\bleh\s+we\s+go\b/i,
      /\bnah\s+man\b/i,
    ],
  },
  bah: {
    words: [
      /\b(switcha|bey|conch|mudda|potcake|junkanoo|souse|crack|guava|duff)\b/i,
      /\b(well mudda sick|what da vibe is|das right)\b/i,
    ],
    phrases: [
      /\bwell\s+mudda\s+sick\b/i,
      /\bwhat\s+da\s+vibe\s+is\b/i,
      /\bconch\s+salad\b/i,
    ],
  },
  general: {
    words: [
      /\b(caribbean|island|diaspora|carnival|reggae|dancehall|calypso|steelpan|vibes|carib)\b/i,
    ],
    phrases: [
      /\bone\s+love\b/i,
      /\bbless\s+up\b/i,
    ],
  },
};

/**
 * Standard bilingual translation dictionary mapping vernacular phrases to Standard English.
 */
export const VERNACULAR_TRANSLATIONS: Record<string, { en: string; fr?: string; es?: string }> = {
  // Jamaican Patois
  'wah gwaan': { en: "What's going on", fr: 'Comment ça va', es: '¿Qué pasa?' },
  'wah gwaan fam': { en: "What's going on family", fr: 'Comment va la famille', es: '¿Qué pasa familia?' },
  'mi deh yah': { en: "I'm right here / Doing well", fr: 'Je suis là / Tout va bien', es: 'Estoy aquí / Todo bien' },
  'likkle more': { en: 'See you later', fr: 'À plus tard', es: 'Hasta luego' },
  'walk good': { en: 'Safe travels / Take care', fr: 'Prends soin de toi', es: 'Buen viaje / Cuídate' },
  'soon come': { en: "I'll be right there", fr: "J'arrive bientôt", es: 'Ya vengo' },
  'big up': { en: 'Shoutout to / Respect', fr: 'Chapeau bas à', es: 'Un saludo a' },
  'nuff respect': { en: 'Much respect', fr: 'Grand respect', es: 'Mucho respeto' },
  'nyam': { en: 'Eat', fr: 'Manger', es: 'Comer' },
  'pickney': { en: 'Child / Children', fr: 'Enfant(s)', es: 'Niño(s)' },
  'brawta': { en: 'A little extra bonus', fr: 'Un bonus en plus', es: 'Un extra' },
  'everyting criss': { en: 'Everything is great', fr: 'Tout va super bien', es: 'Todo excelente' },
  'inna real life': { en: 'In reality / For real', fr: 'Dans la vraie vie', es: 'En la vida real' },
  'mash up': { en: 'Break down / Electrify the crowd', fr: 'Déchirer / Enflammer', es: 'Romperla / Destrozar' },
  'deh pon': { en: 'Focused on / Doing', fr: 'En train de faire', es: 'Enfocado en' },

  // Haitian Creole
  'sak pase': { en: "What's up", fr: "Qu'est-ce qui se passe", es: '¿Qué pasa?' },
  "n'ap boule": { en: "We're doing great", fr: 'On est bien / Ça roule', es: 'Estamos de maravilla' },
  'nap boule': { en: "We're doing great", fr: 'On est bien / Ça roule', es: 'Estamos de maravilla' },
  'kòman ou ye': { en: 'How are you', fr: 'Comment vas-tu', es: '¿Cómo estás?' },
  'koman ou ye': { en: 'How are you', fr: 'Comment vas-tu', es: '¿Cómo estás?' },
  'mwen renmen ou': { en: 'I love you', fr: 'Je t’aime', es: 'Te quiero' },
  'mwen la': { en: "I'm holding on / I'm here", fr: 'Je suis là', es: 'Aquí estoy' },
  'an nou ale': { en: "Let's go", fr: 'Allons-y', es: 'Vámonos' },
  'tout moun': { en: 'Everyone', fr: 'Tout le monde', es: 'Todo el mundo' },
  'lakay': { en: 'Home', fr: 'La maison / Chez soi', es: 'Hogar / Casa' },

  // Papiamentu
  'con ta bay': { en: 'How is it going', fr: 'Comment ça va', es: '¿Cómo te va?' },
  'bon bini': { en: 'Welcome', fr: 'Bienvenue', es: 'Bienvenido' },
  'dushi yiu': { en: 'Sweet darling / Beautiful person', fr: 'Ma douce / Très gentil', es: 'Mi amor / Qué dulce' },
  'hopi bon': { en: 'Very good / Awesome', fr: 'Très bien / Génial', es: 'Muy bueno / Excelente' },
  'tur kos bon': { en: 'All is well', fr: 'Tout va pour le mieux', es: 'Todo bien' },
  'masha danki': { en: 'Thank you very much', fr: 'Merci beaucoup', es: 'Muchas gracias' },
  'bon tardi': { en: 'Good afternoon', fr: 'Bon après-midi', es: 'Buenas tardes' },
  'dushi': { en: 'Sweet / Lovely', fr: 'Doux / Mignon', es: 'Dulce / Hermoso' },

  // Trinidadian Creole
  'doh study dat': { en: "Don't worry about that", fr: "Ne t'en fais pas", es: 'No te preocupes por eso' },
  'let we lime': { en: "Let's hang out and chill", fr: 'Allons traîner ensemble', es: 'Vamos a pasar el rato' },
  'liming': { en: 'Hanging out socially', fr: 'Traîner entre amis', es: 'Pasando el rato' },
  'bacchanal': { en: 'Wild party / Drama', fr: 'Fête déchaînée / Tumulte', es: 'Gran fiesta / Alboroto' },
  'tabanca': { en: 'Love-sickness / Heartbreak', fr: 'Chagrin d’amour', es: 'Mal de amores' },
};

/**
 * Detects the Caribbean dialect of a given text segment.
 * Returns the dialect code, confidence score (0.0 - 1.0), and detected key markers.
 */
export function detectCaribbeanDialect(text: string): {
  dialect: CaribbeanDialect;
  confidence: number;
  matchedMarkers: string[];
} {
  if (!text || !text.trim()) {
    return { dialect: 'general', confidence: 0, matchedMarkers: [] };
  }

  const normalized = text.toLowerCase();
  const scores: Record<CaribbeanDialect, { count: number; markers: string[] }> = {
    jam: { count: 0, markers: [] },
    ht: { count: 0, markers: [] },
    pap: { count: 0, markers: [] },
    tri: { count: 0, markers: [] },
    guy: { count: 0, markers: [] },
    bah: { count: 0, markers: [] },
    general: { count: 0, markers: [] },
  };

  for (const [dialectKey, config] of Object.entries(DIALECT_LEXICON_MARKERS) as [CaribbeanDialect, { words: RegExp[]; phrases: RegExp[] }][]) {
    // Check phrases (higher weight)
    for (const phraseRegex of config.phrases) {
      const match = normalized.match(phraseRegex);
      if (match) {
        scores[dialectKey].count += 3;
        scores[dialectKey].markers.push(match[0]);
      }
    }

    // Check individual words
    for (const wordRegex of config.words) {
      const matches = normalized.match(new RegExp(wordRegex.source, 'gi'));
      if (matches) {
        scores[dialectKey].count += matches.length;
        scores[dialectKey].markers.push(...matches.slice(0, 3));
      }
    }
  }

  // Find dialect with the highest score
  let bestDialect: CaribbeanDialect = 'general';
  let maxScore = 0;

  for (const [dialectKey, scoreObj] of Object.entries(scores) as [CaribbeanDialect, { count: number; markers: string[] }][]) {
    if (scoreObj.count > maxScore) {
      maxScore = scoreObj.count;
      bestDialect = dialectKey;
    }
  }

  if (maxScore === 0) {
    return { dialect: 'general', confidence: 0.1, matchedMarkers: [] };
  }

  // Normalize confidence into [0.4, 0.99]
  const confidence = Math.min(0.99, Math.max(0.4, maxScore / 5));
  const uniqueMarkers = Array.from(new Set(scores[bestDialect].markers));

  return {
    dialect: bestDialect,
    confidence,
    matchedMarkers: uniqueMarkers,
  };
}

/**
 * Translates a Caribbean dialect phrase or sentence into Standard English, French, or Spanish.
 * Uses exact vernacular lookup with heuristic sentence reconstruction.
 */
export function translateDialectText(
  text: string,
  targetLang: 'en' | 'fr' | 'es' = 'en'
): {
  translatedText: string;
  hasTranslation: boolean;
  replacementsCount: number;
} {
  if (!text || !text.trim()) {
    return { translatedText: text, hasTranslation: false, replacementsCount: 0 };
  }

  let result = text;
  let replacementsCount = 0;

  // Sort known dictionary entries by length descending to match longer multi-word idioms first
  const entries = Object.entries(VERNACULAR_TRANSLATIONS).sort(
    ([a], [b]) => b.length - a.length
  );

  for (const [phrase, trans] of entries) {
    const targetPhrase = targetLang === 'fr' && trans.fr ? trans.fr : targetLang === 'es' && trans.es ? trans.es : trans.en;
    const regex = new RegExp(`\\b${escapeRegExp(phrase)}\\b`, 'gi');

    if (regex.test(result)) {
      result = result.replace(regex, (matched) => {
        replacementsCount++;
        // Preserve title case if source was capitalized
        if (matched[0] === matched[0].toUpperCase()) {
          return targetPhrase.charAt(0).toUpperCase() + targetPhrase.slice(1);
        }
        return targetPhrase;
      });
    }
  }

  return {
    translatedText: result,
    hasTranslation: replacementsCount > 0,
    replacementsCount,
  };
}

function escapeRegExp(str: string): string {
  return str.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}
