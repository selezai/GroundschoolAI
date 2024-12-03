"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.studyApi = void 0;
const axios_1 = __importDefault(require("axios"));
const config_1 = require("../../config");
const auth_1 = require("../auth");
const api = axios_1.default.create({
    baseURL: config_1.API_BASE_URL,
    timeout: 30000, // Longer timeout for file uploads
});
exports.studyApi = {
    // Get upload URL and create study material record
    initiateUpload: async (metadata) => {
        const response = await api.post('/study/initiate-upload', metadata);
        return response.data;
    },
    // Upload file to storage
    uploadFile: async (uploadUrl, file) => {
        await axios_1.default.put(uploadUrl, file, {
            headers: {
                'Content-Type': file.type,
            },
        });
    },
    // Get processing status of uploaded material
    getProcessingStatus: async (materialId) => {
        const response = await api.get(`/study/status/${materialId}`);
        return response.data;
    },
    // List all study materials for user
    listMaterials: async () => {
        const token = await (0, auth_1.getAuthToken)();
        const response = await axios_1.default.get(`${config_1.API_BASE_URL}/study/materials`, {
            headers: {
                Authorization: `Bearer ${token}`,
            },
        });
        return response.data;
    },
    // Get single study material
    getMaterial: async (materialId) => {
        const token = await (0, auth_1.getAuthToken)();
        const response = await axios_1.default.get(`${config_1.API_BASE_URL}/study/materials/${materialId}`, {
            headers: {
                Authorization: `Bearer ${token}`,
            },
        });
        return response.data;
    },
    // Delete study material
    deleteMaterial: async (materialId) => {
        const token = await (0, auth_1.getAuthToken)();
        await axios_1.default.delete(`${config_1.API_BASE_URL}/study/materials/${materialId}`, {
            headers: {
                Authorization: `Bearer ${token}`,
            },
        });
    },
    // Update study material metadata
    updateMaterial: async (materialId, updates) => {
        const response = await api.patch(`/study/materials/${materialId}`, updates);
        return response.data;
    },
    async getUploadUrl(metadata) {
        const token = await (0, auth_1.getAuthToken)();
        const response = await axios_1.default.post(`${config_1.API_BASE_URL}/study/upload-url`, metadata, {
            headers: {
                Authorization: `Bearer ${token}`,
            },
        });
        return response.data;
    },
    async completeUpload(uploadToken) {
        const token = await (0, auth_1.getAuthToken)();
        const response = await axios_1.default.post(`${config_1.API_BASE_URL}/study/complete-upload`, { uploadToken }, {
            headers: {
                Authorization: `Bearer ${token}`,
            },
        });
        return response.data;
    },
    async createQuestionSet(questionSet) {
        const token = await (0, auth_1.getAuthToken)();
        const response = await axios_1.default.post(`${config_1.API_BASE_URL}/study/question-sets`, questionSet, {
            headers: {
                Authorization: `Bearer ${token}`,
            },
        });
        return response.data;
    },
    async getProcessingStatus(materialId) {
        const token = await (0, auth_1.getAuthToken)();
        const response = await axios_1.default.get(`${config_1.API_BASE_URL}/study/materials/${materialId}/status`, {
            headers: {
                Authorization: `Bearer ${token}`,
            },
        });
        return response.data;
    },
    async generateQuestionsFromMaterial(materialId, config) {
        const token = await (0, auth_1.getAuthToken)();
        const response = await axios_1.default.post(`${config_1.API_BASE_URL}/study/materials/${materialId}/generate-questions`, config, {
            headers: {
                Authorization: `Bearer ${token}`,
            },
        });
        return response.data;
    },
    async getGenerationStatus(taskId) {
        const token = await (0, auth_1.getAuthToken)();
        const response = await axios_1.default.get(`${config_1.API_BASE_URL}/study/generation-tasks/${taskId}`, {
            headers: {
                Authorization: `Bearer ${token}`,
            },
        });
        return response.data;
    },
};
