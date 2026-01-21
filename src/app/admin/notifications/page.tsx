'use client';

import { useState, useEffect } from 'react';
import { getSupabaseBrowser } from '@/shared/lib/supabase';
import { Bell, History } from 'lucide-react';
import {
  createAdminNoticeWithLog,
  createBroadcastNotification,
  getNotificationLogs,
  getUsersForAdminNotification,
} from '@/domains/notifications/actions';
import { Button } from '@/shared/components/ui';
import {
  NotificationHistory,
  NotificationForm,
  UserSelection,
  type NotificationUser,
  type NotificationLog,
  type SendMode,
  type SendResult,
} from '@/domains/admin/components/notifications';

export default function NotificationSendPage() {
  const [users, setUsers] = useState<NotificationUser[]>([]);
  const [selectedUserIds, setSelectedUserIds] = useState<Set<string>>(new Set());
  const [sendMode, setSendMode] = useState<SendMode>('all');

  const [title, setTitle] = useState('');
  const [message, setMessage] = useState('');
  const [link, setLink] = useState('');

  const [isLoading, setIsLoading] = useState(false);
  const [isFetchingUsers, setIsFetchingUsers] = useState(true);
  const [result, setResult] = useState<SendResult | null>(null);

  const [currentUserId, setCurrentUserId] = useState<string | null>(null);
  const [logs, setLogs] = useState<NotificationLog[]>([]);
  const [isLoadingLogs, setIsLoadingLogs] = useState(true);
  const [showHistory, setShowHistory] = useState(false);

  const supabase = getSupabaseBrowser();

  // 현재 사용자 정보 및 알림 로그 조회
  useEffect(() => {
    const fetchCurrentUser = async () => {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (user) {
        setCurrentUserId(user.id);
      }
    };

    const fetchLogs = async () => {
      setIsLoadingLogs(true);
      try {
        const response = await getNotificationLogs(20);
        if (response.success && response.logs) {
          setLogs(response.logs);
        }
      } catch (error) {
        console.error('알림 로그 조회 실패:', error);
      } finally {
        setIsLoadingLogs(false);
      }
    };

    fetchCurrentUser();
    fetchLogs();
  }, []);

  // 사용자 목록 조회
  useEffect(() => {
    const fetchUsers = async () => {
      setIsFetchingUsers(true);
      try {
        const response = await getUsersForAdminNotification();
        if (response.success && response.users) {
          setUsers(response.users);
        } else {
          console.error('사용자 목록 조회 실패:', response.error);
        }
      } catch (error) {
        console.error('사용자 목록 조회 실패:', error);
      } finally {
        setIsFetchingUsers(false);
      }
    };

    fetchUsers();
  }, []);

  // 사용자 선택/해제
  const toggleUser = (userId: string) => {
    const newSelected = new Set(selectedUserIds);
    if (newSelected.has(userId)) {
      newSelected.delete(userId);
    } else {
      newSelected.add(userId);
    }
    setSelectedUserIds(newSelected);
  };

  // 전체 선택/해제
  const toggleAll = () => {
    if (selectedUserIds.size === users.length) {
      setSelectedUserIds(new Set());
    } else {
      setSelectedUserIds(new Set(users.map((u) => u.id)));
    }
  };

  // 공지 발송
  const handleSend = async () => {
    if (!title.trim() || !message.trim()) {
      setResult({ success: false, message: '제목과 내용을 입력해주세요.' });
      return;
    }

    if (sendMode === 'selected' && selectedUserIds.size === 0) {
      setResult({ success: false, message: '발송할 사용자를 선택해주세요.' });
      return;
    }

    if (!currentUserId) {
      setResult({ success: false, message: '로그인 정보를 확인할 수 없습니다.' });
      return;
    }

    setIsLoading(true);
    setResult(null);

    try {
      let response;

      if (sendMode === 'all') {
        response = await createBroadcastNotification({
          title: title.trim(),
          message: message.trim(),
          link: link.trim() || undefined,
          adminId: currentUserId,
        });
      } else {
        response = await createAdminNoticeWithLog({
          userIds: Array.from(selectedUserIds),
          title: title.trim(),
          message: message.trim(),
          link: link.trim() || undefined,
          adminId: currentUserId,
        });
      }

      if (response.success) {
        setResult({
          success: true,
          message: `알림이 성공적으로 발송되었습니다! (${response.sent}명에게 전송)`,
        });

        // 폼 초기화
        setTitle('');
        setMessage('');
        setLink('');
        setSelectedUserIds(new Set());

        // 로그 새로고침
        const logsResponse = await getNotificationLogs(20);
        if (logsResponse.success && logsResponse.logs) {
          setLogs(logsResponse.logs);
        }
      } else {
        setResult({
          success: false,
          message: `알림 발송 실패: ${response.sent}명 성공, ${response.failed}명 실패`,
        });
      }
    } catch (error) {
      console.error('알림 발송 오류:', error);
      setResult({
        success: false,
        message: '알림 발송 중 오류가 발생했습니다.',
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* 헤더 */}
      <div className="bg-white dark:bg-[#1D1D1D] rounded-lg p-6 border border-black/7 dark:border-white/10">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Bell className="w-8 h-8 text-gray-600 dark:text-gray-400" />
            <div>
              <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100">
                관리자 공지 발송
              </h1>
              <p className="text-gray-600 dark:text-gray-400 mt-1">
                전체 또는 특정 사용자에게 알림을 보낼 수 있습니다.
              </p>
            </div>
          </div>
          <Button onClick={() => setShowHistory(!showHistory)} variant="secondary">
            <History className="w-5 h-5 mr-2" />
            {showHistory ? '발송 폼 보기' : '발송 기록 보기'}
          </Button>
        </div>
      </div>

      {showHistory ? (
        <NotificationHistory logs={logs} isLoading={isLoadingLogs} />
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <NotificationForm
            sendMode={sendMode}
            selectedCount={selectedUserIds.size}
            title={title}
            message={message}
            link={link}
            isLoading={isLoading}
            result={result}
            onSendModeChange={setSendMode}
            onTitleChange={setTitle}
            onMessageChange={setMessage}
            onLinkChange={setLink}
            onSend={handleSend}
          />

          <UserSelection
            users={users}
            selectedUserIds={selectedUserIds}
            sendMode={sendMode}
            isLoading={isFetchingUsers}
            onToggleUser={toggleUser}
            onToggleAll={toggleAll}
          />
        </div>
      )}
    </div>
  );
}
