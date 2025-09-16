import { notFound } from 'next/navigation'
import { Metadata } from 'next'
import { createClient } from '@/shared/api/supabaseServer'
import { 
  getShopCategory, 
  getCategoryItems, 
  getUserPoints, 
  getUserItems 
} from '@/domains/shop/actions/actions'
import CategoryFilter from '@/domains/shop/components/CategoryFilter'

// 동적 렌더링 강제 설정 추가
export const dynamic = 'force-dynamic'

interface Props {
  params: Promise<{
    category: string
  }>
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

export default async function CategoryPage({ params }: Props) {
  try {
    const { category } = await params
    
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
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    
    // 모든 아이템 가져오기
    const items = await getCategoryItems(allCategoryIds)
    
    // 사용자 포인트 및 보유 아이템 가져오기
    const userPoints = await getUserPoints(user?.id)
    const userItems = await getUserItems(user?.id)

    return (
      <div className="container mx-auto">
        
        <div className="mb-4 rounded-md border border-gray-200 p-4">
          <h1 className="text-2xl font-bold">{currentCategory.name}</h1>
          {currentCategory.description && (
            <p className="text-gray-600 mt-2">{currentCategory.description}</p>
          )}
        </div>

        <CategoryFilter 
          items={items}
          userItems={userItems}
          userPoints={userPoints}
          userId={user?.id}
          categories={currentCategory.subcategories || []}
        />
      </div>
    )
  } catch (error) {
    console.error('Error:', error)
    return <div>오류가 발생했습니다.</div>
  }
}
