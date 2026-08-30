import { describe, it, expect } from 'vitest';
import {
  TranslationService,
  RobustHeuristicProvider,
  protectTokens,
  restoreTokens,
  computeContentHash,
  defaultTranslationService,
} from '../../packages/localization/src/index';

describe('Production Translation Architecture & Services', () => {
  it('protects and restores tokens like URLs, usernames, hashtags, and TUKUBI brand', () => {
    const original = 'Visit https://tukubi.com to see @kooltechboy with #CaribbeanVibes on TUKUBI!';
    const { protectedText, restoreMap } = protectTokens(original);

    expect(protectedText).toContain('__URL_0__');
    expect(protectedText).toContain('__USER_1__');
    expect(protectedText).toContain('__TAG_2__');
    expect(protectedText).toContain('__BRAND_3__');
    expect(protectedText).not.toContain('https://tukubi.com');
    expect(protectedText).not.toContain('@kooltechboy');
    expect(protectedText).not.toContain('#CaribbeanVibes');

    const restored = restoreTokens(protectedText, restoreMap);
    expect(restored).toBe(original);
  });

  it('computes deterministic SHA-256 style 64-character content hashes', () => {
    const textA = 'Hola amigos, bienvenidos a TUKUBI';
    const textB = '  hola amigos, bienvenidos a tukubi  ';
    const hashA = computeContentHash(textA);
    const hashB = computeContentHash(textB);

    expect(hashA).toHaveLength(64);
    expect(hashA).toBe(hashB);
  });

  it('detects primary Caribbean languages using dialect markers', async () => {
    const provider = new RobustHeuristicProvider();

    const esResult = await provider.detectLanguage('Hola amigos, bienvenidos a TUKUBI para ver publicaciones');
    expect(esResult.language).toBe('es');

    const htResult = await provider.detectLanguage('Bonjou zanmi yo, kisa k ap pase sou platfòm lan');
    expect(htResult.language).toBe('ht');

    const papResult = await provider.detectLanguage('Bon dia dushi hendenan, con ta bay na Korsou i Aruba');
    expect(papResult.language).toBe('pap');

    const frResult = await provider.detectLanguage('Bonjour tout le monde, bienvenue avec nos chers amis');
    expect(frResult.language).toBe('fr');

    const nlResult = await provider.detectLanguage('Hallo vrienden, goedemorgen allemaal');
    expect(nlResult.language).toBe('nl');

    const enResult = await provider.detectLanguage('Hello and welcome everyone to our great morning feed');
    expect(enResult.language).toBe('en');
  });

  it('translates content with caching and provider attribution', async () => {
    const service = new TranslationService();

    // 1. Initial translation from Spanish to English
    const firstCall = await service.translate('Hola amigos, bienvenidos a TUKUBI', {
      sourceLang: 'es',
      targetLang: 'en',
    });

    expect(firstCall.targetLang).toBe('en');
    expect(firstCall.sourceLang).toBe('es');
    expect(firstCall.translatedText).toContain('Hello friends');
    expect(firstCall.translatedText).toContain('TUKUBI');
    expect(firstCall.cached).toBe(false);

    // 2. Second translation of identical content must hit cache
    const secondCall = await service.translate('Hola amigos, bienvenidos a TUKUBI', {
      sourceLang: 'es',
      targetLang: 'en',
    });

    expect(secondCall.cached).toBe(true);
    expect(secondCall.translatedText).toBe(firstCall.translatedText);
  });

  it('returns original text immediately if source and target languages match', async () => {
    const service = defaultTranslationService;
    const res = await service.translate('Good morning everyone', {
      sourceLang: 'en',
      targetLang: 'en',
    });

    expect(res.provider).toBe('identity');
    expect(res.translatedText).toBe('Good morning everyone');
  });

  it('preserves hashtags and handles translation into Haitian Creole and Papiamentu', async () => {
    const service = new TranslationService();

    const resHT = await service.translate('Buenos días #Carnival2026', {
      sourceLang: 'es',
      targetLang: 'ht',
    });

    expect(resHT.translatedText).toContain('Bonjou');
    expect(resHT.translatedText).toContain('#Carnival2026');

    const resPAP = await service.translate('Buenos días @curacao_creator', {
      sourceLang: 'es',
      targetLang: 'pap',
    });

    expect(resPAP.translatedText).toContain('Bon dia');
    expect(resPAP.translatedText).toContain('@curacao_creator');
  });
});
