import api from './axios'

export type AutopoolPaymentStatus = 'PENDING' | 'APPROVED' | 'UNDER_REVIEW' | 'REJECTED'
export type AutopoolPaymentType = 'ENTRY' | 'UPGRADE'
export type AutopoolAccountType = 'ORIGINAL' | 'REENTRY'

export interface AdminAutopoolPayment {
  id: string
  senderAccountId: string
  receiverAccountId: string
  amount: number
  level: number
  paymentType: AutopoolPaymentType
  status: AutopoolPaymentStatus
  screenshotUrl: string | null
  createdAt: string
  senderAccount: {
    level: number
    accountType: AutopoolAccountType
    user: { name: string; mobile: string; id:string  }
  }
  receiverAccount: {
    level: number
    accountType: AutopoolAccountType
    user: { name: string; mobile: string; id:string  }
  }
}

export interface AdminAutopoolAccount {
  id: string
  userId: string
  level: number
  accountType: AutopoolAccountType
  treePosition: number
  paymentsReceived: number
  isActive: boolean
  isUpgradeLocked: boolean
  reentriesCreated: number
  createdAt: string
  user: { name: string; email: string; mobile: string; role: string }
  _count: { children: number; receivedPayments: number }
}

export interface EligibleUser {
  id: string
  name: string
  email: string
  mobile: string
  _count: { directReferrals: number }
}

export const autopoolAdminApi = {
  getPayments: (status?: string, page = 1, limit = 20) =>
    api.get<{ success: boolean; data: AdminAutopoolPayment[]; total: number }>(
      `/autopool/all-payments`,
      { params: { status, page, limit } }
    ),

  getAccounts: (level?: number, page = 1, limit = 20) =>
    api.get<{ success: boolean; data: AdminAutopoolAccount[]; total: number }>(
      `/autopool/all-accounts`,
      { params: { level, page, limit } }
    ),

  getEligibleUsers: (page = 1, limit = 50) =>
    api.get<{ success: boolean; data: EligibleUser[]; total: number }>(
      `/autopool/eligible-users`,
      { params: { page, limit } }
    ),

  resolvePayment: (paymentId: string, action: 'APPROVED' | 'REJECTED') =>
    api.post(`/autopool/resolve-payment/${paymentId}`, { action }),

  generateEntryLink: (userId: string) =>
    api.post(`/autopool/generate-entry-link`, { userId }),
}
