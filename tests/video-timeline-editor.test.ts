import { describe, it, expect, vi } from 'vitest';
import VideoTimelineEditor, {
  DEFAULT_VIDEO_EDIT_STATE,
  reorderClips,
  nudgeClip,
} from '../apps/web/src/components/media/creation/video-timeline-editor';
import type { VideoTimelineEditorProps } from '../apps/web/src/components/media/creation/video-timeline-editor';
import type { RecordedClip } from '@caribbean/media';
import { CARIBBEAN_SOUNDS } from '../apps/web/src/lib/constants/caribbean-sounds';

describe('VideoTimelineEditor Component', () => {
  const sampleClips: RecordedClip[] = [
    {
      id: 'clip-1',
      blob: new Blob([], { type: 'video/mp4' }),
      previewUrl: 'blob:clip-1-preview',
      durationMs: 5000,
      trimStartMs: 0,
      trimEndMs: 0,
      speed: 1.0,
      order: 0,
    },
    {
      id: 'clip-2',
      blob: new Blob([], { type: 'video/mp4' }),
      previewUrl: 'blob:clip-2-preview',
      durationMs: 8000,
      trimStartMs: 0,
      trimEndMs: 0,
      speed: 1.0,
      order: 1,
    },
    {
      id: 'clip-3',
      blob: new Blob([], { type: 'video/mp4' }),
      previewUrl: 'blob:clip-3-preview',
      durationMs: 3000,
      trimStartMs: 0,
      trimEndMs: 0,
      speed: 1.0,
      order: 2,
    },
  ];

  const defaultProps: VideoTimelineEditorProps = {
    clips: sampleClips,
    onSave: vi.fn(),
    onCancel: vi.fn(),
  };

  it('is a defined functional component with expected defaults and helpers', () => {
    expect(VideoTimelineEditor).toBeDefined();
    expect(typeof VideoTimelineEditor).toBe('function');
    expect(DEFAULT_VIDEO_EDIT_STATE).toEqual({
      clips: [],
      selectedSoundId: undefined,
      selectedSoundTitle: undefined,
      selectedSoundUrl: undefined,
      soundVolume: 80,
      micVolume: 100,
      activeFilter: 'none',
      textOverlays: [],
      coverTimestampMs: 0,
    });

    // Test pure reordering helper functions
    const reordered = reorderClips(sampleClips, 0, 2);
    expect(reordered.map((c) => c.id)).toEqual(['clip-2', 'clip-3', 'clip-1']);
    expect(reordered.map((c) => c.order)).toEqual([0, 1, 2]);

    const nudgedRight = nudgeClip(sampleClips, 0, 1);
    expect(nudgedRight.map((c) => c.id)).toEqual(['clip-2', 'clip-1', 'clip-3']);

    const nudgedLeft = nudgeClip(sampleClips, 2, -1);
    expect(nudgedLeft.map((c) => c.id)).toEqual(['clip-1', 'clip-3', 'clip-2']);
  });

  it('renders accessible container and top navigation with cancel and done callbacks', () => {
    const onSave = vi.fn();
    const onCancel = vi.fn();
    const vdom = VideoTimelineEditor({
      ...defaultProps,
      onSave,
      onCancel,
    });

    expect(vdom).toBeDefined();
    expect(vdom.props['role']).toBe('region');
    expect(vdom.props['aria-label']).toBe('Video timeline editor');

    const [topHeader] = vdom.props.children;
    const [cancelBtn, titleSpan, doneBtn] = topHeader.props.children;

    expect(cancelBtn.props.children).toBe('Cancel');
    cancelBtn.props.onClick();
    expect(onCancel).toHaveBeenCalledTimes(1);

    expect(titleSpan.props.children).toBe('Video / Reel Studio');

    doneBtn.props.onClick();
    expect(onSave).toHaveBeenCalledWith(expect.objectContaining({
      clips: sampleClips,
      micVolume: 100,
      soundVolume: 80,
      coverTimestampMs: 0,
    }));
  });

  it('renders multi-clip timeline sequence and active video preview', () => {
    const vdom = VideoTimelineEditor(defaultProps);

    const [, viewport, bottomControls] = vdom.props.children;
    const [videoElement, playOverlay] = viewport.props.children;

    expect(videoElement.props.src).toBe('blob:clip-1-preview');
    expect(playOverlay.props['aria-label']).toBe('Play preview');

    const [sequenceSection] = bottomControls.props.children;
    const [headerRow, scrollArea] = sequenceSection.props.children;

    // Timeline count header
    const [titleSpan] = headerRow.props.children;
    expect(titleSpan.props.children).toEqual(expect.arrayContaining(['Clip Timeline (', 3, ' segments)']));

    // 3 segment chips
    const segmentChips = scrollArea.props.children;
    expect(segmentChips.length).toBe(3);

    const firstChipText = segmentChips[0].props.children[0].props.children;
    expect(firstChipText).toEqual(['Take ', 1, ' (', '5.0', 's)']);

    const secondChipText = segmentChips[1].props.children[0].props.children;
    expect(secondChipText).toEqual(['Take ', 2, ' (', '8.0', 's)']);
  });

  it('handles clip reordering and nudge button presence', () => {
    const vdom = VideoTimelineEditor(defaultProps);

    const [, , bottomControls] = vdom.props.children;
    const [sequenceSection] = bottomControls.props.children;
    const [, scrollArea] = sequenceSection.props.children;
    const [firstClip, secondClip, thirdClip] = scrollArea.props.children;

    // First clip only has nudge right
    const firstNudgeLeft = firstClip.props.children[1];
    const firstNudgeRight = firstClip.props.children[2];
    expect(firstNudgeLeft).toBeFalsy();
    expect(firstNudgeRight).toBeTruthy();
    expect(firstNudgeRight.props['aria-label']).toBe('Move clip 1 later');

    // Second clip has both nudge left and right
    const secondNudgeLeft = secondClip.props.children[1];
    const secondNudgeRight = secondClip.props.children[2];
    expect(secondNudgeLeft).toBeTruthy();
    expect(secondNudgeRight).toBeTruthy();
    expect(secondNudgeLeft.props['aria-label']).toBe('Move clip 2 earlier');
    expect(secondNudgeRight.props['aria-label']).toBe('Move clip 2 later');

    // Third clip only has nudge left
    const thirdNudgeLeft = thirdClip.props.children[1];
    const thirdNudgeRight = thirdClip.props.children[2];
    expect(thirdNudgeLeft).toBeTruthy();
    expect(thirdNudgeRight).toBeFalsy();
    expect(thirdNudgeLeft.props['aria-label']).toBe('Move clip 3 earlier');

    // Executing nudge right on first clip should execute without throwing
    expect(() => {
      firstNudgeRight.props.onClick({ stopPropagation: vi.fn() });
    }).not.toThrow();
  });

  it('renders dual volume sliders for camera audio and Caribbean rhythm stem', () => {
    const vdom = VideoTimelineEditor({
      ...defaultProps,
      initialState: {
        micVolume: 65,
        soundVolume: 40,
      },
    });

    const [, , bottomControls] = vdom.props.children;
    const [, volumeSection] = bottomControls.props.children;
    const [cameraAudioRow, rhythmStemRow] = volumeSection.props.children;

    const cameraSlider = cameraAudioRow.props.children[1];
    expect(cameraSlider.props['aria-label']).toBe('Camera audio volume');
    expect(cameraSlider.props.min).toBe('0');
    expect(cameraSlider.props.max).toBe('100');
    expect(cameraSlider.props.value).toBe(65);

    const stemSlider = rhythmStemRow.props.children[1];
    expect(stemSlider.props['aria-label']).toBe('Rhythm stem volume');
    expect(stemSlider.props.min).toBe('0');
    expect(stemSlider.props.max).toBe('100');
    expect(stemSlider.props.value).toBe(40);
  });

  it('renders cover frame selector scrubber with total duration range', () => {
    const totalDuration = 5000 + 8000 + 3000; // 16000ms
    const vdom = VideoTimelineEditor({
      ...defaultProps,
      initialState: {
        coverTimestampMs: 4200,
      },
    });

    const [, , bottomControls] = vdom.props.children;
    const [, , coverSection] = bottomControls.props.children;
    const [coverLabelDiv, coverScrubber] = coverSection.props.children;

    expect(coverScrubber.props['aria-label']).toBe('Cover frame scrubber');
    expect(coverScrubber.props.min).toBe('0');
    expect(coverScrubber.props.max).toBe(totalDuration);
    expect(coverScrubber.props.value).toBe(4200);

    const coverText = coverLabelDiv.props.children[1].props.children;
    expect(coverText).toEqual(['Cover Frame: ', '4.2', 's']);
  });

  it('renders Caribbean sound picker and handles sound selection', () => {
    const vdom = VideoTimelineEditor({
      ...defaultProps,
      initialShowSoundPicker: true,
    });

    const [, , bottomControls] = vdom.props.children;
    const [, , , soundPickerContainer] = bottomControls.props.children;

    expect(soundPickerContainer).toBeDefined();
    expect(soundPickerContainer.props['role']).toBe('region');
    expect(soundPickerContainer.props['aria-label']).toBe('Caribbean sound picker');

    const [noneBtn, soundButtons] = soundPickerContainer.props.children;
    expect(noneBtn.props.children).toBe('None (Original Audio Only)');
    expect(soundButtons.length).toBeGreaterThanOrEqual(1);

    const firstSound = CARIBBEAN_SOUNDS[0];
    const firstSoundBtn = soundButtons[0];
    expect(firstSoundBtn.props['aria-label']).toBe(`Select ${firstSound.title} by ${firstSound.artist}`);
  });

  it('passes complete VideoEditState payload to onSave callback with selected sound and custom state', () => {
    const onSave = vi.fn();
    const firstSound = CARIBBEAN_SOUNDS[0];

    const vdom = VideoTimelineEditor({
      ...defaultProps,
      initialState: {
        selectedSoundId: firstSound.id,
        soundVolume: 75,
        micVolume: 90,
        coverTimestampMs: 2500,
      },
      onSave,
    });

    const [topHeader] = vdom.props.children;
    const [, , doneBtn] = topHeader.props.children;

    doneBtn.props.onClick();

    expect(onSave).toHaveBeenCalledWith({
      clips: sampleClips,
      selectedSoundId: firstSound.id,
      selectedSoundTitle: firstSound.title,
      selectedSoundUrl: firstSound.audioUrl,
      soundVolume: 75,
      micVolume: 90,
      activeFilter: 'none',
      textOverlays: [],
      coverTimestampMs: 2500,
    });
  });

  it('renders fallback UI when no clips are present', () => {
    const vdom = VideoTimelineEditor({
      ...defaultProps,
      clips: [],
    });

    const [, viewport] = vdom.props.children;
    const [emptySpan] = viewport.props.children;

    expect(emptySpan.props.children).toBe('No clip recorded');
  });
});
