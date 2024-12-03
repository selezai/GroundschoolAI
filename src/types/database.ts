export interface Database {
  public: {
    Tables: {
      topics: {
        Row: {
          id: string;
          name: string;
          description?: string;
          parent_id?: string;
          created_at: string;
          updated_at: string;
        };
        Insert: Omit<Database['public']['Tables']['topics']['Row'], 'id' | 'created_at' | 'updated_at'>;
        Update: Partial<Database['public']['Tables']['topics']['Insert']>;
      };
      study_materials: {
        Row: {
          id: string;
          user_id: string;
          title: string;
          content: string;
          type: 'pdf' | 'image' | 'text';
          status: 'processing' | 'ready' | 'error';
          processed_content?: string;
          error_message?: string;
          topics?: string[];
          created_at: string;
          updated_at: string;
        };
        Insert: Omit<Database['public']['Tables']['study_materials']['Row'], 'id' | 'created_at' | 'updated_at'>;
        Update: Partial<Database['public']['Tables']['study_materials']['Insert']>;
      };
      processing_tasks: {
        Row: {
          id: string;
          material_id: string;
          task_type: string;
          status: 'pending' | 'processing' | 'completed' | 'failed';
          progress: number;
          result?: string;
          error?: string;
          created_at: string;
          updated_at: string;
        };
        Insert: Omit<Database['public']['Tables']['processing_tasks']['Row'], 'id' | 'created_at' | 'updated_at'>;
        Update: Partial<Database['public']['Tables']['processing_tasks']['Insert']>;
      };
      profiles: {
        Row: {
          id: string;
          email: string;
          full_name: string | null;
          avatar_url: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: Omit<Database['public']['Tables']['profiles']['Row'], 'id' | 'created_at' | 'updated_at'>;
        Update: Partial<Database['public']['Tables']['profiles']['Insert']>;
      };
      subscriptions: {
        Row: {
          id: string;
          user_id: string;
          status: 'active' | 'expired' | 'cancelled';
          plan_type: 'basic' | 'premium';
          start_date: string;
          end_date: string;
          created_at: string;
          updated_at: string;
        };
        Insert: Omit<Database['public']['Tables']['subscriptions']['Row'], 'id' | 'created_at' | 'updated_at'>;
        Update: Partial<Database['public']['Tables']['subscriptions']['Insert']>;
      };
      question_sets: {
        Row: {
          id: string;
          title: string;
          description: string;
          category: string;
          difficulty: 'beginner' | 'intermediate' | 'advanced';
          estimated_duration: number;
          created_at: string;
          updated_at: string;
        };
        Insert: Omit<Database['public']['Tables']['question_sets']['Row'], 'id' | 'created_at' | 'updated_at'>;
        Update: Partial<Database['public']['Tables']['question_sets']['Insert']>;
      };
      user_answers: {
        Row: {
          id: string;
          user_id: string;
          question_id: string;
          selected_answer: string;
          is_correct: boolean;
          created_at: string;
          updated_at: string;
        };
        Insert: Omit<Database['public']['Tables']['user_answers']['Row'], 'id' | 'created_at' | 'updated_at'>;
        Update: Partial<Database['public']['Tables']['user_answers']['Insert']>;
      };
      quiz_progress: {
        Row: {
          id: string;
          user_id: string;
          question_set_id: string;
          total_questions: number;
          answered_questions: number;
          correct_answers: number;
          incorrect_answers: number;
          score: number;
          time_spent: number;
          passing_score: number;
          is_passing: boolean;
          created_at: string;
          updated_at: string;
        };
        Insert: Omit<Database['public']['Tables']['quiz_progress']['Row'], 'id' | 'created_at' | 'updated_at'>;
        Update: Partial<Database['public']['Tables']['quiz_progress']['Insert']>;
      };
      user_stats: {
        Row: {
          id: string;
          user_id: string;
          overall_score: number;
          total_time: number;
          created_at: string;
          updated_at: string;
        };
        Insert: Omit<Database['public']['Tables']['user_stats']['Row'], 'id' | 'created_at' | 'updated_at'>;
        Update: Partial<Database['public']['Tables']['user_stats']['Insert']>;
      };
    };
  };
}
