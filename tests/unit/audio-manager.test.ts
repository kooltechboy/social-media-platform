import { describe, it, expect, beforeEach, vi } from 'vitest';
import AudioManager from '../../apps/web/src/lib/media/audio-manager';

describe('AudioManager Singleton & Media Coordination', () => {
  beforeEach(() => {
    AudioManager.getInstance().reset();
  });

  it('maintains a single instance', () => {
    const a1 = AudioManager.getInstance();
    const a2 = AudioManager.getInstance();
    expect(a1).toBe(a2);
  });

  it('enforces single-audio master across video and sound players', () => {
    const audioMgr = AudioManager.getInstance();
    const videoMute = vi.fn();
    const soundPause = vi.fn();

    const unregVideo = audioMgr.register('video-1', { onMute: videoMute, kind: 'feed_video' });
    const unregSound = audioMgr.register('sound-1', { onPause: soundPause, kind: 'sound' });

    // Video claims audio
    audioMgr.claimAudio('video-1', 'feed_video');
    expect(audioMgr.getActiveSource()).toBe('video-1');
    expect(audioMgr.getActiveKind()).toBe('feed_video');
    expect(audioMgr.isGloballyUnmuted()).toBe(true);
    expect(soundPause).toHaveBeenCalledTimes(1);

    // Sound claims audio
    audioMgr.claimAudio('sound-1', 'sound');
    expect(audioMgr.getActiveSource()).toBe('sound-1');
    expect(audioMgr.getActiveKind()).toBe('sound');
    expect(videoMute).toHaveBeenCalledTimes(1);

    unregVideo();
    unregSound();
  });

  it('notifies subscribers on audio claims and releases', () => {
    const audioMgr = AudioManager.getInstance();
    const events: any[] = [];
    const unsubscribe = audioMgr.subscribe((event) => {
      events.push(event);
    });

    audioMgr.claimAudio('podcast-ep-42', 'podcast');
    expect(events.length).toBe(1);
    expect(events[0]).toEqual({
      activeSource: 'podcast-ep-42',
      activeKind: 'podcast',
      globallyUnmuted: true,
    });

    audioMgr.releaseAudio('podcast-ep-42');
    expect(events.length).toBe(2);
    expect(events[1].activeSource).toBeNull();
    expect(events[1].activeKind).toBeNull();

    unsubscribe();
  });

  it('stops all players on stopAll()', () => {
    const audioMgr = AudioManager.getInstance();
    const onPause1 = vi.fn();
    const onPause2 = vi.fn();

    audioMgr.register('reel-1', { onPause: onPause1, kind: 'reel' });
    audioMgr.register('sound-2', { onPause: onPause2, kind: 'sound' });

    audioMgr.claimAudio('reel-1', 'reel');
    audioMgr.stopAll();

    expect(audioMgr.getActiveSource()).toBeNull();
    expect(onPause1).toHaveBeenCalled();
    expect(onPause2).toHaveBeenCalled();
  });

  it('supports legacy register with simple callback', () => {
    const audioMgr = AudioManager.getInstance();
    const legacyMute = vi.fn();

    audioMgr.register('legacy-player', legacyMute);
    audioMgr.claimAudio('new-player', 'sound');

    expect(legacyMute).toHaveBeenCalledTimes(1);
  });
});
