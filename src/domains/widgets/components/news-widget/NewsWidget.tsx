import { getAllNewsPosts } from './actions';
import { MainCard, SideCard } from './NewsCardServer';
import { NewsWidgetProps, NewsItem } from './types';

/** 기본 뉴스 게시판 */
const DEFAULT_BOARD_SLUGS = ['foreign-news', 'domestic-news'];

/**
 * 뉴스 데이터를 가져오는 함수 (병렬 fetch용)
 * page.tsx에서 Promise.all로 호출 가능
 */
export async function fetchNewsData(boardSlugs: string[] = DEFAULT_BOARD_SLUGS): Promise<NewsItem[]> {
  return getAllNewsPosts(boardSlugs);
}

interface NewsWidgetServerProps extends NewsWidgetProps {
  /** 미리 fetch된 데이터 (병렬 fetch 시 사용) */
  initialData?: NewsItem[];
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
export default async function NewsWidget({ boardSlug, initialData }: NewsWidgetServerProps = {}) {
  // initialData가 제공되면 바로 사용, 없으면 자체 fetch
  let news: NewsItem[];

  if (initialData) {
    news = initialData;
  } else {
    const slugs = boardSlug
      ? (Array.isArray(boardSlug) ? boardSlug : [boardSlug])
      : DEFAULT_BOARD_SLUGS;
    news = await getAllNewsPosts(slugs);
  }

  // LCP 최적화: 뉴스가 없으면 렌더링하지 않음
  if (!news || news.length === 0) {
    return null;
  }

  return (
    <div>
      {/* 메인 레이아웃: 큰 배너(왼쪽) + 세로 카드 3개(오른쪽) */}
      <div className="flex flex-col md:flex-row mb-4 gap-4">
        {/* 큰 배너 (첫 번째) - 왼쪽 */}
        <div className="md:w-1/2">
          <MainCard item={news[0]} />
        </div>

        {/* 세로 카드 3개 (2~4번째) - 오른쪽, gap-2 (8px * 2 = 16px) */}
        {news.length > 1 && (
          <div className="md:w-1/2 flex flex-col gap-2">
            {news.slice(1, 4).map((item) => (
              <SideCard key={item.id} item={item} />
            ))}
          </div>
        )}
      </div>

      {/* 추가 뉴스 2열 그리드 (5~14번째) - SideCard와 동일 */}
      {news.length > 4 && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
          {news.slice(4, 14).map((item) => (
            <SideCard key={item.id} item={item} />
          ))}
        </div>
      )}
    </div>
  );
}
