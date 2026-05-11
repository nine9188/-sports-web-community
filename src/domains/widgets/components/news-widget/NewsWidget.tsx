import { getAllNewsPosts } from './actions';
import { MainCard, SideCard } from './NewsCardServer';
import { NewsItem } from './types';
import { Container } from '@/shared/components/ui';

/** 기본 뉴스 게시판 */
const DEFAULT_BOARD_SLUGS = ['foreign-news', 'domestic-news'];

/**
 * 뉴스 데이터를 가져오는 함수 (병렬 fetch용)
 * page.tsx에서 Promise.all로 호출 가능
 */
export async function fetchNewsData(boardSlugs: string[] = DEFAULT_BOARD_SLUGS): Promise<NewsItem[]> {
  return getAllNewsPosts(boardSlugs);
}

/**
 * 뉴스 위젯 (서버 컴포넌트)
 *
 * 구조:
 * - 서버: 뉴스 카드 HTML 렌더링 (LCP 최적화)
 * - 클라이언트: 이미지 로딩 상태만 관리
 *
 * 렌더링 흐름:
 * 1. 서버에서 뉴스 목록 HTML 생성
 * 2. NewsImageClient가 이미지 로딩/에러 처리
 */
interface NewsWidgetServerProps {
  news: NewsItem[];
}

export default async function NewsWidget({ news }: NewsWidgetServerProps) {
  if (!news || news.length === 0) {
    const sideEmptyCard = (
      <div className="h-[96px] bg-white dark:bg-[#1D1D1D] md:rounded-lg border border-black/7 dark:border-0 overflow-hidden">
        <div className="h-full p-3 flex items-center justify-center text-center">
          <p className="text-[13px] text-gray-500 dark:text-gray-400">뉴스가 없습니다.</p>
        </div>
      </div>
    );

    return (
      <div className="space-y-4">
        <div className="flex flex-col md:flex-row gap-4">
          <div className="md:w-1/2">
            <div className="h-[320px] bg-white dark:bg-[#1D1D1D] md:rounded-lg border border-black/7 dark:border-0 overflow-hidden">
              <div className="h-full p-3 flex items-center justify-center text-center">
                <p className="text-[13px] text-gray-500 dark:text-gray-400">뉴스가 없습니다.</p>
              </div>
            </div>
          </div>
          <div className="md:w-1/2 flex flex-col gap-4">
            {sideEmptyCard}
            {sideEmptyCard}
            {sideEmptyCard}
          </div>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {sideEmptyCard}
          {sideEmptyCard}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* 메인 레이아웃: 큰 배너(왼쪽) + 세로 카드 3개(오른쪽) */}
      <div className="flex flex-col md:flex-row gap-4">
        {/* 큰 배너 (첫 번째) - 왼쪽 */}
        <div className="md:w-1/2">
          <MainCard item={news[0]} />
        </div>

        {/* 세로 카드 3개 (2~4번째) - 오른쪽 */}
        {news.length > 1 && (
          <div className="md:w-1/2 flex flex-col gap-4">
            {news.slice(1, 4).map((item) => (
              <SideCard key={item.id} item={item} />
            ))}
          </div>
        )}
      </div>

      {/* 추가 뉴스 2열 그리드 (5~14번째) */}
      {news.length > 4 && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {news.slice(4, 14).map((item) => (
            <SideCard key={item.id} item={item} />
          ))}
        </div>
      )}
    </div>
  );
}
