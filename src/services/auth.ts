import AsyncStorage from '@react-native-async-storage/async-storage';
import { AuthResponse, LoginCredentials, User, VerificationPayload } from '../types/auth';
import { authApi } from './api/authApi';

const AUTH_TOKEN_KEY = '@auth_token';
const USER_DATA_KEY = '@user_data';

class AuthService {
  private static instance: AuthService;
  private token: string | null = null;
  private user: User | null = null;

  private constructor() {}

  static getInstance(): AuthService {
    if (!AuthService.instance) {
      AuthService.instance = new AuthService();
    }
    return AuthService.instance;
  }

  async login(credentials: LoginCredentials): Promise<AuthResponse> {
    try {
      const response = await authApi.login(credentials);
      await this.setAuthData(response);
      return response;
    } catch (error) {
      throw new Error('Login failed: ' + (error as Error).message);
    }
  }

  async signup(credentials: LoginCredentials): Promise<AuthResponse> {
    try {
      const response = await authApi.signup(credentials);
      await this.setAuthData(response);
      return response;
    } catch (error) {
      throw new Error('Signup failed: ' + (error as Error).message);
    }
  }

  async sendVerificationCode(type: 'email' | 'phone', value: string): Promise<string> {
    return authApi.sendVerificationCode(type, value);
  }

  async verifyCode(payload: VerificationPayload): Promise<boolean> {
    const isValid = await authApi.verifyCode(payload);
    if (isValid && this.user) {
      const updatedUser = {
        ...this.user,
        isEmailVerified: payload.type === 'email' ? true : this.user.isEmailVerified,
        isPhoneVerified: payload.type === 'phone' ? true : this.user.isPhoneVerified,
      };
      await this.updateUserData(updatedUser);
    }
    return isValid;
  }

  async requestPasswordReset(email: string): Promise<{ success: boolean }> {
    return authApi.requestPasswordReset(email);
  }

  async resetPassword(token: string, newPassword: string): Promise<{ success: boolean }> {
    return authApi.resetPassword(token, newPassword);
  }

  async validateResetToken(token: string): Promise<boolean> {
    return authApi.validateResetToken(token);
  }

  async logout(): Promise<void> {
    await AsyncStorage.multiRemove([AUTH_TOKEN_KEY, USER_DATA_KEY]);
    this.token = null;
    this.user = null;
  }

  async checkAuthStatus(): Promise<boolean> {
    try {
      const [token, userData] = await Promise.all([
        AsyncStorage.getItem(AUTH_TOKEN_KEY),
        AsyncStorage.getItem(USER_DATA_KEY),
      ]);

      if (token && userData) {
        this.token = token;
        this.user = JSON.parse(userData);
        return true;
      }
      return false;
    } catch {
      return false;
    }
  }

  async checkTrialStatus(): Promise<'trial' | 'active' | 'expired'> {
    if (!this.user) throw new Error('No user logged in');
    return this.user.subscriptionStatus;
  }

  private async setAuthData(response: AuthResponse): Promise<void> {
    const { token, user } = response;
    await Promise.all([
      AsyncStorage.setItem(AUTH_TOKEN_KEY, token),
      AsyncStorage.setItem(USER_DATA_KEY, JSON.stringify(user)),
    ]);
    this.token = token;
    this.user = user;
  }

  private async updateUserData(user: User): Promise<void> {
    await AsyncStorage.setItem(USER_DATA_KEY, JSON.stringify(user));
    this.user = user;
  }
}

export default AuthService.getInstance();
