# 닉네임 변경권 구현 문서

## 1. 개요

### 1.1 기능 설명
- 사용자는 샵에서 **닉네임 변경권**을 포인트로 구매
- 구매한 변경권을 사용하여 닉네임을 변경
- 변경권은 **1회용 소모품** (사용 시 인벤토리에서 삭제)

### 1.2 현재 시스템 상태
| 항목 | 상태 | 비고 |
|------|------|------|
| 샵 시스템 | ✅ 구현됨 | 아이템 구매, 인벤토리 관리 |
| 닉네임 필드 | ✅ 존재 | profiles.nickname (현재 변경 불가) |
| 프로필 알림 | ✅ 구현됨 | profile_update 타입 존재 |
| 소모품 시스템 | ❌ 미구현 | 새로 구현 필요 |

---

## 2. 데이터베이스 설계

### 2.1 shop_items 테이블 수정

```sql
-- 소모품 여부 컬럼 추가
ALTER TABLE shop_items
ADD COLUMN is_consumable BOOLEAN DEFAULT false;

-- 소모품 타입 (향후 확장용)
ALTER TABLE shop_items
ADD COLUMN consumable_type VARCHAR(50) DEFAULT NULL;

COMMENT ON COLUMN shop_items.is_consumable IS '소모품 여부 (true: 1회용, false: 영구)';
COMMENT ON COLUMN shop_items.consumable_type IS '소모품 타입 (nickname_change, etc.)';
```

### 2.2 아이템 사용 기록 테이블 (신규)

```sql
CREATE TABLE item_usage_log (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  item_id INTEGER NOT NULL REFERENCES shop_items(id),
  user_item_id UUID NOT NULL,  -- 사용된 user_items.id
  used_at TIMESTAMPTZ DEFAULT NOW(),
  usage_type VARCHAR(50) NOT NULL,  -- 'nickname_change', etc.
  usage_details JSONB DEFAULT '{}'::jsonb,  -- 변경 전/후 값 등

  CONSTRAINT item_usage_log_usage_type_check
    CHECK (usage_type IN ('nickname_change', 'other'))
);

-- 인덱스
CREATE INDEX idx_item_usage_log_user_id ON item_usage_log(user_id);
CREATE INDEX idx_item_usage_log_item_id ON item_usage_log(item_id);
CREATE INDEX idx_item_usage_log_used_at ON item_usage_log(used_at DESC);

-- RLS 정책
ALTER TABLE item_usage_log ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own usage log"
  ON item_usage_log FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "System can insert usage log"
  ON item_usage_log FOR INSERT
  WITH CHECK (true);
```

### 2.3 닉네임 변경권 아이템 등록

```sql
-- 카테고리 추가 (없으면)
INSERT INTO shop_categories (name, slug, display_order, parent_id)
VALUES ('특수 아이템', 'special', 100, NULL)
ON CONFLICT (slug) DO NOTHING;

-- 닉네임 변경권 아이템 등록
INSERT INTO shop_items (
  name,
  description,
  price,
  category_id,
  tier,
  is_active,
  is_consumable,
  consumable_type,
  image_url
) VALUES (
  '닉네임 변경권',
  '닉네임을 1회 변경할 수 있는 티켓입니다. 사용 후 소멸됩니다.',
  5000,  -- 가격 (조정 가능)
  (SELECT id FROM shop_categories WHERE slug = 'special'),
  'rare',
  true,
  true,
  'nickname_change',
  '/images/shop/nickname-ticket.png'  -- 아이콘 이미지
);
```

---

## 3. 백엔드 구현

### 3.1 타입 정의

**파일: `src/domains/shop/types/index.ts`**

```typescript
// 기존 ShopItem 타입 확장
export interface ShopItem {
  id: number;
  name: string;
  description: string;
  image_url: string;
  price: number;
  category_id: number;
  tier: ItemTier;
  is_active: boolean;
  is_default: boolean;
  created_at: string;
  // 새로 추가
  is_consumable: boolean;
  consumable_type: ConsumableType | null;
}

export type ConsumableType = 'nickname_change' | 'other';

export interface ItemUsageLog {
  id: string;
  user_id: string;
  item_id: number;
  user_item_id: string;
  used_at: string;
  usage_type: ConsumableType;
  usage_details: Record<string, unknown>;
}
```

### 3.2 닉네임 변경권 사용 액션

**파일: `src/domains/shop/actions/consumables.ts`**

```typescript
'use server';

import { getSupabaseServer } from '@/shared/lib/supabase/server';
import { revalidatePath } from 'next/cache';
import { createProfileUpdateNotification } from '@/domains/notifications/actions/create';

interface UseNicknameTicketResult {
  success: boolean;
  error?: string;
  newNickname?: string;
}

/**
 * 닉네임 변경권 사용
 */
export async function useNicknameTicket(
  newNickname: string
): Promise<UseNicknameTicketResult> {
  try {
    const supabase = await getSupabaseServer();

    // 1. 현재 사용자 확인
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      return { success: false, error: '로그인이 필요합니다.' };
    }

    // 2. 닉네임 유효성 검사
    const trimmedNickname = newNickname.trim();
    if (trimmedNickname.length < 2) {
      return { success: false, error: '닉네임은 최소 2자 이상이어야 합니다.' };
    }
    if (trimmedNickname.length > 20) {
      return { success: false, error: '닉네임은 최대 20자까지 가능합니다.' };
    }

    // 금지어 체크 (필요시)
    const forbiddenWords = ['admin', '관리자', '운영자'];
    if (forbiddenWords.some(word => trimmedNickname.toLowerCase().includes(word))) {
      return { success: false, error: '사용할 수 없는 닉네임입니다.' };
    }

    // 3. 닉네임 중복 체크
    const { data: existingUser } = await supabase
      .from('profiles')
      .select('id')
      .eq('nickname', trimmedNickname)
      .neq('id', user.id)
      .maybeSingle();

    if (existingUser) {
      return { success: false, error: '이미 사용 중인 닉네임입니다.' };
    }

    // 4. 닉네임 변경권 보유 확인
    const { data: ownedTicket, error: ticketError } = await supabase
      .from('user_items')
      .select(`
        id,
        item_id,
        shop_items!inner (
          id,
          name,
          is_consumable,
          consumable_type
        )
      `)
      .eq('user_id', user.id)
      .eq('shop_items.consumable_type', 'nickname_change')
      .limit(1)
      .maybeSingle();

    if (ticketError || !ownedTicket) {
      return { success: false, error: '닉네임 변경권이 없습니다. 샵에서 구매해주세요.' };
    }

    // 5. 현재 닉네임 조회
    const { data: profile } = await supabase
      .from('profiles')
      .select('nickname')
      .eq('id', user.id)
      .single();

    const oldNickname = profile?.nickname || '';

    // 6. 트랜잭션: 닉네임 변경 + 티켓 소모
    // 6-1. 닉네임 업데이트
    const { error: updateError } = await supabase
      .from('profiles')
      .update({
        nickname: trimmedNickname,
        updated_at: new Date().toISOString()
      })
      .eq('id', user.id);

    if (updateError) {
      return { success: false, error: '닉네임 변경에 실패했습니다.' };
    }

    // 6-2. 사용 기록 저장
    await supabase
      .from('item_usage_log')
      .insert({
        user_id: user.id,
        item_id: ownedTicket.item_id,
        user_item_id: ownedTicket.id,
        usage_type: 'nickname_change',
        usage_details: {
          old_nickname: oldNickname,
          new_nickname: trimmedNickname
        }
      });

    // 6-3. 티켓 삭제 (소모)
    const { error: deleteError } = await supabase
      .from('user_items')
      .delete()
      .eq('id', ownedTicket.id);

    if (deleteError) {
      // 롤백: 닉네임 원복
      await supabase
        .from('profiles')
        .update({ nickname: oldNickname })
        .eq('id', user.id);
      return { success: false, error: '티켓 사용 처리에 실패했습니다.' };
    }

    // 7. 알림 생성
    await createProfileUpdateNotification({
      userId: user.id,
      changeType: 'nickname',
      oldValue: oldNickname,
      newValue: trimmedNickname
    });

    // 8. 캐시 갱신
    revalidatePath('/settings/profile');
    revalidatePath('/shop');

    return {
      success: true,
      newNickname: trimmedNickname
    };

  } catch (error) {
    console.error('닉네임 변경권 사용 오류:', error);
    return { success: false, error: '서버 오류가 발생했습니다.' };
  }
}

/**
 * 사용자의 닉네임 변경권 보유 여부 확인
 */
export async function hasNicknameTicket(): Promise<boolean> {
  try {
    const supabase = await getSupabaseServer();

    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return false;

    const { data, error } = await supabase
      .from('user_items')
      .select(`
        id,
        shop_items!inner (consumable_type)
      `)
      .eq('user_id', user.id)
      .eq('shop_items.consumable_type', 'nickname_change')
      .limit(1)
      .maybeSingle();

    return !error && !!data;
  } catch {
    return false;
  }
}

/**
 * 사용자의 닉네임 변경권 개수 조회
 */
export async function getNicknameTicketCount(): Promise<number> {
  try {
    const supabase = await getSupabaseServer();

    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return 0;

    const { count, error } = await supabase
      .from('user_items')
      .select(`
        id,
        shop_items!inner (consumable_type)
      `, { count: 'exact', head: true })
      .eq('user_id', user.id)
      .eq('shop_items.consumable_type', 'nickname_change');

    return error ? 0 : (count || 0);
  } catch {
    return 0;
  }
}
```

### 3.3 RPC 함수 (선택사항 - 트랜잭션 보장)

더 안전한 트랜잭션을 위해 PostgreSQL 함수 사용:

```sql
CREATE OR REPLACE FUNCTION use_nickname_ticket(
  p_user_id UUID,
  p_new_nickname TEXT
) RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_ticket_id UUID;
  v_item_id INTEGER;
  v_old_nickname TEXT;
  v_result JSONB;
BEGIN
  -- 1. 현재 닉네임 조회
  SELECT nickname INTO v_old_nickname
  FROM profiles WHERE id = p_user_id;

  -- 2. 닉네임 중복 체크
  IF EXISTS (
    SELECT 1 FROM profiles
    WHERE nickname = p_new_nickname AND id != p_user_id
  ) THEN
    RETURN jsonb_build_object(
      'success', false,
      'error', '이미 사용 중인 닉네임입니다.'
    );
  END IF;

  -- 3. 변경권 보유 확인
  SELECT ui.id, ui.item_id INTO v_ticket_id, v_item_id
  FROM user_items ui
  JOIN shop_items si ON ui.item_id = si.id
  WHERE ui.user_id = p_user_id
    AND si.consumable_type = 'nickname_change'
  LIMIT 1
  FOR UPDATE;  -- 락 획득

  IF v_ticket_id IS NULL THEN
    RETURN jsonb_build_object(
      'success', false,
      'error', '닉네임 변경권이 없습니다.'
    );
  END IF;

  -- 4. 닉네임 변경
  UPDATE profiles
  SET nickname = p_new_nickname, updated_at = NOW()
  WHERE id = p_user_id;

  -- 5. 사용 기록 저장
  INSERT INTO item_usage_log (user_id, item_id, user_item_id, usage_type, usage_details)
  VALUES (
    p_user_id,
    v_item_id,
    v_ticket_id,
    'nickname_change',
    jsonb_build_object('old_nickname', v_old_nickname, 'new_nickname', p_new_nickname)
  );

  -- 6. 티켓 삭제
  DELETE FROM user_items WHERE id = v_ticket_id;

  RETURN jsonb_build_object(
    'success', true,
    'old_nickname', v_old_nickname,
    'new_nickname', p_new_nickname
  );
END;
$$;
```

---

## 4. 프론트엔드 구현

### 4.1 닉네임 변경 모달 컴포넌트

**파일: `src/domains/settings/components/profile/NicknameChangeModal.tsx`**

```tsx
'use client';

import { useState } from 'react';
import { X, Ticket, AlertCircle, Check } from 'lucide-react';
import { useNicknameTicket } from '@/domains/shop/actions/consumables';
import { toast } from 'react-toastify';

interface NicknameChangeModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentNickname: string;
  ticketCount: number;
  onSuccess: (newNickname: string) => void;
}

export default function NicknameChangeModal({
  isOpen,
  onClose,
  currentNickname,
  ticketCount,
  onSuccess
}: NicknameChangeModalProps) {
  const [newNickname, setNewNickname] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (newNickname.trim().length < 2) {
      setError('닉네임은 최소 2자 이상이어야 합니다.');
      return;
    }

    if (newNickname.trim() === currentNickname) {
      setError('현재 닉네임과 동일합니다.');
      return;
    }

    setIsSubmitting(true);

    try {
      const result = await useNicknameTicket(newNickname.trim());

      if (result.success) {
        toast.success('닉네임이 변경되었습니다!');
        onSuccess(result.newNickname!);
        onClose();
      } else {
        setError(result.error || '닉네임 변경에 실패했습니다.');
      }
    } catch {
      setError('서버 오류가 발생했습니다.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      {/* 배경 오버레이 */}
      <div
        className="absolute inset-0 bg-black/50"
        onClick={onClose}
      />

      {/* 모달 */}
      <div className="relative bg-white dark:bg-[#1D1D1D] rounded-lg shadow-xl w-full max-w-md mx-4 p-6">
        {/* 헤더 */}
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <Ticket className="h-5 w-5 text-blue-500" />
            <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
              닉네임 변경
            </h2>
          </div>
          <button
            onClick={onClose}
            className="p-1 hover:bg-gray-100 dark:hover:bg-gray-800 rounded"
          >
            <X className="h-5 w-5 text-gray-500" />
          </button>
        </div>

        {/* 보유 티켓 안내 */}
        <div className="mb-4 p-3 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
          <div className="flex items-center gap-2 text-sm text-blue-700 dark:text-blue-300">
            <Ticket className="h-4 w-4" />
            <span>보유 변경권: <strong>{ticketCount}개</strong></span>
          </div>
          <p className="text-xs text-blue-600 dark:text-blue-400 mt-1">
            변경 시 1개가 소모됩니다.
          </p>
        </div>

        {/* 폼 */}
        <form onSubmit={handleSubmit}>
          {/* 현재 닉네임 */}
          <div className="mb-4">
            <label className="block text-xs text-gray-500 dark:text-gray-400 mb-1">
              현재 닉네임
            </label>
            <div className="px-3 py-2 bg-gray-100 dark:bg-gray-800 rounded text-gray-700 dark:text-gray-300">
              {currentNickname}
            </div>
          </div>

          {/* 새 닉네임 */}
          <div className="mb-4">
            <label className="block text-xs text-gray-500 dark:text-gray-400 mb-1">
              새 닉네임
            </label>
            <input
              type="text"
              value={newNickname}
              onChange={(e) => setNewNickname(e.target.value)}
              placeholder="새 닉네임을 입력하세요"
              maxLength={20}
              className="w-full px-3 py-2 border border-gray-200 dark:border-gray-700 rounded bg-white dark:bg-[#2D2D2D] text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
            <p className="text-xs text-gray-400 mt-1">
              2~20자, 특수문자 제한
            </p>
          </div>

          {/* 에러 메시지 */}
          {error && (
            <div className="mb-4 p-3 bg-red-50 dark:bg-red-900/20 rounded-lg flex items-center gap-2 text-sm text-red-600 dark:text-red-400">
              <AlertCircle className="h-4 w-4 flex-shrink-0" />
              {error}
            </div>
          )}

          {/* 버튼 */}
          <div className="flex gap-2">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 px-4 py-2 border border-gray-200 dark:border-gray-700 rounded text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-800"
            >
              취소
            </button>
            <button
              type="submit"
              disabled={isSubmitting || !newNickname.trim()}
              className="flex-1 px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
            >
              {isSubmitting ? (
                <>
                  <span className="animate-spin">⏳</span>
                  변경 중...
                </>
              ) : (
                <>
                  <Check className="h-4 w-4" />
                  변경하기
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
```

### 4.2 프로필 폼 수정

**파일: `src/domains/settings/components/profile/ProfileForm.tsx`**

닉네임 필드 옆에 변경 버튼 추가:

```tsx
// 기존 import에 추가
import { useState, useEffect } from 'react';
import { Ticket, Edit2 } from 'lucide-react';
import NicknameChangeModal from './NicknameChangeModal';
import { getNicknameTicketCount } from '@/domains/shop/actions/consumables';

// 컴포넌트 내부에 추가
const [isModalOpen, setIsModalOpen] = useState(false);
const [ticketCount, setTicketCount] = useState(0);
const [nickname, setNickname] = useState(profileData.nickname);

useEffect(() => {
  getNicknameTicketCount().then(setTicketCount);
}, []);

// 닉네임 필드 렌더링 부분 수정
<div className="space-y-1">
  <label className="block text-xs text-gray-500 dark:text-gray-400">
    닉네임
  </label>
  <div className="flex items-center gap-2">
    <div className="flex-1 px-3 py-2 bg-gray-100 dark:bg-gray-800 rounded text-gray-700 dark:text-gray-300">
      {nickname}
    </div>
    {ticketCount > 0 ? (
      <button
        onClick={() => setIsModalOpen(true)}
        className="flex items-center gap-1.5 px-3 py-2 bg-blue-500 text-white text-sm rounded hover:bg-blue-600 transition-colors"
      >
        <Edit2 className="h-4 w-4" />
        변경
      </button>
    ) : (
      <a
        href="/shop?category=special"
        className="flex items-center gap-1.5 px-3 py-2 border border-gray-200 dark:border-gray-700 text-gray-600 dark:text-gray-400 text-sm rounded hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors"
      >
        <Ticket className="h-4 w-4" />
        구매
      </a>
    )}
  </div>
  <p className="text-xs text-gray-400">
    {ticketCount > 0
      ? `변경권 ${ticketCount}개 보유 중`
      : '샵에서 닉네임 변경권을 구매하면 변경할 수 있습니다.'
    }
  </p>
</div>

{/* 모달 */}
<NicknameChangeModal
  isOpen={isModalOpen}
  onClose={() => setIsModalOpen(false)}
  currentNickname={nickname}
  ticketCount={ticketCount}
  onSuccess={(newNickname) => {
    setNickname(newNickname);
    setTicketCount(prev => prev - 1);
  }}
/>
```

### 4.3 샵 아이템 카드 (소모품 표시)

**파일: `src/domains/shop/components/ItemCard.tsx`**

소모품 배지 추가:

```tsx
// 아이템 카드에 소모품 뱃지 추가
{item.is_consumable && (
  <span className="absolute top-2 right-2 px-1.5 py-0.5 bg-orange-100 dark:bg-orange-900/30 text-orange-700 dark:text-orange-400 text-[10px] font-medium rounded">
    1회용
  </span>
)}
```

---

## 5. UI/UX 플로우

### 5.1 사용자 플로우

```
[프로필 설정 페이지]
      │
      ├─ 변경권 없음 ──→ [구매] 버튼 ──→ 샵 페이지로 이동
      │
      └─ 변경권 있음 ──→ [변경] 버튼 ──→ 닉네임 변경 모달
                                              │
                                              ├─ 새 닉네임 입력
                                              │
                                              ├─ 유효성 검사
                                              │   ├─ 2~20자
                                              │   ├─ 중복 체크
                                              │   └─ 금지어 체크
                                              │
                                              └─ 변경 완료
                                                  ├─ 티켓 1개 소모
                                                  ├─ 알림 생성
                                                  └─ 토스트 메시지
```

### 5.2 샵 구매 플로우

```
[샵 페이지] ──→ [특수 아이템] 카테고리
                     │
                     └─ 닉네임 변경권 (5000P)
                            │
                            ├─ "1회용" 뱃지 표시
                            │
                            └─ 구매 ──→ 인벤토리에 추가
                                         │
                                         └─ 프로필 설정에서 사용 가능
```

---

## 6. 구현 체크리스트

### Phase 1: 데이터베이스
- [ ] shop_items에 is_consumable, consumable_type 컬럼 추가
- [ ] item_usage_log 테이블 생성
- [ ] RLS 정책 설정
- [ ] 닉네임 변경권 아이템 등록
- [ ] (선택) use_nickname_ticket RPC 함수 생성

### Phase 2: 백엔드
- [ ] ShopItem 타입 확장
- [ ] useNicknameTicket 액션 구현
- [ ] hasNicknameTicket 액션 구현
- [ ] getNicknameTicketCount 액션 구현

### Phase 3: 프론트엔드
- [ ] NicknameChangeModal 컴포넌트 생성
- [ ] ProfileForm에 변경 버튼 추가
- [ ] 샵 ItemCard에 소모품 뱃지 추가
- [ ] 토스트/알림 연동

### Phase 4: 테스트
- [ ] 변경권 구매 테스트
- [ ] 닉네임 변경 테스트
- [ ] 중복 닉네임 거부 테스트
- [ ] 변경권 소모 확인
- [ ] 알림 생성 확인

---

## 7. 추가 고려사항

### 7.1 닉네임 변경 제한
- 변경 후 쿨다운 (예: 30일 내 재변경 불가)
- 변경 기록 표시 (프로필에 "N번째 닉네임" 등)

### 7.2 가격 정책
- 기본 가격: 5,000P (조정 가능)
- 이벤트 할인: 50% 등
- 레벨별 차등 가격

### 7.3 관리자 기능
- 닉네임 변경 기록 조회
- 부적절한 닉네임 강제 변경
- 변경권 지급 (이벤트)

### 7.4 보안
- 금지어 필터링
- 특수문자 제한
- 연속 숫자/문자 제한
- 기존 사용자 닉네임 사칭 방지

---

## 8. 파일 구조

```
src/
├── domains/
│   ├── shop/
│   │   ├── actions/
│   │   │   ├── actions.ts          # 기존 구매 로직
│   │   │   └── consumables.ts      # 소모품 사용 로직 (신규)
│   │   ├── types/
│   │   │   └── index.ts            # 타입 확장
│   │   └── components/
│   │       └── ItemCard.tsx        # 소모품 뱃지 추가
│   │
│   └── settings/
│       └── components/
│           └── profile/
│               ├── ProfileForm.tsx           # 변경 버튼 추가
│               └── NicknameChangeModal.tsx   # 신규 모달
│
└── supabase/
    └── migrations/
        └── YYYYMMDD_nickname_ticket.sql      # DB 마이그레이션
```
