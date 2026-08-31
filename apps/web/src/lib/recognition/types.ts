export type BadgeTier = 'standard' | 'bronze' | 'silver' | 'gold' | 'platinum' | 'diamond' | 'cosmic';
export type BadgeRarity = 'common' | 'uncommon' | 'rare' | 'epic' | 'legendary' | 'mythic';

export interface ColorTheme {
  bg: string;
  border: string;
  text: string;
}

export interface RecognitionBadge {
  id: string;
  slug: string;
  name: string;
  description: string;
  icon: string;
  tier: BadgeTier;
  rarity: BadgeRarity;
  color_theme: ColorTheme;
  is_featured?: boolean;
  is_visible?: boolean;
  awarded_at?: string;
  max_recipients?: number | null;
  current_recipients_count?: number;
}

export interface FounderStatus {
  is_founder: boolean;
  founder_number?: number;
  formatted_number?: string;
  program_name?: string;
  designation?: string;
  allocated_at?: string;
}

export interface ReputationSummary {
  score: number;
  level_tier: number;
  level_name: string;
  level_title: string;
  level_emoji: string;
}

export interface DigitalAchievement {
  id: string;
  slug: string;
  name: string;
  description: string;
  category: string;
  icon: string;
  points: number;
  unlocked_at?: string;
  is_unlocked?: boolean;
  progress_percentage?: number;
}

export interface FoundersCouncilStatus {
  is_member: boolean;
  status?: 'invited' | 'active' | 'alumni' | 'revoked';
  joined_at?: string;
}

export interface AmbassadorStatus {
  is_ambassador: boolean;
  territory?: string;
  appointed_at?: string;
}

export interface UserCertification {
  id: string;
  program_id: string;
  program_title: string;
  track: string;
  certificate_id: string;
  completed_at: string;
}

export interface ProfileRecognitionSummary {
  founder: FounderStatus;
  reputation: ReputationSummary;
  badges: RecognitionBadge[];
  achievements: DigitalAchievement[];
  council: FoundersCouncilStatus;
  ambassador: AmbassadorStatus;
  certifications?: UserCertification[];
}

export interface LabsProgram {
  id: string;
  slug: string;
  title: string;
  feature_key: string;
  description: string;
  status: 'upcoming' | 'active' | 'graduated' | 'closed';
  release_notes?: string | null;
  max_participants?: number | null;
  current_participants_count: number;
  is_member?: boolean;
}

export interface SpotlightItem {
  id: string;
  category: 'member_of_week' | 'creator_of_week' | 'podcaster_of_week' | 'merchant_of_week' | 'business_of_week' | 'community_builder' | 'caribbean_spotlight';
  headline: string;
  story: string;
  media_url?: string | null;
  featured_from: string;
  featured_until: string;
  profile: {
    id: string;
    username: string;
    display_name: string;
    avatar_url?: string | null;
    is_verified?: boolean;
  };
}
