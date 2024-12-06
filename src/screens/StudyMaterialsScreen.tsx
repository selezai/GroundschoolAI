import React, { useState, useEffect } from 'react';
import {
  View,
  StyleSheet,
  TouchableOpacity,
  Alert,
  ActivityIndicator,
} from 'react-native';
import Icon from 'react-native-vector-icons/MaterialIcons';
import { StudyMaterial } from '../types/study';
import StudyMaterialList from '../components/StudyMaterialList';
import studyApi from '../services/api/studyApi';
import StudyService from '../services/study';

const StudyMaterialsScreen: React.FC = () => {
  const [materials, setMaterials] = useState<StudyMaterial[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isUploading, setIsUploading] = useState(false);

  useEffect(() => {
    loadMaterials();
  }, []);

  const loadMaterials = async () => {
    try {
      const response = await studyApi.listMaterials();
      setMaterials(response);
    } catch (error) {
      Alert.alert('Error', 'Failed to load study materials');
    } finally {
      setIsLoading(false);
    }
  };

  const handleUpload = async () => {
    try {
      setIsUploading(true);
      
      // Let user pick a document
      const document = await StudyService.getInstance().pickDocument();
      if (!document) {
        setIsUploading(false);
        return;
      }

      // Get upload URL and create study material record
      const { uploadUrl, token } = await studyApi.getUploadUrl({
        title: document.name,
        type: document.type || 'application/pdf',
        size: document.size,
      });

      // Upload file to storage
      await studyApi.uploadFile(uploadUrl, document);

      // Complete upload and process the material
      const material = await studyApi.completeUpload(token);
      setMaterials((prev) => [...prev, material]);

      Alert.alert(
        'Success',
        'Study material uploaded successfully! We are now processing it to generate questions.'
      );
    } catch (error) {
      Alert.alert('Error', 'Failed to upload study material');
    } finally {
      setIsUploading(false);
    }
  };

  const handleDelete = async (material: StudyMaterial) => {
    Alert.alert(
      'Delete Material',
      'Are you sure you want to delete this study material?',
      [
        {
          text: 'Cancel',
          style: 'cancel',
        },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            try {
              await studyApi.deleteMaterial(material._id);
              setMaterials((prev) =>
                prev.filter((m) => m._id !== material._id)
              );
            } catch (error) {
              Alert.alert('Error', 'Failed to delete study material');
            }
          },
        },
      ]
    );
  };

  if (isLoading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#2D9CDB" />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <StudyMaterialList
        materials={materials}
        onDeletePress={handleDelete}
      />

      <TouchableOpacity
        style={[styles.uploadButton, isUploading && styles.uploadButtonDisabled]}
        onPress={handleUpload}
        disabled={isUploading}
      >
        {isUploading ? (
          <ActivityIndicator color="#fff" />
        ) : (
          <Icon name="add" size={24} color="#fff" />
        )}
      </TouchableOpacity>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F6F6F6',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  uploadButton: {
    position: 'absolute',
    right: 16,
    bottom: 16,
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: '#2D9CDB',
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
    elevation: 5,
  },
  uploadButtonDisabled: {
    backgroundColor: '#A5D8F3',
  },
});

export default StudyMaterialsScreen;
