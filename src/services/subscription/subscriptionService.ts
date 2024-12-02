import AsyncStorage from '@react-native-async-storage/async-storage';

interface PaymentDetails {
  userId: string;
  planId: string;
  amount: number;
}

interface SubscriptionStatus {
  subscription: {
    planName: string;
    nextBillingDate: string;
    status: 'active' | 'cancelled' | 'expired';
  } | null;
  trialDaysLeft: number | null;
}

class SubscriptionService {
  private static instance: SubscriptionService;
  private TRIAL_DURATION_DAYS = 14;
  private SUBSCRIPTION_KEY = '@groundschool_subscription';
  private TRIAL_START_KEY = '@groundschool_trial_start';

  private constructor() {}

  public static getInstance(): SubscriptionService {
    if (!SubscriptionService.instance) {
      SubscriptionService.instance = new SubscriptionService();
    }
    return SubscriptionService.instance;
  }

  public async initiatePayment(details: PaymentDetails): Promise<{ success: boolean }> {
    try {
      // TODO: Implement Paystack payment integration
      // This is a placeholder for the actual Paystack integration
      const paymentResult = await this.mockPaystackPayment(details);
      
      if (paymentResult.success) {
        // Save subscription details
        const subscription = {
          planName: 'Monthly Plan',
          nextBillingDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
          status: 'active' as const,
        };
        
        await AsyncStorage.setItem(
          `${this.SUBSCRIPTION_KEY}_${details.userId}`,
          JSON.stringify(subscription)
        );
      }

      return paymentResult;
    } catch (error) {
      console.error('Payment initiation error:', error);
      throw new Error('Failed to initiate payment');
    }
  }

  private async mockPaystackPayment(details: PaymentDetails): Promise<{ success: boolean }> {
    // This is a mock implementation
    // Replace with actual Paystack integration
    return new Promise((resolve) => {
      setTimeout(() => {
        resolve({ success: true });
      }, 2000);
    });
  }

  public async getSubscriptionStatus(userId: string): Promise<SubscriptionStatus> {
    try {
      const [subscriptionData, trialStartDate] = await Promise.all([
        AsyncStorage.getItem(`${this.SUBSCRIPTION_KEY}_${userId}`),
        AsyncStorage.getItem(`${this.TRIAL_START_KEY}_${userId}`),
      ]);

      const subscription = subscriptionData ? JSON.parse(subscriptionData) : null;
      let trialDaysLeft = null;

      if (!subscription && trialStartDate) {
        const startDate = new Date(trialStartDate);
        const now = new Date();
        const daysPassed = Math.floor((now.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24));
        trialDaysLeft = Math.max(0, this.TRIAL_DURATION_DAYS - daysPassed);
      }

      return {
        subscription,
        trialDaysLeft,
      };
    } catch (error) {
      console.error('Error getting subscription status:', error);
      throw new Error('Failed to get subscription status');
    }
  }

  public async startTrial(userId: string): Promise<void> {
    try {
      const existingTrial = await AsyncStorage.getItem(`${this.TRIAL_START_KEY}_${userId}`);
      if (!existingTrial) {
        await AsyncStorage.setItem(
          `${this.TRIAL_START_KEY}_${userId}`,
          new Date().toISOString()
        );
      }
    } catch (error) {
      console.error('Error starting trial:', error);
      throw new Error('Failed to start trial');
    }
  }

  public async cancelSubscription(userId: string): Promise<void> {
    try {
      const subscriptionData = await AsyncStorage.getItem(`${this.SUBSCRIPTION_KEY}_${userId}`);
      if (subscriptionData) {
        const subscription = JSON.parse(subscriptionData);
        subscription.status = 'cancelled';
        await AsyncStorage.setItem(
          `${this.SUBSCRIPTION_KEY}_${userId}`,
          JSON.stringify(subscription)
        );
      }
    } catch (error) {
      console.error('Error cancelling subscription:', error);
      throw new Error('Failed to cancel subscription');
    }
  }

  public async isSubscriptionActive(userId: string): Promise<boolean> {
    try {
      const status = await this.getSubscriptionStatus(userId);
      return (
        (status.subscription?.status === 'active') ||
        (status.trialDaysLeft !== null && status.trialDaysLeft > 0)
      );
    } catch (error) {
      console.error('Error checking subscription status:', error);
      return false;
    }
  }
}

export default SubscriptionService;
