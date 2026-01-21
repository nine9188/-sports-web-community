import { User } from '@supabase/supabase-js';

export interface UserInfo {
  id: string;
  nickname?: string;
  exp?: number;
  level?: number;
}

export interface ExpHistoryItem {
  id: string;
  user_id: string | null;
  exp: number;
  reason: string;
  created_at: string | null;
}

export interface ExpManagerProps {
  adminUser: User | null;
  selectedUser: UserInfo | null;
  onRefreshData: () => Promise<void>;
  onSelectUser?: (user: UserInfo) => void;
}
