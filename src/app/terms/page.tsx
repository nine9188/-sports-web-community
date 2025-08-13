import Link from 'next/link';
import type { Metadata } from 'next';
import BackButton from '@/shared/components/BackButton';

export const metadata: Metadata = {
  title: '이용약관 - SPORTS 커뮤니티',
  description: 'SPORTS 커뮤니티 서비스 이용약관',
};

export default function TermsPage() {
  return (
    <div className="flex flex-col justify-center items-center min-h-[calc(100vh-120px)] px-4">
      <div className="w-full max-w-2xl">
        {/* 상단 돌아가기 */}
        <BackButton />

        {/* 헤더 */}
        <div className="mb-6">
          <h1 className="text-2xl font-bold text-left mb-2">이용약관</h1>
          <p className="text-gray-600 text-left">SPORTS 커뮤니티 서비스 이용에 대한 약관입니다.</p>
          <p className="mt-2 text-xs text-gray-500">
            참고: 본 약관은 외부 정책 문서를 기반으로 작성되었습니다. 자세한 내용은
            {' '}<Link href="https://policy.op.gg/view/f3c2b2ea-f9f4-4d5c-bcf6-4cb799eed929" target="_blank" className="underline hover:text-slate-800">OP.GG 통합 서비스 이용약관</Link>을 참고하세요.
          </p>
        </div>

        {/* 본문 */}
        <div className="prose prose-slate max-w-none text-sm leading-6">
          <h2>제1조 목적</h2>
          <p>
            본 약관은 SPORTS 커뮤니티(이하 “서비스”)의 이용과 관련하여 회사와 이용자 간의 권리, 의무 및
            책임사항, 기타 필요한 사항을 규정함을 목적으로 합니다.
          </p>

          <h2>제2조 용어의 정의</h2>
          <p>
            본 약관에서 사용하는 용어의 정의는 관련 법령 및 서비스 안내에 따르며, 그 외 명시되지 않은 사항은 일반 관례에
            따릅니다.
          </p>

          <h2>제3조 약관의 게시와 개정</h2>
          <ol>
            <li>회사는 본 약관의 내용을 이용자가 쉽게 알 수 있도록 서비스 화면에 게시합니다.</li>
            <li>회사는 관련 법령을 위배하지 않는 범위에서 약관을 개정할 수 있습니다.</li>
            <li>약관이 개정되는 경우 적용일자 및 개정사유를 명시하여 사전에 공지합니다.</li>
          </ol>

          <h2>제4조 서비스의 제공</h2>
          <p>
            회사는 서비스의 안정적인 제공을 위해 최선을 다하며, 서비스의 내용, 운영시간, 제공 방식을 변경할 수 있습니다.
          </p>

          <h2>제5조 이용자의 의무</h2>
          <ol>
            <li>이용자는 관계 법령, 약관, 서비스 공지사항을 준수하여야 합니다.</li>
            <li>타인의 권리를 침해하거나 서비스 운영을 방해하는 행위를 해서는 안 됩니다.</li>
          </ol>

          <h2>제6조 게시물의 관리</h2>
          <p>
            회사는 관련 법령을 위반하거나 공서양속에 반하는 게시물이 확인될 경우 사전 통지 없이 삭제 또는 접근 제한을 할 수 있습니다.
          </p>

          <h2>제7조 책임 제한</h2>
          <p>
            회사는 천재지변, 불가항력, 이용자 귀책 사유 등으로 발생한 손해에 대하여 책임을 지지 않습니다.
          </p>

          <h2>제8조 준거법 및 관할</h2>
          <p>본 약관은 대한민국 법령에 따르며, 분쟁이 발생할 경우 관할 법원은 관련 법령에 따릅니다.</p>

          <p className="mt-6 text-gray-500">시행일: 2025-01-01</p>
        </div>

        {/* 하단 링크 */}
        <div className="mt-8 flex justify-between items-center text-sm text-gray-600">
          <Link href="/privacy" className="hover:text-slate-800 hover:underline">
            개인정보처리방침 보기
          </Link>
          <Link href="/signin" className="hover:text-slate-800 hover:underline">
            로그인으로 이동
          </Link>
        </div>
      </div>
    </div>
  );
}


