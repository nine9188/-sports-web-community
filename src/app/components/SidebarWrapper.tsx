import Sidebar from './Sidebar';
import BoardNavigationServer from './sidebar/BoardNavigationServer';

interface SidebarWrapperProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function SidebarWrapper({ isOpen, onClose }: SidebarWrapperProps) {
  return (
    <>
      {/* 클라이언트 컴포넌트인 Sidebar와 서버 컴포넌트인 BoardNavigationServer를 연결 */}
      <Sidebar isOpen={isOpen} onClose={onClose}>
        {/* 서버 컴포넌트들 */}
        <BoardNavigationServer />
      </Sidebar>
    </>
  );
} 