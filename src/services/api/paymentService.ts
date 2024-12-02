import axios from 'axios';
import AsyncStorage from '@react-native-async-storage/async-storage';

const API_URL = 'YOUR_API_URL'; // Replace with your actual API URL
const PAYSTACK_PUBLIC_KEY = 'YOUR_PAYSTACK_PUBLIC_KEY'; // Replace with your Paystack public key

export interface PaymentResponse {
  reference: string;
  status: 'success' | 'failed' | 'pending';
  transaction_id?: string;
  message: string;
}

export interface SubscriptionPlan {
  id: string;
  name: string;
  price: number;
  duration: number; // in months
  features: string[];
}

class PaymentService {
  private static instance: PaymentService;
  private token: string | null = null;

  private constructor() {
    this.initializeToken();
  }

  static getInstance(): PaymentService {
    if (!PaymentService.instance) {
      PaymentService.instance = new PaymentService();
    }
    return PaymentService.instance;
  }

  private async initializeToken() {
    try {
      this.token = await AsyncStorage.getItem('@auth_token');
    } catch (error) {
      console.error('Error initializing payment service:', error);
    }
  }

  private async getHeaders() {
    return {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${this.token}`,
    };
  }

  async initializePayment(plan: SubscriptionPlan, email: string): Promise<string> {
    try {
      const response = await axios.post(
        `${API_URL}/payments/initialize`,
        {
          email,
          amount: plan.price * 100, // Paystack expects amount in kobo
          plan_id: plan.id,
        },
        { headers: await this.getHeaders() }
      );

      return response.data.authorization_url;
    } catch (error) {
      throw this.handleError(error);
    }
  }

  async verifyPayment(reference: string): Promise<PaymentResponse> {
    try {
      const response = await axios.get(
        `${API_URL}/payments/verify/${reference}`,
        { headers: await this.getHeaders() }
      );

      return response.data;
    } catch (error) {
      throw this.handleError(error);
    }
  }

  async getSubscriptionPlans(): Promise<SubscriptionPlan[]> {
    try {
      const response = await axios.get(
        `${API_URL}/subscriptions/plans`,
        { headers: await this.getHeaders() }
      );

      return response.data;
    } catch (error) {
      throw this.handleError(error);
    }
  }

  async getCurrentSubscription(): Promise<{
    status: 'active' | 'inactive';
    plan?: SubscriptionPlan;
    expiryDate?: string;
  }> {
    try {
      const response = await axios.get(
        `${API_URL}/subscriptions/current`,
        { headers: await this.getHeaders() }
      );

      return response.data;
    } catch (error) {
      throw this.handleError(error);
    }
  }

  private handleError(error: any): Error {
    if (axios.isAxiosError(error)) {
      const message = error.response?.data?.message || error.message;
      return new Error(message);
    }
    return error;
  }
}

export default PaymentService;
