import Image from 'next/image';

type BrandingVariant = 'signin' | 'signup' | 'social-signup' | 'find-id' | 'find-password' | 'reset-password' | 'account-found';

interface BrandingContent {
  title: React.ReactNode;
  mobileTitle?: React.ReactNode;
  description: React.ReactNode;
  features: { icon: keyof typeof FEATURE_ICONS; label: string }[];
}

const FEATURE_ICONS = {
  bolt: (
    <svg className="w-4 h-4 text-green-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M13 10V3L4 14h7v7l9-11h-7z" />
    </svg>
  ),
  chat: (
    <svg className="w-4 h-4 text-blue-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M17 8h2a2 2 0 012 2v6a2 2 0 01-2 2h-2v4l-4-4H9a1.994 1.994 0 01-1.414-.586m0 0L11 14h4a2 2 0 002-2V6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2v4l.586-.586z" />
    </svg>
  ),
  star: (
    <svg className="w-4 h-4 text-yellow-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M11.049 2.927c.3-.921 1.603-.921 1.902 0l1.519 4.674a1 1 0 00.95.69h4.915c.969 0 1.371 1.24.588 1.81l-3.976 2.888a1 1 0 00-.363 1.118l1.518 4.674c.3.922-.755 1.688-1.538 1.118l-3.976-2.888a1 1 0 00-1.176 0l-3.976 2.888c-.783.57-1.838-.197-1.538-1.118l1.518-4.674a1 1 0 00-.363-1.118l-3.976-2.888c-.784-.57-.38-1.81.588-1.81h4.914a1 1 0 00.951-.69l1.519-4.674z" />
    </svg>
  ),
  check: (
    <svg className="w-4 h-4 text-emerald-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
    </svg>
  ),
  mail: (
    <svg className="w-4 h-4 text-sky-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
    </svg>
  ),
  calendar: (
    <svg className="w-4 h-4 text-orange-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
    </svg>
  ),
  user: (
    <svg className="w-4 h-4 text-violet-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
    </svg>
  ),
  lock: (
    <svg className="w-4 h-4 text-rose-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
    </svg>
  ),
  gift: (
    <svg className="w-4 h-4 text-pink-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M12 8v13m0-13V6a2 2 0 112 2h-2zm0 0V5.5A2.5 2.5 0 109.5 8H12zm-7 4h14M5 12a2 2 0 110-4h14a2 2 0 110 4M5 12v7a2 2 0 002 2h10a2 2 0 002-2v-7" />
    </svg>
  ),
};

// 회원가입 단계별 콘텐츠 (1~7)
const SIGNUP_STEPS: Record<number, BrandingContent> = {
  1: {
    title: <>함께해주셔서 감사합니다!</>,
    description: (
      <p className="text-white/80 text-[13px] mb-5 leading-relaxed">
        약관을 읽고 동의해주세요.<br />
        봇 검증도 함께 완료해주세요.
      </p>
    ),
    features: [
      { icon: 'check', label: '이용약관 확인 및 동의' },
      { icon: 'check', label: '개인정보처리방침 동의' },
      { icon: 'bolt', label: '봇 검증 완료' },
    ],
  },
  2: {
    title: <>이메일과 이름을 알려주세요</>,
    description: (
      <p className="text-white/80 text-[13px] mb-5 leading-relaxed">
        가입에 사용할 이메일 주소와<br />
        실명을 입력해주세요.
      </p>
    ),
    features: [
      { icon: 'mail', label: '이메일 주소 입력 및 중복 확인' },
      { icon: 'user', label: '실명 입력 (계정 찾기에 사용)' },
      { icon: 'check', label: '가입 후 이메일 인증 필요' },
    ],
  },
  3: {
    title: <>생년월일을 입력해주세요</>,
    description: (
      <p className="text-white/80 text-[13px] mb-5 leading-relaxed">
        생년월일 정보는 계정 보호와<br />
        맞춤 서비스 제공에 사용됩니다.
      </p>
    ),
    features: [
      { icon: 'calendar', label: '생년월일 선택' },
      { icon: 'lock', label: '개인정보는 안전하게 보호됩니다' },
      { icon: 'check', label: '만 14세 이상 가입 가능' },
    ],
  },
  4: {
    title: <>아이디를 만들어주세요</>,
    description: (
      <p className="text-white/80 text-[13px] mb-5 leading-relaxed">
        로그인에 사용할 아이디를 설정해주세요.<br />
        한번 설정하면 변경할 수 없습니다.
      </p>
    ),
    features: [
      { icon: 'user', label: '4~20자 영문 소문자/숫자/밑줄(_)/마침표(.)' },
      { icon: 'check', label: '중복 확인 필수' },
      { icon: 'bolt', label: '아이디는 변경할 수 없습니다' },
    ],
  },
  5: {
    title: <>닉네임을 정해주세요</>,
    description: (
      <p className="text-white/80 text-[13px] mb-5 leading-relaxed">
        커뮤니티에서 사용할 닉네임을 정해주세요.<br />
        다른 회원들에게 보이는 이름입니다.
      </p>
    ),
    features: [
      { icon: 'chat', label: '커뮤니티에서 표시되는 이름' },
      { icon: 'check', label: '2~16자 한글/영문/숫자/밑줄(_)/하이픈(-)' },
      { icon: 'star', label: '나중에 상점에서 변경 가능' },
    ],
  },
  6: {
    title: <>비밀번호를 설정해주세요</>,
    description: (
      <p className="text-white/80 text-[13px] mb-5 leading-relaxed">
        안전한 비밀번호를 설정해주세요.<br />
        최소 10자 이상, 특수문자를 포함해야 합니다.
      </p>
    ),
    features: [
      { icon: 'lock', label: '최소 10자 이상 + 특수문자 포함' },
      { icon: 'check', label: '비밀번호 확인 입력' },
      { icon: 'bolt', label: '대문자, 숫자 포함 시 더 안전' },
    ],
  },
  7: {
    title: <>거의 다 됐어요!</>,
    description: (
      <p className="text-white/80 text-[13px] mb-5 leading-relaxed">
        추천 코드가 있다면 입력해주세요.<br />
        없어도 가입이 가능합니다.
      </p>
    ),
    features: [
      { icon: 'gift', label: '추천 코드 입력 (선택)' },
      { icon: 'star', label: '추천인과 함께 포인트 혜택' },
      { icon: 'check', label: '가입 완료 후 이메일 인증' },
    ],
  },
};

const VARIANT_CONTENT: Record<BrandingVariant, BrandingContent> = {
  signin: {
    title: <>새로운 여정의 시작,<br /><span className="text-[34px]">4590 Football</span></>,
    mobileTitle: <>4590 Football 로그인</>,
    description: (
      <>
        <p className="text-white text-[13px] mb-4 leading-relaxed">
          실시간 스코어부터 전술 토론까지,<br />
          축구의 모든 것을 한 곳에서.
        </p>
        <p className="text-white/70 text-[13px] mb-8 leading-relaxed">
          모든 축구팬을 위한<br />
          4590 Football 커뮤니티에 오신 것을 환영합니다.
        </p>
      </>
    ),
    features: [
      { icon: 'bolt', label: '실시간 라이브스코어' },
      { icon: 'chat', label: '자유로운 커뮤니티' },
      { icon: 'star', label: '경기 예측 & 포인트' },
    ],
  },
  signup: SIGNUP_STEPS[1],
  'social-signup': {
    title: <>거의 다 됐어요!</>,
    description: (
      <>
        <p className="text-white text-[13px] mb-4 leading-relaxed">
          소셜 계정으로 간편하게 가입하세요.<br />
          아이디와 닉네임만 설정하면 완료됩니다.
        </p>
        <p className="text-white/70 text-[13px] mb-8 leading-relaxed">
          이미 인증된 소셜 계정을 사용하므로<br />
          별도의 이메일 인증이 필요 없습니다.
        </p>
      </>
    ),
    features: [
      { icon: 'bolt', label: '간편한 소셜 로그인' },
      { icon: 'chat', label: '아이디/닉네임만 설정' },
      { icon: 'star', label: '바로 커뮤니티 이용 가능' },
    ],
  },
  'find-id': {
    title: <>아이디가 기억나지 않으세요?</>,
    description: (
      <>
        <p className="text-white text-[13px] mb-4 leading-relaxed">
          가입할 때 사용한 이름과 이메일을<br />
          입력하면 아이디를 찾을 수 있습니다.
        </p>
        <p className="text-white/70 text-[13px] mb-8 leading-relaxed">
          이메일로 발송된 인증코드를 입력하면<br />
          아이디를 바로 확인하실 수 있습니다.
        </p>
      </>
    ),
    features: [
      { icon: 'bolt', label: '이름과 이메일로 인증' },
      { icon: 'chat', label: '6자리 인증코드 확인' },
      { icon: 'star', label: '아이디 즉시 확인' },
    ],
  },
  'find-password': {
    title: <>비밀번호를 잊으셨나요?</>,
    description: (
      <>
        <p className="text-white text-[13px] mb-4 leading-relaxed">
          아이디를 입력하면 가입 시 등록한<br />
          이메일로 재설정 링크를 보내드립니다.
        </p>
        <p className="text-white/70 text-[13px] mb-8 leading-relaxed">
          링크는 30분간 유효하며,<br />
          새로운 비밀번호를 설정하실 수 있습니다.
        </p>
      </>
    ),
    features: [
      { icon: 'bolt', label: '아이디 입력' },
      { icon: 'chat', label: '이메일로 재설정 링크 발송' },
      { icon: 'star', label: '새 비밀번호 설정 완료' },
    ],
  },
  'reset-password': {
    title: <>새 비밀번호를 설정하세요</>,
    description: (
      <>
        <p className="text-white text-[13px] mb-4 leading-relaxed">
          안전한 비밀번호를 설정해주세요.<br />
          최소 6자 이상의 비밀번호를 권장합니다.
        </p>
        <p className="text-white/70 text-[13px] mb-8 leading-relaxed">
          비밀번호 변경 후<br />
          새 비밀번호로 로그인해주세요.
        </p>
      </>
    ),
    features: [
      { icon: 'bolt', label: '안전한 비밀번호 설정' },
      { icon: 'chat', label: '비밀번호 확인' },
      { icon: 'star', label: '변경 완료 후 로그인' },
    ],
  },
  'account-found': {
    title: <>계정을 찾았습니다!</>,
    description: (
      <>
        <p className="text-white text-[13px] mb-4 leading-relaxed">
          회원님의 계정 정보를 확인하세요.<br />
          바로 로그인하거나 비밀번호를 재설정할 수 있습니다.
        </p>
        <p className="text-white/70 text-[13px] mb-8 leading-relaxed">
          4590 Football 커뮤니티가<br />
          다시 만나뵙게 되어 반갑습니다.
        </p>
      </>
    ),
    features: [
      { icon: 'bolt', label: '계정 정보 확인' },
      { icon: 'chat', label: '바로 로그인하기' },
      { icon: 'star', label: '비밀번호 재설정' },
    ],
  },
};

/** 인증 페이지 브랜딩 패널 (데스크톱: 사이드 패널 / 모바일: 상단 배너) */
export default function BrandingPanel({ variant = 'signin', step }: { variant?: BrandingVariant; step?: number }) {
  // signup + step이 있으면 단계별 콘텐츠 사용
  const content = variant === 'signup' && step && SIGNUP_STEPS[step]
    ? SIGNUP_STEPS[step]
    : VARIANT_CONTENT[variant];

  const mobileTitle = content.mobileTitle || content.title;

  return (
    <>
      {/* 모바일 상단 배너 */}
      <div className="lg:hidden w-full relative overflow-hidden rounded-lg md:rounded-t-lg md:rounded-b-none mb-6 md:mb-0">
        <Image
          src="/images/connor-coyne-OgqWLzWRSaI-unsplash.webp"
          alt="경기장 배경"
          fill
          className="object-cover"
        />
        <div className="absolute inset-0 bg-black/60" />
        <div className={`relative z-10 px-6 text-center ${variant === 'signup' ? 'py-4' : 'py-8'}`}>
          <h2 className="text-xl font-bold text-white leading-tight mb-1">
            {mobileTitle}
          </h2>
          <p className="text-white/70 text-[13px]">
            {variant === 'signin' && '모든 축구팬을 위한 커뮤니티'}
            {variant === 'signup' && step === 1 && '약관을 읽고 동의해주세요'}
            {variant === 'signup' && step === 2 && '이메일과 이름을 입력해주세요'}
            {variant === 'signup' && step === 3 && '생년월일을 입력해주세요'}
            {variant === 'signup' && step === 4 && '로그인에 사용할 아이디를 설정해주세요'}
            {variant === 'signup' && step === 5 && '커뮤니티에서 사용할 닉네임을 정해주세요'}
            {variant === 'signup' && step === 6 && '안전한 비밀번호를 설정해주세요'}
            {variant === 'signup' && step === 7 && '추천 코드가 있다면 입력해주세요'}
            {variant === 'social-signup' && '아이디와 닉네임만 설정하면 완료'}
            {variant === 'find-id' && '이름과 이메일로 아이디를 찾을 수 있습니다'}
            {variant === 'find-password' && '등록된 이메일로 재설정 링크를 보내드립니다'}
            {variant === 'reset-password' && '새로운 비밀번호를 입력해주세요'}
            {variant === 'account-found' && '계정 정보를 확인하세요'}
          </p>
          {/* 회원가입 프로그레스 (모바일) */}
          {variant === 'signup' && step && (
            <div className="mt-2.5 max-w-[200px] mx-auto">
              <div className="w-full bg-white/20 rounded-full h-1">
                <div
                  className="bg-white rounded-full h-1 transition-all duration-500"
                  style={{ width: `${(step / 7) * 100}%` }}
                />
              </div>
              <span className="text-white/50 text-xs mt-0.5 inline-block">{step} / 7</span>
            </div>
          )}
        </div>
      </div>

      {/* 데스크톱 사이드 패널 */}
      <div className="hidden lg:flex lg:w-1/2 min-h-[680px] relative overflow-hidden flex-col rounded-l-lg flex-shrink-0">
        <Image
          src="/images/connor-coyne-OgqWLzWRSaI-unsplash.webp"
          alt="경기장 배경"
          fill
          className="object-cover"
        />
        <div className="absolute inset-0 bg-black/55" />

        <div className="relative z-10 p-5">
          <Image
            src="/logo/4590football-logo-white.webp"
            alt="4590 Football"
            width={120}
            height={32}
            className="h-8 w-auto"
          />
        </div>

        <div className="relative z-10 flex-1 flex flex-col justify-center px-8 pb-8">
          <h2 className="text-3xl font-bold text-white leading-tight mb-3">
            {content.title}
          </h2>
          {content.description}

          <div className="space-y-4">
            {content.features.map((feature, i) => (
              <div key={i} className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-lg bg-white/15 backdrop-blur-sm flex items-center justify-center flex-shrink-0">
                  {FEATURE_ICONS[feature.icon]}
                </div>
                <p className="text-white text-[13px]">{feature.label}</p>
              </div>
            ))}
          </div>

          {variant === 'signup' && step && (
            <div className="mt-6">
              <div className="flex items-center justify-between mb-2">
                <span className="text-white/60 text-xs">가입 진행률</span>
                <span className="text-white/60 text-xs">{step} / 7</span>
              </div>
              <div className="w-full bg-white/15 rounded-full h-1.5">
                <div
                  className="bg-white rounded-full h-1.5 transition-all duration-500"
                  style={{ width: `${(step / 7) * 100}%` }}
                />
              </div>
            </div>
          )}
        </div>
      </div>
    </>
  );
}
