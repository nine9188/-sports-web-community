export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  // Allows to automatically instantiate createClient with right options
  // instead of createClient<Database, { PostgrestVersion: 'XX' }>(URL, KEY)
  __InternalSupabase: {
    PostgrestVersion: "12.2.3 (519615d)"
  }
  public: {
    Tables: {
      admin_notification_logs: {
        Row: {
          admin_id: string
          created_at: string
          id: string
          link: string | null
          message: string
          send_mode: string
          target_user_ids: string[] | null
          title: string
          total_failed: number
          total_sent: number
        }
        Insert: {
          admin_id: string
          created_at?: string
          id?: string
          link?: string | null
          message: string
          send_mode: string
          target_user_ids?: string[] | null
          title: string
          total_failed?: number
          total_sent?: number
        }
        Update: {
          admin_id?: string
          created_at?: string
          id?: string
          link?: string | null
          message?: string
          send_mode?: string
          target_user_ids?: string[] | null
          title?: string
          total_failed?: number
          total_sent?: number
        }
        Relationships: [
          {
            foreignKeyName: "admin_notification_logs_admin_id_fkey"
            columns: ["admin_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      application_logs: {
        Row: {
          action: string
          category: string
          created_at: string | null
          endpoint: string | null
          error_code: string | null
          error_details: Json | null
          id: string
          ip_address: unknown
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
          ip_address?: unknown
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
          ip_address?: unknown
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
      asset_cache: {
        Row: {
          checked_at: string | null
          content_hash: string | null
          created_at: string | null
          entity_id: number
          error_message: string | null
          etag: string | null
          id: string
          last_modified: string | null
          source_url: string | null
          status: string
          storage_path: string
          type: string
          updated_at: string | null
        }
        Insert: {
          checked_at?: string | null
          content_hash?: string | null
          created_at?: string | null
          entity_id: number
          error_message?: string | null
          etag?: string | null
          id?: string
          last_modified?: string | null
          source_url?: string | null
          status?: string
          storage_path: string
          type: string
          updated_at?: string | null
        }
        Update: {
          checked_at?: string | null
          content_hash?: string | null
          created_at?: string | null
          entity_id?: number
          error_message?: string | null
          etag?: string | null
          id?: string
          last_modified?: string | null
          source_url?: string | null
          status?: string
          storage_path?: string
          type?: string
          updated_at?: string | null
        }
        Relationships: []
      }
      board_collection_widget_settings: {
        Row: {
          board_id: string
          created_at: string | null
          display_order: number
          id: string
          is_active: boolean
          updated_at: string | null
        }
        Insert: {
          board_id: string
          created_at?: string | null
          display_order?: number
          id?: string
          is_active?: boolean
          updated_at?: string | null
        }
        Update: {
          board_id?: string
          created_at?: string | null
          display_order?: number
          id?: string
          is_active?: boolean
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "board_collection_widget_settings_board_id_fkey"
            columns: ["board_id"]
            isOneToOne: true
            referencedRelation: "boards"
            referencedColumns: ["id"]
          },
        ]
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
          view_type: string
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
          view_type?: string
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
          view_type?: string
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
          parent_id: string | null
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
          parent_id?: string | null
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
          parent_id?: string | null
          post_id?: string | null
          updated_at?: string | null
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "comments_parent_id_fkey"
            columns: ["parent_id"]
            isOneToOne: false
            referencedRelation: "comments"
            referencedColumns: ["id"]
          },
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
      football_players: {
        Row: {
          age: number | null
          api_data: Json | null
          created_at: string | null
          display_name: string
          height: number | null
          id: number
          is_active: boolean | null
          korean_name: string | null
          last_api_sync: string | null
          name: string
          nationality: string | null
          nationality_ko: string | null
          number: number | null
          photo_cached_url: string | null
          photo_url: string | null
          player_id: number
          popularity_score: number | null
          position: string | null
          search_keywords: string[] | null
          search_vector: unknown
          team_id: number
          team_name: string | null
          updated_at: string | null
          weight: number | null
        }
        Insert: {
          age?: number | null
          api_data?: Json | null
          created_at?: string | null
          display_name: string
          height?: number | null
          id?: number
          is_active?: boolean | null
          korean_name?: string | null
          last_api_sync?: string | null
          name: string
          nationality?: string | null
          nationality_ko?: string | null
          number?: number | null
          photo_cached_url?: string | null
          photo_url?: string | null
          player_id: number
          popularity_score?: number | null
          position?: string | null
          search_keywords?: string[] | null
          search_vector?: unknown
          team_id: number
          team_name?: string | null
          updated_at?: string | null
          weight?: number | null
        }
        Update: {
          age?: number | null
          api_data?: Json | null
          created_at?: string | null
          display_name?: string
          height?: number | null
          id?: number
          is_active?: boolean | null
          korean_name?: string | null
          last_api_sync?: string | null
          name?: string
          nationality?: string | null
          nationality_ko?: string | null
          number?: number | null
          photo_cached_url?: string | null
          photo_url?: string | null
          player_id?: number
          popularity_score?: number | null
          position?: string | null
          search_keywords?: string[] | null
          search_vector?: unknown
          team_id?: number
          team_name?: string | null
          updated_at?: string | null
          weight?: number | null
        }
        Relationships: []
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
          search_vector: unknown
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
          search_vector?: unknown
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
          search_vector?: unknown
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
      item_usage_log: {
        Row: {
          id: string
          item_id: number
          usage_details: Json | null
          usage_type: string
          used_at: string | null
          user_id: string
          user_item_id: string
        }
        Insert: {
          id?: string
          item_id: number
          usage_details?: Json | null
          usage_type: string
          used_at?: string | null
          user_id: string
          user_item_id: string
        }
        Update: {
          id?: string
          item_id?: number
          usage_details?: Json | null
          usage_type?: string
          used_at?: string | null
          user_id?: string
          user_item_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "item_usage_log_item_id_fkey"
            columns: ["item_id"]
            isOneToOne: false
            referencedRelation: "shop_items"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "item_usage_log_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
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
      login_history: {
        Row: {
          created_at: string | null
          id: string
          login_date: string
          user_id: string
        }
        Insert: {
          created_at?: string | null
          id?: string
          login_date?: string
          user_id: string
        }
        Update: {
          created_at?: string | null
          id?: string
          login_date?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "login_history_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
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
      match_cache: {
        Row: {
          data: Json
          data_type: string
          id: number
          match_id: number
          match_status: string
          updated_at: string | null
        }
        Insert: {
          data: Json
          data_type: string
          id?: never
          match_id: number
          match_status?: string
          updated_at?: string | null
        }
        Update: {
          data?: Json
          data_type?: string
          id?: never
          match_id?: number
          match_status?: string
          updated_at?: string | null
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
      match_highlights: {
        Row: {
          channel_name: string | null
          created_at: string | null
          fixture_id: number
          id: string
          league_id: number
          published_at: string | null
          source_type: string
          thumbnail_url: string | null
          updated_at: string | null
          video_id: string
          video_title: string | null
        }
        Insert: {
          channel_name?: string | null
          created_at?: string | null
          fixture_id: number
          id?: string
          league_id: number
          published_at?: string | null
          source_type?: string
          thumbnail_url?: string | null
          updated_at?: string | null
          video_id: string
          video_title?: string | null
        }
        Update: {
          channel_name?: string | null
          created_at?: string | null
          fixture_id?: number
          id?: string
          league_id?: number
          published_at?: string | null
          source_type?: string
          thumbnail_url?: string | null
          updated_at?: string | null
          video_id?: string
          video_title?: string | null
        }
        Relationships: []
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
      notifications: {
        Row: {
          actor_id: string | null
          created_at: string | null
          id: string
          is_read: boolean | null
          link: string | null
          message: string | null
          metadata: Json | null
          title: string
          type: string
          user_id: string
        }
        Insert: {
          actor_id?: string | null
          created_at?: string | null
          id?: string
          is_read?: boolean | null
          link?: string | null
          message?: string | null
          metadata?: Json | null
          title: string
          type: string
          user_id: string
        }
        Update: {
          actor_id?: string | null
          created_at?: string | null
          id?: string
          is_read?: boolean | null
          link?: string | null
          message?: string | null
          metadata?: Json | null
          title?: string
          type?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "notifications_actor_id_fkey"
            columns: ["actor_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "notifications_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      phone_verifications: {
        Row: {
          attempts: number | null
          code: string
          created_at: string | null
          expires_at: string
          id: string
          phone_number: string
          user_id: string | null
          verified: boolean | null
        }
        Insert: {
          attempts?: number | null
          code: string
          created_at?: string | null
          expires_at: string
          id?: string
          phone_number: string
          user_id?: string | null
          verified?: boolean | null
        }
        Update: {
          attempts?: number | null
          code?: string
          created_at?: string | null
          expires_at?: string
          id?: string
          phone_number?: string
          user_id?: string | null
          verified?: boolean | null
        }
        Relationships: [
          {
            foreignKeyName: "phone_verifications_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
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
      post_card_links: {
        Row: {
          card_type: string
          created_at: string | null
          id: string
          match_id: string | null
          player_id: number | null
          post_id: string
          team_id: number | null
        }
        Insert: {
          card_type: string
          created_at?: string | null
          id?: string
          match_id?: string | null
          player_id?: number | null
          post_id: string
          team_id?: number | null
        }
        Update: {
          card_type?: string
          created_at?: string | null
          id?: string
          match_id?: string | null
          player_id?: number | null
          post_id?: string
          team_id?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "post_card_links_post_id_fkey"
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
          deal_info: Json | null
          dislikes: number
          hidden_reason: string | null
          hidden_until: string | null
          id: string
          is_deleted: boolean | null
          is_hidden: boolean | null
          is_must_read: boolean | null
          is_notice: boolean | null
          is_published: boolean | null
          likes: number | null
          meta: Json | null
          notice_boards: string[] | null
          notice_created_at: string | null
          notice_order: number | null
          notice_type: string | null
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
          deal_info?: Json | null
          dislikes?: number
          hidden_reason?: string | null
          hidden_until?: string | null
          id?: string
          is_deleted?: boolean | null
          is_hidden?: boolean | null
          is_must_read?: boolean | null
          is_notice?: boolean | null
          is_published?: boolean | null
          likes?: number | null
          meta?: Json | null
          notice_boards?: string[] | null
          notice_created_at?: string | null
          notice_order?: number | null
          notice_type?: string | null
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
          deal_info?: Json | null
          dislikes?: number
          hidden_reason?: string | null
          hidden_until?: string | null
          id?: string
          is_deleted?: boolean | null
          is_hidden?: boolean | null
          is_must_read?: boolean | null
          is_notice?: boolean | null
          is_published?: boolean | null
          likes?: number | null
          meta?: Json | null
          notice_boards?: string[] | null
          notice_created_at?: string | null
          notice_order?: number | null
          notice_type?: string | null
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
          birth_date: string | null
          email: string | null
          email_confirmed: boolean | null
          email_confirmed_at: string | null
          exp: number | null
          full_name: string | null
          icon_id: number | null
          id: string
          is_admin: boolean | null
          is_suspended: boolean | null
          level: number | null
          nickname: string | null
          phone_number: string | null
          phone_verified: boolean | null
          phone_verified_at: string | null
          points: number | null
          public_id: string
          referral_count: number | null
          referred_by: string | null
          suspended_reason: string | null
          suspended_until: string | null
          updated_at: string | null
          username: string | null
        }
        Insert: {
          birth_date?: string | null
          email?: string | null
          email_confirmed?: boolean | null
          email_confirmed_at?: string | null
          exp?: number | null
          full_name?: string | null
          icon_id?: number | null
          id: string
          is_admin?: boolean | null
          is_suspended?: boolean | null
          level?: number | null
          nickname?: string | null
          phone_number?: string | null
          phone_verified?: boolean | null
          phone_verified_at?: string | null
          points?: number | null
          public_id?: string
          referral_count?: number | null
          referred_by?: string | null
          suspended_reason?: string | null
          suspended_until?: string | null
          updated_at?: string | null
          username?: string | null
        }
        Update: {
          birth_date?: string | null
          email?: string | null
          email_confirmed?: boolean | null
          email_confirmed_at?: string | null
          exp?: number | null
          full_name?: string | null
          icon_id?: number | null
          id?: string
          is_admin?: boolean | null
          is_suspended?: boolean | null
          level?: number | null
          nickname?: string | null
          phone_number?: string | null
          phone_verified?: boolean | null
          phone_verified_at?: string | null
          points?: number | null
          public_id?: string
          referral_count?: number | null
          referred_by?: string | null
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
          {
            foreignKeyName: "profiles_referred_by_fkey"
            columns: ["referred_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      referral_milestones: {
        Row: {
          created_at: string | null
          exp_awarded: number | null
          id: string
          milestone_type: string
          points_awarded: number
          referral_id: string
        }
        Insert: {
          created_at?: string | null
          exp_awarded?: number | null
          id?: string
          milestone_type: string
          points_awarded: number
          referral_id: string
        }
        Update: {
          created_at?: string | null
          exp_awarded?: number | null
          id?: string
          milestone_type?: string
          points_awarded?: number
          referral_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "referral_milestones_referral_id_fkey"
            columns: ["referral_id"]
            isOneToOne: false
            referencedRelation: "referrals"
            referencedColumns: ["id"]
          },
        ]
      }
      referrals: {
        Row: {
          completed_at: string | null
          created_at: string | null
          id: string
          referee_exp_awarded: number | null
          referee_id: string
          referee_points_awarded: number | null
          referrer_exp_awarded: number | null
          referrer_id: string
          referrer_points_awarded: number | null
          status: string
        }
        Insert: {
          completed_at?: string | null
          created_at?: string | null
          id?: string
          referee_exp_awarded?: number | null
          referee_id: string
          referee_points_awarded?: number | null
          referrer_exp_awarded?: number | null
          referrer_id: string
          referrer_points_awarded?: number | null
          status?: string
        }
        Update: {
          completed_at?: string | null
          created_at?: string | null
          id?: string
          referee_exp_awarded?: number | null
          referee_id?: string
          referee_points_awarded?: number | null
          referrer_exp_awarded?: number | null
          referrer_id?: string
          referrer_points_awarded?: number | null
          status?: string
        }
        Relationships: [
          {
            foreignKeyName: "referrals_referee_id_fkey"
            columns: ["referee_id"]
            isOneToOne: true
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "referrals_referrer_id_fkey"
            columns: ["referrer_id"]
            isOneToOne: false
            referencedRelation: "profiles"
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
      search_logs: {
        Row: {
          clicked_result_id: string | null
          clicked_result_type: string | null
          created_at: string | null
          id: string
          ip_address: unknown
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
          ip_address?: unknown
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
          ip_address?: unknown
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
      seo_settings: {
        Row: {
          default_description: string | null
          default_keywords: string[] | null
          default_title: string
          id: string
          og_image: string | null
          page_overrides: Json | null
          site_name: string
          site_url: string
          twitter_handle: string | null
          updated_at: string | null
          updated_by: string | null
        }
        Insert: {
          default_description?: string | null
          default_keywords?: string[] | null
          default_title?: string
          id?: string
          og_image?: string | null
          page_overrides?: Json | null
          site_name?: string
          site_url?: string
          twitter_handle?: string | null
          updated_at?: string | null
          updated_by?: string | null
        }
        Update: {
          default_description?: string | null
          default_keywords?: string[] | null
          default_title?: string
          id?: string
          og_image?: string | null
          page_overrides?: Json | null
          site_name?: string
          site_url?: string
          twitter_handle?: string | null
          updated_at?: string | null
          updated_by?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "seo_settings_updated_by_fkey"
            columns: ["updated_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
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
          consumable_type: string | null
          created_at: string | null
          description: string | null
          id: number
          image_url: string
          is_active: boolean | null
          is_consumable: boolean | null
          is_default: boolean | null
          name: string
          price: number
          tier: string | null
        }
        Insert: {
          category_id?: number | null
          consumable_type?: string | null
          created_at?: string | null
          description?: string | null
          id?: number
          image_url: string
          is_active?: boolean | null
          is_consumable?: boolean | null
          is_default?: boolean | null
          name: string
          price?: number
          tier?: string | null
        }
        Update: {
          category_id?: number | null
          consumable_type?: string | null
          created_at?: string | null
          description?: string | null
          id?: number
          image_url?: string
          is_active?: boolean | null
          is_consumable?: boolean | null
          is_default?: boolean | null
          name?: string
          price?: number
          tier?: string | null
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
      ui_theme_settings: {
        Row: {
          border_radius_desktop: string
          border_radius_mobile: string
          id: string
          updated_at: string | null
          updated_by: string | null
        }
        Insert: {
          border_radius_desktop?: string
          border_radius_mobile?: string
          id?: string
          updated_at?: string | null
          updated_by?: string | null
        }
        Update: {
          border_radius_desktop?: string
          border_radius_mobile?: string
          id?: string
          updated_at?: string | null
          updated_by?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "ui_theme_settings_updated_by_fkey"
            columns: ["updated_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
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
          exp_amount: number
          reason_text: string
          target_user_id: string
        }
        Returns: boolean
      }
      admin_adjust_points: {
        Args: {
          admin_id: string
          points_amount: number
          reason_text: string
          target_user_id: string
        }
        Returns: boolean
      }
      change_profile_icon: {
        Args: { p_icon_id: number; p_user_id: string }
        Returns: boolean
      }
      cleanup_expired_data: { Args: never; Returns: undefined }
      cleanup_expired_predictions: { Args: never; Returns: undefined }
      cleanup_old_logs: { Args: { days_to_keep?: number }; Returns: undefined }
      count_search_posts: {
        Args: {
          p_board_ids: string[]
          p_search_term: string
          p_search_type?: string
        }
        Returns: number
      }
      create_youtube_channels_table: { Args: never; Returns: undefined }
      custom_access_token_hook: { Args: { event: Json }; Returns: Json }
      delete_current_user: { Args: never; Returns: undefined }
      delete_expired_verification_codes: { Args: never; Returns: undefined }
      delete_old_notifications: { Args: never; Returns: undefined }
      delete_user_data: { Args: { user_uuid: string }; Returns: boolean }
      delete_user_posts: { Args: { user_uuid: string }; Returns: undefined }
      get_application_logs: {
        Args: {
          p_action?: string
          p_category?: string
          p_end_date?: string
          p_level?: string
          p_limit?: number
          p_page?: number
          p_search?: string
          p_start_date?: string
          p_user_id?: string
        }
        Returns: {
          action: string
          category: string
          created_at: string
          endpoint: string
          error_code: string
          error_details: string
          id: string
          ip_address: string
          level: string
          message: string
          metadata: Json
          method: string
          request_id: string
          response_time_ms: number
          session_id: string
          stack_trace: string
          status_code: number
          updated_at: string
          user_agent: string
          user_id: string
        }[]
      }
      get_application_logs_count: {
        Args: {
          p_action?: string
          p_category?: string
          p_end_date?: string
          p_level?: string
          p_search?: string
          p_start_date?: string
          p_user_id?: string
        }
        Returns: number
      }
      get_auth_users_info: {
        Args: never
        Returns: {
          created_at: string
          email: string
          id: string
          last_sign_in_at: string
        }[]
      }
      get_comment_with_counts: {
        Args: { comment_id: string }
        Returns: {
          dislikes_count: number
          likes_count: number
        }[]
      }
      get_log_statistics: { Args: { p_period?: string }; Returns: Json }
      get_match_prediction: {
        Args: { p_fixture_id: number }
        Returns: {
          ai_analysis: string
          api_calls_count: number
          away_team_id: number
          away_team_name: string
          away_team_stats: Json
          created_at: string
          data_sources: Json
          expires_at: string
          fixture_id: number
          generation_cost_usd: number
          home_team_id: number
          home_team_name: string
          home_team_stats: Json
          id: string
          is_active: boolean
          last_updated: string
          league_id: number
          league_name: string
          match_context: Json
          match_date: string
          popularity_score: number
          prediction_summary: Json
          updated_at: string
          view_count: number
        }[]
      }
      get_post_detail: {
        Args: { board_slug: string; post_num: number }
        Returns: Json
      }
      get_user_last_sign_in: { Args: { user_id: string }; Returns: string }
      get_user_last_signin: { Args: { user_id: string }; Returns: string }
      get_user_profile_direct: {
        Args: { user_id: string }
        Returns: {
          exp: number
          icon_id: number
          id: string
          level: number
        }[]
      }
      get_users_with_last_access: {
        Args: never
        Returns: {
          auth_created_at: string
          email: string
          full_name: string
          id: string
          is_admin: boolean
          is_suspended: boolean
          last_sign_in_at: string
          nickname: string
          suspended_reason: string
          suspended_until: string
          updated_at: string
        }[]
      }
      increment_post_view: { Args: { post_id: string }; Returns: undefined }
      increment_prediction_views: {
        Args: { p_fixture_id: number }
        Returns: undefined
      }
      increment_referral_count: {
        Args: { user_id: string }
        Returns: undefined
      }
      increment_view_count: { Args: { post_id: string }; Returns: undefined }
      insert_application_log: {
        Args: {
          p_action: string
          p_category: string
          p_endpoint?: string
          p_error_code?: string
          p_error_details?: string
          p_ip_address?: string
          p_level: string
          p_message: string
          p_metadata?: Json
          p_method?: string
          p_request_id?: string
          p_response_time_ms?: number
          p_session_id?: string
          p_stack_trace?: string
          p_status_code?: number
          p_user_agent?: string
          p_user_id?: string
        }
        Returns: undefined
      }
      is_admin: { Args: never; Returns: boolean }
      is_admin_for_notice_board: {
        Args: { board_uuid: string }
        Returns: boolean
      }
      log_api_request: {
        Args: {
          p_endpoint: string
          p_ip_address?: string
          p_metadata?: Json
          p_method: string
          p_request_id?: string
          p_response_time_ms: number
          p_status_code: number
          p_user_agent?: string
          p_user_id?: string
        }
        Returns: undefined
      }
      log_error: {
        Args: {
          p_action: string
          p_category: string
          p_error_code?: string
          p_error_details?: string
          p_message: string
          p_metadata?: Json
          p_stack_trace?: string
          p_user_id?: string
        }
        Returns: undefined
      }
      log_event: {
        Args: {
          p_action: string
          p_category: string
          p_level: string
          p_message: string
          p_metadata?: Json
          p_user_id?: string
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
          p_metadata?: Json
          p_user_id: string
        }
        Returns: undefined
      }
      populate_football_teams_from_leagues: { Args: never; Returns: undefined }
      purchase_item: {
        Args: { p_item_id: number; p_user_id: string }
        Returns: boolean
      }
      purchase_profile_icon: {
        Args: { p_icon_id: number; p_user_id: string }
        Returns: boolean
      }
      save_match_prediction: {
        Args: {
          p_ai_analysis: string
          p_api_calls_count?: number
          p_away_team_id: number
          p_away_team_name: string
          p_away_team_stats?: Json
          p_data_sources?: Json
          p_fixture_id: number
          p_generation_cost_usd?: number
          p_home_team_id: number
          p_home_team_name: string
          p_home_team_stats?: Json
          p_league_id: number
          p_league_name: string
          p_match_context?: Json
          p_match_date: string
          p_prediction_summary: Json
        }
        Returns: {
          created_at: string
          fixture_id: number
          id: string
        }[]
      }
      search_posts_by_content: {
        Args: {
          p_board_ids: string[]
          p_limit?: number
          p_offset?: number
          p_search_term: string
          p_search_type?: string
        }
        Returns: {
          board_id: string
          content: Json
          created_at: string
          id: string
          is_deleted: boolean
          is_hidden: boolean
          is_notice: boolean
          likes: number
          post_number: number
          title: string
          user_id: string
          views: number
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
      update_post_like_count: { Args: { post_id: string }; Returns: undefined }
      update_post_with_board: {
        Args: {
          p_board_id: string
          p_content: string
          p_id: string
          p_title: string
        }
        Returns: boolean
      }
      update_profile_directly: {
        Args: {
          p_email: string
          p_full_name: string
          p_nickname: string
          p_user_id: string
          p_username: string
        }
        Returns: undefined
      }
      upsert_chat_session_read_at: {
        Args: { p_session_id: string }
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
