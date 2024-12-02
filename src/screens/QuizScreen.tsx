import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  ActivityIndicator,
  Alert,
} from 'react-native';
import { RouteProp, useNavigation, useRoute } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import InstructorService from '../services/ai/instructorService';
import APIService from '../services/api/apiService';
import { Topic } from '../services/groundSchool/groundSchoolService';

type QuizScreenRouteProp = RouteProp<{
  Quiz: { topicId: string };
}, 'Quiz'>;

interface QuizQuestion {
  question: string;
  options: string[];
  correctAnswer: number;
  explanation: string;
}

const QuizScreen: React.FC = () => {
  const navigation = useNavigation();
  const route = useRoute<QuizScreenRouteProp>();
  const { topicId } = route.params;

  const [topic, setTopic] = useState<Topic | null>(null);
  const [questions, setQuestions] = useState<QuizQuestion[]>([]);
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [selectedAnswers, setSelectedAnswers] = useState<number[]>([]);
  const [showExplanation, setShowExplanation] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [feedback, setFeedback] = useState<string>('');
  const [quizCompleted, setQuizCompleted] = useState(false);

  useEffect(() => {
    loadQuiz();
  }, []);

  const loadQuiz = async () => {
    try {
      setIsLoading(true);
      
      // Load topic
      const apiService = APIService.getInstance();
      const topicResponse = await apiService.getTopicById(topicId);
      
      if (topicResponse.error || !topicResponse.data) {
        throw new Error(topicResponse.error || 'Failed to load topic');
      }
      
      setTopic(topicResponse.data);

      // Generate quiz questions
      const instructorService = InstructorService.getInstance();
      const quizResponse = await instructorService.generateQuiz(topicResponse.data);
      
      if (quizResponse.error || !quizResponse.questions.length) {
        throw new Error(quizResponse.error || 'Failed to generate quiz');
      }
      
      setQuestions(quizResponse.questions);
      setSelectedAnswers(new Array(quizResponse.questions.length).fill(-1));
    } catch (error: any) {
      Alert.alert('Error', error.message || 'Failed to load quiz');
      navigation.goBack();
    } finally {
      setIsLoading(false);
    }
  };

  const handleAnswerSelect = (answerIndex: number) => {
    if (quizCompleted) return;

    const newAnswers = [...selectedAnswers];
    newAnswers[currentQuestionIndex] = answerIndex;
    setSelectedAnswers(newAnswers);
  };

  const handleNext = async () => {
    if (selectedAnswers[currentQuestionIndex] === -1) {
      Alert.alert('Select an Answer', 'Please select an answer before continuing.');
      return;
    }

    if (currentQuestionIndex < questions.length - 1) {
      setCurrentQuestionIndex(currentQuestionIndex + 1);
      setShowExplanation(false);
    } else if (!quizCompleted) {
      // Quiz completed
      setQuizCompleted(true);
      await generateFeedback();
    }
  };

  const handlePrevious = () => {
    if (currentQuestionIndex > 0) {
      setCurrentQuestionIndex(currentQuestionIndex - 1);
      setShowExplanation(false);
    }
  };

  const generateFeedback = async () => {
    if (!topic) return;

    try {
      setIsLoading(true);
      const instructorService = InstructorService.getInstance();
      const userAnswers = selectedAnswers.map((answer, index) => ({
        questionId: index,
        selectedAnswer: answer,
      }));

      const feedbackText = await instructorService.getPersonalizedFeedback(
        topic,
        userAnswers,
        questions
      );

      setFeedback(feedbackText);
    } catch (error) {
      Alert.alert('Error', 'Failed to generate feedback');
    } finally {
      setIsLoading(false);
    }
  };

  if (isLoading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#2D9CDB" />
      </View>
    );
  }

  if (quizCompleted) {
    return (
      <ScrollView style={styles.container}>
        <View style={styles.feedbackContainer}>
          <Text style={styles.feedbackTitle}>Quiz Complete!</Text>
          <Text style={styles.feedbackScore}>
            Score: {(selectedAnswers.filter((answer, index) => answer === questions[index].correctAnswer).length / questions.length * 100).toFixed(0)}%
          </Text>
          <Text style={styles.feedbackText}>{feedback}</Text>
          <TouchableOpacity
            style={styles.button}
            onPress={() => navigation.goBack()}
          >
            <Text style={styles.buttonText}>Return to Topic</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    );
  }

  const currentQuestion = questions[currentQuestionIndex];

  return (
    <View style={styles.container}>
      <View style={styles.progressBar}>
        <View
          style={[
            styles.progressFill,
            { width: `${((currentQuestionIndex + 1) / questions.length) * 100}%` },
          ]}
        />
      </View>

      <ScrollView style={styles.content}>
        <Text style={styles.questionNumber}>
          Question {currentQuestionIndex + 1} of {questions.length}
        </Text>
        <Text style={styles.question}>{currentQuestion.question}</Text>

        <View style={styles.optionsContainer}>
          {currentQuestion.options.map((option, index) => (
            <TouchableOpacity
              key={index}
              style={[
                styles.optionButton,
                selectedAnswers[currentQuestionIndex] === index &&
                  styles.optionButtonSelected,
                showExplanation &&
                  index === currentQuestion.correctAnswer - 1 &&
                  styles.optionButtonCorrect,
                showExplanation &&
                  selectedAnswers[currentQuestionIndex] === index &&
                  index !== currentQuestion.correctAnswer - 1 &&
                  styles.optionButtonIncorrect,
              ]}
              onPress={() => handleAnswerSelect(index)}
              disabled={showExplanation}
            >
              <Text
                style={[
                  styles.optionText,
                  selectedAnswers[currentQuestionIndex] === index &&
                    styles.optionTextSelected,
                ]}
              >
                {option}
              </Text>
            </TouchableOpacity>
          ))}
        </View>

        {showExplanation && (
          <View style={styles.explanationContainer}>
            <Text style={styles.explanationText}>
              {currentQuestion.explanation}
            </Text>
          </View>
        )}
      </ScrollView>

      <View style={styles.footer}>
        <TouchableOpacity
          style={[styles.navButton, currentQuestionIndex === 0 && styles.navButtonDisabled]}
          onPress={handlePrevious}
          disabled={currentQuestionIndex === 0}
        >
          <Ionicons name="chevron-back" size={24} color="#FFFFFF" />
          <Text style={styles.navButtonText}>Previous</Text>
        </TouchableOpacity>

        {!showExplanation && (
          <TouchableOpacity
            style={[styles.button, selectedAnswers[currentQuestionIndex] === -1 && styles.buttonDisabled]}
            onPress={() => setShowExplanation(true)}
            disabled={selectedAnswers[currentQuestionIndex] === -1}
          >
            <Text style={styles.buttonText}>Check Answer</Text>
          </TouchableOpacity>
        )}

        {showExplanation && (
          <TouchableOpacity
            style={styles.button}
            onPress={handleNext}
          >
            <Text style={styles.buttonText}>
              {currentQuestionIndex === questions.length - 1 ? 'Finish' : 'Next'}
            </Text>
          </TouchableOpacity>
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
  progressBar: {
    height: 4,
    backgroundColor: '#E5E5E5',
    width: '100%',
  },
  progressFill: {
    height: '100%',
    backgroundColor: '#2D9CDB',
  },
  content: {
    flex: 1,
    padding: 20,
  },
  questionNumber: {
    fontSize: 14,
    color: '#666666',
    marginBottom: 8,
  },
  question: {
    fontSize: 18,
    fontWeight: '600',
    color: '#333333',
    marginBottom: 24,
  },
  optionsContainer: {
    marginBottom: 24,
  },
  optionButton: {
    padding: 16,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#E5E5E5',
    marginBottom: 12,
  },
  optionButtonSelected: {
    backgroundColor: '#2D9CDB',
    borderColor: '#2D9CDB',
  },
  optionButtonCorrect: {
    backgroundColor: '#4CAF50',
    borderColor: '#4CAF50',
  },
  optionButtonIncorrect: {
    backgroundColor: '#FF6B6B',
    borderColor: '#FF6B6B',
  },
  optionText: {
    fontSize: 16,
    color: '#333333',
  },
  optionTextSelected: {
    color: '#FFFFFF',
  },
  explanationContainer: {
    padding: 16,
    backgroundColor: '#F5F5F5',
    borderRadius: 8,
    marginBottom: 24,
  },
  explanationText: {
    fontSize: 14,
    color: '#666666',
    lineHeight: 20,
  },
  footer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 20,
    borderTopWidth: 1,
    borderTopColor: '#E5E5E5',
  },
  button: {
    backgroundColor: '#2D9CDB',
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 8,
  },
  buttonDisabled: {
    opacity: 0.5,
  },
  buttonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
  },
  navButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#2D9CDB',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderRadius: 8,
  },
  navButtonDisabled: {
    opacity: 0.5,
  },
  navButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
    marginLeft: 8,
  },
  feedbackContainer: {
    padding: 20,
  },
  feedbackTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#333333',
    marginBottom: 16,
  },
  feedbackScore: {
    fontSize: 48,
    fontWeight: 'bold',
    color: '#2D9CDB',
    marginBottom: 24,
    textAlign: 'center',
  },
  feedbackText: {
    fontSize: 16,
    color: '#666666',
    lineHeight: 24,
    marginBottom: 32,
  },
});

export default QuizScreen;
