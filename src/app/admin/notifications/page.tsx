'use client';

import { useState, useEffect } from 'react';
import { getSupabaseBrowser } from '@/shared/lib/supabase';
import { Bell, Users, Send, CheckCircle, XCircle, Clock, History } from 'lucide-react';
import { createAdminNoticeWithLog, createBroadcastNotification, getNotificationLogs } from '@/domains/notifications/actions';
import Spinner from '@/shared/components/Spinner';

interface User {
  id: string;
  nickname: string;
  email: string;
  level: number;
}

interface NotificationLog {
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

type SendMode = 'all' | 'selected';

export default function NotificationSendPage() {
  const [users, setUsers] = useState<User[]>([]);
  const [selectedUserIds, setSelectedUserIds] = useState<Set<string>>(new Set());
  const [sendMode, setSendMode] = useState<SendMode>('all');

  const [title, setTitle] = useState('');
  const [message, setMessage] = useState('');
  const [link, setLink] = useState('');

  const [isLoading, setIsLoading] = useState(false);
  const [isFetchingUsers, setIsFetchingUsers] = useState(true);
  const [result, setResult] = useState<{ success: boolean; message: string } | null>(null);

  const [currentUserId, setCurrentUserId] = useState<string | null>(null);
  const [logs, setLogs] = useState<NotificationLog[]>([]);
  const [isLoadingLogs, setIsLoadingLogs] = useState(true);
  const [showHistory, setShowHistory] = useState(false);

  const supabase = getSupabaseBrowser();

  // 현재 사용자 정보 및 알림 로그 조회
  useEffect(() => {
    const fetchCurrentUser = async () => {
      const { data: { user } } = await supabase.auth.getUser();
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
        const { data, error } = await supabase
          .from('profiles')
          .select('id, nickname, email, level, is_suspended')
          .or('is_suspended.is.null,is_suspended.eq.false')
          .order('level', { ascending: false })
          .limit(100);

        if (error) {
          console.error('사용자 목록 조회 에러:', error);
          throw error;
        }

        setUsers(data || []);
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
      setSelectedUserIds(new Set(users.map(u => u.id)));
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
        // 전체 발송 (로그 포함)
        response = await createBroadcastNotification({
          title: title.trim(),
          message: message.trim(),
          link: link.trim() || undefined,
          adminId: currentUserId
        });
      } else {
        // 선택 발송 (로그 포함)
        response = await createAdminNoticeWithLog({
          userIds: Array.from(selectedUserIds),
          title: title.trim(),
          message: message.trim(),
          link: link.trim() || undefined,
          adminId: currentUserId
        });
      }

      if (response.success) {
        setResult({
          success: true,
          message: `알림이 성공적으로 발송되었습니다! (${response.sent}명에게 전송)`
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
          message: `알림 발송 실패: ${response.sent}명 성공, ${response.failed}명 실패`
        });
      }
    } catch (error) {
      console.error('알림 발송 오류:', error);
      setResult({
        success: false,
        message: '알림 발송 중 오류가 발생했습니다.'
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-[#0D0D0D] p-6">
      <div className="max-w-6xl mx-auto space-y-6">
        {/* 헤더 */}
        <div className="bg-white dark:bg-[#1D1D1D] rounded-lg p-6 border border-gray-200 dark:border-gray-700">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Bell className="w-8 h-8 text-blue-500" />
              <div>
                <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100">
                  관리자 공지 발송
                </h1>
                <p className="text-gray-600 dark:text-gray-400 mt-1">
                  전체 또는 특정 사용자에게 알림을 보낼 수 있습니다.
                </p>
              </div>
            </div>
            <button
              onClick={() => setShowHistory(!showHistory)}
              className="flex items-center gap-2 px-4 py-2 bg-gray-100 dark:bg-[#2D2D2D] hover:bg-gray-200 dark:hover:bg-[#3D3D3D] text-gray-700 dark:text-gray-300 rounded-lg transition-colors"
            >
              <History className="w-5 h-5" />
              {showHistory ? '발송 폼 보기' : '발송 기록 보기'}
            </button>
          </div>
        </div>

        {showHistory ? (
          /* 발송 기록 영역 */
          <div className="bg-white dark:bg-[#1D1D1D] rounded-lg p-6 border border-gray-200 dark:border-gray-700">
            <div className="flex items-center gap-3 mb-6">
              <Clock className="w-6 h-6 text-blue-500" />
              <h2 className="text-xl font-bold text-gray-900 dark:text-gray-100">
                알림 발송 기록
              </h2>
            </div>

            {isLoadingLogs ? (
              <div className="text-center py-12">
                <Spinner size="lg" className="mx-auto" />
                <p className="text-gray-500 dark:text-gray-400 mt-2">
                  발송 기록 로딩 중...
                </p>
              </div>
            ) : logs.length === 0 ? (
              <div className="text-center py-12 text-gray-500 dark:text-gray-400">
                <History className="w-16 h-16 mx-auto mb-4 opacity-50" />
                <p>발송 기록이 없습니다</p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b border-gray-200 dark:border-gray-700">
                      <th className="text-left py-3 px-4 text-sm font-semibold text-gray-900 dark:text-gray-100">
                        발송 일시
                      </th>
                      <th className="text-left py-3 px-4 text-sm font-semibold text-gray-900 dark:text-gray-100">
                        관리자
                      </th>
                      <th className="text-left py-3 px-4 text-sm font-semibold text-gray-900 dark:text-gray-100">
                        모드
                      </th>
                      <th className="text-left py-3 px-4 text-sm font-semibold text-gray-900 dark:text-gray-100">
                        제목
                      </th>
                      <th className="text-left py-3 px-4 text-sm font-semibold text-gray-900 dark:text-gray-100">
                        내용
                      </th>
                      <th className="text-right py-3 px-4 text-sm font-semibold text-gray-900 dark:text-gray-100">
                        성공/실패
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    {logs.map((log) => (
                      <tr
                        key={log.id}
                        className="border-b border-gray-100 dark:border-gray-800 hover:bg-gray-50 dark:hover:bg-[#2D2D2D]"
                      >
                        <td className="py-3 px-4 text-sm text-gray-600 dark:text-gray-400">
                          {new Date(log.created_at).toLocaleString('ko-KR', {
                            year: 'numeric',
                            month: '2-digit',
                            day: '2-digit',
                            hour: '2-digit',
                            minute: '2-digit'
                          })}
                        </td>
                        <td className="py-3 px-4 text-sm text-gray-900 dark:text-gray-100">
                          <div>
                            <p className="font-medium">{log.admin.nickname}</p>
                            <p className="text-xs text-gray-500 dark:text-gray-400">
                              {log.admin.email}
                            </p>
                          </div>
                        </td>
                        <td className="py-3 px-4">
                          <span className={`inline-flex items-center px-2 py-1 rounded text-xs font-medium ${
                            log.send_mode === 'all'
                              ? 'bg-blue-100 dark:bg-blue-900 text-blue-800 dark:text-blue-200'
                              : 'bg-green-100 dark:bg-green-900 text-green-800 dark:text-green-200'
                          }`}>
                            {log.send_mode === 'all' ? '전체' : '선택'}
                          </span>
                        </td>
                        <td className="py-3 px-4 text-sm text-gray-900 dark:text-gray-100">
                          <p className="font-medium truncate max-w-xs">
                            {log.title}
                          </p>
                          {log.link && (
                            <p className="text-xs text-blue-500 truncate">
                              {log.link}
                            </p>
                          )}
                        </td>
                        <td className="py-3 px-4 text-sm text-gray-600 dark:text-gray-400">
                          <p className="truncate max-w-xs">
                            {log.message}
                          </p>
                        </td>
                        <td className="py-3 px-4 text-right text-sm">
                          <div className="flex items-center justify-end gap-2">
                            <span className="text-green-600 dark:text-green-400 font-medium">
                              {log.total_sent}
                            </span>
                            {log.total_failed > 0 && (
                              <>
                                <span className="text-gray-400">/</span>
                                <span className="text-red-600 dark:text-red-400 font-medium">
                                  {log.total_failed}
                                </span>
                              </>
                            )}
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* 공지 작성 영역 */}
            <div className="bg-white dark:bg-[#1D1D1D] rounded-lg p-6 border border-gray-200 dark:border-gray-700">
            <h2 className="text-lg font-bold text-gray-900 dark:text-gray-100 mb-4">
              공지 내용 작성
            </h2>

            <div className="space-y-4">
              {/* 발송 모드 선택 */}
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  발송 대상
                </label>
                <div className="flex gap-2">
                  <button
                    onClick={() => setSendMode('all')}
                    className={`flex-1 py-2 px-4 rounded-lg border transition-colors ${
                      sendMode === 'all'
                        ? 'bg-blue-500 text-white border-blue-500'
                        : 'bg-white dark:bg-[#2D2D2D] border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300'
                    }`}
                  >
                    <Users className="w-4 h-4 inline mr-2" />
                    전체 사용자
                  </button>
                  <button
                    onClick={() => setSendMode('selected')}
                    className={`flex-1 py-2 px-4 rounded-lg border transition-colors ${
                      sendMode === 'selected'
                        ? 'bg-blue-500 text-white border-blue-500'
                        : 'bg-white dark:bg-[#2D2D2D] border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300'
                    }`}
                  >
                    선택한 사용자 ({selectedUserIds.size}명)
                  </button>
                </div>
              </div>

              {/* 제목 */}
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  제목 *
                </label>
                <input
                  type="text"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder="알림 제목을 입력하세요"
                  className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-[#2D2D2D] text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  maxLength={100}
                />
              </div>

              {/* 내용 */}
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  내용 *
                </label>
                <textarea
                  value={message}
                  onChange={(e) => setMessage(e.target.value)}
                  placeholder="알림 내용을 입력하세요"
                  rows={6}
                  className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-[#2D2D2D] text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none"
                  maxLength={500}
                />
                <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                  {message.length}/500
                </p>
              </div>

              {/* 링크 (선택) */}
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  링크 (선택)
                </label>
                <input
                  type="text"
                  value={link}
                  onChange={(e) => setLink(e.target.value)}
                  placeholder="/boards/notice/123"
                  className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-[#2D2D2D] text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
                <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                  알림 클릭 시 이동할 페이지 경로
                </p>
              </div>

              {/* 발송 버튼 */}
              <button
                onClick={handleSend}
                disabled={isLoading || !title.trim() || !message.trim()}
                className="w-full py-3 px-4 bg-blue-500 hover:bg-blue-600 disabled:bg-gray-400 text-white rounded-lg font-medium transition-colors flex items-center justify-center gap-2"
              >
                {isLoading ? (
                  <>
                    <Spinner size="sm" />
                    발송 중...
                  </>
                ) : (
                  <>
                    <Send className="w-5 h-5" />
                    알림 발송
                  </>
                )}
              </button>

              {/* 결과 메시지 */}
              {result && (
                <div
                  className={`p-4 rounded-lg flex items-center gap-2 ${
                    result.success
                      ? 'bg-green-100 dark:bg-green-900 text-green-800 dark:text-green-200'
                      : 'bg-red-100 dark:bg-red-900 text-red-800 dark:text-red-200'
                  }`}
                >
                  {result.success ? (
                    <CheckCircle className="w-5 h-5" />
                  ) : (
                    <XCircle className="w-5 h-5" />
                  )}
                  <p className="text-sm">{result.message}</p>
                </div>
              )}
            </div>
          </div>

          {/* 사용자 선택 영역 */}
          <div className="bg-white dark:bg-[#1D1D1D] rounded-lg p-6 border border-gray-200 dark:border-gray-700">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-bold text-gray-900 dark:text-gray-100">
                사용자 선택
              </h2>
              {sendMode === 'selected' && (
                <button
                  onClick={toggleAll}
                  className="text-sm text-blue-500 hover:text-blue-600"
                >
                  {selectedUserIds.size === users.length ? '전체 해제' : '전체 선택'}
                </button>
              )}
            </div>

            {sendMode === 'all' ? (
              <div className="text-center py-12 text-gray-500 dark:text-gray-400">
                <Users className="w-16 h-16 mx-auto mb-4 opacity-50" />
                <p>전체 사용자에게 발송됩니다</p>
                <p className="text-sm mt-2">총 {users.length}명의 사용자</p>
              </div>
            ) : (
              <div className="space-y-2 max-h-[600px] overflow-y-auto">
                {isFetchingUsers ? (
                  <div className="text-center py-12">
                    <Spinner size="lg" className="mx-auto" />
                    <p className="text-gray-500 dark:text-gray-400 mt-2">
                      사용자 목록 로딩 중...
                    </p>
                  </div>
                ) : users.length === 0 ? (
                  <div className="text-center py-12 text-gray-500 dark:text-gray-400">
                    <p>사용자가 없습니다</p>
                  </div>
                ) : (
                  users.map((user) => (
                    <label
                      key={user.id}
                      className="flex items-center gap-3 p-3 rounded-lg border border-gray-200 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-[#2D2D2D] cursor-pointer transition-colors"
                    >
                      <input
                        type="checkbox"
                        checked={selectedUserIds.has(user.id)}
                        onChange={() => toggleUser(user.id)}
                        className="w-4 h-4 text-blue-500 rounded focus:ring-2 focus:ring-blue-500"
                      />
                      <div className="flex-1">
                        <p className="font-medium text-gray-900 dark:text-gray-100">
                          {user.nickname || '닉네임 없음'}
                        </p>
                        <p className="text-sm text-gray-500 dark:text-gray-400">
                          {user.email} • Lv.{user.level}
                        </p>
                      </div>
                    </label>
                  ))
                )}
              </div>
            )}
          </div>
          </div>
        )}
      </div>
    </div>
  );
}
