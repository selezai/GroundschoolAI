"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const async_storage_1 = __importDefault(require("@react-native-async-storage/async-storage"));
class SubscriptionService {
    constructor() {
        this.TRIAL_DURATION_DAYS = 14;
        this.SUBSCRIPTION_KEY = '@groundschool_subscription';
        this.TRIAL_START_KEY = '@groundschool_trial_start';
    }
    static getInstance() {
        if (!SubscriptionService.instance) {
            SubscriptionService.instance = new SubscriptionService();
        }
        return SubscriptionService.instance;
    }
    async initiatePayment(details) {
        try {
            // TODO: Implement Paystack payment integration
            // This is a placeholder for the actual Paystack integration
            const paymentResult = await this.mockPaystackPayment(details);
            if (paymentResult.success) {
                // Save subscription details
                const subscription = {
                    planName: 'Monthly Plan',
                    nextBillingDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
                    status: 'active',
                };
                await async_storage_1.default.setItem(`${this.SUBSCRIPTION_KEY}_${details.userId}`, JSON.stringify(subscription));
            }
            return paymentResult;
        }
        catch (error) {
            console.error('Payment initiation error:', error);
            throw new Error('Failed to initiate payment');
        }
    }
    async mockPaystackPayment(details) {
        // This is a mock implementation
        // Replace with actual Paystack integration
        return new Promise((resolve) => {
            setTimeout(() => {
                resolve({ success: true });
            }, 2000);
        });
    }
    async getSubscriptionStatus(userId) {
        try {
            const [subscriptionData, trialStartDate] = await Promise.all([
                async_storage_1.default.getItem(`${this.SUBSCRIPTION_KEY}_${userId}`),
                async_storage_1.default.getItem(`${this.TRIAL_START_KEY}_${userId}`),
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
        }
        catch (error) {
            console.error('Error getting subscription status:', error);
            throw new Error('Failed to get subscription status');
        }
    }
    async startTrial(userId) {
        try {
            const existingTrial = await async_storage_1.default.getItem(`${this.TRIAL_START_KEY}_${userId}`);
            if (!existingTrial) {
                await async_storage_1.default.setItem(`${this.TRIAL_START_KEY}_${userId}`, new Date().toISOString());
            }
        }
        catch (error) {
            console.error('Error starting trial:', error);
            throw new Error('Failed to start trial');
        }
    }
    async cancelSubscription(userId) {
        try {
            const subscriptionData = await async_storage_1.default.getItem(`${this.SUBSCRIPTION_KEY}_${userId}`);
            if (subscriptionData) {
                const subscription = JSON.parse(subscriptionData);
                subscription.status = 'cancelled';
                await async_storage_1.default.setItem(`${this.SUBSCRIPTION_KEY}_${userId}`, JSON.stringify(subscription));
            }
        }
        catch (error) {
            console.error('Error cancelling subscription:', error);
            throw new Error('Failed to cancel subscription');
        }
    }
    async isSubscriptionActive(userId) {
        try {
            const status = await this.getSubscriptionStatus(userId);
            return ((status.subscription?.status === 'active') ||
                (status.trialDaysLeft !== null && status.trialDaysLeft > 0));
        }
        catch (error) {
            console.error('Error checking subscription status:', error);
            return false;
        }
    }
}
exports.default = SubscriptionService;
