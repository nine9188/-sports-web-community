export interface NotificationUser {
  id: string;
  nickname: string;
  email: string;
  level: number;
}

export interface NotificationLog {
  id: string;
  admin: { nickname: string; email: string };
  send_mode: string;
  title: string;
  message: string;
  link: string | null;
  total_sent: number;
  total_failed: number;
  created_at: string;
}

export type SendMode = 'all' | 'selected';

export interface SendResult {
  success: boolean;
  message: string;
}
