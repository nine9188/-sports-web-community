export default function PrivacyContent() {
  return (
    <div className="space-y-4">
      {/* 제1조 */}
      <div>
        <p className="font-semibold text-gray-900 dark:text-[#F0F0F0]">제1조 (개인정보의 수집 항목)</p>
        <p>4590 Football(이하 &quot;서비스&quot;)은 회원가입, 서비스 제공을 위해 다음과 같은 개인정보를 수집합니다.</p>
        <p className="font-medium mt-2">1. 필수 수집 항목</p>
        <p className="ml-3">• 이메일 회원가입: 이메일 주소, 비밀번호, 닉네임</p>
        <p className="ml-3">• 소셜 로그인(카카오): 소셜 계정 식별자, 이메일 주소(선택 제공 시), 닉네임</p>
        <p className="font-medium mt-2">2. 자동 수집 항목</p>
        <p className="ml-3">• 접속 IP 주소, 접속 일시</p>
        <p className="ml-3">• 브라우저 종류 및 운영체제 정보</p>
        <p className="ml-3">• 서비스 이용 기록 (게시글, 댓글, 좋아요 등)</p>
        <p className="font-medium mt-2">3. 선택 수집 항목</p>
        <p className="ml-3">• 프로필 이미지</p>
        <p className="ml-3">• 자기소개</p>
      </div>
      {/* 제2조 */}
      <div>
        <p className="font-semibold text-gray-900 dark:text-[#F0F0F0]">제2조 (개인정보의 수집 및 이용 목적)</p>
        <p>수집한 개인정보는 다음의 목적을 위해 이용됩니다.</p>
        <p className="ml-3">• 회원 관리: 회원 가입, 본인 확인, 회원 식별, 부정 이용 방지</p>
        <p className="ml-3">• 서비스 제공: 게시판 서비스, 라이브스코어 제공, 포인트/레벨 시스템 운영</p>
        <p className="ml-3">• 서비스 개선: 서비스 이용 통계 분석, 신규 서비스 개발</p>
        <p className="ml-3">• 고객 지원: 문의 응대, 공지사항 전달, 분쟁 조정</p>
        <p className="ml-3">• 법적 의무 이행: 관련 법령에 따른 의무 준수</p>
      </div>
      {/* 제3조 */}
      <div>
        <p className="font-semibold text-gray-900 dark:text-[#F0F0F0]">제3조 (개인정보의 보유 및 이용 기간)</p>
        <p>개인정보는 수집 및 이용 목적이 달성된 후에는 지체 없이 파기합니다. 다만, 다음의 경우에는 명시된 기간 동안 보관합니다.</p>
        <p className="font-medium mt-2">1. 회원 탈퇴 시</p>
        <p className="ml-3">• 탈퇴 즉시 개인정보 파기 (단, 관련 법령에 따른 보관 의무가 있는 경우 제외)</p>
        <p className="font-medium mt-2">2. 관련 법령에 따른 보관</p>
        <p className="ml-3">• 로그인 기록: 3개월 (통신비밀보호법)</p>
        <p className="ml-3">• 서비스 이용 기록: 3개월 (통신비밀보호법)</p>
        <p className="ml-3">• 표시/광고에 관한 기록: 6개월 (전자상거래법)</p>
        <p className="ml-3">• 계약 또는 청약철회 기록: 5년 (전자상거래법)</p>
        <p className="ml-3">• 소비자 불만/분쟁 처리 기록: 3년 (전자상거래법)</p>
      </div>
      {/* 제4조 */}
      <div>
        <p className="font-semibold text-gray-900 dark:text-[#F0F0F0]">제4조 (개인정보의 제3자 제공)</p>
        <p>서비스는 원칙적으로 이용자의 개인정보를 외부에 제공하지 않습니다. 다만, 다음의 경우에는 예외로 합니다.</p>
        <p className="ml-3">• 이용자가 사전에 동의한 경우</p>
        <p className="ml-3">• 법령의 규정에 의하거나, 수사 목적으로 법령에 정해진 절차와 방법에 따라 수사기관의 요구가 있는 경우</p>
      </div>
      {/* 제5조 */}
      <div>
        <p className="font-semibold text-gray-900 dark:text-[#F0F0F0]">제5조 (개인정보 처리의 위탁)</p>
        <p>서비스는 원활한 서비스 제공을 위해 다음과 같이 개인정보 처리 업무를 위탁하고 있습니다.</p>
        <p className="ml-3">• Supabase Inc.: 데이터베이스 호스팅, 인증 서비스</p>
        <p className="ml-3">• Vercel Inc.: 웹 호스팅 서비스</p>
      </div>
      {/* 제6조 */}
      <div>
        <p className="font-semibold text-gray-900 dark:text-[#F0F0F0]">제6조 (이용자의 권리와 행사 방법)</p>
        <p>이용자는 언제든지 다음과 같은 개인정보 보호 관련 권리를 행사할 수 있습니다.</p>
        <p className="ml-3">• 개인정보 열람 요구: 설정 &gt; 프로필에서 본인의 개인정보 확인</p>
        <p className="ml-3">• 개인정보 정정 요구: 설정 &gt; 프로필에서 정보 수정</p>
        <p className="ml-3">• 개인정보 삭제 요구: 설정 &gt; 계정 삭제를 통한 탈퇴</p>
        <p className="ml-3">• 개인정보 처리 정지 요구: 운영자에게 이메일로 요청</p>
        <p className="mt-2">권리 행사는 서비스 내 설정 메뉴를 통해 직접 하거나, 서비스 내 문의하기를 통해 요청할 수 있습니다.</p>
      </div>
      {/* 제7조 */}
      <div>
        <p className="font-semibold text-gray-900 dark:text-[#F0F0F0]">제7조 (개인정보의 파기)</p>
        <p>개인정보는 보유 기간이 경과하거나 처리 목적이 달성된 경우 다음의 방법으로 파기합니다.</p>
        <p className="ml-3">• 전자적 파일: 복구 불가능한 방법으로 영구 삭제</p>
        <p className="ml-3">• 종이 문서: 분쇄기로 분쇄하거나 소각</p>
      </div>
      {/* 제8조 */}
      <div>
        <p className="font-semibold text-gray-900 dark:text-[#F0F0F0]">제8조 (개인정보의 안전성 확보 조치)</p>
        <p>서비스는 개인정보의 안전성 확보를 위해 다음과 같은 조치를 취하고 있습니다.</p>
        <p className="ml-3">• 비밀번호 암호화: 비밀번호는 단방향 암호화하여 저장</p>
        <p className="ml-3">• 데이터 암호화: SSL/TLS를 통한 데이터 전송 암호화</p>
        <p className="ml-3">• 접근 제한: 개인정보에 대한 접근 권한 최소화</p>
        <p className="ml-3">• 보안 시스템: 해킹 등에 대비한 보안 시스템 운영</p>
        <p className="ml-3">• Row Level Security: 데이터베이스 수준의 접근 제어</p>
      </div>
      {/* 제9조 */}
      <div>
        <p className="font-semibold text-gray-900 dark:text-[#F0F0F0]">제9조 (쿠키의 사용)</p>
        <p>서비스는 이용자에게 더 나은 서비스를 제공하기 위해 쿠키를 사용합니다.</p>
        <p className="font-medium mt-2">1. 쿠키란?</p>
        <p className="ml-3">웹사이트가 이용자의 브라우저에 저장하는 작은 텍스트 파일입니다.</p>
        <p className="font-medium mt-2">2. 사용 목적</p>
        <p className="ml-3">• 로그인 상태 유지</p>
        <p className="ml-3">• 이용자 설정 저장 (다크모드 등)</p>
        <p className="ml-3">• 서비스 이용 분석</p>
        <p className="font-medium mt-2">3. 쿠키 거부 방법</p>
        <p className="ml-3">브라우저 설정에서 쿠키 저장을 거부할 수 있습니다. 다만, 쿠키를 거부할 경우 로그인 등 일부 서비스 이용에 제한이 있을 수 있습니다.</p>
      </div>
      {/* 제10조 */}
      <div>
        <p className="font-semibold text-gray-900 dark:text-[#F0F0F0]">제10조 (만 14세 미만 아동의 개인정보)</p>
        <p>서비스는 만 14세 미만 아동의 회원가입을 제한하고 있습니다. 만 14세 미만 아동의 개인정보가 수집된 것으로 확인되는 경우, 해당 정보는 즉시 삭제됩니다.</p>
      </div>
      {/* 제11조 */}
      <div>
        <p className="font-semibold text-gray-900 dark:text-[#F0F0F0]">제11조 (개인정보 보호책임자)</p>
        <p>서비스는 개인정보 처리에 관한 업무를 총괄해서 책임지고, 개인정보 처리와 관련한 이용자의 불만처리 및 피해구제 등을 위하여 아래와 같이 개인정보 보호책임자를 지정하고 있습니다.</p>
        <p className="mt-2 ml-3">• 담당: 4590 Football 운영팀</p>
        <p className="ml-3">• 문의: 서비스 내 &quot;문의하기&quot; 이용</p>
      </div>
      {/* 제12조 */}
      <div>
        <p className="font-semibold text-gray-900 dark:text-[#F0F0F0]">제12조 (권익침해 구제방법)</p>
        <p>개인정보침해로 인한 구제를 받기 위해서는 다음 기관에 문의할 수 있습니다.</p>
        <p className="ml-3">• 개인정보침해신고센터: privacy.kisa.or.kr / (국번없이) 118</p>
        <p className="ml-3">• 개인정보분쟁조정위원회: www.kopico.go.kr / (국번없이) 1833-6972</p>
        <p className="ml-3">• 대검찰청 사이버수사과: www.spo.go.kr / (국번없이) 1301</p>
        <p className="ml-3">• 경찰청 사이버안전국: cyberbureau.police.go.kr / (국번없이) 182</p>
      </div>
      {/* 제13조 */}
      <div>
        <p className="font-semibold text-gray-900 dark:text-[#F0F0F0]">제13조 (개인정보처리방침의 변경)</p>
        <p>본 개인정보처리방침은 법령, 정책 또는 서비스의 변경에 따라 수정될 수 있습니다. 변경 시에는 서비스 내 공지사항을 통해 고지합니다.</p>
      </div>
      {/* 부칙 */}
      <div className="pt-3 border-t border-black/7 dark:border-white/10">
        <p className="font-semibold text-gray-900 dark:text-[#F0F0F0]">부칙</p>
        <p>본 개인정보처리방침은 2025년 1월 1일부터 시행됩니다.</p>
      </div>
    </div>
  );
}
