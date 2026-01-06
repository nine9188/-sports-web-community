import { redirect } from 'next/navigation';

export default function PhoneSettingsPage() {
  // 전화번호 인증은 기본정보 페이지에 통합되었습니다
  redirect('/settings/profile');
}
