'use client';

import { useState, useEffect } from 'react';
import { X, FileText, MessageSquare, Calendar } from 'lucide-react';
import { getPublicProfile } from '../actions';
import { PublicProfile } from '../types';
import { useUserPosts, useUserComments } from '../hooks';
import UserIcon from '@/shared/components/UserIcon';
import ReportButton from '@/domains/reports/components/ReportButton';
import { Pagination } from '@/shared/components/ui/pagination';
import PostList from '@/domains/boards/components/post/postlist/PostListMain';
import Spinner from '@/shared/components/Spinner';
import {
  LEVEL_EXP_REQUIREMENTS,
  calculateLevelProgress,
  getExpToNextLevel,
} from '@/shared/utils/level-icons';

interface UserProfileModalProps {
  publicId: string;
  isOpen: boolean;
  onClose: () => void;
  currentUserId?: string | null;
}

/**
 * 유저 프로필 모달 컴포넌트
 * 작성자 클릭 시 열리는 프로필 모달
 */
export default function UserProfileModal({
  publicId,
  isOpen,
  onClose,
  currentUserId,
}: UserProfileModalProps) {
  const [profile, setProfile] = useState<PublicProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<'posts' | 'comments'>('posts');

  // 데이터 페칭 훅 (BoardDetailLayout 패턴)
  const postsData = useUserPosts(publicId);
  const commentsData = useUserComments(publicId);
  const currentData = activeTab === 'posts' ? postsData : commentsData;

  useEffect(() => {
    if (isOpen && publicId) {
      loadProfile();
    }
  }, [isOpen, publicId]);

  const loadProfile = async () => {
    setLoading(true);
    setError(null);
    try {
      const result = await getPublicProfile(publicId);
      if (result.success && result.data) {
        setProfile(result.data);
      } else {
        setError(result.error || '프로필을 불러올 수 없습니다.');
      }
    } catch {
      setError('프로필을 불러오는 중 오류가 발생했습니다.');
    } finally {
      setLoading(false);
    }
  };

  const formatJoinDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('ko-KR', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });
  };

  if (!isOpen) return null;

  const isOwnProfile = currentUserId === profile?.id;

  return (
    <div
      className="fixed inset-0 z-50 flex items-end md:items-center justify-center p-0 md:p-4"
      role="dialog"
      aria-modal="true"
    >
      {/* Backdrop */}
      <div className="absolute inset-0 bg-black/50" onClick={onClose} />

      {/* Modal */}
      <div className="relative w-full md:max-w-md bg-white dark:bg-[#1D1D1D] rounded-t-2xl md:rounded-lg shadow-xl flex flex-col max-h-[85vh] md:max-h-[80vh] overflow-hidden">
        {/* Header */}
        <div className="h-12 px-4 border-b border-black/5 dark:border-white/10 bg-[#F5F5F5] dark:bg-[#262626] flex items-center justify-between flex-shrink-0">
          <h2 className="text-sm font-bold text-gray-900 dark:text-[#F0F0F0]">
            프로필
          </h2>
          <button
            type="button"
            onClick={onClose}
            aria-label="닫기"
            className="h-8 w-8 inline-flex items-center justify-center rounded-md hover:bg-[#EAEAEA] dark:hover:bg-[#333333] transition-colors"
          >
            <X className="h-5 w-5 text-gray-600 dark:text-gray-300" />
          </button>
        </div>

        {/* Body */}
        <div className="flex-1 overflow-y-auto">
          {loading ? (
            <div className="flex items-center justify-center py-12">
              <Spinner size="lg" />
            </div>
          ) : error ? (
            <div className="text-center py-12 text-gray-500 dark:text-gray-400">
              {error}
            </div>
          ) : profile ? (
            <>
              {/* 프로필 정보 */}
              <div className="p-4 border-b border-black/5 dark:border-white/10">
                <div className="flex items-center gap-3">
                  <div className="w-14 h-14 rounded-full overflow-hidden flex-shrink-0 bg-[#F5F5F5] dark:bg-[#262626]">
                    <UserIcon
                      iconUrl={profile.icon_url}
                      level={profile.level}
                      size={56}
                      alt={`${profile.nickname} 프로필`}
                    />
                  </div>

                  <div className="flex-1 min-w-0">
                    <h3 className="text-lg font-semibold text-gray-900 dark:text-[#F0F0F0] truncate">
                      {profile.nickname}
                    </h3>
                    <div className="flex items-center gap-1.5 mt-0.5">
                      <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
                        레벨 {profile.level}
                      </span>
                      <span className="text-xs text-gray-500 dark:text-gray-400">
                        ({profile.exp} / {LEVEL_EXP_REQUIREMENTS[profile.level] || 0} EXP)
                      </span>
                    </div>
                    <div className="w-full h-1.5 bg-[#EAEAEA] dark:bg-[#333333] rounded-full overflow-hidden mt-1.5">
                      <div
                        className="h-full bg-slate-800 dark:bg-[#F0F0F0] rounded-full transition-all"
                        style={{ width: `${calculateLevelProgress(profile.level, profile.exp)}%` }}
                      />
                    </div>
                    <div className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">
                      다음 레벨까지 {getExpToNextLevel(profile.level, profile.exp)} EXP 필요
                    </div>
                  </div>
                </div>

                {/* 통계 */}
                <div className="grid grid-cols-3 gap-4 mt-4">
                  <div className="text-center">
                    <div className="flex items-center justify-center gap-1 text-gray-600 dark:text-gray-400 mb-0.5">
                      <FileText className="w-3.5 h-3.5" />
                      <span className="text-xs">작성글</span>
                    </div>
                    <p className="text-base font-semibold text-gray-900 dark:text-[#F0F0F0]">
                      {profile.post_count}
                    </p>
                  </div>
                  <div className="text-center">
                    <div className="flex items-center justify-center gap-1 text-gray-600 dark:text-gray-400 mb-0.5">
                      <MessageSquare className="w-3.5 h-3.5" />
                      <span className="text-xs">댓글</span>
                    </div>
                    <p className="text-base font-semibold text-gray-900 dark:text-[#F0F0F0]">
                      {profile.comment_count}
                    </p>
                  </div>
                  <div className="text-center">
                    <div className="flex items-center justify-center gap-1 text-gray-600 dark:text-gray-400 mb-0.5">
                      <Calendar className="w-3.5 h-3.5" />
                      <span className="text-xs">가입</span>
                    </div>
                    <p className="text-xs font-medium text-gray-900 dark:text-[#F0F0F0]">
                      {formatJoinDate(profile.created_at).split(' ').slice(0, 2).join(' ')}
                    </p>
                  </div>
                </div>

                {/* 신고 버튼 */}
                {!isOwnProfile && (
                  <div className="mt-4">
                    <ReportButton
                      targetType="user"
                      targetId={profile.id}
                      targetTitle={profile.nickname}
                      className="w-full"
                    />
                  </div>
                )}
              </div>

              {/* 탭 - TabsClient 패턴 */}
              <div className="flex h-12">
                <button
                  onClick={() => setActiveTab('posts')}
                  className={`flex-1 h-12 text-xs flex items-center justify-center gap-1 transition-colors ${
                    activeTab === 'posts'
                      ? 'bg-white dark:bg-[#1D1D1D] text-gray-900 dark:text-[#F0F0F0] font-medium border-b-2 border-slate-800 dark:border-white'
                      : 'bg-[#F5F5F5] dark:bg-[#262626] text-gray-700 dark:text-gray-400 hover:bg-[#EAEAEA] dark:hover:bg-[#333333]'
                  }`}
                >
                  <FileText className="w-4 h-4" />
                  <span>작성글</span>
                </button>
                <button
                  onClick={() => setActiveTab('comments')}
                  className={`flex-1 h-12 text-xs flex items-center justify-center gap-1 transition-colors ${
                    activeTab === 'comments'
                      ? 'bg-white dark:bg-[#1D1D1D] text-gray-900 dark:text-[#F0F0F0] font-medium border-b-2 border-slate-800 dark:border-white'
                      : 'bg-[#F5F5F5] dark:bg-[#262626] text-gray-700 dark:text-gray-400 hover:bg-[#EAEAEA] dark:hover:bg-[#333333]'
                  }`}
                >
                  <MessageSquare className="w-4 h-4" />
                  <span>댓글</span>
                </button>
              </div>
              {/* 탭-콘텐츠 구분선 */}
              <div className="border-b-2 border-black/5 dark:border-white/10" />

              {/* 탭 콘텐츠 - PostList만 */}
              {currentData.loading && currentData.posts.length === 0 ? (
                <div className="flex items-center justify-center py-8">
                  <Spinner size="md" />
                </div>
              ) : (
                <PostList
                  posts={currentData.posts}
                  loading={currentData.loading}
                  showBoard={true}
                  currentBoardId=""
                  emptyMessage={activeTab === 'posts' ? '작성한 게시글이 없습니다.' : '댓글 단 게시글이 없습니다.'}
                  className="!bg-transparent border-0 rounded-none"
                />
              )}
            </>
          ) : null}
        </div>

        {/* Pagination - 스크롤 영역 밖, 모달 하단 고정 */}
        {profile && (
          <Pagination
            currentPage={currentData.currentPage}
            totalPages={currentData.totalPages}
            onPageChange={currentData.setPage}
            mode="button"
            withBorder
          />
        )}
      </div>
    </div>
  );
}
