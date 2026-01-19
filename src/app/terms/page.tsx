import Link from 'next/link';
import BackButton from '@/shared/components/BackButton';
import { generatePageMetadataWithDefaults } from '@/shared/utils/metadataNew';

export async function generateMetadata() {
  return generatePageMetadataWithDefaults('/terms', {
    title: '이용약관 - 4590 Football',
    description: '4590 Football 서비스 이용약관을 확인하세요.',
  });
}

export default function TermsPage() {
  return (
    <div className="flex flex-col justify-center items-center min-h-[calc(100vh-120px)] px-4 py-8">
      <div className="w-full max-w-3xl">
        {/* 상단 돌아가기 */}
        <BackButton />

        {/* 헤더 */}
        <div className="mb-8">
          <h1 className="text-2xl font-bold text-left mb-2 text-gray-900 dark:text-[#F0F0F0]">이용약관</h1>
          <p className="text-gray-700 dark:text-gray-300 text-left">
            4590 Football 서비스 이용에 관한 약관입니다.
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
            <h2 className="text-lg font-semibold text-gray-900 dark:text-[#F0F0F0] mt-0">제1조 (목적)</h2>
            <p>
              본 약관은 4590 Football(이하 &quot;서비스&quot;)이 제공하는 축구 커뮤니티 서비스의 이용과 관련하여
              서비스 운영자(이하 &quot;운영자&quot;)와 이용자 간의 권리, 의무 및 책임사항, 기타 필요한 사항을 규정함을 목적으로 합니다.
            </p>
          </section>

          {/* 제2조 */}
          <section>
            <h2 className="text-lg font-semibold text-gray-900 dark:text-[#F0F0F0]">제2조 (정의)</h2>
            <ol className="list-decimal pl-5 space-y-2">
              <li>&quot;서비스&quot;란 4590 Football이 제공하는 축구 관련 커뮤니티, 라이브스코어, 정보 제공 등 모든 서비스를 의미합니다.</li>
              <li>&quot;이용자&quot;란 본 약관에 따라 서비스를 이용하는 회원 및 비회원을 의미합니다.</li>
              <li>&quot;회원&quot;이란 서비스에 회원가입을 하고 아이디를 부여받은 자를 의미합니다.</li>
              <li>&quot;게시물&quot;이란 회원이 서비스에 게시한 글, 댓글, 이미지 등 모든 콘텐츠를 의미합니다.</li>
              <li>&quot;포인트&quot;란 서비스 내 활동을 통해 획득하고 사용할 수 있는 가상의 재화를 의미합니다.</li>
            </ol>
          </section>

          {/* 제3조 */}
          <section>
            <h2 className="text-lg font-semibold text-gray-900 dark:text-[#F0F0F0]">제3조 (약관의 효력 및 변경)</h2>
            <ol className="list-decimal pl-5 space-y-2">
              <li>본 약관은 서비스 화면에 게시하거나 기타의 방법으로 이용자에게 공지함으로써 효력이 발생합니다.</li>
              <li>운영자는 관련 법령을 위배하지 않는 범위에서 약관을 개정할 수 있습니다.</li>
              <li>약관이 개정되는 경우 적용일자 7일 전부터 공지사항을 통해 고지합니다. 다만, 이용자에게 불리한 변경의 경우 30일 전에 고지합니다.</li>
              <li>이용자가 개정약관에 동의하지 않는 경우 서비스 이용을 중단하고 탈퇴할 수 있습니다.</li>
            </ol>
          </section>

          {/* 제4조 */}
          <section>
            <h2 className="text-lg font-semibold text-gray-900 dark:text-[#F0F0F0]">제4조 (서비스의 제공)</h2>
            <ol className="list-decimal pl-5 space-y-2">
              <li>운영자는 다음과 같은 서비스를 제공합니다:
                <ul className="list-disc pl-5 mt-2 space-y-1">
                  <li>축구 커뮤니티 게시판 서비스</li>
                  <li>실시간 축구 경기 스코어 및 정보 제공</li>
                  <li>축구 관련 뉴스 및 콘텐츠 제공</li>
                  <li>포인트 및 레벨 시스템</li>
                  <li>아이콘 샵 서비스</li>
                  <li>기타 운영자가 정하는 서비스</li>
                </ul>
              </li>
              <li>서비스는 연중무휴, 1일 24시간 제공을 원칙으로 합니다. 다만, 시스템 점검 등의 사유로 일시 중단될 수 있습니다.</li>
              <li>운영자는 서비스의 내용, 운영시간, 제공 방식을 변경할 수 있으며, 이 경우 사전에 공지합니다.</li>
            </ol>
          </section>

          {/* 제5조 */}
          <section>
            <h2 className="text-lg font-semibold text-gray-900 dark:text-[#F0F0F0]">제5조 (회원가입)</h2>
            <ol className="list-decimal pl-5 space-y-2">
              <li>회원가입은 이용자가 약관에 동의하고 가입신청을 한 후, 운영자가 이를 승낙함으로써 성립됩니다.</li>
              <li>회원가입 시 이메일 주소, 비밀번호, 닉네임 등 필요한 정보를 정확히 입력해야 합니다.</li>
              <li>타인의 정보를 도용하거나 허위 정보를 입력한 경우, 서비스 이용이 제한될 수 있습니다.</li>
              <li>만 14세 미만의 아동은 법정대리인의 동의 없이 회원가입을 할 수 없습니다.</li>
            </ol>
          </section>

          {/* 제6조 */}
          <section>
            <h2 className="text-lg font-semibold text-gray-900 dark:text-[#F0F0F0]">제6조 (회원의 의무)</h2>
            <ol className="list-decimal pl-5 space-y-2">
              <li>회원은 본 약관 및 운영자가 정한 운영정책을 준수해야 합니다.</li>
              <li>회원은 다음 행위를 해서는 안 됩니다:
                <ul className="list-disc pl-5 mt-2 space-y-1">
                  <li>타인의 개인정보 도용 또는 허위정보 등록</li>
                  <li>타인을 비방, 모욕, 명예훼손하는 게시물 작성</li>
                  <li>음란물, 불법 콘텐츠 게시</li>
                  <li>저작권 등 타인의 지식재산권 침해</li>
                  <li>서비스 운영을 방해하는 행위</li>
                  <li>영리 목적의 광고, 스팸 게시</li>
                  <li>악성코드 배포 또는 해킹 시도</li>
                  <li>정치적 또는 사회적 논쟁을 유발하는 게시물 작성</li>
                  <li>기타 관련 법령 또는 공서양속에 반하는 행위</li>
                </ul>
              </li>
              <li>회원은 계정 정보를 안전하게 관리해야 하며, 제3자에게 양도하거나 대여할 수 없습니다.</li>
            </ol>
          </section>

          {/* 제7조 */}
          <section>
            <h2 className="text-lg font-semibold text-gray-900 dark:text-[#F0F0F0]">제7조 (게시물의 관리)</h2>
            <ol className="list-decimal pl-5 space-y-2">
              <li>회원이 작성한 게시물의 저작권은 해당 회원에게 귀속됩니다.</li>
              <li>운영자는 다음에 해당하는 게시물을 사전 통지 없이 삭제하거나 접근을 제한할 수 있습니다:
                <ul className="list-disc pl-5 mt-2 space-y-1">
                  <li>본 약관 제6조를 위반한 게시물</li>
                  <li>신고가 접수되어 검토 결과 부적절한 게시물</li>
                  <li>관련 법령에 위반되는 게시물</li>
                </ul>
              </li>
              <li>삭제된 게시물은 복구되지 않을 수 있습니다.</li>
            </ol>
          </section>

          {/* 제8조 */}
          <section>
            <h2 className="text-lg font-semibold text-gray-900 dark:text-[#F0F0F0]">제8조 (포인트 및 아이템)</h2>
            <ol className="list-decimal pl-5 space-y-2">
              <li>포인트는 서비스 내 활동(게시글 작성, 댓글 작성, 출석 등)을 통해 획득할 수 있습니다.</li>
              <li>포인트는 서비스 내 아이콘 구매 등에 사용할 수 있으며, 현금으로 환급되지 않습니다.</li>
              <li>부정한 방법으로 포인트를 획득한 경우, 해당 포인트는 회수되고 계정이 제재될 수 있습니다.</li>
              <li>서비스 종료 시 미사용 포인트는 소멸되며, 별도의 보상이 제공되지 않습니다.</li>
            </ol>
          </section>

          {/* 제9조 */}
          <section>
            <h2 className="text-lg font-semibold text-gray-900 dark:text-[#F0F0F0]">제9조 (서비스 이용 제한)</h2>
            <ol className="list-decimal pl-5 space-y-2">
              <li>운영자는 회원이 본 약관을 위반한 경우 다음과 같은 조치를 취할 수 있습니다:
                <ul className="list-disc pl-5 mt-2 space-y-1">
                  <li>경고</li>
                  <li>일정 기간 서비스 이용 정지</li>
                  <li>영구 이용 정지 (강제 탈퇴)</li>
                </ul>
              </li>
              <li>이용 제한에 대해 이의가 있는 경우, 운영자에게 소명할 수 있습니다.</li>
            </ol>
          </section>

          {/* 제10조 */}
          <section>
            <h2 className="text-lg font-semibold text-gray-900 dark:text-[#F0F0F0]">제10조 (회원 탈퇴)</h2>
            <ol className="list-decimal pl-5 space-y-2">
              <li>회원은 언제든지 서비스 내 설정 메뉴를 통해 탈퇴를 요청할 수 있습니다.</li>
              <li>탈퇴 시 회원의 개인정보는 관련 법령에 따라 일정 기간 보관 후 파기됩니다.</li>
              <li>탈퇴한 회원이 작성한 게시물은 삭제되지 않으며, 작성자 정보가 &quot;탈퇴한 회원&quot;으로 표시됩니다.</li>
              <li>탈퇴 후 동일한 이메일로 재가입이 가능하나, 기존 데이터는 복구되지 않습니다.</li>
            </ol>
          </section>

          {/* 제11조 */}
          <section>
            <h2 className="text-lg font-semibold text-gray-900 dark:text-[#F0F0F0]">제11조 (면책 조항)</h2>
            <ol className="list-decimal pl-5 space-y-2">
              <li>운영자는 천재지변, 전쟁, 테러, 해킹 등 불가항력적 사유로 인한 서비스 중단에 대해 책임을 지지 않습니다.</li>
              <li>운영자는 회원 간 또는 회원과 제3자 간의 분쟁에 대해 개입할 의무가 없으며, 이로 인한 손해에 대해 책임을 지지 않습니다.</li>
              <li>운영자는 회원이 게시한 정보의 정확성, 신뢰성에 대해 보증하지 않습니다.</li>
              <li>운영자가 제공하는 라이브스코어, 경기 정보 등은 참고용이며, 정보의 정확성을 보장하지 않습니다.</li>
            </ol>
          </section>

          {/* 제12조 */}
          <section>
            <h2 className="text-lg font-semibold text-gray-900 dark:text-[#F0F0F0]">제12조 (저작권 및 지식재산권)</h2>
            <ol className="list-decimal pl-5 space-y-2">
              <li>서비스의 디자인, 로고, 소프트웨어 등에 대한 저작권은 운영자에게 귀속됩니다.</li>
              <li>이용자는 서비스를 통해 얻은 정보를 운영자의 사전 승낙 없이 상업적으로 이용할 수 없습니다.</li>
              <li>서비스에서 제공하는 축구 관련 데이터는 제3자 API를 통해 제공되며, 해당 제공자의 이용약관을 따릅니다.</li>
            </ol>
          </section>

          {/* 제13조 */}
          <section>
            <h2 className="text-lg font-semibold text-gray-900 dark:text-[#F0F0F0]">제13조 (분쟁 해결)</h2>
            <ol className="list-decimal pl-5 space-y-2">
              <li>본 약관은 대한민국 법률에 따라 해석됩니다.</li>
              <li>서비스 이용과 관련하여 분쟁이 발생한 경우, 운영자와 이용자는 원만한 해결을 위해 성실히 협의합니다.</li>
              <li>협의가 이루어지지 않는 경우, 관할 법원은 민사소송법에 따른 법원으로 합니다.</li>
            </ol>
          </section>

          {/* 부칙 */}
          <section className="border-t border-black/5 dark:border-white/10 pt-6 mt-8">
            <h2 className="text-lg font-semibold text-gray-900 dark:text-[#F0F0F0]">부칙</h2>
            <p>본 약관은 2025년 1월 1일부터 시행됩니다.</p>
          </section>

        </div>

        {/* 하단 링크 */}
        <div className="mt-10 pt-6 border-t border-black/5 dark:border-white/10 flex justify-between items-center text-sm text-gray-700 dark:text-gray-300">
          <Link href="/privacy" className="hover:text-gray-900 dark:hover:text-[#F0F0F0] hover:underline transition-colors">
            개인정보처리방침 보기
          </Link>
          <Link href="/" className="hover:text-gray-900 dark:hover:text-[#F0F0F0] hover:underline transition-colors">
            메인으로 이동
          </Link>
        </div>
      </div>
    </div>
  );
}
