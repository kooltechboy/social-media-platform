import type { CameraPermissionState, CreationMode, DeviceOption } from './types';

export class CameraManager {
  private permissionState: CameraPermissionState = 'UNKNOWN';
  private facingMode: 'user' | 'environment' = 'user';
  private currentStream: MediaStream | null = null;
  private activeMode: CreationMode = 'photo';

  getPermissionState(): CameraPermissionState {
    return this.permissionState;
  }

  getFacingMode(): 'user' | 'environment' {
    return this.facingMode;
  }

  getCurrentStream(): MediaStream | null {
    return this.currentStream;
  }

  stopTracks(): void {
    if (this.currentStream) {
      this.currentStream.getTracks().forEach((track) => {
        try {
          track.stop();
        } catch {
          // ignore cleanup errors
        }
      });
      this.currentStream = null;
    }
  }

  async enumerateHardware(): Promise<{ videoDevices: DeviceOption[]; audioDevices: DeviceOption[] }> {
    if (!navigator?.mediaDevices?.enumerateDevices) {
      return { videoDevices: [], audioDevices: [] };
    }
    const devices = await navigator.mediaDevices.enumerateDevices();
    const videoDevices: DeviceOption[] = [];
    const audioDevices: DeviceOption[] = [];

    devices.forEach((d) => {
      if (d.kind === 'videoinput') {
        videoDevices.push({
          deviceId: d.deviceId,
          label: d.label || `Camera ${videoDevices.length + 1}`,
        });
      } else if (d.kind === 'audioinput') {
        audioDevices.push({
          deviceId: d.deviceId,
          label: d.label || `Microphone ${audioDevices.length + 1}`,
        });
      }
    });

    return { videoDevices, audioDevices };
  }

  async startCamera(
    facing: 'user' | 'environment' = 'user',
    mode: CreationMode = 'photo',
    specificDeviceId?: string
  ): Promise<MediaStream> {
    this.stopTracks();
    this.facingMode = facing;
    this.activeMode = mode;
    this.permissionState = 'REQUESTING';

    if (!navigator?.mediaDevices?.getUserMedia) {
      this.permissionState = 'UNAVAILABLE';
      throw new Error('Camera hardware API not available on this browser or platform');
    }

    const isReel = mode === 'reel';
    const videoConstraints: MediaTrackConstraints = specificDeviceId
      ? { deviceId: { exact: specificDeviceId } }
      : {
          facingMode: facing,
          width: isReel ? { ideal: 1080 } : { ideal: 1920 },
          height: isReel ? { ideal: 1920 } : { ideal: 1080 },
          frameRate: { ideal: 30, max: 60 },
        };

    const audioConstraints = mode === 'photo' ? false : { echoCancellation: true, noiseSuppression: true };

    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: videoConstraints,
        audio: audioConstraints,
      });
      this.currentStream = stream;
      this.permissionState = 'GRANTED';
      return stream;
    } catch (err: any) {
      if (err.name === 'NotAllowedError' || err.name === 'PermissionDeniedError') {
        this.permissionState = 'DENIED';
      } else if (err.name === 'NotFoundError' || err.name === 'DevicesNotFoundError') {
        this.permissionState = 'NO_DEVICE';
      } else if (err.name === 'NotReadableError' || err.name === 'TrackStartError') {
        this.permissionState = 'DEVICE_IN_USE';
      } else {
        this.permissionState = 'UNAVAILABLE';
      }
      throw err;
    }
  }

  async switchCamera(facing: 'user' | 'environment'): Promise<MediaStream> {
    return this.startCamera(facing, this.activeMode);
  }

  async toggleTorch(enabled: boolean): Promise<boolean> {
    if (!this.currentStream) return false;
    const videoTrack = this.currentStream.getVideoTracks()[0];
    if (!videoTrack) return false;

    const capabilities: any = videoTrack.getCapabilities ? videoTrack.getCapabilities() : {};
    if (!capabilities.torch) return false;

    try {
      await videoTrack.applyConstraints({
        advanced: [{ torch: enabled } as any],
      });
      return true;
    } catch {
      return false;
    }
  }
}
