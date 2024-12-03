"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const axios_1 = __importDefault(require("axios"));
const async_storage_1 = __importDefault(require("@react-native-async-storage/async-storage"));
const _env_1 = require("@env");
class SubscriptionService {
    constructor() {
        this.TRIAL_DURATION_DAYS = 14;
    }
    static getInstance() {
        if (!SubscriptionService.instance) {
            SubscriptionService.instance = new SubscriptionService();
        }
        return SubscriptionService.instance;
    }
    async getHeaders() {
        const token = await async_storage_1.default.getItem('authToken');
        return {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json',
        };
    }
    async getSubscriptionPlans() {
        try {
            const headers = await this.getHeaders();
            const response = await axios_1.default.get(`${_env_1.API_URL}/api/subscriptions/plans`, { headers });
            return response.data.plans;
        }
        catch (error) {
            console.error('Error fetching subscription plans:', error);
            throw error;
        }
    }
    async getCurrentSubscription() {
        try {
            const headers = await this.getHeaders();
            const response = await axios_1.default.get(`${_env_1.API_URL}/api/subscriptions/status`, { headers });
            return response.data;
        }
        catch (error) {
            console.error('Error fetching subscription status:', error);
            throw error;
        }
    }
    async startFreeTrial() {
        try {
            const headers = await this.getHeaders();
            const response = await axios_1.default.post(`${_env_1.API_URL}/api/subscriptions/trial/start`, {}, { headers });
            return response.data;
        }
        catch (error) {
            console.error('Error starting free trial:', error);
            throw error;
        }
    }
    async subscribe(planId, paymentMethodId) {
        try {
            const headers = await this.getHeaders();
            const response = await axios_1.default.post(`${_env_1.API_URL}/api/subscriptions/subscribe`, {
                planId,
                paymentMethodId,
            }, { headers });
            return response.data;
        }
        catch (error) {
            console.error('Error creating subscription:', error);
            throw error;
        }
    }
    async cancelSubscription(immediate = false) {
        try {
            const headers = await this.getHeaders();
            const response = await axios_1.default.post(`${_env_1.API_URL}/api/subscriptions/cancel`, { immediate }, { headers });
            return response.data;
        }
        catch (error) {
            console.error('Error canceling subscription:', error);
            throw error;
        }
    }
    async reactivateSubscription() {
        try {
            const headers = await this.getHeaders();
            const response = await axios_1.default.post(`${_env_1.API_URL}/api/subscriptions/reactivate`, {}, { headers });
            return response.data;
        }
        catch (error) {
            console.error('Error reactivating subscription:', error);
            throw error;
        }
    }
    async getRemainingTrialDays() {
        try {
            const status = await this.getCurrentSubscription();
            if (!status.trialEndsAt)
                return null;
            const trialEnd = new Date(status.trialEndsAt);
            const now = new Date();
            const diffTime = trialEnd.getTime() - now.getTime();
            const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
            return Math.max(0, diffDays);
        }
        catch (error) {
            console.error('Error calculating remaining trial days:', error);
            throw error;
        }
    }
    isTrialExpired(status) {
        if (!status.trialEndsAt)
            return true;
        return new Date(status.trialEndsAt) < new Date();
    }
    async checkTrialEligibility() {
        try {
            const headers = await this.getHeaders();
            const response = await axios_1.default.get(`${_env_1.API_URL}/api/subscriptions/trial/eligibility`, { headers });
            return response.data.eligible;
        }
        catch (error) {
            console.error('Error checking trial eligibility:', error);
            throw error;
        }
    }
}
exports.default = SubscriptionService;
