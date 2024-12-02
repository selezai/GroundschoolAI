import axios from 'axios';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { API_URL } from '@env';

export interface SubscriptionPlan {
  id: string;
  name: string;
  description: string;
  price: number;
  currency: string;
  interval: 'month' | 'year';
  features: string[];
}

export interface SubscriptionStatus {
  isActive: boolean;
  plan: SubscriptionPlan | null;
  trialEndsAt: string | null;
  currentPeriodEnd: string | null;
  cancelAtPeriodEnd: boolean;
}

class SubscriptionService {
  private static instance: SubscriptionService;
  private readonly TRIAL_DURATION_DAYS = 14;

  private constructor() {}

  public static getInstance(): SubscriptionService {
    if (!SubscriptionService.instance) {
      SubscriptionService.instance = new SubscriptionService();
    }
    return SubscriptionService.instance;
  }

  private async getHeaders(): Promise<{ [key: string]: string }> {
    const token = await AsyncStorage.getItem('authToken');
    return {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json',
    };
  }

  async getSubscriptionPlans(): Promise<SubscriptionPlan[]> {
    try {
      const headers = await this.getHeaders();
      const response = await axios.get(`${API_URL}/api/subscriptions/plans`, { headers });
      return response.data.plans;
    } catch (error) {
      console.error('Error fetching subscription plans:', error);
      throw error;
    }
  }

  async getCurrentSubscription(): Promise<SubscriptionStatus> {
    try {
      const headers = await this.getHeaders();
      const response = await axios.get(`${API_URL}/api/subscriptions/status`, { headers });
      return response.data;
    } catch (error) {
      console.error('Error fetching subscription status:', error);
      throw error;
    }
  }

  async startFreeTrial(): Promise<SubscriptionStatus> {
    try {
      const headers = await this.getHeaders();
      const response = await axios.post(
        `${API_URL}/api/subscriptions/trial/start`,
        {},
        { headers }
      );
      return response.data;
    } catch (error) {
      console.error('Error starting free trial:', error);
      throw error;
    }
  }

  async subscribe(planId: string, paymentMethodId: string): Promise<SubscriptionStatus> {
    try {
      const headers = await this.getHeaders();
      const response = await axios.post(
        `${API_URL}/api/subscriptions/subscribe`,
        {
          planId,
          paymentMethodId,
        },
        { headers }
      );
      return response.data;
    } catch (error) {
      console.error('Error creating subscription:', error);
      throw error;
    }
  }

  async cancelSubscription(immediate: boolean = false): Promise<SubscriptionStatus> {
    try {
      const headers = await this.getHeaders();
      const response = await axios.post(
        `${API_URL}/api/subscriptions/cancel`,
        { immediate },
        { headers }
      );
      return response.data;
    } catch (error) {
      console.error('Error canceling subscription:', error);
      throw error;
    }
  }

  async reactivateSubscription(): Promise<SubscriptionStatus> {
    try {
      const headers = await this.getHeaders();
      const response = await axios.post(
        `${API_URL}/api/subscriptions/reactivate`,
        {},
        { headers }
      );
      return response.data;
    } catch (error) {
      console.error('Error reactivating subscription:', error);
      throw error;
    }
  }

  async getRemainingTrialDays(): Promise<number | null> {
    try {
      const status = await this.getCurrentSubscription();
      if (!status.trialEndsAt) return null;
      
      const trialEnd = new Date(status.trialEndsAt);
      const now = new Date();
      const diffTime = trialEnd.getTime() - now.getTime();
      const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
      
      return Math.max(0, diffDays);
    } catch (error) {
      console.error('Error calculating remaining trial days:', error);
      throw error;
    }
  }

  isTrialExpired(status: SubscriptionStatus): boolean {
    if (!status.trialEndsAt) return true;
    return new Date(status.trialEndsAt) < new Date();
  }

  async checkTrialEligibility(): Promise<boolean> {
    try {
      const headers = await this.getHeaders();
      const response = await axios.get(
        `${API_URL}/api/subscriptions/trial/eligibility`,
        { headers }
      );
      return response.data.eligible;
    } catch (error) {
      console.error('Error checking trial eligibility:', error);
      throw error;
    }
  }
}

export default SubscriptionService;
