import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, FlatList, ActivityIndicator } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { Database } from '../types/database';
import { groundSchoolService } from '../services/groundSchool/groundSchoolService';
import { TopicProgress } from '../services/groundSchool/groundSchoolService';
import { TopicCard } from '../components/TopicCard';
import { useAuth } from '../contexts/AuthContext';
import { theme } from '../theme';

type Topic = Database['public']['Tables']['topics']['Row'];

export const GroundSchoolScreen: React.FC = () => {
  const navigation = useNavigation();
  const { user } = useAuth();
  const [topics, setTopics] = useState<Topic[]>([]);
  const [progress, setProgress] = useState<Record<string, TopicProgress>>({});
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadTopicsAndProgress = async () => {
      try {
        const [topicsData, progressData] = await Promise.all([
          groundSchoolService.getAllTopics(),
          user ? groundSchoolService.getAllProgressForUser(user.id) : [],
        ]);

        setTopics(topicsData);
        
        // Convert progress array to a map for easier lookup
        const progressMap = progressData.reduce((acc, curr) => {
          acc[curr.topicId] = curr;
          return acc;
        }, {} as Record<string, TopicProgress>);
        
        setProgress(progressMap);
      } catch (error) {
        console.error('Error loading topics:', error);
      } finally {
        setLoading(false);
      }
    };

    loadTopicsAndProgress();
  }, [user]);

  const handleTopicPress = (topicId: string) => {
    navigation.navigate('TopicDetail', { topicId });
  };

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={theme.colors.primary} />
      </View>
    );
  }

  if (topics.length === 0) {
    return (
      <View style={styles.container}>
        <Text style={styles.emptyText}>No topics available</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <FlatList
        data={topics}
        keyExtractor={(item) => item.id}
        renderItem={({ item }) => (
          <TopicCard
            topic={item}
            progress={progress[item.id]}
            onPress={() => handleTopicPress(item.id)}
          />
        )}
        contentContainerStyle={styles.listContent}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: theme.colors.background,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  listContent: {
    padding: 16,
  },
  emptyText: {
    fontSize: 16,
    color: theme.colors.text,
    textAlign: 'center',
    marginTop: 20,
  },
});
