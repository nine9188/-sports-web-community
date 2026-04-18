import { Notification } from '../types/notification';

/**
 * 읽은 알림을 읽은 시점 기준 이틀 후에 숨기는 필터 함수
 */
export function shouldShowNotification(notification: Notification): boolean {
  if (notification.is_read) {
    const baseDate = notification.read_at
      ? new Date(notification.read_at)
      : new Date(notification.created_at);
    const diffInDays = (Date.now() - baseDate.getTime()) / (1000 * 60 * 60 * 24);

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
