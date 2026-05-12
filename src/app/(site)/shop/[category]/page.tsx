import { notFound } from "next/navigation";
import { Metadata } from "next";
import { getSupabaseServer } from "@/shared/lib/supabase/server";
import {
  getShopCategory,
  getCategoryItemsPaginated,
  getUserPoints,
  getUserItems,
} from "@/domains/shop/actions/actions";
import CategoryFilter from "@/domains/shop/components/CategoryFilter";
import type { ShopItem } from "@/domains/shop/types";
import {
  Container,
  ContainerHeader,
  ContainerTitle,
} from "@/shared/components/ui";
import { buildMetadata } from "@/shared/utils/metadataNew";
import DaumWebmasterHints from "@/shared/components/DaumWebmasterHints";

// 동적 렌더링 강제 설정 추가
export const dynamic = "force-dynamic";

interface Props {
  params: Promise<{
    category: string;
  }>;
  searchParams?: Promise<Record<string, string | string[] | undefined>>;
}

function readQueryValue(value: string | string[] | undefined): string | undefined {
  return Array.isArray(value) ? value[0] : value;
}

function parsePage(value: string | string[] | undefined): number {
  const parsed = parseInt(readQueryValue(value) || "1", 10);
  return Number.isFinite(parsed) ? Math.max(1, parsed) : 1;
}

export async function generateMetadata({ params, searchParams }: Props): Promise<Metadata> {
  const { category } = await params;
  const sp = await (searchParams ??
    Promise.resolve({} as Record<string, string | string[] | undefined>));
  const categoryData = await getShopCategory(category);

  // 카테고리 없음 → noindex
  if (!categoryData) {
    return buildMetadata({
      title: "상점",
      description: "상품을 구매하세요.",
      path: `/shop/${category}`,
      noindex: true,
    });
  }

  // 카테고리 아이템 수 체크
  const allCategoryIds = [categoryData.id];
  (categoryData.subcategories || []).forEach((child) => {
    allCategoryIds.push(child.id);
    (child.subcategories || []).forEach((grandchild) => {
      allCategoryIds.push(grandchild.id);
    });
  });
  const { total } = await getCategoryItemsPaginated(allCategoryIds, 1, 1);

  // 필터/정렬 파라미터 체크 (cat, page 등)
  const hasFilterParams = readQueryValue(sp["cat"]) || readQueryValue(sp["page"]);

  // 아이템 0개 → noindex
  if (total === 0) {
    return buildMetadata({
      title: `${categoryData.name} - 상점`,
      description: `${categoryData.name} 아이템을 구매하세요.`,
      path: `/shop/${category}`,
      noindex: true,
    });
  }

  // 필터 파라미터 있으면 canonical을 기본 URL로 고정 (중복 방지)
  return buildMetadata({
    title: `${categoryData.name} - 상점`,
    description: `${categoryData.name} 아이템을 구매하세요.`,
    path: `/shop/${category}`,
    noindex: hasFilterParams ? true : false,
  });
}

export default async function CategoryPage({ params, searchParams }: Props) {
  const { category } = await params;
  const sp = await (searchParams ??
    Promise.resolve({} as Record<string, string | string[] | undefined>));
  const page = parsePage(sp["page"]);
  const catParam = readQueryValue(sp["cat"]);
  const pageSize = 24;
  const currentCategory = await getShopCategory(category);

  if (!currentCategory) {
    notFound();
  }

  const allCategoryIdsSet = new Set<number>();
  allCategoryIdsSet.add(currentCategory.id);
  (currentCategory.subcategories || []).forEach((child) => {
    allCategoryIdsSet.add(child.id);
    (child.subcategories || []).forEach((grandchild) => {
      allCategoryIdsSet.add(grandchild.id);
    });
  });
  const allCategoryIds = Array.from(allCategoryIdsSet);
  const supabase = await getSupabaseServer();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  let categoryIdsForFetch = allCategoryIds;
  if (catParam && catParam !== "all") {
    const catId = Number(catParam);
    if (Number.isFinite(catId)) {
      if (catId === currentCategory.id) {
        categoryIdsForFetch = allCategoryIds;
      } else if (allCategoryIdsSet.has(catId)) {
        categoryIdsForFetch = [catId];
      }
    }
  }

  const [{ items, total }, userPoints, userItems] = await Promise.all([
    getCategoryItemsPaginated(categoryIdsForFetch, page, pageSize),
    getUserPoints(user?.id),
    getUserItems(user?.id),
  ]);

  return (
    <div className="container mx-auto">
      <DaumWebmasterHints
        title={`${currentCategory.name} - 포인트 상점`}
        content={currentCategory.description || `${currentCategory.name} 아이템을 확인하고 포인트로 구매하세요.`}
      />
      <Container className="mb-4">
        <ContainerHeader>
          <ContainerTitle>{currentCategory.name}</ContainerTitle>
        </ContainerHeader>
        {currentCategory.description && (
          <div className="px-4 py-3">
            <p className="text-gray-700 dark:text-gray-300 text-[13px]">
              {currentCategory.description}
            </p>
          </div>
        )}
      </Container>

      <CategoryFilter
        items={items as ShopItem[]}
        userItems={userItems}
        userPoints={userPoints}
        userId={user?.id}
        categories={(currentCategory.subcategories || []).map(({ id, name, display_order }) => ({ id, name, display_order: display_order ?? undefined }))}
        initialActiveCategory={catParam ?? "all"}
        currentPage={page}
        totalPages={Math.ceil(total / pageSize)}
        serverPaginated
      />
    </div>
  );
}
