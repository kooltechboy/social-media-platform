export type CreationMode = 'photo' | 'video' | 'reel';

export type CameraPermissionState =
  | 'UNKNOWN'
  | 'REQUESTING'
  | 'GRANTED'
  | 'DENIED'
  | 'BLOCKED'
  | 'UNAVAILABLE'
  | 'NO_DEVICE'
  | 'DEVICE_IN_USE';

export interface DeviceOption {
  deviceId: string;
  label: string;
}

export interface RecordedClip {
  id: string;
  blob: Blob;
  previewUrl: string;
  durationMs: number;
  trimStartMs: number;
  trimEndMs: number;
  speed: 0.5 | 1.0 | 1.5 | 2.0;
  order: number;
}

export interface PhotoEditState {
  crop: { x: number; y: number; width: number; height: number };
  aspectRatio: 'free' | '1:1' | '4:5' | '9:16' | '16:9';
  rotationDeg: 0 | 90 | 180 | 270;
  flipHorizontal: boolean;
  filter: 'none' | 'caribbean_warmth' | 'golden_hour' | 'twilight_purple' | 'sea_clarity' | 'monochrome';
  brightness: number; // -50 to +50
  contrast: number;   // -50 to +50
  saturation: number; // -50 to +50
  altText: string;
}

export interface VideoEditState {
  clips: RecordedClip[];
  selectedSoundId?: string;
  selectedSoundTitle?: string;
  selectedSoundUrl?: string;
  soundVolume: number; // 0 to 100
  micVolume: number;   // 0 to 100
  activeFilter: string;
  textOverlays: Array<{
    id: string;
    text: string;
    startMs: number;
    endMs: number;
    position: { x: number; y: number };
    fontSize: number;
    color: string;
    backgroundColor?: string;
  }>;
  coverTimestampMs: number;
}

export interface MediaExportResult {
  file: File;
  mediaKind: 'image' | 'video';
  previewUrl: string;
  aspectRatio: string;
  posterBlob?: Blob;
  soundId?: string;
  soundTitle?: string;
  durationSeconds?: number;
  altText?: string;
  taggedProductIds?: string[];
}
