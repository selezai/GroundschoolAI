import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import { StudyMaterial, StudyProgress } from '../types/studyMaterial';
import StudyMaterialService from '../services/studyMaterial/studyMaterialService';

const StudyMaterialScreen: React.FC = () => {
  const navigation = useNavigation();
  const [materials, setMaterials] = useState<StudyMaterial[]>([]);
  const [loading, setLoading] = useState(true);
  const [downloadedMaterials, setDownloadedMaterials] = useState<string[]>([]);
  const studyMaterialService = StudyMaterialService.getInstance();

  useEffect(() => {
    loadMaterials();
    loadDownloadedMaterials();
  }, []);

  const loadMaterials = async () => {
    try {
      const recommendedMaterials = await studyMaterialService.getRecommendedMaterials(
        'general',
        'beginner'
      );
      setMaterials(recommendedMaterials);
    } catch (error) {
      Alert.alert('Error', 'Failed to load study materials');
    } finally {
      setLoading(false);
    }
  };

  const loadDownloadedMaterials = async () => {
    const downloaded = await studyMaterialService.getDownloadedMaterials();
    setDownloadedMaterials(downloaded);
  };

  const handleDownload = async (material: StudyMaterial) => {
    try {
      const success = await studyMaterialService.downloadMaterial(material);
      if (success) {
        await loadDownloadedMaterials();
        Alert.alert('Success', 'Material downloaded successfully');
      } else {
        Alert.alert('Error', 'Failed to download material');
      }
    } catch (error) {
      Alert.alert('Error', 'Failed to download material');
    }
  };

  const renderMaterialItem = ({ item }: { item: StudyMaterial }) => {
    const isDownloaded = downloadedMaterials.includes(item.id);

    return (
      <TouchableOpacity
        style={styles.materialItem}
        onPress={() => navigation.navigate('MaterialViewer', { material: item })}
      >
        <View style={styles.materialContent}>
          <Text style={styles.materialTitle}>{item.title}</Text>
          <Text style={styles.materialDescription}>{item.description}</Text>
          <View style={styles.materialMeta}>
            <Text style={styles.materialDuration}>
              {item.estimatedDuration} min • {item.difficulty}
            </Text>
            <TouchableOpacity
              style={styles.downloadButton}
              onPress={() => handleDownload(item)}
              disabled={isDownloaded}
            >
              <Ionicons
                name={isDownloaded ? 'checkmark-circle' : 'cloud-download'}
                size={24}
                color={isDownloaded ? '#2D9CDB' : '#666'}
              />
            </TouchableOpacity>
          </View>
        </View>
      </TouchableOpacity>
    );
  };

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#2D9CDB" />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <FlatList
        data={materials}
        renderItem={renderMaterialItem}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.listContainer}
        showsVerticalScrollIndicator={false}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F5F5F5',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  listContainer: {
    padding: 16,
  },
  materialItem: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    marginBottom: 16,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  materialContent: {
    padding: 16,
  },
  materialTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#333',
    marginBottom: 8,
  },
  materialDescription: {
    fontSize: 14,
    color: '#666',
    marginBottom: 12,
  },
  materialMeta: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  materialDuration: {
    fontSize: 12,
    color: '#999',
  },
  downloadButton: {
    padding: 8,
  },
});

export default StudyMaterialScreen;
