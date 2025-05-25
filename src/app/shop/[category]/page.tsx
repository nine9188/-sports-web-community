import { notFound } from 'next/navigation'
import Link from 'next/link'
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

    // 모든 관련 카테고리 ID 수집
    const allCategoryIds = [
      currentCategory.id,
      ...(currentCategory.subcategories?.map((sub) => sub.id) || [])
    ]

    // 사용자 정보 및 아이템 가져오기
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    
    // 모든 아이템 가져오기
    const items = await getCategoryItems(allCategoryIds)
    
    // 사용자 포인트 및 보유 아이템 가져오기
    const userPoints = await getUserPoints(user?.id)
    const userItems = await getUserItems(user?.id)

    return (
      <div className="container mx-auto py-6 px-4">
        <div className="mb-6">
          <Link 
            href="/shop" 
            className="inline-flex items-center text-blue-600 hover:text-blue-800"
          >
            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-4 h-4 mr-1">
              <path strokeLinecap="round" strokeLinejoin="round" d="M10.5 19.5 3 12m0 0 7.5-7.5M3 12h18" />
            </svg>
            상점으로 돌아가기
          </Link>
        </div>
        
        <div className="mb-6">
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
          categories={[currentCategory, ...(currentCategory.subcategories || [])]}
        />
      </div>
    )
  } catch (error) {
    console.error('Error:', error)
    return <div>오류가 발생했습니다.</div>
  }
}
