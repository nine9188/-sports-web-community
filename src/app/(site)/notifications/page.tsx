import { getNotifications } from '@/domains/notifications/actions/get';
import NotificationsPageClient from './NotificationsPageClient';

export const dynamic = 'force-dynamic';

export default async function NotificationsPage() {
  const result = await getNotifications(100);

  return (
    <NotificationsPageClient
      initialNotifications={result.notifications ?? []}
      initialUnreadCount={result.unreadCount ?? 0}
      initialError={result.success ? null : result.error || '알림을 불러오지 못했습니다.'}
    />
  );
}
