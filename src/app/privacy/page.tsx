import Link from 'next/link';
import BackButton from '@/shared/components/BackButton';
import { buildMetadata } from '@/shared/utils/metadataNew';

export async function generateMetadata() {
  return buildMetadata({
    title: '개인정보처리방침',
    description: '4590 Football 개인정보처리방침을 확인하세요.',
    path: '/privacy',
    noindex: true,
  });
}

export default function PrivacyPage() {
  return (
    <div className="flex flex-col justify-center items-center min-h-[calc(100vh-120px)] px-4 py-8">
      <div className="w-full max-w-3xl">
        {/* 상단 돌아가기 */}
        <BackButton />

        {/* 헤더 */}
        <div className="mb-8">
          <h1 className="text-2xl font-bold text-left mb-2 text-gray-900 dark:text-[#F0F0F0]">개인정보처리방침</h1>
          <p className="text-gray-700 dark:text-gray-300 text-left">
            4590 Football은 이용자의 개인정보를 중요시하며, 개인정보보호법 등 관련 법령을 준수합니다.
          </p>
        </div>

        {/* 본문 */}
        <div className="prose prose-slate dark:prose-invert max-w-none text-sm leading-7 space-y-6
          prose-headings:text-gray-900 dark:prose-headings:text-[#F0F0F0]
          prose-p:text-gray-700 dark:prose-p:text-gray-300
          prose-li:text-gray-700 dark:prose-li:text-gray-300
          prose-strong:text-gray-900 dark:prose-strong:text-[#F0F0F0]
          prose-a:text-blue-600 dark:prose-a:text-blue-400">

          {/* 제1조 */}
          <section>
            <h2 className="text-lg font-semibold text-gray-900 dark:text-[#F0F0F0] mt-0">제1조 (개인정보의 수집 항목)</h2>
            <p>4590 Football(이하 &quot;서비스&quot;)은 회원가입, 서비스 제공을 위해 다음과 같은 개인정보를 수집합니다.</p>

            <h3 className="text-base font-medium text-gray-900 dark:text-[#F0F0F0] mt-4">1. 필수 수집 항목</h3>
            <ul className="list-disc pl-5 space-y-1">
              <li><strong>이메일 회원가입:</strong> 이메일 주소, 비밀번호, 닉네임</li>
              <li><strong>소셜 로그인(카카오):</strong> 소셜 계정 식별자, 이메일 주소(선택 제공 시), 닉네임</li>
            </ul>

            <h3 className="text-base font-medium text-gray-900 dark:text-[#F0F0F0] mt-4">2. 자동 수집 항목</h3>
            <ul className="list-disc pl-5 space-y-1">
              <li>접속 IP 주소, 접속 일시</li>
              <li>브라우저 종류 및 운영체제 정보</li>
              <li>서비스 이용 기록 (게시글, 댓글, 좋아요 등)</li>
            </ul>

            <h3 className="text-base font-medium text-gray-900 dark:text-[#F0F0F0] mt-4">3. 선택 수집 항목</h3>
            <ul className="list-disc pl-5 space-y-1">
              <li>프로필 이미지</li>
              <li>자기소개</li>
            </ul>
          </section>

          {/* 제2조 */}
          <section>
            <h2 className="text-lg font-semibold text-gray-900 dark:text-[#F0F0F0]">제2조 (개인정보의 수집 및 이용 목적)</h2>
            <p>수집한 개인정보는 다음의 목적을 위해 이용됩니다.</p>
            <ul className="list-disc pl-5 space-y-2">
              <li><strong>회원 관리:</strong> 회원 가입, 본인 확인, 회원 식별, 부정 이용 방지</li>
              <li><strong>서비스 제공:</strong> 게시판 서비스, 라이브스코어 제공, 포인트/레벨 시스템 운영</li>
              <li><strong>서비스 개선:</strong> 서비스 이용 통계 분석, 신규 서비스 개발</li>
              <li><strong>고객 지원:</strong> 문의 응대, 공지사항 전달, 분쟁 조정</li>
              <li><strong>법적 의무 이행:</strong> 관련 법령에 따른 의무 준수</li>
            </ul>
          </section>

          {/* 제3조 */}
          <section>
            <h2 className="text-lg font-semibold text-gray-900 dark:text-[#F0F0F0]">제3조 (개인정보의 보유 및 이용 기간)</h2>
            <p>개인정보는 수집 및 이용 목적이 달성된 후에는 지체 없이 파기합니다. 다만, 다음의 경우에는 명시된 기간 동안 보관합니다.</p>

            <h3 className="text-base font-medium text-gray-900 dark:text-[#F0F0F0] mt-4">1. 회원 탈퇴 시</h3>
            <ul className="list-disc pl-5 space-y-1">
              <li>탈퇴 즉시 개인정보 파기 (단, 관련 법령에 따른 보관 의무가 있는 경우 제외)</li>
            </ul>

            <h3 className="text-base font-medium text-gray-900 dark:text-[#F0F0F0] mt-4">2. 관련 법령에 따른 보관</h3>
            <ul className="list-disc pl-5 space-y-1">
              <li><strong>로그인 기록:</strong> 3개월 (통신비밀보호법)</li>
              <li><strong>서비스 이용 기록:</strong> 3개월 (통신비밀보호법)</li>
              <li><strong>표시/광고에 관한 기록:</strong> 6개월 (전자상거래법)</li>
              <li><strong>계약 또는 청약철회 기록:</strong> 5년 (전자상거래법)</li>
              <li><strong>소비자 불만/분쟁 처리 기록:</strong> 3년 (전자상거래법)</li>
            </ul>
          </section>

          {/* 제4조 */}
          <section>
            <h2 className="text-lg font-semibold text-gray-900 dark:text-[#F0F0F0]">제4조 (개인정보의 제3자 제공)</h2>
            <p>서비스는 원칙적으로 이용자의 개인정보를 외부에 제공하지 않습니다. 다만, 다음의 경우에는 예외로 합니다.</p>
            <ul className="list-disc pl-5 space-y-2">
              <li>이용자가 사전에 동의한 경우</li>
              <li>법령의 규정에 의하거나, 수사 목적으로 법령에 정해진 절차와 방법에 따라 수사기관의 요구가 있는 경우</li>
            </ul>
          </section>

          {/* 제5조 */}
          <section>
            <h2 className="text-lg font-semibold text-gray-900 dark:text-[#F0F0F0]">제5조 (개인정보 처리의 위탁)</h2>
            <p>서비스는 원활한 서비스 제공을 위해 다음과 같이 개인정보 처리 업무를 위탁하고 있습니다.</p>

            <div className="overflow-x-auto mt-4">
              <table className="min-w-full border border-black/10 dark:border-white/10 text-sm">
                <thead>
                  <tr className="bg-gray-100 dark:bg-[#2D2D2D]">
                    <th className="border border-black/10 dark:border-white/10 px-4 py-2 text-left text-gray-900 dark:text-[#F0F0F0]">수탁업체</th>
                    <th className="border border-black/10 dark:border-white/10 px-4 py-2 text-left text-gray-900 dark:text-[#F0F0F0]">위탁 업무</th>
                  </tr>
                </thead>
                <tbody>
                  <tr className="bg-white dark:bg-[#1D1D1D]">
                    <td className="border border-black/10 dark:border-white/10 px-4 py-2 text-gray-900 dark:text-gray-300">Supabase Inc.</td>
                    <td className="border border-black/10 dark:border-white/10 px-4 py-2 text-gray-900 dark:text-gray-300">데이터베이스 호스팅, 인증 서비스</td>
                  </tr>
                  <tr className="bg-white dark:bg-[#1D1D1D]">
                    <td className="border border-black/10 dark:border-white/10 px-4 py-2 text-gray-900 dark:text-gray-300">Vercel Inc.</td>
                    <td className="border border-black/10 dark:border-white/10 px-4 py-2 text-gray-900 dark:text-gray-300">웹 호스팅 서비스</td>
                  </tr>
                </tbody>
              </table>
            </div>
          </section>

          {/* 제6조 */}
          <section>
            <h2 className="text-lg font-semibold text-gray-900 dark:text-[#F0F0F0]">제6조 (이용자의 권리와 행사 방법)</h2>
            <p>이용자는 언제든지 다음과 같은 개인정보 보호 관련 권리를 행사할 수 있습니다.</p>
            <ul className="list-disc pl-5 space-y-2">
              <li><strong>개인정보 열람 요구:</strong> 설정 &gt; 프로필에서 본인의 개인정보 확인</li>
              <li><strong>개인정보 정정 요구:</strong> 설정 &gt; 프로필에서 정보 수정</li>
              <li><strong>개인정보 삭제 요구:</strong> 설정 &gt; 계정 삭제를 통한 탈퇴</li>
              <li><strong>개인정보 처리 정지 요구:</strong> 운영자에게 이메일로 요청</li>
            </ul>
            <p className="mt-4">
              권리 행사는 서비스 내 설정 메뉴를 통해 직접 하거나, 서비스 내 문의하기를 통해 요청할 수 있습니다.
            </p>
          </section>

          {/* 제7조 */}
          <section>
            <h2 className="text-lg font-semibold text-gray-900 dark:text-[#F0F0F0]">제7조 (개인정보의 파기)</h2>
            <p>개인정보는 보유 기간이 경과하거나 처리 목적이 달성된 경우 다음의 방법으로 파기합니다.</p>
            <ul className="list-disc pl-5 space-y-2">
              <li><strong>전자적 파일:</strong> 복구 불가능한 방법으로 영구 삭제</li>
              <li><strong>종이 문서:</strong> 분쇄기로 분쇄하거나 소각</li>
            </ul>
          </section>

          {/* 제8조 */}
          <section>
            <h2 className="text-lg font-semibold text-gray-900 dark:text-[#F0F0F0]">제8조 (개인정보의 안전성 확보 조치)</h2>
            <p>서비스는 개인정보의 안전성 확보를 위해 다음과 같은 조치를 취하고 있습니다.</p>
            <ul className="list-disc pl-5 space-y-2">
              <li><strong>비밀번호 암호화:</strong> 비밀번호는 단방향 암호화하여 저장</li>
              <li><strong>데이터 암호화:</strong> SSL/TLS를 통한 데이터 전송 암호화</li>
              <li><strong>접근 제한:</strong> 개인정보에 대한 접근 권한 최소화</li>
              <li><strong>보안 시스템:</strong> 해킹 등에 대비한 보안 시스템 운영</li>
              <li><strong>Row Level Security:</strong> 데이터베이스 수준의 접근 제어</li>
            </ul>
          </section>

          {/* 제9조 */}
          <section>
            <h2 className="text-lg font-semibold text-gray-900 dark:text-[#F0F0F0]">제9조 (쿠키의 사용)</h2>
            <p>서비스는 이용자에게 더 나은 서비스를 제공하기 위해 쿠키를 사용합니다.</p>

            <h3 className="text-base font-medium text-gray-900 dark:text-[#F0F0F0] mt-4">1. 쿠키란?</h3>
            <p>웹사이트가 이용자의 브라우저에 저장하는 작은 텍스트 파일입니다.</p>

            <h3 className="text-base font-medium text-gray-900 dark:text-[#F0F0F0] mt-4">2. 사용 목적</h3>
            <ul className="list-disc pl-5 space-y-1">
              <li>로그인 상태 유지</li>
              <li>이용자 설정 저장 (다크모드 등)</li>
              <li>서비스 이용 분석</li>
            </ul>

            <h3 className="text-base font-medium text-gray-900 dark:text-[#F0F0F0] mt-4">3. 쿠키 거부 방법</h3>
            <p>브라우저 설정에서 쿠키 저장을 거부할 수 있습니다. 다만, 쿠키를 거부할 경우 로그인 등 일부 서비스 이용에 제한이 있을 수 있습니다.</p>
          </section>

          {/* 제10조 */}
          <section>
            <h2 className="text-lg font-semibold text-gray-900 dark:text-[#F0F0F0]">제10조 (만 14세 미만 아동의 개인정보)</h2>
            <p>
              서비스는 만 14세 미만 아동의 회원가입을 제한하고 있습니다.
              만 14세 미만 아동의 개인정보가 수집된 것으로 확인되는 경우, 해당 정보는 즉시 삭제됩니다.
            </p>
          </section>

          {/* 제11조 */}
          <section>
            <h2 className="text-lg font-semibold text-gray-900 dark:text-[#F0F0F0]">제11조 (개인정보 보호책임자)</h2>
            <p>서비스는 개인정보 처리에 관한 업무를 총괄해서 책임지고, 개인정보 처리와 관련한 이용자의 불만처리 및 피해구제 등을 위하여 아래와 같이 개인정보 보호책임자를 지정하고 있습니다.</p>

            <div className="bg-[#F5F5F5] dark:bg-[#2D2D2D] p-4 rounded-lg mt-4">
              <p className="text-gray-900 dark:text-[#F0F0F0]"><strong>개인정보 보호책임자</strong></p>
              <ul className="list-none mt-2 space-y-1 text-gray-700 dark:text-gray-300">
                <li>담당: 4590 Football 운영팀</li>
                <li>이메일: <a href="mailto:support@4590football.com" className="text-blue-600 dark:text-blue-400 hover:underline">support@4590football.com</a></li>
                <li>문의: 서비스 내 &quot;문의하기&quot; 이용</li>
              </ul>
            </div>
          </section>

          {/* 제12조 */}
          <section>
            <h2 className="text-lg font-semibold text-gray-900 dark:text-[#F0F0F0]">제12조 (권익침해 구제방법)</h2>
            <p>개인정보침해로 인한 구제를 받기 위해서는 다음 기관에 문의할 수 있습니다.</p>
            <ul className="list-disc pl-5 space-y-2 mt-4">
              <li>
                <strong>개인정보침해신고센터:</strong>{' '}
                <a href="https://privacy.kisa.or.kr" target="_blank" rel="noopener noreferrer" className="text-blue-600 dark:text-blue-400 hover:underline">
                  privacy.kisa.or.kr
                </a>{' '}
                / (국번없이) 118
              </li>
              <li>
                <strong>개인정보분쟁조정위원회:</strong>{' '}
                <a href="https://www.kopico.go.kr" target="_blank" rel="noopener noreferrer" className="text-blue-600 dark:text-blue-400 hover:underline">
                  www.kopico.go.kr
                </a>{' '}
                / (국번없이) 1833-6972
              </li>
              <li>
                <strong>대검찰청 사이버수사과:</strong>{' '}
                <a href="https://www.spo.go.kr" target="_blank" rel="noopener noreferrer" className="text-blue-600 dark:text-blue-400 hover:underline">
                  www.spo.go.kr
                </a>{' '}
                / (국번없이) 1301
              </li>
              <li>
                <strong>경찰청 사이버안전국:</strong>{' '}
                <a href="https://cyberbureau.police.go.kr" target="_blank" rel="noopener noreferrer" className="text-blue-600 dark:text-blue-400 hover:underline">
                  cyberbureau.police.go.kr
                </a>{' '}
                / (국번없이) 182
              </li>
            </ul>
          </section>

          {/* 제13조 */}
          <section>
            <h2 className="text-lg font-semibold text-gray-900 dark:text-[#F0F0F0]">제13조 (개인정보처리방침의 변경)</h2>
            <p>
              본 개인정보처리방침은 법령, 정책 또는 서비스의 변경에 따라 수정될 수 있습니다.
              변경 시에는 서비스 내 공지사항을 통해 고지합니다.
            </p>
          </section>

          {/* 부칙 */}
          <section className="border-t border-black/5 dark:border-white/10 pt-6 mt-8">
            <h2 className="text-lg font-semibold text-gray-900 dark:text-[#F0F0F0]">부칙</h2>
            <p>본 개인정보처리방침은 2025년 1월 1일부터 시행됩니다.</p>
          </section>

        </div>

        {/* 하단 링크 */}
        <div className="mt-10 pt-6 border-t border-black/5 dark:border-white/10 flex justify-between items-center text-sm text-gray-700 dark:text-gray-300">
          <Link href="/terms" className="hover:text-gray-900 dark:hover:text-[#F0F0F0] hover:underline transition-colors">
            이용약관 보기
          </Link>
          <Link href="/" className="hover:text-gray-900 dark:hover:text-[#F0F0F0] hover:underline transition-colors">
            메인으로 이동
          </Link>
        </div>
      </div>
    </div>
  );
}
