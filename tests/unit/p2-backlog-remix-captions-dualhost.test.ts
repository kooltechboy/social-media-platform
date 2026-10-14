import { describe, it, expect } from 'vitest';
import { StreamStateMachine, type StreamContext } from '../../packages/live/src/index';
import { generateDialectCaptions, exportToWebVTT, parseWebVTT, formatTimestampVTT } from '../../packages/media/src/captions';
import { detectCaribbeanDialect, translateDialectText } from '../../packages/localization/src/dialects';
import { CARIBBEAN_SOUNDS } from '../../apps/web/src/lib/constants/caribbean-sounds';

describe('P2 — Dual-Host Collaborative Live Streaming Architecture', () => {
  const machine = new StreamStateMachine();
  const baseStream: StreamContext = {
    creatorId: 'host_creator_123',
    state: 'scheduled',
    accessLevel: 'public',
    coHostId: null,
    coHostStatus: 'none',
  };

  it('allows primary creator to invite a co-host when scheduled or live', () => {
    expect(machine.canInviteCoHost(baseStream, 'host_creator_123')).toBe(true);
    expect(machine.canInviteCoHost(baseStream, 'stranger_456')).toBe(false);

    // Cannot invite while stream has already ended
    const endedStream: StreamContext = { ...baseStream, state: 'ended' };
    expect(machine.canInviteCoHost(endedStream, 'host_creator_123')).toBe(false);
  });

  it('prevents host from inviting themselves as co-host', () => {
    expect(() =>
      machine.inviteCoHost(baseStream, 'host_creator_123', 'host_creator_123')
    ).toThrow('Creator cannot invite themselves as co-host');
  });

  it('transitions stream to invited state when co-host is invited', () => {
    const invitedStream = machine.inviteCoHost(baseStream, 'host_creator_123', 'cohost_partner_789');
    expect(invitedStream.coHostId).toBe('cohost_partner_789');
    expect(invitedStream.coHostStatus).toBe('invited');
  });

  it('allows invited co-host to accept and gain broadcasting privileges', () => {
    const invitedStream: StreamContext = {
      ...baseStream,
      state: 'live',
      coHostId: 'cohost_partner_789',
      coHostStatus: 'invited',
    };

    // Before acceptance, co-host cannot broadcast
    expect(machine.canBroadcast(invitedStream, 'cohost_partner_789')).toBe(false);

    // Acceptance
    const activeStream = machine.respondToCoHostInvite(invitedStream, 'cohost_partner_789', true);
    expect(activeStream.coHostStatus).toBe('active');
    expect(activeStream.coHostId).toBe('cohost_partner_789');

    // Both primary host and active co-host have broadcast privileges
    expect(machine.canBroadcast(activeStream, 'host_creator_123')).toBe(true);
    expect(machine.canBroadcast(activeStream, 'cohost_partner_789')).toBe(true);
    expect(machine.canBroadcast(activeStream, 'viewer_999')).toBe(false);
  });

  it('declining invitation resets co-host', () => {
    const invitedStream: StreamContext = {
      ...baseStream,
      state: 'live',
      coHostId: 'cohost_partner_789',
      coHostStatus: 'invited',
    };

    const declinedStream = machine.respondToCoHostInvite(invitedStream, 'cohost_partner_789', false);
    expect(declinedStream.coHostStatus).toBe('declined');
    expect(declinedStream.coHostId).toBeNull();
  });

  it('enforces that only primary creator can end the entire broadcast', () => {
    const activeStream: StreamContext = {
      ...baseStream,
      state: 'live',
      coHostId: 'cohost_partner_789',
      coHostStatus: 'active',
    };

    expect(machine.canEndStream(activeStream, 'host_creator_123')).toBe(true);
    expect(machine.canEndStream(activeStream, 'cohost_partner_789')).toBe(false);
  });

  it('allows either host or co-host to terminate co-host role', () => {
    const activeStream: StreamContext = {
      ...baseStream,
      state: 'live',
      coHostId: 'cohost_partner_789',
      coHostStatus: 'active',
    };

    const afterHostRemoval = machine.removeCoHost(activeStream, 'host_creator_123');
    expect(afterHostRemoval.coHostId).toBeNull();
    expect(afterHostRemoval.coHostStatus).toBe('none');

    const afterCoHostLeaving = machine.removeCoHost(activeStream, 'cohost_partner_789');
    expect(afterCoHostLeaving.coHostId).toBeNull();
    expect(afterCoHostLeaving.coHostStatus).toBe('none');

    // Unauthorized third party cannot remove co-host
    expect(() => machine.removeCoHost(activeStream, 'random_viewer')).toThrow(
      'Only the host or current co-host can remove or vacate the co-host role'
    );
  });
});

describe('P2 — Shorts Sound Remixing & Audio Pre-Selection', () => {
  it('locates sound tracks by ID or title case-insensitively', () => {
    const sampleSound = CARIBBEAN_SOUNDS[0];
    expect(sampleSound).toBeDefined();

    const targetId = sampleSound.id.toLowerCase();
    const foundById = CARIBBEAN_SOUNDS.find((s) => s.id.toLowerCase() === targetId);
    expect(foundById?.title).toBe(sampleSound.title);

    const targetTitle = sampleSound.title.toLowerCase();
    const foundByTitle = CARIBBEAN_SOUNDS.find((s) => s.title.toLowerCase() === targetTitle);
    expect(foundByTitle?.id).toBe(sampleSound.id);
  });

  it('supports fuzzy substring match for sound titles from remixing links', () => {
    const sampleSound = CARIBBEAN_SOUNDS[0];
    const partialTitle = sampleSound.title.slice(0, 5).toLowerCase();

    const match = CARIBBEAN_SOUNDS.find(
      (s) =>
        s.id.toLowerCase() === partialTitle ||
        s.title.toLowerCase().includes(partialTitle)
    );
    expect(match).toBeDefined();
  });
});

describe('P2 — Caribbean Dialect Auto-Captioning & WebVTT Presets', () => {
  it('detects authentic Jamaican Patois markers', () => {
    const text = 'Wah gwaan bredren, mi deh yah with di whole crew pon di block!';
    const result = detectCaribbeanDialect(text);
    expect(result.dialect).toBe('jam');
    expect(result.confidence).toBeGreaterThan(0.3);
  });

  it('detects authentic Haitian Creole markers', () => {
    const text = 'Sak pase Ayiti! Mwen kontan wè nou tout jodi a nan bèl fèt sa a.';
    const result = detectCaribbeanDialect(text);
    expect(result.dialect).toBe('ht');
    expect(result.confidence).toBeGreaterThan(0.3);
  });

  it('detects authentic Papiamentu markers', () => {
    const text = 'Bon bini na Kòrsou! Con ta bay ku boso tur awe? Dushi hendenan!';
    const result = detectCaribbeanDialect(text);
    expect(result.dialect).toBe('pap');
    expect(result.confidence).toBeGreaterThan(0.3);
  });

  it('generates synchronized WebVTT caption tracks with dialect tagging', () => {
    const transcript =
      'Wah gwaan Kingston! The sunrise fete is alive with pure carnival vibrations. Jump and wave!';
    const track = generateDialectCaptions(transcript, 30, 'jam');

    expect(track.dialect).toBe('jam');
    expect(track.cues.length).toBeGreaterThan(0);

    const firstCue = track.cues[0];
    expect(firstCue.startTimeSec).toBeGreaterThanOrEqual(0);
    expect(firstCue.endTimeSec).toBeGreaterThan(firstCue.startTimeSec);
    expect(firstCue.dialect).toBe('jam');
    expect(firstCue.text.length).toBeGreaterThan(0);

    const vttOutput = exportToWebVTT(track);
    expect(vttOutput).toContain('WEBVTT');
    expect(vttOutput).toContain('-->');
    expect(vttOutput).toContain(firstCue.text);
  });
});
