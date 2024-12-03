import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, ScrollView, ActivityIndicator } from 'react-native';
import { RouteProp, useRoute } from '@react-navigation/native';
import { Database } from '../types/database';
import { groundSchoolService } from '../services/groundSchool/groundSchoolService';
import { TopicProgress } from '../services/groundSchool/groundSchoolService';
import { Button } from '../components/Button';
import { useAuth } from '../contexts/AuthContext';
import { theme } from '../theme';

type Topic = Database['public']['Tables']['topics']['Row'];

type RootStackParamList = {
  TopicDetail: { topicId: string };
};

type TopicDetailScreenRouteProp = RouteProp<RootStackParamList, 'TopicDetail'>;

export const TopicDetailScreen: React.FC = () => {
  const route = useRoute<TopicDetailScreenRouteProp>();
  const { user } = useAuth();
  const [topic, setTopic] = useState<Topic | null>(null);
  const [progress, setProgress] = useState<TopicProgress | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadTopicAndProgress = async () => {
      try {
        const [topicData, progressData] = await Promise.all([
          groundSchoolService.getTopicById(route.params.topicId),
          user ? groundSchoolService.getTopicProgress(user.id, route.params.topicId) : null
        ]);

        setTopic(topicData);
        setProgress(progressData);
      } catch (error) {
        console.error('Error loading topic:', error);
      } finally {
        setLoading(false);
      }
    };

    loadTopicAndProgress();
  }, [route.params.topicId, user]);

  const handleStartStudy = async () => {
    if (!user || !topic) return;

    try {
      await groundSchoolService.updateTopicProgress({
        topicId: topic.id,
        userId: user.id,
        isCompleted: false,
        lastAccessed: Date.now(),
        timeSpent: 0,
        notes: [],
      });

      // Navigate to study screen or update UI
    } catch (error) {
      console.error('Error starting study:', error);
    }
  };

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={theme.colors.primary} />
      </View>
    );
  }

  if (!topic) {
    return (
      <View style={styles.container}>
        <Text style={styles.errorText}>Topic not found</Text>
      </View>
    );
  }

  return (
    <ScrollView style={styles.container}>
      <View style={styles.content}>
        <Text style={styles.title}>{topic.name}</Text>
        {topic.description && (
          <Text style={styles.description}>{topic.description}</Text>
        )}
        
        {progress && (
          <View style={styles.progressContainer}>
            <Text style={styles.progressTitle}>Your Progress</Text>
            <Text>Time Spent: {Math.round(progress.timeSpent / 60)} minutes</Text>
            <Text>Status: {progress.isCompleted ? 'Completed' : 'In Progress'}</Text>
          </View>
        )}

        <Button
          title={progress ? 'Continue Learning' : 'Start Learning'}
          onPress={handleStartStudy}
          style={styles.button}
        />
      </View>
    </ScrollView>
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
  content: {
    padding: 20,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: theme.colors.text,
    marginBottom: 10,
  },
  description: {
    fontSize: 16,
    color: theme.colors.text,
    marginBottom: 20,
  },
  progressContainer: {
    backgroundColor: theme.colors.surface,
    padding: 15,
    borderRadius: 8,
    marginBottom: 20,
  },
  progressTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 10,
  },
  button: {
    marginTop: 20,
  },
  errorText: {
    fontSize: 16,
    color: theme.colors.error,
    textAlign: 'center',
    marginTop: 20,
  },
});
