import { Metadata } from 'next';
import { createClient } from '@/shared/api/supabaseServer';
import { getCategoryItemsPaginated, getUserItems, getUserPoints, getShopCategories } from '@/domains/shop/actions/actions';
import CategoryFilter from '@/domains/shop/components/CategoryFilter';
import ShopPagination from '@/domains/shop/components/ShopPagination';

// 동적 렌더링 강제 설정 추가
export const dynamic = 'force-dynamic';

export const metadata: Metadata = {
  title: '상점 | 내 서비스',
  description: '다양한 아이템을 구매하세요.',
};

interface Props {
  searchParams?: Promise<Record<string, string | string[] | undefined>>
}

export default async function ShopPage({ searchParams }: Props) {
  const supabase = await createClient();

  // 활성 카테고리 전체 조회
  const categoriesAll = await getShopCategories();
  const activeCategories = (categoriesAll || []).filter((c) => c.is_active);

  // 루트/자식 분리
  const rootCategoriesRaw = activeCategories
    .filter((c) => c.parent_id == null)
    .sort((a, b) => (a.display_order ?? 9999) - (b.display_order ?? 9999) || a.name.localeCompare(b.name));

  const childrenByParent = new Map<number, { id: number; name: string }[]>();
  activeCategories
    .filter((c) => c.parent_id != null)
    .forEach((c) => {
      const parentId = c.parent_id as unknown as number;
      const arr = childrenByParent.get(parentId) ?? [];
      arr.push({ id: c.id, name: c.name });
      childrenByParent.set(parentId, arr);
    });

  // 필터 탭 데이터: 루트 + (있다면) 하위 카테고리
  const filterCategories = rootCategoriesRaw.map((c) => ({
    id: c.id,
    name: c.name,
    subcategories: (childrenByParent.get(c.id) ?? []).sort((a, b) => a.name.localeCompare(b.name)),
  }));

  // 초기 아이템: 루트 + 모든 하위 카테고리 아이디 포함
  const initialCategoryIds = [
    ...rootCategoriesRaw.map((c) => c.id),
    ...Array.from(childrenByParent.values()).flat().map((c) => c.id),
  ];

  // 사용자 정보
  const { data: { user }, error } = await supabase.auth.getUser();

  // 페이지네이션 파라미터 추출 (App Router 규칙에 맞춰 비동기 처리)
  const sp = await (searchParams ?? Promise.resolve({} as Record<string, string | string[] | undefined>))
  const pageParam = Array.isArray(sp['page']) ? sp['page'][0] : sp['page']
  const catParam = Array.isArray(sp['cat']) ? sp['cat'][0] : sp['cat']
  const page = Math.max(1, Number(pageParam ?? '1') || 1)
  const pageSize = 24

  // 선택 카테고리 범위 계산 (탭별 페이지네이션을 위해)
  let categoryIdsForFetch = initialCategoryIds
  if (catParam && catParam !== 'all') {
    const catId = Number(catParam)
    if (!Number.isNaN(catId)) {
      // 루트 매칭?
      const root = filterCategories.find(c => c.id === catId)
      if (root) {
        const ids = new Set<number>([root.id])
        ;(root.subcategories || []).forEach(s => ids.add(s.id))
        categoryIdsForFetch = Array.from(ids)
      } else {
        // 서브카테고리 매칭?
        const parent = filterCategories.find(p => (p.subcategories || []).some(s => s.id === catId))
        if (parent) {
          categoryIdsForFetch = [catId]
        }
      }
    }
  }

  // 아이템 로드 (페이지네이션)
  const { items, total } = categoryIdsForFetch.length > 0
    ? await getCategoryItemsPaginated(categoryIdsForFetch, page, pageSize)
    : { items: [], total: 0 }

  // 사용자 포인트/보유 아이템
  const userPoints = user && !error ? await getUserPoints(user.id) : 0;
  const userItems = user && !error ? await getUserItems(user.id) : [];

  return (
    <div className="container mx-auto">
      <div className="mb-4 rounded-md border border-gray-200 p-4 flex items-center justify-between">
        <h1 className="text-xl font-bold">포인트 상점</h1>
        {user && !error && (
          <div className="flex items-center gap-2 text-sm">
            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-5 h-5 text-blue-600">
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 6v12m-3-2.818.879.659c1.171.879 3.07.879 4.242 0 1.172-.879 1.172-2.303 0-3.182C13.536 12.219 12.768 12 12 12c-.725 0-1.45-.22-2.003-.659-1.106-.879-1.106-2.303 0-3.182s2.9-.879 4.006 0l.415.33M21 12a9 9 0 1 1-18 0 9 9 0 0 1 18 0Z" />
            </svg>
            <span className="text-gray-600">보유 포인트</span>
            <span className="font-semibold tabular-nums">{userPoints} P</span>
          </div>
        )}
      </div>

      {/* 상세형 상점: 탭 + 로그인 안내(하위) + 그리드 */}
      <CategoryFilter 
        items={items}
        userItems={userItems}
        userPoints={userPoints}
        userId={user?.id}
        categories={filterCategories}
        initialActiveCategory={catParam ?? 'all'}
        loginNotice={(!user || error) ? (
          <div className="p-3 sm:p-4 bg-blue-50 rounded-md text-center border border-blue-100">
            <p className="text-blue-700 text-sm sm:text-base">아이템을 구매하고 사용하려면 로그인이 필요합니다.</p>
            <a href="/signin" className="mt-2 inline-block px-3 py-2 sm:px-4 sm:py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 text-sm">
              로그인하기
            </a>
          </div>
        ) : null}
      />

      <ShopPagination page={page} pageSize={pageSize} total={total} />

      {/* 루트 카테고리가 없을 경우 */}
      {(!rootCategoriesRaw || rootCategoriesRaw.length === 0) && (
        <div className="text-center py-10 sm:py-12 bg-gray-50 rounded-lg mt-4 sm:mt-6">
          <p className="text-gray-500">현재 이용 가능한 상점 카테고리가 없습니다.</p>
        </div>
      )}
    </div>
  );
} 