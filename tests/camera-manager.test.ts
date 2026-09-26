import { describe, it, expect, vi, beforeEach } from 'vitest';
import { CameraManager } from '../packages/media/src/creation/camera-manager';

describe('CameraManager', () => {
  beforeEach(() => {
    vi.restoreAllMocks();
  });

  it('initializes with UNKNOWN permission state and user facing mode', () => {
    const manager = new CameraManager();
    expect(manager.getPermissionState()).toBe('UNKNOWN');
    expect(manager.getFacingMode()).toBe('user');
  });

  it('transitions to GRANTED when getUserMedia resolves a MediaStream', async () => {
    const mockTrack = {
      stop: vi.fn(),
      getCapabilities: () => ({ torch: false }),
      applyConstraints: vi.fn(),
    };
    const mockStream = {
      getVideoTracks: () => [mockTrack],
      getAudioTracks: () => [mockTrack],
      getTracks: () => [mockTrack],
    } as unknown as MediaStream;

    navigator.mediaDevices = {
      getUserMedia: vi.fn().mockResolvedValue(mockStream),
      enumerateDevices: vi.fn().mockResolvedValue([]),
    } as any;

    const manager = new CameraManager();
    const stream = await manager.startCamera('user', 'video');
    expect(stream).toBe(mockStream);
    expect(manager.getPermissionState()).toBe('GRANTED');
  });

  it('transitions to DENIED on NotAllowedError', async () => {
    const notAllowedError = new Error('Permission denied');
    notAllowedError.name = 'NotAllowedError';

    navigator.mediaDevices = {
      getUserMedia: vi.fn().mockRejectedValue(notAllowedError),
      enumerateDevices: vi.fn().mockResolvedValue([]),
    } as any;

    const manager = new CameraManager();
    await expect(manager.startCamera('user', 'photo')).rejects.toThrow();
    expect(manager.getPermissionState()).toBe('DENIED');
  });

  it('stops all existing tracks before switching cameras', async () => {
    const stopFn = vi.fn();
    const mockTrack = { stop: stopFn, getCapabilities: () => ({}), applyConstraints: vi.fn() };
    const mockStream = {
      getVideoTracks: () => [mockTrack],
      getAudioTracks: () => [mockTrack],
      getTracks: () => [mockTrack],
    } as unknown as MediaStream;

    navigator.mediaDevices = {
      getUserMedia: vi.fn().mockResolvedValue(mockStream),
      enumerateDevices: vi.fn().mockResolvedValue([]),
    } as any;

    const manager = new CameraManager();
    await manager.startCamera('user', 'video');
    await manager.switchCamera('environment');

    expect(stopFn).toHaveBeenCalled();
    expect(manager.getFacingMode()).toBe('environment');
  });
});
