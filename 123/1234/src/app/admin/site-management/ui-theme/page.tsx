import UIThemeSettings from './UIThemeSettingsPage';

export const metadata = {
  title: 'UI 테마 설정 | 관리자',
  description: 'UI 스타일 (테두리 라운드 등) 전역 설정',
};

export default function UIThemePage() {
  return <UIThemeSettings />;
}
