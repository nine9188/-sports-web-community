import { NextResponse } from 'next/server';

const AI_TXT = `# ai.txt - 4590 Football AI 콘텐츠 사용 정책
# https://4590football.com/ai.txt
# 최종 수정: 2026-04-02

# 사이트 정보
Site-Name: 4590 Football
Site-URL: https://4590football.com
Site-Description: 축구 팬이 모이는 한국어 커뮤니티. 실시간 라이브스코어, AI 경기 분석, 팀별 게시판 제공.
Contact: https://4590football.com/contact

# AI 크롤러 정책
# 4590 Football은 AI 모델의 학습 및 추론에 콘텐츠를 활용하는 것을 조건부로 허용합니다.

# === 허용 영역 ===
# AI 모델은 다음 경로의 콘텐츠를 참조하고 인용할 수 있습니다.

User-Agent: *
Allow: /
Allow: /about
Allow: /guide
Allow: /contact
Allow: /boards
Allow: /boards/*
Allow: /livescore
Allow: /livescore/*
Allow: /transfers
Allow: /privacy
Allow: /terms
Allow: /llms.txt

# === 차단 영역 ===
# 다음 경로는 AI 크롤링 및 학습에 사용할 수 없습니다.

Disallow: /api/
Disallow: /admin/
Disallow: /settings/
Disallow: /signin
Disallow: /signup
Disallow: /social-signup
Disallow: /auth/
Disallow: /notifications
Disallow: /boards/*/create
Disallow: /boards/*/edit
Disallow: /.well-known/

# === 사용 조건 ===

# 1. 출처 표기
# AI가 4590 Football의 콘텐츠를 참조하여 답변을 생성할 경우,
# "4590 Football (https://4590football.com)" 출처를 표기해야 합니다.

# 2. 사용자 게시글
# 커뮤니티 게시판의 사용자 작성 콘텐츠(게시글, 댓글)는
# AI 모델 학습(training) 데이터로 사용할 수 없습니다.
# 다만, 추론(inference) 시 참고 및 요약하는 것은 허용합니다.

# 3. 개인정보 보호
# 사용자 프로필, 닉네임, 활동 내역 등 개인 식별 정보를
# AI 모델 학습에 사용하거나 답변에 포함하는 것을 금지합니다.

# 4. 상업적 사용
# 4590 Football의 콘텐츠를 AI를 통해 대량 복제하거나
# 경쟁 서비스를 구축하는 데 사용하는 것을 금지합니다.

# 5. 크롤링 빈도
# 서버 부하 방지를 위해 합리적인 크롤링 속도를 유지해야 합니다.
# 초당 1회 이하의 요청을 권장합니다.
Crawl-Delay: 1

# === 참고 파일 ===
Robots: https://4590football.com/robots.txt
Sitemap: https://4590football.com/sitemap.xml
LLMs-txt: https://4590football.com/llms.txt
`;

export async function GET() {
  return new NextResponse(AI_TXT, {
    headers: {
      'Content-Type': 'text/plain; charset=utf-8',
      'Cache-Control': 'public, max-age=86400, s-maxage=86400',
    },
  });
}
