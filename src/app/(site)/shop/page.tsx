import { getSupabaseServer } from "@/shared/lib/supabase/server";
import {
  getCategoryItemsPaginated,
  getUserItems,
  getUserPoints,
  getShopCategories,
} from "@/domains/shop/actions/actions";
import { getEmoticonShopData } from "@/domains/boards/actions/emoticons";
import CategoryFilter from "@/domains/shop/components/CategoryFilter";
import type { ShopItem } from "@/domains/shop/types";
import TrackPageVisit from "@/domains/layout/components/TrackPageVisit";
import { buildMetadata } from "@/shared/utils/metadataNew";
import DaumWebmasterHints from "@/shared/components/DaumWebmasterHints";

export const dynamic = "force-dynamic";

const SHOP_PAGE_SIZE = 30;
const SPECIAL_ITEMS_CATEGORY_ID = 24;

type ShopSearchParams = Record<string, string | string[] | undefined>;
type ShopCategoryRow = Awaited<ReturnType<typeof getShopCategories>>[number];

interface Props {
  searchParams?: Promise<ShopSearchParams>;
}

function readQueryValue(value: string | string[] | undefined): string | undefined {
  return Array.isArray(value) ? value[0] : value;
}

function parsePage(value: string | string[] | undefined): number {
  const parsed = parseInt(readQueryValue(value) || "1", 10);
  return Number.isFinite(parsed) ? Math.max(1, parsed) : 1;
}

function buildShopReturnPath(searchParams: ShopSearchParams): string {
  const params = new URLSearchParams();
  const cat = readQueryValue(searchParams.cat);
  const page = readQueryValue(searchParams.page);

  if (cat && cat !== "all") params.set("cat", cat);
  if (page) params.set("page", page);

  const query = params.toString();
  return query ? `/shop?${query}` : "/shop";
}

function buildShopLoginHref(searchParams: ShopSearchParams): string {
  const redirect = buildShopReturnPath(searchParams);
  return `/signin?redirect=${encodeURIComponent(redirect)}&message=${encodeURIComponent("로그인이 필요한 기능입니다.")}`;
}

function normalizeCategoryParam(
  value: string | string[] | undefined,
  categories: ShopCategoryRow[],
): string {
  const raw = readQueryValue(value);
  if (!raw || raw === "all") return "all";

  const slugMatch = categories.find((category) => category.slug === raw);
  if (slugMatch) return String(slugMatch.id);

  const numeric = Number(raw);
  if (Number.isFinite(numeric) && categories.some((category) => category.id === numeric)) {
    return String(numeric);
  }

  return "all";
}

function collectCategoryIds(
  activeCategory: string,
  rootCategories: ShopCategoryRow[],
  childrenByParent: Map<number, { id: number; name: string; display_order?: number }[]>,
  emoticonCategoryId: number | null,
): number[] {
  const excludedIds = new Set<number>([
    SPECIAL_ITEMS_CATEGORY_ID,
    ...(emoticonCategoryId ? [emoticonCategoryId] : []),
  ]);

  if (activeCategory === "all") {
    return rootCategories
      .filter((category) => !excludedIds.has(category.id))
      .flatMap((category) => [
        category.id,
        ...(childrenByParent.get(category.id) ?? []).map((child) => child.id),
      ]);
  }

  const activeId = Number(activeCategory);
  if (!Number.isFinite(activeId)) return [];

  return [
    activeId,
    ...(childrenByParent.get(activeId) ?? []).map((child) => child.id),
  ];
}

export async function generateMetadata({ searchParams }: Props) {
  const sp = await (searchParams ?? Promise.resolve({} as ShopSearchParams));
  const hasStateQuery = Boolean(
    readQueryValue(sp.cat) ||
    readQueryValue(sp.page) ||
    readQueryValue(sp.purchaseItemId) ||
    readQueryValue(sp.purchasePackId)
  );

  return buildMetadata({
    title: "포인트 상점",
    ogTitle: "4590 포인트 상점",
    description: "4590 커뮤니티 활동 및 출석체크로 모은 포인트로 아이콘 및 혜택 상품을 교환하세요.",
    path: "/shop",
    keywords: ["4590", "포인트 상점", "출석체크", "4590포인트", "4590football"],
    ...(hasStateQuery ? { robots: { index: false, follow: true } } : {}),
  });
}

export default async function ShopPage({ searchParams }: Props) {
  const supabase = await getSupabaseServer();
  const categoriesAll = await getShopCategories();
  const activeCategories = (categoriesAll || []).filter((category) => category.is_active);
  const rootCategoriesRaw = activeCategories
    .filter((category) => category.parent_id == null)
    .sort(
      (a, b) =>
        (a.display_order ?? 9999) - (b.display_order ?? 9999) ||
        a.name.localeCompare(b.name),
    );

  const childrenByParent = new Map<number, { id: number; name: string; display_order?: number }[]>();
  activeCategories
    .filter((category) => category.parent_id != null)
    .forEach((category) => {
      const parentId = category.parent_id as unknown as number;
      const arr = childrenByParent.get(parentId) ?? [];
      arr.push({
        id: category.id,
        name: category.name,
        display_order: category.display_order ?? undefined,
      });
      childrenByParent.set(parentId, arr);
    });

  const emoticonCategory = rootCategoriesRaw.find((category) => category.slug === "emoticon-packs");
  const emoticonCategoryId = emoticonCategory?.id ?? null;
  const filterCategories = rootCategoriesRaw.map((category) => ({
    id: category.id,
    name: category.name,
    display_order: category.display_order ?? undefined,
    subcategories: (childrenByParent.get(category.id) ?? []).sort((a, b) =>
      (a.display_order ?? 9999) - (b.display_order ?? 9999) || a.name.localeCompare(b.name),
    ),
  }));

  const {
    data: { user },
    error,
  } = await supabase.auth.getUser();
  const sp = await (searchParams ?? Promise.resolve({} as ShopSearchParams));
  const loginHref = buildShopLoginHref(sp);
  const activeCategory = normalizeCategoryParam(sp.cat, activeCategories);
  const page = parsePage(sp.page);
  const isEmoticonTab = emoticonCategoryId != null && activeCategory === String(emoticonCategoryId);
  const categoryIdsForFetch = isEmoticonTab
    ? []
    : collectCategoryIds(activeCategory, rootCategoriesRaw, childrenByParent, emoticonCategoryId);

  const [{ items, total }, userPoints, userItems, initialEmoticonData] = await Promise.all([
    categoryIdsForFetch.length > 0
      ? getCategoryItemsPaginated(categoryIdsForFetch, page, SHOP_PAGE_SIZE)
      : Promise.resolve({ items: [], total: 0, page, pageSize: SHOP_PAGE_SIZE }),
    user && !error ? getUserPoints(user.id) : Promise.resolve(0),
    user && !error ? getUserItems(user.id) : Promise.resolve([]),
    isEmoticonTab ? getEmoticonShopData() : Promise.resolve(undefined),
  ]);

  return (
    <div className="container mx-auto">
      <TrackPageVisit id="shop" slug="shop" name="아이콘샵" />
      <DaumWebmasterHints
        title="포인트 상점 - 4590 Football"
        content="4590 Football 포인트 상점에서 프로필 아이콘, 닉네임 변경권, 커뮤니티 아이템을 확인하세요."
      />
      <div className="bg-white dark:bg-[#1D1D1D] border border-black/7 dark:border-0 md:rounded-lg overflow-hidden mb-4">
        <div className="bg-[#F5F5F5] dark:bg-[#262626] h-12 px-4 flex items-center md:rounded-t-lg">
          <h1 className="text-[13px] font-bold text-gray-900 dark:text-[#F0F0F0]">
            포인트 상점
          </h1>
          {user && !error && (
            <div className="ml-auto flex items-center gap-2 text-[13px]">
              <svg
                xmlns="http://www.w3.org/2000/svg"
                fill="none"
                viewBox="0 0 24 24"
                strokeWidth={1.5}
                stroke="currentColor"
                className="w-5 h-5 text-gray-700 dark:text-gray-300"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M12 6v12m-3-2.818.879.659c1.171.879 3.07.879 4.242 0 1.172-.879 1.172-2.303 0-3.182C13.536 12.219 12.768 12 12 12c-.725 0-1.45-.22-2.003-.659-1.106-.879-1.106-2.303 0-3.182s2.9-.879 4.006 0l.415.33M21 12a9 9 0 1 1-18 0 9 9 0 0 1 18 0Z"
                />
              </svg>
              <span className="text-gray-700 dark:text-gray-300">
                보유 포인트
              </span>
              <span className="font-semibold tabular-nums text-gray-900 dark:text-[#F0F0F0]">
                {userPoints} P
              </span>
            </div>
          )}
        </div>
      </div>

      <CategoryFilter
        items={items as ShopItem[]}
        userItems={userItems}
        userPoints={userPoints}
        userId={user?.id}
        categories={filterCategories}
        initialActiveCategory={activeCategory}
        emoticonCategoryId={emoticonCategoryId}
        currentPage={page}
        totalPages={Math.ceil(total / SHOP_PAGE_SIZE)}
        serverPaginated
        initialEmoticonData={initialEmoticonData}
        loginNotice={
          !user || error ? (
            <div className="p-3 sm:p-4 bg-[#F5F5F5] dark:bg-[#262626] rounded-md text-center border border-black/7 dark:border-0">
              <p className="text-gray-900 dark:text-[#F0F0F0] text-[13px] sm:text-base">
                아이템을 구매하고 사용하려면 로그인이 필요합니다.
              </p>
              <a
                href={loginHref}
                className="mt-2 inline-block px-3 py-2 sm:px-4 sm:py-2 bg-brand-primary dark:bg-brand-primary-dark text-white rounded-md hover:bg-brand-hover dark:hover:bg-brand-hover-dark transition-colors text-[13px] outline-none focus:outline-none focus-visible:outline-none focus-visible:ring-0 focus-visible:ring-offset-0"
              >
                로그인하기
              </a>
            </div>
          ) : null
        }
      />

      {rootCategoriesRaw.length === 0 && (
        <div className="text-center py-10 sm:py-12 bg-[#F5F5F5] dark:bg-[#262626] rounded-lg mt-4 sm:mt-6">
          <p className="text-gray-700 dark:text-gray-300">
            현재 이용 가능한 상점 카테고리가 없습니다.
          </p>
        </div>
      )}
    </div>
  );
}
