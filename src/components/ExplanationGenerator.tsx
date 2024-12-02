import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ActivityIndicator,
  Modal,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import groundSchoolService from '../services/api/groundSchoolService';

interface ExplanationGeneratorProps {
  topicId: string;
  currentContent: string;
  onNewExplanation: (explanation: string) => void;
}

const ExplanationGenerator: React.FC<ExplanationGeneratorProps> = ({
  topicId,
  currentContent,
  onNewExplanation,
}) => {
  const [isGenerating, setIsGenerating] = useState(false);
  const [showOptions, setShowOptions] = useState(false);

  const generateExplanation = async (style: 'simple' | 'detailed' | 'example-based') => {
    setIsGenerating(true);
    setShowOptions(false);

    try {
      const context = `Generate a ${style} explanation for this aviation topic. ` +
        `Focus on making it ${style === 'simple' ? 'easy to understand' : 
          style === 'detailed' ? 'comprehensive and technical' : 
          'practical with real-world examples'}`;

      const result = await groundSchoolService.generateExplanation(topicId, context);
      onNewExplanation(result.content);
    } catch (error) {
      console.error('Failed to generate explanation:', error);
    } finally {
      setIsGenerating(false);
    }
  };

  return (
    <View style={styles.container}>
      <TouchableOpacity
        style={styles.mainButton}
        onPress={() => setShowOptions(true)}
        disabled={isGenerating}
      >
        <Ionicons
          name={isGenerating ? 'hourglass' : 'bulb'}
          size={24}
          color="#fff"
        />
        <Text style={styles.buttonText}>
          {isGenerating ? 'Generating...' : 'Generate Explanation'}
        </Text>
        {isGenerating && <ActivityIndicator color="#fff" style={styles.loader} />}
      </TouchableOpacity>

      <Modal
        visible={showOptions}
        transparent
        animationType="slide"
        onRequestClose={() => setShowOptions(false)}
      >
        <View style={styles.modalContainer}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>Choose Explanation Style</Text>
            
            <TouchableOpacity
              style={styles.optionButton}
              onPress={() => generateExplanation('simple')}
            >
              <Ionicons name="school" size={24} color="#2D9CDB" />
              <View style={styles.optionTextContainer}>
                <Text style={styles.optionTitle}>Simple Explanation</Text>
                <Text style={styles.optionDescription}>
                  Basic concepts explained in easy-to-understand terms
                </Text>
              </View>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.optionButton}
              onPress={() => generateExplanation('detailed')}
            >
              <Ionicons name="book" size={24} color="#2D9CDB" />
              <View style={styles.optionTextContainer}>
                <Text style={styles.optionTitle}>Detailed Explanation</Text>
                <Text style={styles.optionDescription}>
                  Comprehensive technical explanation with depth
                </Text>
              </View>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.optionButton}
              onPress={() => generateExplanation('example-based')}
            >
              <Ionicons name="airplane" size={24} color="#2D9CDB" />
              <View style={styles.optionTextContainer}>
                <Text style={styles.optionTitle}>Example-Based</Text>
                <Text style={styles.optionDescription}>
                  Practical examples and real-world applications
                </Text>
              </View>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.cancelButton}
              onPress={() => setShowOptions(false)}
            >
              <Text style={styles.cancelText}>Cancel</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    marginVertical: 10,
  },
  mainButton: {
    backgroundColor: '#2D9CDB',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 12,
    borderRadius: 8,
  },
  buttonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
    marginLeft: 8,
  },
  loader: {
    marginLeft: 8,
  },
  modalContainer: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    backgroundColor: '#fff',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    padding: 20,
    paddingBottom: 40,
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    marginBottom: 20,
    textAlign: 'center',
  },
  optionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    borderRadius: 12,
    backgroundColor: '#f5f5f5',
    marginBottom: 12,
  },
  optionTextContainer: {
    marginLeft: 12,
    flex: 1,
  },
  optionTitle: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 4,
  },
  optionDescription: {
    fontSize: 14,
    color: '#666',
  },
  cancelButton: {
    marginTop: 8,
    padding: 16,
    alignItems: 'center',
  },
  cancelText: {
    color: '#666',
    fontSize: 16,
  },
});

export default ExplanationGenerator;
