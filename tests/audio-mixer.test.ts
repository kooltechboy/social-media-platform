import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { AudioMixerGraph } from '../packages/media/src/creation/audio-mixer';

describe('AudioMixerGraph', () => {
  let originalWindow: any;

  beforeEach(() => {
    vi.restoreAllMocks();
    originalWindow = global.window;
  });

  afterEach(() => {
    global.window = originalWindow;
  });

  it('calculates proper normalized gain multiplier for percentages 0 to 100', () => {
    const mixer = new AudioMixerGraph();
    expect(mixer.normalizeVolume(0)).toBe(0);
    expect(mixer.normalizeVolume(50)).toBe(0.5);
    expect(mixer.normalizeVolume(100)).toBe(1.0);
    expect(mixer.normalizeVolume(150)).toBe(1.0); // clamped
    expect(mixer.normalizeVolume(-20)).toBe(0); // clamped
    expect(mixer.normalizeVolume(33.333)).toBe(0.33);
  });

  it('manages volume state for mic and stem tracks with clamping', () => {
    const mixer = new AudioMixerGraph();
    // Default values
    expect(mixer.getMicVolume()).toBe(100);
    expect(mixer.getStemVolume()).toBe(80);

    mixer.setMicVolume(80);
    mixer.setStemVolume(40);
    expect(mixer.getMicVolume()).toBe(80);
    expect(mixer.getStemVolume()).toBe(40);

    // Clamping limits
    mixer.setMicVolume(150);
    expect(mixer.getMicVolume()).toBe(100);

    mixer.setMicVolume(-10);
    expect(mixer.getMicVolume()).toBe(0);

    mixer.setStemVolume(200);
    expect(mixer.getStemVolume()).toBe(100);

    mixer.setStemVolume(-50);
    expect(mixer.getStemVolume()).toBe(0);
  });

  it('returns null if window or AudioContext is undefined', () => {
    (global as any).window = undefined;
    const mixer = new AudioMixerGraph();
    const result = mixer.setupGraph();
    expect(result).toBeNull();
  });

  it('sets up Web Audio graph connecting mic stream and stem audio element', () => {
    const mockMicGain = {
      gain: { setValueAtTime: vi.fn() },
      connect: vi.fn(),
    };
    const mockStemGain = {
      gain: { setValueAtTime: vi.fn() },
      connect: vi.fn(),
    };
    const mockDestinationStream = { id: 'mock-mixed-stream' } as unknown as MediaStream;
    const mockDestinationNode = {
      stream: mockDestinationStream,
    };
    const mockMicSourceNode = {
      connect: vi.fn(),
    };
    const mockStemSourceNode = {
      connect: vi.fn(),
    };

    const mockResume = vi.fn().mockResolvedValue(undefined);
    const mockClose = vi.fn().mockResolvedValue(undefined);

    class MockAudioContext {
      state = 'suspended';
      currentTime = 12.34;
      destination = { id: 'speaker-destination' };
      resume = mockResume;
      close = mockClose;
      createMediaStreamDestination = vi.fn().mockReturnValue(mockDestinationNode);
      createMediaStreamSource = vi.fn().mockReturnValue(mockMicSourceNode);
      createMediaElementSource = vi.fn().mockReturnValue(mockStemSourceNode);
      createGain = vi.fn()
        .mockReturnValueOnce(mockMicGain)
        .mockReturnValueOnce(mockStemGain);
    }

    (global as any).window = {
      AudioContext: MockAudioContext,
    };

    const mixer = new AudioMixerGraph();
    mixer.setMicVolume(75);
    mixer.setStemVolume(50);

    const mockMicStream = {
      getAudioTracks: () => [{ id: 'mic-track-1' }],
    } as unknown as MediaStream;

    const mockAudioElement = {} as HTMLAudioElement;

    const outputStream = mixer.setupGraph(mockMicStream, mockAudioElement);

    expect(outputStream).toBe(mockDestinationStream);
    expect(mockResume).toHaveBeenCalled();

    // Verify mic connections
    expect(mockMicGain.gain.setValueAtTime).toHaveBeenCalledWith(0.75, 12.34);
    expect(mockMicSourceNode.connect).toHaveBeenCalledWith(mockMicGain);
    expect(mockMicGain.connect).toHaveBeenCalledWith(mockDestinationNode);

    // Verify stem connections (to destination stream and speakers)
    expect(mockStemGain.gain.setValueAtTime).toHaveBeenCalledWith(0.5, 12.34);
    expect(mockStemSourceNode.connect).toHaveBeenCalledWith(mockStemGain);
    expect(mockStemGain.connect).toHaveBeenCalledWith(mockDestinationNode);
    expect(mockStemGain.connect).toHaveBeenCalledWith({ id: 'speaker-destination' });

    // Verify dynamic volume updates update gain nodes
    mixer.setMicVolume(90);
    expect(mockMicGain.gain.setValueAtTime).toHaveBeenCalledWith(0.9, 12.34);

    mixer.setStemVolume(20);
    expect(mockStemGain.gain.setValueAtTime).toHaveBeenCalledWith(0.2, 12.34);

    // Verify safe close
    mixer.close();
    expect(mockClose).toHaveBeenCalled();

    // Verify calling close again is safe and doesn't re-call context.close
    mixer.close();
    expect(mockClose).toHaveBeenCalledTimes(1);
  });

  it('handles stem connection errors gracefully without breaking setup', () => {
    const mockDestinationStream = { id: 'mock-mixed-stream' } as unknown as MediaStream;
    class MockAudioContext {
      state = 'running';
      currentTime = 0;
      destination = {};
      createMediaStreamDestination = vi.fn().mockReturnValue({ stream: mockDestinationStream });
      createMediaStreamSource = vi.fn();
      createMediaElementSource = vi.fn().mockImplementation(() => {
        throw new Error('Already connected or CORS error');
      });
      createGain = vi.fn();
      close = vi.fn();
    }

    (global as any).window = {
      AudioContext: MockAudioContext,
    };

    const mixer = new AudioMixerGraph();
    const mockAudioElement = {} as HTMLAudioElement;

    expect(() => {
      const stream = mixer.setupGraph(undefined, mockAudioElement);
      expect(stream).toBe(mockDestinationStream);
    }).not.toThrow();

    mixer.close();
  });
});
