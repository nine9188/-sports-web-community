# 📦 자체 구현을 위한 패키지 설치

## 필수 패키지

### 1. Resend (이메일 발송)
```bash
npm install resend
npm install --save-dev @types/node
```

### 2. 환경 변수 설정
`.env.local` 파일에 추가:
```env
# Resend API Key (https://resend.com/api-keys에서 생성)
RESEND_API_KEY=re_xxxxxxxxxxxxxxxxxxxxxxxxx

# 사이트 URL
NEXT_PUBLIC_SITE_URL=https://your-domain.com
```

## 데이터베이스 테이블 추가

### verification_codes 테이블 생성
```sql
CREATE TABLE verification_codes (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  email VARCHAR(255) NOT NULL,
  code VARCHAR(255) NOT NULL,
  type VARCHAR(50) NOT NULL CHECK (type IN ('id_recovery', 'password_reset')),
  expires_at TIMESTAMP WITH TIME ZONE NOT NULL,
  used BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 인덱스 추가
CREATE INDEX idx_verification_codes_email_type ON verification_codes(email, type);
CREATE INDEX idx_verification_codes_code ON verification_codes(code);
CREATE INDEX idx_verification_codes_expires_at ON verification_codes(expires_at);
```

## 대안 이메일 서비스

### Nodemailer (SMTP 사용)
```bash
npm install nodemailer
npm install --save-dev @types/nodemailer
```

### 환경 변수 (Gmail SMTP 예시)
```env
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=your-email@gmail.com
SMTP_PASS=your-app-password
```

## 개발 모드 설정

현재 구현은 개발용으로 콘솔에 인증코드와 재설정 링크를 출력합니다.
실제 배포 시에는 다음 부분들을 제거하세요:

1. `actions-custom.ts`의 `console.log` 및 `debugCode`, `debugUrl`
2. `account-recovery/page.tsx`의 개발용 토스트 메시지

## 보안 고려사항

1. **Rate Limiting**: 인증 코드 발송 횟수 제한
2. **IP 제한**: 동일 IP에서 과도한 요청 방지
3. **로그 관리**: 민감한 정보 로그 제거
4. **토큰 암호화**: 필요시 토큰 암호화 추가

## 사용법

1. 패키지 설치
2. 환경 변수 설정
3. 데이터베이스 테이블 생성
4. Resend 도메인 설정 (실제 도메인 사용 시)
5. 이메일 템플릿 커스터마이징 