import { Question, SubjectCategory } from '../types/question';
import studyApi from './api/studyApi';

interface GenerationConfig {
  category: SubjectCategory;
  count: number;
  difficulty?: 'easy' | 'medium' | 'hard';
  includeDiagrams?: boolean;
  tags?: string[];
}

interface ProcessedMaterial {
  id: string;
  content: string;
  metadata: {
    category: SubjectCategory;
    topics: string[];
    hasVisuals: boolean;
  };
}

class QuestionGenerator {
  private async processStudyMaterial(materialId: string): Promise<ProcessedMaterial> {
    // Get the processed content from the API
    const material = await studyApi.getMaterial(materialId);
    
    // The API should return processed content with:
    // - Extracted text
    // - Identified topics
    // - Categorized content
    // - Parsed diagrams and visuals
    return {
      id: materialId,
      content: material.processedContent,
      metadata: {
        category: material.category,
        topics: material.topics,
        hasVisuals: material.hasVisuals,
      },
    };
  }

  async generateQuestions(
    materialId: string,
    config: GenerationConfig
  ): Promise<Question[]> {
    try {
      // Process the study material
      const processedMaterial = await this.processStudyMaterial(materialId);

      // Generate questions using AI model through API
      const response = await fetch('${API_BASE_URL}/ai/generate-questions', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          material: processedMaterial,
          config: {
            ...config,
            rules: {
              optionsCount: 4, // SACAA format
              passingScore: 75, // SACAA requirement
              includeExplanations: true,
              formatGuidelines: {
                questionStyle: 'clear and concise',
                optionStyle: 'specific and unambiguous',
                avoidNegatives: true,
                useCorrectTerminology: true,
              },
            },
          },
        }),
      });

      const questions = await response.json();

      // Validate generated questions
      return this.validateQuestions(questions);
    } catch (error) {
      console.error('Error generating questions:', error);
      throw new Error('Failed to generate questions from study material');
    }
  }

  private validateQuestions(questions: Question[]): Question[] {
    return questions.filter(question => {
      // Ensure each question meets SACAA requirements
      const isValid =
        question.options.length === 4 &&
        question.correctOptionIndex >= 0 &&
        question.correctOptionIndex < 4 &&
        question.text.length > 0 &&
        question.options.every(option => option.length > 0) &&
        question.explanation.length > 0;

      if (!isValid) {
        console.warn('Invalid question detected:', question);
      }

      return isValid;
    });
  }

  async generateQuestionSet(
    materialIds: string[],
    config: {
      title: string;
      description: string;
      category: SubjectCategory;
      totalQuestions: number;
      timeLimit: number;
      difficultyDistribution: {
        easy: number;
        medium: number;
        hard: number;
      };
    }
  ) {
    try {
      // Generate questions for each difficulty level
      const questions: Question[] = [];
      
      for (const difficulty of ['easy', 'medium', 'hard'] as const) {
        const count = Math.floor(
          config.totalQuestions * (config.difficultyDistribution[difficulty] / 100)
        );
        
        if (count > 0) {
          const difficultyQuestions = await Promise.all(
            materialIds.map(id =>
              this.generateQuestions(id, {
                category: config.category,
                count: Math.ceil(count / materialIds.length),
                difficulty,
              })
            )
          );

          questions.push(...difficultyQuestions.flat());
        }
      }

      // Create question set
      const questionSet = {
        title: config.title,
        description: config.description,
        category: config.category,
        questions: this.validateQuestions(questions),
        totalQuestions: config.totalQuestions,
        timeLimit: config.timeLimit,
        passingScore: 75, // SACAA standard
        difficultyDistribution: config.difficultyDistribution,
      };

      // Save question set through API
      return await studyApi.createQuestionSet(questionSet);
    } catch (error) {
      console.error('Error generating question set:', error);
      throw new Error('Failed to generate question set');
    }
  }
}

export default new QuestionGenerator();
