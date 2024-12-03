import React, { useState } from 'react';
import {
  View,
  StyleSheet,
  TouchableOpacity,
  Text,
  ActivityIndicator,
  TextInput,
  Alert,
} from 'react-native';
import * as DocumentPicker from 'expo-document-picker';
import * as ImagePicker from 'expo-image-picker';
import { MaterialIcons } from '@expo/vector-icons';
import { uploadMaterial } from '../services/api/materialService';
import { useAuth } from '../contexts/AuthContext';

const MaterialUploadScreen = ({ navigation }) => {
  const [uploading, setUploading] = useState(false);
  const [title, setTitle] = useState('');
  const { user } = useAuth();

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
      Alert.alert('Error', 'Failed to pick document');
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
      Alert.alert('Error', 'Failed to pick image');
    }
  };

  const handleUpload = async (uri: string, type: 'pdf' | 'image') => {
    if (!title.trim()) {
      Alert.alert('Error', 'Please enter a title for your material');
      return;
    }

    setUploading(true);
    try {
      const material = await uploadMaterial(uri, type, title, user.id);
      Alert.alert(
        'Success',
        'Material uploaded successfully! You can now access:',
        [
          {
            text: 'Ground School',
            onPress: () => navigation.navigate('GroundSchool', { materialId: material.id }),
          },
          {
            text: 'Question Bank',
            onPress: () => navigation.navigate('QuestionBank', { materialId: material.id }),
          },
          {
            text: 'Instructor AI',
            onPress: () => navigation.navigate('InstructorAI', { materialId: material.id }),
          },
        ]
      );
    } catch (error) {
      console.error('Upload failed:', error);
      Alert.alert('Error', 'Failed to upload material');
    } finally {
      setUploading(false);
    }
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Upload Study Material</Text>
      
      <TextInput
        style={styles.input}
        placeholder="Enter title for your material"
        value={title}
        onChangeText={setTitle}
        editable={!uploading}
      />

      <View style={styles.buttonContainer}>
        <TouchableOpacity
          style={styles.button}
          onPress={pickDocument}
          disabled={uploading}
        >
          <MaterialIcons name="picture-as-pdf" size={24} color="white" />
          <Text style={styles.buttonText}>Upload PDF</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.button}
          onPress={pickImage}
          disabled={uploading}
        >
          <MaterialIcons name="image" size={24} color="white" />
          <Text style={styles.buttonText}>Upload Image</Text>
        </TouchableOpacity>
      </View>

      {uploading && (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#0066cc" />
          <Text style={styles.loadingText}>
            Processing your material...{'\n'}This may take a few moments
          </Text>
        </View>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 20,
    backgroundColor: '#fff',
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 20,
    textAlign: 'center',
  },
  input: {
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 8,
    padding: 12,
    marginBottom: 20,
    fontSize: 16,
  },
  buttonContainer: {
    flexDirection: 'column',
    gap: 16,
  },
  button: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#0066cc',
    padding: 16,
    borderRadius: 8,
    gap: 8,
  },
  buttonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '600',
  },
  loadingContainer: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(255, 255, 255, 0.9)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    marginTop: 16,
    fontSize: 16,
    textAlign: 'center',
    color: '#333',
  },
});

export default MaterialUploadScreen;
