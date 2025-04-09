// Supabase Database 타입 정의
export interface Database {
  public: {
    Tables: {
      profiles: {
        Row: Record<string, unknown>;
        Insert: Record<string, unknown>;
        Update: Record<string, unknown>;
      };
      posts: {
        Row: Record<string, unknown>;
        Insert: Record<string, unknown>;
        Update: Record<string, unknown>;
      };
      comments: {
        Row: Record<string, unknown>;
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