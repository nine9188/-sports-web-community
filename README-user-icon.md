# 유저 아이콘 컴포넌트 사용 가이드

## 개요

`UserIcon` 컴포넌트는 사용자 아이콘을 표시하기 위한 공통 컴포넌트입니다. 이 컴포넌트는 다음과 같은 기능을 제공합니다:

- 사용자 지정 아이콘 또는 레벨 기반 기본 아이콘 표시
- 이미지 로드 실패 시 자동 fallback 처리
- 일관된 스타일링 및 UI 관리

## 장점

1. **일관성**: 모든 화면에서 동일한 방식으로 아이콘을 렌더링
2. **오류 처리**: 이미지 로드 실패 시 자동으로 레벨 기반 아이콘으로 대체
3. **간소화**: 반복적인 로직 제거 및 코드 중복 방지
4. **유지보수성**: UI 변경 시 한 곳에서만 수정 필요

## 사용법

```tsx
// 기본 사용법
<UserIcon 
  iconUrl={iconUrl}  // 사용자 아이콘 URL (null/undefined면 레벨 아이콘 사용)
  level={userLevel}  // 사용자 레벨 (fallback 아이콘 결정에 사용)
  size={32}          // 아이콘 크기 (픽셀)
  alt="프로필 이미지"  // 대체 텍스트
  className="custom-class" // 추가 CSS 클래스
/>

// 레벨 아이콘만 표시
<UserIcon level={5} />

// 커스텀 아이콘 표시
<UserIcon iconUrl="https://example.com/icon.png" level={2} />
```

## Props

| Prop | 타입 | 기본값 | 설명 |
|------|------|--------|------|
| `iconUrl` | `string \| null \| undefined` | `undefined` | 사용자 아이콘 URL |
| `level` | `number` | `1` | 사용자 레벨 (fallback 아이콘 결정에 사용) |
| `size` | `number` | `20` | 아이콘 크기 (픽셀) |
| `alt` | `string` | `'유저 아이콘'` | 대체 텍스트 |
| `className` | `string` | `''` | 추가 CSS 클래스 |
| `priority` | `boolean` | `false` | 이미지 우선순위 (Next.js Image 컴포넌트 옵션) |

## 구현 상세

- `useState`를 사용하여 이미지 로드 오류 상태 추적
- 오류 발생 시 `getFallbackIconUrl` 함수를 사용하여 대체 아이콘 URL 결정
- 사용자가 지정한 아이콘이 없으면 `getLevelIconUrl` 함수를 사용하여 레벨 기반 아이콘 표시

## 관련 파일

- `src/shared/components/UserIcon.tsx`: 컴포넌트 구현
- `src/shared/utils/user-icons.ts`: 아이콘 관련 유틸리티 함수
- `src/shared/utils/level-icons.ts`: 레벨 아이콘 관련 유틸리티 함수
- `src/shared/context/IconContext.tsx`: 로그인한 사용자의 아이콘 상태 관리

## 참고

이 컴포넌트는 다음 위치에서 사용됩니다:

1. 프로필 드롭다운 (ProfileDropdown.tsx)
2. 헤더 프로필 표시 (HeaderClient.tsx)
3. 아이콘 설정 화면 (IconForm.tsx)
4. 댓글 목록 및 포스트 내 사용자 표시
5. 기타 사용자 프로필 표시 영역 