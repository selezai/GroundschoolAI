import React, { createContext, useContext, useState, useEffect } from 'react';
import SubscriptionService, { 
  SubscriptionStatus, 
  SubscriptionPlan 
} from '../services/api/subscriptionService';

interface SubscriptionContextType {
  subscriptionStatus: SubscriptionStatus | null;
  isLoading: boolean;
  remainingTrialDays: number | null;
  plans: SubscriptionPlan[];
  startTrial: () => Promise<void>;
  subscribe: (planId: string, paymentMethodId: string) => Promise<void>;
  cancelSubscription: (immediate?: boolean) => Promise<void>;
  reactivateSubscription: () => Promise<void>;
  refreshSubscriptionStatus: () => Promise<void>;
  isEligibleForTrial: boolean;
}

const SubscriptionContext = createContext<SubscriptionContextType | undefined>(undefined);

export const useSubscription = () => {
  const context = useContext(SubscriptionContext);
  if (!context) {
    throw new Error('useSubscription must be used within a SubscriptionProvider');
  }
  return context;
};

export const SubscriptionProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [subscriptionStatus, setSubscriptionStatus] = useState<SubscriptionStatus | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [remainingTrialDays, setRemainingTrialDays] = useState<number | null>(null);
  const [plans, setPlans] = useState<SubscriptionPlan[]>([]);
  const [isEligibleForTrial, setIsEligibleForTrial] = useState(false);

  const subscriptionService = SubscriptionService.getInstance();

  const loadSubscriptionData = async () => {
    try {
      const [status, trialDays, eligibility, availablePlans] = await Promise.all([
        subscriptionService.getCurrentSubscription(),
        subscriptionService.getRemainingTrialDays(),
        subscriptionService.checkTrialEligibility(),
        subscriptionService.getSubscriptionPlans(),
      ]);

      setSubscriptionStatus(status);
      setRemainingTrialDays(trialDays);
      setIsEligibleForTrial(eligibility);
      setPlans(availablePlans);
    } catch (error) {
      console.error('Error loading subscription data:', error);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadSubscriptionData();
  }, []);

  const startTrial = async () => {
    try {
      setIsLoading(true);
      const status = await subscriptionService.startFreeTrial();
      setSubscriptionStatus(status);
      const trialDays = await subscriptionService.getRemainingTrialDays();
      setRemainingTrialDays(trialDays);
      setIsEligibleForTrial(false);
    } catch (error) {
      console.error('Error starting trial:', error);
      throw error;
    } finally {
      setIsLoading(false);
    }
  };

  const subscribe = async (planId: string, paymentMethodId: string) => {
    try {
      setIsLoading(true);
      const status = await subscriptionService.subscribe(planId, paymentMethodId);
      setSubscriptionStatus(status);
    } catch (error) {
      console.error('Error subscribing:', error);
      throw error;
    } finally {
      setIsLoading(false);
    }
  };

  const cancelSubscription = async (immediate: boolean = false) => {
    try {
      setIsLoading(true);
      const status = await subscriptionService.cancelSubscription(immediate);
      setSubscriptionStatus(status);
    } catch (error) {
      console.error('Error canceling subscription:', error);
      throw error;
    } finally {
      setIsLoading(false);
    }
  };

  const reactivateSubscription = async () => {
    try {
      setIsLoading(true);
      const status = await subscriptionService.reactivateSubscription();
      setSubscriptionStatus(status);
    } catch (error) {
      console.error('Error reactivating subscription:', error);
      throw error;
    } finally {
      setIsLoading(false);
    }
  };

  const refreshSubscriptionStatus = async () => {
    await loadSubscriptionData();
  };

  const value = {
    subscriptionStatus,
    isLoading,
    remainingTrialDays,
    plans,
    startTrial,
    subscribe,
    cancelSubscription,
    reactivateSubscription,
    refreshSubscriptionStatus,
    isEligibleForTrial,
  };

  return (
    <SubscriptionContext.Provider value={value}>
      {children}
    </SubscriptionContext.Provider>
  );
};
