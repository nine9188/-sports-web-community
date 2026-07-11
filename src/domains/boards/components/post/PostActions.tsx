"use client";

import React, { useState, useEffect } from 'react';
import { ThumbsUp, ThumbsDown, Bookmark } from 'lucide-react';
import Link from 'next/link';
import { toast } from 'sonner';
import { Button } from '@/shared/components/ui';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogBody,
  DialogFooter,
  DialogCloseButton,
} from '@/shared/components/ui/dialog';
import { reactToPost } from '@/domains/boards/utils/post/postReactionClient';
import { togglePostScrap, getScrappedPosts } from '@/domains/boards/actions/posts/scrap';
import {
  POST_REACTION_UPDATED_EVENT,
  dispatchPostReactionUpdated,
  type PostReactionUpdatedDetail,
} from '@/domains/boards/utils/post/postReactionEvents';

interface PostActionsProps {
  postId: string;
  boardId?: string;
  initialLikes: number;
  initialDislikes: number;
  initialUserAction: 'like' | 'dislike' | null;
  initialIsScrapped?: boolean;
  isLoggedIn?: boolean;
}

type ReactionType = 'like' | 'dislike';

function getReactionSuccessMessage(
  type: ReactionType,
  previousAction: ReactionType | null,
  nextAction: ReactionType | null,
) {
  if (nextAction === 'like') {
    return previousAction === 'dislike' ? '추천으로 변경했습니다.' : '게시글을 추천했습니다.';
  }

  if (nextAction === 'dislike') {
    return previousAction === 'like' ? '비추천으로 변경했습니다.' : '게시글을 비추천했습니다.';
  }

  return type === 'like' ? '추천을 취소했습니다.' : '비추천을 취소했습니다.';
}

export default function PostActions({ 
  postId, 
  initialLikes = 0, 
  initialDislikes = 0,
  initialUserAction = null,
  initialIsScrapped = false,
  isLoggedIn = false,
}: PostActionsProps) {
  const [likes, setLikes] = useState(initialLikes);
  const [dislikes, setDislikes] = useState(initialDislikes);
  const [isLiking, setIsLiking] = useState(false);
  const [isDisliking, setIsDisliking] = useState(false);
  const [userAction, setUserAction] = useState<'like' | 'dislike' | null>(initialUserAction);
  const [isScrapped, setIsScrapped] = useState(initialIsScrapped);
  const [isScraping, setIsScraping] = useState(false);

  // 모달 제어 상태
  const [showScrapModal, setShowScrapModal] = useState(false);
  const [recentScraps, setRecentScraps] = useState<any[]>([]);
  const [isLoadingRecent, setIsLoadingRecent] = useState(false);

  // 서버 데이터가 변경되면 로컬 상태 동기화
  useEffect(() => {
    setLikes(initialLikes);
    setDislikes(initialDislikes);
    setUserAction(initialUserAction);
    setIsScrapped(initialIsScrapped);
  }, [initialLikes, initialDislikes, initialUserAction, initialIsScrapped]);

  useEffect(() => {
    const handleExternalReaction = (event: Event) => {
      const detail = (event as CustomEvent<PostReactionUpdatedDetail>).detail;
      if (!detail || detail.postId !== postId) return;

      setLikes(detail.likes);
      setDislikes(detail.dislikes);
      setUserAction(detail.userAction);
    };

    window.addEventListener(POST_REACTION_UPDATED_EVENT, handleExternalReaction);
    return () => window.removeEventListener(POST_REACTION_UPDATED_EVENT, handleExternalReaction);
  }, [postId]);

  // 모달이 열릴 때 최근 스크랩 가져오기
  useEffect(() => {
    if (showScrapModal && isLoggedIn) {
      const loadRecentScraps = async () => {
        try {
          setIsLoadingRecent(true);
          const res = await getScrappedPosts(1, 3); // 최근 3개만 조회
          if (res.success) {
            setRecentScraps(res.posts);
          }
        } catch (error) {
          console.error('[scrap-modal] fetch recent scraps failed:', error);
        } finally {
          setIsLoadingRecent(false);
        }
      };
      loadRecentScraps();
    }
  }, [showScrapModal, isLoggedIn]);
  
  const handleReaction = async (type: ReactionType) => {
    if (!isLoggedIn) {
      toast.error('로그인이 필요한 서비스입니다.', {
        description: '추천 기능은 회원만 이용할 수 있습니다. 로그인하시겠습니까?',
        action: {
          label: '로그인',
          onClick: () => window.location.href = '/signin',
        },
        duration: 5000,
      });
      return;
    }

    if (isLiking || isDisliking) return;

    const previousAction = userAction;

    if (type === 'like') {
      setIsLiking(true);
    } else {
      setIsDisliking(true);
    }

    try {
      const result = await reactToPost(postId, type);

      if (!result.success) {
        toast.error(result?.error || `${type === 'like' ? '추천' : '비추천'} 처리 중 오류가 발생했습니다.`);
        return;
      }

      const nextAction = result.userAction || null;

      if (result.likes !== undefined) setLikes(result.likes);
      if (result.dislikes !== undefined) setDislikes(result.dislikes);
      setUserAction(nextAction);
      dispatchPostReactionUpdated({
        postId,
        likes: result.likes ?? 0,
        dislikes: result.dislikes ?? 0,
        userAction: nextAction,
      });
      toast.success(getReactionSuccessMessage(type, previousAction, nextAction));
    } catch {
      toast.error(`${type === 'like' ? '추천' : '비추천'} 처리 중 오류가 발생했습니다.`);
    } finally {
      if (type === 'like') {
        setIsLiking(false);
      } else {
        setIsDisliking(false);
      }
    }
  };

  const handleLike = () => handleReaction('like');
  const handleDislike = () => handleReaction('dislike');

  const handleScrapClick = async () => {
    if (!isLoggedIn) {
      toast.error('로그인이 필요한 서비스입니다.', {
        description: '스크랩 기능은 회원만 이용할 수 있습니다. 로그인하시겠습니까?',
        action: {
          label: '로그인',
          onClick: () => window.location.href = '/signin',
        },
        duration: 5000,
      });
      return;
    }

    if (isScraping) return;

    try {
      setIsScraping(true);
      const res = await togglePostScrap(postId);
      if (res.success) {
        setIsScrapped(!!res.scrapped);
        if (res.scrapped) {
          // 스크랩 성공 시 모달 활성화
          setShowScrapModal(true);
        } else {
          toast.success('스크랩을 취소했습니다.');
        }
      } else {
        toast.error(res.error || '스크랩 처리 중 오류가 발생했습니다.');
      }
    } catch {
      toast.error('스크랩 처리 중 오류가 발생했습니다.');
    } finally {
      setIsScraping(false);
    }
  };

  return (
    <>
      <div className="flex justify-center items-center gap-3 mt-4 mb-2">
        <Button
          variant="ghost"
          onClick={handleLike}
          disabled={isLiking || isDisliking}
          className={`rounded-md shadow-sm border ${
            userAction === 'like'
              ? 'bg-blue-500 dark:bg-blue-600 text-white border-blue-500 dark:border-blue-600 hover:bg-blue-600 dark:hover:bg-blue-700'
              : 'bg-blue-50 dark:bg-blue-950/30 border-blue-200 dark:border-blue-800/50 text-blue-600 dark:text-blue-400 hover:bg-blue-100 dark:hover:bg-blue-950/50'
          }`}
        >
          <ThumbsUp size={16} className={userAction === 'like' ? 'text-white' : 'text-blue-500 dark:text-blue-400'} />
          <span>{likes}</span>
        </Button>

        <Button
          variant="ghost"
          onClick={handleScrapClick}
          disabled={isScraping}
          className={`rounded-md shadow-sm border transition-colors ${
            isScrapped
              ? 'bg-yellow-500 dark:bg-yellow-600 text-white border-yellow-500 dark:border-yellow-600 hover:bg-yellow-600 dark:hover:bg-yellow-700'
              : 'bg-amber-50/50 dark:bg-amber-950/20 border-amber-200/60 dark:border-amber-900/40 text-amber-700 dark:text-amber-400 hover:bg-amber-100/50 dark:hover:bg-amber-950/50'
          }`}
        >
          <Bookmark size={16} className={isScrapped ? 'fill-current text-white' : 'text-amber-600 dark:text-amber-400'} />
          <span>{isScrapped ? '스크랩 완료' : '스크랩'}</span>
        </Button>

        <Button
          variant="ghost"
          onClick={handleDislike}
          disabled={isLiking || isDisliking}
          className={`rounded-md shadow-sm border ${
            userAction === 'dislike'
              ? 'bg-red-500 dark:bg-red-600 text-white border-red-500 dark:border-red-600 hover:bg-red-600 dark:hover:bg-red-700'
              : 'bg-red-50 dark:bg-red-950/30 border-red-200 dark:border-red-800/50 text-red-600 dark:text-red-400 hover:bg-red-100 dark:hover:bg-red-950/50'
          }`}
        >
          <ThumbsDown size={16} className={userAction === 'dislike' ? 'text-white' : 'text-red-500 dark:text-red-400'} />
          <span>{dislikes}</span>
        </Button>
      </div>

      {/* 🔖 스크랩 안내 및 리스트 모달 (디시인사이드 스타일) */}
      <Dialog open={showScrapModal} onOpenChange={setShowScrapModal}>
        <DialogContent variant="default" className="sm:max-w-[420px] overflow-hidden">
          <DialogHeader className="justify-between bg-gray-50 dark:bg-[#262626] border-b border-black/5 dark:border-white/10 px-4 py-2.5">
            <DialogTitle className="text-[13px] font-bold text-gray-800 dark:text-gray-200">스크랩</DialogTitle>
            <DialogCloseButton className="h-6 w-6" />
          </DialogHeader>

          <DialogBody className="py-5 px-6 flex flex-col items-center">
            {/* 완료 메시지 */}
            <div className="text-[14px] font-semibold text-gray-900 dark:text-gray-100 text-center mb-6">
              📌 스크랩에 저장되었습니다.
            </div>

            {/* 최근 스크랩 리스트 박스 */}
            <div className="w-full bg-[#FAFAFA] dark:bg-[#1A1A1A] border border-black/5 dark:border-white/5 rounded-lg p-3.5 mb-2">
              <div className="text-[11px] font-bold text-gray-400 dark:text-gray-500 uppercase tracking-wider mb-2.5">
                최근 스크랩 내역 (일부 확인)
              </div>

              {isLoadingRecent ? (
                <div className="text-center py-4 text-xs text-gray-400 dark:text-gray-500">
                  불러오는 중...
                </div>
              ) : recentScraps.length === 0 ? (
                <div className="text-center py-4 text-xs text-gray-400 dark:text-gray-500">
                  스크랩된 내역이 없습니다.
                </div>
              ) : (
                <ul className="space-y-2">
                  {recentScraps.map((item, idx) => (
                    <li key={item.id || idx} className="text-xs flex items-center justify-between gap-3 text-gray-700 dark:text-gray-300">
                      <Link 
                        href={`/boards/${item.board_slug}/${item.post_number}`} 
                        className="truncate hover:underline hover:text-brand-primary dark:hover:text-brand-primary-dark font-medium flex-1 text-left"
                        onClick={() => setShowScrapModal(false)}
                      >
                        {item.title}
                      </Link>
                      <span className="text-[10px] text-gray-400 dark:text-gray-500 shrink-0">
                        {item.board_name}
                      </span>
                    </li>
                  ))}
                </ul>
              )}
            </div>
          </DialogBody>

          {/* 모달 푸터 버튼 및 우측 하단 바로가기 링크 */}
          <DialogFooter className="border-t border-black/5 dark:border-white/10 px-4 py-3 flex items-center justify-between">
            <div className="w-20" /> {/* 빈 공간 확보 (좌측 균형용) */}
            <Button
              variant="outline"
              size="sm"
              onClick={() => setShowScrapModal(false)}
              className="h-8 text-xs font-semibold px-4 border-black/10 dark:border-white/10"
            >
              닫기
            </Button>
            <Link
              href="/settings/my-scraps"
              onClick={() => setShowScrapModal(false)}
              className="text-[11px] font-medium text-gray-500 hover:text-brand-primary dark:text-gray-400 dark:hover:text-brand-primary-dark flex items-center gap-0.5 hover:underline"
              prefetch={false}
            >
              스크랩 보기 ▶
            </Link>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
