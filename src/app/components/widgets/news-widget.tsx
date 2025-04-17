'use client';

import { useEffect, useState, useRef } from 'react';
import Image from 'next/image';
import Link from 'next/link';

// 뉴스 데이터 인터페이스
interface NewsItem {
  id: string;
  title: string;
  summary?: string;
  imageUrl?: string;
  source: string;
  publishedAt: string;
  url: string;
}

// API 응답 데이터 인터페이스
interface PostData {
  id: string;
  title: string;
  content?: string | Record<string, unknown>;
  description?: string;
  imageUrl?: string;
  image_url?: string;
  publishedAt?: string;
  created_at?: string;
  pubDate?: string;
  source?: string;
  author?: string;
  author_name?: string;
  link?: string;
  url?: string;
  board_id?: string;
  board_name?: string;
  [key: string]: unknown;
}

interface NewsWidgetProps {
  initialNews?: NewsItem[];
  boardSlug?: string;
}

export default function NewsWidget({ initialNews = [], boardSlug = 'sports-news' }: NewsWidgetProps) {
  const [news, setNews] = useState<NewsItem[]>(initialNews);
  const [loading, setLoading] = useState<boolean>(initialNews.length === 0);
  const [error, setError] = useState<string | null>(null);
  const isDataFetched = useRef<boolean>(false);
  const [imageErrors, setImageErrors] = useState<Record<string, boolean>>({});

  useEffect(() => {
    // 이미 데이터를 가져왔거나 초기 뉴스가 있으면 API 호출 스킵
    if (isDataFetched.current || initialNews.length > 0) return;

    const fetchLatestPosts = async () => {
      try {
        setLoading(true);
        
        // 게시판 글 가져오기 API
        const response = await fetch(`/api/posts/board?board=${boardSlug}&limit=5&sort=latest`);
        
        if (!response.ok) {
          throw new Error('게시글 목록을 불러오는데 실패했습니다.');
        }
        
        const data = await response.json();
        
        // 받은 데이터를 NewsItem 형식으로 변환
        const formattedNews: NewsItem[] = data.map((post: PostData, index: number) => {
          // 요약(summary) 생성: 콘텐츠에서 HTML 태그 제거하고 일부만 추출
          let summary = post.description || '';
          if (!summary && typeof post.content === 'string') {
            // HTML 태그 제거
            summary = post.content.replace(/<[^>]*>/g, '');
          } else if (post.content && typeof post.content === 'object') {
            // 객체인 경우 description 필드 사용
            const contentObj = post.content as Record<string, unknown>;
            summary = (contentObj.description as string) || '';
          }
          
          // 150자로 요약 제한
          summary = summary.slice(0, 150) + (summary.length > 150 ? '...' : '');
          
          // 이미지 URL 결정
          let imageUrl = post.imageUrl || post.image_url || '';
          
          // 이미지가 없으면 백업 이미지 설정
          if (!imageUrl) {
            imageUrl = `/213/news${(index % 4) + 1}.jpg`;
          }
          
          // 날짜 확인 및 기본값 설정
          const publishedAt = post.publishedAt || post.created_at || post.pubDate || new Date().toISOString();
          
          // 출처 결정 (게시판 이름이나 작성자 이름)
          const source = post.board_name || post.author_name || post.author || '게시판';
          
          return {
            id: post.id || `news-${index}`,
            title: post.title || '제목 없음',
            summary: summary,
            imageUrl: imageUrl,
            source: source,
            publishedAt: publishedAt,
            url: `/boards/${boardSlug}/${post.id}`
          };
        });
        
        setNews(formattedNews);
        isDataFetched.current = true;
      } catch (err) {
        console.error('게시글 목록 가져오기 오류:', err);
        setError('게시글 목록을 불러오는데 실패했습니다.');
        isDataFetched.current = true; // 에러가 발생해도 중복 호출 방지
      } finally {
        setLoading(false);
      }
    };

    fetchLatestPosts();
  }, [initialNews.length, boardSlug]);

  // 이미지 로드 에러 처리 함수
  const handleImageError = (id: string) => {
    setImageErrors(prev => ({
      ...prev,
      [id]: true
    }));
  };

  // 날짜 포맷팅
  const formatDate = (dateString: string) => {
    try {
      const date = new Date(dateString);
      const now = new Date();
      
      // 날짜가 유효하지 않으면 '방금 전' 반환
      if (isNaN(date.getTime())) return '방금 전';
      
      const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
      const newsDate = new Date(date.getFullYear(), date.getMonth(), date.getDate());
      
      if (newsDate.getTime() === today.getTime()) {
        return date.toLocaleTimeString('ko-KR', {
          hour: '2-digit',
          minute: '2-digit',
          hour12: false
        });
      }
      
      const yesterday = new Date(today);
      yesterday.setDate(yesterday.getDate() - 1);
      if (newsDate.getTime() === yesterday.getTime()) {
        return '어제';
      }
      
      return `${date.getFullYear()}-${(date.getMonth() + 1).toString().padStart(2, '0')}-${date.getDate().toString().padStart(2, '0')}`;
    } catch {
      return '날짜 정보 없음';
    }
  };

  // 로딩 상태
  if (loading) {
    return (
      <div className="mb-4">
        <div className="flex flex-col md:flex-row gap-4">
          {/* 메인 뉴스 스켈레톤 */}
          <div className="md:w-1/2">
            <div className="h-[400px] mb-4 md:mb-0 bg-gray-100 rounded-lg overflow-hidden">
              <div className="w-full h-full animate-pulse bg-gray-200" />
            </div>
          </div>
          
          {/* 나머지 뉴스 스켈레톤 */}
          <div className="md:w-1/2">
            <div className="grid grid-cols-2 gap-4 h-full">
              {Array(4).fill(0).map((_, i) => (
                <div key={i} className="bg-gray-100 rounded-lg overflow-hidden h-full">
                  <div className="flex flex-col h-full">
                    <div className="w-full h-32 animate-pulse bg-gray-200" />
                    <div className="p-3">
                      <div className="w-full h-4 mb-2 animate-pulse bg-gray-200" />
                      <div className="w-3/4 h-4 animate-pulse bg-gray-200" />
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    );
  }

  // 에러 상태
  if (error) {
    return (
      <div className="mb-4">
        <div className="flex justify-center items-center h-64 text-red-500 bg-red-50 rounded-lg border border-red-200 p-4">
          <p>{error}</p>
        </div>
      </div>
    );
  }

  // 뉴스 없음 상태
  if (!news.length) {
    return (
      <div className="mb-4">
        <div className="flex justify-center items-center h-64 text-muted-foreground bg-gray-50 rounded-lg border p-4">
          표시할 게시글이 없습니다.
        </div>
      </div>
    );
  }

  // 백업 이미지 가져오기
  const getBackupImage = (id: string, index: number) => {
    return `/213/news${(index % 4) + 1}.jpg`;
  };

  return (
    <div className="mb-4">
      {/* 뉴스 레이아웃 - 메인 뉴스 왼쪽, 작은 뉴스 오른쪽 2x2 그리드 */}
      <div className="flex flex-col md:flex-row gap-4">
        {/* 메인 뉴스 (첫 번째 뉴스) - 왼쪽 배치 */}
        <div className="md:w-1/2">
          <Link
            href={news[0].url}
            className="block h-full mb-4 md:mb-0 bg-white rounded-lg border overflow-hidden hover:shadow-md transition-all group"
          >
            <div className="relative w-full aspect-[4/3] md:aspect-auto md:h-full md:min-h-[450px] transform transition-transform group-hover:scale-[1.02]">
              <Image
                src={imageErrors[news[0].id] ? getBackupImage(news[0].id, 0) : (news[0].imageUrl || getBackupImage(news[0].id, 0))}
                alt={news[0].title}
                fill
                className="object-cover"
                sizes="(max-width: 768px) 100vw, 50vw"
                priority
                onError={() => handleImageError(news[0].id)}
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/50 to-transparent">
                <div className="absolute bottom-0 left-0 w-full p-4">
                  <div className="flex justify-between text-white">
                    <span className="text-xs bg-primary px-2 py-1 rounded">{news[0].source}</span>
                    <span className="text-xs">{formatDate(news[0].publishedAt)}</span>
                  </div>
                  <h2 className="font-bold text-lg md:text-xl text-white mt-2 group-hover:underline">{news[0].title}</h2>
                </div>
              </div>
            </div>
          </Link>
        </div>
        
        {/* 나머지 뉴스 - 오른쪽 2x2 그리드 */}
        <div className="md:w-1/2">
          <div className="grid grid-cols-2 gap-4 h-full">
            {news.slice(1, 5).map((item, index) => (
              <Link
                key={item.id}
                href={item.url}
                className="bg-white rounded-lg border overflow-hidden hover:shadow-md transition-all h-full group"
              >
                <div className="flex flex-col h-full">
                  <div className="relative w-full aspect-video transform transition-transform group-hover:scale-[1.02]">
                    <Image
                      src={imageErrors[item.id] ? getBackupImage(item.id, index + 1) : (item.imageUrl || getBackupImage(item.id, index + 1))}
                      alt={item.title}
                      fill
                      className="object-cover"
                      sizes="(max-width: 768px) 100vw, 25vw"
                      onError={() => handleImageError(item.id)}
                    />
                    <div className="absolute top-0 right-0 bg-black/70 text-white px-2 py-1 text-xs">
                      {formatDate(item.publishedAt)}
                    </div>
                    <div className="absolute bottom-0 left-0 bg-primary text-white px-2 py-1 text-xs">
                      {item.source}
                    </div>
                  </div>
                  <div className="p-3 flex-grow">
                    <h3 className="font-medium text-sm line-clamp-2 group-hover:underline">
                      {item.title}
                    </h3>
                  </div>
                </div>
              </Link>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
} 