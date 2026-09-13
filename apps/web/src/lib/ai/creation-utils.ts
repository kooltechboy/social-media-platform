/**
 * Resilient JSON extractor from LLM completion text.
 * Safely handles markdown fences, surrounding text commentary, and malformed outputs.
 */
export function extractJsonFromAiResponse<T>(raw: string): T | null {
  if (!raw || typeof raw !== 'string') return null;
  try {
    const cleaned = raw.replace(/```(?:json)?/gi, '').replace(/```/g, '').trim();
    const start = cleaned.indexOf('{');
    const end = cleaned.lastIndexOf('}');
    if (start === -1 || end === -1 || end <= start) return null;
    return JSON.parse(cleaned.substring(start, end + 1)) as T;
  } catch {
    return null;
  }
}
