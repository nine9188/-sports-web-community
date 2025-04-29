import React from 'react';
import { createClient } from '@/app/lib/supabase.server';
import { notFound, redirect } from 'next/navigation';
import PostEditForm from '@/app/boards/components/PostEditForm';

export const revalidate = 0;
export const dynamic = 'force-dynamic';

export default async function EditPostPage({ params }: { params: Promise<{ slug: string, postNumber: string }> }) {
  try {
    const { slug, postNumber } = await params;
    const supabase = await createClient();
    
    // 세션 정보 가져오기
    const { data: userData } = await supabase.auth.getUser();
    const userId = userData?.user?.id;
    
    if (!userId) {
      redirect(`/login?message=로그인이+필요한+기능입니다&redirect=/boards/${slug}/${postNumber}`);
    }
    
    // slug로 게시판 정보 가져오기
    const { data: board, error: boardError } = await supabase
      .from('boards')
      .select('*')
      .eq('slug', slug)
      .single();
      
    if (boardError || !board) {
      return notFound();
    }
    
    // 게시물 정보 가져오기
    const { data: post, error: postError } = await supabase
      .from('posts')
      .select('*, profiles(nickname), board:board_id(name)')
      .eq('board_id', board.id)
      .eq('post_number', postNumber)
      .single();
      
    if (postError || !post) {
      return notFound();
    }
    
    // 작성자가 아니면 원래 게시글로 리다이렉트
    if (post.user_id !== userId) {
      redirect(`/boards/${slug}/${postNumber}?message=본인+작성글만+수정할+수+있습니다`);
    }
    
    return (
      <div className="container mx-auto">
        <PostEditForm 
          postId={post.id}
          boardId={board.id}
          _boardSlug={slug}
          _postNumber={postNumber}
          initialTitle={post.title}
          initialContent={post.content}
          boardName={board.name}
          isCreateMode={false}
        />
      </div>
    );
  } catch {
    return notFound();
  }
} 