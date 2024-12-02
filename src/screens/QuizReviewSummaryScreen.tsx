import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  Dimensions,
} from 'react-native';
import { useNavigation, useRoute } from '@react-navigation/native';
import Icon from 'react-native-vector-icons/MaterialIcons';
import { LineChart } from 'react-native-chart-kit';
import questionApi from '../services/api/questionApi';
import { Question } from '../types/question';

const { width } = Dimensions.get('window');

interface ReviewSummary {
  totalQuestions: number;
  correctAnswers: number;
  incorrectAnswers: number;
  averageTime: number;
  byCategory: {
    [key: string]: {
      total: number;
      correct: number;
      incorrect: number;
    };
  };
  timePerQuestion: number[];
}

const QuizReviewSummaryScreen: React.FC = () => {
  const navigation = useNavigation();
  const route = useRoute();
  const { sessionId } = route.params as { sessionId: string };

  const [loading, setLoading] = useState(true);
  const [summary, setSummary] = useState<ReviewSummary | null>(null);
  const [questions, setQuestions] = useState<Question[]>([]);

  useEffect(() => {
    loadReviewData();
  }, []);

  const loadReviewData = async () => {
    try {
      setLoading(true);
      const reviewData = await questionApi.getQuizReview(sessionId);
      setQuestions(reviewData.questions);
      
      // Calculate summary statistics
      const summaryData: ReviewSummary = {
        totalQuestions: reviewData.questions.length,
        correctAnswers: reviewData.questions.filter(q => q.userAnswer.isCorrect).length,
        incorrectAnswers: reviewData.questions.filter(q => !q.userAnswer.isCorrect).length,
        averageTime: reviewData.questions.reduce((acc, q) => acc + q.userAnswer.timeSpentSeconds, 0) / reviewData.questions.length,
        byCategory: {},
        timePerQuestion: reviewData.questions.map(q => q.userAnswer.timeSpentSeconds),
      };

      // Calculate category statistics
      reviewData.questions.forEach(q => {
        if (!summaryData.byCategory[q.category]) {
          summaryData.byCategory[q.category] = {
            total: 0,
            correct: 0,
            incorrect: 0,
          };
        }
        summaryData.byCategory[q.category].total++;
        if (q.userAnswer.isCorrect) {
          summaryData.byCategory[q.category].correct++;
        } else {
          summaryData.byCategory[q.category].incorrect++;
        }
      });

      setSummary(summaryData);
    } catch (error) {
      console.error('Error loading review data:', error);
    } finally {
      setLoading(false);
    }
  };

  const navigateToDetailedReview = () => {
    navigation.navigate('QuestionReview', { sessionId });
  };

  const renderPerformanceChart = () => {
    if (!summary) return null;

    const data = {
      labels: Object.keys(summary.byCategory),
      datasets: [
        {
          data: Object.values(summary.byCategory).map(
            cat => (cat.correct / cat.total) * 100
          ),
          color: (opacity = 1) => `rgba(45, 156, 219, ${opacity})`,
          strokeWidth: 2,
        },
      ],
    };

    return (
      <View style={styles.chartContainer}>
        <Text style={styles.chartTitle}>Performance by Category</Text>
        <LineChart
          data={data}
          width={width - 32}
          height={220}
          chartConfig={{
            backgroundColor: '#ffffff',
            backgroundGradientFrom: '#ffffff',
            backgroundGradientTo: '#ffffff',
            decimalPlaces: 0,
            color: (opacity = 1) => `rgba(45, 156, 219, ${opacity})`,
            labelColor: (opacity = 1) => `rgba(0, 0, 0, ${opacity})`,
            style: {
              borderRadius: 16,
            },
            propsForDots: {
              r: '6',
              strokeWidth: '2',
              stroke: '#2D9CDB',
            },
          }}
          bezier
          style={{
            marginVertical: 8,
            borderRadius: 16,
          }}
          yAxisSuffix="%"
        />
      </View>
    );
  };

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#2D9CDB" />
        <Text style={styles.loadingText}>Loading summary...</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <ScrollView style={styles.content}>
        {/* Overall Performance */}
        <View style={styles.scoreCard}>
          <Text style={styles.scoreTitle}>Overall Performance</Text>
          <View style={styles.scoreRow}>
            <View style={styles.scoreItem}>
              <Text style={styles.scoreValue}>
                {((summary?.correctAnswers || 0) / (summary?.totalQuestions || 1) * 100).toFixed(1)}%
              </Text>
              <Text style={styles.scoreLabel}>Score</Text>
            </View>
            <View style={styles.scoreItem}>
              <Text style={styles.scoreValue}>
                {summary?.averageTime.toFixed(1)}s
              </Text>
              <Text style={styles.scoreLabel}>Avg. Time</Text>
            </View>
          </View>
        </View>

        {/* Answer Distribution */}
        <View style={styles.distributionCard}>
          <Text style={styles.cardTitle}>Answer Distribution</Text>
          <View style={styles.distributionRow}>
            <View style={[styles.distributionItem, styles.correctItem]}>
              <Icon name="check-circle" size={24} color="#4CAF50" />
              <Text style={styles.distributionValue}>{summary?.correctAnswers}</Text>
              <Text style={styles.distributionLabel}>Correct</Text>
            </View>
            <View style={[styles.distributionItem, styles.incorrectItem]}>
              <Icon name="cancel" size={24} color="#FF3B30" />
              <Text style={styles.distributionValue}>{summary?.incorrectAnswers}</Text>
              <Text style={styles.distributionLabel}>Incorrect</Text>
            </View>
          </View>
        </View>

        {/* Performance Chart */}
        {renderPerformanceChart()}

        {/* Category Breakdown */}
        <View style={styles.categoriesCard}>
          <Text style={styles.cardTitle}>Category Breakdown</Text>
          {summary && Object.entries(summary.byCategory).map(([category, stats]) => (
            <View key={category} style={styles.categoryItem}>
              <Text style={styles.categoryName}>{category}</Text>
              <View style={styles.categoryStats}>
                <Text style={styles.categoryScore}>
                  {((stats.correct / stats.total) * 100).toFixed(1)}%
                </Text>
                <Text style={styles.categoryCount}>
                  ({stats.correct}/{stats.total})
                </Text>
              </View>
            </View>
          ))}
        </View>
      </ScrollView>

      {/* Review Button */}
      <TouchableOpacity
        style={styles.reviewButton}
        onPress={navigateToDetailedReview}
      >
        <Icon name="rate-review" size={24} color="#fff" />
        <Text style={styles.reviewButtonText}>Review Questions</Text>
      </TouchableOpacity>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    marginTop: 16,
    fontSize: 16,
    color: '#666',
  },
  content: {
    flex: 1,
    padding: 16,
  },
  scoreCard: {
    backgroundColor: '#F8F9FA',
    borderRadius: 16,
    padding: 16,
    marginBottom: 16,
  },
  scoreTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#333',
    marginBottom: 16,
  },
  scoreRow: {
    flexDirection: 'row',
    justifyContent: 'space-around',
  },
  scoreItem: {
    alignItems: 'center',
  },
  scoreValue: {
    fontSize: 24,
    fontWeight: '700',
    color: '#2D9CDB',
  },
  scoreLabel: {
    fontSize: 14,
    color: '#666',
    marginTop: 4,
  },
  distributionCard: {
    backgroundColor: '#F8F9FA',
    borderRadius: 16,
    padding: 16,
    marginBottom: 16,
  },
  cardTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#333',
    marginBottom: 16,
  },
  distributionRow: {
    flexDirection: 'row',
    justifyContent: 'space-around',
  },
  distributionItem: {
    alignItems: 'center',
    flex: 1,
    padding: 16,
    borderRadius: 8,
  },
  correctItem: {
    backgroundColor: '#E8F5E9',
    marginRight: 8,
  },
  incorrectItem: {
    backgroundColor: '#FFEBEE',
    marginLeft: 8,
  },
  distributionValue: {
    fontSize: 20,
    fontWeight: '700',
    marginVertical: 8,
  },
  distributionLabel: {
    fontSize: 14,
    color: '#666',
  },
  chartContainer: {
    backgroundColor: '#F8F9FA',
    borderRadius: 16,
    padding: 16,
    marginBottom: 16,
  },
  chartTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#333',
    marginBottom: 8,
  },
  categoriesCard: {
    backgroundColor: '#F8F9FA',
    borderRadius: 16,
    padding: 16,
    marginBottom: 16,
  },
  categoryItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#E5E5E5',
  },
  categoryName: {
    fontSize: 16,
    color: '#333',
    flex: 1,
  },
  categoryStats: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  categoryScore: {
    fontSize: 16,
    fontWeight: '600',
    color: '#2D9CDB',
    marginRight: 8,
  },
  categoryCount: {
    fontSize: 14,
    color: '#666',
  },
  reviewButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#2D9CDB',
    padding: 16,
    margin: 16,
    borderRadius: 8,
  },
  reviewButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
    marginLeft: 8,
  },
});

export default QuizReviewSummaryScreen;
