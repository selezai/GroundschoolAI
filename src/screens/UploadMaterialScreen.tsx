import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
  ScrollView,
} from 'react-native';
import * as DocumentPicker from 'expo-document-picker';
import * as FileSystem from 'expo-file-system';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import MaterialProcessingService from '../services/material/materialProcessingService';
import { useAuth } from '../hooks/useAuth';

interface UploadedFile {
  uri: string;
  name: string;
  size: number;
  type: string;
}

const UploadMaterialScreen: React.FC = () => {
  const [uploadedFiles, setUploadedFiles] = useState<UploadedFile[]>([]);
  const [isUploading, setIsUploading] = useState(false);
  const navigation = useNavigation();
  const { user } = useAuth();

  const handleFilePick = async () => {
    try {
      const result = await DocumentPicker.getDocumentAsync({
        type: ['application/pdf', 'image/*'],
        multiple: true,
      });

      if (!result.canceled && result.assets.length > 0) {
        const newFiles = result.assets.map(asset => ({
          uri: asset.uri,
          name: asset.name,
          size: asset.size || 0,
          type: asset.mimeType || '',
        }));

        setUploadedFiles(prev => [...prev, ...newFiles]);
      }
    } catch (error) {
      console.error('Error picking file:', error);
      Alert.alert('Error', 'Failed to select file. Please try again.');
    }
  };

  const handleUpload = async () => {
    if (uploadedFiles.length === 0) {
      Alert.alert('No Files', 'Please select files to upload first.');
      return;
    }

    setIsUploading(true);

    try {
      const processingService = MaterialProcessingService.getInstance();

      for (const file of uploadedFiles) {
        const base64 = await FileSystem.readAsStringAsync(file.uri, {
          encoding: FileSystem.EncodingType.Base64,
        });

        await processingService.processStudyMaterial({
          userId: user.id,
          fileName: file.name,
          fileType: file.type,
          content: base64,
        });
      }

      Alert.alert(
        'Success',
        'Your study materials have been uploaded and processed successfully!',
        [
          {
            text: 'OK',
            onPress: () => navigation.goBack(),
          },
        ]
      );
    } catch (error) {
      console.error('Error uploading files:', error);
      Alert.alert(
        'Upload Failed',
        'There was an error uploading your files. Please try again.'
      );
    } finally {
      setIsUploading(false);
    }
  };

  const removeFile = (index: number) => {
    setUploadedFiles(prev => prev.filter((_, i) => i !== index));
  };

  const formatFileSize = (bytes: number): string => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Upload Study Materials</Text>
        <Text style={styles.subtitle}>
          Upload PDFs or images of your study materials
        </Text>
      </View>

      <ScrollView style={styles.fileList}>
        {uploadedFiles.map((file, index) => (
          <View key={index} style={styles.fileItem}>
            <View style={styles.fileInfo}>
              <Ionicons
                name={file.type.includes('pdf') ? 'document' : 'image'}
                size={24}
                color="#2D9CDB"
              />
              <View style={styles.fileDetails}>
                <Text style={styles.fileName} numberOfLines={1}>
                  {file.name}
                </Text>
                <Text style={styles.fileSize}>{formatFileSize(file.size)}</Text>
              </View>
            </View>
            <TouchableOpacity
              onPress={() => removeFile(index)}
              style={styles.removeButton}
            >
              <Ionicons name="close-circle" size={24} color="#FF6B6B" />
            </TouchableOpacity>
          </View>
        ))}
      </ScrollView>

      <View style={styles.footer}>
        <TouchableOpacity
          style={styles.selectButton}
          onPress={handleFilePick}
          disabled={isUploading}
        >
          <Ionicons name="add" size={24} color="#2D9CDB" />
          <Text style={styles.selectButtonText}>Select Files</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[
            styles.uploadButton,
            (isUploading || uploadedFiles.length === 0) && styles.uploadButtonDisabled,
          ]}
          onPress={handleUpload}
          disabled={isUploading || uploadedFiles.length === 0}
        >
          {isUploading ? (
            <ActivityIndicator color="#FFFFFF" />
          ) : (
            <>
              <Ionicons name="cloud-upload" size={24} color="#FFFFFF" />
              <Text style={styles.uploadButtonText}>Upload</Text>
            </>
          )}
        </TouchableOpacity>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FFFFFF',
  },
  header: {
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#E5E5E5',
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#333333',
    marginBottom: 4,
  },
  subtitle: {
    fontSize: 14,
    color: '#666666',
  },
  fileList: {
    flex: 1,
    padding: 16,
  },
  fileItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 12,
    backgroundColor: '#F5F5F5',
    borderRadius: 8,
    marginBottom: 8,
  },
  fileInfo: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
  },
  fileDetails: {
    flex: 1,
    marginLeft: 12,
  },
  fileName: {
    fontSize: 16,
    color: '#333333',
    marginBottom: 2,
  },
  fileSize: {
    fontSize: 12,
    color: '#666666',
  },
  removeButton: {
    padding: 4,
  },
  footer: {
    padding: 16,
    borderTopWidth: 1,
    borderTopColor: '#E5E5E5',
  },
  selectButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 12,
    borderWidth: 2,
    borderColor: '#2D9CDB',
    borderRadius: 8,
    marginBottom: 12,
  },
  selectButtonText: {
    marginLeft: 8,
    fontSize: 16,
    color: '#2D9CDB',
    fontWeight: '600',
  },
  uploadButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 12,
    backgroundColor: '#2D9CDB',
    borderRadius: 8,
  },
  uploadButtonDisabled: {
    opacity: 0.5,
  },
  uploadButtonText: {
    marginLeft: 8,
    fontSize: 16,
    color: '#FFFFFF',
    fontWeight: '600',
  },
});

export default UploadMaterialScreen;
