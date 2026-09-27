import { describe, it, expect, vi } from 'vitest';
import PhotoEditor, {
  CARIBBEAN_PRESETS,
  ASPECT_RATIOS,
  DEFAULT_PHOTO_EDIT_STATE,
} from '../apps/web/src/components/media/creation/photo-editor';
import type { PhotoEditorProps } from '../apps/web/src/components/media/creation/photo-editor';

describe('PhotoEditor Component', () => {
  const defaultProps: PhotoEditorProps = {
    imageSrc: 'https://images.unsplash.com/photo-1544551763-46a013bb70d5',
    onSave: vi.fn(),
    onCancel: vi.fn(),
  };

  it('is a defined functional component with expected constants', () => {
    expect(PhotoEditor).toBeDefined();
    expect(typeof PhotoEditor).toBe('function');
    expect(CARIBBEAN_PRESETS).toBeDefined();
    expect(CARIBBEAN_PRESETS.length).toBeGreaterThanOrEqual(6);
    expect(ASPECT_RATIOS).toBeDefined();
    expect(ASPECT_RATIOS).toEqual(['free', '1:1', '4:5', '9:16', '16:9']);
    expect(DEFAULT_PHOTO_EDIT_STATE).toEqual({
      crop: { x: 0, y: 0, width: 0, height: 0 },
      aspectRatio: '1:1',
      rotationDeg: 0,
      flipHorizontal: false,
      filter: 'none',
      brightness: 0,
      contrast: 0,
      saturation: 0,
      altText: '',
    });
  });

  it('renders a valid JSX element structure with accessible container role', () => {
    const vdom = PhotoEditor(defaultProps);
    expect(vdom).toBeDefined();
    expect(vdom.type).toBe('div');
    expect(vdom.props['role']).toBe('region');
    expect(vdom.props['aria-label']).toBe('Photo studio editor');
  });

  it('renders top navigation and handles cancel and apply callbacks', () => {
    const onSave = vi.fn();
    const onCancel = vi.fn();
    const vdom = PhotoEditor({
      ...defaultProps,
      onSave,
      onCancel,
    });

    const [topHeader] = vdom.props.children;
    const [cancelBtn, , applyBtn] = topHeader.props.children;

    expect(cancelBtn.props.children).toBe('Cancel');
    cancelBtn.props.onClick();
    expect(onCancel).toHaveBeenCalledTimes(1);

    applyBtn.props.onClick();
    expect(onSave).toHaveBeenCalledWith(expect.objectContaining({
      aspectRatio: '1:1',
      filter: 'none',
    }));
  });

  it('renders image preview with initial transform and filter style', () => {
    const vdom = PhotoEditor({
      ...defaultProps,
      imageSrc: 'https://images.unsplash.com/sample-photo.jpg',
    });

    const [, previewArea] = vdom.props.children;
    const aspectContainer = previewArea.props.children;
    const [imgElement] = aspectContainer.props.children;

    expect(imgElement.props.src).toBe('https://images.unsplash.com/sample-photo.jpg');
    expect(imgElement.props.alt).toBe('Captured photo preview');
    expect(imgElement.props.style.transform).toContain('rotate(0deg)');
    expect(imgElement.props.style.transform).toContain('scaleX(1)');
    expect(imgElement.props.style.filter).toContain('brightness(100%)');
    expect(imgElement.props.style.filter).toContain('contrast(100%)');
    expect(imgElement.props.style.filter).toContain('saturate(100%)');
  });

  it('renders Caribbean preset filter options when activeTab is presets', () => {
    const vdom = PhotoEditor({
      ...defaultProps,
      initialTab: 'presets',
    });

    const [, , controls] = vdom.props.children;
    const [, presetsTab] = controls.props.children;
    const presetButtons = presetsTab.props.children;

    expect(presetButtons.length).toBe(CARIBBEAN_PRESETS.length);
    const presetIds = CARIBBEAN_PRESETS.map((p) => p.id);
    expect(presetIds).toEqual([
      'none',
      'caribbean_warmth',
      'golden_hour',
      'twilight_purple',
      'sea_clarity',
      'monochrome',
    ]);
  });

  it('renders adjustment sliders for Brightness, Contrast, Saturation', () => {
    const vdom = PhotoEditor({
      ...defaultProps,
      initialTab: 'adjust',
    });

    const [, , controls] = vdom.props.children;
    const adjustTab = controls.props.children[2];
    const [brightnessRow, contrastRow, saturationRow] = adjustTab.props.children;

    expect(brightnessRow.props.children[0].props.children).toBe('Brightness');
    expect(brightnessRow.props.children[1].props['aria-label']).toBe('Brightness');
    expect(brightnessRow.props.children[1].props.min).toBe('-50');
    expect(brightnessRow.props.children[1].props.max).toBe('50');

    expect(contrastRow.props.children[0].props.children).toBe('Contrast');
    expect(contrastRow.props.children[1].props['aria-label']).toBe('Contrast');
    expect(contrastRow.props.children[1].props.min).toBe('-50');
    expect(contrastRow.props.children[1].props.max).toBe('50');

    expect(saturationRow.props.children[0].props.children).toBe('Saturation');
    expect(saturationRow.props.children[1].props['aria-label']).toBe('Saturation');
    expect(saturationRow.props.children[1].props.min).toBe('-50');
    expect(saturationRow.props.children[1].props.max).toBe('50');
  });

  it('renders aspect ratios (free, 1:1, 4:5, 9:16, 16:9) and rotate/flip controls', () => {
    const vdom = PhotoEditor({
      ...defaultProps,
      initialTab: 'crop',
    });

    const [, , controls] = vdom.props.children;
    const cropTab = controls.props.children[3];
    const [toolsGroup, ratiosGroup] = cropTab.props.children;

    const [rotateBtn, flipBtn] = toolsGroup.props.children;
    expect(rotateBtn.props.children).toEqual(expect.arrayContaining(['Rotate 90°']));
    expect(flipBtn.props.children).toEqual(expect.arrayContaining(['Flip']));

    const ratioButtons = ratiosGroup.props.children;
    expect(ratioButtons.length).toBe(5);
    const labels = ratioButtons.map((btn: any) => btn.props.children);
    expect(labels).toEqual(['Free', '1:1', '4:5', '9:16', '16:9']);
  });

  it('handles WCAG accessibility alt-text and custom initial state', () => {
    const customAlt = 'Sun rising over Carlisle Bay, Barbados with catamaran on turquoise water';
    const vdom = PhotoEditor({
      ...defaultProps,
      initialState: {
        altText: customAlt,
        filter: 'caribbean_warmth',
        brightness: 10,
        contrast: 15,
        saturation: 20,
        rotationDeg: 90,
        flipHorizontal: true,
        aspectRatio: '16:9',
      },
    });

    const [, previewArea, controls] = vdom.props.children;
    const aspectContainer = previewArea.props.children;
    const [imgElement] = aspectContainer.props.children;

    // Alt text reflected on preview image
    expect(imgElement.props.alt).toBe(customAlt);
    // Custom transform and filter applied
    expect(imgElement.props.style.transform).toBe('rotate(90deg) scaleX(-1)');
    expect(imgElement.props.style.filter).toContain('sepia(18%)');
    expect(imgElement.props.style.filter).toContain('hue-rotate(-5deg)');

    // WCAG accessibility input field
    const altTextField = controls.props.children[4];
    const altInput = altTextField.props.children[1];
    expect(altInput.props.value).toBe(customAlt);
    expect(altInput.props['aria-label']).toBe('Image description for screen readers (alt text)');
    expect(altInput.props.role).toBe('textbox');
  });
});
