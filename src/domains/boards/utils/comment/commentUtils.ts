// 댓글 관련 클라이언트 유틸리티 함수
import { CommentType } from '../../types/post/comment';

/**
 * 댓글 계층 구조를 구성합니다.
 * @param comments 모든 댓글 배열 (플랫 구조)
 * @returns 계층화된 댓글 배열 (트리 구조)
 */
export function buildCommentTree(comments: CommentType[]): CommentType[] {
  const commentMap: Record<string, CommentType> = {};
  const rootComments: CommentType[] = [];

  // 먼저 모든 댓글을 맵에 저장 (children 배열 초기화)
  comments.forEach(comment => {
    commentMap[comment.id] = {
      ...comment,
      children: []
    };
  });

  // 부모-자식 관계 설정
  comments.forEach(comment => {
    if (comment.parent_id) {
      const parent = commentMap[comment.parent_id];
      if (parent && parent.children) {
        parent.children.push(commentMap[comment.id]);
      } else {
        // 부모를 찾을 수 없는 경우 루트로 처리
        rootComments.push(commentMap[comment.id]);
      }
    } else {
      rootComments.push(commentMap[comment.id]);
    }
  });

  return rootComments;
}

/**
 * 댓글 개수를 계산합니다 (대댓글 포함).
 * @param comments 모든 댓글 배열
 * @returns 전체 댓글 수
 */
export function getTotalCommentCount(comments: CommentType[]): number {
  return comments.length;
}








