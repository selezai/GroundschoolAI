import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  Modal,
  Image,
} from 'react-native';
import Icon from 'react-native-vector-icons/MaterialIcons';
import { StudyMaterial } from '../types/study';
import StudyMaterialDetail from './StudyMaterialDetail';
import Progress from 'react-native-progress';

interface StudyMaterialListProps {
  materials: StudyMaterial[];
  onDeletePress?: (material: StudyMaterial) => void;
}

const StudyMaterialList: React.FC<StudyMaterialListProps> = ({
  materials,
  onDeletePress,
}) => {
  const [selectedMaterial, setSelectedMaterial] = useState<StudyMaterial | null>(null);
  const [processingStatus, setProcessingStatus] = useState<{ [key: string]: any }>({});
  const [processingInterval, setProcessingInterval] = useState<NodeJS.Timeout | null>(null);

  useEffect(() => {
    // Start polling for processing status of pending/processing materials
    const processingMaterials = materials.filter(
      m => m.processingStatus === 'pending' || m.processingStatus === 'processing'
    );

    if (processingMaterials.length > 0) {
      const interval = setInterval(async () => {
        for (const material of processingMaterials) {
          try {
            const response = await studyApi.getProcessingStatus(material._id, material.jobId);
            setProcessingStatus(prev => ({
              ...prev,
              [material._id]: response
            }));

            // Stop polling if all materials are done processing
            if (processingMaterials.every(m => 
              m.processingStatus === 'completed' || 
              m.processingStatus === 'failed'
            )) {
              if (processingInterval) {
                clearInterval(processingInterval);
                setProcessingInterval(null);
              }
            }
          } catch (error) {
            console.error('Error fetching processing status:', error);
          }
        }
      }, 5000); // Poll every 5 seconds

      setProcessingInterval(interval);
      return () => {
        if (interval) {
          clearInterval(interval);
        }
      };
    }
  }, [materials]);

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });
  };

  const formatSize = (bytes: number) => {
    if (bytes === 0) return '0 B';
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return `${parseFloat((bytes / Math.pow(k, i)).toFixed(1))} ${sizes[i]}`;
  };

  const renderItem = ({ item }: { item: StudyMaterial }) => (
    <TouchableOpacity
      style={styles.materialItem}
      onPress={() => setSelectedMaterial(item)}
    >
      <View style={styles.materialIcon}>
        <Icon
          name={item.type === 'pdf' ? 'picture-as-pdf' : 'image'}
          size={24}
          color="#2D9CDB"
        />
      </View>

      <View style={styles.materialInfo}>
        <Text style={styles.materialTitle} numberOfLines={1}>
          {item.title}
        </Text>
        <Text style={styles.materialMeta}>
          {formatDate(item.uploadDate)} • {formatSize(item.size)}
        </Text>
        {(item.processingStatus === 'pending' || item.processingStatus === 'processing') && (
          <View style={styles.processingContainer}>
            <Text style={styles.processingText}>
              {item.processingStatus === 'pending' ? 'Pending...' : 'Processing...'}
            </Text>
            {processingStatus[item._id]?.progress && (
              <Progress.Bar
                progress={processingStatus[item._id].progress}
                width={100}
                color="#2D9CDB"
                style={styles.progressBar}
              />
            )}
          </View>
        )}
        {item.processingStatus === 'failed' && (
          <Text style={styles.errorText}>
            Processing failed: {item.processingError}
          </Text>
        )}
      </View>

      {onDeletePress && (
        <TouchableOpacity
          style={styles.deleteButton}
          onPress={() => onDeletePress(item)}
        >
          <Icon name="delete-outline" size={24} color="#FF3B30" />
        </TouchableOpacity>
      )}
    </TouchableOpacity>
  );

  return (
    <>
      <FlatList
        data={materials}
        renderItem={renderItem}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.listContainer}
        ListEmptyComponent={() => (
          <View style={styles.emptyContainer}>
            <Icon name="upload-file" size={48} color="#CCC" />
            <Text style={styles.emptyText}>
              No study materials yet.{'\n'}Tap the + button to upload.
            </Text>
          </View>
        )}
      />

      <Modal
        visible={selectedMaterial !== null}
        animationType="slide"
        presentationStyle="pageSheet"
      >
        {selectedMaterial && (
          <StudyMaterialDetail
            material={selectedMaterial}
            onClose={() => setSelectedMaterial(null)}
          />
        )}
      </Modal>
    </>
  );
};

const styles = StyleSheet.create({
  listContainer: {
    padding: 16,
    flexGrow: 1,
  },
  materialItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
    backgroundColor: '#fff',
    borderRadius: 12,
    marginBottom: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  materialIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#F6F6F6',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  materialInfo: {
    flex: 1,
  },
  materialTitle: {
    fontSize: 16,
    fontWeight: '500',
    color: '#333',
    marginBottom: 4,
  },
  materialMeta: {
    fontSize: 12,
    color: '#666',
  },
  processingContainer: {
    marginTop: 4,
  },
  processingText: {
    fontSize: 12,
    color: '#2D9CDB',
    marginBottom: 4,
  },
  progressBar: {
    marginTop: 2,
  },
  errorText: {
    fontSize: 12,
    color: '#FF3B30',
    marginTop: 4,
  },
  deleteButton: {
    padding: 8,
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 40,
  },
  emptyText: {
    marginTop: 16,
    fontSize: 16,
    color: '#666',
    textAlign: 'center',
    lineHeight: 24,
  },
});

export default StudyMaterialList;
