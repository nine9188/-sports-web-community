'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '@/app/context/AuthContext';
import { createClient } from '@/app/lib/supabase-browser';
import Link from 'next/link';
import { ExternalLink, ChevronLeft, ChevronRight } from 'lucide-react';

interface Post {
  id: string;
  title: string;
  created_at: string;
  board_id: string;
  board_slug?: string;
  board_name?: string;
  comment_count: number;
}

export default function MyPostsSettings() {
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [posts, setPosts] = useState<Post[]>([]);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalPosts, setTotalPosts] = useState(0);
  const [error, setError] = useState<string | null>(null);
  const postsPerPage = 10;
  
  // 내가 쓴 글 가져오기
  useEffect(() => {
    if (!user) return;
    
    const fetchMyPosts = async () => {
      try {
        setLoading(true);
        setError(null);
        const supabase = createClient();
        
        // 총 게시글 수 가져오기
        const { count, error: countError } = await supabase
          .from('posts')
          .select('id', { count: 'exact' })
          .eq('user_id', user.id);
          
        if (countError) {
          setError('게시글 수를 조회할 수 없습니다.');
          return;
        } else {
          const total = count || 0;
          setTotalPosts(total);
          setTotalPages(Math.max(1, Math.ceil(total / postsPerPage)));
        }
        
        // 페이지네이션된 게시글 가져오기 - 실제 존재하는 필드만 쿼리
        const from = (currentPage - 1) * postsPerPage;
        const to = from + postsPerPage - 1;
        
        const { data: postsData, error: postsError } = await supabase
          .from('posts')
          .select(`
            id, 
            title,
            created_at,
            board_id
          `)
          .eq('user_id', user.id)
          .order('created_at', { ascending: false })
          .range(from, to);
          
        if (postsError) {
          setError('게시글을 불러올 수 없습니다.');
          return;
        }
        
        if (!postsData || postsData.length === 0) {
          setPosts([]);
          setLoading(false);
          return;
        }
        
        // 게시판 정보 가져오기
        const boardIds = [...new Set(postsData.map(post => post.board_id))];
        const { data: boardsData, error: boardsError } = await supabase
          .from('boards')
          .select('id, name, slug')
          .in('id', boardIds);
          
        if (boardsError) {
          setError('게시판 정보를 불러올 수 없습니다.');
          return;
        }
        
        // 게시판 정보 매핑
        const boardsMap = new Map();
        if (boardsData) {
          boardsData.forEach(board => {
            boardsMap.set(board.id, { name: board.name, slug: board.slug });
          });
        }
        
        // 게시글 ID 목록
        const postIds = postsData.map(post => post.id);
        
        // 각 게시글의 댓글 수 가져오기
        const commentCountPromises = postIds.map(postId => 
          supabase
            .from('comments')
            .select('id', { count: 'exact' })
            .eq('post_id', postId)
        );
        
        const commentCountResults = await Promise.all(commentCountPromises);
        
        // 댓글 수 매핑
        const commentCountsMap = new Map();
        commentCountResults.forEach((result, index) => {
          commentCountsMap.set(postIds[index], result.count || 0);
        });
        
        // 게시글에 게시판 정보와 댓글 수 추가
        const transformedPosts = postsData.map(post => {
          const boardInfo = boardsMap.get(post.board_id) || {};
          return {
            ...post,
            board_name: boardInfo.name || '알 수 없는 게시판',
            board_slug: boardInfo.slug || '',
            comment_count: commentCountsMap.get(post.id) || 0
          };
        });
        
        setPosts(transformedPosts);
        
      } catch {
        setError('게시글을 불러오는 중 오류가 발생했습니다.');
      } finally {
        setLoading(false);
      }
    };
    
    fetchMyPosts();
  }, [user, currentPage]);
  
  // 페이지 변경 핸들러
  const handlePageChange = (page: number) => {
    if (page >= 1 && page <= totalPages) {
      setCurrentPage(page);
      window.scrollTo(0, 0);
    }
  };
  
  // 날짜 포맷팅
  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;
  };
  
  // 로딩 상태 표시
  if (loading) {
    return (
      <div>
        <h2 className="text-xl font-semibold mb-4">내가 쓴 글</h2>
        <div className="space-y-2 animate-pulse">
          {[...Array(5)].map((_, i) => (
            <div key={i} className="h-12 bg-gray-200 rounded"></div>
          ))}
        </div>
      </div>
    );
  }
  
  // 오류 표시
  if (error) {
    return (
      <div>
        <h3 className="text-base font-semibold mb-4">내가 쓴 글</h3>
        <div className="bg-red-50 border-l-4 border-red-500 p-4 mb-4">
          <p className="text-red-700">{error}</p>
          <button 
            onClick={() => window.location.reload()} 
            className="mt-2 px-4 py-2 bg-red-600 text-white rounded hover:bg-red-700"
          >
            새로고침
          </button>
        </div>
      </div>
    );
  }

  return (
    <div>
      <h2 className="text-xl font-semibold mb-4">내가 쓴 글</h2>
      
      <div className="mb-4 text-sm text-gray-500">
        총 {totalPosts}개의 게시글이 있습니다.
      </div>
      
      {posts.length > 0 ? (
        <>
          <div className="border rounded-lg overflow-hidden mb-4">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">제목</th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider hidden md:table-cell">게시판</th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider hidden md:table-cell">작성일</th>
                  <th scope="col" className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider hidden md:table-cell">댓글</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {posts.map((post) => (
                  <tr key={post.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4">
                      <div className="md:hidden text-xs text-gray-500 mb-1">
                        {post.board_name} • {formatDate(post.created_at)}
                      </div>
                      <div className="md:hidden text-xs text-gray-500 mb-1">
                        댓글: {post.comment_count}
                      </div>
                      <Link 
                        href={post.board_slug ? `/boards/${post.board_slug}/${post.id}` : `/posts/${post.id}`} 
                        className="text-sm font-medium text-slate-900 hover:text-blue-600 hover:underline flex items-center"
                      >
                        {post.title}
                        <ExternalLink className="h-3 w-3 ml-1 inline-block text-gray-400" />
                      </Link>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 hidden md:table-cell">
                      {post.board_name}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 hidden md:table-cell">
                      {formatDate(post.created_at)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 text-center hidden md:table-cell">
                      {post.comment_count}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          
          {/* 페이지네이션 */}
          {totalPages > 1 && (
            <div className="flex justify-center items-center space-x-2 mt-4">
              <button
                onClick={() => handlePageChange(currentPage - 1)}
                disabled={currentPage === 1}
                className="p-2 rounded-md border bg-white text-gray-500 disabled:opacity-50"
                aria-label="이전 페이지"
              >
                <ChevronLeft className="h-4 w-4" />
              </button>
              
              <div className="flex items-center space-x-1">
                {Array.from({ length: totalPages }, (_, i) => i + 1).map((page) => {
                  // 현재 페이지, 첫 페이지, 마지막 페이지, 현재 페이지 주변 페이지만 표시
                  if (
                    page === 1 ||
                    page === totalPages ||
                    (page >= currentPage - 2 && page <= currentPage + 2)
                  ) {
                    return (
                      <button
                        key={page}
                        onClick={() => handlePageChange(page)}
                        className={`w-8 h-8 rounded-md border ${
                          currentPage === page
                            ? 'bg-slate-800 text-white'
                            : 'bg-white text-gray-700 hover:bg-gray-50'
                        }`}
                        aria-label={`${page} 페이지`}
                        aria-current={currentPage === page ? 'page' : undefined}
                      >
                        {page}
                      </button>
                    );
                  } else if (
                    (page === 2 && currentPage > 4) ||
                    (page === totalPages - 1 && currentPage < totalPages - 3)
                  ) {
                    return <span key={page} className="text-gray-500">...</span>;
                  }
                  return null;
                })}
              </div>
              
              <button
                onClick={() => handlePageChange(currentPage + 1)}
                disabled={currentPage === totalPages}
                className="p-2 rounded-md border bg-white text-gray-500 disabled:opacity-50"
                aria-label="다음 페이지"
              >
                <ChevronRight className="h-4 w-4" />
              </button>
            </div>
          )}
        </>
      ) : (
        <div className="text-center py-10 bg-gray-50 rounded-lg">
          <p className="text-gray-500">작성한 게시글이 없습니다.</p>
        </div>
      )}
    </div>
  );
} 