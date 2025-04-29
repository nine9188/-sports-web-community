📝 [PRD] 소셜 링크 자동 임베드 기능 (Next.js 기반)
1. 개요 (Overview)
목표:
사용자가 입력창에 링크를 입력하면, 별도의 버튼 클릭 없이 링크를 실시간 감지하여 해당 소셜 플랫폼(YouTube, X(Twitter), Instagram, Facebook)에 맞게 자동 임베드(embed)하여 보여준다.

2. 주요 요구사항 (Requirements)

구분	내용
링크 감지	입력 중 텍스트에 포함된 모든 링크를 실시간 감지
임베드 처리	각 링크별로 해당 플랫폼에 맞는 Embed 형태로 변환
지원 플랫폼	YouTube, X(구 Twitter), Instagram, Facebook
다중 링크 지원	한 번에 여러 개 링크 입력 시 모두 감지하고 각각 임베드 표시
버튼 없음	링크를 입력하면 즉시 감지 및 임베드
스크립트 로딩	Twitter, Instagram, Facebook은 필요한 스크립트(dynamic load) 자동 삽입 (중복 삽입 방지)
반응형 지원	모바일 및 데스크탑에서 정상 동작해야 함
에러 핸들링	유효하지 않은 링크나 임베드 실패 시 기본 메시지 출력 ("지원하지 않는 링크입니다.")
3. 기능 세부사항 (Specifications)
3.1 링크 감지
입력창(textarea 또는 contenteditable div)에서 입력 중 onChange 또는 onInput 이벤트를 통해 실시간 감지

정규 표현식(Regex)으로 URL 패턴 탐지

감지된 URL 리스트를 상태(state)로 관리

3.2 플랫폼별 임베드 처리
YouTube
→ iframe 생성 (https://www.youtube.com/embed/{videoId})

X (Twitter)
→ <blockquote class="twitter-tweet"> 삽입 후 platform.twitter.com/widgets.js 로드

Instagram
→ <blockquote class="instagram-media"> 삽입 후 instagram.com/embed.js 로드

Facebook
→ <div class="fb-post"> 삽입 후 connect.facebook.net/sdk.js 로드

3.3 스크립트 로딩 관리
Twitter/Instagram/Facebook은 각각 최초 임베드 시 script 태그를 삽입

이미 삽입된 경우 중복 삽입 방지

필요한 경우 useEffect나 직접 DOM 조작(appendChild) 사용

3.4 상태 및 렌더링
입력한 링크 목록을 배열 형태로 저장

배열을 순회하며 각 링크를 임베드 컴포넌트로 변환하여 렌더링

4. 기술 스택 (Tech Stack)

항목	내용
Framework	Next.js 14+ (App Router, Server Actions 지원 가능)
Language	TypeScript
Styling	TailwindCSS 또는 Styled-Components 추천
State Management	React Hook (useState, useEffect)
URL Detection	JavaScript Regex
5. UX/UI 정의 (User Experience / User Interface)
텍스트 입력창 상단 고정

사용자가 링크 입력하는 즉시 아래에 해당 소셜 포스트가 임베드되어 나타남

다수 링크 입력 시 순서대로 임베드됨

에러 발생 시 '지원하지 않는 링크' 문구 출력

로딩이 필요한 경우 스켈레톤(skeleton) 로딩 UI 추가 가능

6. 에러 및 예외 처리 (Error Handling)

상황	처리 방법
링크가 URL 패턴에 안 맞음	무시 (표시하지 않음)
임베드 실패 (ex. 잘못된 URL)	'지원하지 않는 링크입니다.' 문구 표시
스크립트 로딩 실패	콘솔에 경고 출력, 화면에 기본 메시지 노출
7. 향후 확장 고려사항 (Future Enhancements)
TikTok, Pinterest, LinkedIn 등 추가 지원

자동 링크 인식 대신 "수정/삭제" 기능 추가

커스텀 임베드 스타일 설정 기능 제공

관리자용 링크 검열 시스템 도입 가능

📍 개발 주의사항 (Developer Notes)
SSR 환경(Next.js)에서는 임베드 동작은 클라이언트 사이드에서만 처리해야 함

dangerouslySetInnerHTML 사용할 경우 XSS 방어 필수

platform script 로드 시 id를 부여해서 중복 체크

반응형 iframe 크기 조절 필요 (width: 100%)

📈 완료 기준 (Done Criteria)
 사용자가 링크 입력하면 실시간 감지 및 임베드 성공

 유튜브, 트위터, 인스타그램, 페이스북 모두 정상 임베드

 다수 링크 입력 시 각각 임베드

 스크립트 중복 로딩 없이 작동

 모바일/데스크탑 모두 정상 출력

 에러 발생 시 정상적으로 사용자에게 안내

✅ 지금까지 요청하신 걸 모두 반영한 최종 PRD입니다.