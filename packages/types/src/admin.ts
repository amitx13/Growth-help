import { z } from 'zod';
import { BankType } from './user';

export const AdminPosition = z.object({
  positionId: z.string(),
  directReferralCount: z.number(),
})

export const AdminType = z.object({
  id: z.string(),
  name: z.string(),
  email: z.email(),
  mobile: z.string(),
  positions: z.array(AdminPosition),
})

type UserStatus = 'active' | 'inactive';

export interface DashboardStats {
  totalUsers: number;
  totalPositions: number
  activePositions: number;
  totalRevenue: number;
  pendingPayments: number;
  recentUsersCount: number;
  totalPins: number;
  usedPins: number;
  activePins: number;
  pendingPinRequests: number;
}

export interface RecentUser {
  id: string;
  name: string;
  email: string;
  mobile: string;
  createdAt: string; // ISO date string
  status: UserStatus;
}

export interface PendingPayment {
  id: string;
  from: string;
  to: string;
  amount: number;
  type: PaymentType;
  createdAt: string; // ISO date string
}

export interface PendingPinRequest {
  id: string;
  fromUser: string;
  toUser: string;
  count: number;
  amount: number;
  createdAt: string; // ISO date string
}

export interface DashboardData {
  stats: DashboardStats;
  referalCode: string
  recentUsers: RecentUser[];
  pendingPayments: PendingPayment[];
  pendingPinRequests: PendingPinRequest[];
}

interface UserLevel {
  levelNumber: number;
  amountEarned: number;
  paymentsReceived: number;
}

interface SponsorInfo {
  name: string;
  mobile: string;
  userId: string;
  positionId: string;
  currentLevel: number;
}

interface Position {
  id: string;
  positionType: 'ORIGINAL' | 'REENTRY';
  currentLevel: number;
  isActive: boolean;
  directReferralCount: number;
  sponsor: SponsorInfo | null;
  userLevels: UserLevel[];
}

export interface UserInAdmin {
  id: string;
  name: string;
  email: string;
  mobile: string;
  password: string;
  createdAt: string;
  bankDetails: BankType;
  positions: Position[];
  totalPositions: number;
  activePositions: number;
}

type PaymentStatus = 'PENDING' | 'APPROVED' | 'REJECTED' | 'UNDER_REVIEW';
type PaymentType = 'ACTIVATION' | 'UPGRADE' | 'SPONSOR_PAYMENT';


export interface AdminPaymentSchema {
  id: string;
  paid:boolean;

  senderName: string;
  senderUserId: string;
  senderPositionId: string;

  receiverName: string;
  receiverUserId: string;
  receiverPositionId: string;

  amount: number;
  paymentType: PaymentType;

  upgradeToLevel: number | null;
  screenshotUrl: string | null;

  status: PaymentStatus;
  confirmed: boolean;
  createdAt: string;
}

export interface pinsModel {
  id: string
  pinCode: string
  status: boolean
  currentOwner: string
  currentOwnerName: string
  usedBy: string | null
  usedByName: string | null
  createPin: string
}

export interface pinRequests {
  id: string,
  fromUserId: string,
  fromUserName: string,
  toUserId: string,
  toUserName: string,
  count: number,
  screenshotUrl: string | null,
  confirmed: boolean,
  status: 'PENDING' | 'APPROVED' | 'REJECTED',
  createdAt: string,
}

export interface AdminbankDetails {
  AccountHolderName: string
  bankDetails:BankType
}

export interface LevelConfig {
  id: string
  level: number
  upgradeAmount: number
  sponsorAmount: number
  paymentCapacity: number
  reentryCount: number
  upgradeAtPayment: number | null
}

export type Admin = z.infer<typeof AdminType>
