// Supabase Database 타입 정의
export interface Database {
  public: {
    Tables: {
      profiles: {
        Row: {
          id: string;
          nickname: string | null;
          icon_id: number | null;
          created_at?: string;
          updated_at?: string;
          email?: string;
          full_name?: string;
          username?: string;
          [key: string]: unknown;
        };
        Insert: Record<string, unknown>;
        Update: Record<string, unknown>;
      };
      posts: {
        Row: {
          id: string;
          title: string;
          content: string;
          created_at: string;
          updated_at?: string;
          user_id: string;
          board_id: string;
          views: number;
          likes: number;
          dislikes: number;
          post_number: number;
          files?: FileAttachment[];
          [key: string]: unknown;
        };
        Insert: Record<string, unknown>;
        Update: Record<string, unknown>;
      };
      comments: {
        Row: {
          id: string;
          post_id: string;
          user_id: string;
          content: string;
          created_at: string;
          updated_at?: string;
          likes: number;
          dislikes: number;
          [key: string]: unknown;
        };
        Insert: Record<string, unknown>;
        Update: Record<string, unknown>;
      };
      boards: {
        Row: {
          id: string;
          name: string;
          parent_id: string | null;
          display_order: number;
          slug: string;
          team_id?: number | null;
          league_id?: number | null;
          created_at?: string;
          updated_at?: string;
          [key: string]: unknown;
        };
        Insert: Record<string, unknown>;
        Update: Record<string, unknown>;
      };
      // 기타 테이블들...
    };
    Functions: {
      [key: string]: unknown;
    };
  };
}

// 파일 첨부 타입
export interface FileAttachment {
  url: string;
  filename: string;
  content_type?: string;
  size?: number;
} 