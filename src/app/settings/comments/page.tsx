'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '@/app/context/AuthContext';
import { createClient } from '@/app/lib/supabase-browser';
import Link from 'next/link';
import { ExternalLink, ChevronLeft, ChevronRight } from 'lucide-react';

interface Comment {
  id: string;
  content: string;
  created_at: string;
  post_id: string;
  post_title?: string;
  board_id?: string;
  board_name?: string;
  board_slug?: string;
}

export default function MyCommentsSettings() {
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [comments, setComments] = useState<Comment[]>([]);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalComments, setTotalComments] = useState(0);
  const commentsPerPage = 10;
  
  // 내가 쓴 댓글 가져오기
  useEffect(() => {
    if (!user) return;
    
    const fetchMyComments = async () => {
      try {
        setLoading(true);
        const supabase = createClient();
        
        // 총 댓글 수 가져오기
        const { count, error: countError } = await supabase
          .from('comments')
          .select('id', { count: 'exact' })
          .eq('user_id', user.id);
          
        if (countError) {
          console.error('댓글 수 조회 오류:', countError);
        } else {
          const total = count || 0;
          setTotalComments(total);
          setTotalPages(Math.ceil(total / commentsPerPage));
        }
        
        // 페이지네이션된 댓글 가져오기
        const from = (currentPage - 1) * commentsPerPage;
        const to = from + commentsPerPage - 1;
        
        const { data: commentsData, error: commentsError } = await supabase
          .from('comments')
          .select(`
            id, 
            content,
            created_at,
            post_id
          `)
          .eq('user_id', user.id)
          .order('created_at', { ascending: false })
          .range(from, to);
          
        if (commentsError) {
          console.error('댓글 조회 오류:', commentsError);
          return;
        }
        
        if (!commentsData || commentsData.length === 0) {
          setComments([]);
          setLoading(false);
          return;
        }
        
        // 게시글 ID 목록
        const postIds = [...new Set(commentsData.map(comment => comment.post_id))];
        
        // 게시글 정보 가져오기
        const { data: postsData, error: postsError } = await supabase
          .from('posts')
          .select('id, title, board_id')
          .in('id', postIds);
          
        if (postsError) {
          console.error('게시글 정보 조회 오류:', postsError);
        }
        
        // 게시글 정보 매핑
        const postsMap = new Map();
        if (postsData) {
          postsData.forEach(post => {
            postsMap.set(post.id, { title: post.title, board_id: post.board_id });
          });
          
          // 게시판 ID 목록
          const boardIds = [...new Set(postsData.map(post => post.board_id))];
          
          // 게시판 정보 가져오기
          const { data: boardsData, error: boardsError } = await supabase
            .from('boards')
            .select('id, name, slug')
            .in('id', boardIds);
            
          if (boardsError) {
            console.error('게시판 정보 조회 오류:', boardsError);
          }
          
          // 게시판 정보 매핑
          const boardsMap = new Map();
          if (boardsData) {
            boardsData.forEach(board => {
              boardsMap.set(board.id, { name: board.name, slug: board.slug });
            });
          }
          
          // 댓글에 게시글 제목과 게시판 정보 추가
          const transformedComments = commentsData.map(comment => {
            const postInfo = postsMap.get(comment.post_id) || {};
            const boardInfo = boardsMap.get(postInfo.board_id) || {};
            
            return {
              ...comment,
              post_title: postInfo.title || '삭제된 게시글',
              board_id: postInfo.board_id,
              board_name: boardInfo.name || '알 수 없는 게시판',
              board_slug: boardInfo.slug || ''
            };
          });
          
          setComments(transformedComments);
        } else {
          // 게시글 정보를 가져오지 못한 경우
          const transformedComments = commentsData.map(comment => ({
            ...comment,
            post_title: '삭제된 게시글',
            board_name: '알 수 없는 게시판'
          }));
          
          setComments(transformedComments);
        }
        
      } catch (error) {
        console.error('내 댓글 로딩 오류:', error);
      } finally {
        setLoading(false);
      }
    };
    
    fetchMyComments();
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
  
  // 내용 요약 (50자 제한)
  const summarizeContent = (content: string, maxLength: number = 50) => {
    // HTML 태그 제거
    const plainText = content.replace(/<[^>]*>/g, '');
    
    if (plainText.length <= maxLength) return plainText;
    return plainText.substring(0, maxLength) + '...';
  };
  
  // 로딩 상태 표시
  if (loading) {
    return (
      <div>
        <h2 className="text-xl font-semibold mb-4">내가 쓴 댓글</h2>
        <div className="space-y-2 animate-pulse">
          {[...Array(5)].map((_, i) => (
            <div key={i} className="h-16 bg-gray-200 rounded"></div>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div>
      <h2 className="text-xl font-semibold mb-4">내가 쓴 댓글</h2>
      
      <div className="mb-4 text-sm text-gray-500">
        총 {totalComments}개의 댓글이 있습니다.
      </div>
      
      {comments.length > 0 ? (
        <>
          <div className="border rounded-lg overflow-hidden mb-4">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">내용</th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider hidden md:table-cell">원글</th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider hidden md:table-cell">게시판</th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider hidden md:table-cell">작성일</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {comments.map((comment) => (
                  <tr key={comment.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4">
                      <div className="md:hidden text-xs text-gray-500 mb-1">
                        <strong>게시글:</strong> {comment.post_title} ({comment.board_name})
                      </div>
                      <div className="md:hidden text-xs text-gray-500 mb-2">
                        <strong>작성일:</strong> {formatDate(comment.created_at)}
                      </div>
                      <div className="text-sm text-gray-700">
                        {summarizeContent(comment.content)}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 hidden md:table-cell">
                      <Link 
                        href={`/boards/${comment.board_slug}/${comment.post_id}`}
                        className="text-slate-900 hover:text-blue-600 hover:underline flex items-center"
                      >
                        {summarizeContent(comment.post_title || '삭제된 게시글', 30)}
                        <ExternalLink className="h-3 w-3 ml-1 inline-block text-gray-400" />
                      </Link>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 hidden md:table-cell">
                      {comment.board_name}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 hidden md:table-cell">
                      {formatDate(comment.created_at)}
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
          <p className="text-gray-500">작성한 댓글이 없습니다.</p>
        </div>
      )}
    </div>
  );
} 