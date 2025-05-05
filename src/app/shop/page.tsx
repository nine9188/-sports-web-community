import { Metadata } from 'next';
import { getShopCategories, getUserPoints } from '@/domains/shop/actions/actions';
import ShopCategoryCard from '@/domains/shop/components/ShopCategoryCard';
import { createClient } from '@/shared/api/supabaseServer';

// 동적 렌더링 강제 설정 추가
export const dynamic = 'force-dynamic';

export const metadata: Metadata = {
  title: '상점 | 내 서비스',
  description: '다양한 아이템을 구매하세요.',
};

export default async function ShopPage() {
  const supabase = await createClient();
  
  // 활성화된 카테고리 목록 가져오기
  const categories = await getShopCategories();
  
  // 사용자 정보 가져오기
  const { data: { user }, error } = await supabase.auth.getUser();
  
  // 사용자 포인트 가져오기
  const userPoints = user && !error ? await getUserPoints(user.id) : 0;

  return (
    <div className="container mx-auto py-8 px-4">
      <h1 className="text-3xl font-bold mb-6">상점</h1>
      
      {/* 포인트 표시 */}
      {user && !error && (
        <div className="bg-white shadow-sm rounded-lg p-4 mb-6 border border-gray-100">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-sm font-medium text-gray-500">보유 포인트</h2>
              <p className="text-2xl font-bold text-blue-600">{userPoints} P</p>
            </div>
            <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center">
              <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-6 h-6 text-blue-600">
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 6v12m-3-2.818.879.659c1.171.879 3.07.879 4.242 0 1.172-.879 1.172-2.303 0-3.182C13.536 12.219 12.768 12 12 12c-.725 0-1.45-.22-2.003-.659-1.106-.879-1.106-2.303 0-3.182s2.9-.879 4.006 0l.415.33M21 12a9 9 0 1 1-18 0 9 9 0 0 1 18 0Z" />
              </svg>
            </div>
          </div>
        </div>
      )}
      
      {/* 카테고리 설명 */}
      <p className="text-gray-600 mb-8">
        포인트를 사용하여 다양한 아이템을 구매하고 프로필을 꾸며보세요.
      </p>
      
      {/* 카테고리 그리드 */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {categories?.map(category => (
          <ShopCategoryCard key={category.id} category={category} />
        ))}
      </div>
      
      {/* 카테고리가 없을 경우 */}
      {(!categories || categories.length === 0) && (
        <div className="text-center py-12 bg-gray-50 rounded-lg">
          <p className="text-gray-500">현재 이용 가능한 상점 카테고리가 없습니다.</p>
        </div>
      )}
      
      {/* 로그인 안 된 경우 안내 */}
      {(!user || error) && (
        <div className="mt-8 p-4 bg-blue-50 rounded-lg text-center">
          <p className="text-blue-700">
            아이템을 구매하고 사용하려면 로그인이 필요합니다.
          </p>
          <a href="/login" className="mt-2 inline-block px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700">
            로그인하기
          </a>
        </div>
      )}
    </div>
  );
} 