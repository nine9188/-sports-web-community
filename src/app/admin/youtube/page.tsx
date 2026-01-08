'use client';

import { useState, useEffect } from 'react';
import { getSupabaseBrowser } from '@/shared/lib/supabase';
import { toast } from 'react-toastify';
import { Youtube, Plus, Trash2, RefreshCw, Code } from 'lucide-react';
import Spinner from '@/shared/components/Spinner';

interface YoutubeChannel {
  id: string;
  channel_id: string;
  channel_name: string;
  board_id: string;
  api_key: string;
  auto_publish: boolean | null;
  playlist_id: string | null;
  last_crawled_at: string | null;
  created_at: string | null;
  updated_at?: string | null;
}

interface Board {
  id: string;
  title: string;
}

export default function YoutubeChannelManager() {
  const [channels, setChannels] = useState<YoutubeChannel[]>([]);
  const [boards, setBoards] = useState<Board[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isAdding, setIsAdding] = useState(false);
  const [showSql, setShowSql] = useState(false);
  
  // 새 채널 추가 폼 상태
  const [channelId, setChannelId] = useState('');
  const [channelName, setChannelName] = useState('');
  const [boardId, setBoardId] = useState('');
  const [apiKey, setApiKey] = useState('');
  const [playlistId, setPlaylistId] = useState('');
  const [autoPublish, setAutoPublish] = useState(true);
  
  const supabase = getSupabaseBrowser();
  
  useEffect(() => {
    fetchChannels();
    fetchBoards();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);
  
  // 유튜브 채널 테이블 생성 SQL
  const createTableSQL = `
-- 유튜브 채널 정보를 저장하는 테이블 생성
CREATE TABLE IF NOT EXISTS public.youtube_channels (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  channel_id TEXT NOT NULL,
  channel_name TEXT NOT NULL,
  board_id UUID NOT NULL REFERENCES public.boards(id) ON DELETE CASCADE,
  api_key TEXT NOT NULL,
  auto_publish BOOLEAN DEFAULT TRUE,
  playlist_id TEXT,
  last_crawled_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  
  CONSTRAINT youtube_channels_channel_id_key UNIQUE (channel_id)
);

-- 타임스탬프 자동 업데이트를 위한 트리거 함수
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- updated_at 컬럼 자동 업데이트 트리거
CREATE TRIGGER update_youtube_channels_updated_at
BEFORE UPDATE ON public.youtube_channels
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- RLS(Row Level Security) 정책 설정
ALTER TABLE public.youtube_channels ENABLE ROW LEVEL SECURITY;

-- 관리자만 모든 작업 가능
CREATE POLICY admin_all ON public.youtube_channels
  FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE profiles.id = auth.uid() AND profiles.is_admin = true
    )
  );
  `;
  
  // 등록된 채널 목록 가져오기
  const fetchChannels = async () => {
    try {
      setIsLoading(true);
      const { data, error } = await supabase
        .from('youtube_channels')
        .select('*')
        .order('created_at', { ascending: false });
      
      if (error) {
        // 테이블이 없는 경우 특별히 처리
        if (error.code === '42P01') { // 테이블이 존재하지 않음
          toast.error('유튜브 채널 테이블이 생성되지 않았습니다. SQL 스크립트로 테이블을 생성해주세요.');
          setChannels([]);
          setShowSql(true);
          return;
        }
        console.error('채널 목록 불러오기 오류:', error);
        toast.error(`채널 목록을 불러오는데 실패했습니다: ${error.message || '알 수 없는 오류'}`);
      } else {
        setChannels(data || []);
      }
    } catch (error) {
      console.error('채널 목록 불러오기 오류:', error);
      toast.error(`채널 목록을 불러오는데 실패했습니다: ${error instanceof Error ? error.message : '알 수 없는 오류'}`);
    } finally {
      setIsLoading(false);
    }
  };
  
  // 게시판 목록 가져오기
  const fetchBoards = async () => {
    try {
      const { data, error } = await supabase
        .from('boards')
        .select('id, name')
        .order('name', { ascending: true });
      
      if (error) {
        console.error('게시판 목록 불러오기 오류:', error);
        toast.error(`게시판 목록을 불러오는데 실패했습니다: ${error.message || '알 수 없는 오류'}`);
      } else {
        // name을 title로 변환
        const boardsWithTitle = data?.map(board => ({
          id: board.id,
          title: board.name
        })) || [];
        
        setBoards(boardsWithTitle);
      }
    } catch (error) {
      console.error('게시판 목록 불러오기 오류:', error);
      toast.error(`게시판 목록을 불러오는데 실패했습니다: ${error instanceof Error ? error.message : '알 수 없는 오류'}`);
    }
  };
  
  // 채널 추가하기
  const addChannel = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!channelId || !channelName || !boardId || !apiKey) {
      toast.error('모든 필수 필드를 입력해주세요.');
      return;
    }
    
    try {
      setIsLoading(true);
      
      // 유튜브 채널 정보 확인 (API가 유효한지 확인)
      const verifyRes = await fetch(`/api/admin/youtube/verify?apiKey=${apiKey}&channelId=${channelId}`);
      const verifyData = await verifyRes.json();
      
      if (!verifyRes.ok) {
        throw new Error(verifyData.message || '채널 정보를 확인할 수 없습니다.');
      }
      
      // 플레이리스트 ID가 있는 경우 유효성 검사
      if (playlistId) {
        const verifyPlaylistRes = await fetch(`/api/admin/youtube/verify-playlist?apiKey=${apiKey}&playlistId=${playlistId}`);
        const verifyPlaylistData = await verifyPlaylistRes.json();
        
        if (!verifyPlaylistRes.ok) {
          throw new Error(verifyPlaylistData.message || '재생목록 정보를 확인할 수 없습니다.');
        }
      }
      
      // 채널 추가 (playlist_id 필드가 존재하지 않을 경우 대비)
      try {
        const { error } = await supabase.from('youtube_channels').insert({
          channel_id: channelId,
          channel_name: channelName, 
          board_id: boardId,
          api_key: apiKey,
          playlist_id: playlistId || null,
          auto_publish: autoPublish
        });
        
        if (error) {
          // playlist_id 필드가 없는 경우 처리
          if (error.message?.includes('playlist_id') || error.details?.includes('playlist_id')) {
            // 재생목록 ID 필드 없이 다시 시도
            const { error: error2 } = await supabase.from('youtube_channels').insert({
              channel_id: channelId,
              channel_name: channelName, 
              board_id: boardId,
              api_key: apiKey,
              auto_publish: autoPublish
            });
            
            if (error2) {
              console.error('Supabase 채널 추가 오류 (2차 시도):', error2);
              throw new Error(`데이터베이스 오류: ${error2.message || error2.code || '알 수 없는 오류'}`);
            } else {
              // 성공했지만 재생목록 ID는 저장 못함
              toast.warning('유튜브 채널은 추가되었으나, 재생목록 ID는 저장할 수 없었습니다. SQL 업데이트가 필요합니다.');
              setShowSql(true);
            }
          } else {
            console.error('Supabase 채널 추가 오류:', error);
            throw new Error(`데이터베이스 오류: ${error.message || error.code || '알 수 없는 오류'}`);
          }
        } else {
          toast.success('유튜브 채널이 추가되었습니다.');
        }
      } catch (dbError) {
        console.error('데이터베이스 처리 오류:', dbError);
        throw dbError;
      }
      
      resetForm();
      fetchChannels();
    } catch (error) {
      // 오류 메시지 명확하게 출력
      const errorMessage = error instanceof Error 
        ? error.message 
        : (error && typeof error === 'object' && 'toString' in error)
          ? error.toString()
          : '알 수 없는 오류';
      
      console.error('채널 추가 오류:', errorMessage);
      toast.error(`채널 추가 실패: ${errorMessage}`);
    } finally {
      setIsLoading(false);
    }
  };
  
  // 채널 삭제하기
  const deleteChannel = async (id: string) => {
    if (!confirm('이 채널을 삭제하시겠습니까? 연결된 크롤링 설정이 모두 제거됩니다.')) {
      return;
    }
    
    try {
      setIsLoading(true);
      const { error } = await supabase
        .from('youtube_channels')
        .delete()
        .eq('id', id);
      
      if (error) throw error;
      
      toast.success('채널이 삭제되었습니다.');
      fetchChannels();
    } catch (error) {
      console.error('채널 삭제 오류:', error);
      toast.error(`채널 삭제 중 오류가 발생했습니다: ${error instanceof Error ? error.message : '알 수 없는 오류'}`);
    } finally {
      setIsLoading(false);
    }
  };
  
  // 특정 채널 크롤링 실행
  const runCrawler = async (channel: YoutubeChannel) => {
    try {
      setIsLoading(true);
      
      const res = await fetch('/api/admin/youtube/crawl', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ channelId: channel.id }),
      });
      
      const data = await res.json();
      
      if (!res.ok) {
        throw new Error(data.message || '크롤링 실행 중 오류가 발생했습니다.');
      }
      
      toast.success(`${data.imported || 0}개의 동영상이 가져와졌습니다.`);
      fetchChannels(); // 최종 크롤링 시간 업데이트
    } catch (error) {
      console.error('크롤링 실행 오류:', error);
      toast.error(`크롤링 실행 실패: ${error instanceof Error ? error.message : '알 수 없는 오류'}`);
    } finally {
      setIsLoading(false);
    }
  };
  
  // 폼 초기화
  const resetForm = () => {
    setChannelId('');
    setChannelName('');
    setBoardId('');
    setApiKey('');
    setPlaylistId('');
    setAutoPublish(true);
    setIsAdding(false);
  };
  
  // SQL 복사하기
  const copySQL = () => {
    navigator.clipboard.writeText(createTableSQL.trim());
    toast.success('SQL이 클립보드에 복사되었습니다.');
  };
  
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold">유튜브 크롤러 관리</h1>
        <div className="flex space-x-2">
          <button
            onClick={() => setShowSql(!showSql)}
            className="flex items-center px-4 py-2 bg-purple-600 text-white rounded-md hover:bg-purple-700"
          >
            <Code className="w-4 h-4 mr-1" />
            테이블 생성 SQL {showSql ? '숨기기' : '보기'}
          </button>
          <button
            onClick={() => setIsAdding(!isAdding)}
            className="flex items-center px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-md"
          >
            {isAdding ? '취소' : <>
              <Plus className="w-4 h-4 mr-1" />
              채널 추가
            </>}
          </button>
        </div>
      </div>
      
      {/* SQL 표시 섹션 */}
      {showSql && (
        <div className="bg-gray-900 text-gray-100 p-4 rounded-md overflow-x-auto">
          <div className="flex justify-between items-center mb-2">
            <h3 className="font-medium text-white">테이블 생성/업데이트 SQL</h3>
            <button 
              onClick={copySQL}
              className="px-3 py-1 bg-gray-700 hover:bg-gray-600 text-white rounded-md text-sm"
            >
              복사하기
            </button>
          </div>
          <pre className="text-sm whitespace-pre-wrap">{createTableSQL}</pre>
          <p className="mt-4 text-yellow-300 text-sm">
            ⚠️ Supabase SQL 편집기에서 위 SQL을 실행하여 테이블을 생성하거나 업데이트해주세요.
          </p>
          <div className="mt-4 bg-yellow-800 p-3 rounded-md">
            <h4 className="font-medium text-yellow-200">업데이트 필요!</h4>
            <p className="text-sm text-yellow-100 mt-1">
              재생목록(playlist_id) 기능을 사용하려면 아래 SQL을 실행하여 테이블을 업데이트해야 합니다:
            </p>
            <pre className="mt-2 p-2 bg-black bg-opacity-30 text-xs text-yellow-100 rounded-md overflow-x-auto">
{`-- 기존 테이블에 playlist_id 열 추가
ALTER TABLE public.youtube_channels ADD COLUMN IF NOT EXISTS playlist_id TEXT;`}
            </pre>
          </div>
        </div>
      )}
      
      {/* 채널 추가 폼 */}
      {isAdding && (
        <div className="bg-gray-50 p-4 rounded-md border border-gray-200 mb-6">
          <h2 className="text-lg font-medium mb-4">새 유튜브 채널 추가</h2>
          <form onSubmit={addChannel} className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  채널 ID<span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  value={channelId}
                  onChange={(e) => setChannelId(e.target.value)}
                  placeholder="UCQ2DWm5Md16Dc3xRwwhVE7Q"
                  className="w-full px-3 py-2 border border-gray-300 rounded-md"
                  required
                />
                <p className="text-xs text-gray-500 mt-1">
                  유튜브 채널 페이지 &gt; 공유 &gt; 채널 ID 복사
                </p>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  채널명<span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  value={channelName}
                  onChange={(e) => setChannelName(e.target.value)}
                  placeholder="채널 이름"
                  className="w-full px-3 py-2 border border-gray-300 rounded-md"
                  required
                />
              </div>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  API 키<span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  value={apiKey}
                  onChange={(e) => setApiKey(e.target.value)}
                  placeholder="Google YouTube Data API 키"
                  className="w-full px-3 py-2 border border-gray-300 rounded-md"
                  required
                />
                <p className="text-xs text-gray-500 mt-1">
                  Google Cloud Console에서 발급된 API 키
                </p>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  게시판 선택<span className="text-red-500">*</span>
                </label>
                <select
                  value={boardId}
                  onChange={(e) => setBoardId(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md"
                  required
                >
                  <option value="">게시판 선택</option>
                  {boards.map((board) => (
                    <option key={board.id} value={board.id}>
                      {board.title}
                    </option>
                  ))}
                </select>
              </div>
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                재생목록 ID (선택사항)
              </label>
              <input
                type="text"
                value={playlistId}
                onChange={(e) => setPlaylistId(e.target.value)}
                placeholder="PL7MQjbfOyOE3zS0aHkfotxiyEAyW6-bbZ"
                className="w-full px-3 py-2 border border-gray-300 rounded-md"
              />
              <p className="text-xs text-gray-500 mt-1">
                특정 재생목록만 크롤링하려면 재생목록 ID를 입력하세요. 비워두면 채널의 모든 동영상을 크롤링합니다.
              </p>
            </div>
            
            <div>
              <label className="flex items-center">
                <input
                  type="checkbox"
                  checked={autoPublish}
                  onChange={(e) => setAutoPublish(e.target.checked)}
                  className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                />
                <span className="ml-2 text-sm text-gray-700">크롤링 후 자동으로 게시글 발행</span>
              </label>
            </div>
            
            <div className="flex justify-end pt-2">
              <button
                type="button"
                onClick={resetForm}
                className="px-4 py-2 border border-gray-300 rounded-md text-sm text-gray-700 hover:bg-gray-50 mr-2"
              >
                취소
              </button>
              <button
                type="submit"
                className="px-4 py-2 bg-blue-600 text-white rounded-md text-sm hover:bg-blue-700"
                disabled={isLoading}
              >
                {isLoading ? '처리 중...' : '채널 추가'}
              </button>
            </div>
          </form>
        </div>
      )}
      
      {/* 채널 목록 */}
      <div className="bg-white rounded-md border border-gray-200 overflow-hidden">
        <div className="px-4 py-3 border-b border-gray-200 bg-gray-50">
          <h2 className="font-medium">등록된 유튜브 채널</h2>
        </div>
        
        {isLoading && channels.length === 0 ? (
          <div className="flex items-center justify-center p-8">
            <Spinner size="md" className="mr-2" />
            <p>로딩 중...</p>
          </div>
        ) : channels.length === 0 ? (
          <div className="p-8 text-center text-gray-500">
            <Youtube className="h-8 w-8 text-gray-400 mx-auto mb-2" />
            <p>등록된 유튜브 채널이 없습니다.</p>
            <p className="text-sm mt-1">채널 추가 버튼을 눌러 새로운 채널을 등록해보세요.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">채널</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">게시판</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">크롤링 범위</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">마지막 크롤링</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">자동 발행</th>
                  <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">작업</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {channels.map((channel) => {
                  // 연결된 게시판 찾기
                  const board = boards.find(b => b.id === channel.board_id);
                  
                  return (
                    <tr key={channel.id} className="hover:bg-gray-50">
                      <td className="px-4 py-4 whitespace-nowrap">
                        <div className="flex items-start">
                          <Youtube className="h-5 w-5 text-red-500 mr-2 flex-shrink-0 mt-0.5" />
                          <div>
                            <div className="font-medium text-gray-900">{channel.channel_name}</div>
                            <div className="text-sm text-gray-500">{channel.channel_id}</div>
                          </div>
                        </div>
                      </td>
                      <td className="px-4 py-4 whitespace-nowrap text-sm text-gray-500">
                        {board?.title || '삭제된 게시판'}
                      </td>
                      <td className="px-4 py-4 whitespace-nowrap text-sm text-gray-500">
                        {channel.playlist_id ? 
                          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-purple-100 text-purple-800">
                            특정 재생목록
                          </span> : 
                          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                            전체 채널
                          </span>
                        }
                      </td>
                      <td className="px-4 py-4 whitespace-nowrap text-sm text-gray-500">
                        {channel.last_crawled_at 
                          ? new Date(channel.last_crawled_at).toLocaleString() 
                          : '크롤링 내역 없음'}
                      </td>
                      <td className="px-4 py-4 whitespace-nowrap text-sm text-gray-500">
                        {channel.auto_publish ? '자동 발행' : '수동 발행'}
                      </td>
                      <td className="px-4 py-4 whitespace-nowrap text-right text-sm">
                        <button
                          onClick={() => runCrawler(channel)}
                          className="px-3 py-1.5 text-blue-600 hover:bg-blue-50 rounded-md border border-blue-200 inline-flex items-center mr-2"
                          disabled={isLoading}
                        >
                          <RefreshCw className="h-4 w-4 mr-1" />
                          크롤링
                        </button>
                        <button
                          onClick={() => deleteChannel(channel.id)}
                          className="px-3 py-1.5 text-red-600 hover:bg-red-50 rounded-md border border-red-200 inline-flex items-center"
                          disabled={isLoading}
                        >
                          <Trash2 className="h-4 w-4 mr-1" />
                          삭제
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
      
      {/* 도움말 */}
      <div className="bg-blue-50 border border-blue-200 rounded-md p-4">
        <h3 className="font-medium text-blue-800 mb-2">유튜브 크롤러 사용 방법</h3>
        <ol className="list-decimal pl-5 space-y-1 text-sm text-blue-800">
          <li>
            <a 
              href="https://console.cloud.google.com/apis/credentials" 
              target="_blank" 
              rel="noopener noreferrer"
              className="underline hover:text-blue-600"
            >
              Google Cloud Console
            </a>
            에서 YouTube Data API v3 API 키를 발급받으세요.
          </li>
          <li>유튜브 채널의 ID를 채널 페이지에서 공유 옵션을 통해 복사하세요.</li>
          <li>특정 카테고리/주제만 크롤링하려면 해당 재생목록 ID를 입력하세요. 재생목록 ID는 주소창의 <code className="bg-blue-100 text-blue-800 px-1 rounded">list=</code> 뒤의 값입니다. (예: <code className="bg-blue-100 text-blue-800 px-1 rounded">PL7MQjbfOyOE3zS0aHkfotxiyEAyW6-bbZ</code>)</li>
          <li>크롤링된 영상이 저장될 게시판을 선택하세요.</li>
          <li>자동 발행 옵션을 선택하면 크롤링된 영상이 자동으로 게시됩니다.</li>
          <li>크롤링 버튼을 눌러 수동으로 크롤링을 실행할 수 있습니다.</li>
        </ol>
        <p className="text-sm text-blue-800 mt-2">
          참고: API 키 하나당 하루 약 100회 정도의 크롤링이 가능합니다. 여러 구글 계정에서 다수의 API 키를 발급받아 사용하시면 더 많은 채널을 효과적으로 크롤링할 수 있습니다.
        </p>
      </div>
    </div>
  );
} 