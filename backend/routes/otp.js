import express from 'express';
import { OTPService } from '../../services/otpService.js';

const router = express.Router();

// Send OTP to email
router.post('/send', async (req, res) => {
  try {
    const { email } = req.body;

    if (!email) {
      return res.status(400).json({
        success: false,
        message: 'Email is required'
      });
    }

    // Basic email validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return res.status(400).json({
        success: false,
        message: 'Please enter a valid email address'
      });
    }

    const result = await OTPService.sendOTP(email);
    
    if (result.success) {
      res.json({
        success: true,
        message: result.message
      });
    } else {
      res.status(500).json({
        success: false,
        message: result.message
      });
    }
  } catch (error) {
    console.error('Error in OTP send route:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
});

// Verify OTP
router.post('/verify', (req, res) => {
  try {
    const { email, otp } = req.body;
    
    console.log('🔍 OTP Verification Request:');
    console.log('Email:', email);
    console.log('OTP:', otp);

    if (!email || !otp) {
      console.log('❌ Missing email or OTP');
      return res.status(400).json({
        success: false,
        message: 'Email and OTP are required'
      });
    }

    const result = OTPService.verifyOTP(email, otp);
    console.log('📊 Verification Result:', result);
    
    if (result.success) {
      res.json({
        success: true,
        message: result.message
      });
    } else {
      res.status(400).json({
        success: false,
        message: result.message
      });
    }
  } catch (error) {
    console.error('💥 Error in OTP verify route:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
});

// Check if email is verified
router.post('/check-verification', (req, res) => {
  try {
    const { email } = req.body;

    if (!email) {
      return res.status(400).json({
        success: false,
        message: 'Email is required'
      });
    }

    const isVerified = OTPService.isEmailVerified(email);
    
    res.json({
      success: true,
      verified: isVerified
    });
  } catch (error) {
    console.error('Error in OTP check verification route:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
});

export default router;
