"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const async_storage_1 = __importDefault(require("@react-native-async-storage/async-storage"));
const authApi_1 = require("./api/authApi");
const AUTH_TOKEN_KEY = '@auth_token';
const USER_DATA_KEY = '@user_data';
class AuthService {
    constructor() {
        this.token = null;
        this.user = null;
    }
    static getInstance() {
        if (!AuthService.instance) {
            AuthService.instance = new AuthService();
        }
        return AuthService.instance;
    }
    async login(credentials) {
        try {
            const response = await authApi_1.authApi.login(credentials);
            await this.setAuthData(response);
            return response;
        }
        catch (error) {
            throw new Error('Login failed: ' + error.message);
        }
    }
    async signup(credentials) {
        try {
            const response = await authApi_1.authApi.signup(credentials);
            await this.setAuthData(response);
            return response;
        }
        catch (error) {
            throw new Error('Signup failed: ' + error.message);
        }
    }
    async sendVerificationCode(type, value) {
        return authApi_1.authApi.sendVerificationCode(type, value);
    }
    async verifyCode(payload) {
        const isValid = await authApi_1.authApi.verifyCode(payload);
        if (isValid && this.user) {
            const updatedUser = {
                ...this.user,
                isEmailVerified: payload.type === 'email' ? true : this.user.isEmailVerified,
                isPhoneVerified: payload.type === 'phone' ? true : this.user.isPhoneVerified,
            };
            await this.updateUserData(updatedUser);
        }
        return isValid;
    }
    async requestPasswordReset(email) {
        return authApi_1.authApi.requestPasswordReset(email);
    }
    async resetPassword(token, newPassword) {
        return authApi_1.authApi.resetPassword(token, newPassword);
    }
    async validateResetToken(token) {
        return authApi_1.authApi.validateResetToken(token);
    }
    async logout() {
        await async_storage_1.default.multiRemove([AUTH_TOKEN_KEY, USER_DATA_KEY]);
        this.token = null;
        this.user = null;
    }
    async checkAuthStatus() {
        try {
            const [token, userData] = await Promise.all([
                async_storage_1.default.getItem(AUTH_TOKEN_KEY),
                async_storage_1.default.getItem(USER_DATA_KEY),
            ]);
            if (token && userData) {
                this.token = token;
                this.user = JSON.parse(userData);
                return true;
            }
            return false;
        }
        catch {
            return false;
        }
    }
    async checkTrialStatus() {
        if (!this.user)
            throw new Error('No user logged in');
        return this.user.subscriptionStatus;
    }
    async setAuthData(response) {
        const { token, user } = response;
        await Promise.all([
            async_storage_1.default.setItem(AUTH_TOKEN_KEY, token),
            async_storage_1.default.setItem(USER_DATA_KEY, JSON.stringify(user)),
        ]);
        this.token = token;
        this.user = user;
    }
    async updateUserData(user) {
        await async_storage_1.default.setItem(USER_DATA_KEY, JSON.stringify(user));
        this.user = user;
    }
}
exports.default = AuthService.getInstance();
