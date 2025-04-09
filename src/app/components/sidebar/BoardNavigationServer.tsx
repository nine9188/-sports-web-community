'use client';

import { useState, useEffect } from 'react';
import { createClient } from '@/app/lib/supabase-browser';
import BoardNavigation from './BoardNavigation';

// 보드 데이터 타입 정의
interface Board {
  id: string;
  name: string;
  parent_id: string | null;
  display_order: number;
  slug: string;
}

// 클라이언트 컴포넌트로 변환 - 서버 사이드 데이터 페칭 대신 클라이언트 사이드 페칭 사용
export default function BoardNavigationServer() {
  const [boards, setBoards] = useState<Board[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  useEffect(() => {
    const fetchBoards = async () => {
      try {
        setIsLoading(true);
        const supabase = createClient();
        
        // 게시판 데이터 가져오기
        const { data, error } = await supabase
          .from('boards')
          .select('id, name, parent_id, display_order, slug')
          .order('display_order', { ascending: true })
          .order('name');
          
        if (error) {
          console.error('게시판 불러오기 오류:', error);
          setError('게시판 목록을 불러오는 중 오류가 발생했습니다.');
        } else {
          setBoards(data || []);
        }
      } catch (err) {
        console.error('게시판 데이터 로딩 중 오류:', err);
        setError('게시판 목록을 불러오는 중 오류가 발생했습니다.');
      } finally {
        setIsLoading(false);
      }
    };
    
    fetchBoards();
  }, []);
  
  if (isLoading) {
    return <div className="py-2 px-3">게시판 목록 로딩 중...</div>;
  }
  
  if (error) {
    return <div className="py-2 px-3 text-red-500">{error}</div>;
  }
  
  // 클라이언트 컴포넌트에 초기 데이터 전달
  return <BoardNavigation initialBoards={boards} />;
} 