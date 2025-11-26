// 알림 관련 타입 정의

export type NotificationType = 
  | 'comment'       // 내 게시글에 댓글
  | 'reply'         // 내 댓글에 대댓글
  | 'post_like'     // 내 게시글에 좋아요
  | 'comment_like'  // 내 댓글에 좋아요
  | 'level_up'      // 레벨업
  | 'report_result' // 신고 처리 결과
  | 'admin_notice'; // 관리자 공지

export interface Notification {
  id: string;
  user_id: string;
  actor_id: string | null;
  type: NotificationType;
  title: string;
  message: string | null;
  link: string | null;
  is_read: boolean;
  metadata: NotificationMetadata;
  created_at: string;
  // 조인된 데이터
  actor?: {
    nickname: string | null;
    icon_id: number | null;
    icon_url?: string | null;
    level?: number | null;
  } | null;
}

export interface NotificationMetadata {
  post_id?: string;
  post_title?: string;
  comment_id?: string;
  comment_content?: string;
  board_slug?: string;
  board_name?: string;
  post_number?: number;
  [key: string]: unknown;
}

// 알림 생성 시 필요한 데이터
export interface CreateNotificationParams {
  userId: string;        // 알림 받을 사용자
  actorId?: string;      // 알림 발생시킨 사용자
  type: NotificationType;
  title: string;
  message?: string;
  link?: string;
  metadata?: NotificationMetadata;
}

// 알림 목록 응답
export interface NotificationsResponse {
  success: boolean;
  notifications?: Notification[];
  unreadCount?: number;
  error?: string;
}

// 알림 액션 응답
export interface NotificationActionResponse {
  success: boolean;
  notification?: Notification;
  error?: string;
}



