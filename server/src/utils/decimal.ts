/**
 * Safe currency and quantity precision arithmetic helpers
 */

export function round(value: number, decimals: number = 2): number {
  const factor = Math.pow(10, decimals);
  return Math.round((value + Number.EPSILON) * factor) / factor;
}

export function toFixedNumber(value: number | string, decimals: number = 2): number {
  const num = typeof value === 'string' ? parseFloat(value) : value;
  return isNaN(num) ? 0 : round(num, decimals);
}

export function calculateRoundOff(rawTotal: number): { roundedTotal: number; roundOffAmount: number } {
  const roundedTotal = Math.round(rawTotal);
  const roundOffAmount = round(roundedTotal - rawTotal, 2);
  return { roundedTotal, roundOffAmount };
}
