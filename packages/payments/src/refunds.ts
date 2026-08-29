// TUKUBI Refund Computation Engine

import type { RefundBreakdown } from './types';

export function computeRefundBreakdown(
  chargedMinor: number,
  priorRefundsMinor: number[],
  newRefundMinor: number
): RefundBreakdown {
  const alreadyRefunded = priorRefundsMinor.reduce((sum, value) => sum + value, 0);
  const remaining = chargedMinor - alreadyRefunded;

  if (newRefundMinor <= 0) {
    throw new Error('Refund amount must be strictly positive');
  }

  if (newRefundMinor > remaining) {
    throw new Error(`Refund of ${newRefundMinor} exceeds refundable balance of ${remaining}`);
  }

  return {
    refundableMinor: remaining,
    refundedMinor: alreadyRefunded + newRefundMinor,
    remainingMinor: remaining - newRefundMinor,
  };
}
