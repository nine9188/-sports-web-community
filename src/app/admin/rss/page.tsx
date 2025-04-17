'use client';

import { useState, useEffect, useCallback } from 'react';
import { createClient } from '@/app/lib/supabase-client';
import { toast } from 'react-toastify';
import { Loader2, RefreshCw, Plus, Trash2, Check, X, ExternalLink } from 'lucide-react';

interface RSSFeed {
  id: string;
  url: string;
  name: string | null;
  description: string | null;
  board_id: string;
  is_active: boolean;
  last_fetched_at: string | null;
  error_count: number;
  last_error: string | null;
  last_error_at: string | null;
  created_at: string;
}

interface Board {
  id: string;
  name: string;
  slug?: string;
}

interface FetchResult {
  feed_id: string;
  name: string | null;
  status: string;
  message: string;
  imported?: number;
}

export default function RSSAdminPage() {
  const [feeds, setFeeds] = useState<RSSFeed[]>([]);
  const [boards, setBoards] = useState<Board[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isFetching, setIsFetching] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [activeTab, setActiveTab] = useState('feeds');
  const [formData, setFormData] = useState({
    url: '',
    name: '',
    description: '',
    board_id: ''
  });
  const [isSportsBoardSelected, setIsSportsBoardSelected] = useState(false);
  const supabase = createClient();
  
  // 게시판 목록 가져오기 함수를 useCallback으로 정의
  const fetchBoards = useCallback(async () => {
    try {
      const { data, error } = await supabase
        .from('boards')
        .select('id, name, slug')
        .order('name');

      if (error) throw error;
      setBoards(data || []);
    } catch (error) {
      console.error('게시판 목록 가져오기 오류:', error);
      toast.error('게시판 목록을 불러오는데 실패했습니다.');
    }
  }, [supabase]);

  // 초기 데이터 로딩
  useEffect(() => {
    fetchFeeds();
    fetchBoards();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // 피드 목록 가져오기
  const fetchFeeds = async () => {
    try {
      setIsLoading(true);
      const response = await fetch('/api/admin/rss-feeds');
      if (!response.ok) {
        throw new Error('피드 목록을 가져오는데 실패했습니다.');
      }
      
      const data = await response.json();
      setFeeds(data);
    } catch (error) {
      console.error('RSS 피드 목록 가져오기 오류:', error);
      toast.error('피드 목록을 불러오는데 실패했습니다.');
    } finally {
      setIsLoading(false);
    }
  };

  // 폼 제출 처리
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.url || !formData.board_id) {
      toast.error('URL과 게시판을 선택해주세요.');
      return;
    }

    try {
      setIsSubmitting(true);
      
      const response = await fetch('/api/admin/rss-feeds', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(formData)
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || '피드 등록에 실패했습니다.');
      }

      toast.success('RSS 피드가 성공적으로 등록되었습니다.');

      // 폼 초기화
      setFormData({
        url: '',
        name: '',
        description: '',
        board_id: ''
      });

      // 피드 목록 갱신
      fetchFeeds();
    } catch (error) {
      console.error('RSS 피드 등록 오류:', error);
      toast.error(error instanceof Error ? error.message : '피드 등록에 실패했습니다.');
    } finally {
      setIsSubmitting(false);
    }
  };

  // 피드 활성화/비활성화 토글
  const toggleFeedStatus = async (feed: RSSFeed) => {
    try {
      const response = await fetch('/api/admin/rss-feeds', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          id: feed.id,
          is_active: !feed.is_active
        })
      });

      if (!response.ok) {
        throw new Error('피드 상태 변경에 실패했습니다.');
      }

      // 피드 목록 갱신
      fetchFeeds();

      toast.success(`RSS 피드가 ${!feed.is_active ? '활성화' : '비활성화'} 되었습니다.`);
    } catch (error) {
      console.error('RSS 피드 상태 변경 오류:', error);
      toast.error('피드 상태 변경에 실패했습니다.');
    }
  };

  // 피드 삭제
  const deleteFeed = async (id: string) => {
    if (!confirm('정말로 이 피드를 삭제하시겠습니까?')) {
      return;
    }

    try {
      const response = await fetch(`/api/admin/rss-feeds?id=${id}`, {
        method: 'DELETE'
      });

      if (!response.ok) {
        throw new Error('피드 삭제에 실패했습니다.');
      }

      // 피드 목록 갱신
      fetchFeeds();

      toast.success('RSS 피드가 삭제되었습니다.');
    } catch (error) {
      console.error('RSS 피드 삭제 오류:', error);
      toast.error('피드 삭제에 실패했습니다.');
    }
  };

  // 피드 즉시 가져오기
  const fetchFeedNow = async (id: string) => {
    try {
      setIsFetching(true);
      
      const response = await fetch('/api/rss/fetch', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          feed_id: id,
          manual_fetch: true
        })
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error || '피드 가져오기에 실패했습니다.');
      }

      // 피드 목록 갱신
      fetchFeeds();

      toast.success(result.message || `${result.imported}개의 게시글을 가져왔습니다.`);
    } catch (error) {
      console.error('RSS 피드 가져오기 오류:', error);
      toast.error(error instanceof Error ? error.message : '피드 가져오기에 실패했습니다.');
    } finally {
      setIsFetching(false);
    }
  };

  // 게시판 변경 처리
  const handleBoardChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const value = e.target.value;
    setFormData({ ...formData, board_id: value });
    
    // 스포츠 뉴스 게시판인지 확인
    const selectedBoard = boards.find(board => board.id === value);
    setIsSportsBoardSelected(
      !!selectedBoard && (
        selectedBoard.slug === 'sports-news' || 
        (selectedBoard.name?.includes('스포츠') || false) || 
        (selectedBoard.name?.includes('축구') || false)
      )
    );
  };

  // 모든 피드 새로고침
  const refreshAllFeeds = async () => {
    try {
      setIsFetching(true);
      
      const response = await fetch('/api/rss/fetch');
      const results = await response.json() as FetchResult[];

      if (!response.ok) {
        throw new Error('피드 가져오기에 실패했습니다.');
      }

      // 성공 및 실패 피드 개수
      const successCount = results.filter((r) => r.status === 'success').length;
      const errorCount = results.filter((r) => r.status === 'error').length;
      const skippedCount = results.filter((r) => r.status === 'skipped').length;

      // 피드 목록 갱신
      fetchFeeds();

      toast.success(`${successCount}개 성공, ${errorCount}개 실패, ${skippedCount}개 스킵`);
    } catch (error) {
      console.error('RSS 피드 새로고침 오류:', error);
      toast.error('피드 새로고침에 실패했습니다.');
    } finally {
      setIsFetching(false);
    }
  };

  // 날짜 포맷팅
  const formatDate = (dateString: string | null) => {
    if (!dateString) return '-';
    return new Date(dateString).toLocaleString('ko-KR');
  };

  return (
    <div className="container p-6">
      <h1 className="text-2xl font-bold mb-6">RSS 피드 관리</h1>
      
      <div className="mb-4">
        <ul className="flex border-b">
          <li className="mr-1">
            <button 
              className={`py-2 px-4 ${activeTab === 'feeds' ? 'border-b-2 border-blue-500 font-medium' : 'text-gray-500 hover:text-blue-500'}`} 
              onClick={() => setActiveTab('feeds')}
            >
              피드 목록
            </button>
          </li>
          <li className="mr-1">
            <button 
              className={`py-2 px-4 ${activeTab === 'add' ? 'border-b-2 border-blue-500 font-medium' : 'text-gray-500 hover:text-blue-500'}`} 
              onClick={() => setActiveTab('add')}
            >
              피드 추가
            </button>
          </li>
        </ul>
      </div>
      
      {activeTab === 'feeds' && (
        <div className="space-y-4">
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-xl font-semibold">등록된 피드</h2>
            <button 
              onClick={refreshAllFeeds} 
              disabled={isFetching}
              className="bg-white border border-gray-300 px-4 py-2 rounded-md hover:bg-gray-50 flex items-center"
            >
              {isFetching ? (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              ) : (
                <RefreshCw className="mr-2 h-4 w-4" />
              )}
              모든 피드 새로고침
            </button>
          </div>
          
          {isLoading ? (
            <div className="flex justify-center items-center h-64">
              <Loader2 className="h-8 w-8 animate-spin text-blue-500" />
            </div>
          ) : feeds.length === 0 ? (
            <div className="text-center p-8 bg-gray-100 rounded-lg">
              <p className="text-lg text-gray-600">등록된 RSS 피드가 없습니다.</p>
              <p className="text-sm text-gray-500 mt-2">
                위의 피드 추가 탭에서 새로운 피드를 추가해보세요.
              </p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="min-w-full border-collapse border border-gray-300">
                <caption className="text-sm text-gray-500 mb-2">등록된 RSS 피드 목록</caption>
                <thead>
                  <tr className="bg-gray-100">
                    <th className="border border-gray-300 px-4 py-2 text-left">이름</th>
                    <th className="border border-gray-300 px-4 py-2 text-left">URL</th>
                    <th className="border border-gray-300 px-4 py-2 text-left">게시판</th>
                    <th className="border border-gray-300 px-4 py-2 text-left">마지막 가져오기</th>
                    <th className="border border-gray-300 px-4 py-2 text-left">상태</th>
                    <th className="border border-gray-300 px-4 py-2 text-right">작업</th>
                  </tr>
                </thead>
                <tbody>
                  {feeds.map((feed) => (
                    <tr key={feed.id} className="hover:bg-gray-50">
                      <td className="border border-gray-300 px-4 py-2 font-medium">
                        {feed.name || '이름 없음'}
                      </td>
                      <td className="border border-gray-300 px-4 py-2 max-w-xs truncate">
                        <a 
                          href={feed.url} 
                          target="_blank" 
                          rel="noopener noreferrer"
                          className="text-blue-600 hover:underline flex items-center"
                        >
                          <span className="truncate">{feed.url}</span>
                          <ExternalLink className="ml-1 h-3 w-3" />
                        </a>
                      </td>
                      <td className="border border-gray-300 px-4 py-2">
                        {boards.find(b => b.id === feed.board_id)?.name || feed.board_id}
                      </td>
                      <td className="border border-gray-300 px-4 py-2">
                        {formatDate(feed.last_fetched_at)}
                      </td>
                      <td className="border border-gray-300 px-4 py-2">
                        <div className="flex items-center">
                          <div className={`w-3 h-3 rounded-full mr-2 ${feed.is_active ? 'bg-green-500' : 'bg-red-500'}`}></div>
                          {feed.is_active ? '활성' : '비활성'}
                        </div>
                      </td>
                      <td className="border border-gray-300 px-4 py-2 text-right">
                        <div className="flex justify-end space-x-2">
                          <button 
                            className="bg-gray-100 p-1 rounded-md hover:bg-gray-200"
                            onClick={() => fetchFeedNow(feed.id)}
                            disabled={isFetching}
                            title="새로고침"
                          >
                            {isFetching ? <Loader2 className="h-4 w-4 animate-spin" /> : <RefreshCw className="h-4 w-4" />}
                          </button>
                          <button 
                            className={`${feed.is_active ? 'bg-red-100 hover:bg-red-200' : 'bg-green-100 hover:bg-green-200'} p-1 rounded-md`}
                            onClick={() => toggleFeedStatus(feed)}
                            title={feed.is_active ? '비활성화' : '활성화'}
                          >
                            {feed.is_active ? <X className="h-4 w-4 text-red-600" /> : <Check className="h-4 w-4 text-green-600" />}
                          </button>
                          <button 
                            className="bg-red-100 p-1 rounded-md hover:bg-red-200"
                            onClick={() => deleteFeed(feed.id)}
                            title="삭제"
                          >
                            <Trash2 className="h-4 w-4 text-red-600" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}
      
      {activeTab === 'add' && (
        <div className="bg-white p-6 border rounded-lg shadow-sm">
          <h2 className="text-xl font-medium mb-4">새 RSS 피드 추가</h2>
          <p className="text-gray-600 mb-6">게시판에 자동으로 포스팅할 RSS 피드 URL을 등록하세요.</p>
          
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <label htmlFor="url" className="block text-sm font-medium">피드 URL</label>
              <input 
                type="text"
                id="url" 
                placeholder="https://example.com/rss"
                value={formData.url}
                onChange={(e) => setFormData({ ...formData, url: e.target.value })}
                className="w-full p-2 border border-gray-300 rounded-md"
                required
              />
            </div>
            
            <div className="space-y-2">
              <label htmlFor="name" className="block text-sm font-medium">이름 (선택사항)</label>
              <input 
                type="text"
                id="name" 
                placeholder="피드 이름"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                className="w-full p-2 border border-gray-300 rounded-md"
              />
            </div>
            
            <div className="space-y-2">
              <label htmlFor="board" className="block text-sm font-medium">게시판</label>
              <select 
                id="board"
                value={formData.board_id} 
                onChange={handleBoardChange}
                className="w-full p-2 border border-gray-300 rounded-md"
              >
                <option value="">게시판 선택</option>
                {boards.map((board) => (
                  <option key={board.id} value={board.id}>
                    {board.name}
                  </option>
                ))}
              </select>
            </div>
            
            <div className="space-y-2">
              <label htmlFor="description" className="block text-sm font-medium">설명 (선택사항)</label>
              <textarea 
                id="description" 
                placeholder="피드에 대한 간단한 설명"
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                className="w-full p-2 border border-gray-300 rounded-md"
                rows={3}
              />
            </div>
            
            {isSportsBoardSelected && formData.url === '' && (
              <div className="bg-blue-50 p-4 rounded-md text-blue-800">
                <p className="text-sm font-medium">추천 RSS 피드:</p>
                <ul className="list-disc list-inside text-sm mt-2">
                  <li>
                    <button 
                      type="button" 
                      className="text-blue-600 hover:underline" 
                      onClick={() => setFormData({ 
                        ...formData, 
                        url: 'https://www.footballist.co.kr/rss/allArticle.xml',
                        name: '풋볼리스트'
                      })}
                    >
                      풋볼리스트 (https://www.footballist.co.kr/rss/allArticle.xml)
                    </button>
                  </li>
                </ul>
              </div>
            )}
            
            <div className="pt-4">
              <button
                type="submit"
                disabled={isSubmitting}
                className="bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700 flex items-center"
              >
                {isSubmitting ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    처리 중...
                  </>
                ) : (
                  <>
                    <Plus className="mr-2 h-4 w-4" />
                    피드 추가
                  </>
                )}
              </button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
} 