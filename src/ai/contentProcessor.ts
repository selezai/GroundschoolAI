import Anthropic from '@anthropic-ai/sdk';
import { supabase } from '../services/supabaseClient';

const anthropic = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY,
});

interface ProcessedContent {
  processedContent: string;
  topics: string[];
}

interface TopicInfo {
  topic: string;
  subtopics: string[];
  importanceScore: number;
}

interface TextChunk {
  text: string;
  embedding: number[];
}

export const processContent = async (content: string): Promise<ProcessedContent> => {
  try {
    // 1. Analyze and structure the content
    const analysisResponse = await anthropic.messages.create({
      model: 'claude-3-opus-20240229',
      max_tokens: 1500,
      temperature: 0.7,
      messages: [
        {
          role: 'user',
          content: `Analyze this aviation study material and:
          1. Structure and format it for better readability
          2. Identify main topics and subtopics
          3. Return the result in JSON format with:
             - processedContent: The structured content
             - topics: Array of main topics
             - topicDetails: Array of objects with:
               * topic: Main topic name
               * subtopics: Array of subtopics
               * importanceScore: Number between 0-1

          Study Material:
          ${content}`
        }
      ]
    });

    const result = JSON.parse(analysisResponse.content[0].text);

    // Store detailed topic information
    if (result.topicDetails) {
      await storeTopicDetails(result.topicDetails);
    }

    return {
      processedContent: result.processedContent,
      topics: result.topics
    };
  } catch (error) {
    console.error('Error processing content:', error);
    throw error;
  }
};

export const generateEmbeddings = async (content: string): Promise<TextChunk[]> => {
  try {
    // 1. Split content into chunks
    const chunks = splitIntoChunks(content);
    const embeddedChunks: TextChunk[] = [];

    // 2. Generate embeddings for each chunk
    for (const chunk of chunks) {
      const response = await anthropic.messages.create({
        model: 'claude-3-opus-20240229',
        max_tokens: 1500,
        messages: [
          {
            role: 'user',
            content: `Create a semantic embedding vector for this text. Return ONLY the embedding vector as a JSON array of 1536 numbers.
            
            Text: ${chunk}`
          }
        ]
      });

      const embedding = JSON.parse(response.content[0].text);
      embeddedChunks.push({
        text: chunk,
        embedding
      });
    }

    return embeddedChunks;
  } catch (error) {
    console.error('Error generating embeddings:', error);
    throw error;
  }
};

export const storeEmbeddings = async (materialId: string, chunks: TextChunk[]): Promise<void> => {
  try {
    // Store embeddings in batches to avoid hitting request size limits
    const batchSize = 100;
    for (let i = 0; i < chunks.length; i += batchSize) {
      const batch = chunks.slice(i, i + batchSize).map((chunk, index) => ({
        material_id: materialId,
        chunk_index: i + index,
        chunk_text: chunk.text,
        embedding: chunk.embedding
      }));

      const { error } = await supabase
        .from('material_embeddings')
        .insert(batch);

      if (error) throw error;
    }
  } catch (error) {
    console.error('Error storing embeddings:', error);
    throw error;
  }
};

export const storeTopicDetails = async (topics: TopicInfo[]): Promise<void> => {
  try {
    const topicsToInsert = topics.map(topic => ({
      topic: topic.topic,
      subtopics: topic.subtopics,
      importance_score: topic.importanceScore
    }));

    const { error } = await supabase
      .from('material_topics')
      .insert(topicsToInsert);

    if (error) throw error;
  } catch (error) {
    console.error('Error storing topic details:', error);
    throw error;
  }
};

const splitIntoChunks = (content: string, maxChunkSize: number = 1000): string[] => {
  const words = content.split(' ');
  const chunks: string[] = [];
  let currentChunk: string[] = [];
  let currentSize = 0;

  for (const word of words) {
    if (currentSize + word.length > maxChunkSize) {
      chunks.push(currentChunk.join(' '));
      currentChunk = [word];
      currentSize = word.length;
    } else {
      currentChunk.push(word);
      currentSize += word.length + 1; // +1 for space
    }
  }

  if (currentChunk.length > 0) {
    chunks.push(currentChunk.join(' '));
  }

  return chunks;
};

export const searchSimilarContent = async (
  query: string,
  threshold: number = 0.7,
  limit: number = 5
): Promise<any[]> => {
  try {
    // 1. Generate embedding for the search query
    const response = await anthropic.messages.create({
      model: 'claude-3-opus-20240229',
      max_tokens: 1500,
      messages: [
        {
          role: 'user',
          content: `Create a semantic embedding vector for this search query. Return ONLY the embedding vector as a JSON array of 1536 numbers.
          
          Query: ${query}`
        }
      ]
    });

    const queryEmbedding = JSON.parse(response.content[0].text);

    // 2. Search for similar content using the database function
    const { data, error } = await supabase
      .rpc('search_material_embeddings', {
        query_embedding: queryEmbedding,
        match_threshold: threshold,
        match_count: limit
      });

    if (error) throw error;
    return data;
  } catch (error) {
    console.error('Error searching similar content:', error);
    throw error;
  }
};
