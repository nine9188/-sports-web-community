import { notFound } from 'next/navigation'
import { Metadata } from 'next'
import { getSupabaseServer } from '@/shared/lib/supabase/server'
import { 
  getShopCategory, 
  getCategoryItemsPaginated, 
  getUserPoints, 
  getUserItems 
} from '@/domains/shop/actions/actions'
import CategoryFilter from '@/domains/shop/components/CategoryFilter'
import { Pagination } from '@/shared/components/ui'
import { Container, ContainerHeader, ContainerTitle } from '@/shared/components/ui'

// 동적 렌더링 강제 설정 추가
export const dynamic = 'force-dynamic'

interface Props {
  params: Promise<{
    category: string
  }>
  searchParams?: Promise<Record<string, string | string[] | undefined>>
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { category } = await params
  const categoryData = await getShopCategory(category)
  
  if (!categoryData) {
    return {
      title: '상점',
      description: '상품을 구매하세요.',
    }
  }
  
  return {
    title: `${categoryData.name} | 상점`,
    description: `${categoryData.name} 아이템을 구매하세요.`,
  }
}

export default async function CategoryPage({ params, searchParams }: Props) {
  try {
    const { category } = await params
    const sp = await (searchParams ?? Promise.resolve({} as Record<string, string | string[] | undefined>))
    const pageParam = Array.isArray(sp['page']) ? sp['page'][0] : sp['page']
    const catParam = Array.isArray(sp['cat']) ? sp['cat'][0] : sp['cat']
    const page = Math.max(1, Number(pageParam ?? '1') || 1)
    const pageSize = 24
    
    // 현재 카테고리와 하위 카테고리 정보 가져오기
    const currentCategory = await getShopCategory(category)

    if (!currentCategory) {
      notFound()
    }

    // 모든 관련 카테고리 ID 수집 (자식 + 손자 포함)
    const allCategoryIdsSet = new Set<number>()
    allCategoryIdsSet.add(currentCategory.id)
    ;(currentCategory.subcategories || []).forEach((child) => {
      allCategoryIdsSet.add(child.id)
      ;(child.subcategories || []).forEach((grandchild) => {
        allCategoryIdsSet.add(grandchild.id)
      })
    })
    const allCategoryIds = Array.from(allCategoryIdsSet)

    // 사용자 정보 및 아이템 가져오기
    const supabase = await getSupabaseServer()
    const { data: { user } } = await supabase.auth.getUser()
    
    // catParam이 있으면 해당 카테고리로 범위 축소 (루트=자식 포함, 서브=해당 서브만)
    let categoryIdsForFetch = allCategoryIds
    if (catParam && catParam !== 'all') {
      const catId = Number(catParam)
      if (!Number.isNaN(catId)) {
        if (catId === currentCategory.id) {
          categoryIdsForFetch = allCategoryIds
        } else if (allCategoryIdsSet.has(catId)) {
          categoryIdsForFetch = [catId]
        }
      }
    }

    const { items, total } = await getCategoryItemsPaginated(categoryIdsForFetch, page, pageSize)
    
    // 사용자 포인트 및 보유 아이템 가져오기
    const userPoints = await getUserPoints(user?.id)
    const userItems = await getUserItems(user?.id)

    return (
      <div className="container mx-auto">
        
        <Container className="mb-4">
          <ContainerHeader>
            <ContainerTitle>{currentCategory.name}</ContainerTitle>
          </ContainerHeader>
          {currentCategory.description && (
            <div className="px-4 py-3">
              <p className="text-gray-700 dark:text-gray-300 text-sm">{currentCategory.description}</p>
            </div>
          )}
        </Container>

        <CategoryFilter 
          items={items}
          userItems={userItems}
          userPoints={userPoints}
          userId={user?.id}
          categories={currentCategory.subcategories || []}
          initialActiveCategory={catParam ?? 'all'}
        />

        {total > pageSize && (
          <Pagination
            currentPage={page}
            totalPages={Math.ceil(total / pageSize)}
            mode="url"
          />
        )}
      </div>
    )
  } catch (error) {
    console.error('Error:', error)
    return (
      <div className="container mx-auto">
        <Container>
          <div className="px-4 py-8 text-center">
            <p className="text-gray-700 dark:text-gray-300">오류가 발생했습니다.</p>
          </div>
        </Container>
      </div>
    )
  }
}
