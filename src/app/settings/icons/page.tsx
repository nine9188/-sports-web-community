import { createClient } from '@/app/lib/supabase.server';
import { redirect } from 'next/navigation';
import { getUserIcons, getCurrentUserIcon } from './actions';
import { getLevelIconUrl } from '@/app/utils/level-icons';
import IconForm from './components/IconForm';

// 아이콘 아이템 타입
interface IconItem {
  id: number;
  name: string;
  image_url: string;
}

export const dynamic = 'force-dynamic';
export const revalidate = 0;

export default async function IconsPage() {
  // Supabase 클라이언트 생성
  const supabase = await createClient();
  
  // 사용자 인증 정보 확인 (getUser 메서드 사용)
  const { data: { user }, error } = await supabase.auth.getUser();
  
  // 로그인하지 않은 사용자는 로그인 페이지로 리다이렉트
  if (!user || error) {
    redirect('/auth/signin?callbackUrl=/settings/icons');
  }
  
  const userId = user.id;
  
  // 사용자 레벨 정보 가져오기
  const { data: profileData } = await supabase
    .from('profiles')
    .select('level')
    .eq('id', userId)
    .single();
    
  const userLevel = profileData?.level || 1;
  const levelIconUrl = getLevelIconUrl(userLevel);
  
  // 현재 사용자의 아이콘 정보 가져오기
  const currentIconResult = await getCurrentUserIcon(userId);
  const currentIconId = currentIconResult.success && currentIconResult.data ? currentIconResult.data.id : null;
  const currentIconUrl = currentIconResult.success && currentIconResult.data ? currentIconResult.data.image_url : null;
  const currentIconName = currentIconResult.success && currentIconResult.data ? currentIconResult.data.name : null;
  
  // 아이콘 ID가 null이면 레벨 아이콘 사용 중
  const isUsingLevelIcon = currentIconId === null;
  
  // 실제 표시할 아이콘 URL과 이름
  const displayIconUrl = isUsingLevelIcon ? levelIconUrl : currentIconUrl;
  const displayIconName = isUsingLevelIcon ? `레벨 ${userLevel} 기본 아이콘` : currentIconName;
  
  // 사용자가 보유한 아이콘 목록 가져오기
  const userIconsResult = await getUserIcons(userId);
  const userIcons: IconItem[] = userIconsResult.success ? userIconsResult.data || [] : [];
  
  return (
    <div className="mb-4 bg-white rounded-lg border overflow-hidden p-4">
      <h2 className="text-xl font-semibold mb-1">프로필 아이콘</h2>
      <p className="text-gray-500 text-sm mb-6">
        프로필에 표시되는 아이콘을 관리합니다.
      </p>
      
      <IconForm 
        userId={userId}
        currentIconId={currentIconId}
        userIcons={userIcons}
        levelIconUrl={levelIconUrl}
        userLevel={userLevel}
        displayIconUrl={displayIconUrl}
        displayIconName={displayIconName}
      />
    </div>
  );
} 