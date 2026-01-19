# 텍스트 링크 호버 위반 목록

> 생성일: 2026-01-18

## 표준 패턴

```tsx
// 텍스트 링크 호버 (네비게이션, 인라인 링크)
hover:text-gray-900 dark:hover:text-[#F0F0F0] hover:underline transition-colors
```

---

## 수정 현황

- [x] 밑줄 없음 ✅ 전체 완료
  - [x] Footer.tsx ✅ 2026-01-18
  - [x] signin/page.client.tsx ✅ 2026-01-18
  - [x] signup/page.client.tsx ✅ 2026-01-18
  - [x] account-recovery/page.client.tsx ✅ 2026-01-18
- [x] Blue 호버 ✅ 전체 완료
  - [x] AuthSection.tsx ✅ 2026-01-18
- [x] 색상 불일치 - 전체 완료

---

## 1. 밑줄 없는 링크 (hover:underline 누락)

### 1.1 Footer.tsx ✅ 완료
- **경로**: `src/shared/components/Footer.tsx`
- **라인 50, 53**
```tsx
// Before
<Link href="/terms" className="hover:text-gray-900 dark:hover:text-[#F0F0F0] transition-colors">
<Link href="/privacy" className="hover:text-gray-900 dark:hover:text-[#F0F0F0] transition-colors">

// After (수정됨)
<Link href="/terms" className="hover:text-gray-900 dark:hover:text-[#F0F0F0] hover:underline transition-colors">
<Link href="/privacy" className="hover:text-gray-900 dark:hover:text-[#F0F0F0] hover:underline transition-colors">
```

### 1.2 signin/page.client.tsx ✅ 완료
- **경로**: `src/app/(auth)/signin/page.client.tsx`
- **라인 329, 333, 362, 392, 393** (전체 수정)
```tsx
// Before
hover:text-slate-800 (또는 hover:text-gray-700)

// After (수정됨)
hover:text-gray-900 dark:hover:text-[#F0F0F0] hover:underline transition-colors
```

### 1.3 signup/page.client.tsx ✅ 완료
- **경로**: `src/app/(auth)/signup/page.client.tsx`
- **라인 1299, 1308, 1309** (전체 수정)
```tsx
// Before
hover:text-slate-800 (또는 hover:text-gray-700)

// After (수정됨)
hover:text-gray-900 dark:hover:text-[#F0F0F0] hover:underline transition-colors
```

### 1.4 account-recovery/page.client.tsx ✅ 완료
- **경로**: `src/app/(auth)/help/account-recovery/page.client.tsx`
- **라인 513, 521, 522** (전체 수정)
```tsx
// Before
hover:text-slate-800 (또는 hover:text-gray-700)

// After (수정됨)
hover:text-gray-900 dark:hover:text-[#F0F0F0] hover:underline transition-colors
```

---

## 2. Blue 호버 사용 (blue-hover-violations.md 참조)

### 2.1 AuthSection.tsx ✅ 완료
- **경로**: `src/domains/sidebar/components/auth/AuthSection.tsx`
- **라인 24, 26, 28**
```tsx
// Before
<Link href="..." className="hover:underline dark:hover:text-blue-400">

// After (수정됨)
<Link href="..." className="hover:text-gray-900 dark:hover:text-[#F0F0F0] hover:underline transition-colors">
```

---

## 3. 색상 불일치 (slate vs gray)

> `hover:text-slate-800` → `hover:text-gray-900` 통일 권장

### 3.1 signin/page.client.tsx
- **라인 329, 333**: `hover:text-slate-800` → `hover:text-gray-900`

### 3.2 signup/page.client.tsx
- **라인 1299**: `hover:text-slate-800` → `hover:text-gray-900`

### 3.3 account-recovery/page.client.tsx
- **라인 513**: `hover:text-slate-800` → `hover:text-gray-900`

---

## 4. 이미 올바른 패턴 사용 중 ✅

| 파일 | 라인 |
|------|------|
| terms/page.tsx | 213, 216 |
| privacy/page.tsx | 265, 268 |
| reset-password/page.client.tsx | 184, 339 |
| account-found/page.client.tsx | 170 |
| RecentlyVisited.tsx | 67, 115 ✅ 수정완료 |

---

*마지막 업데이트: 2026-01-18*
