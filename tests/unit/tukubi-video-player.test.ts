import { describe, it, expect, beforeEach, vi } from 'vitest';
import AudioManager from '../../apps/web/src/lib/media/audio-manager';
import {
  formatVideoTime,
  computeVideoContainerStyle,
  calculateSeekTime,
  calculateProgressPercentage,
} from '../../apps/web/src/components/media/tukubi-video-player';

describe('Tukubi Video Player Subsystem', () => {
  describe('AudioManager Singleton', () => {
    let audioManager: AudioManager;

    beforeEach(() => {
      audioManager = AudioManager.getInstance();
      audioManager.reset();
    });

    it('maintains a single global instance', () => {
      const instanceA = AudioManager.getInstance();
      const instanceB = AudioManager.getInstance();
      expect(instanceA).toBe(instanceB);
    });

    it('initializes with null active source and muted preference', () => {
      expect(audioManager.getActiveSource()).toBeNull();
      expect(audioManager.isGloballyUnmuted()).toBe(false);
    });

    it('registers players and allows audio claiming', () => {
      const onMute1 = vi.fn();
      const onMute2 = vi.fn();

      audioManager.register('player-1', onMute1);
      audioManager.register('player-2', onMute2);

      audioManager.claimAudio('player-1');
      expect(audioManager.getActiveSource()).toBe('player-1');
      expect(audioManager.isGloballyUnmuted()).toBe(true);
      expect(onMute1).not.toHaveBeenCalled();
      expect(onMute2).toHaveBeenCalledTimes(1);
    });

    it('mutes active source when another player claims audio', () => {
      const onMute1 = vi.fn();
      const onMute2 = vi.fn();
      const onMute3 = vi.fn();

      audioManager.register('player-1', onMute1);
      audioManager.register('player-2', onMute2);
      audioManager.register('player-3', onMute3);

      // Player 1 claims audio -> non-claiming players notified
      audioManager.claimAudio('player-1');
      expect(audioManager.getActiveSource()).toBe('player-1');
      expect(onMute1).not.toHaveBeenCalled();
      expect(onMute2).toHaveBeenCalledTimes(1);
      expect(onMute3).toHaveBeenCalledTimes(1);

      // Player 2 claims audio -> Player 1 should receive onMute callback
      audioManager.claimAudio('player-2');
      expect(audioManager.getActiveSource()).toBe('player-2');
      expect(onMute1).toHaveBeenCalledTimes(1);
      expect(onMute2).toHaveBeenCalledTimes(1); // Not called on itself
      expect(onMute3).toHaveBeenCalledTimes(2); // Notified again
    });

    it('releases audio correctly', () => {
      const onMute1 = vi.fn();
      audioManager.register('player-1', onMute1);

      audioManager.claimAudio('player-1');
      expect(audioManager.getActiveSource()).toBe('player-1');

      // Release from different player has no effect
      audioManager.releaseAudio('player-other');
      expect(audioManager.getActiveSource()).toBe('player-1');

      // Release from active player clears active source
      audioManager.releaseAudio('player-1');
      expect(audioManager.getActiveSource()).toBeNull();
    });

    it('unregisters players cleanly', () => {
      const onMute1 = vi.fn();
      const unregister = audioManager.register('player-1', onMute1);

      audioManager.claimAudio('player-1');
      expect(audioManager.getActiveSource()).toBe('player-1');

      unregister();
      expect(audioManager.getActiveSource()).toBeNull();

      // Subsequent claim from another player should not call unregistered callback
      const onMute2 = vi.fn();
      audioManager.register('player-2', onMute2);
      audioManager.claimAudio('player-2');
      expect(onMute1).not.toHaveBeenCalled();
    });

    it('tracks and sets global sound preference', () => {
      expect(audioManager.isGloballyUnmuted()).toBe(false);
      audioManager.setGloballyUnmuted(true);
      expect(audioManager.isGloballyUnmuted()).toBe(true);
      audioManager.setGloballyUnmuted(false);
      expect(audioManager.isGloballyUnmuted()).toBe(false);
    });
  });

  describe('Video Aspect Ratio & Container Styling (Zero Cropping)', () => {
    it('defaults to 16 / 9 when no aspect ratio is provided', () => {
      const style = computeVideoContainerStyle();
      expect(style.aspectRatio).toBe('16 / 9');
      expect(style.needsAmbientBackdrop).toBe(false);
      expect(style.clampedRatio).toBeCloseTo(16 / 9, 2);
    });

    it('handles numeric aspect ratios within bounds', () => {
      // 4:5 portrait (0.8)
      const portrait = computeVideoContainerStyle(0.8);
      expect(portrait.aspectRatio).toBe('4 / 5');
      expect(portrait.needsAmbientBackdrop).toBe(false);

      // 1:1 square
      const square = computeVideoContainerStyle(1.0);
      expect(square.aspectRatio).toBe('1 / 1');
      expect(square.needsAmbientBackdrop).toBe(false);

      // 16:9 landscape
      const landscape = computeVideoContainerStyle(16 / 9);
      expect(landscape.aspectRatio).toBe('16 / 9');
      expect(landscape.needsAmbientBackdrop).toBe(false);
    });

    it('handles string aspect ratios formatted as fractions or colons', () => {
      expect(computeVideoContainerStyle('16:9').aspectRatio).toBe('16 / 9');
      expect(computeVideoContainerStyle('16 / 9').aspectRatio).toBe('16 / 9');
      expect(computeVideoContainerStyle('4:5').aspectRatio).toBe('4 / 5');
      expect(computeVideoContainerStyle('4 / 5').aspectRatio).toBe('4 / 5');
      expect(computeVideoContainerStyle('1:1').aspectRatio).toBe('1 / 1');
      expect(computeVideoContainerStyle('4:3').aspectRatio).toBe('4 / 3');
    });

    it('clamps vertical 9:16 videos to 4:5 portrait and enables ambient backdrop', () => {
      const tall = computeVideoContainerStyle('9:16');
      expect(tall.aspectRatio).toBe('4 / 5');
      expect(tall.needsAmbientBackdrop).toBe(true);
      expect(tall.clampedRatio).toBeCloseTo(0.8, 2);

      const tallNumeric = computeVideoContainerStyle(9 / 16);
      expect(tallNumeric.aspectRatio).toBe('4 / 5');
      expect(tallNumeric.needsAmbientBackdrop).toBe(true);
    });

    it('clamps ultra-wide 21:9 videos to 16:9 and enables ambient backdrop', () => {
      const ultraWide = computeVideoContainerStyle('21:9');
      expect(ultraWide.aspectRatio).toBe('16 / 9');
      expect(ultraWide.needsAmbientBackdrop).toBe(true);
      expect(ultraWide.clampedRatio).toBeCloseTo(16 / 9, 2);

      const ultraWideNumeric = computeVideoContainerStyle(21 / 9);
      expect(ultraWideNumeric.aspectRatio).toBe('16 / 9');
      expect(ultraWideNumeric.needsAmbientBackdrop).toBe(true);
    });

    it('safely handles invalid, zero, or non-finite inputs', () => {
      expect(computeVideoContainerStyle(0).aspectRatio).toBe('16 / 9');
      expect(computeVideoContainerStyle(-1).aspectRatio).toBe('16 / 9');
      expect(computeVideoContainerStyle('invalid').aspectRatio).toBe('16 / 9');
      expect(computeVideoContainerStyle('').aspectRatio).toBe('16 / 9');
    });
  });

  describe('Micro-Scrubber Time Formatting & Calculations', () => {
    it('formats seconds to mm:ss correctly', () => {
      expect(formatVideoTime(0)).toBe('0:00');
      expect(formatVideoTime(14)).toBe('0:14');
      expect(formatVideoTime(45)).toBe('0:45');
      expect(formatVideoTime(60)).toBe('1:00');
      expect(formatVideoTime(75)).toBe('1:15');
      expect(formatVideoTime(599)).toBe('9:59');
    });

    it('formats hours for long-form video content (hh:mm:ss)', () => {
      expect(formatVideoTime(3600)).toBe('1:00:00');
      expect(formatVideoTime(3665)).toBe('1:01:05');
      expect(formatVideoTime(7322)).toBe('2:02:02');
    });

    it('handles negative, NaN, or infinite seconds safely', () => {
      expect(formatVideoTime(-10)).toBe('0:00');
      expect(formatVideoTime(NaN)).toBe('0:00');
      expect(formatVideoTime(Infinity)).toBe('0:00');
    });

    it('calculates seek position seconds from ratio and duration', () => {
      expect(calculateSeekTime(0.5, 60)).toBe(30);
      expect(calculateSeekTime(0, 60)).toBe(0);
      expect(calculateSeekTime(1, 60)).toBe(60);
      expect(calculateSeekTime(1.5, 60)).toBe(60); // Clamped to duration
      expect(calculateSeekTime(-0.2, 60)).toBe(0); // Clamped to 0
      expect(calculateSeekTime(0.5, 0)).toBe(0);
    });

    it('calculates progress percentage from current time and duration', () => {
      expect(calculateProgressPercentage(15, 60)).toBe(25);
      expect(calculateProgressPercentage(0, 60)).toBe(0);
      expect(calculateProgressPercentage(60, 60)).toBe(100);
      expect(calculateProgressPercentage(90, 60)).toBe(100); // Clamped
      expect(calculateProgressPercentage(-5, 60)).toBe(0); // Clamped
      expect(calculateProgressPercentage(15, 0)).toBe(0);
      expect(calculateProgressPercentage(15, NaN)).toBe(0);
    });
  });
});
