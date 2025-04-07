import { createClient } from '@/app/lib/supabase-server';
import ShopItemManagement from './components/ShopItemManagement';
import { notFound, redirect } from 'next/navigation';

export const revalidate = 0;
export const dynamic = 'force-dynamic';

export default async function ShopAdminPage() {
  try {
    // 관리자 인증 체크
    const supabase = await createClient();

    const { data: { session } } = await supabase.auth.getSession();
    
    if (!session) {
      redirect('/signin');
    }

    // 관리자 권한 체크
    const { data: profile } = await supabase
      .from('profiles')
      .select('is_admin')
      .eq('id', session.user.id)
      .single();

    if (!profile?.is_admin) {
      redirect('/');
    }

    // 팀 데이터 가져오기
    const { data: teams, error: teamsError } = await supabase
      .from('teams')
      .select('id, name, logo')
      .not('logo', 'is', null)
      .order('name');

    if (teamsError) {
      console.error('팀 데이터 로딩 오류:', teamsError);
      return notFound();
    }

    // 리그 데이터 가져오기
    const { data: leagues, error: leaguesError } = await supabase
      .from('leagues')
      .select('id, name, logo')
      .not('logo', 'is', null)
      .order('name');

    if (leaguesError) {
      console.error('리그 데이터 로딩 오류:', leaguesError);
      return notFound();
    }

    // 스토리지의 이미지 목록 가져오기
    const { data: storageFiles, error: storageError } = await supabase
      .storage
      .from('profile-icons')
      .list();

    if (storageError) {
      console.error('스토리지 이미지 로딩 오류:', storageError);
    }

    // 스토리지 이미지 URL 생성
    const storageImages = storageFiles?.map((file: { name: string }) => ({
      name: file.name,
      url: supabase.storage.from('profile-icons').getPublicUrl(file.name).data.publicUrl
    })) || [];

    // shop_items 데이터 가져오기
    const { data: shopItems, error: shopItemsError } = await supabase
      .from('shop_items')
      .select('*')
      .order('created_at', { ascending: false });

    if (shopItemsError) {
      console.error('샵 아이템 데이터 로딩 오류:', shopItemsError);
      return notFound();
    }

    // 카테고리 데이터 가져오기
    const { data: categories } = await supabase
      .from('shop_categories')
      .select('*')
      .order('display_order', { ascending: true });

    return (
      <div className="space-y-8">
        <div className="flex items-center justify-between">
          <h1 className="text-2xl font-bold">아이콘 상점 관리</h1>
        </div>
        
        <ShopItemManagement 
          teams={teams || []} 
          leagues={leagues || []}
          storageImages={storageImages}
          shopItems={shopItems || []} 
          categories={categories || []}
        />
      </div>
    );
  } catch (error) {
    console.error('샵 관리 페이지 로딩 오류:', error);
    return notFound();
  }
} 