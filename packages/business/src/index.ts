export type BusinessCategory =
  | 'restaurant' | 'retail' | 'services' | 'hotel' | 'entertainment'
  | 'beauty' | 'transport' | 'professional' | 'other';

export interface BusinessProfileInput {
  ownerId: string;
  name: string;
  category: BusinessCategory;
  countryIso: string;
  phone?: string;
  website?: string;
}

export const MAX_BUSINESS_NAME = 120;

export function validateBusinessProfile(input: BusinessProfileInput): { valid: boolean; errors: string[] } {
  const errors: string[] = [];
  if (!input.name.trim()) errors.push('Business name is required');
  if (input.name.length > MAX_BUSINESS_NAME) errors.push(`Name exceeds ${MAX_BUSINESS_NAME} characters`);
  if (!/^[A-Z]{3}$/.test(input.countryIso)) errors.push('Country must be an ISO code');
  if (input.phone && !/^\+?[0-9\s\-()]{6,20}$/.test(input.phone)) errors.push('Invalid phone number');
  if (input.website && !/^https?:\/\//.test(input.website)) errors.push('Website must be a valid URL');
  return { valid: errors.length === 0, errors };
}

export interface ReviewAggregation {
  total: number;
  average: number;
  distribution: Record<1 | 2 | 3 | 4 | 5, number>;
}

export function aggregateReviews(ratings: number[]): ReviewAggregation {
  const distribution: ReviewAggregation['distribution'] = { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 };
  for (const rating of ratings) {
    if (rating < 1 || rating > 5 || !Number.isInteger(rating)) {
      throw new Error('Ratings must be integers between 1 and 5');
    }
    distribution[rating as 1 | 2 | 3 | 4 | 5] += 1;
  }
  const total = ratings.length;
  const average = total === 0 ? 0 : ratings.reduce((sum, value) => sum + value, 0) / total;
  return { total, average: Math.round(average * 10) / 10, distribution };
}

export interface BookingWindow {
  startUtc: Date;
  endUtc: Date;
}

export function validateBookingWindow(window: BookingWindow, now: Date = new Date()): { valid: boolean; errors: string[] } {
  const errors: string[] = [];
  if (window.startUtc <= now) errors.push('Booking must start in the future');
  if (window.endUtc <= window.startUtc) errors.push('Booking end must be after start');
  const maxHorizonDays = 365;
  if (window.startUtc.getTime() > now.getTime() + maxHorizonDays * 24 * 60 * 60 * 1000) {
    errors.push(`Bookings open at most ${maxHorizonDays} days ahead`);
  }
  return { valid: errors.length === 0, errors };
}

export interface EventCapacity {
  capacity: number | null;
  attendeeCount: number;
}

export function canRsvp(capacity: EventCapacity): boolean {
  if (capacity.capacity === null) return true;
  return capacity.attendeeCount < capacity.capacity;
}

export function formatPrice(amountMinor: number, currency: string, locale = 'en-US'): string {
  return new Intl.NumberFormat(locale, { style: 'currency', currency }).format(amountMinor / 100);
}
