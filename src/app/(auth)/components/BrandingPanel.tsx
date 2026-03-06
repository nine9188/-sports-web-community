/** 인증 페이지 브랜딩 패널 (데스크톱 전용) */
export default function BrandingPanel() {
  return (
    <div className="hidden lg:flex lg:w-1/2 min-h-[680px] relative overflow-hidden flex-col rounded-l-lg flex-shrink-0">
      {/* 배경 이미지 */}
      <img
        src="/images/connor-coyne-OgqWLzWRSaI-unsplash.jpg"
        alt=""
        className="absolute inset-0 w-full h-full object-cover"
      />
      {/* 어두운 오버레이 */}
      <div className="absolute inset-0 bg-black/55" />

      {/* 상단 로고 */}
      <div className="relative z-10 p-5">
        <img
          src="/logo/4590football-logo-white.png"
          alt="4590 Football"
          className="h-8 w-auto"
        />
      </div>

      {/* 텍스트 콘텐츠 */}
      <div className="relative z-10 flex-1 flex flex-col justify-center px-8 pb-8">
        <h2 className="text-3xl font-bold text-white leading-tight mb-3">
          새로운 여정의 시작,<br />
          <span className="text-[34px]">4590 Football</span>
        </h2>
        <p className="text-white text-sm mb-4 leading-relaxed">
          실시간 스코어부터 전술 토론까지,<br />
          축구의 모든 것을 한 곳에서.
        </p>
        <p className="text-white text-sm mb-8 leading-relaxed">
          모든 축구팬을 위한<br />
          4590 Football 커뮤니티에 오신 것을 환영합니다.
        </p>

        <div className="space-y-4">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-lg bg-white/15 backdrop-blur-sm flex items-center justify-center flex-shrink-0">
              <svg className="w-4 h-4 text-green-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M13 10V3L4 14h7v7l9-11h-7z" />
              </svg>
            </div>
            <p className="text-white text-sm">실시간 라이브스코어</p>
          </div>
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-lg bg-white/15 backdrop-blur-sm flex items-center justify-center flex-shrink-0">
              <svg className="w-4 h-4 text-blue-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M17 8h2a2 2 0 012 2v6a2 2 0 01-2 2h-2v4l-4-4H9a1.994 1.994 0 01-1.414-.586m0 0L11 14h4a2 2 0 002-2V6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2v4l.586-.586z" />
              </svg>
            </div>
            <p className="text-white text-sm">자유로운 커뮤니티</p>
          </div>
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-lg bg-white/15 backdrop-blur-sm flex items-center justify-center flex-shrink-0">
              <svg className="w-4 h-4 text-yellow-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M11.049 2.927c.3-.921 1.603-.921 1.902 0l1.519 4.674a1 1 0 00.95.69h4.915c.969 0 1.371 1.24.588 1.81l-3.976 2.888a1 1 0 00-.363 1.118l1.518 4.674c.3.922-.755 1.688-1.538 1.118l-3.976-2.888a1 1 0 00-1.176 0l-3.976 2.888c-.783.57-1.838-.197-1.538-1.118l1.518-4.674a1 1 0 00-.363-1.118l-3.976-2.888c-.784-.57-.38-1.81.588-1.81h4.914a1 1 0 00.951-.69l1.519-4.674z" />
              </svg>
            </div>
            <p className="text-white text-sm">경기 예측 & 포인트</p>
          </div>
        </div>
      </div>
    </div>
  );
}
