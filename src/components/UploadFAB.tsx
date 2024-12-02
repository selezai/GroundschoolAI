import React, { useState } from 'react';
import {
  View,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
  Alert,
  Modal,
  Text,
} from 'react-native';
import Icon from 'react-native-vector-icons/MaterialIcons';
import studyService from '../services/study';
import * as Progress from 'react-native-progress';

interface UploadFABProps {
  onUploadComplete: () => void;
}

const UploadFAB: React.FC<UploadFABProps> = ({ onUploadComplete }) => {
  const [isUploading, setIsUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [showOptions, setShowOptions] = useState(false);

  const handleUpload = async (type: 'document' | 'image') => {
    try {
      setShowOptions(false);
      const file = await (type === 'document' 
        ? studyService.pickDocument()
        : studyService.pickImage()
      );

      if (!file) return;

      setIsUploading(true);
      await studyService.uploadStudyMaterial(file, (progress) => {
        setUploadProgress(progress);
      });

      Alert.alert('Success', 'Study material uploaded successfully');
      onUploadComplete();
    } catch (error) {
      Alert.alert('Error', 'Failed to upload study material');
    } finally {
      setIsUploading(false);
      setUploadProgress(0);
    }
  };

  return (
    <>
      <TouchableOpacity
        style={styles.fab}
        onPress={() => setShowOptions(true)}
        disabled={isUploading}
      >
        {isUploading ? (
          <Progress.Circle
            size={30}
            progress={uploadProgress}
            color="#fff"
            borderWidth={2}
          />
        ) : (
          <Icon name="add" size={30} color="#fff" />
        )}
      </TouchableOpacity>

      <Modal
        visible={showOptions}
        transparent
        animationType="fade"
        onRequestClose={() => setShowOptions(false)}
      >
        <TouchableOpacity
          style={styles.modalOverlay}
          activeOpacity={1}
          onPress={() => setShowOptions(false)}
        >
          <View style={styles.optionsContainer}>
            <TouchableOpacity
              style={styles.option}
              onPress={() => handleUpload('document')}
            >
              <Icon name="picture-as-pdf" size={24} color="#2D9CDB" />
              <Text style={styles.optionText}>Upload PDF</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.option}
              onPress={() => handleUpload('image')}
            >
              <Icon name="image" size={24} color="#2D9CDB" />
              <Text style={styles.optionText}>Upload Image</Text>
            </TouchableOpacity>
          </View>
        </TouchableOpacity>
      </Modal>
    </>
  );
};

const styles = StyleSheet.create({
  fab: {
    position: 'absolute',
    bottom: 20,
    right: 20,
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: '#2D9CDB',
    justifyContent: 'center',
    alignItems: 'center',
    elevation: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'flex-end',
  },
  optionsContainer: {
    backgroundColor: '#fff',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    padding: 20,
  },
  option: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 15,
    borderRadius: 10,
    marginBottom: 10,
    backgroundColor: '#F6F6F6',
  },
  optionText: {
    marginLeft: 10,
    fontSize: 16,
    color: '#333',
  },
});

export default UploadFAB;
