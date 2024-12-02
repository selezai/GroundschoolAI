import questionApi from './api/questionApi';
import {
  Question,
  QuestionSet,
  QuizSession,
  UserStats,
  QuizProgress,
} from '../types/question';

class QuestionService {
  private currentSession: QuizSession | null = null;
  private currentQuestions: Question[] | null = null;
  private currentQuestionIndex: number = 0;
  private timer: NodeJS.Timeout | null = null;
  private timeSpent: number = 0;

  async getQuestionSets(): Promise<QuestionSet[]> {
    return await questionApi.getQuestionSets();
  }

  async getRecommendedSets(): Promise<QuestionSet[]> {
    return await questionApi.getRecommendedSets();
  }

  async startQuiz(setId: string): Promise<{
    session: QuizSession;
    firstQuestion: Question;
  }> {
    // Clear any existing session
    this.clearSession();

    // Start new session
    this.currentSession = await questionApi.startQuizSession(setId);
    this.currentQuestions = await questionApi.getQuestions(setId);
    this.currentQuestionIndex = 0;
    this.timeSpent = 0;

    // Start timer
    this.startTimer();

    return {
      session: this.currentSession,
      firstQuestion: this.currentQuestions[0],
    };
  }

  private startTimer() {
    if (this.timer) {
      clearInterval(this.timer);
    }
    this.timer = setInterval(() => {
      this.timeSpent += 1;
    }, 1000);
  }

  private clearSession() {
    if (this.timer) {
      clearInterval(this.timer);
    }
    this.currentSession = null;
    this.currentQuestions = null;
    this.currentQuestionIndex = 0;
    this.timeSpent = 0;
  }

  async submitAnswer(
    selectedOptionIndex: number
  ): Promise<{
    result: {
      isCorrect: boolean;
      explanation: string;
    };
    nextQuestion?: Question;
    progress: QuizProgress;
  }> {
    if (!this.currentSession || !this.currentQuestions) {
      throw new Error('No active quiz session');
    }

    const currentQuestion = this.currentQuestions[this.currentQuestionIndex];
    const result = await questionApi.submitAnswer(
      this.currentSession.id,
      currentQuestion.id,
      {
        selectedOptionIndex,
        timeSpent: this.timeSpent,
      }
    );

    // Reset timer for next question
    this.timeSpent = 0;

    // Move to next question
    this.currentQuestionIndex++;
    const nextQuestion =
      this.currentQuestionIndex < this.currentQuestions.length
        ? this.currentQuestions[this.currentQuestionIndex]
        : undefined;

    // Calculate progress
    const progress = this.calculateProgress();

    return {
      result,
      nextQuestion,
      progress,
    };
  }

  private calculateProgress(): QuizProgress {
    if (!this.currentSession || !this.currentQuestions) {
      throw new Error('No active quiz session');
    }

    const answers = this.currentSession.answers;
    const totalQuestions = this.currentQuestions.length;
    const answeredQuestions = answers.length;
    const correctAnswers = answers.filter((a) => a.isCorrect).length;

    return {
      totalQuestions,
      answeredQuestions,
      correctAnswers,
      incorrectAnswers: answeredQuestions - correctAnswers,
      score: (correctAnswers / totalQuestions) * 100,
      timeSpent: answers.reduce((total, a) => total + a.timeSpent, 0),
    };
  }

  async completeQuiz(): Promise<{
    session: QuizSession;
    progress: QuizProgress;
  }> {
    if (!this.currentSession) {
      throw new Error('No active quiz session');
    }

    const completedSession = await questionApi.completeQuizSession(
      this.currentSession.id
    );
    const progress = this.calculateProgress();

    // Clear the session
    this.clearSession();

    return {
      session: completedSession,
      progress,
    };
  }

  async getUserStats(): Promise<UserStats> {
    return await questionApi.getUserStats();
  }

  getCurrentQuestion(): Question | null {
    if (!this.currentQuestions) return null;
    return this.currentQuestions[this.currentQuestionIndex];
  }

  getProgress(): QuizProgress | null {
    if (!this.currentSession || !this.currentQuestions) return null;
    return this.calculateProgress();
  }
}

export default new QuestionService();
