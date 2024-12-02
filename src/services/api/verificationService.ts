import axios from 'axios';
import { API_URL } from '@env';

class VerificationService {
  private static instance: VerificationService;

  private constructor() {}

  static getInstance(): VerificationService {
    if (!VerificationService.instance) {
      VerificationService.instance = new VerificationService();
    }
    return VerificationService.instance;
  }

  // Send phone verification code
  async sendPhoneVerification(phoneNumber: string): Promise<boolean> {
    try {
      const response = await axios.post(`${API_URL}/api/auth/verify/phone/send`, {
        phoneNumber,
      });
      return response.data.success;
    } catch (error) {
      console.error('Error sending phone verification:', error);
      throw error;
    }
  }

  // Verify phone code
  async verifyPhoneCode(phoneNumber: string, code: string): Promise<boolean> {
    try {
      const response = await axios.post(`${API_URL}/api/auth/verify/phone/confirm`, {
        phoneNumber,
        code,
      });
      return response.data.success;
    } catch (error) {
      console.error('Error verifying phone code:', error);
      throw error;
    }
  }

  // Send email verification
  async sendEmailVerification(email: string): Promise<boolean> {
    try {
      const response = await axios.post(`${API_URL}/api/auth/verify/email/send`, {
        email,
      });
      return response.data.success;
    } catch (error) {
      console.error('Error sending email verification:', error);
      throw error;
    }
  }

  // Verify email code
  async verifyEmailCode(email: string, code: string): Promise<boolean> {
    try {
      const response = await axios.post(`${API_URL}/api/auth/verify/email/confirm`, {
        email,
        code,
      });
      return response.data.success;
    } catch (error) {
      console.error('Error verifying email code:', error);
      throw error;
    }
  }

  // Send password reset email
  async sendPasswordReset(email: string): Promise<boolean> {
    try {
      const response = await axios.post(`${API_URL}/api/auth/password/reset/send`, {
        email,
      });
      return response.data.success;
    } catch (error) {
      console.error('Error sending password reset:', error);
      throw error;
    }
  }

  // Reset password with code
  async resetPassword(email: string, code: string, newPassword: string): Promise<boolean> {
    try {
      const response = await axios.post(`${API_URL}/api/auth/password/reset/confirm`, {
        email,
        code,
        newPassword,
      });
      return response.data.success;
    } catch (error) {
      console.error('Error resetting password:', error);
      throw error;
    }
  }
}

export default VerificationService.getInstance();
