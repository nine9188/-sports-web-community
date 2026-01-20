'use client';

import { useState } from 'react';
import { User, LogOut, ChevronRight, ChevronDown, PenSquare, MessageCircle } from 'lucide-react';

/**
 * 프로필 드롭다운 테스트 페이지
 * 헤더 버튼은 유지, 드롭다운만 페이스북 스타일로 변경
 */
export default function DropdownTestPage() {
  const [isOldOpen, setIsOldOpen] = useState(true);
  const [isNewOpen, setIsNewOpen] = useState(true);

  // 샘플 사용자 데이터
  const userData = {
    nickname: '홍길동',
    level: 5,
    avatarUrl: null,
  };

  return (
    <div className="min-h-screen p-8 bg-[#F5F5F5] dark:bg-[#121212]">
      <h1 className="text-2xl font-bold mb-2 text-gray-900 dark:text-[#F0F0F0]">
        프로필 드롭다운 테스트
      </h1>
      <p className="text-sm text-gray-500 dark:text-gray-400 mb-8">
        헤더 버튼은 유지, 드롭다운 메뉴만 변경
      </p>

      {/* 비교 섹션 */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        {/* 기존 디자인 */}
        <div className="bg-white dark:bg-[#1D1D1D] rounded-lg p-6 border border-black/7 dark:border-white/10">
          <h2 className="text-lg font-semibold mb-4 text-gray-900 dark:text-[#F0F0F0]">
            기존 디자인
          </h2>

          {/* 헤더 버튼 (아이콘 20x20 고정) */}
          <div className="bg-[#262626] p-4 rounded-lg mb-4 flex justify-end">
            <button
              onClick={() => setIsOldOpen(!isOldOpen)}
              className="flex items-center space-x-1 px-3 py-2 rounded hover:bg-[#333333]"
            >
              <div className="w-5 h-5 rounded-full overflow-hidden bg-gray-400 flex items-center justify-center">
                <User className="w-5 h-5 text-white" />
              </div>
              <span className="text-sm text-white">{userData.nickname}</span>
              <ChevronDown className="w-3 h-3 text-white" />
            </button>
          </div>

          {/* 기존 드롭다운 */}
          {isOldOpen && (
            <div className="w-48 bg-white dark:bg-[#1D1D1D] shadow-lg border border-black/7 dark:border-white/10 rounded-lg overflow-hidden">
              <a className="flex items-center px-4 py-2.5 text-sm text-gray-900 dark:text-[#F0F0F0] hover:bg-[#EAEAEA] dark:hover:bg-[#333333] border-b border-black/5 dark:border-white/10">
                <PenSquare className="h-4 w-4 mr-2 text-gray-500" />
                글쓰기
              </a>
              <a className="flex items-center px-4 py-2.5 text-sm text-gray-900 dark:text-[#F0F0F0] hover:bg-[#EAEAEA] dark:hover:bg-[#333333] border-b border-black/5 dark:border-white/10">
                <User className="h-4 w-4 mr-2 text-gray-500" />
                프로필 설정
              </a>
              <button className="flex items-center w-full px-4 py-2.5 text-sm text-gray-900 dark:text-[#F0F0F0] hover:bg-[#EAEAEA] dark:hover:bg-[#333333]">
                <LogOut className="h-4 w-4 mr-2 text-gray-500" />
                로그아웃
              </button>
            </div>
          )}
        </div>

        {/* 새로운 디자인 */}
        <div className="bg-white dark:bg-[#1D1D1D] rounded-lg p-6 border border-black/7 dark:border-white/10">
          <h2 className="text-lg font-semibold mb-4 text-gray-900 dark:text-[#F0F0F0]">
            새로운 디자인
          </h2>

          {/* 헤더 버튼 (동일 - 아이콘 20x20 고정) */}
          <div className="bg-[#262626] p-4 rounded-lg mb-4 flex justify-end">
            <button
              onClick={() => setIsNewOpen(!isNewOpen)}
              className="flex items-center space-x-1 px-3 py-2 rounded hover:bg-[#333333]"
            >
              <div className="w-5 h-5 rounded-full overflow-hidden bg-gray-400 flex items-center justify-center">
                <User className="w-5 h-5 text-white" />
              </div>
              <span className="text-sm text-white">{userData.nickname}</span>
              <ChevronDown className="w-3 h-3 text-white" />
            </button>
          </div>

          {/* 새로운 드롭다운 - 상단에 프로필 추가 */}
          {isNewOpen && (
            <div className="w-64 bg-white dark:bg-[#1D1D1D] shadow-xl border border-black/7 dark:border-white/10 rounded-xl overflow-hidden">
              {/* 프로필 헤더 섹션 - 아이콘 닉네임 레벨 한 줄 */}
              <div className="px-4 py-3 border-b border-black/5 dark:border-white/10">
                <div className="flex items-center gap-2">
                  <div className="w-5 h-5 rounded-full overflow-hidden bg-gray-300 dark:bg-gray-600 flex items-center justify-center">
                    <User className="w-5 h-5 text-gray-600 dark:text-gray-300" />
                  </div>
                  <span className="font-semibold text-sm text-gray-900 dark:text-[#F0F0F0]">
                    {userData.nickname}
                  </span>
                  <span className="text-xs text-gray-500 dark:text-gray-400">
                    Lv.{userData.level}
                  </span>
                </div>
              </div>

              {/* 메뉴 항목들 */}
              <div>
                <DropdownMenuItem
                  icon={<PenSquare className="w-5 h-5" />}
                  label="글쓰기"
                />
                <DropdownMenuItem
                  icon={<User className="w-5 h-5" />}
                  label="프로필 설정"
                />
                <DropdownMenuItem
                  icon={<MessageCircle className="w-5 h-5" />}
                  label="문의하기"
                />
                <DropdownMenuItem
                  icon={<LogOut className="w-5 h-5" />}
                  label="로그아웃"
                />
              </div>
            </div>
          )}
        </div>
      </div>

      {/* 참고 이미지 */}
      <div className="mt-8 p-4 bg-white dark:bg-[#1D1D1D] rounded-lg border border-black/7 dark:border-white/10">
        <h3 className="text-sm font-medium mb-2 text-gray-900 dark:text-[#F0F0F0]">참고 이미지</h3>
        <img
          src="/test/maxresdefault.jpg"
          alt="참고 이미지"
          className="max-w-lg rounded-lg border border-black/10 dark:border-white/10"
        />
      </div>
    </div>
  );
}

/**
 * 드롭다운 메뉴 아이템 컴포넌트
 */
function DropdownMenuItem({
  icon,
  label,
}: {
  icon: React.ReactNode;
  label: string;
}) {
  return (
    <button className="flex items-center w-full px-4 py-2.5 hover:bg-[#EAEAEA] dark:hover:bg-[#333333] transition-colors">
      {/* 원형 아이콘 배경 */}
      <div className="w-9 h-9 rounded-full bg-gray-100 dark:bg-[#333333] flex items-center justify-center text-gray-700 dark:text-gray-300">
        {icon}
      </div>
      {/* 라벨 */}
      <span className="flex-1 ml-3 text-left text-sm font-medium text-gray-900 dark:text-[#F0F0F0]">
        {label}
      </span>
      {/* 오른쪽 화살표 */}
      <ChevronRight className="w-5 h-5 text-gray-400" />
    </button>
  );
}
