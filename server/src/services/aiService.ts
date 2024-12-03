import Anthropic from '@anthropic-ai/sdk';

class AIService {
  private anthropic: Anthropic;

  constructor() {
    this.anthropic = new Anthropic({
      apiKey: process.env.ANTHROPIC_API_KEY,
    });
  }

  async generateQuestions(content: string, numQuestions: number = 5): Promise<any> {
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
  }

  async explainConcept(concept: string): Promise<string> {
    const prompt = `You are an expert aviation instructor. Explain the following aviation concept in detail, using clear language and relevant examples:
    
    Concept: ${concept}`;

    const response = await this.anthropic.messages.create({
      model: 'claude-3-opus-20240229',
      max_tokens: 1000,
      temperature: 0.7,
      messages: [{ role: 'user', content: prompt }]
    });

    return response.content[0].text;
  }

  async generateStudyPlan(topics: string[], timeFrame: string): Promise<string> {
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

    const response = await this.anthropic.messages.create({
      model: 'claude-3-opus-20240229',
      max_tokens: 1000,
      temperature: 0.7,
      messages: [{ role: 'user', content: prompt }]
    });

    return response.content[0].text;
  }
}

export const aiService = new AIService();
