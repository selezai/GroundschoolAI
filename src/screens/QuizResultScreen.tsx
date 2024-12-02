import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Dimensions,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import Icon from 'react-native-vector-icons/MaterialIcons';
import { LineChart } from 'react-native-chart-kit';
import { QuizResult, QuizAnalytics } from '../types/quiz';
import quizService from '../services/quiz';

const { width } = Dimensions.get('window');

const QuizResultScreen: React.FC = () => {
  const navigation = useNavigation();
  const [result, setResult] = useState<QuizResult | null>(null);
  const [analytics, setAnalytics] = useState<QuizAnalytics | null>(null);

  useEffect(() => {
    const loadResults = async () => {
      try {
        const quizResult = await quizService.completeQuiz();
        setResult(quizResult);
        setAnalytics(quizService.getAnalytics());
      } catch (error) {
        console.error('Error loading quiz results:', error);
      }
    };

    loadResults();
  }, []);

  const renderPerformanceChart = () => {
    if (!result) return null;

    const categoryData = Object.entries(result.categoryPerformance).map(
      ([category, performance]) => ({
        category,
        score: performance.score,
      })
    );

    const data = {
      labels: categoryData.map((item) => item.category),
      datasets: [
        {
          data: categoryData.map((item) => item.score),
        },
      ],
    };

    return (
      <View style={styles.chartContainer}>
        <Text style={styles.sectionTitle}>Performance by Category</Text>
        <LineChart
          data={data}
          width={width - 32}
          height={220}
          chartConfig={{
            backgroundColor: '#fff',
            backgroundGradientFrom: '#fff',
            backgroundGradientTo: '#fff',
            decimalPlaces: 0,
            color: (opacity = 1) => `rgba(45, 156, 219, ${opacity})`,
            style: {
              borderRadius: 16,
            },
          }}
          bezier
          style={styles.chart}
        />
      </View>
    );
  };

  const renderAnalytics = () => {
    if (!analytics) return null;

    return (
      <View style={styles.analyticsContainer}>
        <Text style={styles.sectionTitle}>Quiz Analytics</Text>
        <View style={styles.analyticsGrid}>
          <View style={styles.analyticsItem}>
            <Icon name="timer" size={24} color="#2D9CDB" />
            <Text style={styles.analyticsLabel}>Average Time</Text>
            <Text style={styles.analyticsValue}>
              {Math.round(analytics.averageTimePerQuestion)}s
            </Text>
          </View>
          <View style={styles.analyticsItem}>
            <Icon name="skip-next" size={24} color="#2D9CDB" />
            <Text style={styles.analyticsLabel}>Skipped</Text>
            <Text style={styles.analyticsValue}>
              {analytics.skippedQuestions}
            </Text>
          </View>
          <View style={styles.analyticsItem}>
            <Icon name="trending-up" size={24} color="#2D9CDB" />
            <Text style={styles.analyticsLabel}>Confidence</Text>
            <Text style={styles.analyticsValue}>
              {Math.round(analytics.confidenceScore)}%
            </Text>
          </View>
          <View style={styles.analyticsItem}>
            <Icon name="schedule" size={24} color="#2D9CDB" />
            <Text style={styles.analyticsLabel}>Time Management</Text>
            <Text style={styles.analyticsValue}>
              {Math.round(analytics.timeManagementScore)}%
            </Text>
          </View>
        </View>
      </View>
    );
  };

  const renderRecommendations = () => {
    if (!result) return null;

    return (
      <View style={styles.recommendationsContainer}>
        <Text style={styles.sectionTitle}>Recommendations</Text>
        {result.recommendedTopics.map((topic, index) => (
          <View key={index} style={styles.recommendationItem}>
            <Icon name="lightbulb" size={24} color="#2D9CDB" />
            <Text style={styles.recommendationText}>{topic}</Text>
          </View>
        ))}
      </View>
    );
  };

  if (!result || !analytics) {
    return (
      <View style={styles.loadingContainer}>
        <Text>Loading results...</Text>
      </View>
    );
  }

  return (
    <ScrollView style={styles.container}>
      {/* Score Overview */}
      <View style={styles.scoreContainer}>
        <View
          style={[
            styles.scoreCircle,
            { borderColor: result.passed ? '#4CAF50' : '#FF3B30' },
          ]}
        >
          <Text style={styles.scoreText}>{Math.round(result.score)}%</Text>
          <Text style={styles.scoreLabel}>
            {result.passed ? 'PASSED' : 'FAILED'}
          </Text>
        </View>
        <View style={styles.statsContainer}>
          <View style={styles.statItem}>
            <Text style={styles.statValue}>{result.correctAnswers}</Text>
            <Text style={styles.statLabel}>Correct</Text>
          </View>
          <View style={styles.statItem}>
            <Text style={styles.statValue}>{result.incorrectAnswers}</Text>
            <Text style={styles.statLabel}>Incorrect</Text>
          </View>
          <View style={styles.statItem}>
            <Text style={styles.statValue}>
              {Math.round(result.timeSpentSeconds / 60)}m
            </Text>
            <Text style={styles.statLabel}>Time</Text>
          </View>
        </View>
      </View>

      {renderPerformanceChart()}
      {renderAnalytics()}
      {renderRecommendations()}

      {/* Actions */}
      <View style={styles.actionsContainer}>
        <TouchableOpacity
          style={styles.actionButton}
          onPress={() => navigation.navigate('QuestionReview')}
        >
          <Icon name="list" size={24} color="#fff" />
          <Text style={styles.actionButtonText}>Review Questions</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.actionButton, styles.secondaryButton]}
          onPress={() => navigation.navigate('Home')}
        >
          <Icon name="home" size={24} color="#2D9CDB" />
          <Text style={[styles.actionButtonText, styles.secondaryButtonText]}>
            Back to Home
          </Text>
        </TouchableOpacity>
      </View>
    </ScrollView>
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
  scoreContainer: {
    padding: 24,
    alignItems: 'center',
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#E5E5E5',
  },
  scoreCircle: {
    width: 120,
    height: 120,
    borderRadius: 60,
    borderWidth: 4,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 24,
  },
  scoreText: {
    fontSize: 32,
    fontWeight: '700',
    color: '#333',
  },
  scoreLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: '#666',
    marginTop: 4,
  },
  statsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    width: '100%',
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
  chartContainer: {
    padding: 16,
    backgroundColor: '#fff',
    marginBottom: 16,
  },
  chart: {
    marginVertical: 8,
    borderRadius: 16,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#333',
    marginBottom: 16,
  },
  analyticsContainer: {
    padding: 16,
    backgroundColor: '#fff',
    marginBottom: 16,
  },
  analyticsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
  },
  analyticsItem: {
    width: '48%',
    backgroundColor: '#F6F6F6',
    padding: 16,
    borderRadius: 8,
    marginBottom: 16,
    alignItems: 'center',
  },
  analyticsLabel: {
    fontSize: 14,
    color: '#666',
    marginTop: 8,
    marginBottom: 4,
  },
  analyticsValue: {
    fontSize: 18,
    fontWeight: '600',
    color: '#333',
  },
  recommendationsContainer: {
    padding: 16,
    backgroundColor: '#fff',
    marginBottom: 16,
  },
  recommendationItem: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F6F6F6',
    padding: 16,
    borderRadius: 8,
    marginBottom: 8,
  },
  recommendationText: {
    marginLeft: 12,
    fontSize: 16,
    color: '#333',
    flex: 1,
  },
  actionsContainer: {
    padding: 16,
    backgroundColor: '#fff',
  },
  actionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#2D9CDB',
    padding: 16,
    borderRadius: 8,
    marginBottom: 8,
  },
  secondaryButton: {
    backgroundColor: '#fff',
    borderWidth: 1,
    borderColor: '#2D9CDB',
  },
  actionButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
    marginLeft: 8,
  },
  secondaryButtonText: {
    color: '#2D9CDB',
  },
});

export default QuizResultScreen;
