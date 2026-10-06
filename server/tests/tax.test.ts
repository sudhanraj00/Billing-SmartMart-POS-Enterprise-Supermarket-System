import { describe, it, expect } from 'vitest';
import { calculateLineTax } from '../src/utils/tax-calculator';
import { calculateRoundOff, round } from '../src/utils/decimal';

describe('Tax & Precision Calculations Engine', () => {
  it('correctly calculates inclusive GST (e.g. 5% tax)', () => {
    // Selling price: 142.00 inclusive of 5% tax
    // Taxable base = 142 / 1.05 = 135.24
    // Tax amount = 142 - 135.24 = 6.76
    // CGST = 3.38, SGST = 3.38
    const result = calculateLineTax({
      unitPrice: 142,
      quantity: 1,
      taxRate: 5,
      pricingMode: 'INCLUSIVE',
    });

    expect(result.taxableAmount).toBe(135.24);
    expect(result.taxAmount).toBe(6.76);
    expect(result.cgstAmount).toBe(3.38);
    expect(result.sgstAmount).toBe(3.38);
    expect(result.lineTotal).toBe(142.00);
  });

  it('correctly calculates exclusive GST (e.g. 18% tax)', () => {
    // Unit price: 100.00 exclusive of 18% tax
    // Taxable base = 100.00
    // Tax amount = 18.00
    // CGST = 9.00, SGST = 9.00
    // Line total = 118.00
    const result = calculateLineTax({
      unitPrice: 100,
      quantity: 2,
      taxRate: 18,
      pricingMode: 'EXCLUSIVE',
    });

    expect(result.taxableAmount).toBe(200.00);
    expect(result.taxAmount).toBe(36.00);
    expect(result.cgstAmount).toBe(18.00);
    expect(result.sgstAmount).toBe(18.00);
    expect(result.lineTotal).toBe(236.00);
  });

  it('correctly calculates IGST for interstate transactions', () => {
    const result = calculateLineTax({
      unitPrice: 100,
      quantity: 1,
      taxRate: 18,
      pricingMode: 'EXCLUSIVE',
      isInterState: true,
    });

    expect(result.cgstAmount).toBe(0);
    expect(result.sgstAmount).toBe(0);
    expect(result.igstAmount).toBe(18.00);
  });

  it('correctly handles line discount before tax application', () => {
    const result = calculateLineTax({
      unitPrice: 200,
      quantity: 1,
      discountAmount: 50, // 200 - 50 = 150 net
      taxRate: 10,
      pricingMode: 'EXCLUSIVE',
    });

    expect(result.taxableAmount).toBe(150.00);
    expect(result.taxAmount).toBe(15.00);
    expect(result.lineTotal).toBe(165.00);
  });

  it('correctly computes round-off amounts', () => {
    const r1 = calculateRoundOff(142.34);
    expect(r1.roundedTotal).toBe(142);
    expect(r1.roundOffAmount).toBe(-0.34);

    const r2 = calculateRoundOff(142.75);
    expect(r2.roundedTotal).toBe(143);
    expect(r2.roundOffAmount).toBe(0.25);
  });
});
