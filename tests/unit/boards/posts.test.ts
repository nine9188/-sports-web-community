/**
 * boards/posts 테스트
 *
 * 게시글 생성/삭제 서버 액션 테스트
 */
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { createPostWithParams, createPost } from '@/domains/boards/actions/posts/create';
import { deletePost } from '@/domains/boards/actions/posts/delete';
import {
  mockSupabaseClient,
  mockSuccess,
  mockError,
  createMockUser,
} from '../../setup';

// 활동 보상 모킹
vi.mock('@/shared/actions/activity-actions', () => ({
  rewardUserActivity: vi.fn().mockResolvedValue({ success: true }),
  getActivityTypeValues: vi.fn().mockResolvedValue({ POST_CREATION: 'post_creation' }),
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
  logError: vi.fn(),
}));

import { checkSuspensionGuard } from '@/shared/utils/suspension-guard';
const mockCheckSuspension = checkSuspensionGuard as ReturnType<typeof vi.fn>;

describe('createPostWithParams', () => {
  const mockUser = createMockUser();

  beforeEach(() => {
    vi.clearAllMocks();
    mockCheckSuspension.mockResolvedValue({ isSuspended: false });
  });

  describe('입력 검증', () => {
    it('제목 미입력 시 실패', async () => {
      const result = await createPostWithParams('', 'content', 'board-1', mockUser.id);

      expect(result.success).toBe(false);
      expect(result.error).toContain('필수 입력값');
    });

    it('내용 미입력 시 실패', async () => {
      const result = await createPostWithParams('title', '', 'board-1', mockUser.id);

      expect(result.success).toBe(false);
      expect(result.error).toContain('필수 입력값');
    });

    it('게시판 ID 미입력 시 실패', async () => {
      const result = await createPostWithParams('title', 'content', '', mockUser.id);

      expect(result.success).toBe(false);
      expect(result.error).toContain('필수 입력값');
    });

    it('사용자 ID 미입력 시 실패', async () => {
      const result = await createPostWithParams('title', 'content', 'board-1', '');

      expect(result.success).toBe(false);
      expect(result.error).toContain('필수 입력값');
    });
  });

  describe('계정 정지 확인', () => {
    it('정지된 계정은 게시글 작성 차단', async () => {
      mockCheckSuspension.mockResolvedValue({
        isSuspended: true,
        message: '계정이 정지되었습니다.',
      });

      const result = await createPostWithParams('title', 'content', 'board-1', mockUser.id);

      expect(result.success).toBe(false);
      expect(result.error).toContain('정지');
    });
  });

  describe('게시글 생성', () => {
    it('정상적인 게시글 생성 성공', async () => {
      const fromMock = vi.fn();

      // 1. 게시판 정보 조회
      fromMock.mockReturnValueOnce({
        select: vi.fn().mockReturnThis(),
        eq: vi.fn().mockReturnThis(),
        single: vi.fn().mockResolvedValue(mockSuccess({
          id: 'board-1',
          name: '자유게시판',
          slug: 'free',
        })),
      });

      // 2. 게시글 생성
      fromMock.mockReturnValueOnce({
        insert: vi.fn().mockReturnThis(),
        select: vi.fn().mockReturnThis(),
        single: vi.fn().mockResolvedValue(mockSuccess({
          id: 'post-1',
          post_number: 123,
          title: '테스트 제목',
          board: { slug: 'free' },
        })),
      });

      // 3. 게시글 개수 조회 (첫 게시글 마일스톤)
      fromMock.mockReturnValueOnce({
        select: vi.fn().mockReturnThis(),
        eq: vi.fn().mockResolvedValue({ count: 5, error: null }),
      });

      mockSupabaseClient.from = fromMock;

      const result = await createPostWithParams('테스트 제목', '테스트 내용', 'board-1', mockUser.id);

      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.postId).toBe('post-1');
        expect(result.postNumber).toBe(123);
        expect(result.boardSlug).toBe('free');
      }
    });

    it('존재하지 않는 게시판 ID', async () => {
      mockSupabaseClient.from.mockReturnValue({
        select: vi.fn().mockReturnThis(),
        eq: vi.fn().mockReturnThis(),
        single: vi.fn().mockResolvedValue(mockError('Not found')),
      });

      const result = await createPostWithParams('title', 'content', 'invalid-board', mockUser.id);

      expect(result.success).toBe(false);
      expect(result.error).toContain('게시판 정보');
    });

    it('게시글 생성 DB 오류', async () => {
      const fromMock = vi.fn();

      // 1. 게시판 정보 조회 성공
      fromMock.mockReturnValueOnce({
        select: vi.fn().mockReturnThis(),
        eq: vi.fn().mockReturnThis(),
        single: vi.fn().mockResolvedValue(mockSuccess({
          id: 'board-1',
          name: '자유게시판',
          slug: 'free',
        })),
      });

      // 2. 게시글 생성 실패
      fromMock.mockReturnValueOnce({
        insert: vi.fn().mockReturnThis(),
        select: vi.fn().mockReturnThis(),
        single: vi.fn().mockResolvedValue(mockError('Database error')),
      });

      mockSupabaseClient.from = fromMock;

      const result = await createPostWithParams('title', 'content', 'board-1', mockUser.id);

      expect(result.success).toBe(false);
      expect(result.error).toContain('게시글 작성 실패');
    });
  });
});

describe('createPost (FormData)', () => {
  const mockUser = createMockUser();

  beforeEach(() => {
    vi.clearAllMocks();
    mockCheckSuspension.mockResolvedValue({ isSuspended: false });
  });

  it('로그인 필요', async () => {
    mockSupabaseClient.auth.getUser.mockResolvedValue(
      mockSuccess({ user: null })
    );

    const formData = new FormData();
    formData.append('title', '제목');
    formData.append('content', '내용');
    formData.append('boardId', 'board-1');

    const result = await createPost(formData);

    expect(result.success).toBe(false);
    expect(result.error).toContain('로그인');
  });

  it('필수값 누락', async () => {
    mockSupabaseClient.auth.getUser.mockResolvedValue(
      mockSuccess({ user: mockUser })
    );

    const formData = new FormData();
    formData.append('title', '제목');
    // content와 boardId 누락

    const result = await createPost(formData);

    expect(result.success).toBe(false);
    expect(result.error).toContain('필수 입력값');
  });

  it('FormData로 게시글 생성 성공', async () => {
    mockSupabaseClient.auth.getUser.mockResolvedValue(
      mockSuccess({ user: mockUser })
    );

    const fromMock = vi.fn();

    // 1. 게시판 정보 조회
    fromMock.mockReturnValueOnce({
      select: vi.fn().mockReturnThis(),
      eq: vi.fn().mockReturnThis(),
      single: vi.fn().mockResolvedValue(mockSuccess({
        id: 'board-1',
        name: '자유게시판',
        slug: 'free',
      })),
    });

    // 2. 게시글 생성
    fromMock.mockReturnValueOnce({
      insert: vi.fn().mockReturnThis(),
      select: vi.fn().mockReturnThis(),
      single: vi.fn().mockResolvedValue(mockSuccess({
        id: 'post-1',
        post_number: 100,
        title: '테스트 제목',
        board: { slug: 'free' },
      })),
    });

    // 3. 게시글 개수 조회
    fromMock.mockReturnValueOnce({
      select: vi.fn().mockReturnThis(),
      eq: vi.fn().mockResolvedValue({ count: 2, error: null }),
    });

    mockSupabaseClient.from = fromMock;

    const formData = new FormData();
    formData.append('title', '테스트 제목');
    formData.append('content', '테스트 내용');
    formData.append('boardId', 'board-1');

    const result = await createPost(formData);

    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.post).toBeDefined();
    }
  });
});

describe('deletePost', () => {
  const mockUser = createMockUser();

  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('입력 검증', () => {
    it('postId 미입력 시 실패', async () => {
      const result = await deletePost('', mockUser.id);

      expect(result.success).toBe(false);
      expect(result.error).toContain('필수 입력값');
    });

    it('userId 미입력 시 실패', async () => {
      const result = await deletePost('post-1', '');

      expect(result.success).toBe(false);
      expect(result.error).toContain('필수 입력값');
    });
  });

  describe('권한 확인', () => {
    it('존재하지 않는 게시글', async () => {
      mockSupabaseClient.from.mockReturnValue({
        select: vi.fn().mockReturnThis(),
        eq: vi.fn().mockReturnThis(),
        single: vi.fn().mockResolvedValue(mockError('No rows found')),
      });

      const result = await deletePost('nonexistent-post', mockUser.id);

      expect(result.success).toBe(false);
      expect(result.error).toContain('게시글을 찾을 수 없습니다');
    });

    it('타인의 게시글 삭제 시도 거부', async () => {
      mockSupabaseClient.from.mockReturnValue({
        select: vi.fn().mockReturnThis(),
        eq: vi.fn().mockReturnThis(),
        single: vi.fn().mockResolvedValue(mockSuccess({
          user_id: 'other-user-id',
          board_id: 'board-1',
        })),
      });

      const result = await deletePost('post-1', mockUser.id);

      expect(result.success).toBe(false);
      expect(result.error).toContain('본인이 작성한 게시글만');
    });
  });

  describe('게시글 삭제', () => {
    it('정상적인 게시글 삭제', async () => {
      const fromMock = vi.fn();

      // 1. 게시글 조회 (권한 확인)
      fromMock.mockReturnValueOnce({
        select: vi.fn().mockReturnThis(),
        eq: vi.fn().mockReturnThis(),
        single: vi.fn().mockResolvedValue(mockSuccess({
          user_id: mockUser.id,
          board_id: 'board-1',
        })),
      });

      // 2. 게시판 정보 조회
      fromMock.mockReturnValueOnce({
        select: vi.fn().mockReturnThis(),
        eq: vi.fn().mockReturnThis(),
        single: vi.fn().mockResolvedValue(mockSuccess({
          slug: 'free',
        })),
      });

      // 3. 댓글 삭제
      fromMock.mockReturnValueOnce({
        delete: vi.fn().mockReturnThis(),
        eq: vi.fn().mockResolvedValue(mockSuccess(null)),
      });

      // 4. 좋아요/싫어요 삭제
      fromMock.mockReturnValueOnce({
        delete: vi.fn().mockReturnThis(),
        eq: vi.fn().mockResolvedValue(mockSuccess(null)),
      });

      // 5. 게시글 삭제
      fromMock.mockReturnValueOnce({
        delete: vi.fn().mockReturnThis(),
        eq: vi.fn().mockResolvedValue(mockSuccess(null)),
      });

      mockSupabaseClient.from = fromMock;

      const result = await deletePost('post-1', mockUser.id);

      expect(result.success).toBe(true);
      expect(result.boardSlug).toBe('free');
    });

    it('댓글 삭제 실패', async () => {
      const fromMock = vi.fn();

      // 1. 게시글 조회 (권한 확인)
      fromMock.mockReturnValueOnce({
        select: vi.fn().mockReturnThis(),
        eq: vi.fn().mockReturnThis(),
        single: vi.fn().mockResolvedValue(mockSuccess({
          user_id: mockUser.id,
          board_id: 'board-1',
        })),
      });

      // 2. 게시판 정보 조회
      fromMock.mockReturnValueOnce({
        select: vi.fn().mockReturnThis(),
        eq: vi.fn().mockReturnThis(),
        single: vi.fn().mockResolvedValue(mockSuccess({
          slug: 'free',
        })),
      });

      // 3. 댓글 삭제 실패
      fromMock.mockReturnValueOnce({
        delete: vi.fn().mockReturnThis(),
        eq: vi.fn().mockResolvedValue(mockError('Foreign key constraint')),
      });

      mockSupabaseClient.from = fromMock;

      const result = await deletePost('post-1', mockUser.id);

      expect(result.success).toBe(false);
      expect(result.error).toContain('댓글 삭제 실패');
    });
  });
});
