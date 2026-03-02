import express from 'express';
import {
  signup,
  login,
  logout,
  getCurrentUser,
  sendRegistrationOTP,
  verifyRegistrationOTP,
  resetPassword,
} from '../controllers/userController.js';

const router = express.Router();

router.post('/send-otp', sendRegistrationOTP);
router.post('/verify-otp', verifyRegistrationOTP);
router.post('/signup', signup);
router.post('/login', login);
router.post('/logout', logout);
router.post('/reset-password', resetPassword);
router.get('/current', getCurrentUser);

export default router;
