/**
 * TUKUBI Audio Manager Singleton
 *
 * Enforces single-audio-master policy across the entire Caribbean ecosystem.
 * Ensures that only one video or audio source plays with sound at any given time,
 * automatically muting inactive sources while preserving the user's global sound
 * preference across feed scrolling.
 */
export class AudioManager {
  private static instance: AudioManager | null = null;
  private activeSource: string | null = null;
  private globallyUnmuted: boolean = false;
  private players: Map<string, () => void> = new Map();

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

  /**
   * Registers an active video player and its mute callback.
   * Returns a cleanup function to unregister the player when unmounted.
   */
  public register(id: string, onMute: () => void): () => void {
    this.players.set(id, onMute);

    return () => {
      this.players.delete(id);
      if (this.activeSource === id) {
        this.activeSource = null;
      }
    };
  }

  /**
   * Claims audio master rights for a specific player ID.
   * Sets the active source, sets globallyUnmuted to true, and invokes onMute()
   * on all other registered players so only one source plays audio at any time.
   */
  public claimAudio(id: string): void {
    this.activeSource = id;
    this.globallyUnmuted = true;

    for (const [playerId, onMute] of this.players.entries()) {
      if (playerId !== id) {
        try {
          onMute();
        } catch (error) {
          console.error(`[AudioManager] Error notifying mute for player ${playerId}:`, error);
        }
      }
    }
  }

  /**
   * Releases audio master rights if held by the given player ID.
   */
  public releaseAudio(id: string): void {
    if (this.activeSource === id) {
      this.activeSource = null;
    }
  }

  /**
   * Returns the ID of the currently active audio source, or null.
   */
  public getActiveSource(): string | null {
    return this.activeSource;
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
  }

  /**
   * Resets internal state for unit test isolation.
   */
  public reset(): void {
    this.activeSource = null;
    this.globallyUnmuted = false;
    this.players.clear();
  }
}

export default AudioManager;
