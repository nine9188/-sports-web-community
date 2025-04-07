'use client';

import React, { useState, useEffect } from 'react';
import { createClient } from '@/app/lib/supabase-browser';
import { Button } from '@/app/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/app/ui/card';
import Link from 'next/link';
import PostEditForm from '@/app/boards/components/PostEditForm';

// 인라인 Spinner 컴포넌트 정의
function Spinner({ className = "" }: { className?: string }) {
  return (
    <div className={`inline-block h-4 w-4 animate-spin rounded-full border-2 border-solid border-current border-r-transparent align-[-0.125em] motion-reduce:animate-[spin_1.5s_linear_infinite] ${className}`} role="status">
      <span className="!absolute !-m-px !h-px !w-px !overflow-hidden !whitespace-nowrap !border-0 !p-0 ![clip:rect(0,0,0,0)]">로딩 중...</span>
    </div>
  );
}

// 게시판 타입 정의 - PostEditForm의 Board 인터페이스와 호환되도록 정의
interface Board {
  id: string;
  name: string;
  description: string;
  parent_id: string | null;
  slug: string;
  display_order: number; // 필수 필드로 추가
  children?: Board[];
}

export default function CreatePostPage({ params }: { params: Promise<{ slug: string }> }) {
  // params는 Promise입니다
  const [boardSlug, setBoardSlug] = useState<string | null>(null);
  const [boardId, setBoardId] = useState<string | null>(null);
  const supabase = createClient();
  
  const [categoryId, setCategoryId] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  
  // 게시판 정보와 카테고리
  const [boardInfo, setBoardInfo] = useState<Board | null>(null);
  const [allBoardsFlat, setAllBoardsFlat] = useState<Board[]>([]);
  
  // 컴포넌트 마운트 시 params Promise를 처리하고 게시판 정보를 가져옴
  useEffect(() => {
    const resolveParams = async () => {
      try {
        const resolvedParams = await params;
        setBoardSlug(resolvedParams.slug);
        
        // slug가 UUID인 경우 ID로 조회
        const isUUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(resolvedParams.slug);
        
        let board;
        
        if (isUUID) {
          // ID로 게시판 조회
          const { data: boardById, error: boardByIdError } = await supabase
            .from('boards')
            .select('*')
            .eq('id', resolvedParams.slug)
            .single();
            
          if (!boardByIdError && boardById) {
            board = boardById;
          }
        } else {
          // slug로 게시판 조회
          const { data: boardBySlug, error: boardBySlugError } = await supabase
            .from('boards')
            .select('*')
            .eq('slug', resolvedParams.slug)
            .single();
            
          if (!boardBySlugError && boardBySlug) {
            board = boardBySlug;
          }
        }
        
        if (!board) {
          setError('게시판 정보를 찾을 수 없습니다.');
          setLoading(false);
          return;
        }
        
        setBoardId(board.id);
        setCategoryId(board.id);
        setBoardInfo(board);
        
        // 모든 게시판 정보 가져오기
        const { data: allBoards, error: allBoardsError } = await supabase
          .from('boards')
          .select('*');
          
        if (allBoardsError) {
          console.error('게시판 목록을 가져오는 중 오류가 발생했습니다:', allBoardsError);
        } else if (allBoards) {
          setAllBoardsFlat(allBoards);
        }
        
        setLoading(false);
      } catch (error) {
        console.error('params 처리 오류:', error);
        setError('페이지 로딩 중 오류가 발생했습니다.');
        setLoading(false);
      }
    };
    
    resolveParams();
  }, [params, supabase]);
  
  // 로딩 화면 표시
  if (loading) {
    return (
      <div className="container mx-auto py-8 flex justify-center items-center min-h-[400px]">
        <Spinner className="h-8 w-8" />
      </div>
    );
  }
  
  // 오류 화면 표시
  if (error) {
    return (
      <div className="container mx-auto py-8">
        <Card>
          <CardHeader>
            <CardTitle>오류</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-red-600">{error}</p>
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
  
  return (
    <div className="container mx-auto">
      <div className="bg-white p-0 rounded-md">
        <PostEditForm 
          boardId={boardId || undefined}
          boardSlug={boardSlug || undefined}
          initialTitle=""
          initialContent=""
          boardName={boardInfo?.name || '게시판'}
          categoryId={categoryId}
          setCategoryId={setCategoryId}
          allBoardsFlat={allBoardsFlat}
          isCreateMode={true}
        />
      </div>
    </div>
  );
} 