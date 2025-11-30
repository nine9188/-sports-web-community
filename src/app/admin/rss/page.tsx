'use client';

import { useState, useEffect, useCallback, useTransition } from 'react';

// Window 타입 확장
declare global {
  interface Window {
    rssAutoInterval?: NodeJS.Timeout;
  }
}
import { getSupabaseBrowser } from '@/shared/lib/supabase';
import { toast } from 'react-toastify';
import Tabs, { TabItem } from '@/shared/ui/tabs';
import { Loader2, RefreshCw, Plus, Trash2, Check, X, ExternalLink } from 'lucide-react';
import { formatDate } from '@/shared/utils/date';
import { 
  getRSSFeeds, 
  createRSSFeed, 
  toggleRSSFeedStatus, 
  deleteRSSFeed, 
  fetchAllRSSFeeds, 
  fetchSingleRSSFeed,
  getRSSAutomationLogs
} from '@/domains/rss/actions';

interface RSSFeed {
  id: string;
  url: string;
  name: string | null;
  description: string | null;
  board_id: string;
  is_active: boolean | null;
  last_fetched_at: string | null;
  error_count: number | null;
  last_error: string | null;
  last_error_at: string | null;
  created_at: string | null;
}

interface Board {
  id: string;
  name: string;
  slug?: string | null;
}

export default function RSSAdminPage() {
  const [feeds, setFeeds] = useState<RSSFeed[]>([]);
  const [boards, setBoards] = useState<Board[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('feeds');
  const [formData, setFormData] = useState({
    url: '',
    name: '',
    description: '',
    board_id: ''
  });
  const [isSportsBoardSelected, setIsSportsBoardSelected] = useState(false);
  const [isPending, startTransition] = useTransition();
  
  // 자동화 상태 관리
  const [autoFetchEnabled, setAutoFetchEnabled] = useState(false);
  const [autoFetchInterval, setAutoFetchInterval] = useState(5); // 분 단위
  const [lastAutoFetch, setLastAutoFetch] = useState<string | null>(null);
  const [autoFetchStatus, setAutoFetchStatus] = useState<'idle' | 'running' | 'error'>('idle');
  const [automationLogs, setAutomationLogs] = useState<Array<{
    id: string;
    trigger_type: string;
    status: string;
    feeds_processed: number;
    posts_imported: number;
    error_message?: string;
    execution_time_ms?: number;
    created_at: string;
    details?: string;
  }>>([]);
  const supabase = getSupabaseBrowser();
  
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
    loadFeeds();
    fetchBoards();
    loadAutomationLogs();
    
    // 컴포넌트 언마운트 시 인터벌 정리
    return () => {
      if (window.rssAutoInterval) {
        clearInterval(window.rssAutoInterval);
      }
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // 피드 목록 가져오기 (서버 액션 사용)
  const loadFeeds = async () => {
    try {
      setIsLoading(true);
      const data = await getRSSFeeds();
      setFeeds(data);
    } catch (error) {
      console.error('RSS 피드 목록 가져오기 오류:', error);
      toast.error('피드 목록을 불러오는데 실패했습니다.');
    } finally {
      setIsLoading(false);
    }
  };

  // 자동화 로그 가져오기
  const loadAutomationLogs = async () => {
    try {
      const logs = await getRSSAutomationLogs(10);
      setAutomationLogs(logs);
      
      // 최신 로그에서 마지막 실행 시간 업데이트
      if (logs.length > 0) {
        setLastAutoFetch(logs[0].created_at);
      }
    } catch (error) {
      console.error('자동화 로그 가져오기 오류:', error);
    }
  };

  // 폼 제출 처리 (서버 액션 사용)
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.url || !formData.board_id) {
      toast.error('URL과 게시판을 선택해주세요.');
      return;
    }

    startTransition(async () => {
      try {
        const formDataObj = new FormData();
        formDataObj.append('url', formData.url);
        formDataObj.append('name', formData.name);
        formDataObj.append('description', formData.description);
        formDataObj.append('board_id', formData.board_id);
        
        await createRSSFeed(formDataObj);
        
        toast.success('RSS 피드가 성공적으로 등록되었습니다.');

        // 폼 초기화
        setFormData({
          url: '',
          name: '',
          description: '',
          board_id: ''
        });

        // 피드 목록 갱신
        loadFeeds();
      } catch (error) {
        console.error('RSS 피드 등록 오류:', error);
        toast.error(error instanceof Error ? error.message : '피드 등록에 실패했습니다.');
      }
    });
  };

  // 피드 활성화/비활성화 토글 (서버 액션 사용)
  const handleToggleFeedStatus = async (feed: RSSFeed) => {
    startTransition(async () => {
      try {
        await toggleRSSFeedStatus(feed.id, !feed.is_active);
        toast.success(`RSS 피드가 ${!feed.is_active ? '활성화' : '비활성화'} 되었습니다.`);
        loadFeeds();
      } catch (error) {
        console.error('RSS 피드 상태 변경 오류:', error);
        toast.error('피드 상태 변경에 실패했습니다.');
      }
    });
  };

  // 피드 삭제 (서버 액션 사용)
  const handleDeleteFeed = async (id: string) => {
    if (!confirm('정말로 이 피드를 삭제하시겠습니까?')) {
      return;
    }

    startTransition(async () => {
      try {
        await deleteRSSFeed(id);
        toast.success('RSS 피드가 삭제되었습니다.');
        loadFeeds();
      } catch (error) {
        console.error('RSS 피드 삭제 오류:', error);
        toast.error('피드 삭제에 실패했습니다.');
      }
    });
  };

  // 피드 즉시 가져오기 (서버 액션 사용)
  const handleFetchFeedNow = async (id: string) => {
    startTransition(async () => {
      try {
        const result = await fetchSingleRSSFeed(id);
        toast.success(result.message || `${result.imported}개의 게시글을 가져왔습니다.`);
        loadFeeds();
      } catch (error) {
        console.error('RSS 피드 가져오기 오류:', error);
        toast.error(error instanceof Error ? error.message : '피드 가져오기에 실패했습니다.');
      }
    });
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

  // 모든 피드 새로고침 (서버 액션 사용)
  const handleRefreshAllFeeds = async () => {
    startTransition(async () => {
      try {
        const results = await fetchAllRSSFeeds();
        
        // 성공 및 실패 피드 개수
        const successCount = results.filter((r) => r.status === 'success').length;
        const errorCount = results.filter((r) => r.status === 'error').length;
        const skippedCount = results.filter((r) => r.status === 'skipped').length;

        loadFeeds();
        toast.success(`${successCount}개 성공, ${errorCount}개 실패, ${skippedCount}개 스킵`);
      } catch (error) {
        console.error('RSS 피드 새로고침 오류:', error);
        toast.error('피드 새로고침에 실패했습니다.');
      }
    });
  };



  // 자동화 토글 핸들러
  const handleToggleAutomation = async () => {
    startTransition(async () => {
      try {
        setAutoFetchStatus('running');
        
        if (autoFetchEnabled) {
          // 자동화 중지
          clearInterval(window.rssAutoInterval); // 기존 인터벌 정리
          toast('자동화를 중지했습니다.');
          setAutoFetchEnabled(false);
          setAutoFetchStatus('idle');
        } else {
          // 자동화 시작 - 즉시 한 번 실행
          toast('자동화를 시작합니다. 첫 번째 수집을 실행 중...');
          
          try {
            // 첫 번째 수집 즉시 실행
            const response = await fetch('/api/rss/auto-fetch');
            const result = await response.json();
            
            if (result.success) {
              toast.success(`자동화 시작! 첫 수집 완료: ${result.message}`);
              setLastAutoFetch(new Date().toISOString());
              loadFeeds();
              loadAutomationLogs();
              
              // 주기적 실행 설정
              const intervalMs = autoFetchInterval * 60 * 1000; // 분을 밀리초로 변환
              window.rssAutoInterval = setInterval(async () => {
                try {
                  console.log('🔄 자동 RSS 수집 실행...');
                  const autoResponse = await fetch('/api/rss/auto-fetch');
                  const autoResult = await autoResponse.json();
                  
                  if (autoResult.success) {
                    setLastAutoFetch(new Date().toISOString());
                    loadAutomationLogs(); // 로그 새로고침
                    console.log('✅ 자동 RSS 수집 완료');
                  }
                } catch (error) {
                  console.error('❌ 자동 RSS 수집 오류:', error);
                  setAutoFetchStatus('error');
                }
              }, intervalMs);
              
              setAutoFetchEnabled(true);
              setAutoFetchStatus('running');
              
            } else {
              throw new Error(result.message || '첫 수집 실패');
            }
          } catch (error) {
            toast.error('자동화 시작 실패: ' + (error instanceof Error ? error.message : '알 수 없는 오류'));
            setAutoFetchStatus('error');
            return;
          }
        }
      } catch (error) {
        console.error('자동화 토글 오류:', error);
        toast.error('자동화 설정 변경에 실패했습니다.');
        setAutoFetchStatus('error');
      }
    });
  };

  // 자동화 테스트 핸들러
  const handleTestAutoFetch = async () => {
    startTransition(async () => {
      try {
        setAutoFetchStatus('running');
        
        // API 엔드포인트 호출
        const response = await fetch('/api/rss/auto-fetch');
        const result = await response.json();
        
        if (result.success) {
          toast.success(`자동 수집 테스트 성공! ${result.message}`);
          setLastAutoFetch(new Date().toISOString());
          setAutoFetchStatus('idle');
          loadFeeds(); // 피드 목록 새로고침
          loadAutomationLogs(); // 로그 새로고침
        } else {
          throw new Error(result.message || '자동 수집 실패');
        }
      } catch (error) {
        console.error('자동 수집 테스트 오류:', error);
        toast.error(error instanceof Error ? error.message : '자동 수집 테스트에 실패했습니다.');
        setAutoFetchStatus('error');
      }
    });
  };

  // 자동화 상태 확인 핸들러
  const handleCheckAutomationStatus = async () => {
    startTransition(async () => {
      try {
        // GitHub Actions 상태 확인 (실제로는 더 복잡한 로직 필요)
        toast('자동화 상태를 확인했습니다.');
        
        // 임시로 현재 상태 표시
        const status = autoFetchEnabled ? 'running' : 'idle';
        setAutoFetchStatus(status);
        
      } catch (error) {
        console.error('상태 확인 오류:', error);
        toast.error('상태 확인에 실패했습니다.');
        setAutoFetchStatus('error');
      }
    });
  };

  // 탭 목록 정의
  const tabs: TabItem[] = [
    { id: 'feeds', label: '피드 목록' },
    { id: 'add', label: '피드 추가' },
    { id: 'automation', label: '자동화 설정' },
  ];

  return (
    <div className="container p-6">
      <h1 className="text-2xl font-bold mb-6">RSS 피드 관리</h1>
      
      <Tabs
        tabs={tabs}
        activeTab={activeTab}
        onTabChange={(tabId) => setActiveTab(tabId as 'feeds' | 'add' | 'automation')}
        variant="minimal"
      />
      
      {activeTab === 'feeds' && (
        <div className="space-y-4">
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-xl font-semibold">등록된 피드</h2>
            <button 
              onClick={handleRefreshAllFeeds} 
              disabled={isPending}
              className="bg-white border border-gray-300 px-4 py-2 rounded-md hover:bg-gray-50 flex items-center"
            >
              {isPending ? (
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
                        {formatDate(feed.last_fetched_at) || '-'}
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
                            onClick={() => handleFetchFeedNow(feed.id)}
                            disabled={isPending}
                            title="새로고침"
                          >
                            {isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : <RefreshCw className="h-4 w-4" />}
                          </button>
                          <button 
                            className={`${feed.is_active ? 'bg-red-100 hover:bg-red-200' : 'bg-green-100 hover:bg-green-200'} p-1 rounded-md`}
                            onClick={() => handleToggleFeedStatus(feed)}
                            disabled={isPending}
                            title={feed.is_active ? '비활성화' : '활성화'}
                          >
                            {feed.is_active ? <X className="h-4 w-4 text-red-600" /> : <Check className="h-4 w-4 text-green-600" />}
                          </button>
                          <button 
                            className="bg-red-100 p-1 rounded-md hover:bg-red-200"
                            onClick={() => handleDeleteFeed(feed.id)}
                            disabled={isPending}
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
                disabled={isPending}
                className="bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700 flex items-center"
              >
                {isPending ? (
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

      {activeTab === 'automation' && (
        <div className="space-y-6">
          {/* 자동화 상태 카드 */}
          <div className="bg-white p-6 border rounded-lg shadow-sm">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xl font-semibold">RSS 자동 수집 상태</h2>
              <div className={`px-3 py-1 rounded-full text-sm font-medium ${
                autoFetchStatus === 'running' ? 'bg-green-100 text-green-800' :
                autoFetchStatus === 'error' ? 'bg-red-100 text-red-800' :
                'bg-gray-100 text-gray-800'
              }`}>
                {autoFetchStatus === 'running' ? '🟢 실행 중' :
                 autoFetchStatus === 'error' ? '🔴 오류' :
                 '⚪ 대기 중'}
              </div>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
              <div className="bg-gray-50 p-4 rounded-lg">
                <h3 className="text-sm font-medium text-gray-600 mb-1">자동화 상태</h3>
                <p className="text-lg font-semibold">
                  {autoFetchEnabled ? '🟢 활성화' : '🔴 비활성화'}
                </p>
              </div>
              
              <div className="bg-gray-50 p-4 rounded-lg">
                <h3 className="text-sm font-medium text-gray-600 mb-1">수집 간격</h3>
                <p className="text-lg font-semibold">{autoFetchInterval}분마다</p>
              </div>
              
              <div className="bg-gray-50 p-4 rounded-lg">
                <h3 className="text-sm font-medium text-gray-600 mb-1">마지막 수집</h3>
                <p className="text-lg font-semibold">
                  {lastAutoFetch ? (formatDate(lastAutoFetch) || '-') : '없음'}
                </p>
              </div>
            </div>

            {/* 자동화 제어 버튼들 */}
            <div className="flex flex-wrap gap-3">
              <button
                onClick={() => handleToggleAutomation()}
                disabled={isPending}
                className={`px-4 py-2 rounded-md font-medium flex items-center ${
                  autoFetchEnabled 
                    ? 'bg-red-600 text-white hover:bg-red-700' 
                    : 'bg-green-600 text-white hover:bg-green-700'
                }`}
              >
                {isPending ? (
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                ) : autoFetchEnabled ? (
                  <X className="mr-2 h-4 w-4" />
                ) : (
                  <Check className="mr-2 h-4 w-4" />
                )}
                {autoFetchEnabled ? '자동화 중지' : '자동화 시작'}
              </button>

              <button
                onClick={() => handleTestAutoFetch()}
                disabled={isPending}
                className="bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700 flex items-center"
              >
                {isPending ? (
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                ) : (
                  <RefreshCw className="mr-2 h-4 w-4" />
                )}
                수동 테스트
              </button>

              <button
                onClick={() => handleCheckAutomationStatus()}
                disabled={isPending}
                className="bg-gray-600 text-white px-4 py-2 rounded-md hover:bg-gray-700 flex items-center"
              >
                {isPending ? (
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                ) : (
                  <RefreshCw className="mr-2 h-4 w-4" />
                )}
                상태 확인
              </button>
            </div>
          </div>

          {/* 자동화 설정 카드 */}
          <div className="bg-white p-6 border rounded-lg shadow-sm">
            <h2 className="text-xl font-semibold mb-4">자동화 설정</h2>
            
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  수집 간격 (분)
                </label>
                <select
                  value={autoFetchInterval}
                  onChange={(e) => {
                    const newInterval = Number(e.target.value);
                    setAutoFetchInterval(newInterval);
                    
                    // 자동화가 실행 중이면 새 간격으로 재시작
                    if (autoFetchEnabled && window.rssAutoInterval) {
                      clearInterval(window.rssAutoInterval);
                      
                      const intervalMs = newInterval * 60 * 1000;
                      window.rssAutoInterval = setInterval(async () => {
                        try {
                          console.log('🔄 자동 RSS 수집 실행...');
                          const autoResponse = await fetch('/api/rss/auto-fetch');
                          const autoResult = await autoResponse.json();
                          
                          if (autoResult.success) {
                            setLastAutoFetch(new Date().toISOString());
                            loadAutomationLogs();
                            console.log('✅ 자동 RSS 수집 완료');
                          }
                        } catch (error) {
                          console.error('❌ 자동 RSS 수집 오류:', error);
                          setAutoFetchStatus('error');
                        }
                      }, intervalMs);
                      
                      toast(`자동화 간격이 ${newInterval}분으로 변경되었습니다.`);
                    }
                  }}
                  className="w-full p-2 border border-gray-300 rounded-md"
                >
                  <option value={1}>1분마다 (테스트용)</option>
                  <option value={5}>5분마다 (권장)</option>
                  <option value={10}>10분마다</option>
                  <option value={15}>15분마다</option>
                  <option value={30}>30분마다</option>
                  <option value={60}>1시간마다</option>
                </select>
                <p className="text-sm text-gray-500 mt-1">
                  너무 짧은 간격은 서버에 부하를 줄 수 있습니다.
                </p>
              </div>

              <div className="bg-yellow-50 p-4 rounded-md">
                <h3 className="text-sm font-medium text-yellow-800 mb-2">⚠️ 주의사항</h3>
                <ul className="text-sm text-yellow-700 space-y-1">
                  <li>• 자동화는 GitHub Actions를 통해 실행됩니다</li>
                  <li>• 설정 변경 후 GitHub에 푸시해야 적용됩니다</li>
                  <li>• 무료 계정은 월 2000분 제한이 있습니다</li>
                </ul>
              </div>
            </div>
          </div>

          {/* 자동화 로그 카드 */}
          <div className="bg-white p-6 border rounded-lg shadow-sm">
            <h2 className="text-xl font-semibold mb-4">자동화 로그</h2>
            <div className="bg-gray-50 p-4 rounded-lg">
              <p className="text-sm text-gray-600 mb-2">최근 자동화 실행 기록:</p>
              <div className="space-y-2 max-h-40 overflow-y-auto">
                {automationLogs.length === 0 ? (
                  <div className="text-sm text-gray-500">아직 실행 기록이 없습니다.</div>
                ) : (
                  automationLogs.map((log, index) => (
                    <div key={index} className="text-sm">
                      <span className="text-gray-500">{formatDate(log.created_at) || '-'}</span>
                      <span className={`ml-2 ${
                        log.status === 'success' ? 'text-green-600' :
                        log.status === 'error' ? 'text-red-600' :
                        'text-yellow-600'
                      }`}>
                        {log.status === 'success' ? '✅' : 
                         log.status === 'error' ? '❌' : '⚠️'} 
                        {log.status === 'success' ? '성공' :
                         log.status === 'error' ? '실패' : '부분 성공'} - 
                        {log.posts_imported}개 글 수집 
                        ({log.execution_time_ms}ms)
                        {log.error_message && ` - ${log.error_message}`}
                      </span>
                    </div>
                  ))
                )}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
} 