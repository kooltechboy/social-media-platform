export type SkinTone = 'default' | 'light' | 'medium-light' | 'medium' | 'medium-dark' | 'dark';

export interface EmojiItem {
  emoji: string;
  name: string;
  keywords: string[];
  supportsSkinTone?: boolean;
  category?: string;
}

export interface EmojiCategoryData {
  id: string;
  name: string;
  iconName: string;
  emojis: EmojiItem[];
}
