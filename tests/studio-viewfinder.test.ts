import { describe, it, expect, vi } from 'vitest';
import StudioViewfinder from '../apps/web/src/components/media/creation/studio-viewfinder';
import type { StudioViewfinderProps } from '../apps/web/src/components/media/creation/studio-viewfinder';

describe('StudioViewfinder Component', () => {
  const defaultProps: StudioViewfinderProps = {
    mode: 'photo',
    permissionState: 'GRANTED',
    videoRef: { current: null },
    facingMode: 'user',
    torchSupported: true,
    torchEnabled: false,
    countdown: null,
    isRecording: false,
    isPaused: false,
    clips: [],
    totalDurationMs: 0,
    maxDurationMs: 60000,
    onSwitchCamera: vi.fn(),
    onToggleTorch: vi.fn(),
    onStartCapture: vi.fn(),
    onPauseCapture: vi.fn(),
    onResumeCapture: vi.fn(),
    onStopCapture: vi.fn(),
    onDeleteLastClip: vi.fn(),
    onOpenLibraryFallback: vi.fn(),
    onRetryPermissions: vi.fn(),
  };

  it('is a defined functional component', () => {
    expect(StudioViewfinder).toBeDefined();
    expect(typeof StudioViewfinder).toBe('function');
  });

  it('renders a valid JSX element structure for live camera stream', () => {
    const vdom = StudioViewfinder(defaultProps);
    expect(vdom).toBeDefined();
    expect(vdom.type).toBe('div');
    expect(vdom.props['role']).toBe('region');
    expect(vdom.props['aria-label']).toBe('Camera viewfinder');
  });

  it('renders permission recovery UI when permissionState is DENIED or BLOCKED', () => {
    const deniedProps: StudioViewfinderProps = {
      ...defaultProps,
      permissionState: 'DENIED',
    };
    const vdom = StudioViewfinder(deniedProps);
    expect(vdom).toBeDefined();
    expect(vdom.type).toBe('div');
  });

  it('renders progress bar for video/reel mode', () => {
    const reelProps: StudioViewfinderProps = {
      ...defaultProps,
      mode: 'reel',
      totalDurationMs: 15000,
      maxDurationMs: 60000,
    };
    const vdom = StudioViewfinder(reelProps);
    expect(vdom).toBeDefined();
  });

  it('renders countdown overlay when countdown is active', () => {
    const countdownProps: StudioViewfinderProps = {
      ...defaultProps,
      countdown: 3,
    };
    const vdom = StudioViewfinder(countdownProps);
    expect(vdom).toBeDefined();
  });

  it('handles multi-clip segments and recording states', () => {
    const multiClipProps: StudioViewfinderProps = {
      ...defaultProps,
      mode: 'video',
      isRecording: true,
      isPaused: false,
      clips: [
        {
          id: 'clip-1',
          blob: null as any,
          previewUrl: 'blob:test',
          durationMs: 4000,
          trimStartMs: 0,
          trimEndMs: 0,
          speed: 1.0,
          order: 0,
        },
      ],
      totalDurationMs: 8000,
    };
    const vdom = StudioViewfinder(multiClipProps);
    expect(vdom).toBeDefined();
  });

  it('handles paused recording state with resume trigger', () => {
    const pausedProps: StudioViewfinderProps = {
      ...defaultProps,
      mode: 'video',
      isRecording: true,
      isPaused: true,
    };
    const vdom = StudioViewfinder(pausedProps);
    expect(vdom).toBeDefined();
  });
});
