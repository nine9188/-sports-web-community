import { getHeaderUserData } from '../actions';
import UserProfileClient from './UserProfileClient';

/**
 * 헤더용 서버 사용자 프로필 컴포넌트
 * 서버에서 사용자 데이터를 가져와서 클라이언트 컴포넌트에 전달
 */
export default async function ServerUserProfile() {
  const userData = await getHeaderUserData();
  
  return <UserProfileClient userData={userData} />;
} 