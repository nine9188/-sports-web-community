import React from 'react';
import Link from 'next/link';
import { createClient } from '@/app/lib/supabase-server';
import { Button } from '@/app/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/app/ui/card';

export const dynamic = 'force-dynamic';

export const revalidate = 0;

export default async function BoardsPage() {
  const supabase = await createClient();
  
  // 최상위 게시판만 가져오기 (parent_id가 NULL인 게시판)
  const { data: boards, error } = await supabase
    .from('boards')
    .select('*')
    .is('parent_id', null)
    .order('name', { ascending: true });
    
  if (error) {
    console.error('게시판 목록을 가져오는 중 오류가 발생했습니다:', error);
  }

  return (
    <div className="container mx-auto py-8">
      <h1 className="text-2xl font-bold mb-6">주요 게시판</h1>
      
      {error && (
        <div className="bg-red-100 p-4 rounded-md mb-6">
          <p className="text-red-700">게시판 목록을 가져오는 중 오류가 발생했습니다.</p>
        </div>
      )}
      
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {boards && boards.map((board) => (
          <Card key={board.id} className="flex flex-col">
            <CardHeader>
              <CardTitle>{board.name}</CardTitle>
              <CardDescription>{board.description}</CardDescription>
            </CardHeader>
            <CardContent className="flex-grow">
              <p className="text-sm text-gray-500">조회수: {board.views || 0}</p>
            </CardContent>
            <CardFooter>
              <Link href={`/boards/${board.id}`} className="w-full">
                <Button className="w-full">게시판 보기</Button>
              </Link>
            </CardFooter>
          </Card>
        ))}
      </div>
    </div>
  );
} 