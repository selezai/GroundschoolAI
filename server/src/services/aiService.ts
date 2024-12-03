import { Anthropic } from '@anthropic-ai/sdk';
import { ChatCompletion } from '@anthropic-ai/sdk/resources';

class AIService {
  private static instance: AIService;
  private anthropic: Anthropic;
  private rateLimitResetTime: number | null = null;

  private constructor() {
    if (!process.env.ANTHROPIC_API_KEY) {
      throw new Error('ANTHROPIC_API_KEY is not set');
    }
    this.anthropic = new Anthropic({
      apiKey: process.env.ANTHROPIC_API_KEY,
    });
  }

  public static getInstance(): AIService {
    if (!AIService.instance) {
      AIService.instance = new AIService();
    }
    return AIService.instance;
  }

  private async handleRateLimit(error: any): Promise<never> {
    if (error.status === 429) {
      const retryAfter = parseInt(error.headers?.['retry-after'] || '3600');
      this.rateLimitResetTime = Date.now() + (retryAfter * 1000);
      throw new Error(`Rate limit exceeded. Please try again in ${Math.ceil(retryAfter / 60)} minutes.`);
    }
    throw error;
  }

  private checkRateLimit() {
    if (this.rateLimitResetTime && Date.now() < this.rateLimitResetTime) {
      const waitMinutes = Math.ceil((this.rateLimitResetTime - Date.now()) / (60 * 1000));
      throw new Error(`Rate limit in effect. Please try again in ${waitMinutes} minutes.`);
    }
  }

  async generateQuestions(content: string, numQuestions: number = 5): Promise<any> {
    try {
      this.checkRateLimit();

      const prompt = `You are an expert aviation instructor. Generate ${numQuestions} multiple-choice questions based on the following aviation content. 
      Format each question with:
      - The question
      - 4 possible answers (A, B, C, D)
      - The correct answer
      - A detailed explanation of why the answer is correct
      
      Content: ${content}`;

      const response = await this.anthropic.messages.create({
        model: 'claude-3-opus-20240229',
        max_tokens: 1500,
        temperature: 0.7,
        messages: [{ role: 'user', content: prompt }]
      });

      return response.content[0].text;
    } catch (error) {
      return this.handleRateLimit(error);
    }
  }

  async explainConcept(concept: string): Promise<string> {
    try {
      this.checkRateLimit();

      const prompt = `You are an expert aviation instructor. Explain the following aviation concept in detail, using clear language and relevant examples:
      
      Concept: ${concept}`;

      const response = await this.anthropic.messages.create({
        model: 'claude-3-opus-20240229',
        max_tokens: 1000,
        temperature: 0.7,
        messages: [{ role: 'user', content: prompt }]
      });

      return response.content[0].text;
    } catch (error) {
      return this.handleRateLimit(error);
    }
  }

  async generateStudyPlan(topics: string[], timeFrame: string): Promise<string> {
    try {
      this.checkRateLimit();

      const prompt = `As an expert aviation instructor, create a detailed study plan for the following aviation topics over ${timeFrame}. 
      Include:
      - Daily breakdown of topics
      - Estimated study time per topic
      - Key concepts to focus on
      - Practice recommendations
      
      Topics: ${topics.join(', ')}`;

      const response = await this.anthropic.messages.create({
        model: 'claude-3-opus-20240229',
        max_tokens: 1500,
        temperature: 0.7,
        messages: [{ role: 'user', content: prompt }]
      });

      return response.content[0].text;
    } catch (error) {
      return this.handleRateLimit(error);
    }
  }

  async analyzePerformance(answers: { question: string; userAnswer: string; correctAnswer: string }[]): Promise<string> {
    try {
      this.checkRateLimit();

      const prompt = `As an expert aviation instructor, analyze the student's performance on these questions. 
      Provide:
      - Areas of strength
      - Areas needing improvement
      - Specific study recommendations
      - Topics to review
      
      Questions and Answers:
      ${answers.map(a => `
        Question: ${a.question}
        User's Answer: ${a.userAnswer}
        Correct Answer: ${a.correctAnswer}
      `).join('\n')}`;

      const response = await this.anthropic.messages.create({
        model: 'claude-3-opus-20240229',
        max_tokens: 1000,
        temperature: 0.7,
        messages: [{ role: 'user', content: prompt }]
      });

      return response.content[0].text;
    } catch (error) {
      return this.handleRateLimit(error);
    }
  }
}

export const aiService = AIService.getInstance();
