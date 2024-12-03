"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const react_native_document_picker_1 = __importDefault(require("react-native-document-picker"));
const react_native_image_picker_1 = require("react-native-image-picker");
const react_native_fs_1 = __importDefault(require("react-native-fs"));
const studyApi_1 = __importDefault(require("./api/studyApi"));
class StudyService {
    constructor() { }
    static getInstance() {
        if (!StudyService.instance) {
            StudyService.instance = new StudyService();
        }
        return StudyService.instance;
    }
    async pickDocument() {
        try {
            const result = await react_native_document_picker_1.default.pick({
                type: [react_native_document_picker_1.default.types.pdf],
            });
            return result[0];
        }
        catch (err) {
            if (!react_native_document_picker_1.default.isCancel(err)) {
                console.error('Error picking document:', err);
            }
            return null;
        }
    }
    async pickImage() {
        try {
            const result = await (0, react_native_image_picker_1.launchImageLibrary)({
                mediaType: 'photo',
                quality: 0.8,
            });
            if (result.assets && result.assets.length > 0) {
                return result.assets[0];
            }
            return null;
        }
        catch (err) {
            console.error('Error picking image:', err);
            return null;
        }
    }
    async uploadStudyMaterial(file, onProgress) {
        try {
            // Get file info
            const fileStats = await react_native_fs_1.default.stat(file.uri);
            // Create upload metadata
            const metadata = {
                title: file.name,
                type: file.type === 'application/pdf' ? 'pdf' : 'image',
                size: parseInt(fileStats.size),
            };
            // Get upload URL and token
            const { uploadUrl, token } = await studyApi_1.default.getUploadUrl(metadata);
            // Upload file
            const response = await react_native_fs_1.default.uploadFiles({
                toUrl: uploadUrl,
                files: [{
                        name: file.name,
                        filename: file.name,
                        filepath: file.uri,
                        type: file.type,
                    }],
                method: 'PUT',
                headers: {
                    'Content-Type': file.type,
                    'Authorization': `Bearer ${token}`,
                },
                progress: (response) => {
                    const progress = response.totalBytesSent / response.totalBytesExpectedToSend;
                    onProgress?.(progress);
                },
            }).promise;
            if (response.statusCode !== 200) {
                throw new Error('Upload failed');
            }
            // Complete upload and get material
            return await studyApi_1.default.completeUpload(token);
        }
        catch (error) {
            console.error('Error uploading study material:', error);
            throw error;
        }
    }
    async listMaterials() {
        return await studyApi_1.default.listMaterials();
    }
    async deleteMaterial(materialId) {
        await studyApi_1.default.deleteMaterial(materialId);
    }
    async getMaterial(materialId) {
        return await studyApi_1.default.getMaterial(materialId);
    }
}
exports.default = StudyService.getInstance();
