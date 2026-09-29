import { describe, it, expect, vi, beforeEach } from 'vitest';
import * as fs from 'node:fs';
import * as path from 'node:path';
import EventComposerPanel, {
  type EventComposerPanelProps,
} from '../apps/web/src/components/events/event-composer-panel';
import ReliefComposerPanel, {
  type ReliefComposerPanelProps,
} from '../apps/web/src/components/relief/relief-composer-panel';
import type { CreateEventInput } from '../apps/web/src/lib/events/types';
import type { CreateReliefCampaignInput } from '../apps/web/src/lib/relief/types';
import { RELIEF_CATEGORY_METADATA } from '../apps/web/src/lib/relief/types';

function serializeVDOM(vdom: any): string {
  const seen = new WeakSet();
  return JSON.stringify(vdom, (_key, value) => {
    if (typeof value === 'object' && value !== null) {
      if (seen.has(value)) {
        return '[Circular]';
      }
      seen.add(value);
    }
    return value;
  });
}

describe('Task 6: Wire Event & Relief Panels into UniversalComposer', () => {
  const rootDir = process.cwd();
  const eventPanelPath = path.join(
    rootDir,
    'apps/web/src/components/events/event-composer-panel.tsx'
  );
  const reliefPanelPath = path.join(
    rootDir,
    'apps/web/src/components/relief/relief-composer-panel.tsx'
  );
  const composerPath = path.join(
    rootDir,
    'apps/web/src/components/universal-composer.tsx'
  );

  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('1. EventComposerPanel Component & Accessibility', () => {
    it('declares EventComposerPanel and EventComposerPanelProps interface', () => {
      const source = fs.readFileSync(eventPanelPath, 'utf8');
      expect(source).toContain('export interface EventComposerPanelProps');
      expect(source).toMatch(/value:\s*CreateEventInput/);
      expect(source).toMatch(/onChange:\s*\(val:\s*CreateEventInput\)\s*=>\s*void/);
    });

    it('renders all required event fields with min 44x44px touch targets', () => {
      const sampleEvent: CreateEventInput = {
        title: 'Kingston Reggae & Soca Sunsplash',
        description: 'Pan-Caribbean musical festival in Kingston',
        event_kind: 'in_person',
        privacy: 'public',
        venue: 'National Stadium, Kingston',
        livestream_url: '',
        starts_at: '2026-11-20T18:00',
        ends_at: '2026-11-21T02:00',
        capacity: 500,
      };

      const onChange = vi.fn();
      const vdom = EventComposerPanel({
        value: sampleEvent,
        onChange,
      });

      const serialized = serializeVDOM(vdom);
      expect(serialized).toContain('Kingston Reggae & Soca Sunsplash');
      expect(serialized).toContain('National Stadium, Kingston');
      expect(serialized).toContain('datetime-local');
      expect(serialized).toContain('in_person');

      const source = fs.readFileSync(eventPanelPath, 'utf8');
      expect(source).toMatch(/min-h-\[(44px|48px)\]/);
      expect(source).toMatch(/starts_at/);
      expect(source).toMatch(/ends_at/);
      expect(source).toMatch(/event_kind/);
      expect(source).toMatch(/privacy/);
      expect(source).toMatch(/capacity/);
    });

    it('handles format toggle between in_person, livestream, and hybrid', () => {
      const source = fs.readFileSync(eventPanelPath, 'utf8');
      expect(source).toContain('in_person');
      expect(source).toContain('livestream');
      expect(source).toContain('hybrid');
    });

    it('displays validation alert when ends_at is before starts_at', () => {
      const invalidEvent: CreateEventInput = {
        title: 'Invalid Timing Event',
        event_kind: 'in_person',
        starts_at: '2026-11-25T18:00',
        ends_at: '2026-11-24T18:00',
      };

      const vdom = EventComposerPanel({
        value: invalidEvent,
        onChange: vi.fn(),
      });

      const serialized = serializeVDOM(vdom);
      expect(serialized).toMatch(/alert|error|must be after start/i);
    });
  });

  describe('2. ReliefComposerPanel Component & Agency Metadata', () => {
    it('declares ReliefComposerPanel and ReliefComposerPanelProps interface', () => {
      const source = fs.readFileSync(reliefPanelPath, 'utf8');
      expect(source).toContain('export interface ReliefComposerPanelProps');
      expect(source).toMatch(/value:\s*CreateReliefCampaignInput/);
      expect(source).toMatch(/onChange:\s*\(val:\s*CreateReliefCampaignInput\)\s*=>\s*void/);
    });

    it('renders all required relief fields including territory ISO and protocol reference', () => {
      const sampleRelief: CreateReliefCampaignInput = {
        title: 'Hurricane Beryl Community Emergency Response',
        description: 'Immediate relief provisions for southern Caribbean islands',
        category: 'hurricane_relief',
        goal_minor: 500000,
        currency: 'USD',
        target_country_iso: 'GRD',
        disaster_declaration_ref: 'CDEMA-BERYL-2026-01',
        supporting_evidence_urls: ['https://cdema.org/sitrep/beryl-01'],
      };

      const onChange = vi.fn();
      const vdom = ReliefComposerPanel({
        value: sampleRelief,
        onChange,
      });

      const serialized = serializeVDOM(vdom);
      expect(serialized).toContain('Hurricane Beryl Community Emergency Response');
      expect(serialized).toContain('CDEMA-BERYL-2026-01');
      expect(serialized).toContain('GRD');

      const source = fs.readFileSync(reliefPanelPath, 'utf8');
      expect(source).toMatch(/RELIEF_CATEGORY_METADATA/);
      expect(source).toMatch(/disaster_declaration_ref/);
      expect(source).toMatch(/supporting_evidence_urls/);
      expect(source).toMatch(/min-h-\[(44px|48px)\]/);
    });

    it('renders Caribbean disaster agency protocol codes (CDEMA, ODPEM, NEMO)', () => {
      const source = fs.readFileSync(reliefPanelPath, 'utf8');
      expect(source).toMatch(/CDEMA/);
      expect(source).toMatch(/ODPEM/);
      expect(source).toMatch(/NEMO/);
    });

    it('enforces minimum $100 goal validation and renders alert for goals below $100', () => {
      const underfundedRelief: CreateReliefCampaignInput = {
        title: 'Small Fundraiser',
        description: 'Test small amount',
        category: 'hurricane_relief',
        goal_minor: 5000, // $50.00
        currency: 'USD',
      };

      const vdom = ReliefComposerPanel({
        value: underfundedRelief,
        onChange: vi.fn(),
      });

      const serialized = serializeVDOM(vdom);
      expect(serialized).toMatch(/100|minimum/i);
    });
  });

  describe('3. UniversalComposer Integration', () => {
    it('imports EventComposerPanel and ReliefComposerPanel and removes legacy inputs', () => {
      const composerSource = fs.readFileSync(composerPath, 'utf8');
      expect(composerSource).toContain('EventComposerPanel');
      expect(composerSource).toContain('ReliefComposerPanel');
      // Legacy inputs should be removed
      expect(composerSource).not.toContain('placeholder="Event Name (e.g. Port of Spain Carnival Fete)"');
      expect(composerSource).not.toContain('placeholder="Cause / Initiative Title (e.g. Hurricane Preparedness Relief)"');
      expect(composerSource).not.toContain('placeholder="Funding Goal ($ USD on TUKUBI)"');
    });

    it('manages structured eventInput and reliefInput states with CreateEventInput and CreateReliefCampaignInput', () => {
      const composerSource = fs.readFileSync(composerPath, 'utf8');
      expect(composerSource).toMatch(/eventInput.*setEventInput/);
      expect(composerSource).toMatch(/reliefInput.*setReliefInput/);
      expect(composerSource).toMatch(/CreateEventInput/);
      expect(composerSource).toMatch(/CreateReliefCampaignInput/);
    });

    it('updates hasEvent and hasFundraiser validation gates using structured inputs', () => {
      const composerSource = fs.readFileSync(composerPath, 'utf8');
      expect(composerSource).toMatch(/hasEvent\s*=\s*mode\s*===\s*['"]event['"]\s*&&\s*Boolean\(eventInput\.title\?\.trim\(\)\)/);
      expect(composerSource).toMatch(/hasFundraiser\s*=\s*mode\s*===\s*['"]fundraiser['"]\s*&&\s*Boolean\(reliefInput\.title\?\.trim\(\)\)/);
    });

    it('attaches created IDs (event_id, relief_campaign_id) and structured descriptions to post creation payload', () => {
      const composerSource = fs.readFileSync(composerPath, 'utf8');
      expect(composerSource).toMatch(/formData\.(set|append)\(\s*['"]event_id['"]/);
      expect(composerSource).toMatch(/formData\.(set|append)\(\s*['"]relief_campaign_id['"]/);
      expect(composerSource).toMatch(/createEventAction/);
      expect(composerSource).toMatch(/createReliefCampaignAction/);
    });

    it('renders preview badges for event and relief campaigns with edit and remove actions in composer preview', () => {
      const composerSource = fs.readFileSync(composerPath, 'utf8');
      expect(composerSource).toMatch(/Event Preview|Attached Event/i);
      expect(composerSource).toMatch(/Relief Campaign Preview|Attached Relief Campaign|Community Relief/i);
      expect(composerSource).toMatch(/aria-label=\{?["'`]?Remove (event|relief campaign|attached event|attached relief)/i);
    });
  });
});
