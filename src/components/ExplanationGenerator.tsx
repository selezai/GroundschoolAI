import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import AIService from '../services/ai/aiService';
import { useMaterials } from '../hooks/useMaterials';

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
  const [selectedStyle, setSelectedStyle] = useState<'simple' | 'detailed' | 'example-based'>('detailed');
  const { materials } = useMaterials();
  const aiService = AIService.getInstance();

  const generateExplanation = async () => {
    try {
      setIsGenerating(true);

      // Get relevant context from materials
      const relevantMaterials = materials
        .filter(m => m.topics?.includes(topicId))
        .map(m => m.content)
        .join('\n\n');

      const explanation = await aiService.generateExplanation({
        topic: topicId,
        context: relevantMaterials,
        style: selectedStyle,
        previousExplanations: currentContent ? [currentContent] : undefined,
      });

      onNewExplanation(explanation);
    } catch (error) {
      console.error('Error generating explanation:', error);
    } finally {
      setIsGenerating(false);
    }
  };

  const styles = ['simple', 'detailed', 'example-based'] as const;

  return (
    <View style={styleSheet.container}>
      <View style={styleSheet.styleSelector}>
        {styles.map((style) => (
          <TouchableOpacity
            key={style}
            style={[
              styleSheet.styleButton,
              selectedStyle === style && styleSheet.selectedStyle,
            ]}
            onPress={() => setSelectedStyle(style)}
          >
            <Text
              style={[
                styleSheet.styleText,
                selectedStyle === style && styleSheet.selectedStyleText,
              ]}
            >
              {style.charAt(0).toUpperCase() + style.slice(1)}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      <TouchableOpacity
        style={[styleSheet.generateButton, isGenerating && styleSheet.generatingButton]}
        onPress={generateExplanation}
        disabled={isGenerating}
      >
        {isGenerating ? (
          <ActivityIndicator color="#FFFFFF" />
        ) : (
          <>
            <Ionicons name="refresh" size={20} color="#FFFFFF" />
            <Text style={styleSheet.generateButtonText}>
              Regenerate Explanation
            </Text>
          </>
        )}
      </TouchableOpacity>
    </View>
  );
};

const styleSheet = StyleSheet.create({
  container: {
    marginVertical: 16,
  },
  styleSelector: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    marginBottom: 16,
  },
  styleButton: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    backgroundColor: '#F5F5F5',
  },
  selectedStyle: {
    backgroundColor: '#2D9CDB',
  },
  styleText: {
    color: '#666666',
    fontSize: 14,
  },
  selectedStyleText: {
    color: '#FFFFFF',
  },
  generateButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#2D9CDB',
    paddingVertical: 12,
    borderRadius: 8,
    gap: 8,
  },
  generatingButton: {
    backgroundColor: '#90CAF9',
  },
  generateButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '500',
  },
});

export default ExplanationGenerator;
