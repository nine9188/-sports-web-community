import { notFound } from 'next/navigation';
import Link from 'next/link';
import CategoryFilter from './CategoryFilter';
import { createClient } from '@/app/lib/supabase.server';
import { SupabaseClient } from '@supabase/supabase-js';

// 동적 렌더링 강제 설정 추가
export const dynamic = 'force-dynamic';

export interface ShopCategory {
  id: number;
  slug: string;
  name: string;
  description: string | null;
  image_url: string | null;
  subcategories?: ShopCategory[];
}

export interface ShopItem {
  id: number;
  category_id: number;
  name: string;
  description: string | null;
  image_url: string;
  price: number;
  is_default: boolean;
  is_active: boolean;
  category?: {
    name: string;
  };
}

export interface UserItem {
  item_id: number;
}

interface Props {
  params: Promise<{
    category: string;
  }>;
}

export async function generateMetadata({ params }: Props) {
  const { category } = await params;
  const supabase = await createClient();
  
  const { data: categoryData } = await supabase
    .from('shop_categories')
    .select('name')
    .eq('slug', category)
    .single();
  
  if (!categoryData) {
    return {
      title: '상점',
      description: '상품을 구매하세요.',
    };
  }
  
  return {
    title: `${categoryData.name} | 상점`,
    description: `${categoryData.name} 아이템을 구매하세요.`,
  };
}

const getUserPoints = async (supabase: SupabaseClient, userId: string): Promise<number> => {
  try {
    const { data: userData, error } = await supabase
      .from('profiles')
      .select('points')
      .eq('id', userId)
      .single();
      
    if (error) {
      console.error('Error fetching user points:', error);
      return 0;
    }
    
    return userData?.points || 0;
  } catch (error) {
    console.error('Error in getUserPoints:', error);
    return 0;
  }
};

const getUserItems = async (supabase: SupabaseClient, userId: string | undefined): Promise<number[]> => {
  if (!userId) return [];
  
  const { data } = await supabase
    .from('user_items')
    .select('item_id')
    .eq('user_id', userId);
    
  return data?.map((item: UserItem) => item.item_id) || [];
};

export default async function CategoryPage({ params }: Props) {
  try {
    const { category } = await params;
    const supabase = await createClient();
    
    // 현재 카테고리와 하위 카테고리 정보 가져오기
    const { data: currentCategory } = await supabase
      .from('shop_categories')
      .select(`
        *,
        subcategories:shop_categories(
          id,
          name,
          slug,
          description
        )
      `)
      .eq('slug', category)
      .eq('is_active', true)
      .single();

    if (!currentCategory) {
      notFound();
    }

    // 모든 관련 카테고리 ID 수집
    const allCategoryIds = [
      currentCategory.id,
      ...(currentCategory.subcategories?.map((sub: ShopCategory) => sub.id) || [])
    ];

    // 모든 아이템 가져오기
    const { data: items } = await supabase
      .from('shop_items')
      .select('*, category:shop_categories(name)')
      .in('category_id', allCategoryIds)
      .eq('is_active', true)
      .order('price', { ascending: true });

    // 사용자 정보 가져오기 (getUser 사용 - 보안 강화)
    const { data: { user }, error } = await supabase.auth.getUser();
    const userPoints = user?.id && !error ? await getUserPoints(supabase, user.id) : 0;
    const userItems = await getUserItems(supabase, user?.id);

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
          items={items || []}
          userItems={userItems}
          userPoints={userPoints}
          userId={user?.id}
          categories={[currentCategory, ...(currentCategory.subcategories || [])]}
        />
      </div>
    );
  } catch (error) {
    console.error('Error:', error);
    return <div>오류가 발생했습니다.</div>;
  }
} 