import Link from 'next/link';
import type { Metadata } from 'next';
import BackButton from '@/shared/components/BackButton';

export const metadata: Metadata = {
  title: '개인정보처리방침 - SPORTS 커뮤니티',
  description: 'SPORTS 커뮤니티 개인정보처리방침',
};

export default function PrivacyPage() {
  return (
    <div className="flex flex-col justify-center items-center min-h-[calc(100vh-120px)] px-4">
      <div className="w-full max-w-2xl">
        {/* 상단 돌아가기 */}
        <BackButton />

        {/* 헤더 */}
        <div className="mb-6">
          <h1 className="text-2xl font-bold text-left mb-2 text-gray-900 dark:text-[#F0F0F0]">개인정보처리방침</h1>
          <p className="text-gray-700 dark:text-gray-300 text-left">회원의 개인정보 보호를 위한 방침을 안내합니다.</p>
          <p className="mt-2 text-xs text-gray-500 dark:text-gray-400">
            참고: 본 방침은 외부 정책 문서를 기반으로 작성되었습니다. 자세한 내용은
            {' '}<Link href="https://policy.op.gg/view/6593c6e4-d645-48a1-8513-1760bc9d6a5d" target="_blank" className="underline hover:text-gray-600 dark:hover:text-gray-300 transition-colors">OP.GG 개인정보처리방침</Link>을 참고하세요.
          </p>
        </div>

        {/* 본문 */}
        <div className="prose prose-slate max-w-none text-sm leading-6 text-gray-900 dark:text-[#F0F0F0]">
          <h2 className="text-gray-900 dark:text-[#F0F0F0]">1. 수집하는 개인정보 항목</h2>
          <p>서비스 제공을 위해 이메일, 비밀번호, 닉네임 등 최소한의 개인정보를 수집합니다.</p>

          <h2 className="text-gray-900 dark:text-[#F0F0F0]">2. 개인정보의 수집 및 이용 목적</h2>
          <ul>
            <li>회원 가입 및 본인 확인</li>
            <li>서비스 제공 및 이용자 식별</li>
            <li>고객 문의 응대 및 공지사항 전달</li>
          </ul>

          <h2 className="text-gray-900 dark:text-[#F0F0F0]">3. 개인정보의 보관 및 파기</h2>
          <p>관련 법령에 따라 일정 기간 보관 후 지체 없이 파기합니다.</p>

          <h2 className="text-gray-900 dark:text-[#F0F0F0]">4. 제3자 제공 및 처리 위탁</h2>
          <p>법령에 특별한 규정이 있는 경우를 제외하고 이용자의 동의 없이 제3자에게 제공하지 않습니다.</p>

          <h2 className="text-gray-900 dark:text-[#F0F0F0]">5. 이용자 권리</h2>
          <p>이용자는 자신의 개인정보에 대한 열람, 정정, 삭제를 요청할 수 있습니다.</p>

          <p className="mt-6 text-gray-500 dark:text-gray-400">시행일: 2025-01-01</p>
        </div>

        {/* 하단 링크 */}
        <div className="mt-8 flex justify-between items-center text-sm text-gray-700 dark:text-gray-300">
          <Link href="/terms" className="hover:text-gray-600 dark:hover:text-gray-300 hover:underline transition-colors">
            이용약관 보기
          </Link>
          <Link href="/signin" className="hover:text-gray-600 dark:hover:text-gray-300 hover:underline transition-colors">
            로그인으로 이동
          </Link>
        </div>
      </div>
    </div>
  );
}


