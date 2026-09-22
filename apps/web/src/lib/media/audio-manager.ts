/**
 * TUKUBI Audio Manager Singleton
 *
 * Enforces single-audio-master policy across the entire Caribbean ecosystem.
 * Ensures that only one video or audio source (Sounds, Podcasts, Reels, Feed Videos,
 * Voice Notes, Live Streams) plays sound at any given time, automatically pausing or
 * muting inactive sources while preserving user audio preferences.
 */

export type PlayerKind = 'feed_video' | 'reel' | 'sound' | 'podcast' | 'voice_note' | 'live';

export interface PlayerRegistrationOptions {
  onMute?: () => void;
  onPause?: () => void;
  kind?: PlayerKind;
}

export interface AudioPlaybackEvent {
  activeSource: string | null;
  activeKind: PlayerKind | null;
  globallyUnmuted: boolean;
}

export type AudioEventListener = (event: AudioPlaybackEvent) => void;

interface RegisteredPlayer {
  onMute?: () => void;
  onPause?: () => void;
  kind: PlayerKind;
}

export class AudioManager {
  private static instance: AudioManager | null = null;
  private activeSource: string | null = null;
  private activeKind: PlayerKind | null = null;
  private globallyUnmuted: boolean = false;
  private players: Map<string, RegisteredPlayer> = new Map();
  private listeners: Set<AudioEventListener> = new Set();

  private constructor() {}

  /**
   * Retrieves the global singleton instance.
   */
  public static getInstance(): AudioManager {
    if (!AudioManager.instance) {
      AudioManager.instance = new AudioManager();
    }
    return AudioManager.instance;
  }

  public static register(
    id: string,
    callbackOrOptions: (() => void) | PlayerRegistrationOptions
  ): () => void {
    return AudioManager.getInstance().register(id, callbackOrOptions);
  }

  public static unregister(id: string): void {
    AudioManager.getInstance().unregister(id);
  }

  public static claimAudio(id: string, kind?: PlayerKind): void {
    AudioManager.getInstance().claimAudio(id, kind);
  }

  public static releaseAudio(id: string): void {
    AudioManager.getInstance().releaseAudio(id);
  }

  public static stopAll(): void {
    AudioManager.getInstance().stopAll();
  }

  public static isGloballyUnmuted(): boolean {
    return AudioManager.getInstance().isGloballyUnmuted();
  }

  public static getActiveSource(): string | null {
    return AudioManager.getInstance().getActiveSource();
  }

  public static getActiveKind(): PlayerKind | null {
    return AudioManager.getInstance().getActiveKind();
  }

  public static getActivePlayer(): { id: string; kind: PlayerKind | null } | null {
    return AudioManager.getInstance().getActivePlayer();
  }

  public static subscribe(listener: AudioEventListener): () => void {
    return AudioManager.getInstance().subscribe(listener);
  }

  public static reset(): void {
    AudioManager.getInstance().reset();
  }

  /**
   * Registers an active player with its mute and/or pause callbacks.
   * Supports backward compatibility with simple `(id, onMute)` calls.
   * Returns a cleanup function to unregister the player when unmounted.
   */
  public register(
    id: string,
    callbackOrOptions: (() => void) | PlayerRegistrationOptions
  ): () => void {
    if (typeof callbackOrOptions === 'function') {
      this.players.set(id, {
        onMute: callbackOrOptions,
        kind: 'feed_video',
      });
    } else {
      this.players.set(id, {
        onMute: callbackOrOptions.onMute,
        onPause: callbackOrOptions.onPause,
        kind: callbackOrOptions.kind || 'feed_video',
      });
    }

    return () => {
      this.unregister(id);
    };
  }

  /**
   * Unregisters a player by ID.
   */
  public unregister(id: string): void {
    this.players.delete(id);
    if (this.activeSource === id) {
      this.activeSource = null;
      this.activeKind = null;
      this.notifyListeners();
    }
  }

  /**
   * Claims audio master rights for a specific player ID.
   * Sets the active source and kind, marks global audio as unmuted,
   * and invokes onMute() / onPause() on all other registered players
   * so only one source plays audio at any time.
   */
  public claimAudio(id: string, kind?: PlayerKind): void {
    const player = this.players.get(id);
    const resolvedKind = kind || player?.kind || 'feed_video';

    this.activeSource = id;
    this.activeKind = resolvedKind;
    this.globallyUnmuted = true;

    for (const [playerId, reg] of this.players.entries()) {
      if (playerId !== id) {
        try {
          // If the player registered a pause handler (e.g. sounds, podcasts), pause it
          if (reg.onPause) {
            reg.onPause();
          }
          // If the player registered a mute handler (e.g. video feeds), mute it
          if (reg.onMute) {
            reg.onMute();
          }
        } catch (error) {
          console.error(`[AudioManager] Error notifying player ${playerId}:`, error);
        }
      }
    }

    this.notifyListeners();
  }

  /**
   * Releases audio master rights if held by the given player ID.
   */
  public releaseAudio(id: string): void {
    if (this.activeSource === id) {
      this.activeSource = null;
      this.activeKind = null;
      this.notifyListeners();
    }
  }

  /**
   * Stops/pauses/mutes all registered players across the entire application.
   */
  public stopAll(): void {
    this.activeSource = null;
    this.activeKind = null;

    for (const [playerId, reg] of this.players.entries()) {
      try {
        if (reg.onPause) reg.onPause();
        if (reg.onMute) reg.onMute();
      } catch (error) {
        console.error(`[AudioManager] Error stopping player ${playerId}:`, error);
      }
    }

    this.notifyListeners();
  }

  /**
   * Returns the ID of the currently active audio source, or null.
   */
  public getActiveSource(): string | null {
    return this.activeSource;
  }

  /**
   * Returns the kind of the currently active audio source, or null.
   */
  public getActiveKind(): PlayerKind | null {
    return this.activeKind;
  }

  /**
   * Returns details of the currently active player, or null.
   */
  public getActivePlayer(): { id: string; kind: PlayerKind | null } | null {
    if (!this.activeSource) return null;
    return {
      id: this.activeSource,
      kind: this.activeKind,
    };
  }

  /**
   * Returns true if the user has opted to unmute video audio in the feed.
   */
  public isGloballyUnmuted(): boolean {
    return this.globallyUnmuted;
  }

  /**
   * Explicitly updates the user's global sound preference.
   */
  public setGloballyUnmuted(val: boolean): void {
    this.globallyUnmuted = val;
    this.notifyListeners();
  }

  /**
   * Subscribes to audio playback state changes.
   * Returns an unsubscribe function.
   */
  public subscribe(listener: AudioEventListener): () => void {
    this.listeners.add(listener);
    return () => {
      this.listeners.delete(listener);
    };
  }

  private notifyListeners(): void {
    const event: AudioPlaybackEvent = {
      activeSource: this.activeSource,
      activeKind: this.activeKind,
      globallyUnmuted: this.globallyUnmuted,
    };
    for (const listener of this.listeners) {
      try {
        listener(event);
      } catch (err) {
        console.error('[AudioManager] Listener error:', err);
      }
    }
  }

  /**
   * Resets internal state for unit test isolation.
   */
  public reset(): void {
    this.activeSource = null;
    this.activeKind = null;
    this.globallyUnmuted = false;
    this.players.clear();
    this.listeners.clear();
  }
}

export default AudioManager;
