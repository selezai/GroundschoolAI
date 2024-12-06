import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
} from 'react-native';
import { WebView } from 'react-native-webview';
import Icon from 'react-native-vector-icons/MaterialIcons';
import * as Progress from 'react-native-progress';
import { StudyMaterial } from '../types/study';
import studyApi from '../services/api/studyApi';
import { API_BASE_URL } from '../config';
import { getAuthToken } from '../services/auth';

interface StudyMaterialDetailProps {
  material: StudyMaterial;
  onClose: () => void;
}

const StudyMaterialDetail: React.FC<StudyMaterialDetailProps> = ({
  material,
  onClose,
}) => {
  const [activeTab, setActiveTab] = useState<'content' | 'questions'>('content');
  const [isLoading, setIsLoading] = useState(false);
  const [questions, setQuestions] = useState<any[]>([]);
  const [selectedQuestion, setSelectedQuestion] = useState<number | null>(null);
  const [generatingQuestions, setGeneratingQuestions] = useState(false);

  useEffect(() => {
    if (material.questions?.length) {
      setQuestions(material.questions);
    }
  }, [material]);

  const handleGenerateQuestions = async () => {
    try {
      setGeneratingQuestions(true);
      const questions = await studyApi.generateQuestions(material._id, {
        count: 10,
        difficulty: 'medium',
      });
      setQuestions(questions);
    } catch (error) {
      Alert.alert('Error', 'Failed to generate questions');
    } finally {
      setGeneratingQuestions(false);
    }
  };

  const renderContent = () => (
    <WebView
      source={{
        uri: `${API_BASE_URL}/study/materials/${material._id}/content`,
        headers: {
          Authorization: `Bearer ${getAuthToken()}`,
        },
      }}
      style={styles.webview}
      onError={() => Alert.alert('Error', 'Failed to load document')}
    />
  );

  const renderQuestions = () => (
    <ScrollView style={styles.questionsContainer}>
      {questions.length === 0 ? (
        <View style={styles.noQuestionsContainer}>
          <Text style={styles.noQuestionsText}>
            No questions generated yet.
          </Text>
          <TouchableOpacity
            style={styles.generateButton}
            onPress={handleGenerateQuestions}
            disabled={generatingQuestions}
          >
            {generatingQuestions ? (
              <ActivityIndicator color="#fff" />
            ) : (
              <Text style={styles.generateButtonText}>Generate Questions</Text>
            )}
          </TouchableOpacity>
        </View>
      ) : (
        questions.map((q, index) => (
          <TouchableOpacity
            key={index}
            style={[
              styles.questionCard,
              selectedQuestion === index && styles.selectedQuestionCard,
            ]}
            onPress={() => setSelectedQuestion(index)}
          >
            <Text style={styles.questionText}>{q.question}</Text>
            {selectedQuestion === index && (
              <View style={styles.optionsContainer}>
                {q.options.map((option: string, optIndex: number) => (
                  <TouchableOpacity
                    key={optIndex}
                    style={[
                      styles.optionButton,
                      option === q.correctAnswer && styles.correctOption,
                    ]}
                  >
                    <Text style={styles.optionText}>{option}</Text>
                  </TouchableOpacity>
                ))}
                <Text style={styles.explanationText}>{q.explanation}</Text>
              </View>
            )}
          </TouchableOpacity>
        ))
      )}
    </ScrollView>
  );

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={onClose} style={styles.closeButton}>
          <Icon name="close" size={24} color="#333" />
        </TouchableOpacity>
        <Text style={styles.title}>{material.title}</Text>
      </View>

      <View style={styles.tabContainer}>
        <TouchableOpacity
          style={[styles.tab, activeTab === 'content' && styles.activeTab]}
          onPress={() => setActiveTab('content')}
        >
          <Text style={styles.tabText}>Content</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.tab, activeTab === 'questions' && styles.activeTab]}
          onPress={() => setActiveTab('questions')}
        >
          <Text style={styles.tabText}>Questions</Text>
        </TouchableOpacity>
      </View>

      {activeTab === 'content' ? renderContent() : renderQuestions()}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
  },
  closeButton: {
    padding: 8,
  },
  title: {
    fontSize: 18,
    fontWeight: '600',
    marginLeft: 16,
    flex: 1,
  },
  tabContainer: {
    flexDirection: 'row',
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
  },
  tab: {
    flex: 1,
    paddingVertical: 12,
    alignItems: 'center',
  },
  activeTab: {
    borderBottomWidth: 2,
    borderBottomColor: '#2D9CDB',
  },
  tabText: {
    fontSize: 16,
    color: '#333',
  },
  webview: {
    flex: 1,
  },
  questionsContainer: {
    flex: 1,
    padding: 16,
  },
  noQuestionsContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 32,
  },
  noQuestionsText: {
    fontSize: 16,
    color: '#666',
    marginBottom: 16,
  },
  generateButton: {
    backgroundColor: '#2D9CDB',
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 8,
  },
  generateButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  questionCard: {
    backgroundColor: '#f8f9fa',
    padding: 16,
    borderRadius: 8,
    marginBottom: 12,
  },
  selectedQuestionCard: {
    backgroundColor: '#e3f2fd',
  },
  questionText: {
    fontSize: 16,
    fontWeight: '500',
    marginBottom: 12,
  },
  optionsContainer: {
    marginTop: 8,
  },
  optionButton: {
    padding: 12,
    borderRadius: 6,
    backgroundColor: '#fff',
    marginBottom: 8,
  },
  correctOption: {
    backgroundColor: '#e0f2f1',
  },
  optionText: {
    fontSize: 14,
  },
  explanationText: {
    marginTop: 12,
    fontSize: 14,
    color: '#666',
    fontStyle: 'italic',
  },
});

export default StudyMaterialDetail;
