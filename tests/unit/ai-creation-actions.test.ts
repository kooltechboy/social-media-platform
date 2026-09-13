import { describe, it, expect } from 'vitest';
import { extractJsonFromAiResponse } from '../../apps/web/src/lib/ai/creation-utils';

describe('AI Creation Actions & JSON Extraction Resilience', () => {
  it('extracts valid JSON object from clean JSON string', () => {
    const raw = '{"captions": ["Carnival vibes in Kingston", "Sunset rhythm", "Caribbean warmth"]}';
    const parsed = extractJsonFromAiResponse<{ captions: string[] }>(raw);
    expect(parsed).not.toBeNull();
    expect(parsed?.captions).toHaveLength(3);
    expect(parsed?.captions[0]).toBe('Carnival vibes in Kingston');
  });

  it('safely extracts JSON wrapped in markdown code blocks', () => {
    const raw = '```json\n{"captions": ["Island morning", "Caribbean diaspora connect"]}\n```';
    const parsed = extractJsonFromAiResponse<{ captions: string[] }>(raw);
    expect(parsed).not.toBeNull();
    expect(parsed?.captions).toHaveLength(2);
    expect(parsed?.captions[1]).toBe('Caribbean diaspora connect');
  });

  it('safely extracts JSON with introductory and trailing conversational prose', () => {
    const raw = 'Sure! Here are some Caribbean-inspired caption options for your post:\n\n{"captions": ["Vibes in the tropics", "Pure culture"]}\n\nHope this helps your reach!';
    const parsed = extractJsonFromAiResponse<{ captions: string[] }>(raw);
    expect(parsed).not.toBeNull();
    expect(parsed?.captions).toEqual(['Vibes in the tropics', 'Pure culture']);
  });

  it('safely extracts hashtag array JSON', () => {
    const raw = '```json\n{"hashtags": ["#Tukubi", "#CaribbeanConnected", "#ReggaeRoots", "#SocaVibes"]}\n```';
    const parsed = extractJsonFromAiResponse<{ hashtags: string[] }>(raw);
    expect(parsed).not.toBeNull();
    expect(parsed?.hashtags).toContain('#Tukubi');
    expect(parsed?.hashtags).toHaveLength(4);
  });

  it('returns null without throwing on malformed or non-JSON output', () => {
    expect(extractJsonFromAiResponse('')).toBeNull();
    expect(extractJsonFromAiResponse('Just plain text without braces')).toBeNull();
    expect(extractJsonFromAiResponse('{invalid json without quotes}')).toBeNull();
    expect(extractJsonFromAiResponse('{"unclosed": "brace"')).toBeNull();
  });
});
