"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.topicService = exports.TopicService = void 0;
const supabaseClient_1 = require("../lib/supabaseClient");
class TopicService {
    async getAllTopics() {
        const { data, error } = await supabaseClient_1.supabase
            .from('topics')
            .select('*')
            .order('created_at', { ascending: false });
        if (error) {
            throw new Error(`Error fetching topics: ${error.message}`);
        }
        return data || [];
    }
    async getTopicById(id) {
        const { data, error } = await supabaseClient_1.supabase
            .from('topics')
            .select('*')
            .eq('id', id)
            .single();
        if (error) {
            throw new Error(`Error fetching topic: ${error.message}`);
        }
        return data;
    }
    async createTopic(topic) {
        const { data, error } = await supabaseClient_1.supabase
            .from('topics')
            .insert([topic])
            .select()
            .single();
        if (error) {
            throw new Error(`Error creating topic: ${error.message}`);
        }
        return data;
    }
    async updateTopic(id, topic) {
        const { data, error } = await supabaseClient_1.supabase
            .from('topics')
            .update(topic)
            .eq('id', id)
            .select()
            .single();
        if (error) {
            throw new Error(`Error updating topic: ${error.message}`);
        }
        return data;
    }
    async deleteTopic(id) {
        const { error } = await supabaseClient_1.supabase
            .from('topics')
            .delete()
            .eq('id', id);
        if (error) {
            throw new Error(`Error deleting topic: ${error.message}`);
        }
    }
}
exports.TopicService = TopicService;
exports.topicService = new TopicService();
