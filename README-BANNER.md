# 🎨 배너 관리 시스템 사용 가이드

## 📋 개요
와플보드 스타일의 배너 관리 시스템이 구현되었습니다. 관리자가 쉽게 배너를 관리할 수 있고, 다양한 위치와 타입을 지원합니다.

## 🚀 시작하기

### 1. 데이터베이스 테이블 생성
먼저 배너 테이블을 생성해야 합니다:

1. **관리자 권한으로 로그인**
2. `/admin/banners/init` 페이지 접속
3. 제공된 SQL 스크립트를 **Supabase Dashboard > SQL Editor**에서 실행

### 2. 배너 관리
테이블 생성 후:

1. `/admin/banners` 페이지에서 배너 관리
2. 다양한 배너 타입 추가 가능:
   - 🖼️ **이미지 배너**: 이미지 URL + 링크
   - 📝 **HTML 배너**: 구글 애드센스 등 HTML 코드
   - 📋 **빈 배너**: 플레이스홀더 상태
   - 🗳️ **투표 배너**: 추후 확장 예정

### 3. 배너 위치
다양한 위치에 배너 배치 가능:
- 헤더, 메인 상단/하단
- 본문 상단/하단
- 사이드바 상단/하단
- 좌우 여백, 팝업 등

## 💡 사용 방법

### 새 배너 위젯 사용하기
```tsx
import { BannerWidgetNew } from '@/domains/widgets/components';

// 메인 페이지 상단 배너
<BannerWidgetNew position="main_top" />

// 사이드바 배너
<BannerWidgetNew position="sidebar_top" />
```

### 기존 배너 위젯에서 전환
현재는 안정성을 위해 기존 배너 위젯을 사용하고 있습니다.
새 배너 위젯으로 전환하려면:

1. 배너 테이블 생성 완료
2. 테스트 후 `src/domains/widgets/components/index.ts`에서 export 변경:
   ```ts
   export { default as BannerWidget } from './banner-widget'; // 새 위젯
   ```

## 🔧 주요 기능

### 관리자 기능
- ✅ 배너 추가/수정/삭제
- ✅ 위치별 배너 관리
- ✅ 실시간 미리보기
- ✅ 활성화/비활성화 토글
- ✅ 순서 변경

### 사용자 기능
- ✅ 반응형 슬라이딩 배너
- ✅ 터치/스와이프 지원
- ✅ 자동 슬라이드 (8초 간격)
- ✅ 인디케이터 및 네비게이션
- ✅ 빈 배너 상태 표시

## 🛠️ 문제 해결

### 오류: "배너 조회 실패"
- **원인**: 배너 테이블이 생성되지 않음
- **해결**: `/admin/banners/init` 페이지에서 SQL 실행

### 오류: "중복 키"
- **원인**: 같은 키를 가진 배너 컴포넌트 중복
- **해결**: 이미 수정됨 (고유 키 생성)

### 관리자 권한 없음
- **원인**: 사용자가 관리자가 아님
- **해결**: `profiles` 테이블에서 `is_admin = true` 설정

## 📊 데이터베이스 구조

```sql
-- 배너 테이블
CREATE TABLE banners (
  id UUID PRIMARY KEY,
  position TEXT NOT NULL,  -- 배너 위치
  type TEXT NOT NULL,      -- 배너 타입
  title TEXT NOT NULL,     -- 제목
  subtitle TEXT,           -- 부제목
  image_url TEXT,          -- 이미지 URL
  link_url TEXT,           -- 링크 URL
  html_content TEXT,       -- HTML 코드
  background_color TEXT,   -- 배경색
  text_color TEXT,         -- 텍스트 색상
  is_active BOOLEAN,       -- 활성화 여부
  display_order INTEGER,   -- 표시 순서
  -- 기타 설정 필드들...
);
```

## 🎯 향후 계획

- [ ] 드래그 앤 드롭 순서 변경
- [ ] 배너 통계 및 클릭률 추적
- [ ] 배너 스케줄링 (시간별 표시)
- [ ] 더 많은 배너 타입 지원
- [ ] 배너 템플릿 시스템

## 📞 지원

문제가 발생하면:
1. 브라우저 콘솔에서 에러 메시지 확인
2. Supabase Dashboard에서 테이블 상태 확인
3. 관리자 권한 설정 확인

---

**즐거운 배너 관리 되세요! 🎉** 