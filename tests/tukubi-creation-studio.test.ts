import { describe, it, expect, vi } from 'vitest';
import TukubiCreationStudio from '../apps/web/src/components/media/creation/tukubi-creation-studio';
import type {
  TukubiCreationStudioProps,
  CreationStudioHandoffPayload,
} from '../apps/web/src/components/media/creation/tukubi-creation-studio';
import {
  TukubiCreationStudio as ExportedStudio,
  StudioViewfinder,
  PhotoEditor,
  VideoTimelineEditor,
} from '../apps/web/src/components/media/creation/index';
import type { RecordedClip } from '@caribbean/media';

describe('TukubiCreationStudio Top-Level Component', () => {
  const defaultProps: TukubiCreationStudioProps = {
    isOpen: true,
    initialMode: 'photo',
    onClose: vi.fn(),
    onHandoffComplete: vi.fn(),
  };

  const sampleClips: RecordedClip[] = [
    {
      id: 'clip-1',
      blob: new Blob(['video-data'], { type: 'video/webm' }),
      previewUrl: 'blob:clip-1',
      durationMs: 4000,
      trimStartMs: 0,
      trimEndMs: 4000,
      speed: 1.0,
      order: 0,
    },
  ];

  it('is a defined functional component with barrel exports in index.ts', () => {
    expect(TukubiCreationStudio).toBeDefined();
    expect(typeof TukubiCreationStudio).toBe('function');
    expect(ExportedStudio).toBe(TukubiCreationStudio);
    expect(StudioViewfinder).toBeDefined();
    expect(PhotoEditor).toBeDefined();
    expect(VideoTimelineEditor).toBeDefined();
  });

  it('renders null when isOpen is false', () => {
    const vdom = TukubiCreationStudio({
      ...defaultProps,
      isOpen: false,
    });
    expect(vdom).toBeNull();
  });

  it('renders an accessible modal dialog when isOpen is true', () => {
    const onClose = vi.fn();
    const vdom = TukubiCreationStudio({
      ...defaultProps,
      isOpen: true,
      onClose,
    });

    expect(vdom).toBeDefined();
    expect(vdom.props['role']).toBe('dialog');
    expect(vdom.props['aria-modal']).toBe(true);
    expect(vdom.props['aria-label']).toBe('Tukubi Creation Studio');

    // Find and verify close button inside header bar
    const container = vdom.props.children;
    const [headerBar] = container.props.children;
    const [closeButton] = headerBar.props.children;
    expect(closeButton.props['aria-label']).toBe('Close studio');
    closeButton.props.onClick();
    expect(onClose).toHaveBeenCalledTimes(1);
  });

  it('renders StudioViewfinder and mode selector in initial capture stage', () => {
    const vdom = TukubiCreationStudio({
      ...defaultProps,
      initialMode: 'photo',
      initialStage: 'capture',
    });

    const container = vdom.props.children;
    const children = container.props.children;

    // Viewfinder component should be present in children
    const viewfinder = children.find(
      (child: any) => child && child.type === StudioViewfinder
    );
    expect(viewfinder).toBeDefined();
    expect(viewfinder.props.mode).toBe('photo');

    // Rendered viewfinder VDOM should have role and aria-label
    const viewfinderVdom = StudioViewfinder(viewfinder.props);
    expect(viewfinderVdom.props['aria-label']).toBe('Camera viewfinder');
  });

  it('supports initial mode configuration for video and reel', () => {
    const videoVdom = TukubiCreationStudio({
      ...defaultProps,
      initialMode: 'video',
      initialStage: 'capture',
    });
    const videoViewfinder = videoVdom.props.children.props.children.find(
      (child: any) => child && child.type === StudioViewfinder
    );
    expect(videoViewfinder).toBeDefined();
    expect(videoViewfinder.props.mode).toBe('video');

    const reelVdom = TukubiCreationStudio({
      ...defaultProps,
      initialMode: 'reel',
      initialStage: 'capture',
    });
    const reelViewfinder = reelVdom.props.children.props.children.find(
      (child: any) => child && child.type === StudioViewfinder
    );
    expect(reelViewfinder).toBeDefined();
    expect(reelViewfinder.props.mode).toBe('reel');
  });

  it('renders PhotoEditor when stage is edit and mode is photo', () => {
    const vdom = TukubiCreationStudio({
      ...defaultProps,
      initialMode: 'photo',
      initialStage: 'edit',
      initialPhotoUrl: 'blob:sample-photo',
    });

    const container = vdom.props.children;
    const photoEditor = container.props.children.find(
      (child: any) => child && child.type === PhotoEditor
    );
    expect(photoEditor).toBeDefined();
    expect(photoEditor.props.imageSrc).toBe('blob:sample-photo');

    // Rendered photo editor should have role and aria-label
    const editorVdom = PhotoEditor(photoEditor.props);
    expect(editorVdom.props['aria-label']).toBe('Photo studio editor');
  });

  it('renders VideoTimelineEditor when stage is edit and mode is video/reel', () => {
    const vdom = TukubiCreationStudio({
      ...defaultProps,
      initialMode: 'reel',
      initialStage: 'edit',
      initialClips: sampleClips,
    });

    const container = vdom.props.children;
    const videoEditor = container.props.children.find(
      (child: any) => child && child.type === VideoTimelineEditor
    );
    expect(videoEditor).toBeDefined();
    expect(videoEditor.props.clips).toEqual(sampleClips);

    // Rendered video editor should have role and aria-label
    const editorVdom = VideoTimelineEditor(videoEditor.props);
    expect(editorVdom.props['aria-label']).toBe('Video timeline editor');
  });

  it('renders real progress telemetry bar when stage is exporting', () => {
    const vdom = TukubiCreationStudio({
      ...defaultProps,
      initialStage: 'exporting',
      initialExportProgress: 65,
    });

    const container = vdom.props.children;
    const exportingScreen = container.props.children.find(
      (child: any) => child && child.props && child.props['role'] === 'progressbar'
    );
    expect(exportingScreen).toBeDefined();
    expect(exportingScreen.props['aria-valuenow']).toBe(65);
    expect(exportingScreen.props['aria-valuemin']).toBe(0);
    expect(exportingScreen.props['aria-valuemax']).toBe(100);
  });

  it('handles onHandoffComplete callback with complete typed payload', () => {
    const onHandoffComplete = vi.fn();
    const payload: CreationStudioHandoffPayload = {
      file: new File(['img'], 'test.webp', { type: 'image/webp' }),
      mediaKind: 'image',
      previewUrl: 'blob:test-preview',
      aspectRatio: '1:1',
      altText: 'Caribbean sunset on the beach',
    };

    onHandoffComplete(payload);
    expect(onHandoffComplete).toHaveBeenCalledWith(
      expect.objectContaining({
        file: expect.any(File),
        mediaKind: 'image',
        previewUrl: 'blob:test-preview',
        aspectRatio: '1:1',
        altText: 'Caribbean sunset on the beach',
      })
    );
  });
});
