import { describe, it, expect } from 'vitest';
import * as fs from 'fs';
import * as path from 'path';
import {
  SoundLoungeStateMachine,
  CULTURAL_GENRES,
  isCulturalGenre,
  SoundLoungeMember,
} from '../../packages/live/src';

describe('Caribbean Audio Spaces ("Tukubi Sound Lounge") Domain Suite', () => {
  const machine = new SoundLoungeStateMachine();

  it('validates cultural genre taxonomy', () => {
    expect(isCulturalGenre('carnival')).toBe(true);
    expect(isCulturalGenre('reggae')).toBe(true);
    expect(isCulturalGenre('soca')).toBe(true);
    expect(isCulturalGenre('dancehall')).toBe(true);
    expect(isCulturalGenre('heavy_metal')).toBe(false);
    expect(CULTURAL_GENRES.length).toBeGreaterThanOrEqual(8);
  });

  it('manages lifecycle state transitions correctly', () => {
    expect(machine.canTransition('scheduled', 'live')).toBe(true);
    expect(machine.canTransition('scheduled', 'cancelled')).toBe(true);
    expect(machine.canTransition('live', 'ended')).toBe(true);
    expect(machine.canTransition('ended', 'live')).toBe(false);
    expect(machine.canTransition('cancelled', 'live')).toBe(false);

    expect(machine.transition('scheduled', 'live')).toBe('live');
    expect(machine.transition('live', 'ended')).toBe('ended');
    expect(() => machine.transition('ended', 'scheduled')).toThrow();
  });

  it('enforces stage speaking and moderation privileges', () => {
    expect(machine.canSpeak('host')).toBe(true);
    expect(machine.canSpeak('co_host')).toBe(true);
    expect(machine.canSpeak('speaker')).toBe(true);
    expect(machine.canSpeak('listener')).toBe(false);

    expect(machine.canModerate('host')).toBe(true);
    expect(machine.canModerate('co_host')).toBe(true);
    expect(machine.canModerate('speaker')).toBe(false);
    expect(machine.canModerate('listener')).toBe(false);
  });

  it('supports listener hand-raising protocol and moderator approval', () => {
    expect(machine.canRaiseHand('listener', 'live')).toBe(true);
    expect(machine.canRaiseHand('listener', 'scheduled')).toBe(false);
    expect(machine.canRaiseHand('speaker', 'live')).toBe(false);

    const listenerMember: SoundLoungeMember = {
      profileId: 'usr_listener',
      loungeId: 'lng_123',
      role: 'listener',
      isMuted: true,
      handRaised: true,
      joinedAt: new Date(),
    };

    // Promotion by host
    const promoted = machine.approveSpeaker(listenerMember, 'host');
    expect(promoted.role).toBe('speaker');
    expect(promoted.handRaised).toBe(false);
    expect(promoted.isMuted).toBe(false);

    // Demotion by co_host
    const demoted = machine.demoteToListener(promoted, 'co_host');
    expect(demoted.role).toBe('listener');
    expect(demoted.isMuted).toBe(true);

    // Unprivileged user cannot promote
    expect(() => machine.approveSpeaker(listenerMember, 'listener')).toThrow();
  });

  it('prevents demotion of the room host', () => {
    const hostMember: SoundLoungeMember = {
      profileId: 'usr_host',
      loungeId: 'lng_123',
      role: 'host',
      isMuted: false,
      handRaised: false,
      joinedAt: new Date(),
    };

    expect(() => machine.demoteToListener(hostMember, 'co_host')).toThrow(
      'Cannot demote the host of a Sound Lounge'
    );
  });

  it('tracks peak listener attendance monotonically', () => {
    expect(machine.calculatePeakListeners(100, 150)).toBe(150);
    expect(machine.calculatePeakListeners(150, 120)).toBe(150);
    expect(machine.calculatePeakListeners(150, 200)).toBe(200);
  });

  it('verifies migration 00077 schema and RLS policies', () => {
    const migrationPath = path.resolve(
      __dirname,
      '../../supabase/migrations/00077_audio_spaces_and_sound_lounges.sql'
    );
    expect(fs.existsSync(migrationPath)).toBe(true);

    const sql = fs.readFileSync(migrationPath, 'utf-8');
    expect(sql).toContain('public.sound_lounges');
    expect(sql).toContain('public.sound_lounge_members');
    expect(sql).toContain('ALTER PUBLICATION supabase_realtime ADD TABLE public.sound_lounges;');
    expect(sql).toContain('ALTER TABLE public.sound_lounges ENABLE ROW LEVEL SECURITY;');
    expect(sql).toContain('ALTER TABLE public.sound_lounge_members ENABLE ROW LEVEL SECURITY;');
  });
});
