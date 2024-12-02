import React, { useState } from 'react';
import { View, StyleSheet, TouchableOpacity, Text, ActivityIndicator } from 'react-native';
import * as DocumentPicker from 'expo-document-picker';
import * as ImagePicker from 'expo-image-picker';
import { MaterialIcons } from '@expo/vector-icons';
import { uploadMaterial } from '../services/api/materialService';

const MaterialUploadScreen = ({ navigation }) => {
  const [uploading, setUploading] = useState(false);

  const pickDocument = async () => {
    try {
      const result = await DocumentPicker.getDocumentAsync({
        type: 'application/pdf',
      });

      if (result.type === 'success') {
        handleUpload(result.uri, 'pdf');
      }
    } catch (err) {
      console.error('Error picking document:', err);
    }
  };

  const pickImage = async () => {
    try {
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: true,
        quality: 1,
      });

      if (!result.canceled) {
        handleUpload(result.assets[0].uri, 'image');
      }
    } catch (err) {
      console.error('Error picking image:', err);
    }
  };

  const handleUpload = async (uri: string, type: 'pdf' | 'image') => {
    setUploading(true);
    try {
      await uploadMaterial(uri, type);
      navigation.navigate('QuestionBank');
    } catch (error) {
      console.error('Upload failed:', error);
    } finally {
      setUploading(false);
    }
  };

  return (
    <View style={styles.container}>
      {uploading ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#0066cc" />
          <Text style={styles.loadingText}>Processing your material...</Text>
        </View>
      ) : (
        <>
          <TouchableOpacity style={styles.uploadButton} onPress={pickDocument}>
            <MaterialIcons name="upload-file" size={32} color="#fff" />
            <Text style={styles.buttonText}>Upload PDF</Text>
          </TouchableOpacity>

          <TouchableOpacity style={styles.uploadButton} onPress={pickImage}>
            <MaterialIcons name="image" size={32} color="#fff" />
            <Text style={styles.buttonText}>Upload Image</Text>
          </TouchableOpacity>
        </>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
    backgroundColor: '#f5f5f5',
  },
  uploadButton: {
    backgroundColor: '#0066cc',
    padding: 20,
    borderRadius: 10,
    width: '80%',
    alignItems: 'center',
    marginVertical: 10,
    flexDirection: 'row',
    justifyContent: 'center',
  },
  buttonText: {
    color: '#fff',
    fontSize: 18,
    marginLeft: 10,
  },
  loadingContainer: {
    alignItems: 'center',
  },
  loadingText: {
    marginTop: 10,
    fontSize: 16,
    color: '#666',
  },
});

export default MaterialUploadScreen;
