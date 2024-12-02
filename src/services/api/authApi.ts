import axios from 'axios';
import { LoginCredentials, AuthResponse, VerificationPayload } from '../../types/auth';

const API_BASE_URL = 'https://api.groundschoolai.com/v1'; // Replace with your actual API URL

const api = axios.create({
  baseURL: API_BASE_URL,
  timeout: 10000,
  headers: {
    'Content-Type': 'application/json',
  },
});

export const authApi = {
  login: async (credentials: LoginCredentials): Promise<AuthResponse> => {
    const response = await api.post('/auth/login', credentials);
    return response.data;
  },

  signup: async (credentials: LoginCredentials): Promise<AuthResponse> => {
    const response = await api.post('/auth/signup', credentials);
    return response.data;
  },

  sendVerificationCode: async (type: 'email' | 'phone', value: string): Promise<string> => {
    const response = await api.post('/auth/send-verification', { type, value });
    return response.data.verificationId;
  },

  verifyCode: async (payload: VerificationPayload): Promise<boolean> => {
    const response = await api.post('/auth/verify-code', payload);
    return response.data.success;
  },

  requestPasswordReset: async (email: string): Promise<{ success: boolean }> => {
    const response = await api.post('/auth/request-reset', { email });
    return response.data;
  },

  resetPassword: async (token: string, newPassword: string): Promise<{ success: boolean }> => {
    const response = await api.post('/auth/reset-password', {
      token,
      newPassword,
    });
    return response.data;
  },

  validateResetToken: async (token: string): Promise<boolean> => {
    const response = await api.post('/auth/validate-reset-token', { token });
    return response.data.valid;
  },
};
