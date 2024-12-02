export interface User {
  id: string;
  email: string;
  phoneNumber: string;
  isEmailVerified: boolean;
  isPhoneVerified: boolean;
  trialStartDate: string | null;
  subscriptionStatus: 'trial' | 'active' | 'expired';
  subscriptionEndDate: string | null;
}

export interface AuthState {
  user: User | null;
  isLoading: boolean;
  error: string | null;
  verificationId: string | null;
}

export interface LoginCredentials {
  email: string;
  password: string;
  phoneNumber?: string;
}

export interface VerificationPayload {
  type: 'email' | 'phone';
  code: string;
  verificationId: string;
}

export interface AuthResponse {
  user: User;
  token: string;
}
