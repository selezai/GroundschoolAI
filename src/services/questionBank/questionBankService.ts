import AsyncStorage from '@react-native-async-storage/async-storage';
import { Question, QuestionSet, UserAnswer, QuestionCategory } from '../../types/question';

class QuestionBankService {
  private static instance: QuestionBankService;
  private readonly STORAGE_KEYS = {
    QUESTIONS: '@questions',
    USER_ANSWERS: '@user_answers',
    QUESTION_SETS: '@question_sets',
  };

  private constructor() {}

  public static getInstance(): QuestionBankService {
    if (!QuestionBankService.instance) {
      QuestionBankService.instance = new QuestionBankService();
    }
    return QuestionBankService.instance;
  }

  // Generate questions from study material
  async generateQuestions(materialId: string, content: string): Promise<Question[]> {
    try {
      // TODO: Implement AI-based question generation
      // This will be integrated with OpenAI or similar service
      return [];
    } catch (error) {
      console.error('Error generating questions:', error);
      throw error;
    }
  }

  // Get questions by category
  async getQuestionsByCategory(category: QuestionCategory): Promise<Question[]> {
    try {
      const questions = await this.getAllQuestions();
      return questions.filter(q => q.category === category);
    } catch (error) {
      console.error('Error getting questions by category:', error);
      throw error;
    }
  }

  // Get all questions
  async getAllQuestions(): Promise<Question[]> {
    try {
      const questionsStr = await AsyncStorage.getItem(this.STORAGE_KEYS.QUESTIONS);
      return questionsStr ? JSON.parse(questionsStr) : [];
    } catch (error) {
      console.error('Error getting all questions:', error);
      throw error;
    }
  }

  // Save user's answer
  async saveUserAnswer(answer: UserAnswer): Promise<void> {
    try {
      const answers = await this.getUserAnswers(answer.questionId);
      const updatedAnswers = [...answers, answer];
      await AsyncStorage.setItem(
        `${this.STORAGE_KEYS.USER_ANSWERS}_${answer.questionId}`,
        JSON.stringify(updatedAnswers)
      );
    } catch (error) {
      console.error('Error saving user answer:', error);
      throw error;
    }
  }

  // Get user's answers for a question
  async getUserAnswers(questionId: string): Promise<UserAnswer[]> {
    try {
      const answersStr = await AsyncStorage.getItem(
        `${this.STORAGE_KEYS.USER_ANSWERS}_${questionId}`
      );
      return answersStr ? JSON.parse(answersStr) : [];
    } catch (error) {
      console.error('Error getting user answers:', error);
      throw error;
    }
  }

  // Create a new question set
  async createQuestionSet(set: QuestionSet): Promise<void> {
    try {
      const sets = await this.getQuestionSets();
      const updatedSets = [...sets, set];
      await AsyncStorage.setItem(
        this.STORAGE_KEYS.QUESTION_SETS,
        JSON.stringify(updatedSets)
      );
    } catch (error) {
      console.error('Error creating question set:', error);
      throw error;
    }
  }

  // Get all question sets
  async getQuestionSets(): Promise<QuestionSet[]> {
    try {
      const setsStr = await AsyncStorage.getItem(this.STORAGE_KEYS.QUESTION_SETS);
      return setsStr ? JSON.parse(setsStr) : [];
    } catch (error) {
      console.error('Error getting question sets:', error);
      throw error;
    }
  }

  // Get user's performance statistics
  async getUserPerformance(userId: string): Promise<{
    totalAnswered: number;
    correctAnswers: number;
    incorrectAnswers: number;
    categoryPerformance: Record<QuestionCategory, number>;
  }> {
    try {
      const questions = await this.getAllQuestions();
      const performance = {
        totalAnswered: 0,
        correctAnswers: 0,
        incorrectAnswers: 0,
        categoryPerformance: {} as Record<QuestionCategory, number>,
      };

      for (const question of questions) {
        const answers = await this.getUserAnswers(question.id);
        if (answers.length > 0) {
          performance.totalAnswered++;
          const lastAnswer = answers[answers.length - 1];
          if (lastAnswer.isCorrect) {
            performance.correctAnswers++;
          } else {
            performance.incorrectAnswers++;
          }

          // Update category performance
          if (!performance.categoryPerformance[question.category]) {
            performance.categoryPerformance[question.category] = 0;
          }
          if (lastAnswer.isCorrect) {
            performance.categoryPerformance[question.category]++;
          }
        }
      }

      return performance;
    } catch (error) {
      console.error('Error getting user performance:', error);
      throw error;
    }
  }

  // Get recommended questions based on user performance
  async getRecommendedQuestions(userId: string): Promise<Question[]> {
    try {
      const performance = await this.getUserPerformance(userId);
      const questions = await this.getAllQuestions();

      // Find categories where performance is lowest
      const categoryPerformance = Object.entries(performance.categoryPerformance)
        .sort(([, a], [, b]) => a - b)
        .map(([category]) => category as QuestionCategory);

      // Prioritize questions from weaker categories
      return questions
        .filter(q => !this.hasAnsweredCorrectly(userId, q.id))
        .sort((a, b) => {
          const aCategoryIndex = categoryPerformance.indexOf(a.category);
          const bCategoryIndex = categoryPerformance.indexOf(b.category);
          return aCategoryIndex - bCategoryIndex;
        })
        .slice(0, 10); // Return top 10 recommended questions
    } catch (error) {
      console.error('Error getting recommended questions:', error);
      throw error;
    }
  }

  // Check if user has answered a question correctly
  private async hasAnsweredCorrectly(userId: string, questionId: string): Promise<boolean> {
    const answers = await this.getUserAnswers(questionId);
    return answers.some(a => a.userId === userId && a.isCorrect);
  }
}
