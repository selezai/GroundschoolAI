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
import { Question, QuestionCategory } from '../types/question';
import QuestionBankService from '../services/questionBank/questionBankService';
import { useAuth } from '../contexts/AuthContext';
import ProgressChart from '../components/ProgressChart';

const QuestionBankScreen: React.FC = () => {
  const navigation = useNavigation();
  const { user } = useAuth();
  const [questions, setQuestions] = useState<Question[]>([]);
  const [selectedCategory, setSelectedCategory] = useState<QuestionCategory | 'all'>('all');
  const [loading, setLoading] = useState(true);
  const [performance, setPerformance] = useState({
    totalAnswered: 0,
    correctAnswers: 0,
    incorrectAnswers: 0,
    categoryPerformance: {} as Record<QuestionCategory, number>,
  });

  const questionBankService = QuestionBankService.getInstance();

  useEffect(() => {
    loadQuestions();
    loadPerformance();
  }, [selectedCategory]);

  const loadQuestions = async () => {
    try {
      setLoading(true);
      let loadedQuestions: Question[];
      if (selectedCategory === 'all') {
        loadedQuestions = await questionBankService.getAllQuestions();
      } else {
        loadedQuestions = await questionBankService.getQuestionsByCategory(selectedCategory);
      }
      setQuestions(loadedQuestions);
    } catch (error) {
      Alert.alert('Error', 'Failed to load questions');
    } finally {
      setLoading(false);
    }
  };

  const loadPerformance = async () => {
    if (user) {
      const userPerformance = await questionBankService.getUserPerformance(user.id);
      setPerformance(userPerformance);
    }
  };

  const handleCategorySelect = (category: QuestionCategory | 'all') => {
    setSelectedCategory(category);
  };

  const handleQuestionSelect = (question: Question) => {
    navigation.navigate('QuestionDetail', { question });
  };

  const renderCategoryItem = ({ item }: { item: { id: QuestionCategory | 'all'; name: string } }) => (
    <TouchableOpacity
      style={[styles.categoryItem, selectedCategory === item.id && styles.selectedCategory]}
      onPress={() => handleCategorySelect(item.id)}
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
  );

  const renderQuestionItem = ({ item }: { item: Question }) => (
    <TouchableOpacity
      style={styles.questionItem}
      onPress={() => handleQuestionSelect(item)}
    >
      <View style={styles.questionContent}>
        <Text style={styles.questionText}>{item.text}</Text>
        <View style={styles.questionMeta}>
          <Text style={styles.categoryLabel}>{item.category}</Text>
          <Text style={styles.difficultyLabel}>{item.difficulty}</Text>
        </View>
      </View>
      <Ionicons name="chevron-forward" size={24} color="#666" />
    </TouchableOpacity>
  );

  const categories = [
    { id: 'all', name: 'All Topics' },
    { id: 'navigation', name: 'Navigation' },
    { id: 'meteorology', name: 'Meteorology' },
    { id: 'principles_of_flight', name: 'Principles of Flight' },
    { id: 'air_law', name: 'Air Law' },
    { id: 'human_performance', name: 'Human Performance' },
  ];

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#2D9CDB" />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Question Bank</Text>
        <TouchableOpacity
          style={styles.filterButton}
          onPress={() => navigation.navigate('QuestionFilters')}
        >
          <Ionicons name="filter" size={24} color="#2D9CDB" />
        </TouchableOpacity>
      </View>

      <View style={styles.performanceContainer}>
        <ProgressChart
          correct={performance.correctAnswers}
          incorrect={performance.incorrectAnswers}
          total={questions.length}
        />
        <View style={styles.statsContainer}>
          <View style={styles.statItem}>
            <Text style={styles.statValue}>{performance.totalAnswered}</Text>
            <Text style={styles.statLabel}>Answered</Text>
          </View>
          <View style={styles.statItem}>
            <Text style={styles.statValue}>
              {Math.round((performance.correctAnswers / performance.totalAnswered) * 100 || 0)}%
            </Text>
            <Text style={styles.statLabel}>Accuracy</Text>
          </View>
        </View>
      </View>

      <FlatList
        horizontal
        data={categories}
        renderItem={renderCategoryItem}
        keyExtractor={(item) => item.id}
        style={styles.categoryList}
        showsHorizontalScrollIndicator={false}
      />

      <FlatList
        data={questions}
        renderItem={renderQuestionItem}
        keyExtractor={(item) => item.id}
        style={styles.questionList}
        contentContainerStyle={styles.questionListContent}
        showsVerticalScrollIndicator={false}
      />
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
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#EEEEEE',
  },
  title: {
    fontSize: 24,
    fontWeight: '600',
    color: '#333',
  },
  filterButton: {
    padding: 8,
  },
  performanceContainer: {
    padding: 16,
    backgroundColor: '#F5F5F5',
    borderRadius: 12,
    margin: 16,
  },
  statsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    marginTop: 16,
  },
  statItem: {
    alignItems: 'center',
  },
  statValue: {
    fontSize: 24,
    fontWeight: '600',
    color: '#333',
  },
  statLabel: {
    fontSize: 14,
    color: '#666',
    marginTop: 4,
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
  questionList: {
    flex: 1,
  },
  questionListContent: {
    padding: 16,
  },
  questionItem: {
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
  questionContent: {
    flex: 1,
    marginRight: 16,
  },
  questionText: {
    fontSize: 16,
    color: '#333',
    marginBottom: 8,
  },
  questionMeta: {
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
});

export default QuestionBankScreen;
