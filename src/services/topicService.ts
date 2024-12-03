import { supabase } from '../lib/supabaseClient';
import { Database } from '../types/database';

type Topic = Database['public']['Tables']['topics']['Row'];
type TopicInsert = Database['public']['Tables']['topics']['Insert'];
type TopicUpdate = Database['public']['Tables']['topics']['Update'];

export class TopicService {
  async getAllTopics(): Promise<Topic[]> {
    const { data, error } = await supabase
      .from('topics')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) {
      throw new Error(`Error fetching topics: ${error.message}`);
    }

    return data || [];
  }

  async getTopicById(id: string): Promise<Topic | null> {
    const { data, error } = await supabase
      .from('topics')
      .select('*')
      .eq('id', id)
      .single();

    if (error) {
      throw new Error(`Error fetching topic: ${error.message}`);
    }

    return data;
  }

  async createTopic(topic: TopicInsert): Promise<Topic> {
    const { data, error } = await supabase
      .from('topics')
      .insert([topic])
      .select()
      .single();

    if (error) {
      throw new Error(`Error creating topic: ${error.message}`);
    }

    if (!data) {
      throw new Error('No data returned after creating topic');
    }

    return data;
  }

  async updateTopic(id: string, topic: TopicUpdate): Promise<Topic> {
    const { data, error } = await supabase
      .from('topics')
      .update(topic)
      .eq('id', id)
      .select()
      .single();

    if (error) {
      throw new Error(`Error updating topic: ${error.message}`);
    }

    if (!data) {
      throw new Error('No data returned after updating topic');
    }

    return data;
  }

  async deleteTopic(id: string): Promise<void> {
    const { error } = await supabase
      .from('topics')
      .delete()
      .eq('id', id);

    if (error) {
      throw new Error(`Error deleting topic: ${error.message}`);
    }
  }
}

export const topicService = new TopicService();
