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
        Relationships: []
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
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      [_ in never]: never
    }
    Enums: {
      [_ in never]: never
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}

export interface CommentType {
  id: string;
  content: string;
  user_id: string;
  post_id: string;
  created_at: string;
  updated_at: string;
  likes: number;
  dislikes: number;
  is_hidden?: boolean;
  is_deleted?: boolean;
  hidden_until?: string;
  hidden_reason?: string;
  profiles?: {
    id: string;
    nickname: string;
    icon_url?: string;
    level?: number;
  };
} 