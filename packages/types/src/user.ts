import { boolean, z } from 'zod';

export const CreateUserSchema = z.object({
  name: z.string().min(2, 'Name must be at least 2 characters'),
  mobile: z.string().min(10, 'Mobile number must be at least 10 digits'),
  email: z.email("Invalid email address"),
  password: z.string().min(8, 'Password must be at least 8 characters'),
  sponsorPositionId: z.string(),
  activationPin: z.string(),
});

export const LoginSchema = z.object({
  userId: z.string(),
  password: z.string().min(1, 'Password is required'),
});

export const UpdateUserSchema = z.object({
  name: z.string().min(2).optional(),
  email: z.string().email().optional(),
});

export const bankDetail = z.object({
  bankName: z.string().nullable(),
  accountNumber: z.string().nullable(),
  ifscCode: z.string().nullable(),
  upiId: z.string().nullable(),
  qrCode: z.string().nullable(),
  gPay: z.string().nullable(),
}).nullable()

export const AccountPosition = z.object({
  isActive: z.boolean(),
  positionId: z.string(),
  positionType: z.enum(['ORIGINAL', 'REENTRY']),
  currentLevel: z.number(),
  directReferralCount: z.number(),
  sponsorId: z.string().nullable(),
  sponsorMobile: z.string().nullable(),
  sponsorName: z.string().nullable(),
  sponsorPositionId: z.string().nullable(),
  sponsorBankDetails: bankDetail,
  activationPayment: z.string().nullable(),
})

export const UserType = z.object({
  id: z.string(),
  name: z.string(),
  email: z.email(),
  mobile: z.string(),
  isBankDetials: z.boolean(),
  positions: z.array(AccountPosition),
})

export interface IncomingPayment {
  paymentId: string;
  screenshotUrl: string | null

  senderUserName: string;
  senderUserId: string
  senderUserMobile: string;
  senderAccountId: string;

  receiverAccountId: string;

  amount: number;
  paymentType: 'ACTIVATION' | 'UPGRADE' | 'SPONSOR_PAYMENT';
  status: z.infer<typeof PaymentStatusEnum>;
  confirmed: boolean
  upgradeToLevel: number | null
  updatedAt: string;
}

export interface PendingLinkItem {
  id: string;
  linkType: 'UPGRADE' | 'SPONSOR_PAYMENT' | 'REENTRY';
  targetLevel?: number | null;
  amount?: number | null;
  isCompleted: boolean;
  positionId: string;
}

export const PaymentTypeEnum = z.enum([
  "ACTIVATION",
  "UPGRADE",
  "SPONSOR_PAYMENT"
]);

export const PaymentStatusEnum = z.enum([
  "PENDING",
  "APPROVED",
  "UNDER_REVIEW",
  "REJECTED",
]);

export const PaymentSchema = z.object({
  id: z.string(),

  senderPositionId: z.string(),
  receiverPositionId: z.string(),

  amount: z.number().int(),
  paymentType: PaymentTypeEnum,
  status: PaymentStatusEnum,

  upgradeToLevel: z.number().int().nullable(),

  screenshotUrl: z.string().nullable(),
  requestVerification: z.boolean(),
  confirmed: z.boolean(),

  createdAt: z.date(),
  updatedAt: z.date(),
  receiverName: z.string(),
  receiverId: z.string(),
  receiverBankDetails: bankDetail,
  Mobile: z.string(),
});


export const PinSchema = z.object({
  id: z.string(),
  pinCode: z.string(),
  status: z.boolean(),
  currentOwner: z.string(),
  usedBy: z.string().optional(),
  createdAt: z.string(),
});

export const UserSchema = z.object({
  id: z.string(),
  name: z.string(),
  mobile: z.string(),
  bankDetail,
});


export const PinRequestStatusEnum = z.enum([
  "PENDING",
  "APPROVED",
  "REJECTED",
]);

export const PinIncomingRequestSchema = z.object({
  id: z.string(),
  fromUser: z.object({
    id: z.string(),
    name: z.string(),
    mobile: z.string()
  }),
  toUserId: z.string(),
  count: z.number().int(),
  screenshotUrl: z.string().optional(),
  confirmed: z.boolean(),
  status: PinRequestStatusEnum,
});


export const updatebankDetail = z.object({
  bankName: z.string(),
  accountNumber: z.string(),
  ifscCode: z.string(),
  upiId: z.string(),
  qrCode: z.string(),
  gPay: z.string(),
})

export const UpdateUserProfileSchema = z.object({
  id: z.string(),
  name: z.string().min(2, 'Name must be at least 2 characters'),
  mobile: z.string().min(10, 'Mobile number must be at least 10 digits'),
  email: z.email("Invalid email address"),
  password: z.string().min(8, 'Password must be at least 8 characters'),
});

export const UserProfileSchema = z.object({
  id: z.string(),
  name: z.string().min(2, 'Name must be at least 2 characters'),
  mobile: z.string().min(10, 'Mobile number must be at least 10 digits'),
  email: z.email("Invalid email address"),
  password: z.string().min(8, 'Password must be at least 8 characters'),
  bankDetail: bankDetail,
  createdAt: z.string(),
});

export interface UserLevel {
  levelNumber: number;
  amountEarned: number;
}

export interface sendpayments {
  id: string
  amount: number
  paymentType: "ACTIVATION" | "UPGRADE" | "SPONSOR_PAYMENT"
  receiverPosition: {
    id: string,
    user: {
      name: string,
      mobile: string
    }
  }
  status: z.infer<typeof PaymentStatusEnum>
  upgradeToLevel: number | null
}
export interface receivedpayments {
  id: string
  amount: number
  paymentType: "ACTIVATION" | "UPGRADE" | "SPONSOR_PAYMENT"
  senderPosition: {
    id: string,
    user: {
      name: string,
      mobile: string
    }
  }
  status: z.infer<typeof PaymentStatusEnum>
  upgradeToLevel: number | null
}

export interface UserAccountSummary {
  id: string;
  currentLevel: number;
  positionType: 'ORIGINAL' | 'REENTRY';
  isActive: boolean;
  userLevels: UserLevel[];
  sentPayments: sendpayments[];
  receivedPayments: receivedpayments[]
}

interface sendPinReq {
  status: "PENDING" | "APPROVED" | "REJECTED"
  numOfPinsSent: number
  userId: string,
  userName: string
}

interface resPinReq {
  status: "PENDING" | "APPROVED" | "REJECTED"
  numOfPinsReceived: number
  userId: string,
  userName: string
}

export interface PinRequest {
  pinSent: sendPinReq[]
  pinReceived: resPinReq[]
}

export interface AddNewUser {
  id: string;
  name: string;
  email: string;
  mobile: string;
  password: string;
  sponsorUserId: string | null;
  sponsorName: string | null;
  sponsorMobile: string | null;
}

// Types
export type Pin = z.infer<typeof PinSchema>;
export type UserSchemaForPin = z.infer<typeof UserSchema>;
export type TransferRequest = z.infer<typeof PinIncomingRequestSchema>;

export type UserProfileType = z.infer<typeof UserProfileSchema>

// Type inference
export type CreateUserInput = z.infer<typeof CreateUserSchema>;
export type InputUserForm = z.infer<typeof CreateUserSchema>
export type User = z.infer<typeof UserType>
export type Position = z.infer<typeof AccountPosition>;
export type LoginInput = z.infer<typeof LoginSchema>;
export type UpdateUserInput = z.infer<typeof UpdateUserSchema>;
export type PaymentType = z.infer<typeof PaymentSchema>
export type BankType = z.infer<typeof bankDetail>