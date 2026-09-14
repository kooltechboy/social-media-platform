'use client';

import React from 'react';
import TukubiCameraModal, { type StudioCaptureMode } from './tukubi-camera-modal';

export type CaptureMode = StudioCaptureMode;

export interface DeviceMediaCaptureModalProps {
  isOpen: boolean;
  mode: CaptureMode;
  onClose: () => void;
  onCaptureComplete: (file: File, type: 'image' | 'video', meta?: { coverBlob?: Blob; soundId?: string; soundTitle?: string }) => void;
  onFallbackToFilePicker?: () => void;
  initialSoundId?: string;
}

export default function DeviceMediaCaptureModal({
  isOpen,
  mode,
  onClose,
  onCaptureComplete,
  onFallbackToFilePicker,
  initialSoundId,
}: DeviceMediaCaptureModalProps) {
  return (
    <TukubiCameraModal
      isOpen={isOpen}
      initialMode={mode}
      onClose={onClose}
      onCaptureComplete={onCaptureComplete}
      onFallbackToFilePicker={onFallbackToFilePicker ? () => onFallbackToFilePicker() : undefined}
      initialSoundId={initialSoundId}
    />
  );
}
