/**
 * @file packages/live/src/sound-lounge.ts
 * @description Caribbean Audio Spaces ("Tukubi Sound Lounge") state machine and governance logic.
 */

export type SoundLoungeState = 'scheduled' | 'live' | 'ended' | 'cancelled';
export type SoundLoungeRole = 'host' | 'co_host' | 'speaker' | 'listener';

export const CULTURAL_GENRES = [
  'carnival',
  'reggae',
  'soca',
  'dancehall',
  'calypso',
  'afrobeats',
  'bouyon',
  'kompa',
  'steelpan',
  'talk_story',
] as const;

export type CulturalGenre = (typeof CULTURAL_GENRES)[number];

export function isCulturalGenre(val: string): val is CulturalGenre {
  return (CULTURAL_GENRES as readonly string[]).includes(val);
}

export const VALID_LOUNGE_TRANSITIONS: Record<SoundLoungeState, SoundLoungeState[]> = {
  scheduled: ['live', 'cancelled'],
  live: ['ended'],
  ended: [],
  cancelled: [],
};

export interface SoundLoungeContext {
  id: string;
  hostId: string;
  title: string;
  state: SoundLoungeState;
  culturalGenre: CulturalGenre;
  scheduledFor?: Date;
  startedAt?: Date;
  endedAt?: Date;
  listenerCount: number;
  peakListeners: number;
}

export interface SoundLoungeMember {
  profileId: string;
  loungeId: string;
  role: SoundLoungeRole;
  isMuted: boolean;
  handRaised: boolean;
  joinedAt: Date;
}

export class SoundLoungeStateMachine {
  public canTransition(from: SoundLoungeState, to: SoundLoungeState): boolean {
    return VALID_LOUNGE_TRANSITIONS[from]?.includes(to) ?? false;
  }

  public transition(from: SoundLoungeState, to: SoundLoungeState): SoundLoungeState {
    if (!this.canTransition(from, to)) {
      throw new Error(`Invalid sound lounge transition: ${from} → ${to}`);
    }
    return to;
  }

  public canSpeak(role: SoundLoungeRole): boolean {
    return role === 'host' || role === 'co_host' || role === 'speaker';
  }

  public canModerate(role: SoundLoungeRole): boolean {
    return role === 'host' || role === 'co_host';
  }

  public canRaiseHand(role: SoundLoungeRole, state: SoundLoungeState): boolean {
    return state === 'live' && role === 'listener';
  }

  public approveSpeaker(member: SoundLoungeMember, moderatorRole: SoundLoungeRole): SoundLoungeMember {
    if (!this.canModerate(moderatorRole)) {
      throw new Error('Only hosts and co-hosts can promote listeners to speakers');
    }
    return {
      ...member,
      role: 'speaker',
      handRaised: false,
      isMuted: false,
    };
  }

  public demoteToListener(member: SoundLoungeMember, moderatorRole: SoundLoungeRole): SoundLoungeMember {
    if (!this.canModerate(moderatorRole)) {
      throw new Error('Only hosts and co-hosts can demote speakers');
    }
    if (member.role === 'host') {
      throw new Error('Cannot demote the host of a Sound Lounge');
    }
    return {
      ...member,
      role: 'listener',
      isMuted: true,
      handRaised: false,
    };
  }

  public calculatePeakListeners(currentPeak: number, currentListeners: number): number {
    return Math.max(currentPeak, currentListeners);
  }
}
