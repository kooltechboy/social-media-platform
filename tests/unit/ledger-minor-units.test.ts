import { describe, expect, it } from "vitest";
import { sumLedgerMinorUnits } from "../../packages/payments/src/ledger";

describe("stored ledger minor units", () => {
  it("sums signed integer minor-unit entries without applying a major-unit conversion", () => {
    expect(
      sumLedgerMinorUnits([
        { amount: 1250 },
        { amount: -250 },
        { amount: -1000 },
      ]),
    ).toBe(0);
  });
});
