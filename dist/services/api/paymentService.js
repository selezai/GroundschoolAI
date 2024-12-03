"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const axios_1 = __importDefault(require("axios"));
const async_storage_1 = __importDefault(require("@react-native-async-storage/async-storage"));
const API_URL = 'YOUR_API_URL'; // Replace with your actual API URL
const PAYSTACK_PUBLIC_KEY = 'YOUR_PAYSTACK_PUBLIC_KEY'; // Replace with your Paystack public key
class PaymentService {
    constructor() {
        this.token = null;
        this.initializeToken();
    }
    static getInstance() {
        if (!PaymentService.instance) {
            PaymentService.instance = new PaymentService();
        }
        return PaymentService.instance;
    }
    async initializeToken() {
        try {
            this.token = await async_storage_1.default.getItem('@auth_token');
        }
        catch (error) {
            console.error('Error initializing payment service:', error);
        }
    }
    async getHeaders() {
        return {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${this.token}`,
        };
    }
    async initializePayment(plan, email) {
        try {
            const response = await axios_1.default.post(`${API_URL}/payments/initialize`, {
                email,
                amount: plan.price * 100, // Paystack expects amount in kobo
                plan_id: plan.id,
            }, { headers: await this.getHeaders() });
            return response.data.authorization_url;
        }
        catch (error) {
            throw this.handleError(error);
        }
    }
    async verifyPayment(reference) {
        try {
            const response = await axios_1.default.get(`${API_URL}/payments/verify/${reference}`, { headers: await this.getHeaders() });
            return response.data;
        }
        catch (error) {
            throw this.handleError(error);
        }
    }
    async getSubscriptionPlans() {
        try {
            const response = await axios_1.default.get(`${API_URL}/subscriptions/plans`, { headers: await this.getHeaders() });
            return response.data;
        }
        catch (error) {
            throw this.handleError(error);
        }
    }
    async getCurrentSubscription() {
        try {
            const response = await axios_1.default.get(`${API_URL}/subscriptions/current`, { headers: await this.getHeaders() });
            return response.data;
        }
        catch (error) {
            throw this.handleError(error);
        }
    }
    handleError(error) {
        if (axios_1.default.isAxiosError(error)) {
            const message = error.response?.data?.message || error.message;
            return new Error(message);
        }
        return error;
    }
}
exports.default = PaymentService;
