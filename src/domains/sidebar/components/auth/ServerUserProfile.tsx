import { getSidebarUserProfile } from '../../actions/userProfile';
import ClientUserProfile from './ClientUserProfile';

// 로그인하지 않은 사용자를 위한 UI
function GuestUserProfile() {
  return (
    <div className="text-center py-4">
      <p className="text-sm text-muted-foreground">로그인이 필요합니다</p>
    </div>
  );
}

// 서버 컴포넌트 - 데이터를 미리 로드하고 클라이언트 컴포넌트에 전달
export default async function ServerUserProfile() {
  // 서버에서 사용자 프로필 데이터 로드
  const profileData = await getSidebarUserProfile();
  
  // 로그인하지 않은 경우
  if (!profileData) {
    return <GuestUserProfile />;
  }
  
  // 로그인한 경우 - 클라이언트 컴포넌트에 데이터 전달
  return <ClientUserProfile profileData={profileData} />;
} 