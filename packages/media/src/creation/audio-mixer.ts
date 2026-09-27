export class AudioMixerGraph {
  private micVolume: number = 100;
  private stemVolume: number = 80;
  private audioContext: AudioContext | null = null;
  private micGainNode: GainNode | null = null;
  private stemGainNode: GainNode | null = null;
  private destinationNode: MediaStreamAudioDestinationNode | null = null;

  normalizeVolume(percentage: number): number {
    const clamped = Math.max(0, Math.min(100, percentage));
    return Number((clamped / 100).toFixed(2));
  }

  getMicVolume(): number {
    return this.micVolume;
  }

  getStemVolume(): number {
    return this.stemVolume;
  }

  setMicVolume(volumePercent: number): void {
    this.micVolume = Math.max(0, Math.min(100, volumePercent));
    if (this.micGainNode && this.audioContext) {
      this.micGainNode.gain.setValueAtTime(this.normalizeVolume(this.micVolume), this.audioContext.currentTime);
    }
  }

  setStemVolume(volumePercent: number): void {
    this.stemVolume = Math.max(0, Math.min(100, volumePercent));
    if (this.stemGainNode && this.audioContext) {
      this.stemGainNode.gain.setValueAtTime(this.normalizeVolume(this.stemVolume), this.audioContext.currentTime);
    }
  }

  setupGraph(micStream?: MediaStream, stemAudioElement?: HTMLAudioElement): MediaStream | null {
    if (typeof window === 'undefined') return null;
    const AudioCtx = window.AudioContext || (window as any).webkitAudioContext;
    if (!AudioCtx) return null;

    if (!this.audioContext) {
      this.audioContext = new AudioCtx();
    }
    if (this.audioContext.state === 'suspended') {
      this.audioContext.resume().catch(() => {});
    }

    this.destinationNode = this.audioContext.createMediaStreamDestination();

    if (micStream && micStream.getAudioTracks().length > 0) {
      const micSource = this.audioContext.createMediaStreamSource(micStream);
      this.micGainNode = this.audioContext.createGain();
      this.micGainNode.gain.setValueAtTime(this.normalizeVolume(this.micVolume), this.audioContext.currentTime);
      micSource.connect(this.micGainNode);
      this.micGainNode.connect(this.destinationNode);
    }

    if (stemAudioElement) {
      try {
        const stemSource = this.audioContext.createMediaElementSource(stemAudioElement);
        this.stemGainNode = this.audioContext.createGain();
        this.stemGainNode.gain.setValueAtTime(this.normalizeVolume(this.stemVolume), this.audioContext.currentTime);
        stemSource.connect(this.stemGainNode);
        this.stemGainNode.connect(this.destinationNode);
        // Also connect to speaker output so creator can hear stem during capture
        this.stemGainNode.connect(this.audioContext.destination);
      } catch {
        // Element already connected or cross-origin
      }
    }

    return this.destinationNode.stream;
  }

  close(): void {
    if (this.audioContext && this.audioContext.state !== 'closed') {
      try {
        this.audioContext.close();
      } catch {
        // ignore
      }
    }
    this.audioContext = null;
    this.micGainNode = null;
    this.stemGainNode = null;
    this.destinationNode = null;
  }
}
