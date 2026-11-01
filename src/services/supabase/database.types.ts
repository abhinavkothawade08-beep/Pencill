export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[];

export type Database = {
  public: {
    Tables: {
      profiles: {
        Row: {
          id: string;
          name: string;
          grade: string | null;
          avatar_url: string | null;
          target_exam: string | null;
          tier: string;
          streak_days: number;
          longest_streak_days: number;
          weekly_goal_hours: number;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id: string;
          name: string;
          grade?: string | null;
          avatar_url?: string | null;
          target_exam?: string | null;
          tier?: string;
          streak_days?: number;
          longest_streak_days?: number;
          weekly_goal_hours?: number;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          name?: string;
          grade?: string | null;
          avatar_url?: string | null;
          target_exam?: string | null;
          tier?: string;
          streak_days?: number;
          longest_streak_days?: number;
          weekly_goal_hours?: number;
          updated_at?: string;
        };
        Relationships: [];
      };
      learning_paths: {
        Row: {
          id: string;
          title: string;
          description: string;
          domain: string;
          level: string;
          duration_hours: number;
          module_count: number;
          verified: boolean;
          enrolled_count: number;
          average_completion: string;
          syllabus_note: string | null;
          tags: string[];
          weekly_checkpoint: Json;
          is_published: boolean;
          author_user_id: string | null;
          deleted_at: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id: string;
          title: string;
          description: string;
          domain: string;
          level: string;
          duration_hours?: number;
          module_count?: number;
          verified?: boolean;
          enrolled_count?: number;
          average_completion?: string;
          syllabus_note?: string | null;
          tags?: string[];
          weekly_checkpoint?: Json;
          is_published?: boolean;
          author_user_id?: string | null;
          deleted_at?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          title?: string;
          description?: string;
          domain?: string;
          level?: string;
          duration_hours?: number;
          module_count?: number;
          verified?: boolean;
          enrolled_count?: number;
          average_completion?: string;
          syllabus_note?: string | null;
          tags?: string[];
          weekly_checkpoint?: Json;
          is_published?: boolean;
          author_user_id?: string | null;
          deleted_at?: string | null;
          updated_at?: string;
        };
        Relationships: [];
      };
      modules: {
        Row: {
          id: string;
          path_id: string;
          title: string;
          module_number: number;
          order_index: number;
          status: 'completed' | 'in_progress' | 'locked';
          total_resources: number;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id: string;
          path_id: string;
          title: string;
          module_number: number;
          order_index: number;
          status?: 'completed' | 'in_progress' | 'locked';
          total_resources?: number;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          title?: string;
          module_number?: number;
          order_index?: number;
          status?: 'completed' | 'in_progress' | 'locked';
          total_resources?: number;
          updated_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: "modules_path_id_fkey";
            columns: ["path_id"];
            isOneToOne: false;
            referencedRelation: "learning_paths";
            referencedColumns: ["id"];
          }
        ];
      };
      lessons: {
        Row: {
          id: string;
          module_id: string;
          title: string;
          type: string;
          duration_minutes: number;
          source_name: string;
          source_url: string | null;
          order_index: number;
          concept_id: string | null;
          prerequisites_note: string | null;
          chapters: Json;
          formulae: Json;
          summary_points: string[];
          study_notes?: Json | null;
          educator_id?: string | null;
          discovery_source?: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id: string;
          module_id: string;
          title: string;
          type: string;
          duration_minutes?: number;
          source_name: string;
          source_url?: string | null;
          order_index: number;
          concept_id?: string | null;
          prerequisites_note?: string | null;
          chapters?: Json;
          formulae?: Json;
          summary_points?: string[];
          study_notes?: Json | null;
          educator_id?: string | null;
          discovery_source?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          title?: string;
          type?: string;
          duration_minutes?: number;
          source_name?: string;
          source_url?: string | null;
          order_index?: number;
          concept_id?: string | null;
          prerequisites_note?: string | null;
          chapters?: Json;
          formulae?: Json;
          summary_points?: string[];
          study_notes?: Json | null;
          educator_id?: string | null;
          discovery_source?: string | null;
          updated_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: "lessons_module_id_fkey";
            columns: ["module_id"];
            isOneToOne: false;
            referencedRelation: "modules";
            referencedColumns: ["id"];
          }
        ];
      };
      resources: {
        Row: {
          id: string;
          title: string;
          type: string;
          duration_minutes: number;
          source_name: string;
          source_url: string;
          description: string | null;
          external_id: string | null;
          quality_score: number;
          is_verified: boolean;
          last_verified_at: string | null;
          educator_id?: string | null;
          discovery_source?: string | null;
          created_at: string;
        };
        Insert: {
          id: string;
          title: string;
          type: string;
          duration_minutes?: number;
          source_name: string;
          source_url: string;
          description?: string | null;
          external_id?: string | null;
          quality_score?: number;
          is_verified?: boolean;
          last_verified_at?: string | null;
          educator_id?: string | null;
          discovery_source?: string | null;
          created_at?: string;
        };
        Update: {
          title?: string;
          type?: string;
          duration_minutes?: number;
          source_name?: string;
          source_url?: string;
          description?: string | null;
          external_id?: string | null;
          quality_score?: number;
          is_verified?: boolean;
          last_verified_at?: string | null;
          educator_id?: string | null;
          discovery_source?: string | null;
        };
        Relationships: [];
      };
      master_educators: {
        Row: {
          id: string;
          educator_id: string;
          educator_name: string;
          educator_type: string;
          youtube_channel_name: string;
          youtube_channel_id: string | null;
          official_channel_url: string;
          official_website: string | null;
          primary_domain: string;
          subdomain: string | null;
          subjects: string[];
          relevant_examinations: string[];
          country: string;
          primary_language: string;
          additional_languages: string[];
          teaching_level: string[];
          teaching_specialization: string[];
          available_resource_types: string[];
          complete_course_available: boolean;
          playlist_available: boolean;
          subject_expertise_evidence: string;
          educational_credibility: string;
          quality_assessment: string;
          verification_status: string;
          active_status: string;
          last_verified_date: string;
          source_urls: string[];
          research_notes: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          educator_id: string;
          educator_name: string;
          educator_type: string;
          youtube_channel_name: string;
          youtube_channel_id?: string | null;
          official_channel_url: string;
          official_website?: string | null;
          primary_domain: string;
          subdomain?: string | null;
          subjects?: string[];
          relevant_examinations?: string[];
          country?: string;
          primary_language?: string;
          additional_languages?: string[];
          teaching_level?: string[];
          teaching_specialization?: string[];
          available_resource_types?: string[];
          complete_course_available?: boolean;
          playlist_available?: boolean;
          subject_expertise_evidence: string;
          educational_credibility: string;
          quality_assessment: string;
          verification_status?: string;
          active_status?: string;
          last_verified_date: string;
          source_urls?: string[];
          research_notes?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          educator_name?: string;
          educator_type?: string;
          youtube_channel_name?: string;
          youtube_channel_id?: string | null;
          official_channel_url?: string;
          official_website?: string | null;
          primary_domain?: string;
          subdomain?: string | null;
          subjects?: string[];
          relevant_examinations?: string[];
          country?: string;
          primary_language?: string;
          additional_languages?: string[];
          teaching_level?: string[];
          teaching_specialization?: string[];
          available_resource_types?: string[];
          complete_course_available?: boolean;
          playlist_available?: boolean;
          subject_expertise_evidence?: string;
          educational_credibility?: string;
          quality_assessment?: string;
          verification_status?: string;
          active_status?: string;
          last_verified_date?: string;
          source_urls?: string[];
          research_notes?: string | null;
          updated_at?: string;
        };
        Relationships: [];
      };
      progress_records: {
        Row: {
          id: string;
          user_id: string;
          lesson_id: string;
          module_id: string | null;
          path_id: string | null;
          is_completed: boolean;
          completed_at: string | null;
          time_spent_seconds: number;
          last_accessed_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          lesson_id: string;
          module_id?: string | null;
          path_id?: string | null;
          is_completed?: boolean;
          completed_at?: string | null;
          time_spent_seconds?: number;
          last_accessed_at?: string;
        };
        Update: {
          is_completed?: boolean;
          completed_at?: string | null;
          time_spent_seconds?: number;
          last_accessed_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: "progress_records_user_id_fkey";
            columns: ["user_id"];
            isOneToOne: false;
            referencedRelation: "profiles";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "progress_records_lesson_id_fkey";
            columns: ["lesson_id"];
            isOneToOne: false;
            referencedRelation: "lessons";
            referencedColumns: ["id"];
          }
        ];
      };
      generated_reading_materials: {
        Row: {
          id: string;
          user_id: string | null;
          course_id: string;
          module_id: string;
          lesson_id: string;
          title: string;
          content: Json;
          content_format: string;
          language: string;
          academic_level: string;
          learning_objectives: Json;
          generation_model: string | null;
          generation_status: string;
          content_hash: string | null;
          source_metadata: Json;
          token_usage: Json;
          reading_duration_minutes: number;
          generated_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          user_id?: string | null;
          course_id: string;
          module_id: string;
          lesson_id: string;
          title: string;
          content: Json;
          content_format?: string;
          language?: string;
          academic_level?: string;
          learning_objectives?: Json;
          generation_model?: string | null;
          generation_status?: string;
          content_hash?: string | null;
          source_metadata?: Json;
          token_usage?: Json;
          reading_duration_minutes?: number;
          generated_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          user_id?: string | null;
          course_id?: string;
          module_id?: string;
          lesson_id?: string;
          title?: string;
          content?: Json;
          content_format?: string;
          language?: string;
          academic_level?: string;
          learning_objectives?: Json;
          generation_model?: string | null;
          generation_status?: string;
          content_hash?: string | null;
          source_metadata?: Json;
          token_usage?: Json;
          reading_duration_minutes?: number;
          generated_at?: string;
          updated_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: "generated_reading_materials_lesson_id_fkey";
            columns: ["lesson_id"];
            isOneToOne: false;
            referencedRelation: "lessons";
            referencedColumns: ["id"];
          }
        ];
      };
      community_discussions: {
        Row: {
          id: string;
          user_id: string | null;
          author_name: string;
          author_avatar: string | null;
          course_id: string | null;
          lesson_id: string | null;
          domain: string;
          title: string;
          content: string;
          tags: string[];
          upvotes: number;
          upvoter_user_ids: string[];
          reply_count: number;
          is_solved: boolean;
          is_pinned: boolean;
          is_reported: boolean;
          report_reason: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          user_id?: string | null;
          author_name?: string;
          author_avatar?: string | null;
          course_id?: string | null;
          lesson_id?: string | null;
          domain?: string;
          title: string;
          content: string;
          tags?: string[];
          upvotes?: number;
          upvoter_user_ids?: string[];
          reply_count?: number;
          is_solved?: boolean;
          is_pinned?: boolean;
          is_reported?: boolean;
          report_reason?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          user_id?: string | null;
          author_name?: string;
          author_avatar?: string | null;
          course_id?: string | null;
          lesson_id?: string | null;
          domain?: string;
          title?: string;
          content?: string;
          tags?: string[];
          upvotes?: number;
          upvoter_user_ids?: string[];
          reply_count?: number;
          is_solved?: boolean;
          is_pinned?: boolean;
          is_reported?: boolean;
          report_reason?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Relationships: [];
      };
      community_replies: {
        Row: {
          id: string;
          discussion_id: string;
          user_id: string | null;
          author_name: string;
          author_avatar: string | null;
          content: string;
          upvotes: number;
          upvoter_user_ids: string[];
          is_accepted_answer: boolean;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          discussion_id: string;
          user_id?: string | null;
          author_name?: string;
          author_avatar?: string | null;
          content: string;
          upvotes?: number;
          upvoter_user_ids?: string[];
          is_accepted_answer?: boolean;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          discussion_id?: string;
          user_id?: string | null;
          author_name?: string;
          author_avatar?: string | null;
          content?: string;
          upvotes?: number;
          upvoter_user_ids?: string[];
          is_accepted_answer?: boolean;
          created_at?: string;
          updated_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: "community_replies_discussion_id_fkey";
            columns: ["discussion_id"];
            isOneToOne: false;
            referencedRelation: "community_discussions";
            referencedColumns: ["id"];
          }
        ];
      };
      spaced_repetition_cards: {
        Row: {
          id: string;
          user_id: string | null;
          course_id: string;
          module_id: string | null;
          lesson_id: string | null;
          concept: string;
          prompt: string;
          solution: string;
          card_type: string;
          stability: number;
          difficulty: number;
          repetitions: number;
          lapses: number;
          last_rating: number | null;
          due_date: string;
          last_reviewed_at: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          user_id?: string | null;
          course_id: string;
          module_id?: string | null;
          lesson_id?: string | null;
          concept: string;
          prompt: string;
          solution: string;
          card_type?: string;
          stability?: number;
          difficulty?: number;
          repetitions?: number;
          lapses?: number;
          last_rating?: number | null;
          due_date?: string;
          last_reviewed_at?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          user_id?: string | null;
          course_id?: string;
          module_id?: string | null;
          lesson_id?: string | null;
          concept?: string;
          prompt?: string;
          solution?: string;
          card_type?: string;
          stability?: number;
          difficulty?: number;
          repetitions?: number;
          lapses?: number;
          last_rating?: number | null;
          due_date?: string;
          last_reviewed_at?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Relationships: [];
      };
      bookmarks: {
        Row: {
          id: string;
          user_id: string;
          resource_id: string | null;
          path_id: string | null;
          title: string;
          type: string;
          source: string;
          description: string | null;
          category: string;
          notes: string | null;
          created_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          resource_id?: string | null;
          path_id?: string | null;
          title: string;
          type: string;
          source: string;
          description?: string | null;
          category: string;
          notes?: string | null;
          created_at?: string;
        };
        Update: {
          title?: string;
          type?: string;
          source?: string;
          description?: string | null;
          category?: string;
          notes?: string | null;
        };
        Relationships: [
          {
            foreignKeyName: "bookmarks_user_id_fkey";
            columns: ["user_id"];
            isOneToOne: false;
            referencedRelation: "profiles";
            referencedColumns: ["id"];
          }
        ];
      };
      user_notes: {
        Row: {
          id: string;
          user_id: string;
          lesson_id: string;
          path_id: string | null;
          timestamp_marker: string | null;
          seconds_marker: number;
          content: string;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          lesson_id: string;
          path_id?: string | null;
          timestamp_marker?: string | null;
          seconds_marker?: number;
          content: string;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          timestamp_marker?: string | null;
          seconds_marker?: number;
          content?: string;
          updated_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: "user_notes_user_id_fkey";
            columns: ["user_id"];
            isOneToOne: false;
            referencedRelation: "profiles";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "user_notes_lesson_id_fkey";
            columns: ["lesson_id"];
            isOneToOne: false;
            referencedRelation: "lessons";
            referencedColumns: ["id"];
          }
        ];
      };
      quizzes: {
        Row: {
          id: string;
          path_id: string | null;
          title: string;
          time_limit_minutes: number;
          user_id?: string | null;
          topic?: string | null;
          subject?: string | null;
          grade_level?: string | null;
          curriculum?: string | null;
          exam_target?: string | null;
          knowledge_level?: string | null;
          difficulty?: string | null;
          question_count?: number | null;
          question_format?: string | null;
          status?: string | null;
          metadata?: Json | null;
          created_at: string;
        };
        Insert: {
          id: string;
          path_id?: string | null;
          title: string;
          time_limit_minutes?: number;
          user_id?: string | null;
          topic?: string | null;
          subject?: string | null;
          grade_level?: string | null;
          curriculum?: string | null;
          exam_target?: string | null;
          knowledge_level?: string | null;
          difficulty?: string | null;
          question_count?: number | null;
          question_format?: string | null;
          status?: string | null;
          metadata?: Json | null;
          created_at?: string;
        };
        Update: {
          path_id?: string | null;
          title?: string;
          time_limit_minutes?: number;
          user_id?: string | null;
          topic?: string | null;
          subject?: string | null;
          grade_level?: string | null;
          curriculum?: string | null;
          exam_target?: string | null;
          knowledge_level?: string | null;
          difficulty?: string | null;
          question_count?: number | null;
          question_format?: string | null;
          status?: string | null;
          metadata?: Json | null;
        };
        Relationships: [
          {
            foreignKeyName: "quizzes_path_id_fkey";
            columns: ["path_id"];
            isOneToOne: false;
            referencedRelation: "learning_paths";
            referencedColumns: ["id"];
          }
        ];
      };
      quiz_questions: {
        Row: {
          id: string;
          quiz_id: string;
          question_number: number;
          prompt: string;
          stem_note: string | null;
          options: Json;
          correct_option_id: string;
          correct_options?: Json | null;
          explanation: string | null;
          formula_reference: string | null;
          question_type?: string | null;
          difficulty?: string | null;
          topic?: string | null;
          subtopic?: string | null;
          hint?: string | null;
          estimated_seconds?: number | null;
          created_at: string;
        };
        Insert: {
          id: string;
          quiz_id: string;
          question_number: number;
          prompt: string;
          stem_note?: string | null;
          options: Json;
          correct_option_id: string;
          correct_options?: Json | null;
          explanation?: string | null;
          formula_reference?: string | null;
          question_type?: string | null;
          difficulty?: string | null;
          topic?: string | null;
          subtopic?: string | null;
          hint?: string | null;
          estimated_seconds?: number | null;
          created_at?: string;
        };
        Update: {
          question_number?: number;
          prompt?: string;
          stem_note?: string | null;
          options?: Json;
          correct_option_id?: string;
          correct_options?: Json | null;
          explanation?: string | null;
          formula_reference?: string | null;
          question_type?: string | null;
          difficulty?: string | null;
          topic?: string | null;
          subtopic?: string | null;
          hint?: string | null;
          estimated_seconds?: number | null;
        };
        Relationships: [
          {
            foreignKeyName: "quiz_questions_quiz_id_fkey";
            columns: ["quiz_id"];
            isOneToOne: false;
            referencedRelation: "quizzes";
            referencedColumns: ["id"];
          }
        ];
      };
      quiz_attempts: {
        Row: {
          id: string;
          user_id: string;
          quiz_id: string;
          score: number;
          accuracy_percent: number;
          answers: Json;
          flagged_questions: number[];
          status?: string | null;
          started_at?: string | null;
          deadline?: string | null;
          submission_timestamp?: string | null;
          time_spent_seconds?: number | null;
          scoring_metadata?: Json | null;
          completed_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          quiz_id: string;
          score?: number;
          accuracy_percent?: number;
          answers?: Json;
          flagged_questions?: number[];
          status?: string | null;
          started_at?: string | null;
          deadline?: string | null;
          submission_timestamp?: string | null;
          time_spent_seconds?: number | null;
          scoring_metadata?: Json | null;
          completed_at?: string;
        };
        Update: {
          score?: number;
          accuracy_percent?: number;
          answers?: Json;
          flagged_questions?: number[];
          status?: string | null;
          started_at?: string | null;
          deadline?: string | null;
          submission_timestamp?: string | null;
          time_spent_seconds?: number | null;
          scoring_metadata?: Json | null;
          completed_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: "quiz_attempts_user_id_fkey";
            columns: ["user_id"];
            isOneToOne: false;
            referencedRelation: "profiles";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "quiz_attempts_quiz_id_fkey";
            columns: ["quiz_id"];
            isOneToOne: false;
            referencedRelation: "quizzes";
            referencedColumns: ["id"];
          }
        ];
      };
      quiz_responses: {
        Row: {
          id: string;
          attempt_id: string;
          question_id: string;
          selected_option: string | null;
          selected_options: Json | null;
          is_flagged: boolean;
          is_correct: boolean | null;
          answered_at: string;
        };
        Insert: {
          id?: string;
          attempt_id: string;
          question_id: string;
          selected_option?: string | null;
          selected_options?: Json | null;
          is_flagged?: boolean;
          is_correct?: boolean | null;
          answered_at?: string;
        };
        Update: {
          selected_option?: string | null;
          selected_options?: Json | null;
          is_flagged?: boolean;
          is_correct?: boolean | null;
          answered_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: "quiz_responses_attempt_id_fkey";
            columns: ["attempt_id"];
            isOneToOne: false;
            referencedRelation: "quiz_attempts";
            referencedColumns: ["id"];
          }
        ];
      };
      ai_generation_records: {
        Row: {
          id: string;
          user_id: string | null;
          prompt_input: string;
          raw_output: Json;
          model_version: string;
          status: 'draft' | 'reviewed' | 'published';
          reviewed_by: string | null;
          created_at: string;
        };
        Insert: {
          id?: string;
          user_id?: string | null;
          prompt_input: string;
          raw_output: Json;
          model_version?: string;
          status?: 'draft' | 'reviewed' | 'published';
          reviewed_by?: string | null;
          created_at?: string;
        };
        Update: {
          status?: 'draft' | 'reviewed' | 'published';
          reviewed_by?: string | null;
        };
        Relationships: [];
      };
      discovery_jobs: {
        Row: {
          id: string;
          topic: string;
          source_platform: string;
          status: 'pending' | 'running' | 'completed' | 'failed';
          found_count: number;
          error_message: string | null;
          created_at: string;
          completed_at: string | null;
        };
        Insert: {
          id?: string;
          topic: string;
          source_platform: string;
          status?: 'pending' | 'running' | 'completed' | 'failed';
          found_count?: number;
          error_message?: string | null;
          created_at?: string;
          completed_at?: string | null;
        };
        Update: {
          status?: 'pending' | 'running' | 'completed' | 'failed';
          found_count?: number;
          error_message?: string | null;
          completed_at?: string | null;
        };
        Relationships: [];
      };
      enrollments: {
        Row: {
          id: string;
          user_id: string;
          course_id: string;
          enrolled_at: string;
          completion_status: 'enrolled' | 'in_progress' | 'completed' | 'archived';
          progress_percent: number;
          last_accessed_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          course_id: string;
          enrolled_at?: string;
          completion_status?: 'enrolled' | 'in_progress' | 'completed' | 'archived';
          progress_percent?: number;
          last_accessed_at?: string;
        };
        Update: {
          completion_status?: 'enrolled' | 'in_progress' | 'completed' | 'archived';
          progress_percent?: number;
          last_accessed_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: "enrollments_user_id_fkey";
            columns: ["user_id"];
            isOneToOne: false;
            referencedRelation: "profiles";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "enrollments_course_id_fkey";
            columns: ["course_id"];
            isOneToOne: false;
            referencedRelation: "learning_paths";
            referencedColumns: ["id"];
          }
        ];
      };
      course_sources: {
        Row: {
          id: string;
          course_id: string | null;
          lesson_id: string | null;
          source_title: string;
          source_url: string;
          publisher_or_institution: string;
          source_type: string;
          license_or_attribution: string | null;
          verification_status: 'verified' | 'unverified' | 'pending' | 'rejected';
          last_verified_at: string | null;
          created_at: string;
        };
        Insert: {
          id?: string;
          course_id?: string | null;
          lesson_id?: string | null;
          source_title: string;
          source_url: string;
          publisher_or_institution: string;
          source_type?: string;
          license_or_attribution?: string | null;
          verification_status?: 'verified' | 'unverified' | 'pending' | 'rejected';
          last_verified_at?: string | null;
          created_at?: string;
        };
        Update: {
          source_title?: string;
          source_url?: string;
          publisher_or_institution?: string;
          source_type?: string;
          license_or_attribution?: string | null;
          verification_status?: 'verified' | 'unverified' | 'pending' | 'rejected';
          last_verified_at?: string | null;
        };
        Relationships: [
          {
            foreignKeyName: "course_sources_course_id_fkey";
            columns: ["course_id"];
            isOneToOne: false;
            referencedRelation: "learning_paths";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "course_sources_lesson_id_fkey";
            columns: ["lesson_id"];
            isOneToOne: false;
            referencedRelation: "lessons";
            referencedColumns: ["id"];
          }
        ];
      };
    };
    Views: {
      [_ in never]: never;
    };
    Functions: {
      delete_learning_path_cascade: {
        Args: {
          target_path_id: string;
        };
        Returns: Json;
      };
    };
    Enums: {
      [_ in never]: never;
    };
    CompositeTypes: {
      [_ in never]: never;
    };
  };
};
