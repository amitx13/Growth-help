import { Router } from 'express';
import { confirmActivationPayment, confirmUpgradeAndSponsorPayment, completePaymentDetails, generatePaymentDetailsFromPendingLink} from "../controllers/user.controllers";
import { authMiddleware } from '../middleware/verifyAuth';
import { upload, processImage } from "../middleware/upload";
import { fetchUser, fetchUserProfileData, getAdminDetails, getSponsorName, getUserAllPendingPinRequest, getUserAllPinRequests, getUserAllPositionsEarnings, getUserDetails, getUserIncomingPayments, getUserPendingLinks, getUserPins, getUserRetryPaymentDetails, getUserTeamDetails } from '../controllers/user.getController';
import { addNewUser, createUser, updateBankDetails, updateUserDetails } from '../controllers/user.createController';
import { login, logout } from '../controllers/user.authController';
import { createReentryPosition } from '../controllers/user.re-entryController';
import { confirmUserPinRequest, SubmitPinRequest, transferPin } from '../controllers/user.pinController';
import { getUserName } from '../controllers/admin.controllers';

const router = Router();

router.get('/me', authMiddleware, fetchUser)
router.get('/notifications/incoming-payments/:userId', authMiddleware, getUserIncomingPayments)
router.get('/notifications/pending-links/:userId', authMiddleware, getUserPendingLinks)
router.get('/getUserPins/:userId', authMiddleware, getUserPins)
router.get('/users/:userId', authMiddleware, getUserDetails)
router.get('/getAdminDetails', authMiddleware, getAdminDetails)
router.get('/getUserAllPendingPinRequest/:userId', authMiddleware, getUserAllPendingPinRequest)
router.get('/getUserProfileData/:userId', authMiddleware, fetchUserProfileData)
router.get('/getUserTeamData/:userId', authMiddleware, getUserTeamDetails)
router.get('/getUserEarningsReport/:userId', authMiddleware, getUserAllPositionsEarnings)
router.get('/getUserRetryPaymentDetails/:paymentId', authMiddleware, getUserRetryPaymentDetails)
router.get('/getUserPinsReq/:userId', authMiddleware, getUserAllPinRequests)
router.get('/fetchSponsorName/:sponsorPositionId', getSponsorName)
router.get('/fetchUserName/:transferUserId',authMiddleware, getUserName)


//auth-routes
router.post('/sign-up', createUser);
router.post('/sign-in', login);
router.post('/logout', logout)

//Core-Logic-routes
router.post('/add-new-user',authMiddleware, addNewUser);
router.post('/payments/upload-payment', authMiddleware, upload.single("image"), processImage, completePaymentDetails)
router.post('/payments/activation/:paymentId', authMiddleware, confirmActivationPayment)
router.post('/payments/generate-payment', authMiddleware, generatePaymentDetailsFromPendingLink)
router.post('/payments/upgrade-or-sponsor/:paymentId', authMiddleware, confirmUpgradeAndSponsorPayment)
router.post('/pending-links/reentry', authMiddleware, createReentryPosition)
router.post('/create-pin-request', authMiddleware, upload.single("image"), processImage, SubmitPinRequest)
router.post('/transfer-pin', authMiddleware, transferPin)
router.post('/confirm-pin-request', authMiddleware, confirmUserPinRequest)
router.put('/update-user-personal', authMiddleware, updateUserDetails)
router.post('/update-user-banking', authMiddleware, upload.single("qrCode"), processImage, updateBankDetails)

export default router;