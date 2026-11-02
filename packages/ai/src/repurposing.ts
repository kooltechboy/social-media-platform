// packages/ai/src/repurposing.ts — CaribAI Creator Media Repurposing Pipeline

export type RepurposeCategory = 'social' | 'carnival' | 'music' | 'food' | 'business' | 'tech';

export type RepurposeDialect =
  | 'standard_english'
  | 'jamaican_patois'
  | 'trini_creole'
  | 'dominican_spanish'
  | 'haitian_kreyol';

export interface RepurposeInput {
  sourceText: string;
  title: string;
  category: RepurposeCategory;
  dialect?: RepurposeDialect;
}

export interface ReelScene {
  sceneNumber: number;
  visualCue: string;
  spokenNarration: string;
  durationSeconds: number;
}

export interface ReelScript {
  hook: string;
  scenes: ReelScene[];
  cta: string;
  estimatedSeconds: number;
}

export interface CarouselSlide {
  slideNumber: number;
  headline: string;
  bodyText: string;
  imageIdea: string;
}

export interface CommunityPrompt {
  question: string;
  debateAngles: string[];
  hashtags: string[];
}

export interface AudioNoteScript {
  text: string;
  suggestedTone: string;
}

export interface RepurposedContentBundle {
  reelScript: ReelScript;
  carousel: CarouselSlide[];
  communityPrompt: CommunityPrompt;
  audioNote: AudioNoteScript;
}

/**
 * Transforms long-form source text into a multi-format Caribbean creator asset bundle.
 */
export function repurposeContent(input: RepurposeInput): RepurposedContentBundle {
  const rawText = input.sourceText ? input.sourceText.trim() : '';
  if (!rawText) {
    throw new Error('Source content cannot be empty');
  }

  const title = input.title ? input.title.trim() : 'Caribbean Story';
  const category = input.category || 'social';
  const dialect = input.dialect || 'standard_english';

  // 1. Generate Hashtags
  const hashtags = ['#Tukubi', '#TheCaribbeanConnected', '#CaribbeanCreators'];
  if (category === 'carnival') hashtags.push('#CarnivalVibes', '#MasLife', '#SocaMusic');
  if (category === 'music') hashtags.push('#SoundSystemCulture', '#CaribbeanMusic', '#IslandBeats');
  if (category === 'food') hashtags.push('#CaribbeanFood', '#IslandFlavors', '#IslandEats');
  if (category === 'tech') hashtags.push('#CaribTech', '#DiasporaTech', '#Founders');
  if (category === 'business') hashtags.push('#CaribbeanBusiness', '#ShopLocal', '#Artisans');

  // 2. Dialect Specific Hook & Call to Action
  let hook = `Wait till you hear the untold story behind ${title}!`;
  let cta = `Follow on TUKUBI for more authentic stories from across the diaspora!`;
  let question = `How does ${title} impact your connection to Caribbean culture?`;
  let audioTone = 'Warm, energetic Caribbean storytelling tone';

  switch (dialect) {
    case 'jamaican_patois':
      hook = `Wait till yuh see how wi do ${title} inna Kingston! Big vibes pon di network! 🇯🇲🔊`;
      cta = `Drop a comment pon TUKUBI and big up di whole diaspora! ✨`;
      question = `Wah gwaan! How yuh feel about ${title} and di way our music and culture a tek over?`;
      audioTone = 'Lively, rhythmic Jamaican Patois cadence with authentic dubplate energy';
      break;
    case 'trini_creole':
      hook = `Yuh thought yuh knew ${title}? Watch this! Lime start already! 🇹🇹✨`;
      cta = `Share this with yuh carnival crew on TUKUBI! 🎭`;
      question = `Who ready for di road? What's your favorite memory of ${title}?`;
      audioTone = 'Upbeat, festive Trinidadian lime and soca storytelling tone';
      break;
    case 'haitian_kreyol':
      hook = `Gade kòman nou selebre ${title}! Bèl vibrasyon pou Ayiti ak dyaspora a! 🇭🇹✨`;
      cta = `Pataje avèk fanmi ak zanmi sou TUKUBI! Nou fò ansanm! 🌴`;
      question = `Kòman nou ka prezève eritaj ${title} pou pwochen jenerasyon an?`;
      audioTone = 'Proud, soulful Haitian Kreyòl cadence full of community warmth';
      break;
    case 'dominican_spanish':
      hook = `¡De lo mío! ¡No te pierdas lo que trajimos con ${title}! 🇩🇴✨`;
      cta = `¡Actívate en TUKUBI y comparte con la comunidad caribeña! 🌴🚀`;
      question = `¿Cómo representa ${title} el verdadero orgullo y sabor caribeño?`;
      audioTone = 'Enthusiastic, welcoming Dominican Caribbean warmth';
      break;
    default:
      hook = `The untold story behind ${title} you need to experience! 🌴✨`;
      cta = `Join the conversation on TUKUBI — The Caribbean Connected.`;
      question = `What does ${title} mean to you and our global Caribbean community?`;
      audioTone = 'Modern, inspiring, pan-Caribbean forward-looking tone';
  }

  // 3. Build 3-Scene Short-Form Reel Script
  const reelScenes: ReelScene[] = [
    {
      sceneNumber: 1,
      visualCue: `Quick punchy B-roll of ${title} with bold text overlay`,
      spokenNarration: hook,
      durationSeconds: 10,
    },
    {
      sceneNumber: 2,
      visualCue: 'Close-up authentic cultural details and behind-the-scenes moments',
      spokenNarration: `Here is the real heartbeat: ${rawText.slice(0, 140)}...`,
      durationSeconds: 25,
    },
    {
      sceneNumber: 3,
      visualCue: 'Dynamic pan across the Caribbean landscape and community creators',
      spokenNarration: `${cta}`,
      durationSeconds: 15,
    },
  ];

  const estimatedSeconds = reelScenes.reduce((acc, s) => acc + s.durationSeconds, 0);

  // 4. Build 4-Card Carousel Brief
  const carouselSlides: CarouselSlide[] = [
    {
      slideNumber: 1,
      headline: title,
      bodyText: hook,
      imageIdea: 'Striking portrait or landscape thumbnail with Caribbean gradient rim lighting',
    },
    {
      slideNumber: 2,
      headline: 'The Heritage',
      bodyText: rawText.slice(0, 160) || 'Uncovering our authentic roots and shared regional traditions.',
      imageIdea: 'Archival or documentary photo of cultural craftsmanship or community yards',
    },
    {
      slideNumber: 3,
      headline: 'Modern Innovation',
      bodyText: 'How the young generation and global diaspora are taking this tradition to the world stage.',
      imageIdea: 'Modern digital creative process, studio gear, or eco-conscious artisan tools',
    },
    {
      slideNumber: 4,
      headline: 'Join the Movement',
      bodyText: cta,
      imageIdea: 'TUKUBI platform logo badge with palm sunset aesthetic',
    },
  ];

  // 5. Community Debate Prompt
  const debateAngles = [
    'Preserving sacred traditional roots vs modern digital experimentation',
    'How island creators can economically benefit directly through Caribbean platform rails',
    'The role of the global diaspora in supporting local grassroots culture',
  ];

  return {
    reelScript: {
      hook,
      scenes: reelScenes,
      cta,
      estimatedSeconds,
    },
    carousel: carouselSlides,
    communityPrompt: {
      question,
      debateAngles,
      hashtags,
    },
    audioNote: {
      text: `${hook} ${rawText.slice(0, 180)}... ${cta}`,
      suggestedTone: audioTone,
    },
  };
}
