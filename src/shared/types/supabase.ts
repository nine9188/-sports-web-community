export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  // Allows to automatically instanciate createClient with right options
  // instead of createClient<Database, { PostgrestVersion: 'XX' }>(URL, KEY)
  __InternalSupabase: {
    PostgrestVersion: "12.2.3 (519615d)"
  }
  public: {
    Tables: {
      application_logs: {
        Row: {
          action: string
          category: string
          created_at: string | null
          endpoint: string | null
          error_code: string | null
          error_details: Json | null
          id: string
          ip_address: unknown | null
          level: string
          message: string
          metadata: Json | null
          method: string | null
          request_id: string | null
          response_time_ms: number | null
          session_id: string | null
          stack_trace: string | null
          status_code: number | null
          user_agent: string | null
          user_id: string | null
        }
        Insert: {
          action: string
          category: string
          created_at?: string | null
          endpoint?: string | null
          error_code?: string | null
          error_details?: Json | null
          id?: string
          ip_address?: unknown | null
          level: string
          message: string
          metadata?: Json | null
          method?: string | null
          request_id?: string | null
          response_time_ms?: number | null
          session_id?: string | null
          stack_trace?: string | null
          status_code?: number | null
          user_agent?: string | null
          user_id?: string | null
        }
        Update: {
          action?: string
          category?: string
          created_at?: string | null
          endpoint?: string | null
          error_code?: string | null
          error_details?: Json | null
          id?: string
          ip_address?: unknown | null
          level?: string
          message?: string
          metadata?: Json | null
          method?: string | null
          request_id?: string | null
          response_time_ms?: number | null
          session_id?: string | null
          stack_trace?: string | null
          status_code?: number | null
          user_agent?: string | null
          user_id?: string | null
        }
        Relationships: []
      }
      banners: {
        Row: {
          auto_slide_interval: number | null
          background_color: string | null
          created_at: string | null
          desktop_per_row: number | null
          display_order: number | null
          display_type: string | null
          html_content: string | null
          id: string
          image_url: string | null
          is_active: boolean | null
          link_url: string | null
          mobile_per_row: number | null
          position: string
          sort_type: string | null
          subtitle: string | null
          text_color: string | null
          title: string | null
          type: string
          updated_at: string | null
        }
        Insert: {
          auto_slide_interval?: number | null
          background_color?: string | null
          created_at?: string | null
          desktop_per_row?: number | null
          display_order?: number | null
          display_type?: string | null
          html_content?: string | null
          id?: string
          image_url?: string | null
          is_active?: boolean | null
          link_url?: string | null
          mobile_per_row?: number | null
          position: string
          sort_type?: string | null
          subtitle?: string | null
          text_color?: string | null
          title?: string | null
          type: string
          updated_at?: string | null
        }
        Update: {
          auto_slide_interval?: number | null
          background_color?: string | null
          created_at?: string | null
          desktop_per_row?: number | null
          display_order?: number | null
          display_type?: string | null
          html_content?: string | null
          id?: string
          image_url?: string | null
          is_active?: boolean | null
          link_url?: string | null
          mobile_per_row?: number | null
          position?: string
          sort_type?: string | null
          subtitle?: string | null
          text_color?: string | null
          title?: string | null
          type?: string
          updated_at?: string | null
        }
        Relationships: []
      }
      boards: {
        Row: {
          access_level: string | null
          description: string | null
          display_order: number | null
          id: string
          league_id: number | null
          logo: string | null
          name: string
          parent_id: string | null
          slug: string | null
          team_id: number | null
          views: number | null
        }
        Insert: {
          access_level?: string | null
          description?: string | null
          display_order?: number | null
          id?: string
          league_id?: number | null
          logo?: string | null
          name: string
          parent_id?: string | null
          slug?: string | null
          team_id?: number | null
          views?: number | null
        }
        Update: {
          access_level?: string | null
          description?: string | null
          display_order?: number | null
          id?: string
          league_id?: number | null
          logo?: string | null
          name?: string
          parent_id?: string | null
          slug?: string | null
          team_id?: number | null
          views?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "boards_parent_id_fkey"
            columns: ["parent_id"]
            isOneToOne: false
            referencedRelation: "boards"
            referencedColumns: ["id"]
          },
        ]
      }
      cache: {
        Row: {
          created_at: string
          data: Json
          key: string
        }
        Insert: {
          created_at?: string
          data: Json
          key: string
        }
        Update: {
          created_at?: string
          data?: Json
          key?: string
        }
        Relationships: []
      }
      chat_chip_intents: {
        Row: {
          id: string
          intent: string
          title: string
          response_text: string
          is_active: boolean | null
          display_order: number | null
          updated_at: string | null
          created_at: string | null
        }
        Insert: {
          id?: string
          intent: string
          title: string
          response_text: string
          is_active?: boolean | null
          display_order?: number | null
          updated_at?: string | null
          created_at?: string | null
        }
        Update: {
          id?: string
          intent?: string
          title?: string
          response_text?: string
          is_active?: boolean | null
          display_order?: number | null
          updated_at?: string | null
          created_at?: string | null
        }
        Relationships: []
      }
      chat_chip_patterns: {
        Row: {
          id: string
          intent_id: string
          pattern_regex: string
          is_active: boolean | null
          created_at: string | null
        }
        Insert: {
          id?: string
          intent_id: string
          pattern_regex: string
          is_active?: boolean | null
          created_at?: string | null
        }
        Update: {
          id?: string
          intent_id?: string
          pattern_regex?: string
          is_active?: boolean | null
          created_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "chat_chip_patterns_intent_id_fkey",
            columns: ["intent_id"],
            isOneToOne: false,
            referencedRelation: "chat_chip_intents",
            referencedColumns: ["id"],
          },
        ]
      }
      chat_messages: {
        Row: {
          id: string
          session_id: string | null
          role: string | null
          content_json: Json | null
          created_at: string | null
        }
        Insert: {
          id?: string
          session_id?: string | null
          role?: string | null
          content_json?: Json | null
          created_at?: string | null
        }
        Update: {
          id?: string
          session_id?: string | null
          role?: string | null
          content_json?: Json | null
          created_at?: string | null
        }
        Relationships: []
      }
      chat_sessions: {
        Row: {
          id: string
          created_at: string | null
          last_seen_assistant_count: number | null
        }
        Insert: {
          id?: string
          created_at?: string | null
          last_seen_assistant_count?: number | null
        }
        Update: {
          id?: string
          created_at?: string | null
          last_seen_assistant_count?: number | null
        }
        Relationships: []
      }
      comment_likes: {
        Row: {
          comment_id: string
          created_at: string | null
          id: string
          type: string
          user_id: string
        }
        Insert: {
          comment_id: string
          created_at?: string | null
          id?: string
          type: string
          user_id: string
        }
        Update: {
          comment_id?: string
          created_at?: string | null
          id?: string
          type?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "comment_likes_comment_id_fkey"
            columns: ["comment_id"]
            isOneToOne: false
            referencedRelation: "comments"
            referencedColumns: ["id"]
          },
        ]
      }
      comments: {
        Row: {
          content: string
          created_at: string | null
          dislikes: number
          hidden_reason: string | null
          hidden_until: string | null
          id: string
          is_deleted: boolean | null
          is_hidden: boolean | null
          likes: number
          post_id: string | null
          updated_at: string | null
          user_id: string | null
        }
        Insert: {
          content: string
          created_at?: string | null
          dislikes?: number
          hidden_reason?: string | null
          hidden_until?: string | null
          id?: string
          is_deleted?: boolean | null
          is_hidden?: boolean | null
          likes?: number
          post_id?: string | null
          updated_at?: string | null
          user_id?: string | null
        }
        Update: {
          content?: string
          created_at?: string | null
          dislikes?: number
          hidden_reason?: string | null
          hidden_until?: string | null
          id?: string
          is_deleted?: boolean | null
          is_hidden?: boolean | null
          likes?: number
          post_id?: string | null
          updated_at?: string | null
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "comments_post_id_fkey"
            columns: ["post_id"]
            isOneToOne: false
            referencedRelation: "posts"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "comments_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      exp_history: {
        Row: {
          admin_id: string | null
          created_at: string | null
          exp: number
          id: string
          reason: string
          related_id: string | null
          user_id: string | null
        }
        Insert: {
          admin_id?: string | null
          created_at?: string | null
          exp: number
          id?: string
          reason: string
          related_id?: string | null
          user_id?: string | null
        }
        Update: {
          admin_id?: string | null
          created_at?: string | null
          exp?: number
          id?: string
          reason?: string
          related_id?: string | null
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "exp_history_related_id_fkey"
            columns: ["related_id"]
            isOneToOne: false
            referencedRelation: "posts"
            referencedColumns: ["id"]
          },
        ]
      }
      football_teams: {
        Row: {
          api_data: Json | null
          code: string | null
          country: string
          country_code: string | null
          country_ko: string | null
          created_at: string | null
          current_position: number | null
          current_season: number | null
          display_name: string
          founded: number | null
          id: number
          is_active: boolean | null
          is_winner: boolean | null
          last_api_sync: string | null
          league_id: number
          league_logo_url: string | null
          league_name: string
          league_name_ko: string | null
          logo_cached_url: string | null
          logo_url: string | null
          name: string
          name_ko: string | null
          popularity_score: number | null
          search_keywords: string[] | null
          search_vector: unknown | null
          short_name: string | null
          team_id: number
          updated_at: string | null
          venue_address: string | null
          venue_capacity: number | null
          venue_city: string | null
          venue_id: number | null
          venue_name: string | null
          venue_surface: string | null
        }
        Insert: {
          api_data?: Json | null
          code?: string | null
          country: string
          country_code?: string | null
          country_ko?: string | null
          created_at?: string | null
          current_position?: number | null
          current_season?: number | null
          display_name: string
          founded?: number | null
          id?: number
          is_active?: boolean | null
          is_winner?: boolean | null
          last_api_sync?: string | null
          league_id: number
          league_logo_url?: string | null
          league_name: string
          league_name_ko?: string | null
          logo_cached_url?: string | null
          logo_url?: string | null
          name: string
          name_ko?: string | null
          popularity_score?: number | null
          search_keywords?: string[] | null
          search_vector?: unknown | null
          short_name?: string | null
          team_id: number
          updated_at?: string | null
          venue_address?: string | null
          venue_capacity?: number | null
          venue_city?: string | null
          venue_id?: number | null
          venue_name?: string | null
          venue_surface?: string | null
        }
        Update: {
          api_data?: Json | null
          code?: string | null
          country?: string
          country_code?: string | null
          country_ko?: string | null
          created_at?: string | null
          current_position?: number | null
          current_season?: number | null
          display_name?: string
          founded?: number | null
          id?: number
          is_active?: boolean | null
          is_winner?: boolean | null
          last_api_sync?: string | null
          league_id?: number
          league_logo_url?: string | null
          league_name?: string
          league_name_ko?: string | null
          logo_cached_url?: string | null
          logo_url?: string | null
          name?: string
          name_ko?: string | null
          popularity_score?: number | null
          search_keywords?: string[] | null
          search_vector?: unknown | null
          short_name?: string | null
          team_id?: number
          updated_at?: string | null
          venue_address?: string | null
          venue_capacity?: number | null
          venue_city?: string | null
          venue_id?: number | null
          venue_name?: string | null
          venue_surface?: string | null
        }
        Relationships: []
      }
      icon_purchases: {
        Row: {
          icon_id: number
          id: string
          price: number
          purchased_at: string | null
          user_id: string
        }
        Insert: {
          icon_id: number
          id?: string
          price: number
          purchased_at?: string | null
          user_id: string
        }
        Update: {
          icon_id?: number
          id?: string
          price?: number
          purchased_at?: string | null
          user_id?: string
        }
        Relationships: []
      }
      image_cache: {
        Row: {
          cache_key: string
          cached_url: string | null
          created_at: string | null
          error_message: string | null
          expires_at: string | null
          id: number
          image_url: string
          last_attempt: string | null
          retry_count: number | null
          status: string | null
        }
        Insert: {
          cache_key: string
          cached_url?: string | null
          created_at?: string | null
          error_message?: string | null
          expires_at?: string | null
          id?: number
          image_url: string
          last_attempt?: string | null
          retry_count?: number | null
          status?: string | null
        }
        Update: {
          cache_key?: string
          cached_url?: string | null
          created_at?: string | null
          error_message?: string | null
          expires_at?: string | null
          id?: number
          image_url?: string
          last_attempt?: string | null
          retry_count?: number | null
          status?: string | null
        }
        Relationships: []
      }
      item_purchases: {
        Row: {
          id: string
          item_id: number
          price: number
          purchased_at: string | null
          user_id: string
        }
        Insert: {
          id?: string
          item_id: number
          price: number
          purchased_at?: string | null
          user_id: string
        }
        Update: {
          id?: string
          item_id?: number
          price?: number
          purchased_at?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "item_purchases_item_id_fkey"
            columns: ["item_id"]
            isOneToOne: false
            referencedRelation: "shop_items"
            referencedColumns: ["id"]
          },
        ]
      }
      leagues: {
        Row: {
          country: string
          flag: string
          id: number
          logo: string
          name: string
        }
        Insert: {
          country: string
          flag: string
          id: number
          logo: string
          name: string
        }
        Update: {
          country?: string
          flag?: string
          id?: number
          logo?: string
          name?: string
        }
        Relationships: []
      }
      login_attempts: {
        Row: {
          attempts: number | null
          blocked_until: string | null
          created_at: string | null
          email: string
          id: number
          last_attempt: string | null
        }
        Insert: {
          attempts?: number | null
          blocked_until?: string | null
          created_at?: string | null
          email: string
          id?: number
          last_attempt?: string | null
        }
        Update: {
          attempts?: number | null
          blocked_until?: string | null
          created_at?: string | null
          email?: string
          id?: number
          last_attempt?: string | null
        }
        Relationships: []
      }
      match_ai_predictions: {
        Row: {
          ai_analysis: string
          api_calls_count: number | null
          away_team_id: number
          away_team_name: string
          away_team_stats: Json | null
          betting_odds: Json | null
          created_at: string | null
          data_sources: Json | null
          expires_at: string | null
          fixture_id: number
          generation_cost_usd: number | null
          home_team_id: number
          home_team_name: string
          home_team_stats: Json | null
          id: string
          is_active: boolean | null
          last_updated: string | null
          league_id: number
          league_name: string
          match_context: Json | null
          match_date: string
          popularity_score: number | null
          prediction_summary: Json
          updated_at: string | null
          view_count: number | null
        }
        Insert: {
          ai_analysis: string
          api_calls_count?: number | null
          away_team_id: number
          away_team_name: string
          away_team_stats?: Json | null
          betting_odds?: Json | null
          created_at?: string | null
          data_sources?: Json | null
          expires_at?: string | null
          fixture_id: number
          generation_cost_usd?: number | null
          home_team_id: number
          home_team_name: string
          home_team_stats?: Json | null
          id?: string
          is_active?: boolean | null
          last_updated?: string | null
          league_id: number
          league_name: string
          match_context?: Json | null
          match_date: string
          popularity_score?: number | null
          prediction_summary: Json
          updated_at?: string | null
          view_count?: number | null
        }
        Update: {
          ai_analysis?: string
          api_calls_count?: number | null
          away_team_id?: number
          away_team_name?: string
          away_team_stats?: Json | null
          betting_odds?: Json | null
          created_at?: string | null
          data_sources?: Json | null
          expires_at?: string | null
          fixture_id?: number
          generation_cost_usd?: number | null
          home_team_id?: number
          home_team_name?: string
          home_team_stats?: Json | null
          id?: string
          is_active?: boolean | null
          last_updated?: string | null
          league_id?: number
          league_name?: string
          match_context?: Json | null
          match_date?: string
          popularity_score?: number | null
          prediction_summary?: Json
          updated_at?: string | null
          view_count?: number | null
        }
        Relationships: []
      }
      match_comment_likes: {
        Row: {
          comment_id: string
          created_at: string | null
          id: string
          type: string
          user_id: string
        }
        Insert: {
          comment_id: string
          created_at?: string | null
          id?: string
          type?: string
          user_id: string
        }
        Update: {
          comment_id?: string
          created_at?: string | null
          id?: string
          type?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "match_comment_likes_comment_id_fkey"
            columns: ["comment_id"]
            isOneToOne: false
            referencedRelation: "match_support_comments"
            referencedColumns: ["id"]
          },
        ]
      }
      match_prediction_stats: {
        Row: {
          away_votes: number | null
          draw_votes: number | null
          home_votes: number | null
          match_id: string
          total_votes: number | null
          updated_at: string | null
        }
        Insert: {
          away_votes?: number | null
          draw_votes?: number | null
          home_votes?: number | null
          match_id: string
          total_votes?: number | null
          updated_at?: string | null
        }
        Update: {
          away_votes?: number | null
          draw_votes?: number | null
          home_votes?: number | null
          match_id?: string
          total_votes?: number | null
          updated_at?: string | null
        }
        Relationships: []
      }
      match_predictions: {
        Row: {
          created_at: string | null
          id: string
          match_id: string
          prediction_type: string
          updated_at: string | null
          user_id: string
        }
        Insert: {
          created_at?: string | null
          id?: string
          match_id: string
          prediction_type: string
          updated_at?: string | null
          user_id: string
        }
        Update: {
          created_at?: string | null
          id?: string
          match_id?: string
          prediction_type?: string
          updated_at?: string | null
          user_id?: string
        }
        Relationships: []
      }
      match_support_comments: {
        Row: {
          content: string
          created_at: string | null
          dislikes_count: number
          hidden_reason: string | null
          hidden_until: string | null
          id: string
          is_deleted: boolean | null
          is_hidden: boolean | null
          likes_count: number | null
          match_id: string
          team_type: string
          updated_at: string | null
          user_id: string
        }
        Insert: {
          content: string
          created_at?: string | null
          dislikes_count?: number
          hidden_reason?: string | null
          hidden_until?: string | null
          id?: string
          is_deleted?: boolean | null
          is_hidden?: boolean | null
          likes_count?: number | null
          match_id: string
          team_type: string
          updated_at?: string | null
          user_id: string
        }
        Update: {
          content?: string
          created_at?: string | null
          dislikes_count?: number
          hidden_reason?: string | null
          hidden_until?: string | null
          id?: string
          is_deleted?: boolean | null
          is_hidden?: boolean | null
          likes_count?: number | null
          match_id?: string
          team_type?: string
          updated_at?: string | null
          user_id?: string
        }
        Relationships: []
      }
      player_images: {
        Row: {
          content_type: string | null
          created_at: string | null
          file_size: number | null
          id: number
          is_processed: boolean | null
          last_updated: string | null
          original_url: string | null
          player_id: number
          player_name: string
          storage_path: string | null
          storage_url: string | null
          team_id: number | null
          team_name: string | null
        }
        Insert: {
          content_type?: string | null
          created_at?: string | null
          file_size?: number | null
          id?: number
          is_processed?: boolean | null
          last_updated?: string | null
          original_url?: string | null
          player_id: number
          player_name: string
          storage_path?: string | null
          storage_url?: string | null
          team_id?: number | null
          team_name?: string | null
        }
        Update: {
          content_type?: string | null
          created_at?: string | null
          file_size?: number | null
          id?: number
          is_processed?: boolean | null
          last_updated?: string | null
          original_url?: string | null
          player_id?: number
          player_name?: string
          storage_path?: string | null
          storage_url?: string | null
          team_id?: number | null
          team_name?: string | null
        }
        Relationships: []
      }
      point_history: {
        Row: {
          admin_id: string | null
          created_at: string | null
          id: string
          points: number
          reason: string
          user_id: string | null
        }
        Insert: {
          admin_id?: string | null
          created_at?: string | null
          id?: string
          points: number
          reason: string
          user_id?: string | null
        }
        Update: {
          admin_id?: string | null
          created_at?: string | null
          id?: string
          points?: number
          reason?: string
          user_id?: string | null
        }
        Relationships: []
      }
      point_transactions: {
        Row: {
          created_at: string | null
          description: string | null
          id: string
          match_id: string | null
          points: number
          transaction_type: string
          user_id: string
        }
        Insert: {
          created_at?: string | null
          description?: string | null
          id?: string
          match_id?: string | null
          points: number
          transaction_type: string
          user_id: string
        }
        Update: {
          created_at?: string | null
          description?: string | null
          id?: string
          match_id?: string | null
          points?: number
          transaction_type?: string
          user_id?: string
        }
        Relationships: []
      }
      post_boards: {
        Row: {
          board_id: string
          created_at: string | null
          id: string
          post_id: string
        }
        Insert: {
          board_id: string
          created_at?: string | null
          id?: string
          post_id: string
        }
        Update: {
          board_id?: string
          created_at?: string | null
          id?: string
          post_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "post_boards_board_id_fkey"
            columns: ["board_id"]
            isOneToOne: false
            referencedRelation: "boards"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "post_boards_post_id_fkey"
            columns: ["post_id"]
            isOneToOne: false
            referencedRelation: "posts"
            referencedColumns: ["id"]
          },
        ]
      }
      post_files: {
        Row: {
          content_type: string | null
          created_at: string | null
          filename: string
          filesize: number | null
          id: string
          post_id: string
          updated_at: string | null
          url: string
        }
        Insert: {
          content_type?: string | null
          created_at?: string | null
          filename: string
          filesize?: number | null
          id?: string
          post_id: string
          updated_at?: string | null
          url: string
        }
        Update: {
          content_type?: string | null
          created_at?: string | null
          filename?: string
          filesize?: number | null
          id?: string
          post_id?: string
          updated_at?: string | null
          url?: string
        }
        Relationships: [
          {
            foreignKeyName: "post_files_post_id_fkey"
            columns: ["post_id"]
            isOneToOne: false
            referencedRelation: "posts"
            referencedColumns: ["id"]
          },
        ]
      }
      post_likes: {
        Row: {
          created_at: string | null
          id: string
          post_id: string
          type: string
          user_id: string
        }
        Insert: {
          created_at?: string | null
          id?: string
          post_id: string
          type?: string
          user_id: string
        }
        Update: {
          created_at?: string | null
          id?: string
          post_id?: string
          type?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "post_likes_post_id_fkey"
            columns: ["post_id"]
            isOneToOne: false
            referencedRelation: "posts"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "post_likes_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      posts: {
        Row: {
          board_id: string | null
          category: string
          content: Json
          created_at: string | null
          dislikes: number
          hidden_reason: string | null
          hidden_until: string | null
          id: string
          is_deleted: boolean | null
          is_hidden: boolean | null
          is_published: boolean | null
          likes: number | null
          meta: Json | null
          post_number: number
          source_url: string | null
          status: string | null
          tags: string[] | null
          title: string
          updated_at: string | null
          user_id: string
          views: number | null
        }
        Insert: {
          board_id?: string | null
          category?: string
          content: Json
          created_at?: string | null
          dislikes?: number
          hidden_reason?: string | null
          hidden_until?: string | null
          id?: string
          is_deleted?: boolean | null
          is_hidden?: boolean | null
          is_published?: boolean | null
          likes?: number | null
          meta?: Json | null
          post_number?: number
          source_url?: string | null
          status?: string | null
          tags?: string[] | null
          title: string
          updated_at?: string | null
          user_id: string
          views?: number | null
        }
        Update: {
          board_id?: string | null
          category?: string
          content?: Json
          created_at?: string | null
          dislikes?: number
          hidden_reason?: string | null
          hidden_until?: string | null
          id?: string
          is_deleted?: boolean | null
          is_hidden?: boolean | null
          is_published?: boolean | null
          likes?: number | null
          meta?: Json | null
          post_number?: number
          source_url?: string | null
          status?: string | null
          tags?: string[] | null
          title?: string
          updated_at?: string | null
          user_id?: string
          views?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "posts_board_id_fkey"
            columns: ["board_id"]
            isOneToOne: false
            referencedRelation: "boards"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "posts_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      prediction_automation_logs: {
        Row: {
          created_at: string | null
          details: Json | null
          error_message: string | null
          execution_time_ms: number | null
          id: string
          matches_processed: number | null
          posts_created: number | null
          status: string
          trigger_type: string
        }
        Insert: {
          created_at?: string | null
          details?: Json | null
          error_message?: string | null
          execution_time_ms?: number | null
          id?: string
          matches_processed?: number | null
          posts_created?: number | null
          status: string
          trigger_type: string
        }
        Update: {
          created_at?: string | null
          details?: Json | null
          error_message?: string | null
          execution_time_ms?: number | null
          id?: string
          matches_processed?: number | null
          posts_created?: number | null
          status?: string
          trigger_type?: string
        }
        Relationships: []
      }
      profiles: {
        Row: {
          email: string | null
          exp: number | null
          full_name: string | null
          icon_id: number | null
          id: string
          is_admin: boolean | null
          is_suspended: boolean | null
          level: number | null
          nickname: string | null
          points: number | null
          suspended_reason: string | null
          suspended_until: string | null
          updated_at: string | null
          username: string | null
        }
        Insert: {
          email?: string | null
          exp?: number | null
          full_name?: string | null
          icon_id?: number | null
          id: string
          is_admin?: boolean | null
          is_suspended?: boolean | null
          level?: number | null
          nickname?: string | null
          points?: number | null
          suspended_reason?: string | null
          suspended_until?: string | null
          updated_at?: string | null
          username?: string | null
        }
        Update: {
          email?: string | null
          exp?: number | null
          full_name?: string | null
          icon_id?: number | null
          id?: string
          is_admin?: boolean | null
          is_suspended?: boolean | null
          level?: number | null
          nickname?: string | null
          points?: number | null
          suspended_reason?: string | null
          suspended_until?: string | null
          updated_at?: string | null
          username?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "profiles_icon_id_fkey"
            columns: ["icon_id"]
            isOneToOne: false
            referencedRelation: "shop_items"
            referencedColumns: ["id"]
          },
        ]
      }
      reports: {
        Row: {
          created_at: string | null
          description: string | null
          id: string
          reason: string
          reporter_id: string
          reviewed_at: string | null
          reviewed_by: string | null
          status: string
          target_id: string
          target_type: string
          updated_at: string | null
        }
        Insert: {
          created_at?: string | null
          description?: string | null
          id?: string
          reason: string
          reporter_id: string
          reviewed_at?: string | null
          reviewed_by?: string | null
          status?: string
          target_id: string
          target_type: string
          updated_at?: string | null
        }
        Update: {
          created_at?: string | null
          description?: string | null
          id?: string
          reason?: string
          reporter_id?: string
          reviewed_at?: string | null
          reviewed_by?: string | null
          status?: string
          target_id?: string
          target_type?: string
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "reports_reporter_id_fkey"
            columns: ["reporter_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "reports_reviewed_by_fkey"
            columns: ["reviewed_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      rss_automation_logs: {
        Row: {
          created_at: string | null
          details: Json | null
          error_message: string | null
          execution_time_ms: number | null
          feeds_processed: number | null
          id: string
          posts_imported: number | null
          status: string
          trigger_type: string
        }
        Insert: {
          created_at?: string | null
          details?: Json | null
          error_message?: string | null
          execution_time_ms?: number | null
          feeds_processed?: number | null
          id?: string
          posts_imported?: number | null
          status: string
          trigger_type: string
        }
        Update: {
          created_at?: string | null
          details?: Json | null
          error_message?: string | null
          execution_time_ms?: number | null
          feeds_processed?: number | null
          id?: string
          posts_imported?: number | null
          status?: string
          trigger_type?: string
        }
        Relationships: []
      }
      rss_feeds: {
        Row: {
          board_id: string
          created_at: string | null
          description: string | null
          error_count: number | null
          id: string
          is_active: boolean | null
          last_error: string | null
          last_error_at: string | null
          last_fetched_at: string | null
          name: string | null
          url: string
        }
        Insert: {
          board_id: string
          created_at?: string | null
          description?: string | null
          error_count?: number | null
          id?: string
          is_active?: boolean | null
          last_error?: string | null
          last_error_at?: string | null
          last_fetched_at?: string | null
          name?: string | null
          url: string
        }
        Update: {
          board_id?: string
          created_at?: string | null
          description?: string | null
          error_count?: number | null
          id?: string
          is_active?: boolean | null
          last_error?: string | null
          last_error_at?: string | null
          last_fetched_at?: string | null
          name?: string | null
          url?: string
        }
        Relationships: [
          {
            foreignKeyName: "rss_feeds_board_id_fkey"
            columns: ["board_id"]
            isOneToOne: false
            referencedRelation: "boards"
            referencedColumns: ["id"]
          },
        ]
      }
      rss_posts: {
        Row: {
          author: string | null
          created_at: string | null
          description: string | null
          feed_id: string
          id: string
          image_url: string | null
          is_processed: boolean | null
          published_at: string
          source_url: string
          title: string
        }
        Insert: {
          author?: string | null
          created_at?: string | null
          description?: string | null
          feed_id: string
          id?: string
          image_url?: string | null
          is_processed?: boolean | null
          published_at: string
          source_url: string
          title: string
        }
        Update: {
          author?: string | null
          created_at?: string | null
          description?: string | null
          feed_id?: string
          id?: string
          image_url?: string | null
          is_processed?: boolean | null
          published_at?: string
          source_url?: string
          title?: string
        }
        Relationships: [
          {
            foreignKeyName: "rss_posts_feed_id_fkey"
            columns: ["feed_id"]
            isOneToOne: false
            referencedRelation: "rss_feeds"
            referencedColumns: ["id"]
          },
        ]
      }
      search_logs: {
        Row: {
          clicked_result_id: string | null
          clicked_result_type: string | null
          created_at: string | null
          id: string
          ip_address: unknown | null
          results_count: number | null
          search_duration_ms: number | null
          search_query: string
          search_type: string
          session_id: string | null
          user_agent: string | null
          user_id: string | null
        }
        Insert: {
          clicked_result_id?: string | null
          clicked_result_type?: string | null
          created_at?: string | null
          id?: string
          ip_address?: unknown | null
          results_count?: number | null
          search_duration_ms?: number | null
          search_query: string
          search_type: string
          session_id?: string | null
          user_agent?: string | null
          user_id?: string | null
        }
        Update: {
          clicked_result_id?: string | null
          clicked_result_type?: string | null
          created_at?: string | null
          id?: string
          ip_address?: unknown | null
          results_count?: number | null
          search_duration_ms?: number | null
          search_query?: string
          search_type?: string
          session_id?: string | null
          user_agent?: string | null
          user_id?: string | null
        }
        Relationships: []
      }
      shop_categories: {
        Row: {
          created_at: string | null
          description: string | null
          display_order: number | null
          id: number
          image_url: string | null
          is_active: boolean | null
          name: string
          parent_id: number | null
          slug: string
        }
        Insert: {
          created_at?: string | null
          description?: string | null
          display_order?: number | null
          id?: number
          image_url?: string | null
          is_active?: boolean | null
          name: string
          parent_id?: number | null
          slug: string
        }
        Update: {
          created_at?: string | null
          description?: string | null
          display_order?: number | null
          id?: number
          image_url?: string | null
          is_active?: boolean | null
          name?: string
          parent_id?: number | null
          slug?: string
        }
        Relationships: [
          {
            foreignKeyName: "shop_categories_parent_id_fkey"
            columns: ["parent_id"]
            isOneToOne: false
            referencedRelation: "shop_categories"
            referencedColumns: ["id"]
          },
        ]
      }
      shop_items: {
        Row: {
          category_id: number | null
          created_at: string | null
          description: string | null
          id: number
          image_url: string
          is_active: boolean | null
          is_default: boolean | null
          name: string
          price: number
        }
        Insert: {
          category_id?: number | null
          created_at?: string | null
          description?: string | null
          id?: number
          image_url: string
          is_active?: boolean | null
          is_default?: boolean | null
          name: string
          price?: number
        }
        Update: {
          category_id?: number | null
          created_at?: string | null
          description?: string | null
          id?: number
          image_url?: string
          is_active?: boolean | null
          is_default?: boolean | null
          name?: string
          price?: number
        }
        Relationships: [
          {
            foreignKeyName: "shop_items_category_id_fkey"
            columns: ["category_id"]
            isOneToOne: false
            referencedRelation: "shop_categories"
            referencedColumns: ["id"]
          },
        ]
      }
      teams: {
        Row: {
          country: string | null
          country_ko: string | null
          founded: number | null
          id: number
          logo: string | null
          name: string
          name_ko: string | null
          venue_capacity: number | null
          venue_city: string | null
          venue_name: string | null
        }
        Insert: {
          country?: string | null
          country_ko?: string | null
          founded?: number | null
          id: number
          logo?: string | null
          name: string
          name_ko?: string | null
          venue_capacity?: number | null
          venue_city?: string | null
          venue_name?: string | null
        }
        Update: {
          country?: string | null
          country_ko?: string | null
          founded?: number | null
          id?: number
          logo?: string | null
          name?: string
          name_ko?: string | null
          venue_capacity?: number | null
          venue_city?: string | null
          venue_name?: string | null
        }
        Relationships: []
      }
      user_icons: {
        Row: {
          icon_id: number
          id: string
          purchased_at: string | null
          user_id: string
        }
        Insert: {
          icon_id: number
          id?: string
          purchased_at?: string | null
          user_id: string
        }
        Update: {
          icon_id?: number
          id?: string
          purchased_at?: string | null
          user_id?: string
        }
        Relationships: []
      }
      user_items: {
        Row: {
          id: string
          item_id: number
          purchased_at: string | null
          user_id: string
        }
        Insert: {
          id?: string
          item_id: number
          purchased_at?: string | null
          user_id: string
        }
        Update: {
          id?: string
          item_id?: number
          purchased_at?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "user_items_item_id_fkey"
            columns: ["item_id"]
            isOneToOne: false
            referencedRelation: "shop_items"
            referencedColumns: ["id"]
          },
        ]
      }
      user_sessions: {
        Row: {
          created_at: string | null
          device_info: Json | null
          ended_at: string | null
          id: number
          ip_address: unknown | null
          is_active: boolean | null
          last_activity: string | null
          session_id: string
          user_id: string
        }
        Insert: {
          created_at?: string | null
          device_info?: Json | null
          ended_at?: string | null
          id?: number
          ip_address?: unknown | null
          is_active?: boolean | null
          last_activity?: string | null
          session_id: string
          user_id: string
        }
        Update: {
          created_at?: string | null
          device_info?: Json | null
          ended_at?: string | null
          id?: number
          ip_address?: unknown | null
          is_active?: boolean | null
          last_activity?: string | null
          session_id?: string
          user_id?: string
        }
        Relationships: []
      }
      verification_codes: {
        Row: {
          code: string
          created_at: string | null
          email: string
          expires_at: string
          id: string
          token: string | null
          type: string
          updated_at: string | null
          used_at: string | null
        }
        Insert: {
          code: string
          created_at?: string | null
          email: string
          expires_at: string
          id?: string
          token?: string | null
          type: string
          updated_at?: string | null
          used_at?: string | null
        }
        Update: {
          code?: string
          created_at?: string | null
          email?: string
          expires_at?: string
          id?: string
          token?: string | null
          type?: string
          updated_at?: string | null
          used_at?: string | null
        }
        Relationships: []
      }
      youtube_channels: {
        Row: {
          api_key: string
          auto_publish: boolean | null
          board_id: string
          channel_id: string
          channel_name: string
          created_at: string | null
          id: string
          last_crawled_at: string | null
          playlist_id: string | null
          updated_at: string | null
        }
        Insert: {
          api_key: string
          auto_publish?: boolean | null
          board_id: string
          channel_id: string
          channel_name: string
          created_at?: string | null
          id?: string
          last_crawled_at?: string | null
          playlist_id?: string | null
          updated_at?: string | null
        }
        Update: {
          api_key?: string
          auto_publish?: boolean | null
          board_id?: string
          channel_id?: string
          channel_name?: string
          created_at?: string | null
          id?: string
          last_crawled_at?: string | null
          playlist_id?: string | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "youtube_channels_board_id_fkey"
            columns: ["board_id"]
            isOneToOne: false
            referencedRelation: "boards"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Views: {
      match_support_stats: {
        Row: {
          comment_count: number | null
          match_id: string | null
          team_type: string | null
          total_dislikes: number | null
          total_likes: number | null
        }
        Relationships: []
      }
      popular_searches: {
        Row: {
          avg_results: number | null
          last_searched: string | null
          search_count: number | null
          search_query: string | null
          search_type: string | null
          unique_users: number | null
        }
        Relationships: []
      }
    }
    Functions: {
      admin_adjust_exp: {
        Args: {
          admin_id: string
          target_user_id: string
          exp_amount: number
          reason_text: string
        }
        Returns: boolean
      }
      admin_adjust_points: {
        Args: {
          admin_id: string
          target_user_id: string
          points_amount: number
          reason_text: string
        }
        Returns: boolean
      }
      change_profile_icon: {
        Args: { p_user_id: string; p_icon_id: number }
        Returns: boolean
      }
      cleanup_expired_data: {
        Args: Record<PropertyKey, never>
        Returns: undefined
      }
      cleanup_expired_predictions: {
        Args: Record<PropertyKey, never>
        Returns: undefined
      }
      cleanup_old_logs: {
        Args: { days_to_keep?: number }
        Returns: undefined
      }
      create_youtube_channels_table: {
        Args: Record<PropertyKey, never>
        Returns: undefined
      }
      delete_current_user: {
        Args: Record<PropertyKey, never>
        Returns: undefined
      }
      delete_expired_verification_codes: {
        Args: Record<PropertyKey, never>
        Returns: undefined
      }
      delete_user_data: {
        Args: { user_uuid: string }
        Returns: boolean
      }
      delete_user_posts: {
        Args: { user_uuid: string }
        Returns: undefined
      }
      get_application_logs: {
        Args: {
          p_level?: string
          p_category?: string
          p_action?: string
          p_user_id?: string
          p_start_date?: string
          p_end_date?: string
          p_search?: string
          p_page?: number
          p_limit?: number
        }
        Returns: {
          id: string
          level: string
          category: string
          action: string
          message: string
          user_id: string
          session_id: string
          ip_address: string
          user_agent: string
          request_id: string
          endpoint: string
          method: string
          status_code: number
          response_time_ms: number
          metadata: Json
          error_code: string
          error_details: string
          stack_trace: string
          created_at: string
          updated_at: string
        }[]
      }
      get_application_logs_count: {
        Args: {
          p_level?: string
          p_category?: string
          p_action?: string
          p_user_id?: string
          p_start_date?: string
          p_end_date?: string
          p_search?: string
        }
        Returns: number
      }
      get_auth_users_info: {
        Args: Record<PropertyKey, never>
        Returns: {
          id: string
          email: string
          last_sign_in_at: string
          created_at: string
        }[]
      }
      get_comment_with_counts: {
        Args: { comment_id: string }
        Returns: {
          likes_count: number
          dislikes_count: number
        }[]
      }
      get_log_statistics: {
        Args: { p_period?: string }
        Returns: Json
      }
      get_match_prediction: {
        Args: { p_fixture_id: number }
        Returns: {
          id: string
          fixture_id: number
          home_team_id: number
          home_team_name: string
          away_team_id: number
          away_team_name: string
          match_date: string
          league_id: number
          league_name: string
          prediction_summary: Json
          ai_analysis: string
          home_team_stats: Json
          away_team_stats: Json
          match_context: Json
          data_sources: Json
          api_calls_count: number
          generation_cost_usd: number
          is_active: boolean
          expires_at: string
          last_updated: string
          popularity_score: number
          view_count: number
          created_at: string
          updated_at: string
        }[]
      }
      get_post_detail: {
        Args: { board_slug: string; post_num: number }
        Returns: Json
      }
      get_user_last_sign_in: {
        Args: { user_id: string }
        Returns: string
      }
      get_user_last_signin: {
        Args: { user_id: string }
        Returns: string
      }
      get_user_profile_direct: {
        Args: { user_id: string }
        Returns: {
          id: string
          icon_id: number
          level: number
          exp: number
        }[]
      }
      get_users_with_last_access: {
        Args: Record<PropertyKey, never>
        Returns: {
          id: string
          email: string
          nickname: string
          full_name: string
          is_admin: boolean
          updated_at: string
          is_suspended: boolean
          suspended_until: string
          suspended_reason: string
          last_sign_in_at: string
          auth_created_at: string
        }[]
      }
      increment_post_view: {
        Args: { post_id: string }
        Returns: undefined
      }
      increment_prediction_views: {
        Args: { p_fixture_id: number }
        Returns: undefined
      }
      increment_view_count: {
        Args: { post_id: string }
        Returns: undefined
      }
      insert_application_log: {
        Args: {
          p_level: string
          p_category: string
          p_action: string
          p_message: string
          p_user_id?: string
          p_session_id?: string
          p_ip_address?: string
          p_user_agent?: string
          p_request_id?: string
          p_endpoint?: string
          p_method?: string
          p_status_code?: number
          p_response_time_ms?: number
          p_metadata?: Json
          p_error_code?: string
          p_error_details?: string
          p_stack_trace?: string
        }
        Returns: undefined
      }
      is_admin: {
        Args: Record<PropertyKey, never>
        Returns: boolean
      }
      log_api_request: {
        Args: {
          p_endpoint: string
          p_method: string
          p_status_code: number
          p_response_time_ms: number
          p_user_id?: string
          p_ip_address?: string
          p_user_agent?: string
          p_request_id?: string
          p_metadata?: Json
        }
        Returns: undefined
      }
      log_error: {
        Args: {
          p_category: string
          p_action: string
          p_message: string
          p_error_code?: string
          p_error_details?: string
          p_stack_trace?: string
          p_user_id?: string
          p_metadata?: Json
        }
        Returns: undefined
      }
      log_event: {
        Args: {
          p_level: string
          p_category: string
          p_action: string
          p_message: string
          p_user_id?: string
          p_metadata?: Json
        }
        Returns: undefined
      }
      log_system_event: {
        Args: { p_action: string; p_message: string; p_metadata?: Json }
        Returns: undefined
      }
      log_user_action: {
        Args: {
          p_action: string
          p_message: string
          p_user_id: string
          p_metadata?: Json
        }
        Returns: undefined
      }
      populate_football_teams_from_leagues: {
        Args: Record<PropertyKey, never>
        Returns: undefined
      }
      purchase_item: {
        Args: { p_user_id: string; p_item_id: number }
        Returns: boolean
      }
      purchase_profile_icon: {
        Args: { p_user_id: string; p_icon_id: number }
        Returns: boolean
      }
      save_match_prediction: {
        Args: {
          p_fixture_id: number
          p_home_team_id: number
          p_home_team_name: string
          p_away_team_id: number
          p_away_team_name: string
          p_match_date: string
          p_league_id: number
          p_league_name: string
          p_prediction_summary: Json
          p_ai_analysis: string
          p_home_team_stats?: Json
          p_away_team_stats?: Json
          p_match_context?: Json
          p_data_sources?: Json
          p_api_calls_count?: number
          p_generation_cost_usd?: number
        }
        Returns: {
          id: string
          fixture_id: number
          created_at: string
        }[]
      }
      toggle_post_dislike: {
        Args: { post_id: string; user_id: string }
        Returns: boolean
      }
      toggle_post_like: {
        Args: { post_id: string; user_id: string }
        Returns: boolean
      }
      update_match_prediction_stats: {
        Args: { p_match_id: string }
        Returns: undefined
      }
      update_post_like_count: {
        Args: { post_id: string }
        Returns: undefined
      }
      update_post_with_board: {
        Args: {
          p_id: string
          p_title: string
          p_content: string
          p_board_id: string
        }
        Returns: boolean
      }
      update_profile_directly: {
        Args: {
          p_user_id: string
          p_username: string
          p_email: string
          p_nickname: string
          p_full_name: string
        }
        Returns: undefined
      }
    }
    Enums: {
      [_ in never]: never
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}

type DatabaseWithoutInternals = Omit<Database, "__InternalSupabase">

type DefaultSchema = DatabaseWithoutInternals[Extract<keyof Database, "public">]

export type Tables<
  DefaultSchemaTableNameOrOptions extends
    | keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
      DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])[TableName] extends {
      Row: infer R
    }
    ? R
    : never
  : DefaultSchemaTableNameOrOptions extends keyof (DefaultSchema["Tables"] &
        DefaultSchema["Views"])
    ? (DefaultSchema["Tables"] &
        DefaultSchema["Views"])[DefaultSchemaTableNameOrOptions] extends {
        Row: infer R
      }
      ? R
      : never
    : never

export type TablesInsert<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Insert: infer I
    }
    ? I
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Insert: infer I
      }
      ? I
      : never
    : never

export type TablesUpdate<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Update: infer U
    }
    ? U
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Update: infer U
      }
      ? U
      : never
    : never

export type Enums<
  DefaultSchemaEnumNameOrOptions extends
    | keyof DefaultSchema["Enums"]
    | { schema: keyof DatabaseWithoutInternals },
  EnumName extends DefaultSchemaEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never = never,
> = DefaultSchemaEnumNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"][EnumName]
  : DefaultSchemaEnumNameOrOptions extends keyof DefaultSchema["Enums"]
    ? DefaultSchema["Enums"][DefaultSchemaEnumNameOrOptions]
    : never

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
    | keyof DefaultSchema["CompositeTypes"]
    | { schema: keyof DatabaseWithoutInternals },
  CompositeTypeName extends PublicCompositeTypeNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never = never,
> = PublicCompositeTypeNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema["CompositeTypes"]
    ? DefaultSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
    : never

export const Constants = {
  public: {
    Enums: {},
  },
} as const
