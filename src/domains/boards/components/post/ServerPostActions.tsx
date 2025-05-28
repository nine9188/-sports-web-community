import { createClient } from '@/shared/api/supabaseServer';
import PostActions from '@/domains/boards/components/post/PostActions';

interface ServerPostActionsProps {
  postId: string;
  boardId?: string;
}

export default async function ServerPostActions({ 
  postId, 
  boardId 
}: ServerPostActionsProps) {
  // 서버에서 초기 좋아요/싫어요 데이터를 가져옴
  const supabase = await createClient();
  
  // 현재 사용자 확인
  const { data: { user } } = await supabase.auth.getUser();
  
  const [postResult, userActionResult] = await Promise.all([
    // 게시글 좋아요/싫어요 수 조회
    supabase
      .from('posts')
      .select('likes, dislikes')
      .eq('id', postId)
      .single(),
    
    // 사용자 액션 조회 (로그인한 경우에만)
    user ? supabase
      .from('post_likes')
      .select('type')
      .eq('post_id', postId)
      .eq('user_id', user.id)
      .maybeSingle() : Promise.resolve({ data: null })
  ]);
  
  const { data: postData, error: postError } = postResult;
  const { data: userActionData } = userActionResult;
  
  if (postError) {
    console.error('게시글 정보 가져오기 오류:', postError);
    // 오류가 발생해도 기본값으로 컴포넌트를 렌더링
    return <PostActions postId={postId} boardId={boardId || ''} initialLikes={0} initialDislikes={0} initialUserAction={null} />;
  }
  
  // 사용자 액션 처리
  const initialUserAction: 'like' | 'dislike' | null = userActionData?.type === 'like' ? 'like' :
                                                       userActionData?.type === 'dislike' ? 'dislike' :
                                                       null;
  
  // SSR로 가져온 초기 데이터를 클라이언트 컴포넌트에 전달
  return (
    <PostActions 
      postId={postId} 
      boardId={boardId || ''} 
      initialLikes={postData.likes || 0} 
      initialDislikes={postData.dislikes || 0} 
      initialUserAction={initialUserAction}
    />
  );
} 