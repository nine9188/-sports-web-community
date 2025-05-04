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
  
  const { data: postData, error } = await supabase
    .from('posts')
    .select('likes, dislikes')
    .eq('id', postId)
    .single();
  
  if (error) {
    console.error('게시글 정보 가져오기 오류:', error);
    // 오류가 발생해도 기본값으로 컴포넌트를 렌더링
    return <PostActions postId={postId} boardId={boardId || ''} initialLikes={0} initialDislikes={0} />;
  }
  
  // SSR로 가져온 초기 데이터를 클라이언트 컴포넌트에 전달
  return (
    <PostActions 
      postId={postId} 
      boardId={boardId || ''} 
      initialLikes={postData.likes || 0} 
      initialDislikes={postData.dislikes || 0} 
    />
  );
} 