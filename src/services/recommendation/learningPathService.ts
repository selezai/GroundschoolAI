import { Question, QuestionSet, UserStats } from '../../types/question';
import questionApi from '../api/questionApi';
import AsyncStorage from '@react-native-async-storage/async-storage';

interface LearningPath {
  id: string;
  title: string;
  description: string;
  difficulty: 'beginner' | 'intermediate' | 'advanced';
  categories: string[];
  estimatedDuration: number; // in minutes
  questionSets: string[];
  prerequisites?: string[];
}

interface UserPerformance {
  categoryScores: {
    [category: string]: {
      correct: number;
      total: number;
      averageTime: number;
    };
  };
  recentMistakes: {
    category: string;
    questionId: string;
    timestamp: number;
  }[];
  completedPaths: string[];
}

const STORAGE_KEYS = {
  USER_PERFORMANCE: '@user_performance',
};

class LearningPathService {
  private static instance: LearningPathService;
  private userPerformance: UserPerformance | null = null;

  private constructor() {}

  static getInstance(): LearningPathService {
    if (!LearningPathService.instance) {
      LearningPathService.instance = new LearningPathService();
    }
    return LearningPathService.instance;
  }

  async initializeUserPerformance(): Promise<void> {
    try {
      const storedPerformance = await AsyncStorage.getItem(STORAGE_KEYS.USER_PERFORMANCE);
      this.userPerformance = storedPerformance
        ? JSON.parse(storedPerformance)
        : {
            categoryScores: {},
            recentMistakes: [],
            completedPaths: [],
          };
    } catch (error) {
      console.error('Error initializing user performance:', error);
      this.userPerformance = {
        categoryScores: {},
        recentMistakes: [],
        completedPaths: [],
      };
    }
  }

  async updatePerformance(questions: Question[], answers: { questionId: string; isCorrect: boolean; timeSpent: number }[]): Promise<void> {
    if (!this.userPerformance) {
      await this.initializeUserPerformance();
    }

    const timestamp = Date.now();

    // Update category scores and track mistakes
    questions.forEach((question, index) => {
      const answer = answers[index];
      const category = question.category;

      // Initialize category if not exists
      if (!this.userPerformance!.categoryScores[category]) {
        this.userPerformance!.categoryScores[category] = {
          correct: 0,
          total: 0,
          averageTime: 0,
        };
      }

      const categoryStats = this.userPerformance!.categoryScores[category];
      categoryStats.total++;
      if (answer.isCorrect) {
        categoryStats.correct++;
      } else {
        // Track recent mistakes
        this.userPerformance!.recentMistakes.push({
          category,
          questionId: question.id,
          timestamp,
        });
      }

      // Update average time
      categoryStats.averageTime = (
        (categoryStats.averageTime * (categoryStats.total - 1) + answer.timeSpent) /
        categoryStats.total
      );
    });

    // Keep only recent mistakes (last 30 days)
    const thirtyDaysAgo = timestamp - 30 * 24 * 60 * 60 * 1000;
    this.userPerformance!.recentMistakes = this.userPerformance!.recentMistakes.filter(
      mistake => mistake.timestamp >= thirtyDaysAgo
    );

    // Save updated performance
    await this.savePerformance();
  }

  private async savePerformance(): Promise<void> {
    try {
      await AsyncStorage.setItem(
        STORAGE_KEYS.USER_PERFORMANCE,
        JSON.stringify(this.userPerformance)
      );
    } catch (error) {
      console.error('Error saving user performance:', error);
    }
  }

  async generateRecommendedPath(): Promise<LearningPath> {
    if (!this.userPerformance) {
      await this.initializeUserPerformance();
    }

    // Get user stats and question sets
    const [userStats, allSets] = await Promise.all([
      questionApi.getUserStats(),
      questionApi.getQuestionSets(),
    ]);

    // Determine weak categories
    const weakCategories = Object.entries(this.userPerformance!.categoryScores)
      .filter(([_, stats]) => stats.correct / stats.total < 0.7)
      .map(([category]) => category)
      .sort((a, b) => {
        const scoreA = this.userPerformance!.categoryScores[a].correct / this.userPerformance!.categoryScores[a].total;
        const scoreB = this.userPerformance!.categoryScores[b].correct / this.userPerformance!.categoryScores[b].total;
        return scoreA - scoreB;
      });

    // Determine user level based on overall performance
    const overallScore = userStats.overallScore || 0;
    const difficulty: LearningPath['difficulty'] =
      overallScore < 0.6 ? 'beginner' :
      overallScore < 0.8 ? 'intermediate' : 'advanced';

    // Find relevant question sets
    const recommendedSets = allSets
      .filter(set => {
        // Match difficulty level
        if (set.difficulty !== difficulty) return false;
        
        // Prioritize sets covering weak categories
        return set.categories.some(category => weakCategories.includes(category));
      })
      .sort((a, b) => {
        // Sort by relevance to weak categories
        const aRelevance = a.categories.filter(cat => weakCategories.includes(cat)).length;
        const bRelevance = b.categories.filter(cat => weakCategories.includes(cat)).length;
        return bRelevance - aRelevance;
      })
      .slice(0, 3); // Take top 3 most relevant sets

    // Generate learning path
    const learningPath: LearningPath = {
      id: `path_${Date.now()}`,
      title: `${difficulty.charAt(0).toUpperCase() + difficulty.slice(1)} Enhancement Path`,
      description: `Focused practice on ${weakCategories.slice(0, 2).join(', ')} with comprehensive coverage of essential topics.`,
      difficulty,
      categories: weakCategories,
      estimatedDuration: recommendedSets.reduce((acc, set) => acc + set.estimatedDuration, 0),
      questionSets: recommendedSets.map(set => set.id),
    };

    return learningPath;
  }

  async getWeakestTopics(): Promise<string[]> {
    if (!this.userPerformance) {
      await this.initializeUserPerformance();
    }

    return Object.entries(this.userPerformance!.categoryScores)
      .sort(([, a], [, b]) => (a.correct / a.total) - (b.correct / b.total))
      .slice(0, 3)
      .map(([category]) => category);
  }

  async markPathCompleted(pathId: string): Promise<void> {
    if (!this.userPerformance) {
      await this.initializeUserPerformance();
    }

    this.userPerformance!.completedPaths.push(pathId);
    await this.savePerformance();
  }
}

export default LearningPathService.getInstance();
