# 🎨 디자인 시스템 가이드

## 개요
이 프로젝트의 일관된 UI를 위한 디자인 시스템 문서입니다.

---

## 📦 컴포넌트

### Container

재사용 가능한 컨테이너 컴포넌트입니다.

#### 기본 사용법

```tsx
import { Container, ContainerHeader, ContainerTitle, ContainerContent } from '@/shared/components/ui';

<Container>
  <ContainerHeader>
    <ContainerTitle>제목</ContainerTitle>
  </ContainerHeader>
  <ContainerContent>
    내용
  </ContainerContent>
</Container>
```

#### 스타일
- **라이트모드**: `#FFFFFF` 배경, 테두리 없음
- **다크모드**: `#1D1D1D` 배경, 테두리 없음
- **라운드**: `rounded-lg`

---

### ContainerHeader

컨테이너의 헤더 영역입니다.

#### 스타일
- **라이트모드**: `#F5F5F5` 배경, 호버 시 `#EAEAEA`
- **다크모드**: `#262626` 배경, 호버 시 `#333333`
- **테두리**: 없음
- **호버 효과**: 부드러운 색상 전환

---

### Button

다양한 variant를 지원하는 버튼 컴포넌트입니다.

#### 기본 사용법

```tsx
import { Button } from '@/shared/components/ui';

// 기본 버튼 (흰색 배경 + 연한 테두리)
<Button>버튼</Button>

// Primary 버튼 (강조)
<Button variant="primary">확인</Button>

// 다른 variants
<Button variant="destructive">삭제</Button>
<Button variant="ghost">취소</Button>
<Button variant="outline">윤곽선</Button>
```

#### Variants

| Variant | 라이트모드 | 다크모드 | 용도 |
|---------|-----------|---------|------|
| `default` | 흰색 배경 + 연한 테두리 | `#262626` 배경 | 일반 버튼 |
| `primary` | `slate-800` 배경 | `slate-700` 배경 | 주요 액션 |
| `destructive` | 빨간색 배경 | 빨간색 배경 | 삭제/경고 |
| `ghost` | 투명 배경 | 투명 배경 | 서브 액션 |
| `outline` | 투명 + 테두리 | 투명 + 테두리 | 보조 버튼 |

#### Sizes

| Size | 높이 | 패딩 |
|------|------|------|
| `sm` | `h-9` | `px-3` |
| `default` | `h-10` | `px-4 py-2` |
| `lg` | `h-11` | `px-8` |
| `icon` | `h-10 w-10` | - |

---

### Card

카드 형식의 컨테이너입니다. Container와 동일한 색상 체계를 사용합니다.

#### 기본 사용법

```tsx
import { Card, CardHeader, CardTitle, CardContent } from '@/shared/components/ui';

<Card>
  <CardHeader>
    <CardTitle>카드 제목</CardTitle>
  </CardHeader>
  <CardContent>
    카드 내용
  </CardContent>
</Card>
```

---

## 🎨 색상 시스템

### 페이지 배경
- **라이트모드**: `#F8F9FA`
- **다크모드**: `#000000`

### 컨테이너
- **라이트모드**: `#FFFFFF`
- **다크모드**: `#1D1D1D`
- **테두리**: 없음

### 컨테이너 헤더
- **라이트모드**: `#F5F5F5` (호버: `#EAEAEA`)
- **다크모드**: `#262626` (호버: `#333333`)
- **테두리**: 없음

### 버튼
| 요소 | 라이트모드 | 다크모드 |
|------|-----------|---------|
| 배경 | `#FFFFFF` | `#262626` |
| 테두리 | `rgba(0,0,0,0.1)` | `rgba(255,255,255,0.1)` |
| 텍스트 | `#1F2937` | `#F0F0F0` |

### 텍스트
| 레벨 | 라이트모드 | 다크모드 |
|------|-----------|---------|
| Primary | `#111827` | `#F0F0F0` |
| Secondary | `#4B5563` | `#B4B4B4` |
| Tertiary | `#6B7280` | `#8C8C8C` |

---

## 📏 간격 시스템

### 컨테이너 간격
- 컨테이너 간 간격: `gap-2` (0.5rem)
- 컨테이너 패딩: `p-3` (0.75rem) 또는 `p-4` (1rem)

### 마진
- 컴포넌트 간 마진: `mb-2` (0.5rem)

---

## 🔄 마이그레이션 가이드

### 기존 코드에서 새 컴포넌트로 마이그레이션

#### Before
```tsx
<div className="bg-white dark:bg-[rgb(var(--bg-secondary))] rounded-lg border border-gray-200 dark:border-[rgb(var(--border-primary))]">
  <div className="px-3 py-2 border-b border-gray-200 bg-gray-50">
    <h3 className="text-sm font-bold text-gray-900">제목</h3>
  </div>
  <div className="px-3 py-2">
    내용
  </div>
</div>
```

#### After
```tsx
import { Container, ContainerHeader, ContainerTitle, ContainerContent } from '@/shared/components/ui';

<Container>
  <ContainerHeader>
    <ContainerTitle>제목</ContainerTitle>
  </ContainerHeader>
  <ContainerContent>
    내용
  </ContainerContent>
</Container>
```

---

## 🚀 시작하기

### 1. 디자인 토큰 import
```tsx
import { designTokens, tailwindClasses } from '@/shared/styles/design-tokens';
```

### 2. UI 컴포넌트 사용
```tsx
import { Container, Button } from '@/shared/components/ui';
```

### 3. 일관된 스타일 적용
모든 새로운 컴포넌트는 위의 UI 컴포넌트를 사용하여 일관성을 유지하세요.

---

## ✅ 체크리스트

새 컴포넌트를 만들 때:
- [ ] `Container` 사용하여 카드/박스 생성
- [ ] `ContainerHeader` 사용하여 헤더 영역 구성
- [ ] `Button` 컴포넌트 사용 (직접 스타일링 금지)
- [ ] 테두리 없음 (디자인 시스템 준수)
- [ ] 라이트/다크 모드 모두 테스트

---

## 📝 예시

완전한 예시 컴포넌트:

```tsx
import { Container, ContainerHeader, ContainerTitle, ContainerContent, Button } from '@/shared/components/ui';

export default function ExampleWidget() {
  return (
    <Container>
      <ContainerHeader>
        <ContainerTitle>예시 위젯</ContainerTitle>
      </ContainerHeader>
      <ContainerContent>
        <p className="text-gray-600 dark:text-[#B4B4B4] mb-4">
          이것은 예시 위젯입니다.
        </p>
        <div className="flex gap-2">
          <Button variant="primary">확인</Button>
          <Button variant="ghost">취소</Button>
        </div>
      </ContainerContent>
    </Container>
  );
}
```
