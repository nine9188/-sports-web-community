/**
 * boards/comments 테스트
 *
 * 댓글 생성/삭제 서버 액션 테스트
 */
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { createComment } from '@/domains/comments/actions/create';
import { deleteComment } from '@/domains/comments/actions/delete';
import {
  mockSupabaseClient,
  mockSuccess,
  mockError,
  createMockUser,
} from '../../setup';

// 활동 보상 모킹
vi.mock('@/shared/actions/activity-actions', () => ({
  rewardUserActivity: vi.fn().mockResolvedValue({ success: true }),
  getActivityTypeValues: vi.fn().mockResolvedValue({ COMMENT_CREATION: 'comment_creation' }),
}));

// 추천 시스템 모킹
vi.mock('@/shared/actions/referral-actions', () => ({
  checkReferralMilestone: vi.fn().mockResolvedValue({ success: true }),
}));

// 정지 확인 모킹
vi.mock('@/shared/utils/suspension-guard', () => ({
  checkSuspensionGuard: vi.fn().mockResolvedValue({ isSuspended: false }),
}));

// 로그 액션 모킹
vi.mock('@/shared/actions/log-actions', () => ({
  logUserAction: vi.fn(),
}));

// 알림 액션 모킹
vi.mock('@/domains/notifications/actions', () => ({
  createCommentNotification: vi.fn().mockResolvedValue({ success: true }),
  createReplyNotification: vi.fn().mockResolvedValue({ success: true }),
}));

import { checkSuspensionGuard } from '@/shared/utils/suspension-guard';
const mockCheckSuspension = checkSuspensionGuard as ReturnType<typeof vi.fn>;

describe('createComment', () => {
  const mockUser = createMockUser();

  beforeEach(() => {
    vi.clearAllMocks();
    mockCheckSuspension.mockResolvedValue({ isSuspended: false });
  });

  describe('인증 확인', () => {
    it('로그인 필요', async () => {
      mockSupabaseClient.auth.getUser.mockResolvedValue(
        mockSuccess({ user: null })
      );

      const result = await createComment({
        postId: 'post-1',
        content: '댓글 내용',
      });

      expect(result.success).toBe(false);
      expect(result.error).toContain('로그인');
    });
  });

  describe('계정 정지 확인', () => {
    it('정지된 계정은 댓글 작성 차단', async () => {
      mockSupabaseClient.auth.getUser.mockResolvedValue(
        mockSuccess({ user: mockUser })
      );

      mockCheckSuspension.mockResolvedValue({
        isSuspended: true,
        message: '계정이 정지되었습니다.',
      });

      const result = await createComment({
        postId: 'post-1',
        content: '댓글 내용',
      });

      expect(result.success).toBe(false);
      expect(result.error).toContain('정지');
    });
  });

  describe('대댓글 검증', () => {
    it('존재하지 않는 부모 댓글', async () => {
      mockSupabaseClient.auth.getUser.mockResolvedValue(
        mockSuccess({ user: mockUser })
      );

      mockSupabaseClient.from.mockReturnValue({
        select: vi.fn().mockReturnThis(),
        eq: vi.fn().mockReturnThis(),
        single: vi.fn().mockResolvedValue(mockError('No rows found')),
      });

      const result = await createComment({
        postId: 'post-1',
        content: '대댓글 내용',
        parentId: 'nonexistent-comment',
      });

      expect(result.success).toBe(false);
      expect(result.error).toContain('원본 댓글을 찾을 수 없습니다');
    });

    it('다른 게시글의 댓글에 대댓글 시도', async () => {
      mockSupabaseClient.auth.getUser.mockResolvedValue(
        mockSuccess({ user: mockUser })
      );

      mockSupabaseClient.from.mockReturnValue({
        select: vi.fn().mockReturnThis(),
        eq: vi.fn().mockReturnThis(),
        single: vi.fn().mockResolvedValue(mockSuccess({
          id: 'comment-1',
          post_id: 'different-post', // 다른 게시글
          user_id: 'other-user',
        })),
      });

      const result = await createComment({
        postId: 'post-1',
        content: '대댓글 내용',
        parentId: 'comment-1',
      });

      expect(result.success).toBe(false);
      expect(result.error).toContain('잘못된 요청');
    });
  });

  describe('댓글 생성', () => {
    it('정상적인 댓글 생성', async () => {
      mockSupabaseClient.auth.getUser.mockResolvedValue(
        mockSuccess({ user: mockUser })
      );

      const fromMock = vi.fn();

      // 1. 댓글 생성
      fromMock.mockReturnValueOnce({
        insert: vi.fn().mockReturnThis(),
        select: vi.fn().mockReturnThis(),
        single: vi.fn().mockResolvedValue(mockSuccess({
          id: 'comment-new',
          post_id: 'post-1',
          user_id: mockUser.id,
          content: '테스트 댓글',
          profiles: {
            nickname: '테스트유저',
            icon_id: null,
            level: 1,
          },
        })),
      });

      // 2. 댓글 개수 조회 (첫 댓글 마일스톤)
      fromMock.mockReturnValueOnce({
        select: vi.fn().mockReturnThis(),
        eq: vi.fn().mockResolvedValue({ count: 5, error: null }),
      });

      // 3. 게시글 정보 조회 (알림용)
      fromMock.mockReturnValueOnce({
        select: vi.fn().mockReturnThis(),
        eq: vi.fn().mockReturnThis(),
        single: vi.fn().mockResolvedValue(mockSuccess({
          user_id: 'post-owner',
          title: '테스트 게시글',
          post_number: 100,
          board: { slug: 'free' },
        })),
      });

      mockSupabaseClient.from = fromMock;

      const result = await createComment({
        postId: 'post-1',
        content: '테스트 댓글',
      });

      expect(result.success).toBe(true);
      if (result.success && result.comment) {
        expect(result.comment.content).toBe('테스트 댓글');
      }
    });

    it('커스텀 아이콘이 있는 댓글 생성', async () => {
      mockSupabaseClient.auth.getUser.mockResolvedValue(
        mockSuccess({ user: mockUser })
      );

      const fromMock = vi.fn();

      // 1. 댓글 생성
      fromMock.mockReturnValueOnce({
        insert: vi.fn().mockReturnThis(),
        select: vi.fn().mockReturnThis(),
        single: vi.fn().mockResolvedValue(mockSuccess({
          id: 'comment-new',
          post_id: 'post-1',
          user_id: mockUser.id,
          content: '테스트 댓글',
          profiles: {
            nickname: '테스트유저',
            icon_id: 'icon-123',
            level: 5,
          },
        })),
      });

      // 2. 아이콘 정보 조회
      fromMock.mockReturnValueOnce({
        select: vi.fn().mockReturnThis(),
        eq: vi.fn().mockReturnThis(),
        single: vi.fn().mockResolvedValue(mockSuccess({
          image_url: 'https://example.com/icon.png',
        })),
      });

      // 3. 댓글 개수 조회
      fromMock.mockReturnValueOnce({
        select: vi.fn().mockReturnThis(),
        eq: vi.fn().mockResolvedValue({ count: 10, error: null }),
      });

      // 4. 게시글 정보 조회
      fromMock.mockReturnValueOnce({
        select: vi.fn().mockReturnThis(),
        eq: vi.fn().mockReturnThis(),
        single: vi.fn().mockResolvedValue(mockSuccess({
          user_id: 'post-owner',
          title: '테스트 게시글',
          post_number: 100,
          board: { slug: 'free' },
        })),
      });

      mockSupabaseClient.from = fromMock;

      const result = await createComment({
        postId: 'post-1',
        content: '테스트 댓글',
      });

      expect(result.success).toBe(true);
    });

    it('대댓글 생성 성공', async () => {
      mockSupabaseClient.auth.getUser.mockResolvedValue(
        mockSuccess({ user: mockUser })
      );

      const fromMock = vi.fn();

      // 1. 부모 댓글 확인
      fromMock.mockReturnValueOnce({
        select: vi.fn().mockReturnThis(),
        eq: vi.fn().mockReturnThis(),
        single: vi.fn().mockResolvedValue(mockSuccess({
          id: 'parent-comment',
          post_id: 'post-1',
          user_id: 'parent-author',
        })),
      });

      // 2. 대댓글 생성
      fromMock.mockReturnValueOnce({
        insert: vi.fn().mockReturnThis(),
        select: vi.fn().mockReturnThis(),
        single: vi.fn().mockResolvedValue(mockSuccess({
          id: 'reply-comment',
          post_id: 'post-1',
          user_id: mockUser.id,
          content: '대댓글입니다',
          parent_id: 'parent-comment',
          profiles: {
            nickname: '테스트유저',
            icon_id: null,
            level: 1,
          },
        })),
      });

      // 3. 댓글 개수 조회
      fromMock.mockReturnValueOnce({
        select: vi.fn().mockReturnThis(),
        eq: vi.fn().mockResolvedValue({ count: 3, error: null }),
      });

      // 4. 게시글 정보 조회
      fromMock.mockReturnValueOnce({
        select: vi.fn().mockReturnThis(),
        eq: vi.fn().mockReturnThis(),
        single: vi.fn().mockResolvedValue(mockSuccess({
          user_id: 'post-owner',
          title: '테스트 게시글',
          post_number: 100,
          board: { slug: 'free' },
        })),
      });

      mockSupabaseClient.from = fromMock;

      const result = await createComment({
        postId: 'post-1',
        content: '대댓글입니다',
        parentId: 'parent-comment',
      });

      expect(result.success).toBe(true);
    });

    it('댓글 생성 DB 오류', async () => {
      mockSupabaseClient.auth.getUser.mockResolvedValue(
        mockSuccess({ user: mockUser })
      );

      mockSupabaseClient.from.mockReturnValue({
        insert: vi.fn().mockReturnThis(),
        select: vi.fn().mockReturnThis(),
        single: vi.fn().mockResolvedValue(mockError('Database error')),
      });

      const result = await createComment({
        postId: 'post-1',
        content: '테스트 댓글',
      });

      expect(result.success).toBe(false);
      expect(result.error).toBe('Database error');
    });
  });
});

describe('deleteComment', () => {
  const mockUser = createMockUser();

  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('인증 확인', () => {
    it('로그인 필요', async () => {
      mockSupabaseClient.auth.getUser.mockResolvedValue(
        mockSuccess({ user: null })
      );

      const result = await deleteComment('comment-1');

      expect(result.success).toBe(false);
      expect(result.error).toContain('로그인');
    });
  });

  describe('권한 확인', () => {
    it('존재하지 않는 댓글', async () => {
      mockSupabaseClient.auth.getUser.mockResolvedValue(
        mockSuccess({ user: mockUser })
      );

      mockSupabaseClient.from.mockReturnValue({
        select: vi.fn().mockReturnThis(),
        eq: vi.fn().mockReturnThis(),
        single: vi.fn().mockResolvedValue(mockError('No rows found')),
      });

      const result = await deleteComment('nonexistent-comment');

      expect(result.success).toBe(false);
    });

    it('타인의 댓글 삭제 시도 거부', async () => {
      mockSupabaseClient.auth.getUser.mockResolvedValue(
        mockSuccess({ user: mockUser })
      );

      mockSupabaseClient.from.mockReturnValue({
        select: vi.fn().mockReturnThis(),
        eq: vi.fn().mockReturnThis(),
        single: vi.fn().mockResolvedValue(mockSuccess({
          user_id: 'other-user-id',
        })),
      });

      const result = await deleteComment('comment-1');

      expect(result.success).toBe(false);
      expect(result.error).toContain('자신의 댓글만');
    });
  });

  describe('댓글 삭제', () => {
    it('정상적인 댓글 삭제', async () => {
      mockSupabaseClient.auth.getUser.mockResolvedValue(
        mockSuccess({ user: mockUser })
      );

      const fromMock = vi.fn();

      // 1. 댓글 조회 (권한 확인)
      fromMock.mockReturnValueOnce({
        select: vi.fn().mockReturnThis(),
        eq: vi.fn().mockReturnThis(),
        single: vi.fn().mockResolvedValue(mockSuccess({
          user_id: mockUser.id,
        })),
      });

      // 2. 댓글 삭제
      fromMock.mockReturnValueOnce({
        delete: vi.fn().mockReturnThis(),
        eq: vi.fn().mockResolvedValue(mockSuccess(null)),
      });

      mockSupabaseClient.from = fromMock;

      const result = await deleteComment('comment-1');

      expect(result.success).toBe(true);
    });

    it('댓글 삭제 DB 오류', async () => {
      mockSupabaseClient.auth.getUser.mockResolvedValue(
        mockSuccess({ user: mockUser })
      );

      const fromMock = vi.fn();

      // 1. 댓글 조회 (권한 확인)
      fromMock.mockReturnValueOnce({
        select: vi.fn().mockReturnThis(),
        eq: vi.fn().mockReturnThis(),
        single: vi.fn().mockResolvedValue(mockSuccess({
          user_id: mockUser.id,
        })),
      });

      // 2. 댓글 삭제 실패
      fromMock.mockReturnValueOnce({
        delete: vi.fn().mockReturnThis(),
        eq: vi.fn().mockResolvedValue(mockError('Foreign key constraint')),
      });

      mockSupabaseClient.from = fromMock;

      const result = await deleteComment('comment-1');

      expect(result.success).toBe(false);
      expect(result.error).toBe('Foreign key constraint');
    });
  });
});
