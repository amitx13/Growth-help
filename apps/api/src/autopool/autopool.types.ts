export const LEVEL_CONFIGS = {
  1: { matrixWidth: 2,  entryFee: 200,   reentryCount: 0,  upgradeAtPayment: 2 },
  2: { matrixWidth: 4,  entryFee: 300,   reentryCount: 1,  upgradeAtPayment: 2 },
  3: { matrixWidth: 6,  entryFee: 600,   reentryCount: 2,  upgradeAtPayment: 3 },
  4: { matrixWidth: 8,  entryFee: 1500,  reentryCount: 4,  upgradeAtPayment: 2 },
  5: { matrixWidth: 10, entryFee: 3000,  reentryCount: 8,  upgradeAtPayment: 2 },
  6: { matrixWidth: 12, entryFee: 6000,  reentryCount: 16, upgradeAtPayment: 3 },
  7: { matrixWidth: 14, entryFee: 15000, reentryCount: 32, upgradeAtPayment: null },
} as const;

export type AutopoolLevel = keyof typeof LEVEL_CONFIGS;

export class AutopoolError extends Error {
  constructor(
    message: string,
    public code: string,
    public statusCode: number = 400 
  ) {
    super(message);
    this.name = "AutopoolError";
  }
}
