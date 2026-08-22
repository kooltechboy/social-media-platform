// CaribAI Multi-Model Provider Abstraction via OpenRouter API

export interface OpenRouterConfig {
  apiKey?: string;
  defaultModel?: string;
}

export class CaribAIEngine {
  private apiKey: string;
  private defaultModel: string;

  constructor(config: OpenRouterConfig = {}) {
    this.apiKey = config.apiKey || process.env.OPENROUTER_API_KEY || '';
    // Default to OpenRouter high-performance free model
    this.defaultModel = config.defaultModel || process.env.OPENROUTER_DEFAULT_MODEL || 'meta-llama/llama-3.3-70b-instruct:free';
  }

  /**
   * Translates content across Caribbean languages & dialects (Patois, Haitian Creole, Papiamento, Spanish, French, English)
   */
  public async translateContent(text: string, targetLanguage: string): Promise<string> {
    const prompt = `You are CaribAI, an expert in Caribbean linguistic nuances and regional cultural dialects. 
Translate the following text into ${targetLanguage}, preserving cultural context, emotional tone, and idiomatic expressions:

Text: "${text}"`;

    return this.callOpenRouter(prompt);
  }

  /**
   * Assesses content for spam, toxicity, and fraud risk score (0.0 to 1.0)
   */
  public async classifyContentRisk(text: string): Promise<{ score: number; flagReason?: string }> {
    const prompt = `Analyze this Caribbean social platform post for toxicity, hate speech, spam, or scam indicators. 
Return JSON in format {"score": number, "flagReason": string} where score is between 0.0 (safe) and 1.0 (extremely harmful).

Text: "${text}"`;

    try {
      const response = await this.callOpenRouter(prompt);
      const parsed = JSON.parse(response);
      return { score: parsed.score || 0, flagReason: parsed.flagReason };
    } catch {
      return { score: 0.1 };
    }
  }

  private async callOpenRouter(prompt: string): Promise<string> {
    if (!this.apiKey) {
      // Mock graceful fallback if API key is pending configuration
      return `[CaribAI Processing via ${this.defaultModel}]: ${prompt.slice(0, 100)}...`;
    }

    const res = await fetch("https://openrouter.ai/api/v1/chat/completions", {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${this.apiKey}`,
        "HTTP-Referer": "https://caribbeanone.app",
        "X-Title": "CARIBBEAN ONE",
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        model: this.defaultModel,
        messages: [{ role: "user", content: prompt }]
      })
    });

    const data = await res.json();
    return data.choices?.[0]?.message?.content || "";
  }
}

// ---------------------------------------------------------------------------
// Ask Caribbean: natural-language query planning over the Caribbean Graph.
// Answers are retrieval-grounded with citations; inference is never presented as fact.

export type AskCaribbeanEntity =
  | 'events' | 'businesses' | 'communities' | 'creators' | 'profiles'
  | 'posts' | 'podcasts' | 'videos' | 'products' | 'locations';

export type CaribAILocale = 'en' | 'es' | 'fr' | 'ht' | 'nl' | 'pap';

export interface AskQueryPlan {
  term: string;
  entities: AskCaribbeanEntity[];
  locationHints: string[];
  locale: CaribAILocale;
  timeWindowDays: number | null;
}

const LOCATION_HINTS = [
  'miami', 'new york', 'toronto', 'montreal', 'london', 'amsterdam',
  'kingston', 'santo domingo', 'port of spain', 'bridgetown', 'nassau', 'port-au-prince',
  'montego bay', 'brooklyn', 'caribbean',
];

const LOCALE_MARKERS: Record<CaribAILocale, RegExp> = {
  en: /\b(in english)\b/i,
  es: /\b(en español)\b/i,
  fr: /\b(en français)\b/i,
  ht: /\b(an kreyòl)\b/i,
  nl: /\b(in het nederlands)\b/i,
  pap: /\b na papiamento\b/i,
};

export class AskCaribbeanPlanner {
  public plan(term: string, defaultLocale: CaribAILocale = 'en'): AskQueryPlan {
    const normalized = term.trim();
    const entities = new Set<AskCaribbeanEntity>(['profiles', 'posts']);
    const locationHints: string[] = [];

    for (const hint of LOCATION_HINTS) {
      if (normalized.toLowerCase().includes(hint)) locationHints.push(hint);
    }
    if (/\b(restaurants?|food|eat|eating|menu|kitchen|café|cafe)\b/i.test(normalized)) {
      entities.add('businesses');
      entities.add('products');
    }
    if (/\b(events?|parties|party|festivals?|carnival|concerts?|fete|weekend|tonight)\b/i.test(normalized)) entities.add('events');
    if (/\b(creators?|artists?|musicians?|djs?|influencers?)\b/i.test(normalized)) entities.add('creators');
    if (/\b(podcasts?|episodes?|listen|shows?)\b/i.test(normalized)) entities.add('podcasts');
    if (/\b(videos?|watch|reels?|streams?)\b/i.test(normalized)) entities.add('videos');
    if (/\b(communities?|groups?|join|members?)\b/i.test(normalized)) entities.add('communities');
    if (/\b(buy|shop|price|prices|order|products?)\b/i.test(normalized)) entities.add('products');

    let locale = defaultLocale;
    for (const [candidate, marker] of Object.entries(LOCALE_MARKERS) as Array<[CaribAILocale, RegExp]>) {
      if (marker.test(normalized)) locale = candidate;
    }

    const weekendMatch = /\b(this|next)?\s*(weekend|week)\b/i.test(normalized);
    const todayMatch = /\b(today|tonight)\b/i.test(normalized);
    const timeWindowDays = todayMatch ? 1 : weekendMatch ? 7 : null;

    return {
      term: normalized,
      entities: [...entities],
      locationHints,
      locale,
      timeWindowDays,
    };
  }
}

export interface GroundedAnswer {
  answer: string;
  citations: Array<{ entityType: AskCaribbeanEntity; entityId: string; title: string }>;
}

export function isGrounded(answer: GroundedAnswer): boolean {
  return answer.citations.length > 0;
}
