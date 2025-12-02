
⸻


# 🧭 Spacing(간격) 관리 가이드라인

## 🎯 문제
- 현재 `mt-4`, `mb-4` 같은 마진 유틸리티가 **페이지 레벨**, **컴포넌트 내부** 양쪽에 중복 적용됨
- 그 결과:
  - 헤더와 첫 컴포넌트가 붙거나
  - 마지막 컴포넌트와 푸터가 붙는 문제 발생
  - 간격이 들쭉날쭉하여 유지보수 어려움

---

## ✅ 원칙

### 1. Layout(main 영역)에서만 간격 관리
- `space-y-*` 유틸리티 사용
- `main`에 `py-*`로 상하 기본 여백 지정

```tsx
export default function Layout({ children }) {
  return (
    <div className="flex flex-col min-h-screen">
      <Header />
      <main className="flex-1 space-y-4 py-4">
        {children}
      </main>
      <Footer />
    </div>
  )
}


⸻

2. 컴포넌트 자체는 margin 금지
	•	컴포넌트는 padding 중심으로만 스타일링
	•	margin은 부모 레이아웃에서만 제어

function Card({ children }) {
  return (
    <div className="p-4 rounded-lg border">
      {children}
    </div>
  )
}


⸻

3. 특수 페이지에서만 Override
	•	다른 간격이 필요하다면 부모 컨테이너에서만 조절

<div className="space-y-8">
  <Card />
  <Card />
</div>


⸻

4. 첫/마지막 요소 간격 문제 해결
	•	main 자체에 py-4 적용
	•	헤더/푸터와의 붙는 현상 방지

⸻

📌 정리
	•	Layout(main) → space-y, py로 전역 간격 통일
	•	Component → margin 제거, padding 위주 스타일
	•	Page 특수 케이스 → 부모 컨테이너에서만 override

---
