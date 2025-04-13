import { createClient } from '@/app/lib/supabase.server';
import { SupabaseClient } from '@supabase/supabase-js';
import { Database } from '@/app/lib/database.types';

// 로깅을 추가하여 디버깅
export async function incrementViews(postId: string, supabase: SupabaseClient<Database>) {
  try {
    // 현재 조회수 가져오기
    const { data: post, error: getError } = await supabase
      .from('posts')
      .select('views')
      .eq('id', postId)
      .single();
    
    if (getError) {
      throw getError;
    }
    
    // 조회수 증가
    const currentViews = post?.views || 0;
    const newViews = currentViews + 1;
    
    // 조회수 업데이트 - 단순히 posts 테이블만 업데이트
    const { error: updateError } = await supabase
      .from('posts')
      .update({ views: newViews })
      .eq('id', postId);
    
    if (updateError) {
      throw updateError;
    }
    
    return true;
  } catch {
    return false;
  }
}

// 서버 컴포넌트에서 호출할 조회수 증가 함수
export async function incrementViewCount(postId: string) {
  try {
    const supabase = await createClient();
    
    // 게시글 정보 조회
    const { data: post, error: postError } = await supabase
      .from('posts')
      .select('views')
      .eq('id', postId)
      .single();
    
    if (postError) {
      return false;
    }
    
    const currentViews = post?.views || 0;
    const newViews = currentViews + 1;
    
    // 조회수 증가 - 단순히 posts 테이블만 업데이트
    const { error: updateError } = await supabase
      .from('posts')
      .update({ views: newViews })
      .eq('id', postId);
    
    if (updateError) {
      return false;
    }
    
    return true;
  } catch {
    return false;
  }
} 