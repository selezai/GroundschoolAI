import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { Database } from '../types/database';
import { TopicProgress } from '../services/groundSchool/groundSchoolService';
import { theme } from '../theme';

type Topic = Database['public']['Tables']['topics']['Row'];

interface TopicCardProps {
  topic: Topic;
  progress?: TopicProgress;
  onPress: () => void;
}

export const TopicCard: React.FC<TopicCardProps> = ({ topic, progress, onPress }) => {
  return (
    <TouchableOpacity style={styles.container} onPress={onPress}>
      <View style={styles.content}>
        <Text style={styles.title}>{topic.name}</Text>
        {topic.description && (
          <Text style={styles.description} numberOfLines={2}>
            {topic.description}
          </Text>
        )}
        {progress && (
          <View style={styles.progressContainer}>
            <View style={styles.progressBar}>
              <View 
                style={[
                  styles.progressFill, 
                  { width: `${progress.isCompleted ? 100 : Math.min((progress.timeSpent / 3600) * 100, 100)}%` }
                ]} 
              />
            </View>
            <Text style={styles.progressText}>
              {progress.isCompleted ? 'Completed' : `${Math.round(progress.timeSpent / 60)} mins spent`}
            </Text>
          </View>
        )}
      </View>
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  container: {
    backgroundColor: theme.colors.surface,
    borderRadius: 12,
    marginBottom: 16,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  content: {
    padding: 16,
  },
  title: {
    fontSize: 18,
    fontWeight: '600',
    color: theme.colors.text,
    marginBottom: 8,
  },
  description: {
    fontSize: 14,
    color: theme.colors.textSecondary,
    marginBottom: 12,
  },
  progressContainer: {
    marginTop: 8,
  },
  progressBar: {
    height: 4,
    backgroundColor: theme.colors.border,
    borderRadius: 2,
    overflow: 'hidden',
    marginBottom: 4,
  },
  progressFill: {
    height: '100%',
    backgroundColor: theme.colors.primary,
    borderRadius: 2,
  },
  progressText: {
    fontSize: 12,
    color: theme.colors.textSecondary,
  },
});
