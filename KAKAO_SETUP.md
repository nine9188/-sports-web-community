# 🎯 카카오 로그인 설정 가이드

이 문서는 Next.js + Supabase 프로젝트에 카카오 간편 로그인을 설정하는 방법을 안내합니다.

## 📋 목차
1. [환경변수 설정](#환경변수-설정)
2. [카카오 개발자 계정 설정](#카카오-개발자-계정-설정)
3. [Supabase Auth 설정](#supabase-auth-설정)
4. [테스트 방법](#테스트-방법)

---

## 🔧 환경변수 설정

`.env.local` 파일에 다음 환경변수를 추가하세요:

```env
# 카카오 OAuth 설정
NEXT_PUBLIC_KAKAO_CLIENT_ID=your_kakao_rest_api_key
KAKAO_CLIENT_SECRET=your_kakao_client_secret

# 사이트 URL (배포 시 변경 필요)
NEXT_PUBLIC_SITE_URL=http://localhost:3000
```

---

## 🥇 카카오 개발자 계정 설정

### 1. 카카오 개발자 계정 생성
1. [카카오 개발자 사이트](https://developers.kakao.com) 접속
2. 카카오 계정으로 로그인
3. **내 애플리케이션** > **애플리케이션 추가하기** 클릭

### 2. 애플리케이션 기본 설정
1. **앱 이름**: `SPORTS 커뮤니티` (원하는 이름)
2. **사업자명**: 개인 또는 회사명
3. **카테고리**: 커뮤니티
4. 애플리케이션 생성 완료

### 3. 앱 키 확인
1. **내 애플리케이션** > 생성한 앱 선택
2. **앱 설정** > **요약 정보**에서 **REST API 키** 복사
3. 이 키를 `NEXT_PUBLIC_KAKAO_CLIENT_ID`로 사용

### 4. 플랫폼 설정
1. **앱 설정** > **플랫폼** 메뉴
2. **Web 플랫폼 등록** 클릭
3. **사이트 도메인** 추가:
   - 개발: `http://localhost:3000`
   - 배포: `https://yourdomain.com`

### 5. 카카오 로그인 활성화
1. **제품 설정** > **카카오 로그인** 메뉴
2. **활성화 설정** 상태를 **ON**으로 변경
3. **Redirect URI** 등록:
   - 개발: `http://localhost:3000/auth/callback/kakao`
   - 배포: `https://yourdomain.com/auth/callback/kakao`

### 6. 동의항목 설정
1. **제품 설정** > **카카오 로그인** > **동의항목**
2. 다음 항목들을 **필수 동의**로 설정:
   - 닉네임
   - 카카오계정(이메일)
3. **선택 동의** (필요시):
   - 프로필 사진
   - 카카오계정(실명)

### 7. 보안 설정 (선택사항)
1. **앱 설정** > **보안**
2. **Client Secret** 발급 (보안 강화를 위해 권장)
3. 발급된 키를 `KAKAO_CLIENT_SECRET`으로 사용

---

## 🗄️ Supabase Auth 설정

### 1. Supabase 프로젝트 Auth 설정
1. [Supabase Dashboard](https://supabase.com) 로그인
2. 프로젝트 선택 > **Authentication** > **Providers**
3. **Kakao** 찾아서 활성화

### 2. Kakao Provider 설정
```
Kakao enabled: ON
Client ID: [카카오 REST API 키]
Client Secret: [카카오 Client Secret] (선택사항)
Redirect URL: https://[your-project-ref].supabase.co/auth/v1/callback
```

### 3. 사이트 URL 설정
1. **Authentication** > **Settings**
2. **Site URL**: `http://localhost:3000` (개발) / `https://yourdomain.com` (배포)
3. **Additional Redirect URLs**에 추가:
   - `http://localhost:3000/auth/callback/kakao`
   - `https://yourdomain.com/auth/callback/kakao` (배포 시)

---

## 🧪 테스트 방법

### 1. 개발 서버 실행
```bash
npm run dev
# 또는
yarn dev
```

### 2. 로그인 테스트
1. `http://localhost:3000/signin` 접속
2. **카카오 로그인** 버튼 클릭
3. 카카오 로그인 페이지에서 로그인
4. 자동으로 사이트로 돌아와서 로그인 완료

### 3. 회원가입 테스트
1. `http://localhost:3000/signup` 접속
2. **카카오 로그인** 버튼 클릭 (자동 회원가입)
3. 프로필이 자동 생성되는지 확인

### 4. 데이터베이스 확인
1. Supabase Dashboard > **Table Editor** > **profiles**
2. 카카오로 로그인한 사용자 데이터 확인:
   - `id`: Supabase Auth User ID
   - `email`: 카카오 이메일
   - `username`: 자동 생성된 고유 아이디
   - `nickname`: 카카오 닉네임

---

## 🚨 문제 해결

### 자주 발생하는 오류

#### 1. "OAuth 에러: invalid_client"
- **원인**: Client ID 또는 Client Secret 불일치
- **해결**: 카카오 개발자 콘솔에서 키 재확인

#### 2. "Redirect URI 불일치"
- **원인**: 등록된 Redirect URI와 실제 요청 URI 불일치
- **해결**: 카카오 콘솔과 Supabase에서 URI 재확인

#### 3. "Provider not enabled"
- **원인**: Supabase에서 Kakao Provider 비활성화
- **해결**: Supabase Dashboard에서 Kakao Provider 활성화

#### 4. 프로필 생성 실패
- **원인**: profiles 테이블 구조 문제 또는 권한 문제
- **해결**: RLS 정책 확인 및 테이블 스키마 점검

### 디버깅 팁
1. 브라우저 개발자 도구 > Network 탭에서 요청 확인
2. Supabase Dashboard > Auth > Users에서 사용자 생성 확인
3. 서버 콘솔 로그 확인 (`npm run dev` 실행 중)

---

## 🌟 추가 기능

### 로그인 상태에 따른 UI 변경
- 소셜 로그인 사용자는 비밀번호 변경 불가
- OAuth 계정 표시 배지
- 카카오 프로필 사진 연동 (선택사항)

### 보안 강화
- Client Secret 사용으로 보안 강화
- 로그인 시도 제한 (기존 기능과 연동)
- HTTPS 사용 (배포 환경)

---

## 📞 지원

설정 중 문제가 발생하면:
1. 이 문서의 **문제 해결** 섹션 참조
2. 카카오 개발자 문서: https://developers.kakao.com/docs
3. Supabase 문서: https://supabase.com/docs/guides/auth

---

*마지막 업데이트: 2024년 12월* 