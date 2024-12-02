import { Question, SubjectCategory } from '../types/question';
import { QuizSession, UserAnswer, QuizResult, QuizAnalytics } from '../types/quiz';
import questionApi from './api/questionApi';

class QuizService {
  private currentSession: QuizSession | null = null;
  private questionSet: Question[] = [];
  private startTime: Date | null = null;
  private questionStartTime: Date | null = null;

  async startQuiz(questionSetId: string, userId: string): Promise<QuizSession> {
    try {
      // Fetch questions from the API
      this.questionSet = await questionApi.getQuestionSet(questionSetId);
      
      // Initialize new session
      this.startTime = new Date();
      this.questionStartTime = new Date();
      
      this.currentSession = {
        id: Math.random().toString(36).substring(7), // Replace with proper UUID in production
        questionSetId,
        userId,
        startTime: this.startTime,
        currentQuestionIndex: 0,
        answers: [],
        status: 'in-progress',
        timeSpentSeconds: 0,
      };

      return this.currentSession;
    } catch (error) {
      console.error('Error starting quiz:', error);
      throw new Error('Failed to start quiz');
    }
  }

  getCurrentQuestion(): Question | null {
    if (!this.currentSession || !this.questionSet) return null;
    return this.questionSet[this.currentSession.currentQuestionIndex];
  }

  async submitAnswer(optionIndex: number): Promise<void> {
    if (!this.currentSession || !this.questionStartTime) return;

    const currentQuestion = this.getCurrentQuestion();
    if (!currentQuestion) return;

    // Calculate time spent on this question
    const timeSpent = Math.floor(
      (new Date().getTime() - this.questionStartTime.getTime()) / 1000
    );

    // Create answer object
    const answer: UserAnswer = {
      questionId: currentQuestion.id,
      selectedOptionIndex: optionIndex,
      isCorrect: optionIndex === currentQuestion.correctOptionIndex,
      timeSpentSeconds: timeSpent,
    };

    // Add answer to session
    this.currentSession.answers.push(answer);
    
    // Update session
    this.currentSession.currentQuestionIndex++;
    this.currentSession.timeSpentSeconds += timeSpent;
    
    // Reset question timer
    this.questionStartTime = new Date();

    // If this was the last question, complete the quiz
    if (this.currentSession.currentQuestionIndex >= this.questionSet.length) {
      await this.completeQuiz();
    }
  }

  async completeQuiz(): Promise<QuizResult> {
    if (!this.currentSession || !this.startTime) {
      throw new Error('No active quiz session');
    }

    // Mark session as completed
    this.currentSession.status = 'completed';
    this.currentSession.endTime = new Date();

    // Calculate basic statistics
    const totalQuestions = this.questionSet.length;
    const correctAnswers = this.currentSession.answers.filter(
      (a) => a.isCorrect
    ).length;
    const score = (correctAnswers / totalQuestions) * 100;

    // Calculate category performance
    const categoryPerformance: QuizResult['categoryPerformance'] = {};
    this.questionSet.forEach((question, index) => {
      const answer = this.currentSession?.answers[index];
      if (!answer) return;

      if (!categoryPerformance[question.category]) {
        categoryPerformance[question.category] = {
          total: 0,
          correct: 0,
          score: 0,
        };
      }

      categoryPerformance[question.category]!.total++;
      if (answer.isCorrect) {
        categoryPerformance[question.category]!.correct++;
      }
    });

    // Calculate scores for each category
    Object.keys(categoryPerformance).forEach((category) => {
      const perf = categoryPerformance[category as SubjectCategory]!;
      perf.score = (perf.correct / perf.total) * 100;
    });

    // Identify weak areas (categories with score < 75%)
    const weakAreas = Object.entries(categoryPerformance)
      .filter(([_, perf]) => perf.score < 75)
      .map(([category]) => category);

    // Generate result
    const result: QuizResult = {
      sessionId: this.currentSession.id,
      totalQuestions,
      correctAnswers,
      incorrectAnswers: totalQuestions - correctAnswers,
      score,
      timeSpentSeconds: this.currentSession.timeSpentSeconds,
      passingScore: 75, // SACAA requirement
      passed: score >= 75,
      categoryPerformance,
      weakAreas,
      recommendedTopics: await this.generateRecommendations(weakAreas),
    };

    // Save result to backend
    await questionApi.saveQuizResult(result);

    // Clear current session
    this.resetSession();

    return result;
  }

  private async generateRecommendations(weakAreas: string[]): Promise<string[]> {
    // In a real implementation, this would use an AI model to generate
    // personalized recommendations based on performance
    return weakAreas.map((area) => `Review ${area} fundamentals`);
  }

  getAnalytics(): QuizAnalytics {
    if (!this.currentSession) {
      throw new Error('No active quiz session');
    }

    const answers = this.currentSession.answers;
    
    return {
      averageTimePerQuestion:
        answers.reduce((sum, a) => sum + a.timeSpentSeconds, 0) / answers.length,
      quickestAnswer: Math.min(...answers.map((a) => a.timeSpentSeconds)),
      slowestAnswer: Math.max(...answers.map((a) => a.timeSpentSeconds)),
      skippedQuestions: this.questionSet.length - answers.length,
      changedAnswers: 0, // Would need to track answer changes
      confidenceScore: this.calculateConfidenceScore(),
      timeManagementScore: this.calculateTimeManagementScore(),
    };
  }

  private calculateConfidenceScore(): number {
    // Simplified confidence score based on correct answers and time spent
    if (!this.currentSession) return 0;

    const answers = this.currentSession.answers;
    const correctAnswers = answers.filter((a) => a.isCorrect).length;
    const averageTime =
      answers.reduce((sum, a) => sum + a.timeSpentSeconds, 0) / answers.length;

    // Higher score for more correct answers and consistent timing
    return (correctAnswers / answers.length) * 100 * (1 - averageTime / 120);
  }

  private calculateTimeManagementScore(): number {
    // Simplified time management score
    if (!this.currentSession) return 0;

    const answers = this.currentSession.answers;
    const averageTime =
      answers.reduce((sum, a) => sum + a.timeSpentSeconds, 0) / answers.length;
    const timeVariance =
      answers.reduce(
        (sum, a) => sum + Math.pow(a.timeSpentSeconds - averageTime, 2),
        0
      ) / answers.length;

    // Higher score for consistent timing
    return 100 * (1 - Math.min(1, timeVariance / 3600));
  }

  private resetSession(): void {
    this.currentSession = null;
    this.questionSet = [];
    this.startTime = null;
    this.questionStartTime = null;
  }
}

export default new QuizService();
