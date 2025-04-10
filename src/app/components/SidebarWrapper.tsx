import Sidebar from './Sidebar';
// import { ReactNode } from 'react'; // ReactNode 임포트 제거
import BoardNavigation from './sidebar/BoardNavigation'; // BoardNavigation 임포트
// import BoardNavigationServer from './sidebar/BoardNavigationServer';

interface SidebarWrapperProps {
  isOpen: boolean;
  onClose: () => void;
  // children: ReactNode; // children prop 제거 또는 주석 처리
}

export default function SidebarWrapper({ isOpen, onClose }: SidebarWrapperProps) {
  return (
    <>
      {/* 클라이언트 컴포넌트인 Sidebar와 서버 컴포넌트인 BoardNavigationServer를 연결 */}
      <Sidebar isOpen={isOpen} onClose={onClose}>
        <BoardNavigation /> {/* BoardNavigation 직접 렌더링 */}
        {/* 서버 컴포넌트들 */}
        {/* <BoardNavigationServer /> */}
      </Sidebar>
    </>
  );
} 