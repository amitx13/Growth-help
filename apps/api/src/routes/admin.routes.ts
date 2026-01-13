import { Router } from 'express';
import { activateUserAccount, adminLogin, directlyTransferPins, fetchAdminDetails, generatePin, getAdminConfigs, getAdminDashboardData, getAllPaymentDetails, getAllPinsDetails, getUsersDetails, updateAdminBankDetails, updateBankDetailsViaAdmin, updateUserDetailsViaAdmin } from '../controllers/admin.controllers';
import { confirmActivationPayment, confirmUpgradeAndSponsorPaymentViaAdmin,  } from '../controllers/user.controllers';
import { adminAuthMiddleware } from '../middleware/adminAuth';
import { processImage, upload } from '../middleware/upload';
import { confirmUserPinRequest } from '../controllers/user.pinController';
const router = Router();

router.get('/fetchAdminDetails',adminAuthMiddleware,fetchAdminDetails)
router.get('/getAdminDashboardData',adminAuthMiddleware,getAdminDashboardData)
router.get('/allUserDetails',adminAuthMiddleware,getUsersDetails)
router.get('/getAllPaymentsDetails',adminAuthMiddleware,getAllPaymentDetails)
router.get('/getAllPinDetails',adminAuthMiddleware,getAllPinsDetails)
router.get('/getAdminConfigs',adminAuthMiddleware,getAdminConfigs)

router.post('/sign-in',adminLogin)
router.post('/confirm-pin-transfer',adminAuthMiddleware,confirmUserPinRequest)
router.post('/generate-pin',adminAuthMiddleware,generatePin)
router.post('/transfer-pins-direct',adminAuthMiddleware,directlyTransferPins)
router.post ('/activate-user-account',adminAuthMiddleware,activateUserAccount)

router.post ('/confirmActivationPayment/:paymentId',adminAuthMiddleware,confirmActivationPayment)
router.post('/confirm-upgradeAndSponsor-pay/:paymentId',adminAuthMiddleware,confirmUpgradeAndSponsorPaymentViaAdmin)

router.post('/updateAdminBank',adminAuthMiddleware,upload.single("qrCode"), processImage,updateAdminBankDetails)
router.put('/updateUserDetailsViaAdmin',adminAuthMiddleware,updateUserDetailsViaAdmin)
router.put('/updateUserBankDetailsViaAdmin/:userId', adminAuthMiddleware,upload.single("qrCode"), processImage, updateBankDetailsViaAdmin)

export default router;