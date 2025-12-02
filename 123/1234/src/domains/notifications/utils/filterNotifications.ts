import { Notification } from '../types/notification';

/**
 * 읽은 알림을 이틀 후에 숨기는 필터 함수
 * @param notification 알림 객체
 * @returns 표시 여부
 */
export function shouldShowNotification(notification: Notification): boolean {
  // 읽은 알림 이틀 후 숨김 처리
  if (notification.is_read) {
    const readDate = new Date(notification.created_at);
    const now = new Date();
    const diffInDays = (now.getTime() - readDate.getTime()) / (1000 * 60 * 60 * 24);

    // 읽은 지 2일이 지난 알림은 숨김
    if (diffInDays > 2) {
      return false;
    }
  }

  return true;
}

/**
 * 알림 목록에서 오래된 읽은 알림을 필터링
 * @param notifications 알림 목록
 * @returns 필터링된 알림 목록
 */
export function filterOldReadNotifications(notifications: Notification[]): Notification[] {
  return notifications.filter(shouldShowNotification);
}
