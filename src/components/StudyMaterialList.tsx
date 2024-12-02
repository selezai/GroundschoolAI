import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  Image,
} from 'react-native';
import Icon from 'react-native-vector-icons/MaterialIcons';
import { StudyMaterial } from '../types/study';

interface StudyMaterialListProps {
  materials: StudyMaterial[];
  onMaterialPress: (material: StudyMaterial) => void;
  onDeletePress?: (material: StudyMaterial) => void;
}

const StudyMaterialList: React.FC<StudyMaterialListProps> = ({
  materials,
  onMaterialPress,
  onDeletePress,
}) => {
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
      onPress={() => onMaterialPress(item)}
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
        {item.processedStatus === 'processing' && (
          <Text style={styles.processingText}>Processing...</Text>
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
  processingText: {
    fontSize: 12,
    color: '#2D9CDB',
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
