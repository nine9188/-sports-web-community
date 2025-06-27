export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  public: {
    Tables: {
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
      match_comment_likes: {
        Row: {
          comment_id: string
          created_at: string | null
          id: string
          user_id: string
        }
        Insert: {
          comment_id: string
          created_at?: string | null
          id?: string
          user_id: string
        }
        Update: {
          comment_id?: string
          created_at?: string | null
          id?: string
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
          id: string
          likes_count: number | null
          match_id: string
          team_type: string
          updated_at: string | null
          user_id: string
        }
        Insert: {
          content: string
          created_at?: string | null
          id?: string
          likes_count?: number | null
          match_id: string
          team_type: string
          updated_at?: string | null
          user_id: string
        }
        Update: {
          content?: string
          created_at?: string | null
          id?: string
          likes_count?: number | null
          match_id?: string
          team_type?: string
          updated_at?: string | null
          user_id?: string
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
      profiles: {
        Row: {
          email: string | null
          exp: number | null
          full_name: string | null
          icon_id: number | null
          id: string
          is_admin: boolean | null
          level: number | null
          nickname: string | null
          points: number | null
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
          level?: number | null
          nickname?: string | null
          points?: number | null
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
          level?: number | null
          nickname?: string | null
          points?: number | null
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
          founded: number | null
          id: number
          logo: string | null
          name: string
          venue_capacity: number | null
          venue_city: string | null
          venue_name: string | null
        }
        Insert: {
          country?: string | null
          founded?: number | null
          id: number
          logo?: string | null
          name: string
          venue_capacity?: number | null
          venue_city?: string | null
          venue_name?: string | null
        }
        Update: {
          country?: string | null
          founded?: number | null
          id?: number
          logo?: string | null
          name?: string
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
          id: string
          email: string
          code: string
          type: string
          token: string | null
          expires_at: string
          used_at: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          email: string
          code: string
          type: string
          token?: string | null
          expires_at: string
          used_at?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          email?: string
          code?: string
          type?: string
          token?: string | null
          expires_at?: string
          used_at?: string | null
          created_at?: string
          updated_at?: string
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
          total_likes: number | null
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
      create_youtube_channels_table: {
        Args: Record<PropertyKey, never>
        Returns: undefined
      }
      delete_current_user: {
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
      get_post_detail: {
        Args: { board_slug: string; post_num: number }
        Returns: Json
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
      increment_post_view: {
        Args: { post_id: string }
        Returns: undefined
      }
      increment_view_count: {
        Args: { post_id: string }
        Returns: undefined
      }
      is_admin: {
        Args: Record<PropertyKey, never>
        Returns: boolean
      }
      purchase_item: {
        Args: { p_user_id: string; p_item_id: number }
        Returns: boolean
      }
      purchase_profile_icon: {
        Args: { p_user_id: string; p_icon_id: number }
        Returns: boolean
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

type DefaultSchema = Database[Extract<keyof Database, "public">]

export type Tables<
  DefaultSchemaTableNameOrOptions extends
    | keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
    | { schema: keyof Database },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof Database
  }
    ? keyof (Database[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        Database[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never = never,
> = DefaultSchemaTableNameOrOptions extends { schema: keyof Database }
  ? (Database[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
      Database[DefaultSchemaTableNameOrOptions["schema"]]["Views"])[TableName] extends {
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
    | { schema: keyof Database },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof Database
  }
    ? keyof Database[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends { schema: keyof Database }
  ? Database[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
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
    | { schema: keyof Database },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof Database
  }
    ? keyof Database[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends { schema: keyof Database }
  ? Database[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
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
    | { schema: keyof Database },
  EnumName extends DefaultSchemaEnumNameOrOptions extends {
    schema: keyof Database
  }
    ? keyof Database[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never = never,
> = DefaultSchemaEnumNameOrOptions extends { schema: keyof Database }
  ? Database[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"][EnumName]
  : DefaultSchemaEnumNameOrOptions extends keyof DefaultSchema["Enums"]
    ? DefaultSchema["Enums"][DefaultSchemaEnumNameOrOptions]
    : never

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
    | keyof DefaultSchema["CompositeTypes"]
    | { schema: keyof Database },
  CompositeTypeName extends PublicCompositeTypeNameOrOptions extends {
    schema: keyof Database
  }
    ? keyof Database[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never = never,
> = PublicCompositeTypeNameOrOptions extends { schema: keyof Database }
  ? Database[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema["CompositeTypes"]
    ? DefaultSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
    : never

export const Constants = {
  public: {
    Enums: {},
  },
} as const
