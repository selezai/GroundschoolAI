"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const axios_1 = __importDefault(require("axios"));
const async_storage_1 = __importDefault(require("@react-native-async-storage/async-storage"));
const API_URL = 'YOUR_API_URL'; // Replace with your actual API URL
class AuthService {
    constructor() {
        this.token = null;
    }
    static getInstance() {
        if (!AuthService.instance) {
            AuthService.instance = new AuthService();
        }
        return AuthService.instance;
    }
    async getHeaders() {
        return {
            'Content-Type': 'application/json',
            ...(this.token ? { Authorization: `Bearer ${this.token}` } : {}),
        };
    }
    async login(credentials) {
        try {
            const response = await axios_1.default.post(`${API_URL}/auth/login`, credentials);
            await this.handleAuthResponse(response.data);
            return response.data;
        }
        catch (error) {
            throw this.handleError(error);
        }
    }
    async signup(credentials) {
        try {
            const response = await axios_1.default.post(`${API_URL}/auth/signup`, credentials);
            await this.handleAuthResponse(response.data);
            return response.data;
        }
        catch (error) {
            throw this.handleError(error);
        }
    }
    async logout() {
        try {
            await async_storage_1.default.removeItem('@auth_token');
            await async_storage_1.default.removeItem('@user_data');
            this.token = null;
        }
        catch (error) {
            console.error('Logout error:', error);
            throw new Error('Failed to logout');
        }
    }
    async refreshToken() {
        try {
            const response = await axios_1.default.post(`${API_URL}/auth/refresh-token`, {}, { headers: await this.getHeaders() });
            await this.handleAuthResponse(response.data);
        }
        catch (error) {
            throw this.handleError(error);
        }
    }
    async handleAuthResponse(data) {
        this.token = data.token;
        await async_storage_1.default.setItem('@auth_token', data.token);
        await async_storage_1.default.setItem('@user_data', JSON.stringify(data.user));
    }
    handleError(error) {
        if (axios_1.default.isAxiosError(error)) {
            const message = error.response?.data?.message || error.message;
            return new Error(message);
        }
        return error;
    }
    async checkAuthStatus() {
        try {
            const token = await async_storage_1.default.getItem('@auth_token');
            return !!token;
        }
        catch {
            return false;
        }
    }
}
exports.default = AuthService;
