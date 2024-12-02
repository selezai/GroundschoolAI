import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  RefreshControl,
} from 'react-native';
import Icon from 'react-native-vector-icons/MaterialIcons';
import { QuestionSet } from '../types/question';

interface QuestionSetListProps {
  sets: QuestionSet[];
  onSetPress: (set: QuestionSet) => void;
  refreshing?: boolean;
  onRefresh?: () => void;
  recommended?: boolean;
}

const QuestionSetList: React.FC<QuestionSetListProps> = ({
  sets,
  onSetPress,
  refreshing = false,
  onRefresh,
  recommended = false,
}) => {
  const renderItem = ({ item }: { item: QuestionSet }) => (
    <TouchableOpacity
      style={styles.setItem}
      onPress={() => onSetPress(item)}
      activeOpacity={0.7}
    >
      <View style={styles.setContent}>
        <View style={styles.setHeader}>
          <Text style={styles.setTitle}>{item.title}</Text>
          {recommended && (
            <View style={styles.recommendedBadge}>
              <Icon name="star" size={12} color="#FFD700" />
              <Text style={styles.recommendedText}>Recommended</Text>
            </View>
          )}
        </View>

        <Text style={styles.setDescription} numberOfLines={2}>
          {item.description}
        </Text>

        <View style={styles.setMeta}>
          <View style={styles.metaItem}>
            <Icon name="help-outline" size={16} color="#666" />
            <Text style={styles.metaText}>
              {item.totalQuestions} Questions
            </Text>
          </View>

          {item.completedBy !== undefined && (
            <View style={styles.metaItem}>
              <Icon name="people-outline" size={16} color="#666" />
              <Text style={styles.metaText}>
                {item.completedBy} Completed
              </Text>
            </View>
          )}

          {item.averageScore !== undefined && (
            <View style={styles.metaItem}>
              <Icon name="analytics" size={16} color="#666" />
              <Text style={styles.metaText}>
                {Math.round(item.averageScore)}% Avg
              </Text>
            </View>
          )}
        </View>
      </View>

      <Icon name="chevron-right" size={24} color="#CCC" />
    </TouchableOpacity>
  );

  return (
    <FlatList
      data={sets}
      renderItem={renderItem}
      keyExtractor={(item) => item.id}
      contentContainerStyle={styles.listContainer}
      refreshControl={
        onRefresh ? (
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        ) : undefined
      }
      ListEmptyComponent={() => (
        <View style={styles.emptyContainer}>
          <Icon name="school" size={48} color="#CCC" />
          <Text style={styles.emptyText}>
            No question sets available.{'\n'}Check back later for updates.
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
  setItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    backgroundColor: '#fff',
    borderRadius: 12,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  setContent: {
    flex: 1,
    marginRight: 12,
  },
  setHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  setTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#333',
    flex: 1,
  },
  recommendedBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFF9E6',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
    marginLeft: 8,
  },
  recommendedText: {
    fontSize: 12,
    color: '#FFB100',
    marginLeft: 4,
  },
  setDescription: {
    fontSize: 14,
    color: '#666',
    marginBottom: 12,
    lineHeight: 20,
  },
  setMeta: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  metaItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginRight: 16,
  },
  metaText: {
    fontSize: 12,
    color: '#666',
    marginLeft: 4,
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

export default QuestionSetList;
