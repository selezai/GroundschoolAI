import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Alert,
} from 'react-native';
import { useRoute, useNavigation } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import { Question } from '../types/question';
import QuestionBankService from '../services/questionBank/questionBankService';
import { useAuth } from '../contexts/AuthContext';

const QuestionDetailScreen: React.FC = () => {
  const route = useRoute();
  const navigation = useNavigation();
  const { question } = route.params as { question: Question };
  const { user } = useAuth();
  const [selectedAnswer, setSelectedAnswer] = useState<string | null>(null);
  const [isAnswered, setIsAnswered] = useState(false);
  const questionBankService = QuestionBankService.getInstance();

  const handleAnswerSelect = async (answerId: string) => {
    if (isAnswered) return;

    setSelectedAnswer(answerId);
    setIsAnswered(true);

    const isCorrect = answerId === question.correctAnswer;

    try {
      await questionBankService.saveUserAnswer({
        id: Date.now().toString(),
        userId: user?.id || '',
        questionId: question.id,
        answerId,
        isCorrect,
        timestamp: Date.now(),
      });

      setTimeout(() => {
        if (isCorrect) {
          Alert.alert(
            'Correct!',
            'Well done! Would you like to see the explanation?',
            [
              {
                text: 'Next Question',
                onPress: () => navigation.goBack(),
              },
              {
                text: 'See Explanation',
                onPress: () => {},
                style: 'default',
              },
            ]
          );
        } else {
          Alert.alert(
            'Incorrect',
            'Would you like to see the explanation?',
            [
              {
                text: 'Try Again',
                onPress: () => {
                  setSelectedAnswer(null);
                  setIsAnswered(false);
                },
              },
              {
                text: 'See Explanation',
                onPress: () => {},
                style: 'default',
              },
            ]
          );
        }
      }, 500);
    } catch (error) {
      Alert.alert('Error', 'Failed to save answer');
    }
  };

  const renderAnswer = (answerId: string, answerText: string) => {
    const isSelected = selectedAnswer === answerId;
    const isCorrect = isAnswered && answerId === question.correctAnswer;
    const isIncorrect = isAnswered && isSelected && answerId !== question.correctAnswer;

    return (
      <TouchableOpacity
        key={answerId}
        style={[
          styles.answerItem,
          isSelected && styles.selectedAnswer,
          isCorrect && styles.correctAnswer,
          isIncorrect && styles.incorrectAnswer,
        ]}
        onPress={() => handleAnswerSelect(answerId)}
        disabled={isAnswered}
      >
        <Text
          style={[
            styles.answerText,
            isSelected && styles.selectedAnswerText,
            (isCorrect || isIncorrect) && styles.answeredText,
          ]}
        >
          {answerText}
        </Text>
        {isAnswered && (isCorrect || isIncorrect) && (
          <Ionicons
            name={isCorrect ? 'checkmark-circle' : 'close-circle'}
            size={24}
            color={isCorrect ? '#4CAF50' : '#F44336'}
            style={styles.answerIcon}
          />
        )}
      </TouchableOpacity>
    );
  };

  return (
    <ScrollView style={styles.container}>
      <View style={styles.questionContainer}>
        <Text style={styles.questionText}>{question.text}</Text>
        <View style={styles.questionMeta}>
          <Text style={styles.categoryLabel}>{question.category}</Text>
          <Text style={styles.difficultyLabel}>{question.difficulty}</Text>
        </View>
      </View>

      <View style={styles.answersContainer}>
        {Object.entries(question.answers).map(([id, text]) =>
          renderAnswer(id, text)
        )}
      </View>

      {isAnswered && (
        <View style={styles.explanationContainer}>
          <Text style={styles.explanationTitle}>Explanation</Text>
          <Text style={styles.explanationText}>{question.explanation}</Text>
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
  questionContainer: {
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#EEEEEE',
  },
  questionText: {
    fontSize: 18,
    color: '#333',
    lineHeight: 26,
    marginBottom: 16,
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
  answersContainer: {
    padding: 16,
  },
  answerItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    backgroundColor: '#F5F5F5',
    borderRadius: 12,
    marginBottom: 12,
  },
  selectedAnswer: {
    backgroundColor: '#2D9CDB',
  },
  correctAnswer: {
    backgroundColor: '#E8F5E9',
  },
  incorrectAnswer: {
    backgroundColor: '#FFEBEE',
  },
  answerText: {
    flex: 1,
    fontSize: 16,
    color: '#333',
  },
  selectedAnswerText: {
    color: '#FFFFFF',
  },
  answeredText: {
    fontWeight: '500',
  },
  answerIcon: {
    marginLeft: 12,
  },
  explanationContainer: {
    padding: 16,
    backgroundColor: '#F5F5F5',
    margin: 16,
    borderRadius: 12,
  },
  explanationTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#333',
    marginBottom: 8,
  },
  explanationText: {
    fontSize: 16,
    color: '#666',
    lineHeight: 24,
  },
});

export default QuestionDetailScreen;
