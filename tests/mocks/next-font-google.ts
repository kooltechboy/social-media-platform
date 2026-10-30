// Vitest stub for `next/font/google` (which Next.js SWC transforms at build time).
const createFontLoader = (opts?: { variable?: string }) => ({
  className: 'next-font-mock',
  variable: opts?.variable ?? '',
  style: { fontFamily: 'sans-serif' },
});

export const Inter = createFontLoader;
export const Plus_Jakarta_Sans = createFontLoader;
export const JetBrains_Mono = createFontLoader;
