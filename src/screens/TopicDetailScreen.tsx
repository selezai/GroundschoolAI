import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  TextInput,
  Alert,
  ActivityIndicator,
} from 'react-native';
import { useRoute, useNavigation } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import { Topic, TopicProgress } from '../services/groundSchool/groundSchoolService';
import GroundSchoolService from '../services/groundSchool/groundSchoolService';
import { useAuth } from '../contexts/AuthContext';

const TopicDetailScreen: React.FC = () => {
  const route = useRoute();
  const navigation = useNavigation();
  const { user } = useAuth();
  const { topicId } = route.params as { topicId: string };

  const [topic, setTopic] = useState<Topic | null>(null);
  const [relatedTopics, setRelatedTopics] = useState<Topic[]>([]);
  const [progress, setProgress] = useState<TopicProgress | null>(null);
  const [note, setNote] = useState('');
  const [simplifiedContent, setSimplifiedContent] = useState<string>('');
  const [isSimplified, setIsSimplified] = useState(false);
  const [loading, setLoading] = useState(true);

  const groundSchoolService = GroundSchoolService.getInstance();

  useEffect(() => {
    loadTopicData();
  }, [topicId]);

  const loadTopicData = async () => {
    try {
      setLoading(true);
      const [topicData, relatedData, progressData] = await Promise.all([
        groundSchoolService.getTopicById(topicId),
        groundSchoolService.getRelatedTopics(topicId),
        user ? groundSchoolService.getUserProgress(user.id) : Promise.resolve([]),
      ]);

      if (topicData) {
        setTopic(topicData);
        setRelatedTopics(relatedData);
        const topicProgress = progressData.find(p => p.topicId === topicId);
        setProgress(topicProgress || null);

        // Update last accessed time
        if (user) {
          await groundSchoolService.updateTopicProgress(user.id, topicId, {
            lastAccessed: Date.now(),
          });
        }
      }
    } catch (error) {
      Alert.alert('Error', 'Failed to load topic details');
    } finally {
      setLoading(false);
    }
  };

  const handleAddNote = async () => {
    if (!user || !note.trim()) return;

    try {
      await groundSchoolService.addNoteToTopic(user.id, topicId, note.trim());
      const updatedProgress = await groundSchoolService.getUserProgress(user.id);
      const topicProgress = updatedProgress.find(p => p.topicId === topicId);
      setProgress(topicProgress || null);
      setNote('');
      Alert.alert('Success', 'Note added successfully');
    } catch (error) {
      Alert.alert('Error', 'Failed to add note');
    }
  };

  const toggleSimplifiedContent = async () => {
    if (!isSimplified && !simplifiedContent && topic) {
      try {
        const simplified = await groundSchoolService.getSimplifiedExplanation(topic.content);
        setSimplifiedContent(simplified);
        setIsSimplified(true);
      } catch (error) {
        Alert.alert('Error', 'Failed to generate simplified explanation');
      }
    } else {
      setIsSimplified(!isSimplified);
    }
  };

  const markAsCompleted = async () => {
    if (!user) return;

    try {
      await groundSchoolService.updateTopicProgress(user.id, topicId, {
        isCompleted: true,
      });
      const updatedProgress = await groundSchoolService.getUserProgress(user.id);
      const topicProgress = updatedProgress.find(p => p.topicId === topicId);
      setProgress(topicProgress || null);
      Alert.alert('Success', 'Topic marked as completed');
    } catch (error) {
      Alert.alert('Error', 'Failed to update progress');
    }
  };

  if (loading || !topic) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#2D9CDB" />
      </View>
    );
  }

  return (
    <ScrollView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>{topic.title}</Text>
        <Text style={styles.category}>{topic.category}</Text>
        {progress?.isCompleted && (
          <View style={styles.completedBadge}>
            <Ionicons name="checkmark-circle" size={20} color="#4CAF50" />
            <Text style={styles.completedText}>Completed</Text>
          </View>
        )}
      </View>

      <View style={styles.contentContainer}>
        <View style={styles.contentHeader}>
          <Text style={styles.contentTitle}>Content</Text>
          <TouchableOpacity
            style={styles.simplifyButton}
            onPress={toggleSimplifiedContent}
          >
            <Ionicons
              name={isSimplified ? 'school' : 'school-outline'}
              size={24}
              color="#2D9CDB"
            />
            <Text style={styles.simplifyText}>
              {isSimplified ? 'Show Original' : 'Simplify'}
            </Text>
          </TouchableOpacity>
        </View>

        <Text style={styles.content}>
          {isSimplified ? simplifiedContent || topic.content : topic.content}
        </Text>

        {!progress?.isCompleted && (
          <TouchableOpacity
            style={styles.completeButton}
            onPress={markAsCompleted}
          >
            <Text style={styles.completeButtonText}>Mark as Completed</Text>
          </TouchableOpacity>
        )}
      </View>

      <View style={styles.notesSection}>
        <Text style={styles.sectionTitle}>Notes</Text>
        <View style={styles.noteInput}>
          <TextInput
            style={styles.input}
            value={note}
            onChangeText={setNote}
            placeholder="Add a note..."
            multiline
          />
          <TouchableOpacity
            style={styles.addNoteButton}
            onPress={handleAddNote}
          >
            <Ionicons name="add-circle" size={24} color="#2D9CDB" />
          </TouchableOpacity>
        </View>
        {progress?.notes.map((note, index) => (
          <View key={index} style={styles.noteItem}>
            <Ionicons name="document-text" size={20} color="#2D9CDB" />
            <Text style={styles.noteText}>{note}</Text>
          </View>
        ))}
      </View>

      {relatedTopics.length > 0 && (
        <View style={styles.relatedTopics}>
          <Text style={styles.sectionTitle}>Related Topics</Text>
          {relatedTopics.map((relatedTopic) => (
            <TouchableOpacity
              key={relatedTopic.id}
              style={styles.relatedTopicItem}
              onPress={() => navigation.push('TopicDetail', { topicId: relatedTopic.id })}
            >
              <Text style={styles.relatedTopicTitle}>{relatedTopic.title}</Text>
              <Ionicons name="chevron-forward" size={20} color="#2D9CDB" />
            </TouchableOpacity>
          ))}
        </View>
      )}
    </ScrollView>
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
    borderBottomColor: '#E5E5E5',
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#333',
  },
  category: {
    fontSize: 16,
    color: '#666',
    marginTop: 4,
  },
  completedBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 8,
  },
  completedText: {
    color: '#4CAF50',
    marginLeft: 4,
  },
  contentContainer: {
    padding: 16,
  },
  contentHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  contentTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
  },
  simplifyButton: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  simplifyText: {
    color: '#2D9CDB',
    marginLeft: 4,
  },
  content: {
    fontSize: 16,
    lineHeight: 24,
    color: '#444',
  },
  completeButton: {
    backgroundColor: '#2D9CDB',
    padding: 12,
    borderRadius: 8,
    marginTop: 16,
    alignItems: 'center',
  },
  completeButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
  },
  notesSection: {
    padding: 16,
    borderTopWidth: 1,
    borderTopColor: '#E5E5E5',
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 12,
  },
  noteInput: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
  },
  input: {
    flex: 1,
    borderWidth: 1,
    borderColor: '#E5E5E5',
    borderRadius: 8,
    padding: 12,
    marginRight: 8,
    minHeight: 48,
  },
  addNoteButton: {
    padding: 8,
  },
  noteItem: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    backgroundColor: '#F5F5F5',
    padding: 12,
    borderRadius: 8,
    marginBottom: 8,
  },
  noteText: {
    flex: 1,
    marginLeft: 8,
    fontSize: 14,
    color: '#444',
  },
  relatedTopics: {
    padding: 16,
    borderTopWidth: 1,
    borderTopColor: '#E5E5E5',
  },
  relatedTopicItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 12,
    backgroundColor: '#F5F5F5',
    borderRadius: 8,
    marginBottom: 8,
  },
  relatedTopicTitle: {
    flex: 1,
    fontSize: 16,
    color: '#333',
    marginRight: 8,
  },
});

export default TopicDetailScreen;
