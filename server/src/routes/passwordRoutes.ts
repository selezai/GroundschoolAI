import express from 'express';
import crypto from 'crypto';
import User from '../models/User';
import PasswordReset from '../models/PasswordReset';
import { sendPasswordResetEmail } from '../utils/email';

const router = express.Router();

// Request password reset
router.post('/forgot', async (req, res) => {
  try {
    const { email } = req.body;
    const user = await User.findOne({ email });

    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    // Generate reset token
    const resetToken = crypto.randomBytes(32).toString('hex');

    // Save reset token
    await PasswordReset.create({
      userId: user._id,
      token: resetToken,
    });

    // Send reset email
    try {
      await sendPasswordResetEmail(email, resetToken, user.name);
    } catch (emailError) {
      console.error('Detailed email error:', emailError);
      throw emailError;
    }

    res.json({ message: 'Password reset email sent' });
  } catch (error) {
    console.error('Error requesting password reset:', error);
    res.status(500).json({ message: 'Error requesting password reset' });
  }
});

// Reset password with token
router.post('/reset', async (req, res) => {
  try {
    const { token, newPassword } = req.body;

    // Find valid reset token
    const resetRequest = await PasswordReset.findOne({
      token,
      expiresAt: { $gt: new Date() }
    });

    if (!resetRequest) {
      return res.status(400).json({ message: 'Invalid or expired reset token' });
    }

    // Update password
    const user = await User.findById(resetRequest.userId);
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    user.password = newPassword;
    await user.save();

    // Delete used token
    await PasswordReset.deleteOne({ _id: resetRequest._id });

    res.json({ message: 'Password reset successful' });
  } catch (error) {
    console.error('Error resetting password:', error);
    res.status(500).json({ message: 'Error resetting password' });
  }
});

export default router;
