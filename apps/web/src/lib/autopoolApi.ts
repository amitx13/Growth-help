import api from './axios'

export type AutopoolLinkType = 'ENTRY' | 'UPGRADE' | 'REENTRY'
export type AutopoolPaymentStatus = 'PENDING' | 'APPROVED' | 'UNDER_REVIEW' | 'REJECTED'
export type AutopoolAccountType = 'ORIGINAL' | 'REENTRY'
export type AutopoolPaymentType = 'ENTRY' | 'UPGRADE'

export interface BankDetails {
  bankName?: string
  accountNumber?: string
  ifscCode?: string
  upiId?: string
  gPay?: string
  qrCodeUrl?: string
}

export interface AutopoolPendingLink {
  id: string
  accountId: string | null
  userId: string | null
  linkType: AutopoolLinkType
  targetLevel: number | null
  amount: number | null
  reentryCount: number | null
  reentriesIssued: number
  isCompleted: boolean
  createdAt: string
  account: { level: number; accountType: AutopoolAccountType } | null
}

// All sent payments — FE filters by status for dead-end detection AND earnings
export interface AutopoolAccountPayment {
  id: string
  status: AutopoolPaymentStatus
  amount: number
}

// Parent account info — used for resume payment modal + upline display
export interface AutopoolAccountParent {
  id: string
  user: {
    name: string
    mobile: string
    bankDetails: BankDetails | null
  }
}

export interface AutopoolAccount {
  id: string
  userId: string
  level: number
  accountType: AutopoolAccountType
  parentAccountId: string | null
  treePosition: number
  upgradedFromAccountId: string | null
  paymentsReceived: number
  isActive: boolean
  isUpgradeLocked: boolean
  reentriesCreated: number
  pendingLinks: AutopoolPendingLink[]
  // All statuses — filter by status in FE for dead-end detection vs earnings
  sentPayments: AutopoolAccountPayment[]
  // APPROVED only — for gross earnings
  receivedPayments: { amount: number }[]
  // null only for admin root (treePosition=1, parentAccountId=null)
  parent: AutopoolAccountParent | null
  _count: { children: number }
  createdAt: string
}

export interface AutopoolIncomingPayment {
  id: string
  senderAccountId: string
  receiverAccountId: string
  amount: number
  level: number
  paymentType: AutopoolPaymentType
  status: AutopoolPaymentStatus
  screenshotUrl: string | null
  senderAccount: {
    level: number
    accountType: AutopoolAccountType
    user: { name: string }
  }
  createdAt: string
}

export interface PaymentModalData {
  senderAccountId: string
  receiverAccountId: string
  amount: number
  level: number
  paymentType: AutopoolPaymentType
  receiverName: string
  receiverMobile: string | null
  receiverBankDetails: BankDetails | null
}

// ─── Level fee map — mirrors LEVEL_CONFIGS on backend ─────────────────────────
export const AUTOPOOL_LEVEL_FEES: Record<number, number> = {
  1: 200, 2: 300, 3: 600, 4: 1500, 5: 3000, 6: 6000, 7: 15000,
}

// ─── Level configs — mirrors LEVEL_CONFIGS on backend ─────────────────────────
export const AUTOPOOL_LEVEL_CONFIGS: Record<number, {
  entryFee: number
  reentryCount: number
  upgradeAtPayment: number | null
}> = {
  1: { entryFee: 200,   reentryCount: 0,  upgradeAtPayment: 2 },
  2: { entryFee: 300,   reentryCount: 1,  upgradeAtPayment: 2 },
  3: { entryFee: 600,   reentryCount: 2,  upgradeAtPayment: 3 },
  4: { entryFee: 1500,  reentryCount: 4,  upgradeAtPayment: 2 },
  5: { entryFee: 3000,  reentryCount: 8,  upgradeAtPayment: 2 },
  6: { entryFee: 6000,  reentryCount: 16, upgradeAtPayment: 3 },
  7: { entryFee: 15000, reentryCount: 32, upgradeAtPayment: null },
}

// ─── API Calls ────────────────────────────────────────────────────────────────
export const autopoolApi = {
  getPendingLinks: () =>
    api.get<{ success: boolean; data: AutopoolPendingLink[] }>('/autopool/pending-links'),

  getMyAccounts: () =>
    api.get<{ success: boolean; data: AutopoolAccount[] }>('/autopool/my-accounts'),

  getIncomingPayments: () =>
    api.get<{ success: boolean; data: AutopoolIncomingPayment[] }>('/autopool/incoming-payments'),

  joinAutopool: (pendingLinkId: string) =>
    api.post<{
      success: boolean
      data: {
        newAccountId: string
        pendingLinkId: string
        receiverAccountId: string
        amount: number
        receiverBankDetails: BankDetails
        receiverName: string
        receiverMobile: string
      }
    }>('/autopool/join', { pendingLinkId }),

  actOnUpgradeLink: (linkId: string) =>
    api.post<{
      success: boolean
      data: {
        newAccountId: string
        receiverAccountId: string
        amount: number
        targetLevel: number
        receiverName: string
        receiverMobile: string
        receiverBankDetails: BankDetails
      }
    }>(`/autopool/links/upgrade/${linkId}`),

  actOnReentryLink: (linkId: string) =>
    api.post<{
      success: boolean
      data: {
        newAccountId: string
        receiverAccountId: string
        amount: number
        receiverName: string
        receiverMobile: string
        receiverBankDetails: BankDetails
      }
    }>(`/autopool/links/reentry/${linkId}`),

  submitPayment: (formData: FormData) =>
    api.post('/autopool/payments/submit', formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    }),

  approvePayment: (paymentId: string) =>
    api.post(`/autopool/payments/approve/${paymentId}`),

  markUnderReview: (paymentId: string) =>
    api.post(`/autopool/payments/under-review/${paymentId}`),
}
