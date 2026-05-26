export type PostReactionType = 'like' | 'dislike';

export interface PostReactionResult {
  success?: boolean;
  likes?: number;
  dislikes?: number;
  userAction?: PostReactionType | null;
  error?: string;
}

export async function reactToPost(
  postId: string,
  type: PostReactionType
): Promise<PostReactionResult> {
  const response = await fetch(`/api/posts/${postId}/reaction`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ type }),
  });

  const result = await response.json().catch(() => null) as PostReactionResult | null;

  if (!response.ok || !result?.success) {
    return {
      success: false,
      error: result?.error || `${type === 'like' ? '추천' : '비추천'} 처리 중 오류가 발생했습니다.`,
    };
  }

  return result;
}
