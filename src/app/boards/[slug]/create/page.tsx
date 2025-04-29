import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/app/ui/card';
import { Button } from '@/app/ui/button';
import Link from 'next/link';
import PostEditForm from '@/app/boards/components/PostEditForm';
import { getBoardBySlugOrId, getAllBoards } from '@/app/actions/boards';
import { Metadata } from 'next';

// 메타데이터 생성 함수
export async function generateMetadata({ 
  params 
}: { 
  params: { slug: string } 
}): Promise<Metadata> {
  // params를 await하여 사용
  const resolvedParams = await params;
  try {
    const boardInfo = await getBoardBySlugOrId(resolvedParams.slug);
    return {
      title: `새 글 작성 - ${boardInfo.name}`,
      description: `${boardInfo.name} 게시판에 새 글을 작성합니다.`
    };
  } catch {
    // 오류 발생 시 기본 메타데이터 반환
    return {
      title: '새 글 작성',
      description: '게시판에 새 글을 작성합니다.'
    };
  }
}

// 서버 컴포넌트
export default async function CreatePostPage({ 
  params 
}: { 
  params: { slug: string } 
}) {
  // params를 await하여 사용
  const resolvedParams = await params;
  
  try {
    // 서버 액션으로 데이터 가져오기
    const boardInfo = await getBoardBySlugOrId(resolvedParams.slug);
    const allBoards = await getAllBoards();

    return (
      <div className="container mx-auto">
        <div className="bg-white p-0 rounded-md">
          <PostEditForm 
            boardId={boardInfo.id}
            _boardSlug={boardInfo.slug}
            initialTitle=""
            initialContent=""
            boardName={boardInfo.name}
            categoryId={boardInfo.id}
            allBoardsFlat={allBoards}
            isCreateMode={true}
          />
        </div>
      </div>
    );
  } catch {
    // 오류 발생시 표시할 UI
    return (
      <div className="container mx-auto py-8">
        <Card>
          <CardHeader>
            <CardTitle>오류</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-red-600">게시판 정보를 불러오는 중 오류가 발생했습니다.</p>
            <div className="mt-4">
              <Link href="/boards">
                <Button>게시판 목록으로</Button>
              </Link>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }
} 