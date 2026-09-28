import { describe, it, expect, vi, beforeEach } from 'vitest';
import * as fs from 'node:fs';
import * as path from 'node:path';
import ReliefCampaignCard, {
  ReliefCampaignCardProps,
} from '../apps/web/src/components/relief/relief-campaign-card';
import ReliefDonationModal, {
  ReliefDonationModalProps,
} from '../apps/web/src/components/relief/relief-donation-modal';
import type { ReliefCampaign } from '../apps/web/src/lib/relief/types';

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

describe('Task 5: Relief Campaign Card & Donation Modal Components', () => {
  const cardPath = path.join(
    process.cwd(),
    'apps/web/src/components/relief/relief-campaign-card.tsx'
  );
  const modalPath = path.join(
    process.cwd(),
    'apps/web/src/components/relief/relief-donation-modal.tsx'
  );

  beforeEach(() => {
    vi.clearAllMocks();
  });

  const mockVerifiedCampaign: ReliefCampaign = {
    id: 'camp-carib-relief-001',
    creator_id: 'user-relief-org',
    community_id: 'comm-st-elizabeth',
    title: 'Hurricane Beryl Emergency Recovery & Rebuild Fund',
    description: 'Providing clean water purification tablets, emergency food provisions, and zinc roofing sheets for farming families.',
    category: 'hurricane_relief',
    target_country_iso: 'JAM',
    target_city_id: 'city-st-elizabeth',
    goal_minor: 5_000_000, // $50,000.00
    raised_minor: 3_250_000, // $32,500.00 (65%)
    currency: 'USD',
    verification_status: 'verified',
    verified_at: '2026-07-04T12:00:00.000Z',
    verified_by: 'admin-disaster-lead',
    disaster_declaration_ref: 'CDEMA-2026-HURR-09',
    supporting_evidence_urls: ['https://cdema.org/reports/beryl-2026-sitrep-04.pdf'],
    cover_image_url: 'https://cdn.tukubi.com/relief/st-elizabeth-beryl.jpg',
    disbursement_status: 'verified_ready',
    deadline_at: '2026-12-31T23:59:59.000Z',
    is_active: true,
    donations_count: 142,
    created_at: '2026-07-03T10:00:00.000Z',
    updated_at: '2026-07-05T14:30:00.000Z',
    creator: {
      id: 'user-relief-org',
      username: 'carib_relief_alliance',
      display_name: 'Caribbean Relief Alliance',
      avatar_url: 'https://cdn.tukubi.com/avatars/cra.png',
    },
    country: {
      name: 'Jamaica',
      iso_code: 'JAM',
      flag_emoji: '🇯🇲',
    },
    city: {
      name: 'Saint Elizabeth Parish',
    },
  };

  const mockPendingCampaign: ReliefCampaign = {
    id: 'camp-carib-relief-002',
    creator_id: 'user-barbados-clinic',
    title: 'South Coast Emergency Medical Station Support',
    description: 'Procuring emergency insulin refrigeration and mobile first-aid trauma kits following coastal flash floods.',
    category: 'medical_aid',
    target_country_iso: 'BRB',
    goal_minor: 1_500_000, // $15,000.00
    raised_minor: 450_000, // $4,500.00 (30%)
    currency: 'USD',
    verification_status: 'pending',
    disaster_declaration_ref: 'CARPHA-MED-2026-02',
    supporting_evidence_urls: [],
    disbursement_status: 'locked',
    is_active: true,
    donations_count: 18,
    created_at: '2026-08-10T08:00:00.000Z',
    updated_at: '2026-08-10T08:00:00.000Z',
    country: {
      name: 'Barbados',
      iso_code: 'BRB',
      flag_emoji: '🇧🇧',
    },
    city: {
      name: 'Christ Church',
    },
  };

  describe('Static Source Code & WCAG 2.2 AA Auditing', () => {
    it('verifies both component source files exist and export expected components', () => {
      expect(fs.existsSync(cardPath)).toBe(true);
      expect(fs.existsSync(modalPath)).toBe(true);
      expect(ReliefCampaignCard).toBeDefined();
      expect(typeof ReliefCampaignCard).toBe('function');
      expect(ReliefDonationModal).toBeDefined();
      expect(typeof ReliefDonationModal).toBe('function');
    });

    it('enforces touch target sizes of at least 44x44px in ReliefCampaignCard and ReliefDonationModal', () => {
      const cardSource = fs.readFileSync(cardPath, 'utf8');
      const modalSource = fs.readFileSync(modalPath, 'utf8');

      // Card donate button touch target
      expect(cardSource).toContain('min-h-[44px]');
      expect(cardSource).toContain('min-w-[44px]');

      // Modal buttons and controls touch targets
      expect(modalSource).toContain('min-h-[44px]');
      expect(modalSource).toContain('min-w-[44px]');
    });

    it('enforces ARIA role and attributes for progressbar in ReliefCampaignCard', () => {
      const cardSource = fs.readFileSync(cardPath, 'utf8');
      expect(cardSource).toContain('role="progressbar"');
      expect(cardSource).toContain('aria-valuenow');
      expect(cardSource).toContain('aria-valuemin');
      expect(cardSource).toContain('aria-valuemax');
    });

    it('enforces modal accessibility (role="dialog", aria-modal="true", keyboard escape handling)', () => {
      const modalSource = fs.readFileSync(modalPath, 'utf8');
      expect(modalSource).toContain('role="dialog"');
      expect(modalSource).toContain('aria-modal="true"');
      expect(modalSource).toContain('Escape');
    });

    it('contains preset donation buttons ($10, $25, $50, $100, $250) in ReliefDonationModal', () => {
      const modalSource = fs.readFileSync(modalPath, 'utf8');
      expect(modalSource).toContain('10');
      expect(modalSource).toContain('25');
      expect(modalSource).toContain('50');
      expect(modalSource).toContain('100');
      expect(modalSource).toContain('250');
    });

    it('contains 0% platform fee mutual aid guarantee and verified disaster protocols in source', () => {
      const cardSource = fs.readFileSync(cardPath, 'utf8');
      const modalSource = fs.readFileSync(modalPath, 'utf8');

      // Disaster protocol / metadata usage
      expect(cardSource).toMatch(/RELIEF_CATEGORY_METADATA/);
      // Guarantee text in card or modal
      expect(modalSource).toMatch(/0%\s*Platform\s*Fee/i);
      expect(modalSource).toMatch(/Mutual\s*Aid/i);
    });
  });

  describe('ReliefCampaignCard VDOM & Structural Contract', () => {
    it('renders category badge with icon and disaster protocol label', () => {
      const vdom = ReliefCampaignCard({ campaign: mockVerifiedCampaign });
      const serialized = serializeVDOM(vdom);

      expect(serialized).toContain('Hurricane Relief & Storm Recovery');
      expect(serialized).toContain('CDEMA-HURR');
    });

    it('renders Caribbean territory flag and location', () => {
      const vdom = ReliefCampaignCard({ campaign: mockVerifiedCampaign });
      const serialized = serializeVDOM(vdom);

      expect(serialized).toContain('🇯🇲');
      expect(serialized).toContain('Saint Elizabeth Parish');
    });

    it('renders Verified Disaster Response Trust Shield when verified with declaration ref', () => {
      const vdom = ReliefCampaignCard({ campaign: mockVerifiedCampaign });
      const serialized = serializeVDOM(vdom);

      expect(serialized).toContain('Verified Disaster Response');
      expect(serialized).toContain('CDEMA-2026-HURR-09');
    });

    it('renders pending status disclosure notice when campaign is pending verification', () => {
      const vdom = ReliefCampaignCard({ campaign: mockPendingCampaign });
      const serialized = serializeVDOM(vdom);

      expect(serialized).toContain('Pending Regional Verification');
      expect(serialized).toContain('Disbursements locked');
    });

    it('renders funding progress bar with formatted raised and goal amounts', () => {
      const vdom = ReliefCampaignCard({ campaign: mockVerifiedCampaign });
      const serialized = serializeVDOM(vdom);

      expect(serialized).toContain('progressbar');
      expect(serialized).toContain('"aria-valuenow":65');
      expect(serialized).toContain('$32,500.00');
      expect(serialized).toContain('$50,000.00');
      expect(serialized).toContain('142 donors');
    });

    it('renders Donate to Relief button with accessible action', () => {
      const vdom = ReliefCampaignCard({ campaign: mockVerifiedCampaign });
      const serialized = serializeVDOM(vdom);

      expect(serialized).toContain('Donate to Relief');
    });
  });

  describe('ReliefDonationModal VDOM & Structural Contract', () => {
    it('returns null when isOpen is false', () => {
      const vdom = ReliefDonationModal({
        campaign: mockVerifiedCampaign,
        isOpen: false,
        onClose: () => {},
      });
      expect(vdom).toBeNull();
    });

    it('renders modal dialog when isOpen is true with title and campaign details', () => {
      const vdom = ReliefDonationModal({
        campaign: mockVerifiedCampaign,
        isOpen: true,
        onClose: () => {},
      });
      const serialized = serializeVDOM(vdom);

      expect(serialized).toContain('dialog');
      expect(serialized).toContain('"aria-modal":"true"');
      expect(serialized).toContain('Hurricane Beryl Emergency Recovery & Rebuild Fund');
      expect(serialized).toContain('Donate to Relief');
    });

    it('renders all preset donation amounts ($10, $25, $50, $100, $250)', () => {
      const vdom = ReliefDonationModal({
        campaign: mockVerifiedCampaign,
        isOpen: true,
        onClose: () => {},
      });
      const serialized = serializeVDOM(vdom);

      expect(serialized).toContain('$10');
      expect(serialized).toContain('$25');
      expect(serialized).toContain('$50');
      expect(serialized).toContain('$100');
      expect(serialized).toContain('$250');
    });

    it('renders custom amount input with validation rules', () => {
      const vdom = ReliefDonationModal({
        campaign: mockVerifiedCampaign,
        isOpen: true,
        onClose: () => {},
      });
      const serialized = serializeVDOM(vdom);

      expect(serialized).toContain('custom-donation-amount');
      expect(serialized).toContain('"min":"1"');
    });

    it('renders anonymous donation toggle option', () => {
      const vdom = ReliefDonationModal({
        campaign: mockVerifiedCampaign,
        isOpen: true,
        onClose: () => {},
      });
      const serialized = serializeVDOM(vdom);

      expect(serialized).toContain('Keep my name private');
    });

    it('renders words of encouragement message textarea', () => {
      const vdom = ReliefDonationModal({
        campaign: mockVerifiedCampaign,
        isOpen: true,
        onClose: () => {},
      });
      const serialized = serializeVDOM(vdom);

      expect(serialized).toContain('Words of encouragement');
    });

    it('renders 0% platform fee mutual aid guarantee callout', () => {
      const vdom = ReliefDonationModal({
        campaign: mockVerifiedCampaign,
        isOpen: true,
        onClose: () => {},
      });
      const serialized = serializeVDOM(vdom);

      expect(serialized).toContain('0% Platform Fee');
      expect(serialized).toContain('Mutual Aid Guarantee');
    });

    it('renders accessible close button with accessible label', () => {
      const vdom = ReliefDonationModal({
        campaign: mockVerifiedCampaign,
        isOpen: true,
        onClose: () => {},
      });
      const serialized = serializeVDOM(vdom);

      expect(serialized).toContain('Close');
    });
  });
});
