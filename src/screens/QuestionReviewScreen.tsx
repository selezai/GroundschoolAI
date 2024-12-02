import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Dimensions,
  ActivityIndicator,
} from 'react-native';
import { useNavigation, useRoute } from '@react-navigation/native';
import Icon from 'react-native-vector-icons/MaterialIcons';
import { Question } from '../types/question';
import { UserAnswer } from '../types/quiz';
import questionApi from '../services/api/questionApi';

const { width } = Dimensions.get('window');

interface ReviewQuestion extends Question {
  userAnswer: UserAnswer;
  explanation: string;
}

const QuestionReviewScreen: React.FC = () => {
  const navigation = useNavigation();
  const route = useRoute();
  const { sessionId } = route.params as { sessionId: string };

  const [loading, setLoading] = useState(true);
  const [questions, setQuestions] = useState<ReviewQuestion[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [showExplanation, setShowExplanation] = useState(false);
  const [filter, setFilter] = useState<'all' | 'incorrect' | 'correct'>('all');

  useEffect(() => {
    loadQuestions();
  }, []);

  const loadQuestions = async () => {
    try {
      setLoading(true);
      const reviewData = await questionApi.getQuizReview(sessionId);
      setQuestions(reviewData.questions);
    } catch (error) {
      console.error('Error loading review:', error);
    } finally {
      setLoading(false);
    }
  };

  const filteredQuestions = questions.filter((q) => {
    if (filter === 'incorrect') return !q.userAnswer.isCorrect;
    if (filter === 'correct') return q.userAnswer.isCorrect;
    return true;
  });

  const currentQuestion = filteredQuestions[currentIndex];

  const handleNext = () => {
    if (currentIndex < filteredQuestions.length - 1) {
      setCurrentIndex(currentIndex + 1);
      setShowExplanation(false);
    }
  };

  const handlePrevious = () => {
    if (currentIndex > 0) {
      setCurrentIndex(currentIndex - 1);
      setShowExplanation(false);
    }
  };

  const renderOption = (option: string, index: number) => {
    const isUserAnswer = currentQuestion.userAnswer.selectedOptionIndex === index;
    const isCorrectAnswer = currentQuestion.correctOptionIndex === index;

    let backgroundColor = '#F6F6F6';
    let borderColor = 'transparent';
    let textColor = '#333';

    if (showExplanation) {
      if (isCorrectAnswer) {
        backgroundColor = '#E8F5E9';
        borderColor = '#4CAF50';
        textColor = '#2E7D32';
      } else if (isUserAnswer && !isCorrectAnswer) {
        backgroundColor = '#FFEBEE';
        borderColor = '#FF3B30';
        textColor = '#C62828';
      }
    }

    return (
      <View
        key={index}
        style={[
          styles.optionContainer,
          {
            backgroundColor,
            borderColor,
            borderWidth: borderColor !== 'transparent' ? 1 : 0,
          },
        ]}
      >
        <Text style={styles.optionLabel}>
          {String.fromCharCode(65 + index)}
        </Text>
        <Text style={[styles.optionText, { color: textColor }]}>
          {option}
        </Text>
        {showExplanation && (
          <Icon
            name={isCorrectAnswer ? 'check-circle' : (isUserAnswer ? 'cancel' : 'radio-button-unchecked')}
            size={24}
            color={isCorrectAnswer ? '#4CAF50' : (isUserAnswer ? '#FF3B30' : '#999')}
            style={styles.optionIcon}
          />
        )}
      </View>
    );
  };

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#2D9CDB" />
        <Text style={styles.loadingText}>Loading review...</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <View style={styles.filterContainer}>
          {(['all', 'incorrect', 'correct'] as const).map((f) => (
            <TouchableOpacity
              key={f}
              style={[styles.filterButton, filter === f && styles.activeFilter]}
              onPress={() => {
                setFilter(f);
                setCurrentIndex(0);
                setShowExplanation(false);
              }}
            >
              <Text
                style={[
                  styles.filterText,
                  filter === f && styles.activeFilterText,
                ]}
              >
                {f.charAt(0).toUpperCase() + f.slice(1)}
              </Text>
            </TouchableOpacity>
          ))}
        </View>
        <Text style={styles.progressText}>
          Question {currentIndex + 1} of {filteredQuestions.length}
        </Text>
      </View>

      {/* Question Content */}
      <ScrollView style={styles.content}>
        <Text style={styles.questionText}>{currentQuestion?.text}</Text>
        
        {currentQuestion?.image && (
          <Image
            source={{ uri: currentQuestion.image }}
            style={styles.questionImage}
            resizeMode="contain"
          />
        )}

        <View style={styles.optionsContainer}>
          {currentQuestion?.options.map((option, index) =>
            renderOption(option, index)
          )}
        </View>

        {showExplanation && (
          <View style={styles.explanationContainer}>
            <Text style={styles.explanationTitle}>Explanation</Text>
            <Text style={styles.explanationText}>
              {currentQuestion.explanation}
            </Text>
            <View style={styles.statsContainer}>
              <View style={styles.statItem}>
                <Icon name="timer" size={20} color="#666" />
                <Text style={styles.statText}>
                  {currentQuestion.userAnswer.timeSpentSeconds}s
                </Text>
              </View>
              <View style={styles.statItem}>
                <Icon
                  name={currentQuestion.userAnswer.isCorrect ? 'check' : 'close'}
                  size={20}
                  color={currentQuestion.userAnswer.isCorrect ? '#4CAF50' : '#FF3B30'}
                />
                <Text
                  style={[
                    styles.statText,
                    {
                      color: currentQuestion.userAnswer.isCorrect
                        ? '#4CAF50'
                        : '#FF3B30',
                    },
                  ]}
                >
                  {currentQuestion.userAnswer.isCorrect ? 'Correct' : 'Incorrect'}
                </Text>
              </View>
            </View>
          </View>
        )}
      </ScrollView>

      {/* Footer */}
      <View style={styles.footer}>
        <TouchableOpacity
          style={[styles.navButton, currentIndex === 0 && styles.disabledButton]}
          onPress={handlePrevious}
          disabled={currentIndex === 0}
        >
          <Icon name="arrow-back" size={24} color="#fff" />
          <Text style={styles.navButtonText}>Previous</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.explanationButton, showExplanation && styles.hideExplanationButton]}
          onPress={() => setShowExplanation(!showExplanation)}
        >
          <Icon
            name={showExplanation ? 'visibility-off' : 'visibility'}
            size={24}
            color={showExplanation ? '#666' : '#2D9CDB'}
          />
          <Text
            style={[
              styles.explanationButtonText,
              showExplanation && styles.hideExplanationButtonText,
            ]}
          >
            {showExplanation ? 'Hide Explanation' : 'Show Explanation'}
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[
            styles.navButton,
            currentIndex === filteredQuestions.length - 1 && styles.disabledButton,
          ]}
          onPress={handleNext}
          disabled={currentIndex === filteredQuestions.length - 1}
        >
          <Text style={styles.navButtonText}>Next</Text>
          <Icon name="arrow-forward" size={24} color="#fff" />
        </TouchableOpacity>
      </View>
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
  header: {
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#E5E5E5',
  },
  filterContainer: {
    flexDirection: 'row',
    marginBottom: 16,
  },
  filterButton: {
    flex: 1,
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 20,
    marginHorizontal: 4,
    backgroundColor: '#F6F6F6',
    alignItems: 'center',
  },
  activeFilter: {
    backgroundColor: '#2D9CDB',
  },
  filterText: {
    color: '#666',
    fontSize: 14,
    fontWeight: '600',
  },
  activeFilterText: {
    color: '#fff',
  },
  progressText: {
    fontSize: 14,
    color: '#666',
    textAlign: 'center',
  },
  content: {
    flex: 1,
    padding: 16,
  },
  questionText: {
    fontSize: 18,
    color: '#333',
    marginBottom: 16,
    lineHeight: 26,
  },
  questionImage: {
    width: width - 32,
    height: 200,
    marginBottom: 16,
    borderRadius: 8,
    backgroundColor: '#F6F6F6',
  },
  optionsContainer: {
    marginTop: 16,
  },
  optionContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    borderRadius: 8,
    marginBottom: 12,
  },
  optionLabel: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: '#fff',
    textAlign: 'center',
    lineHeight: 24,
    marginRight: 12,
    color: '#666',
    fontSize: 14,
    fontWeight: '600',
  },
  optionText: {
    flex: 1,
    fontSize: 16,
  },
  optionIcon: {
    marginLeft: 12,
  },
  explanationContainer: {
    marginTop: 24,
    padding: 16,
    backgroundColor: '#F8F9FA',
    borderRadius: 8,
  },
  explanationTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
    marginBottom: 8,
  },
  explanationText: {
    fontSize: 16,
    color: '#666',
    lineHeight: 24,
  },
  statsContainer: {
    flexDirection: 'row',
    marginTop: 16,
    paddingTop: 16,
    borderTopWidth: 1,
    borderTopColor: '#E5E5E5',
  },
  statItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginRight: 24,
  },
  statText: {
    marginLeft: 8,
    fontSize: 14,
    color: '#666',
  },
  footer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
    borderTopWidth: 1,
    borderTopColor: '#E5E5E5',
  },
  navButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#2D9CDB',
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 8,
  },
  disabledButton: {
    backgroundColor: '#90CAF9',
  },
  navButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
    marginHorizontal: 8,
  },
  explanationButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 8,
    paddingHorizontal: 12,
  },
  hideExplanationButton: {
    backgroundColor: '#F6F6F6',
    borderRadius: 8,
  },
  explanationButtonText: {
    marginLeft: 8,
    fontSize: 14,
    color: '#2D9CDB',
    fontWeight: '600',
  },
  hideExplanationButtonText: {
    color: '#666',
  },
});

export default QuestionReviewScreen;
