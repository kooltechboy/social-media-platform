import { describe, it, expect, vi, beforeEach } from 'vitest';
import * as fs from 'node:fs';
import * as path from 'node:path';
import InteractiveEventCard, {
  InteractiveEventCardProps,
} from '../apps/web/src/components/events/interactive-event-card';
import type { LiveEventItem } from '../apps/web/src/lib/events/types';

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

describe('Task 4: Interactive Event Card & RSVP Management Component', () => {
  const componentPath = path.join(
    process.cwd(),
    'apps/web/src/components/events/interactive-event-card.tsx'
  );

  beforeEach(() => {
    vi.clearAllMocks();
  });

  const mockEvent: LiveEventItem = {
    id: 'evt-carib-101',
    title: 'Tukubi Sunset Soca & Reggae Festival',
    description: 'An unforgettable Caribbean sunset experience with top DJs, live food stalls, and ocean vibes.',
    event_kind: 'in_person',
    privacy: 'public',
    venue: 'Fort Charles Beach Club',
    starts_at: '2026-11-14T19:00:00.000Z',
    ends_at: '2026-11-15T02:00:00.000Z',
    capacity: 250,
    price: '$25 USD',
    country_iso: 'JAM',
    cities: {
      name: 'Port Royal, Kingston',
      country_iso: 'JAM',
    },
    tags: ['carnival', 'socafete', 'reggae'],
    cover_image_url: 'https://cdn.tukubi.com/events/soca-sunset.jpg',
    event_attendees: [
      { profile_id: 'user-001', rsvp_status: 'going', guest_count: 2 },
      { profile_id: 'user-002', rsvp_status: 'going', guest_count: 1 },
      { profile_id: 'user-003', rsvp_status: 'interested', guest_count: 1 },
    ],
  };

  const mockLiveStreamEvent: LiveEventItem = {
    id: 'evt-carib-102',
    title: 'Pan-Caribbean Tech & Culture Summit',
    description: 'Virtual broadcast celebrating Caribbean digital innovation and futurism.',
    event_kind: 'livestream',
    privacy: 'community_only',
    venue: null,
    starts_at: '2026-12-05T14:00:00.000Z',
    capacity: null,
    livestream_url: 'https://live.tukubi.com/stream/carib-summit-2026',
    tags: ['tech', 'caribbeanfuturism'],
    event_attendees: [],
  };

  const mockAtCapacityEvent: LiveEventItem = {
    id: 'evt-carib-103',
    title: 'Intimate Rum & Cigar Tasting',
    description: 'Exclusive artisanal rum pairing experience.',
    event_kind: 'hybrid',
    privacy: 'invite_only',
    venue: 'Mount Gay Cellars',
    starts_at: '2026-10-20T18:30:00.000Z',
    capacity: 20,
    country_iso: 'BRB',
    cities: {
      name: 'Bridgetown',
      country_iso: 'BRB',
    },
    tags: ['rum', 'vip'],
    event_attendees: [
      { profile_id: 'user-guest-1', rsvp_status: 'going', guest_count: 15 },
      { profile_id: 'user-guest-2', rsvp_status: 'going', guest_count: 5 },
    ],
  };

  describe('Module Contract & Static Code Verification', () => {
    it('verifies component file exists and exports InteractiveEventCard', () => {
      expect(fs.existsSync(componentPath)).toBe(true);
      expect(InteractiveEventCard).toBeDefined();
      expect(typeof InteractiveEventCard).toBe('function');
    });

    it('enforces WCAG 2.2 AA accessibility requirements in source code', () => {
      const source = fs.readFileSync(componentPath, 'utf8');
      // Touch target size requirement 44x44
      expect(source).toContain('min-h-[44px]');
      expect(source).toContain('min-w-[44px]');
      // ARIA live region
      expect(source).toContain('aria-live="polite"');
      // ARIA pressed states
      expect(source).toContain('aria-pressed');
      // Progressbar with accessibility attributes
      expect(source).toContain('role="progressbar"');
      expect(source).toContain('aria-valuenow');
      expect(source).toContain('aria-valuemin');
      expect(source).toContain('aria-valuemax');
      // Accessible labels for steppers
      expect(source).toContain('aria-label="Decrease guest count"');
      expect(source).toContain('aria-label="Increase guest count"');
    });

    it('contains authentic Caribbean date chips, format badges, and territory flag handling', () => {
      const source = fs.readFileSync(componentPath, 'utf8');
      // Format badges
      expect(source).toMatch(/In-Person/);
      expect(source).toMatch(/Live Stream/);
      expect(source).toMatch(/Hybrid/);
      // Privacy badges
      expect(source).toMatch(/Public/);
      expect(source).toMatch(/Community/);
      expect(source).toMatch(/Invite/);
      // Stepper limits 1 to 10
      expect(source).toMatch(/10/);
    });
  });

  describe('VDOM & Structural Rendering Contract', () => {
    it('renders the Caribbean calendar date chip with uppercase month and day', () => {
      const vdom = InteractiveEventCard({ event: mockEvent });
      const serialized = serializeVDOM(vdom);
      // Nov 14th
      expect(serialized).toContain('NOV');
      expect(serialized).toContain('14');
    });

    it('renders the format badge, privacy badge, and territory flag', () => {
      const vdom = InteractiveEventCard({ event: mockEvent });
      const serialized = serializeVDOM(vdom);
      expect(serialized).toContain('In-Person');
      expect(serialized).toContain('Public');
      expect(serialized).toContain('🇯🇲');
      expect(serialized).toContain('Port Royal, Kingston');
      expect(serialized).toContain('Fort Charles Beach Club');
    });

    it('renders tag pills with hashtags', () => {
      const vdom = InteractiveEventCard({ event: mockEvent });
      const serialized = serializeVDOM(vdom);
      expect(serialized).toContain('#carnival');
      expect(serialized).toContain('#socafete');
      expect(serialized).toContain('#reggae');
    });

    it('renders livestream watch link when format is livestream and url is present', () => {
      const vdom = InteractiveEventCard({ event: mockLiveStreamEvent });
      const serialized = serializeVDOM(vdom);
      expect(serialized).toContain('Live Stream');
      expect(serialized).toContain('Community Only');
      expect(serialized).toContain('https://live.tukubi.com/stream/carib-summit-2026');
      expect(serialized).toContain('Watch Stream');
    });

    it('renders capacity progress bar and calculates attendance accurately', () => {
      const vdom = InteractiveEventCard({ event: mockEvent });
      const serialized = serializeVDOM(vdom);
      // mockEvent has 2 attendees going with 2 + 1 = 3 guests total
      expect(serialized).toContain('progressbar');
      expect(serialized).toContain('"aria-valuenow":3');
      expect(serialized).toContain('"aria-valuemax":250');
      expect(serialized).toContain('3 / 250');
    });

    it('displays "At Capacity" banner and disables "Going" button when full for non-registered user', () => {
      const vdom = InteractiveEventCard({
        event: mockAtCapacityEvent,
        currentUserId: 'new-user-999',
      });
      const serialized = serializeVDOM(vdom);
      expect(serialized).toContain('At Capacity');
      expect(serialized).toContain('"disabled":true');
    });

    it('renders segmented RSVP controls (Going, Interested, Can\'t Go) with aria-pressed states', () => {
      const vdom = InteractiveEventCard({
        event: mockEvent,
        currentUserId: 'user-001',
      });
      const serialized = serializeVDOM(vdom);
      expect(serialized).toContain('Going');
      expect(serialized).toContain('Interested');
      expect(serialized).toContain("Can't Go");
      expect(serialized).toContain('"aria-pressed":true');
    });

    it('renders guest count selector when Going status is active', () => {
      const vdom = InteractiveEventCard({
        event: mockEvent,
        currentUserId: 'user-001',
      });
      const serialized = serializeVDOM(vdom);
      expect(serialized).toContain('Guests');
      expect(serialized).toContain('Decrease guest count');
      expect(serialized).toContain('Increase guest count');
    });

    it('renders user check-in code when registered as going', () => {
      const eventWithCode: LiveEventItem = {
        ...mockEvent,
        event_attendees: [
          {
            profile_id: 'user-vip',
            rsvp_status: 'going',
            guest_count: 1,
            check_in_code: 'TK-CARIB-7788',
          } as any,
        ],
      };
      const vdom = InteractiveEventCard({
        event: eventWithCode,
        currentUserId: 'user-vip',
      });
      const serialized = serializeVDOM(vdom);
      expect(serialized).toContain('TK-CARIB-7788');
      expect(serialized).toContain('Check-in Code');
    });

    it('renders sign-in prompt when currentUserId is not provided', () => {
      const vdom = InteractiveEventCard({
        event: mockEvent,
      });
      const serialized = serializeVDOM(vdom);
      expect(serialized).toContain('Sign in to RSVP');
      expect(serialized).toContain('/login');
    });
  });
});
