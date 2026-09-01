// Production Translation Service Abstraction for TUKUBI
// Provider-agnostic architecture: CaribAI / OpenRouter, Cloud Translation, & Local Heuristic
import { Locale, LOCALES, DEFAULT_LOCALE, LOCALE_DETAILS, LocaleMeta } from './index';

export interface TranslationResult {
  translatedText: string;
  sourceLang: Locale | 'und';
  targetLang: Locale;
  provider: string;
  cached?: boolean;
}

export interface LanguageDetectionResult {
  language: Locale | 'und';
  confidence: number;
}

export interface ITranslationProvider {
  name: string;
  detectLanguage(text: string): Promise<LanguageDetectionResult>;
  translate(text: string, sourceLang: Locale | 'und', targetLang: Locale): Promise<string>;
}

// 1. Context-aware token protection (protect usernames, hashtags, URLs, and TUKUBI brand)
export function protectTokens(text: string): { protectedText: string; restoreMap: Map<string, string> } {
  const restoreMap = new Map<string, string>();
  let counter = 0;

  // Protect URLs
  let processed = text.replace(/https?:\/\/[^\s]+/gi, (match) => {
    const placeholder = `__URL_${counter++}__`;
    restoreMap.set(placeholder, match);
    return placeholder;
  });

  // Protect @usernames
  processed = processed.replace(/@[a-zA-Z0-9_.-]+/g, (match) => {
    const placeholder = `__USER_${counter++}__`;
    restoreMap.set(placeholder, match);
    return placeholder;
  });

  // Protect #hashtags
  processed = processed.replace(/#[a-zA-Z0-9_.-]+/g, (match) => {
    const placeholder = `__TAG_${counter++}__`;
    restoreMap.set(placeholder, match);
    return placeholder;
  });

  // Protect TUKUBI brand
  processed = processed.replace(/\bTUKUBI\b/g, (match) => {
    const placeholder = `__BRAND_${counter++}__`;
    restoreMap.set(placeholder, match);
    return placeholder;
  });

  return { protectedText: processed, restoreMap };
}

export function restoreTokens(text: string, restoreMap: Map<string, string>): string {
  let result = text;
  for (const [placeholder, original] of restoreMap.entries()) {
    result = result.split(placeholder).join(original);
  }
  return result;
}

// Deterministic hash for content caching
export function computeContentHash(text: string): string {
  const normalized = text.trim().toLowerCase();
  let hash1 = 5381;
  let hash2 = 52711;
  for (let i = 0; i < normalized.length; i++) {
    const char = normalized.charCodeAt(i);
    hash1 = (hash1 * 33) ^ char;
    hash2 = (hash2 * 33) ^ char;
  }
  const h1 = (hash1 >>> 0).toString(16).padStart(8, '0');
  const h2 = (hash2 >>> 0).toString(16).padStart(8, '0');
  return `${h1}${h2}`.repeat(4).slice(0, 64);
}

// 2. Caribbean-Aware Heuristic Language Detector & Translator (Zero-latency fallback)
const DIALECT_MARKERS: Record<Locale, RegExp[]> = {
  ht: [
    /\b(mwen|nou|yo|li|nouvo|kisa|kòman|ayiti|zanmi|pwofil|kominote|pataje|pibliye|renmen|konprann|bel|voye)\b/i,
    /\b(k'ap|m'ap|l'ap|pa gen|kote|sak pase|nap boule)\b/i
  ],
  pap: [
    /\b(bon|dushi|mi|bo|nos|nan|ku|pa|kiko|ta|tambe|hopi|korsou|aruba|bonaire|papiamentu|merka|kas|warda)\b/i,
    /\b(con ta bay|tur kos|bon tardi|bon dia|danki|konversashon)\b/i
  ],
  es: [
    /\b(hola|amigos|bienvenidos|buenos|días|noches|cómo|estás|gracias|todos|para|este|esta|comentarios|publicar)\b/i,
    /[áéíóúñ¿¡]/i
  ],
  fr: [
    /\b(bonjour|salut|merci|bienvenue|tous|comment|allez|vous|avec|pour|notre|amis|direct|rejoindre|partager)\b/i,
    /[éèêëàâçîïôûù]/i
  ],
  nl: [
    /\b(hallo|goedemorgen|welkom|vrienden|hoe|gaat|het|met|jou|allemaal|nieuwste|berichten|delen|opslaan)\b/i,
    /\b(gefeliciteerd|tot ziens|alsjeblieft|dankjewel)\b/i
  ],
  en: [
    /\b(hello|welcome|everyone|morning|great|hope|have|nice|following|friends|latest|share|comment|post)\b/i,
    /\b(the|and|for|with|this|that|from|what's happening)\b/i
  ]
};

export class RobustHeuristicProvider implements ITranslationProvider {
  name = 'caribbean-heuristic';

  async detectLanguage(text: string): Promise<LanguageDetectionResult> {
    const scores: Record<Locale, number> = { en: 0, es: 0, fr: 0, ht: 0, nl: 0, pap: 0 };

    for (const [locale, regexes] of Object.entries(DIALECT_MARKERS) as [Locale, RegExp[]][]) {
      for (const rx of regexes) {
        const matches = text.match(new RegExp(rx, 'gi'));
        if (matches) {
          scores[locale] += matches.length * 2;
        }
      }
    }

    let highestLocale: Locale = DEFAULT_LOCALE;
    let highestScore = 0;
    for (const [loc, score] of Object.entries(scores) as [Locale, number][]) {
      if (score > highestScore) {
        highestScore = score;
        highestLocale = loc;
      }
    }

    if (highestScore === 0) {
      return { language: 'und', confidence: 0.2 };
    }

    const confidence = Math.min(1.0, 0.4 + highestScore * 0.15);
    return { language: highestLocale, confidence };
  }

  async translate(text: string, sourceLang: Locale | 'und', targetLang: Locale): Promise<string> {
    if (sourceLang === targetLang) return text;
    // Common Caribbean cross-language phrases dictionary
    const phrases: Record<string, Record<Locale, string>> = {
      'hola amigos': {
        en: 'Hello friends',
        es: 'Hola amigos',
        fr: 'Bonjour les amis',
        ht: 'Bonjou zanmi yo',
        nl: 'Hallo vrienden',
        pap: 'Halo amigonan'
      },
      'buenos días': {
        en: 'Good morning',
        es: 'Buenos días',
        fr: 'Bonjour',
        ht: 'Bonjou',
        nl: 'Goedemorgen',
        pap: 'Bon dia'
      },
      'buenas tardes': {
        en: 'Good afternoon',
        es: 'Buenas tardes',
        fr: 'Bon après-midi',
        ht: 'Bonswa',
        nl: 'Goedemiddag',
        pap: 'Bon tardi'
      },
      'buenas noches': {
        en: 'Good evening',
        es: 'Buenas noches',
        fr: 'Bonsoir',
        ht: 'Bonswa',
        nl: 'Goedenavond',
        pap: 'Bon nochi'
      },
      'bienvenidos a tukubi': {
        en: 'Welcome to TUKUBI',
        es: 'Bienvenidos a TUKUBI',
        fr: 'Bienvenue sur TUKUBI',
        ht: 'Byenvini sou TUKUBI',
        nl: 'Welkom bij TUKUBI',
        pap: 'Bon bini na TUKUBI'
      }
    };

    let result = text;
    const lower = text.toLowerCase();
    for (const [phrase, map] of Object.entries(phrases)) {
      if (lower.includes(phrase) && map[targetLang]) {
        const regex = new RegExp(phrase, 'gi');
        result = result.replace(regex, map[targetLang]);
      }
    }

    return result;
  }
}

// 3. Free Web Translation Provider (MyMemory / Public Translation API Fallback)
export class FreeWebTranslationProvider implements ITranslationProvider {
  name = 'free-web-translate';

  async detectLanguage(text: string): Promise<LanguageDetectionResult> {
    return new RobustHeuristicProvider().detectLanguage(text);
  }

  async translate(text: string, sourceLang: Locale | 'und', targetLang: Locale): Promise<string> {
    const sLang = sourceLang === 'und' ? 'en' : sourceLang;
    if (sLang === targetLang) return text;

    // First try dictionary heuristics for instantaneous matching
    const heuristic = await new RobustHeuristicProvider().translate(text, sourceLang, targetLang);
    if (heuristic !== text) {
      return heuristic;
    }

    try {
      const url = `https://api.mymemory.translated.net/get?q=${encodeURIComponent(text.slice(0, 500))}&langpair=${sLang}|${targetLang}`;
      const controller = typeof AbortController !== 'undefined' ? new AbortController() : null;
      const timeoutId = controller ? setTimeout(() => controller.abort(), 6000) : null;

      const res = await fetch(url, {
        signal: controller ? controller.signal : undefined,
        headers: {
          'Accept': 'application/json',
          'User-Agent': 'Tukubi-Platform/1.0',
        },
      });
      if (timeoutId) clearTimeout(timeoutId);

      if (res.ok) {
        const data = await res.json();
        const translated = data?.responseData?.translatedText;
        if (
          translated &&
          typeof translated === 'string' &&
          !translated.includes('MYMEMORY WARNING') &&
          !translated.includes('INVALID TARGET LANGUAGE')
        ) {
          // Unescape HTML entities
          const cleaned = translated
            .replace(/&#39;/g, "'")
            .replace(/&quot;/g, '"')
            .replace(/&amp;/g, '&')
            .replace(/&lt;/g, '<')
            .replace(/&gt;/g, '>')
            .replace(/&#([0-9]{1,5});/gi, (_match, numStr) => {
              const num = parseInt(numStr, 10);
              return String.fromCharCode(num);
            });
          if (cleaned.trim() && cleaned.trim().toLowerCase() !== text.trim().toLowerCase()) {
            return cleaned.trim();
          }
        }
      }
    } catch {
      // Fallback
    }

    return heuristic;
  }
}

// 4. OpenRouter / CaribAI Provider
export class CaribAITranslationProvider implements ITranslationProvider {
  name = 'caribai';
  private apiKey: string;
  private model: string;
  private fallbackWeb: FreeWebTranslationProvider;

  constructor(apiKey?: string, model?: string) {
    this.apiKey = apiKey || (typeof process !== 'undefined' ? process.env?.OPENROUTER_API_KEY : '') || '';
    this.model = model || (typeof process !== 'undefined' ? process.env?.OPENROUTER_DEFAULT_MODEL : '') || 'meta-llama/llama-3.3-70b-instruct:free';
    this.fallbackWeb = new FreeWebTranslationProvider();
  }

  async detectLanguage(text: string): Promise<LanguageDetectionResult> {
    if (!this.apiKey) {
      return new RobustHeuristicProvider().detectLanguage(text);
    }

    const prompt = `Detect the primary language of the following text among [en, es, fr, ht, nl, pap]. 
Return only a JSON object: {"language": "en"|"es"|"fr"|"ht"|"nl"|"pap"|"und", "confidence": number}.
Text: "${text.slice(0, 300)}"`;

    try {
      const res = await fetch('https://openrouter.ai/api/v1/chat/completions', {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${this.apiKey}`,
          'HTTP-Referer': 'https://tukubi.com',
          'X-Title': 'TUKUBI',
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          model: this.model,
          messages: [{ role: 'user', content: prompt }]
        })
      });
      const data = await res.json();
      const raw = data.choices?.[0]?.message?.content || '';
      const parsed = JSON.parse(raw.replace(/```json|```/g, '').trim());
      if (LOCALES.includes(parsed.language)) {
        return { language: parsed.language, confidence: parsed.confidence || 0.9 };
      }
    } catch {
      // Fallback on error
    }
    return new RobustHeuristicProvider().detectLanguage(text);
  }

  async translate(text: string, sourceLang: Locale | 'und', targetLang: Locale): Promise<string> {
    if (!this.apiKey) {
      return this.fallbackWeb.translate(text, sourceLang, targetLang);
    }

    const targetName = LOCALE_DETAILS[targetLang]?.nativeName || targetLang;
    const prompt = `You are CaribAI, an expert in Caribbean linguistics, dialects (Patois, Haitian Creole, Papiamentu, Caribbean Spanish, Caribbean French, Dutch), and slang.
Translate the following user-generated content directly into ${targetName} (${targetLang}).
CRITICAL RULES:
- Preserve meaning, sentence structure, emotional tone, emojis, and punctuation.
- DO NOT translate tokens like __URL_0__, __USER_0__, __TAG_0__, __BRAND_0__.
- DO NOT add commentary, notes, or quotes. Output ONLY the translated text.

Text to translate:
${text}`;

    try {
      const res = await fetch('https://openrouter.ai/api/v1/chat/completions', {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${this.apiKey}`,
          'HTTP-Referer': 'https://tukubi.com',
          'X-Title': 'TUKUBI',
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          model: this.model,
          messages: [{ role: 'user', content: prompt }]
        })
      });
      const data = await res.json();
      const translated = data.choices?.[0]?.message?.content?.trim();
      if (translated) return translated;
    } catch (err) {
      console.warn('CaribAI translation call failed, using fallback:', err);
    }

    return this.fallbackWeb.translate(text, sourceLang, targetLang);
  }
}

// 4. Translation Service Facade with in-memory LRU Cache
export class TranslationService {
  private primaryProvider: ITranslationProvider;
  private fallbackProvider: ITranslationProvider;
  private memoryCache: Map<string, string> = new Map();
  private maxCacheSize = 1000;

  constructor(primaryProvider?: ITranslationProvider) {
    this.fallbackProvider = new RobustHeuristicProvider();
    this.primaryProvider = primaryProvider || new CaribAITranslationProvider();
  }

  public getSupportedLanguages(): LocaleMeta[] {
    return LOCALES.map((code) => LOCALE_DETAILS[code]);
  }

  public async detectLanguage(text: string): Promise<LanguageDetectionResult> {
    if (!text || text.trim().length === 0) {
      return { language: 'und', confidence: 1.0 };
    }
    try {
      return await this.primaryProvider.detectLanguage(text);
    } catch {
      return await this.fallbackProvider.detectLanguage(text);
    }
  }

  public async translate(
    text: string,
    options: { sourceLang?: Locale | 'und'; targetLang: Locale; context?: string }
  ): Promise<TranslationResult> {
    const trimmed = text.trim();
    if (!trimmed) {
      return {
        translatedText: text,
        sourceLang: options.sourceLang || 'und',
        targetLang: options.targetLang,
        provider: 'noop',
      };
    }

    // Determine source language if not provided
    let sourceLang = options.sourceLang;
    if (!sourceLang || sourceLang === 'und') {
      const detected = await this.detectLanguage(trimmed);
      sourceLang = detected.language;
    }

    // If source and target are identical, return immediately
    if (sourceLang === options.targetLang) {
      return {
        translatedText: text,
        sourceLang,
        targetLang: options.targetLang,
        provider: 'identity',
      };
    }

    // In-memory cache check
    const contentHash = computeContentHash(trimmed);
    const cacheKey = `${contentHash}_${sourceLang}_${options.targetLang}`;
    if (this.memoryCache.has(cacheKey)) {
      return {
        translatedText: this.memoryCache.get(cacheKey)!,
        sourceLang,
        targetLang: options.targetLang,
        provider: 'memory-cache',
        cached: true,
      };
    }

    // Token protection
    const { protectedText, restoreMap } = protectTokens(trimmed);

    // Perform translation
    let translated: string;
    let usedProvider = this.primaryProvider.name;
    try {
      translated = await this.primaryProvider.translate(protectedText, sourceLang, options.targetLang);
    } catch {
      usedProvider = this.fallbackProvider.name;
      translated = await this.fallbackProvider.translate(protectedText, sourceLang, options.targetLang);
    }

    // Restore protected tokens
    const finalResult = restoreTokens(translated, restoreMap);

    // Save to LRU cache
    if (this.memoryCache.size >= this.maxCacheSize) {
      const firstKey = this.memoryCache.keys().next().value;
      if (firstKey) this.memoryCache.delete(firstKey);
    }
    this.memoryCache.set(cacheKey, finalResult);

    return {
      translatedText: finalResult,
      sourceLang,
      targetLang: options.targetLang,
      provider: usedProvider,
      cached: false,
    };
  }

  public async translateBatch(
    texts: string[],
    options: { targetLang: Locale }
  ): Promise<TranslationResult[]> {
    return Promise.all(texts.map((t) => this.translate(t, options)));
  }
}

export const defaultTranslationService = new TranslationService();
