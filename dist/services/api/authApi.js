"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.authApi = void 0;
const axios_1 = __importDefault(require("axios"));
const API_BASE_URL = 'https://api.groundschoolai.com/v1'; // Replace with your actual API URL
const api = axios_1.default.create({
    baseURL: API_BASE_URL,
    timeout: 10000,
    headers: {
        'Content-Type': 'application/json',
    },
});
exports.authApi = {
    login: async (credentials) => {
        const response = await api.post('/auth/login', credentials);
        return response.data;
    },
    signup: async (credentials) => {
        const response = await api.post('/auth/signup', credentials);
        return response.data;
    },
    sendVerificationCode: async (type, value) => {
        const response = await api.post('/auth/send-verification', { type, value });
        return response.data.verificationId;
    },
    verifyCode: async (payload) => {
        const response = await api.post('/auth/verify-code', payload);
        return response.data.success;
    },
    requestPasswordReset: async (email) => {
        const response = await api.post('/auth/request-reset', { email });
        return response.data;
    },
    resetPassword: async (token, newPassword) => {
        const response = await api.post('/auth/reset-password', {
            token,
            newPassword,
        });
        return response.data;
    },
    validateResetToken: async (token) => {
        const response = await api.post('/auth/validate-reset-token', { token });
        return response.data.valid;
    },
};
