import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
  TextInput,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import { Topic } from '../services/groundSchool/groundSchoolService';
import GroundSchoolService from '../services/groundSchool/groundSchoolService';
import { useAuth } from '../contexts/AuthContext';
import ExplanationGenerator from '../components/ExplanationGenerator';
import { useOfflineContent } from '../hooks/useOfflineContent';

const GroundSchoolScreen: React.FC = () => {
  const navigation = useNavigation();
  const { user } = useAuth();
  const {
    data: topics,
    isLoading,
    error,
    isOffline,
    syncStatus,
    forceSync,
  } = useOfflineContent<Topic>('topics');

  const handleRefresh = async () => {
    await forceSync();
  };

  const [recommendedTopics, setRecommendedTopics] = useState<Topic[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [selectedTopic, setSelectedTopic] = useState<Topic | null>(null);
  const [currentExplanation, setCurrentExplanation] = useState<string>('');

  const groundSchoolService = GroundSchoolService.getInstance();

  useEffect(() => {
    loadRecommendedTopics();
  }, [user]);

  const loadRecommendedTopics = async () => {
    try {
      const recommended = await groundSchoolService.getRecommendedTopics(user.id);
      setRecommendedTopics(recommended);
    } catch (error) {
      Alert.alert('Error', 'Failed to load recommended topics');
    }
  };

  const handleTopicSelect = (topic: Topic) => {
    navigation.navigate('TopicDetail', { topic });
  };

  const filterTopics = () => {
    if (!searchQuery) return topics;
    
    const query = searchQuery.toLowerCase();
    return topics.filter(
      topic =>
        topic.title.toLowerCase().includes(query) ||
        topic.description.toLowerCase().includes(query) ||
        topic.tags.some(tag => tag.toLowerCase().includes(query))
    );
  };

  const renderTopicItem = ({ item }: { item: Topic }) => (
    <TouchableOpacity
      style={styles.topicItem}
      onPress={() => handleTopicSelect(item)}
    >
      <View style={styles.topicContent}>
        <Text style={styles.topicTitle}>{item.title}</Text>
        <Text style={styles.topicDescription} numberOfLines={2}>
          {item.description}
        </Text>
        <View style={styles.topicMeta}>
          <Text style={styles.categoryLabel}>{item.category}</Text>
          <Text style={styles.difficultyLabel}>{item.difficulty}</Text>
        </View>
      </View>
      <Ionicons name="chevron-forward" size={24} color="#666" />
    </TouchableOpacity>
  );

  const renderRecommendedSection = () => {
    if (!recommendedTopics.length) return null;

    return (
      <View style={styles.recommendedSection}>
        <Text style={styles.sectionTitle}>Recommended for You</Text>
        <FlatList
          horizontal
          data={recommendedTopics}
          renderItem={({ item }) => (
            <TouchableOpacity
              style={styles.recommendedItem}
              onPress={() => handleTopicSelect(item)}
            >
              <Text style={styles.recommendedTitle}>{item.title}</Text>
              <Text style={styles.recommendedCategory}>{item.category}</Text>
            </TouchableOpacity>
          )}
          keyExtractor={item => item.id}
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.recommendedList}
        />
      </View>
    );
  };

  const categories = [
    { id: 'all', name: 'All Topics' },
    { id: 'navigation', name: 'Navigation' },
    { id: 'meteorology', name: 'Meteorology' },
    { id: 'principles_of_flight', name: 'Principles of Flight' },
    { id: 'air_law', name: 'Air Law' },
    { id: 'human_performance', name: 'Human Performance' },
  ];

  const handleNewExplanation = (explanation: string) => {
    setCurrentExplanation(explanation);
    // You might want to save this to the topic's explanation history
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
      {isOffline && (
        <View style={styles.offlineBanner}>
          <Ionicons name="cloud-offline" size={20} color="#fff" />
          <Text style={styles.offlineText}>Offline Mode</Text>
        </View>
      )}

      {syncStatus.isSyncing && (
        <View style={styles.syncBanner}>
          <ActivityIndicator size="small" color="#fff" />
          <Text style={styles.syncText}>Syncing content...</Text>
        </View>
      )}

      <View style={styles.header}>
        <Text style={styles.title}>Ground School</Text>
      </View>

      <View style={styles.searchContainer}>
        <Ionicons name="search" size={20} color="#666" style={styles.searchIcon} />
        <TextInput
          style={styles.searchInput}
          placeholder="Search topics..."
          value={searchQuery}
          onChangeText={setSearchQuery}
        />
      </View>

      <FlatList
        horizontal
        data={categories}
        renderItem={({ item }) => (
          <TouchableOpacity
            style={[
              styles.categoryItem,
              selectedCategory === item.id && styles.selectedCategory,
            ]}
            onPress={() => setSelectedCategory(item.id)}
          >
            <Text
              style={[
                styles.categoryText,
                selectedCategory === item.id && styles.selectedCategoryText,
              ]}
            >
              {item.name}
            </Text>
          </TouchableOpacity>
        )}
        keyExtractor={item => item.id}
        style={styles.categoryList}
        showsHorizontalScrollIndicator={false}
      />

      {renderRecommendedSection()}

      <FlatList
        data={filterTopics()}
        renderItem={renderTopicItem}
        keyExtractor={item => item.id}
        style={styles.topicList}
        contentContainerStyle={styles.topicListContent}
        showsVerticalScrollIndicator={false}
        refreshing={syncStatus.isSyncing}
        onRefresh={handleRefresh}
      />

      <View style={styles.explanationContainer}>
        {selectedTopic && (
          <>
            <Text style={styles.topicTitle}>{selectedTopic.title}</Text>
            <ExplanationGenerator
              topicId={selectedTopic.id}
              currentContent={currentExplanation}
              onNewExplanation={handleNewExplanation}
            />
            <Text style={styles.explanationText}>
              {currentExplanation || selectedTopic.defaultExplanation}
            </Text>
          </>
        )}
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FFFFFF',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  header: {
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#EEEEEE',
  },
  title: {
    fontSize: 24,
    fontWeight: '600',
    color: '#333',
  },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
    backgroundColor: '#F5F5F5',
    borderRadius: 8,
    margin: 16,
  },
  searchIcon: {
    marginRight: 8,
  },
  searchInput: {
    flex: 1,
    fontSize: 16,
    color: '#333',
  },
  categoryList: {
    maxHeight: 50,
    paddingHorizontal: 16,
  },
  categoryItem: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    backgroundColor: '#F5F5F5',
    marginRight: 8,
  },
  selectedCategory: {
    backgroundColor: '#2D9CDB',
  },
  categoryText: {
    color: '#666',
    fontSize: 14,
  },
  selectedCategoryText: {
    color: '#FFFFFF',
  },
  recommendedSection: {
    marginTop: 16,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#333',
    marginLeft: 16,
    marginBottom: 12,
  },
  recommendedList: {
    paddingHorizontal: 16,
  },
  recommendedItem: {
    width: 200,
    padding: 16,
    backgroundColor: '#F5F5F5',
    borderRadius: 12,
    marginRight: 12,
  },
  recommendedTitle: {
    fontSize: 16,
    fontWeight: '500',
    color: '#333',
    marginBottom: 8,
  },
  recommendedCategory: {
    fontSize: 12,
    color: '#666',
  },
  topicList: {
    flex: 1,
  },
  topicListContent: {
    padding: 16,
  },
  topicItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    marginBottom: 12,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  topicContent: {
    flex: 1,
    marginRight: 16,
  },
  topicTitle: {
    fontSize: 18,
    fontWeight: '500',
    color: '#333',
    marginBottom: 8,
  },
  topicDescription: {
    fontSize: 14,
    color: '#666',
    marginBottom: 12,
  },
  topicMeta: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  categoryLabel: {
    fontSize: 12,
    color: '#666',
    backgroundColor: '#F5F5F5',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
    marginRight: 8,
  },
  difficultyLabel: {
    fontSize: 12,
    color: '#666',
  },
  explanationContainer: {
    padding: 16,
    backgroundColor: '#fff',
    borderRadius: 12,
    marginHorizontal: 16,
    marginVertical: 8,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  explanationText: {
    fontSize: 16,
    lineHeight: 24,
    color: '#333',
    marginTop: 16,
  },
  offlineBanner: {
    backgroundColor: '#FF9800',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 8,
  },
  offlineText: {
    color: '#fff',
    marginLeft: 8,
    fontSize: 14,
    fontWeight: '600',
  },
  syncBanner: {
    backgroundColor: '#2D9CDB',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 8,
  },
  syncText: {
    color: '#fff',
    marginLeft: 8,
    fontSize: 14,
    fontWeight: '600',
  },
});

export default GroundSchoolScreen;
