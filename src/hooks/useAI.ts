import { useState, useCallback } from 'react';
import AIService, {
  Question,
  ChatMessage,
  ExplanationRequest,
  ProgressUpdate,
} from '../services/ai/aiService';

interface UseAIResult {
  isLoading: boolean;
  error: Error | null;
  questions: Question[];
  chatHistory: ChatMessage[];
  explanation: string | null;
  generateQuestions: (
    topic: string,
    count?: number,
    difficulty?: 'easy' | 'medium' | 'hard'
  ) => Promise<void>;
  generateExplanation: (request: ExplanationRequest) => Promise<void>;
  sendChatMessage: (message: string, context?: string) => Promise<void>;
  updateProgress: (update: ProgressUpdate) => Promise<void>;
  clearError: () => void;
  clearChat: () => void;
}

export function useAI(): UseAIResult {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);
  const [questions, setQuestions] = useState<Question[]>([]);
  const [chatHistory, setChatHistory] = useState<ChatMessage[]>([]);
  const [explanation, setExplanation] = useState<string | null>(null);

  const aiService = AIService.getInstance();

  const clearError = useCallback(() => {
    setError(null);
  }, []);

  const clearChat = useCallback(() => {
    setChatHistory([]);
  }, []);

  const generateQuestions = useCallback(async (
    topic: string,
    count: number = 5,
    difficulty?: 'easy' | 'medium' | 'hard'
  ) => {
    setIsLoading(true);
    setError(null);
    try {
      const generatedQuestions = await aiService.generateQuestions(
        topic,
        count,
        difficulty,
        questions.map(q => q.id)
      );
      setQuestions(prev => [...prev, ...generatedQuestions]);
    } catch (err) {
      setError(err instanceof Error ? err : new Error('Failed to generate questions'));
    } finally {
      setIsLoading(false);
    }
  }, [questions]);

  const generateExplanation = useCallback(async (request: ExplanationRequest) => {
    setIsLoading(true);
    setError(null);
    try {
      const generatedExplanation = await aiService.generateExplanation(request);
      setExplanation(generatedExplanation);
    } catch (err) {
      setError(err instanceof Error ? err : new Error('Failed to generate explanation'));
    } finally {
      setIsLoading(false);
    }
  }, []);

  const sendChatMessage = useCallback(async (message: string, context?: string) => {
    setIsLoading(true);
    setError(null);
    try {
      const userMessage: ChatMessage = {
        role: 'user',
        content: message,
        timestamp: Date.now(),
      };

      setChatHistory(prev => [...prev, userMessage]);

      const response = await aiService.getChatResponse(
        [...chatHistory, userMessage],
        context
      );

      setChatHistory(prev => [...prev, response]);
    } catch (err) {
      setError(err instanceof Error ? err : new Error('Failed to get chat response'));
    } finally {
      setIsLoading(false);
    }
  }, [chatHistory]);

  const updateProgress = useCallback(async (update: ProgressUpdate) => {
    setError(null);
    try {
      await aiService.updateProgress(update);
    } catch (err) {
      setError(err instanceof Error ? err : new Error('Failed to update progress'));
    }
  }, []);

  return {
    isLoading,
    error,
    questions,
    chatHistory,
    explanation,
    generateQuestions,
    generateExplanation,
    sendChatMessage,
    updateProgress,
    clearError,
    clearChat,
  };
}
