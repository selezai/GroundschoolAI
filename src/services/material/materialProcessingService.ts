import { OpenAIApi, Configuration } from 'openai';
import AsyncStorage from '@react-native-async-storage/async-storage';
import * as FileSystem from 'expo-file-system';

interface StudyMaterialInput {
  userId: string;
  fileName: string;
  fileType: string;
  content: string; // base64 encoded
}

interface ProcessedContent {
  text: string;
  topics: string[];
  keyPoints: string[];
  questionBank: Array<{
    topic: string;
    questions: Array<{
      question: string;
      options: string[];
      correctAnswer: string;
      explanation: string;
    }>;
  }>;
  studyGuide: {
    sections: Array<{
      topic: string;
      content: string;
      importance: 'high' | 'medium' | 'low';
      examTips: string[];
    }>;
  };
}

class MaterialProcessingService {
  private static instance: MaterialProcessingService;
  private openai: OpenAIApi;
  private readonly STORAGE_KEY = '@processed_materials';

  private constructor() {
    const configuration = new Configuration({
      apiKey: process.env.OPENAI_API_KEY,
    });
    this.openai = new OpenAIApi(configuration);
  }

  public static getInstance(): MaterialProcessingService {
    if (!MaterialProcessingService.instance) {
      MaterialProcessingService.instance = new MaterialProcessingService();
    }
    return MaterialProcessingService.instance;
  }

  public async processStudyMaterial(input: StudyMaterialInput): Promise<void> {
    try {
      // Create a directory for the user if it doesn't exist
      const userDir = `${FileSystem.documentDirectory}users/${input.userId}/materials`;
      await FileSystem.makeDirectoryAsync(userDir, { intermediates: true });

      // Save the original file
      const fileName = this.sanitizeFileName(input.fileName);
      const filePath = `${userDir}/${fileName}`;
      await FileSystem.writeAsStringAsync(filePath, input.content, {
        encoding: FileSystem.EncodingType.Base64,
      });

      // Extract text from the file
      const extractedText = await this.extractText(input);

      // Process the content using GPT-4 for comprehensive analysis
      const processedContent = await this.processContent(extractedText);

      // Generate initial question bank
      await this.generateQuestionBank(input.userId, fileName, extractedText);

      // Initialize AI instructor context
      await this.initializeAIInstructor(input.userId, fileName, processedContent);

      // Save the processed content
      await this.saveProcessedContent(input.userId, fileName, processedContent);

      // Update the study materials index
      await this.updateMaterialsIndex(input.userId, {
        fileName,
        originalName: input.fileName,
        fileType: input.fileType,
        uploadDate: new Date().toISOString(),
        topics: processedContent.topics,
        hasQuestionBank: true,
        hasAIInstructor: true,
      });

    } catch (error) {
      console.error('Error processing study material:', error);
      throw new Error('Failed to process study material');
    }
  }

  private async extractText(input: StudyMaterialInput): Promise<string> {
    // For images, use OCR (e.g., Tesseract.js or cloud OCR service)
    // For PDFs, use a PDF parser
    // This is a placeholder implementation
    return 'Extracted text from document';
  }

  private async processContent(text: string): Promise<ProcessedContent> {
    try {
      const response = await this.openai.createChatCompletion({
        model: 'gpt-4',
        messages: [
          {
            role: 'system',
            content: 'You are an expert at analyzing aviation study materials and extracting key information for SACAA exam preparation.',
          },
          {
            role: 'user',
            content: `Please perform a comprehensive analysis of the following aviation study material to create:
1. Main topics covered
2. Key points likely to appear in SACAA exams
3. A structured study guide with sections, importance levels, and exam tips
4. An initial set of practice questions with explanations

Content: ${text}`,
          },
        ],
        temperature: 0.7,
        max_tokens: 2000,
      });

      const result = response.data.choices[0]?.message?.content;
      if (!result) throw new Error('Failed to process content');

      // Parse the AI response into structured content
      return this.parseAIResponse(result);
    } catch (error) {
      console.error('Error processing content:', error);
      throw error;
    }
  }

  private async generateQuestionBank(userId: string, fileName: string, content: string): Promise<void> {
    try {
      const response = await this.openai.createChatCompletion({
        model: 'gpt-4',
        messages: [
          {
            role: 'system',
            content: 'You are an expert at creating aviation exam questions in the style of SACAA exams.',
          },
          {
            role: 'user',
            content: `Create a comprehensive question bank from the following study material. For each topic, generate multiple-choice questions that test understanding at different difficulty levels.

Content: ${content}`,
          },
        ],
        temperature: 0.7,
        max_tokens: 2000,
      });

      // Save question bank
      const questionBankPath = `${FileSystem.documentDirectory}users/${userId}/question_banks/${fileName}_questions.json`;
      await FileSystem.makeDirectoryAsync(
        `${FileSystem.documentDirectory}users/${userId}/question_banks/`,
        { intermediates: true }
      );
      await FileSystem.writeAsStringAsync(questionBankPath, JSON.stringify(response.data.choices[0]?.message?.content));
    } catch (error) {
      console.error('Error generating question bank:', error);
      throw error;
    }
  }

  private async initializeAIInstructor(userId: string, fileName: string, processedContent: ProcessedContent): Promise<void> {
    try {
      // Save AI instructor context
      const contextPath = `${FileSystem.documentDirectory}users/${userId}/ai_context/${fileName}_context.json`;
      await FileSystem.makeDirectoryAsync(
        `${FileSystem.documentDirectory}users/${userId}/ai_context/`,
        { intermediates: true }
      );
      
      const instructorContext = {
        topics: processedContent.topics,
        keyPoints: processedContent.keyPoints,
        studyGuide: processedContent.studyGuide,
        lastInteraction: new Date().toISOString(),
        conversationHistory: [],
      };

      await FileSystem.writeAsStringAsync(contextPath, JSON.stringify(instructorContext));
    } catch (error) {
      console.error('Error initializing AI instructor:', error);
      throw error;
    }
  }

  private parseAIResponse(response: string): ProcessedContent {
    try {
      // Split the response into sections based on expected format
      const sections = response.split('\n\n');
      
      // Extract topics (assuming first section contains topics)
      const topics = sections[0]
        .split('\n')
        .filter(line => line.trim().startsWith('-'))
        .map(line => line.trim().replace('-', '').trim());

      // Extract key points
      const keyPoints = sections[1]
        .split('\n')
        .filter(line => line.trim().startsWith('-'))
        .map(line => line.trim().replace('-', '').trim());

      // Parse study guide sections
      const studyGuideSections = sections[2]
        .split('\n---\n')
        .map(section => {
          const [topic, content, importance, ...tips] = section.split('\n');
          return {
            topic: topic.trim(),
            content: content.trim(),
            importance: importance.toLowerCase() as 'high' | 'medium' | 'low',
            examTips: tips.map(tip => tip.trim()),
          };
        });

      // Parse question bank
      const questionBankRaw = sections[3]
        .split('\n===\n')
        .map(topicSection => {
          const [topic, ...questionBlocks] = topicSection.split('\n---\n');
          const questions = questionBlocks.map(block => {
            const [question, ...rest] = block.split('\n');
            const options = rest.slice(0, -2).map(opt => opt.trim());
            const correctAnswer = rest[rest.length - 2].trim();
            const explanation = rest[rest.length - 1].trim();
            return {
              question: question.trim(),
              options,
              correctAnswer,
              explanation,
            };
          });
          return {
            topic: topic.trim(),
            questions,
          };
        });

      return {
        text: response,
        topics,
        keyPoints,
        questionBank: questionBankRaw,
        studyGuide: {
          sections: studyGuideSections,
        },
      };
    } catch (error) {
      console.error('Error parsing AI response:', error);
      // Return a safe default structure if parsing fails
      return {
        text: response,
        topics: [],
        keyPoints: [],
        questionBank: [],
        studyGuide: {
          sections: [],
        },
      };
    }
  }

  private async saveProcessedContent(
    userId: string,
    fileName: string,
    content: ProcessedContent
  ): Promise<void> {
    try {
      const contentPath = `${FileSystem.documentDirectory}users/${userId}/processed/${fileName}_processed.json`;
      await FileSystem.makeDirectoryAsync(
        `${FileSystem.documentDirectory}users/${userId}/processed/`,
        { intermediates: true }
      );
      await FileSystem.writeAsStringAsync(contentPath, JSON.stringify(content));
    } catch (error) {
      console.error('Error saving processed content:', error);
      throw new Error('Failed to save processed content');
    }
  }

  private async updateMaterialsIndex(
    userId: string,
    material: {
      fileName: string;
      originalName: string;
      fileType: string;
      uploadDate: string;
      topics: string[];
      hasQuestionBank: boolean;
      hasAIInstructor: boolean;
    }
  ): Promise<void> {
    try {
      const key = `${this.STORAGE_KEY}_${userId}`;
      const existingData = await AsyncStorage.getItem(key);
      const materials = existingData ? JSON.parse(existingData) : [];
      
      // Update or add the material
      const existingIndex = materials.findIndex(
        (m: any) => m.fileName === material.fileName
      );
      
      if (existingIndex >= 0) {
        materials[existingIndex] = material;
      } else {
        materials.push(material);
      }
      
      await AsyncStorage.setItem(key, JSON.stringify(materials));
    } catch (error) {
      console.error('Error updating materials index:', error);
      throw new Error('Failed to update materials index');
    }
  }

  public async getUserMaterials(userId: string): Promise<any[]> {
    try {
      const key = `${this.STORAGE_KEY}_${userId}`;
      const data = await AsyncStorage.getItem(key);
      return data ? JSON.parse(data) : [];
    } catch (error) {
      console.error('Error getting user materials:', error);
      return [];
    }
  }

  private sanitizeFileName(fileName: string): string {
    return fileName.replace(/[^a-zA-Z0-9.-]/g, '_');
  }
}

export default MaterialProcessingService;
