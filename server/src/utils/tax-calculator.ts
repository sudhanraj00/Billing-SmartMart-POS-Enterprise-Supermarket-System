import { round } from './decimal';

export interface LineItemTaxInput {
  unitPrice: number;
  quantity: number;
  discountAmount?: number;
  taxRate: number; // e.g. 5, 12, 18, 28
  pricingMode?: 'INCLUSIVE' | 'EXCLUSIVE';
  isInterState?: boolean; // If true, apply IGST, else CGST + SGST
}

export interface LineItemTaxOutput {
  taxableAmount: number;
  taxAmount: number;
  cgstAmount: number;
  sgstAmount: number;
  igstAmount: number;
  lineTotal: number;
}

/**
 * Accurately calculate line item tax and totals based on pricing mode.
 * Note: Software implementation only, configurable tax rates.
 */
export function calculateLineTax(input: LineItemTaxInput): LineItemTaxOutput {
  const quantity = input.quantity;
  const unitPrice = input.unitPrice;
  const discount = input.discountAmount || 0;
  const rate = input.taxRate || 0;
  const isInterState = !!input.isInterState;
  const mode = input.pricingMode || 'INCLUSIVE';

  const grossAmount = unitPrice * quantity;
  const netAmount = Math.max(0, grossAmount - discount);

  let taxableAmount = 0;
  let taxAmount = 0;
  let lineTotal = 0;

  if (mode === 'INCLUSIVE') {
    if (rate > 0) {
      taxableAmount = round(netAmount / (1 + rate / 100), 2);
      taxAmount = round(netAmount - taxableAmount, 2);
    } else {
      taxableAmount = round(netAmount, 2);
      taxAmount = 0;
    }
    lineTotal = round(netAmount, 2);
  } else {
    // EXCLUSIVE
    taxableAmount = round(netAmount, 2);
    taxAmount = round(taxableAmount * (rate / 100), 2);
    lineTotal = round(taxableAmount + taxAmount, 2);
  }

  let cgstAmount = 0;
  let sgstAmount = 0;
  let igstAmount = 0;

  if (isInterState) {
    igstAmount = taxAmount;
  } else {
    cgstAmount = round(taxAmount / 2, 2);
    sgstAmount = round(taxAmount - cgstAmount, 2);
  }

  return {
    taxableAmount,
    taxAmount,
    cgstAmount,
    sgstAmount,
    igstAmount,
    lineTotal,
  };
}
