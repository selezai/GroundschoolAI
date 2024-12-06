import { Anthropic } from '@anthropic-ai/sdk';

class AIService {
  private static instance: AIService;
  private anthropic: Anthropic | null = null;
  private rateLimitResetTime: number | null = null;

  private constructor() {
    if (process.env.ANTHROPIC_API_KEY) {
      this.anthropic = new Anthropic({
        apiKey: process.env.ANTHROPIC_API_KEY,
      });
    }
  }

  public static getInstance(): AIService {
    if (!AIService.instance) {
      AIService.instance = new AIService();
    }
    return AIService.instance;
  }

  private checkAnthropicAvailability() {
    if (!this.anthropic) {
      throw new Error('AI service is not configured. ANTHROPIC_API_KEY is missing.');
    }
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

  async generateResponse(prompt: string): Promise<string> {
    // Return a mock response if Anthropic is not configured
    if (!this.anthropic) {
      return "AI service is not configured. This is a mock response.";
    }

    try {
      this.checkRateLimit();

      const message = await this.anthropic.messages.create({
        model: 'claude-3-opus-20240229',
        max_tokens: 1024,
        messages: [{ role: 'user', content: prompt }],
        temperature: 0.7
      });

      return message.content[0].text;
    } catch (error) {
      return this.handleRateLimit(error);
    }
  }

  async generateQuestions(content: string, numQuestions: number = 5): Promise<any> {
    const prompt = `You are an expert aviation instructor. Generate ${numQuestions} multiple-choice questions based on the following aviation content. 
    Format each question with:
    - The question
    - 4 possible answers (A, B, C, D)
    - The correct answer
    - A detailed explanation of why the answer is correct
    
    Content: ${content}`;

    return this.generateResponse(prompt);
  }

  async explainConcept(concept: string): Promise<string> {
    const prompt = `You are an expert aviation instructor. Explain the following aviation concept in detail, using clear language and relevant examples:
    
    Concept: ${concept}`;

    return this.generateResponse(prompt);
  }

  async generateStudyPlan(topics: string[], timeFrame: string): Promise<string> {
    const prompt = `As an expert aviation instructor, create a detailed study plan for the following aviation topics over ${timeFrame}. 
    Include:
    - Daily breakdown of topics
    - Estimated study time per topic
    - Key concepts to focus on
    - Practice recommendations
    
    Topics: ${topics.join(', ')}`;

    return this.generateResponse(prompt);
  }

  async analyzePerformance(answers: { question: string; userAnswer: string; correctAnswer: string }[]): Promise<string> {
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

    return this.generateResponse(prompt);
  }

  async processStudyMaterial(text: string): Promise<{
    category: string;
    topics: string[];
    summary: string;
  }> {
    this.checkAnthropicAvailability();
    this.checkRateLimit();

    try {
      const prompt = `Analyze this aviation study material and provide:
1. The main category (e.g., Aircraft Systems, Navigation, Weather, etc.)
2. Key topics covered (as a list)
3. A brief summary

Study Material:
${text}

Format your response as JSON with these fields:
{
  "category": "string",
  "topics": ["string"],
  "summary": "string"
}`;

      const response = await this.anthropic!.messages.create({
        model: 'claude-3-opus-20240229',
        max_tokens: 1000,
        messages: [{ role: 'user', content: prompt }],
        temperature: 0.2
      });

      return JSON.parse(response.content[0].text);
    } catch (error: any) {
      if (error.status === 429) {
        return this.handleRateLimit(error);
      }
      throw error;
    }
  }

  async generateQuestionsFromStudyMaterial(text: string, count: number = 5, difficulty: 'easy' | 'medium' | 'hard' = 'medium'): Promise<Array<{
    question: string;
    options: string[];
    correctAnswer: string;
    explanation: string;
    tags: string[];
  }>> {
    this.checkAnthropicAvailability();
    this.checkRateLimit();

    try {
      const prompt = `Generate ${count} multiple-choice questions about this aviation study material.
Difficulty level: ${difficulty}

Study Material:
${text}

For each question:
1. Create a clear, concise question
2. Provide 4 plausible options (A, B, C, D)
3. Mark the correct answer
4. Add a brief explanation
5. Add relevant topic tags

Format your response as JSON array:
[{
  "question": "string",
  "options": ["A) string", "B) string", "C) string", "D) string"],
  "correctAnswer": "A",
  "explanation": "string",
  "tags": ["string"]
}]`;

      const response = await this.anthropic!.messages.create({
        model: 'claude-3-opus-20240229',
        max_tokens: 2000,
        messages: [{ role: 'user', content: prompt }],
        temperature: 0.3
      });

      return JSON.parse(response.content[0].text);
    } catch (error: any) {
      if (error.status === 429) {
        return this.handleRateLimit(error);
      }
      throw error;
    }
  }
}

export const aiService = AIService.getInstance();
