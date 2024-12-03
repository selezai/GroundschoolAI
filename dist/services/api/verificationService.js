"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const axios_1 = __importDefault(require("axios"));
const _env_1 = require("@env");
class VerificationService {
    constructor() { }
    static getInstance() {
        if (!VerificationService.instance) {
            VerificationService.instance = new VerificationService();
        }
        return VerificationService.instance;
    }
    // Send phone verification code
    async sendPhoneVerification(phoneNumber) {
        try {
            const response = await axios_1.default.post(`${_env_1.API_URL}/api/auth/verify/phone/send`, {
                phoneNumber,
            });
            return response.data.success;
        }
        catch (error) {
            console.error('Error sending phone verification:', error);
            throw error;
        }
    }
    // Verify phone code
    async verifyPhoneCode(phoneNumber, code) {
        try {
            const response = await axios_1.default.post(`${_env_1.API_URL}/api/auth/verify/phone/confirm`, {
                phoneNumber,
                code,
            });
            return response.data.success;
        }
        catch (error) {
            console.error('Error verifying phone code:', error);
            throw error;
        }
    }
    // Send email verification
    async sendEmailVerification(email) {
        try {
            const response = await axios_1.default.post(`${_env_1.API_URL}/api/auth/verify/email/send`, {
                email,
            });
            return response.data.success;
        }
        catch (error) {
            console.error('Error sending email verification:', error);
            throw error;
        }
    }
    // Verify email code
    async verifyEmailCode(email, code) {
        try {
            const response = await axios_1.default.post(`${_env_1.API_URL}/api/auth/verify/email/confirm`, {
                email,
                code,
            });
            return response.data.success;
        }
        catch (error) {
            console.error('Error verifying email code:', error);
            throw error;
        }
    }
    // Send password reset email
    async sendPasswordReset(email) {
        try {
            const response = await axios_1.default.post(`${_env_1.API_URL}/api/auth/password/reset/send`, {
                email,
            });
            return response.data.success;
        }
        catch (error) {
            console.error('Error sending password reset:', error);
            throw error;
        }
    }
    // Reset password with code
    async resetPassword(email, code, newPassword) {
        try {
            const response = await axios_1.default.post(`${_env_1.API_URL}/api/auth/password/reset/confirm`, {
                email,
                code,
                newPassword,
            });
            return response.data.success;
        }
        catch (error) {
            console.error('Error resetting password:', error);
            throw error;
        }
    }
}
exports.default = VerificationService.getInstance();
