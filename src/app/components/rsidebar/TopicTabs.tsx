'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { createClient } from '@/app/lib/supabase-browser';
import { Eye, ThumbsUp, MessageSquare, Image as ImageIcon, Link as LinkIcon, Video as VideoIcon, Youtube as YoutubeIcon } from 'lucide-react';

interface Post {
  id: string;
  title: string;
  created_at: string;
  board_id: string;
  board_name: string;
  board_slug: string;
  post_number: number;
  comment_count: number;
  views: number;
  likes: number;
  team_id?: string | number | null;
  league_id?: string | number | null;
  team_logo?: string | null;
  league_logo?: string | null;
  content?: string;
}

type TabType = '조회수' | '추천수' | '댓글수';

// 모든 데이터를 한 번에 캐싱
const postsCache: Record<string, Post[]> = {
  '조회수': [],
  '추천수': [],
  '댓글수': []
};

export default function TopicTabs() {
  const [displayPosts, setDisplayPosts] = useState<Post[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<TabType>('조회수');
  const [initialLoadComplete, setInitialLoadComplete] = useState(false);

  // 초기 데이터 로드 - 컴포넌트 마운트 시 한 번만 실행
  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      try {
        const supabase = createClient();
        
        // 1. 게시글 데이터 가져오기
        const { data: postsData, error } = await supabase
          .from('posts')
          .select(`
            id, 
            title, 
            created_at, 
            board_id,
            views,
            likes,
            post_number,
            content
          `)
          .limit(200);
          
        if (error) throw error;
        
        // 게시판 정보 가져오기 (team_id, league_id 포함)
        const validPosts = Array.isArray(postsData) ? postsData : [];
        const boardIds = [...new Set(validPosts.map(post => post.board_id || ''))];
        
        const { data: boardsData, error: boardsError } = await supabase
          .from('boards')
          .select('id, name, slug, team_id, league_id')
          .in('id', boardIds);
          
        if (boardsError) throw boardsError;
        
        const validBoards = Array.isArray(boardsData) ? boardsData : [];
        
        // 게시판 ID로 정보를 찾기 위한 맵 생성
        const boardMap: Record<string, {
          name: string, 
          slug: string, 
          team_id?: number | null, 
          league_id?: number | null
        }> = {};
        
        validBoards.forEach(board => {
          if (board && board.id) {
            boardMap[board.id] = {
              name: board.name || '', 
              slug: board.slug || board.id,
              team_id: board.team_id,
              league_id: board.league_id
            };
          }
        });
        
        // 팀 ID 및 리그 ID 수집
        const teamIds = validBoards
          .filter(board => board && board.team_id)
          .map(board => board.team_id!)
          .filter(Boolean);
          
        const leagueIds = validBoards
          .filter(board => board && board.league_id)
          .map(board => board.league_id!)
          .filter(Boolean);
        
        // 팀 로고 정보 가져오기
        const teamLogoMap: Record<string | number, string> = {};
        if (teamIds.length > 0) {
          const { data: teamsData } = await supabase
            .from('teams')
            .select('id, logo')
            .in('id', teamIds);
            
          const validTeams = Array.isArray(teamsData) ? teamsData : [];
          validTeams.forEach(team => {
            if (team && team.id) {
              teamLogoMap[team.id] = team.logo || '';
            }
          });
        }
        
        // 리그 로고 정보 가져오기
        const leagueLogoMap: Record<string | number, string> = {};
        if (leagueIds.length > 0) {
          const { data: leaguesData } = await supabase
            .from('leagues')
            .select('id, logo')
            .in('id', leagueIds);
            
          const validLeagues = Array.isArray(leaguesData) ? leaguesData : [];
          validLeagues.forEach(league => {
            if (league && league.id) {
              leagueLogoMap[league.id] = league.logo || '';
            }
          });
        }
        
        // 댓글 수 가져오기
        const postIds = validPosts.map(post => post.id).filter(Boolean);
        const commentCounts: Record<string, number> = {};
        
        // 댓글 수 병렬로 가져오기
        await Promise.all(
          postIds.map(async (postId) => {
            const { count, error: countError } = await supabase
              .from('comments')
              .select('*', { count: 'exact', head: true })
              .eq('post_id', postId);
              
            if (!countError) {
              commentCounts[postId] = count || 0;
            }
          })
        );
        
        // 데이터 형식 변환 (팀/리그 로고 정보 및 최근 활동 추가)
        const processedPosts: Post[] = validPosts.map(post => {
          if (!post || !post.id) return {} as Post;
          
          const boardInfo = post.board_id && boardMap[post.board_id] 
            ? boardMap[post.board_id] 
            : { name: '알 수 없음', slug: post.board_id || '', team_id: null, league_id: null };
          
          const teamId = boardInfo.team_id;
          const leagueId = boardInfo.league_id;
          
          // 로고 URL 결정
          const teamLogo = teamId && teamLogoMap[teamId] ? teamLogoMap[teamId] : null;
          const leagueLogo = leagueId && leagueLogoMap[leagueId] ? leagueLogoMap[leagueId] : null;
          
          return {
            id: post.id,
            title: post.title || '',
            created_at: post.created_at || '',
            board_id: post.board_id || '',
            board_name: boardInfo.name,
            board_slug: boardInfo.slug,
            post_number: post.post_number || 0,
            comment_count: post.id ? (commentCounts[post.id] || 0) : 0,
            views: post.views || 0,
            likes: post.likes || 0,
            team_id: teamId,
            league_id: leagueId,
            team_logo: teamLogo,
            league_logo: leagueLogo,
            content: post.content
          };
        }).filter(post => post.id) as Post[];
        
        // 각 탭에 맞게 정렬하여 캐시에 저장
        postsCache['조회수'] = [...processedPosts]
          .sort((a, b) => b.views - a.views)
          .slice(0, 20);
        
        postsCache['추천수'] = [...processedPosts]
          .sort((a, b) => b.likes - a.likes)
          .slice(0, 20);
        
        postsCache['댓글수'] = [...processedPosts]
          .sort((a, b) => b.comment_count - a.comment_count)
          .slice(0, 20);
        
        // 현재 탭에 맞는 정렬된 데이터 설정
        setDisplayPosts(postsCache[activeTab]);
        setInitialLoadComplete(true);
        
      } catch (error) {
        console.error('게시글 로딩 오류:', error);
      } finally {
        setLoading(false);
      }
    };
    
    fetchData();
  }, [activeTab]); // activeTab을 의존성 배열에 추가

  // 탭 변경 시 캐시된 데이터 사용
  useEffect(() => {
    if (initialLoadComplete) {
      setDisplayPosts(postsCache[activeTab]);
    }
  }, [activeTab, initialLoadComplete]);

  // 해당 탭에 맞는 수치와 아이콘 표시
  const renderCount = (post: Post) => {
    if (activeTab === '조회수') {
      return (
        <span className="text-gray-500 ml-1 shrink-0 flex items-center">
          <Eye className="h-3 w-3 mr-0.5" />
          {post.views}
        </span>
      );
    } else if (activeTab === '추천수') {
      return (
        <span className="text-gray-500 ml-1 shrink-0 flex items-center">
          <ThumbsUp className="h-3 w-3 mr-0.5" />
          {post.likes}
        </span>
      );
    } else if (activeTab === '댓글수') {
      return (
        <span className="text-gray-500 ml-1 shrink-0 flex items-center">
          <MessageSquare className="h-3 w-3 mr-0.5" />
          {post.comment_count}
        </span>
      );
    }
    return null;
  };

  // 게시글 내용에 특정 요소가 포함되어 있는지 확인하는 함수
  const checkContentType = (content?: string) => {
    if (!content) return { hasImage: false, hasVideo: false, hasYoutube: false, hasLink: false };
    
    // 이미지 및 비디오 감지
    const hasImage = content.includes('<img') || content.includes('data-type="image"');
    const hasVideo = content.includes('<video') || content.includes('data-type="video"');
    
    // 모든 URL 찾기
    const urlPattern = /https?:\/\/[^\s<>"']+/g;
    const urls = content.match(urlPattern) || [];
    
    // 각 URL 유형을 확인하기 위한 플래그
    let foundYoutubeUrl = false;
    let foundNonYoutubeUrl = false;
    
    // 각 URL을 검사하여 유튜브 URL과 일반 URL 구분
    for (const url of urls) {
      if (/youtube\.com|youtu\.be/i.test(url)) {
        // 유튜브 URL 발견
        foundYoutubeUrl = true;
      } else if (!/\.(jpg|jpeg|png|gif|webp|svg|bmp|mp4|webm|ogg|mov|avi|wmv|flv|mkv)(\?.*)?$/i.test(url)) {
        // 이미지나 비디오가 아닌 일반 URL 발견
        foundNonYoutubeUrl = true;
      }
      
      // 둘 다 찾았으면 더 이상 검사할 필요 없음
      if (foundYoutubeUrl && foundNonYoutubeUrl) break;
    }
    
    // 앵커 태그 검사 (URL 패턴으로 감지되지 않은 경우)
    if (!foundNonYoutubeUrl && content.includes('<a href')) {
      // 앵커 태그 중 유튜브가 아닌 것이 있는지 확인
      foundNonYoutubeUrl = !(
        content.includes('<a href="https://youtube.com') || 
        content.includes('<a href="https://www.youtube.com') || 
        content.includes('<a href="https://youtu.be')
      );
    }
    
    // 유튜브 감지 - URL 기반 또는 다른 패턴
    const hasYoutube = foundYoutubeUrl || 
                       content.includes('data-type="youtube"') ||
                       content.includes('youtube-video') ||
                       (content.includes('<iframe') && (content.includes('youtube.com') || content.includes('youtu.be')));
    
    // 일반 링크 감지 - 유튜브를 제외한 URL 또는 앵커 태그
    const hasLink = foundNonYoutubeUrl;
    
    return { hasImage, hasVideo, hasYoutube, hasLink };
  };

  return (
    <div className="mb-4 bg-white rounded-lg border">
      <div className="px-3 py-2 border-b">
        <div className="flex justify-between items-center">
          <h3 className="text-sm font-bold">인기글</h3>
          <span className="text-xs text-gray-500">최근 24시간 기준</span>
        </div>
      </div>
      
      <div className="px-3 py-2 border-b">
        <ul className="flex space-x-1">
          {[
            { id: '조회수', icon: <Eye className="h-3 w-3 mr-0.5" /> },
            { id: '추천수', icon: <ThumbsUp className="h-3 w-3 mr-0.5" /> },
            { id: '댓글수', icon: <MessageSquare className="h-3 w-3 mr-0.5" /> }
          ].map((tab) => (
            <li key={tab.id}>
              <button
                onClick={() => setActiveTab(tab.id as TabType)}
                className={`text-xs py-1 px-2 rounded-full flex items-center ${
                  activeTab === tab.id
                    ? 'bg-gray-500 text-white font-medium'
                    : 'bg-gray-100 hover:bg-gray-200 text-gray-700'
                }`}
              >
                {tab.icon}
                {tab.id}
              </button>
            </li>
          ))}
        </ul>
      </div>
      
      <div>
        {loading ? (
          <div className="p-2 space-y-2">
            {Array(10).fill(0).map((_, i) => (
              <div key={i} className="h-4 bg-gray-100 rounded animate-pulse"></div>
            ))}
          </div>
        ) : displayPosts.length === 0 ? (
          <div className="p-3 text-center text-gray-500 text-xs">
            게시글이 없습니다.
          </div>
        ) : (
          <ul>
            {displayPosts.map((post, index) => {
              // 게시글 내용에서 미디어 타입 확인
              const { hasImage, hasVideo, hasYoutube, hasLink } = checkContentType(post.content);
              
              return (
                <li key={post.id} className={index < displayPosts.length - 1 ? "border-b" : ""}>
                  <Link 
                    href={`/boards/${post.board_slug}/${post.post_number}?from=boards`} 
                    className="block px-3 py-2 hover:bg-gray-50"
                  >
                    <div className="flex items-center text-xs">
                      {/* 게시판 로고 또는 기본 아이콘 */}
                      {post.team_logo || post.league_logo ? (
                        <div className="relative w-5 h-5 mr-1 flex-shrink-0">
                          <Image 
                            src={post.team_logo || post.league_logo || ''}
                            alt={post.board_name}
                            fill
                            className="object-contain"
                            sizes="20px"
                          />
                        </div>
                      ) : (
                        <div className="w-5 h-5 bg-gray-100 rounded-full mr-1 flex-shrink-0 flex items-center justify-center">
                          <span className="text-[10px] text-gray-500">{post.board_name.charAt(0)}</span>
                        </div>
                      )}
                      <div className="flex items-center flex-1">
                        <span className="line-clamp-1 mr-1">{post.title}</span>
                        {/* 미디어 타입 아이콘 */}
                        <div className="flex items-center space-x-1 mr-1">
                          {hasImage && <ImageIcon className="h-3 w-3 text-gray-400" />}
                          {hasVideo && <VideoIcon className="h-3 w-3 text-gray-400" />}
                          {hasYoutube && <YoutubeIcon className="h-3 w-3 text-red-400" />}
                          {hasLink && <LinkIcon className="h-3 w-3 text-blue-400" />}
                          {post.comment_count > 0 && (
                            <span className="text-xs text-gray-500 ml-0.5">[{post.comment_count}]</span>
                          )}
                        </div>
                      </div>
                      {renderCount(post)}
                    </div>
                  </Link>
                </li>
              );
            })}
          </ul>
        )}
      </div>
    </div>
  );
} 