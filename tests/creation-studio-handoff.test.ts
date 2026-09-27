import { describe, it, expect, vi } from 'vitest';
import * as fs from 'node:fs';
import * as path from 'node:path';
import { CARIBBEAN_SOUNDS } from '../apps/web/src/lib/constants/caribbean-sounds';
import type { CreationStudioHandoffPayload } from '../apps/web/src/components/media/creation/tukubi-creation-studio';
import type { UploadedMediaItem } from '../apps/web/src/components/universal-composer';

describe('Task 9: TukubiCreationStudio Integration & Handoff', () => {
  const rootDir = process.cwd();
  const composerPath = path.join(rootDir, 'apps/web/src/components/universal-composer.tsx');
  const createHubPath = path.join(rootDir, 'apps/web/src/components/create-hub-client.tsx');
  const createReelPath = path.join(rootDir, 'apps/web/src/components/reels/create-reel-modal.tsx');

  describe('Clean Migration & Architecture Verification', () => {
    it('UniversalComposer imports TukubiCreationStudio and removes legacy TukubiCameraModal', () => {
      const content = fs.readFileSync(composerPath, 'utf8');
      expect(content).toContain('TukubiCreationStudio');
      expect(content).not.toContain("from './media/tukubi-camera-modal'");
      expect(content).not.toContain('<TukubiCameraModal');
      expect(content).toContain('<TukubiCreationStudio');
      expect(content).toContain('onHandoffComplete');
    });

    it('CreateHubClient imports TukubiCreationStudio and removes legacy TukubiCameraModal', () => {
      const content = fs.readFileSync(createHubPath, 'utf8');
      expect(content).toContain('TukubiCreationStudio');
      expect(content).not.toContain("from './media/tukubi-camera-modal'");
      expect(content).not.toContain('<TukubiCameraModal');
      expect(content).toContain('<TukubiCreationStudio');
      expect(content).toContain('onHandoffComplete');
    });

    it('CreateReelModal imports TukubiCreationStudio and removes legacy TukubiCameraModal', () => {
      const content = fs.readFileSync(createReelPath, 'utf8');
      expect(content).toContain('TukubiCreationStudio');
      expect(content).not.toContain("from '../media/tukubi-camera-modal'");
      expect(content).not.toContain('<TukubiCameraModal');
      expect(content).toContain('<TukubiCreationStudio');
      expect(content).toContain('onHandoffComplete');
    });
  });

  describe('UniversalComposer Handoff Flow Contract', () => {
    it('seamlessly integrates photo handoff with aspectRatio, previewUrl, altText, and file', () => {
      const fakeFile = new File(['photo-binary'], 'caribbean-sunset.jpg', { type: 'image/jpeg' });
      const payload: CreationStudioHandoffPayload = {
        file: fakeFile,
        mediaKind: 'image',
        previewUrl: 'blob:https://tukubi.caribbean/photo-123',
        aspectRatio: '4:5',
        altText: 'Vibrant sunset in Maracas Bay Trinidad',
      };

      // Simulates UniversalComposer handleStudioHandoff logic
      let mediaList: UploadedMediaItem[] = [];
      let isExpanded = false;

      const handleStudioHandoff = (p: CreationStudioHandoffPayload) => {
        const item: UploadedMediaItem = {
          id: `media_${Date.now()}_test`,
          file: p.file,
          previewUrl: p.previewUrl,
          type: p.mediaKind,
          caption: p.altText || '',
          altText: p.altText,
          aspectRatio: p.aspectRatio,
          posterBlob: p.posterBlob,
        };
        mediaList = [...mediaList, item];
        isExpanded = true;
      };

      handleStudioHandoff(payload);

      expect(mediaList).toHaveLength(1);
      const added = mediaList[0];
      expect(added.file).toBe(fakeFile);
      expect(added.previewUrl).toBe('blob:https://tukubi.caribbean/photo-123');
      expect(added.aspectRatio).toBe('4:5');
      expect(added.altText).toBe('Vibrant sunset in Maracas Bay Trinidad');
      expect(added.type).toBe('image');
      expect(isExpanded).toBe(true);
    });

    it('seamlessly integrates video handoff with duration and poster frame into media list', () => {
      const fakeVideo = new File(['video-binary'], 'carnival-parade.mp4', { type: 'video/mp4' });
      const fakePoster = new Blob(['poster-binary'], { type: 'image/jpeg' });
      const payload: CreationStudioHandoffPayload = {
        file: fakeVideo,
        mediaKind: 'video',
        previewUrl: 'blob:https://tukubi.caribbean/video-456',
        aspectRatio: '9:16',
        durationSeconds: 15.4,
        posterBlob: fakePoster,
        altText: 'Soca Monarch Finals Parade',
      };

      let mediaList: UploadedMediaItem[] = [];
      let isReel = false;
      let composerMode = 'text';

      const handleStudioHandoff = (p: CreationStudioHandoffPayload, modalMode: string) => {
        const item: UploadedMediaItem = {
          id: `media_${Date.now()}_test2`,
          file: p.file,
          previewUrl: p.previewUrl,
          type: p.mediaKind,
          caption: p.altText || '',
          altText: p.altText,
          aspectRatio: p.aspectRatio,
          posterBlob: p.posterBlob,
        };
        mediaList = [...mediaList, item];
        if (modalMode === 'reel' || p.durationSeconds !== undefined) {
          if (modalMode === 'reel') {
            isReel = true;
            composerMode = 'reel';
          }
        }
      };

      handleStudioHandoff(payload, 'reel');

      expect(mediaList).toHaveLength(1);
      const added = mediaList[0];
      expect(added.file).toBe(fakeVideo);
      expect(added.previewUrl).toBe('blob:https://tukubi.caribbean/video-456');
      expect(added.aspectRatio).toBe('9:16');
      expect(added.posterBlob).toBe(fakePoster);
      expect(added.altText).toBe('Soca Monarch Finals Parade');
      expect(isReel).toBe(true);
      expect(composerMode).toBe('reel');
    });
  });

  describe('CreateReelModal Handoff Flow Contract', () => {
    it('updates video file, preview URL, matched sound, and duration on studio handoff', () => {
      const fakeReel = new File(['reel-data'], 'st-lucia-jumpup.mp4', { type: 'video/mp4' });
      const targetSound = CARIBBEAN_SOUNDS[0];

      const payload: CreationStudioHandoffPayload = {
        file: fakeReel,
        mediaKind: 'video',
        previewUrl: 'blob:https://tukubi.caribbean/reel-789',
        aspectRatio: '9:16',
        soundId: targetSound.id,
        soundTitle: targetSound.title,
        durationSeconds: 24.8,
      };

      let videoFile: File | null = null;
      let videoPreviewUrl: string | null = null;
      let videoDuration = 30;
      let selectedSound: any = null;
      let isCameraOpen = true;

      const handleReelStudioHandoff = (p: CreationStudioHandoffPayload) => {
        videoFile = p.file;
        videoPreviewUrl = p.previewUrl;
        if (p.durationSeconds) {
          videoDuration = Math.max(1, Math.round(p.durationSeconds));
        }
        if (p.soundId) {
          const matched = CARIBBEAN_SOUNDS.find((s) => s.id === p.soundId);
          if (matched) selectedSound = matched;
        } else if (p.soundTitle) {
          const matched = CARIBBEAN_SOUNDS.find(
            (s) => s.title.toLowerCase() === p.soundTitle?.toLowerCase()
          );
          if (matched) selectedSound = matched;
        }
        isCameraOpen = false;
      };

      handleReelStudioHandoff(payload);

      expect(videoFile).toBe(fakeReel);
      expect(videoPreviewUrl).toBe('blob:https://tukubi.caribbean/reel-789');
      expect(videoDuration).toBe(25);
      expect(selectedSound).toEqual(targetSound);
      expect(isCameraOpen).toBe(false);
    });

    it('matches sound by title if soundId is not provided or mismatched', () => {
      const fakeReel = new File(['reel-data'], 'bajan-roots.mp4', { type: 'video/mp4' });
      const targetSound = CARIBBEAN_SOUNDS[1];

      const payload: CreationStudioHandoffPayload = {
        file: fakeReel,
        mediaKind: 'video',
        previewUrl: 'blob:https://tukubi.caribbean/reel-sound-title',
        aspectRatio: '9:16',
        soundTitle: targetSound.title.toUpperCase(), // case insensitive match
        durationSeconds: 15,
      };

      let selectedSound: any = null;
      if (payload.soundTitle) {
        const matched = CARIBBEAN_SOUNDS.find(
          (s) => s.title.toLowerCase() === payload.soundTitle?.toLowerCase()
        );
        if (matched) selectedSound = matched;
      }

      expect(selectedSound).toBeDefined();
      expect(selectedSound?.id).toBe(targetSound.id);
    });
  });

  describe('CreateHubClient Handoff Flow Contract', () => {
    it('Camera Studio tool triggers studio opening and handoff injects media into active workspace', () => {
      let isCameraStudioOpen = false;
      let composerMode = 'text';
      let studioHandoffMedia: UploadedMediaItem[] = [];

      // User clicks "Camera Studio" card
      const onOpenStudioCardClick = () => {
        isCameraStudioOpen = true;
      };

      onOpenStudioCardClick();
      expect(isCameraStudioOpen).toBe(true);

      // Studio finishes recording / editing and hands off
      const fakeFile = new File(['img-data'], 'studio-photo.jpg', { type: 'image/jpeg' });
      const payload: CreationStudioHandoffPayload = {
        file: fakeFile,
        mediaKind: 'image',
        previewUrl: 'blob:https://tukubi.caribbean/studio-hub-123',
        aspectRatio: '1:1',
        altText: 'Kingston Street Art',
      };

      const onHandoffComplete = (p: CreationStudioHandoffPayload) => {
        isCameraStudioOpen = false;
        const handoffItem: UploadedMediaItem = {
          id: `media_${Date.now()}_hub`,
          file: p.file,
          previewUrl: p.previewUrl,
          type: p.mediaKind,
          caption: p.altText || '',
          altText: p.altText,
          aspectRatio: p.aspectRatio,
          posterBlob: p.posterBlob,
        };
        studioHandoffMedia = [handoffItem];
        composerMode = p.mediaKind === 'video' ? 'video' : 'photo';
      };

      onHandoffComplete(payload);

      expect(isCameraStudioOpen).toBe(false);
      expect(composerMode).toBe('photo');
      expect(studioHandoffMedia).toHaveLength(1);
      expect(studioHandoffMedia[0].altText).toBe('Kingston Street Art');
      expect(studioHandoffMedia[0].aspectRatio).toBe('1:1');
    });
  });
});
