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
