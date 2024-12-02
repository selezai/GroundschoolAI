import axios from 'axios';
import AsyncStorage from '@react-native-async-storage/async-storage';

const API_URL = 'YOUR_API_URL'; // Replace with your actual API URL

export interface AuthResponse {
  token: string;
  user: {
    id: string;
    email: string;
    name: string;
    subscription: {
      status: 'active' | 'inactive';
      expiryDate: string;
    };
  };
}

export interface LoginCredentials {
  email: string;
  password: string;
}

export interface SignupCredentials extends LoginCredentials {
  name: string;
}

class AuthService {
  private static instance: AuthService;
  private token: string | null = null;

  private constructor() {}

  static getInstance(): AuthService {
    if (!AuthService.instance) {
      AuthService.instance = new AuthService();
    }
    return AuthService.instance;
  }

  private async getHeaders() {
    return {
      'Content-Type': 'application/json',
      ...(this.token ? { Authorization: `Bearer ${this.token}` } : {}),
    };
  }

  async login(credentials: LoginCredentials): Promise<AuthResponse> {
    try {
      const response = await axios.post(`${API_URL}/auth/login`, credentials);
      await this.handleAuthResponse(response.data);
      return response.data;
    } catch (error) {
      throw this.handleError(error);
    }
  }

  async signup(credentials: SignupCredentials): Promise<AuthResponse> {
    try {
      const response = await axios.post(`${API_URL}/auth/signup`, credentials);
      await this.handleAuthResponse(response.data);
      return response.data;
    } catch (error) {
      throw this.handleError(error);
    }
  }

  async logout(): Promise<void> {
    try {
      await AsyncStorage.removeItem('@auth_token');
      await AsyncStorage.removeItem('@user_data');
      this.token = null;
    } catch (error) {
      console.error('Logout error:', error);
      throw new Error('Failed to logout');
    }
  }

  async refreshToken(): Promise<void> {
    try {
      const response = await axios.post(
        `${API_URL}/auth/refresh-token`,
        {},
        { headers: await this.getHeaders() }
      );
      await this.handleAuthResponse(response.data);
    } catch (error) {
      throw this.handleError(error);
    }
  }

  private async handleAuthResponse(data: AuthResponse): Promise<void> {
    this.token = data.token;
    await AsyncStorage.setItem('@auth_token', data.token);
    await AsyncStorage.setItem('@user_data', JSON.stringify(data.user));
  }

  private handleError(error: any): Error {
    if (axios.isAxiosError(error)) {
      const message = error.response?.data?.message || error.message;
      return new Error(message);
    }
    return error;
  }

  async checkAuthStatus(): Promise<boolean> {
    try {
      const token = await AsyncStorage.getItem('@auth_token');
      return !!token;
    } catch {
      return false;
    }
  }
}

export default AuthService;
