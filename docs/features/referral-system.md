# 추천인 시스템 기획

> **상태**: 기획 완료
> **작성일**: 2026-01-02

## 개요

기존 회원이 새로운 회원을 추천하면 양쪽 모두에게 보상을 지급하는 시스템.
기존 `public_id`를 추천 코드로 활용하여 구현 복잡도를 낮춤.

## 핵심 기능

### 1. 추천 코드

- 기존 `profiles.public_id` 사용 (예: `b7ed56d6`)
- 8자리 고유 코드, 이미 모든 유저에게 존재
- 프로필 페이지에서 확인 및 복사 가능

### 2. 추천 흐름

```
1. 기존 회원 A가 추천 코드(public_id) 공유
   - 프로필 URL: /user/b7ed56d6
   - 또는 코드만: b7ed56d6
2. 신규 회원 B가 회원가입 시 추천 코드 입력
3. B가 회원가입 완료 → A, B 모두 보상 지급
```

### 3. 보상 구조

| 대상 | 보상 | 조건 |
|------|------|------|
| 추천인 (A) | 500 P + 100 XP | 추천한 회원이 가입 완료 |
| 피추천인 (B) | 300 P + 50 XP | 회원가입 시 추천 코드 입력 |

### 4. 추가 보상 (마일스톤)

피추천인이 활동을 시작하면 추천인에게 추가 보상:

| 조건 | 추천인 보상 |
|------|------------|
| 첫 게시글 작성 | +200 P |
| 첫 댓글 작성 | +100 P |
| 7일 연속 출석 | +500 P |

## 제한 사항

### 남용 방지

| 제한 | 값 |
|------|-----|
| 일일 추천 성공 횟수 | 5명 |
| 월간 추천 성공 횟수 | 30명 |
| 총 추천 가능 횟수 | 무제한 |
| 자기 추천 | 불가 |

### 보상 지급 조건

- 피추천인이 회원가입 완료해야 보상 지급
- 중복 계정으로 판단되면 보상 회수 가능

---

## 데이터베이스 설계

### 1. profiles 테이블 확장

```sql
-- 추천인 ID와 추천 횟수만 추가 (public_id는 이미 존재)
ALTER TABLE profiles ADD COLUMN referred_by UUID REFERENCES profiles(id);
ALTER TABLE profiles ADD COLUMN referral_count INT DEFAULT 0;
```

### 2. referrals 테이블 (추천 기록)

```sql
CREATE TABLE referrals (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  referrer_id UUID NOT NULL REFERENCES profiles(id),  -- 추천인
  referee_id UUID NOT NULL REFERENCES profiles(id),   -- 피추천인
  status VARCHAR(20) DEFAULT 'completed',  -- completed, cancelled
  referrer_reward_points INT DEFAULT 500,
  referrer_reward_exp INT DEFAULT 100,
  referee_reward_points INT DEFAULT 300,
  referee_reward_exp INT DEFAULT 50,
  created_at TIMESTAMPTZ DEFAULT NOW(),

  UNIQUE(referee_id)  -- 한 사람은 한 번만 추천받을 수 있음
);

-- 인덱스
CREATE INDEX idx_referrals_referrer ON referrals(referrer_id);
CREATE INDEX idx_referrals_referee ON referrals(referee_id);
```

### 3. referral_milestones 테이블 (추가 보상 추적)

```sql
CREATE TABLE referral_milestones (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  referral_id UUID NOT NULL REFERENCES referrals(id),
  milestone_type VARCHAR(50) NOT NULL,  -- first_post, first_comment, 7day_streak
  reward_points INT NOT NULL,
  reward_exp INT NOT NULL,
  achieved_at TIMESTAMPTZ DEFAULT NOW(),

  UNIQUE(referral_id, milestone_type)
);

CREATE INDEX idx_referral_milestones_referral ON referral_milestones(referral_id);
```

### 4. RLS 정책

```sql
-- referrals
ALTER TABLE referrals ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own referrals"
  ON referrals FOR SELECT
  USING (auth.uid() = referrer_id OR auth.uid() = referee_id);

CREATE POLICY "System can insert referrals"
  ON referrals FOR INSERT
  WITH CHECK (true);

-- referral_milestones
ALTER TABLE referral_milestones ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own milestones"
  ON referral_milestones FOR SELECT
  USING (
    referral_id IN (
      SELECT id FROM referrals
      WHERE referrer_id = auth.uid() OR referee_id = auth.uid()
    )
  );
```

---

## 구현 상세

### 1. 추천 코드 검증

**파일**: `src/domains/referral/actions/validate.ts`

```typescript
'use server';

import { getSupabaseServer } from '@/shared/lib/supabase/server';

export async function validateReferralCode(code: string) {
  const supabase = await getSupabaseServer();

  const { data } = await supabase
    .from('profiles')
    .select('id, nickname, public_id')
    .eq('public_id', code.toLowerCase())
    .single();

  if (!data) {
    return { valid: false, error: '유효하지 않은 추천 코드입니다.' };
  }

  return { valid: true, referrerId: data.id, referrerNickname: data.nickname };
}
```

### 2. 추천 처리 로직

**파일**: `src/domains/referral/actions/process.ts`

```typescript
'use server';

import { getSupabaseServer } from '@/shared/lib/supabase/server';

const REFERRAL_REWARDS = {
  referrer: { points: 500, exp: 100 },
  referee: { points: 300, exp: 50 },
};

export async function processReferral(
  refereeId: string,
  referrerPublicId: string
): Promise<{ success: boolean; error?: string }> {
  const supabase = await getSupabaseServer();

  // 1. public_id로 추천인 찾기
  const { data: referrer } = await supabase
    .from('profiles')
    .select('id, referral_count')
    .eq('public_id', referrerPublicId.toLowerCase())
    .single();

  if (!referrer) {
    return { success: false, error: '유효하지 않은 추천 코드입니다.' };
  }

  // 2. 자기 추천 방지
  if (referrer.id === refereeId) {
    return { success: false, error: '자신을 추천할 수 없습니다.' };
  }

  // 3. 이미 추천받은 사용자인지 확인
  const { data: existingReferral } = await supabase
    .from('referrals')
    .select('id')
    .eq('referee_id', refereeId)
    .single();

  if (existingReferral) {
    return { success: false, error: '이미 추천을 받은 계정입니다.' };
  }

  // 4. 일일 제한 확인
  const today = new Date().toISOString().split('T')[0];
  const { count } = await supabase
    .from('referrals')
    .select('*', { count: 'exact', head: true })
    .eq('referrer_id', referrer.id)
    .gte('created_at', `${today}T00:00:00`);

  if (count && count >= 5) {
    return { success: false, error: '추천인의 일일 추천 한도가 초과되었습니다.' };
  }

  // 5. 추천 기록 생성
  const { error: insertError } = await supabase
    .from('referrals')
    .insert({
      referrer_id: referrer.id,
      referee_id: refereeId,
      status: 'completed',
      referrer_reward_points: REFERRAL_REWARDS.referrer.points,
      referrer_reward_exp: REFERRAL_REWARDS.referrer.exp,
      referee_reward_points: REFERRAL_REWARDS.referee.points,
      referee_reward_exp: REFERRAL_REWARDS.referee.exp,
    });

  if (insertError) {
    console.error('추천 기록 생성 오류:', insertError);
    return { success: false, error: '추천 처리에 실패했습니다.' };
  }

  // 6. 보상 지급 - 추천인
  await grantReward(referrer.id, REFERRAL_REWARDS.referrer, '추천인 보상');

  // 7. 보상 지급 - 피추천인
  await grantReward(refereeId, REFERRAL_REWARDS.referee, '추천 가입 보상');

  // 8. 추천인 카운트 증가
  await supabase
    .from('profiles')
    .update({
      referral_count: (referrer.referral_count || 0) + 1,
      referred_by: referrer.id
    })
    .eq('id', refereeId);

  return { success: true };
}

async function grantReward(
  userId: string,
  reward: { points: number; exp: number },
  reason: string
) {
  const supabase = await getSupabaseServer();

  // 포인트 히스토리 기록
  await supabase.from('point_history').insert({
    user_id: userId,
    points: reward.points,
    reason,
  });

  // 경험치 히스토리 기록
  await supabase.from('exp_history').insert({
    user_id: userId,
    exp: reward.exp,
    reason,
  });

  // 프로필 업데이트
  const { data: profile } = await supabase
    .from('profiles')
    .select('points, exp')
    .eq('id', userId)
    .single();

  if (profile) {
    await supabase
      .from('profiles')
      .update({
        points: (profile.points || 0) + reward.points,
        exp: (profile.exp || 0) + reward.exp,
      })
      .eq('id', userId);
  }
}
```

### 3. 마일스톤 보상 처리

**파일**: `src/domains/referral/actions/milestones.ts`

```typescript
'use server';

import { getSupabaseServer } from '@/shared/lib/supabase/server';

const MILESTONE_REWARDS: Record<string, { points: number; exp: number }> = {
  first_post: { points: 200, exp: 50 },
  first_comment: { points: 100, exp: 25 },
  '7day_streak': { points: 500, exp: 100 },
};

export async function checkReferralMilestone(
  userId: string,
  milestoneType: string
) {
  const supabase = await getSupabaseServer();

  // 1. 이 사용자가 추천받아 가입했는지 확인
  const { data: referral } = await supabase
    .from('referrals')
    .select('id, referrer_id')
    .eq('referee_id', userId)
    .single();

  if (!referral) return; // 추천 가입이 아님

  // 2. 이미 달성한 마일스톤인지 확인
  const { data: existing } = await supabase
    .from('referral_milestones')
    .select('id')
    .eq('referral_id', referral.id)
    .eq('milestone_type', milestoneType)
    .single();

  if (existing) return; // 이미 달성

  // 3. 보상 정보 확인
  const reward = MILESTONE_REWARDS[milestoneType];
  if (!reward) return;

  // 4. 마일스톤 기록
  await supabase.from('referral_milestones').insert({
    referral_id: referral.id,
    milestone_type: milestoneType,
    reward_points: reward.points,
    reward_exp: reward.exp,
  });

  // 5. 추천인에게 보상 지급
  const { data: profile } = await supabase
    .from('profiles')
    .select('points, exp')
    .eq('id', referral.referrer_id)
    .single();

  if (profile) {
    await supabase
      .from('profiles')
      .update({
        points: (profile.points || 0) + reward.points,
        exp: (profile.exp || 0) + reward.exp,
      })
      .eq('id', referral.referrer_id);

    // 히스토리 기록
    await supabase.from('point_history').insert({
      user_id: referral.referrer_id,
      points: reward.points,
      reason: `추천인 마일스톤 보상 (${milestoneType})`,
    });

    await supabase.from('exp_history').insert({
      user_id: referral.referrer_id,
      exp: reward.exp,
      reason: `추천인 마일스톤 보상 (${milestoneType})`,
    });
  }
}
```

### 4. 추천 현황 조회

**파일**: `src/domains/referral/actions/stats.ts`

```typescript
'use server';

import { getSupabaseServer } from '@/shared/lib/supabase/server';

export async function getReferralStats(userId: string) {
  const supabase = await getSupabaseServer();

  // 내 추천 코드 (public_id)
  const { data: profile } = await supabase
    .from('profiles')
    .select('public_id, referral_count')
    .eq('id', userId)
    .single();

  // 내가 추천한 사람 목록
  const { data: referrals } = await supabase
    .from('referrals')
    .select(`
      id,
      referee_id,
      referrer_reward_points,
      referrer_reward_exp,
      created_at,
      referee:profiles!referee_id(nickname)
    `)
    .eq('referrer_id', userId)
    .order('created_at', { ascending: false });

  // 마일스톤 보상 총합
  const { data: milestones } = await supabase
    .from('referral_milestones')
    .select('reward_points, reward_exp')
    .in('referral_id', referrals?.map(r => r.id) || []);

  const totalMilestonePoints = milestones?.reduce((sum, m) => sum + m.reward_points, 0) || 0;
  const totalMilestoneExp = milestones?.reduce((sum, m) => sum + m.reward_exp, 0) || 0;

  const totalReferralPoints = referrals?.reduce((sum, r) => sum + r.referrer_reward_points, 0) || 0;
  const totalReferralExp = referrals?.reduce((sum, r) => sum + r.referrer_reward_exp, 0) || 0;

  return {
    referralCode: profile?.public_id,
    referralCount: profile?.referral_count || 0,
    referrals: referrals || [],
    totalPoints: totalReferralPoints + totalMilestonePoints,
    totalExp: totalReferralExp + totalMilestoneExp,
  };
}
```

---

## UI 구현

### 1. 프로필 페이지 - 내 추천 코드

**위치**: `src/domains/settings/components/profile/ReferralSection.tsx`

```tsx
'use client';

import { useState } from 'react';
import { Copy, Check, Users } from 'lucide-react';
import { toast } from 'react-toastify';

interface ReferralSectionProps {
  referralCode: string;
  referralCount: number;
  totalRewards: number;
}

export default function ReferralSection({
  referralCode,
  referralCount,
  totalRewards,
}: ReferralSectionProps) {
  const [copied, setCopied] = useState(false);

  const copyToClipboard = async () => {
    await navigator.clipboard.writeText(referralCode);
    setCopied(true);
    toast.success('추천 코드가 복사되었습니다!');
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="space-y-4">
      {/* 내 추천 코드 */}
      <div className="p-4 bg-[#F5F5F5] dark:bg-[#262626] rounded-lg">
        <h3 className="text-sm font-medium text-gray-900 dark:text-[#F0F0F0] mb-2">
          내 추천 코드
        </h3>
        <div className="flex items-center gap-2">
          <code className="flex-1 px-3 py-2 bg-white dark:bg-[#1D1D1D] rounded-md font-mono text-lg text-gray-900 dark:text-[#F0F0F0]">
            {referralCode}
          </code>
          <button
            onClick={copyToClipboard}
            className="p-2 bg-slate-800 dark:bg-[#3F3F3F] text-white rounded-md hover:bg-slate-700 dark:hover:bg-[#4A4A4A] transition-colors"
          >
            {copied ? <Check className="h-5 w-5" /> : <Copy className="h-5 w-5" />}
          </button>
        </div>
        <p className="text-xs text-gray-500 dark:text-gray-400 mt-2">
          친구에게 공유하면 양쪽 모두 보상을 받아요!
        </p>
      </div>

      {/* 추천 현황 */}
      <div className="p-4 bg-[#F5F5F5] dark:bg-[#262626] rounded-lg">
        <h3 className="text-sm font-medium text-gray-900 dark:text-[#F0F0F0] mb-3">
          추천 현황
        </h3>
        <div className="flex items-center gap-6">
          <div className="flex items-center gap-2">
            <Users className="h-5 w-5 text-gray-500 dark:text-gray-400" />
            <div>
              <span className="text-2xl font-bold text-gray-900 dark:text-[#F0F0F0]">
                {referralCount}
              </span>
              <span className="text-sm text-gray-500 dark:text-gray-400 ml-1">명</span>
            </div>
          </div>
          <div className="border-l border-black/10 dark:border-white/10 pl-6">
            <div className="text-xs text-gray-500 dark:text-gray-400">총 획득</div>
            <div className="font-bold text-gray-900 dark:text-[#F0F0F0]">
              {totalRewards.toLocaleString()} P
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
```

### 2. 회원가입 페이지 - 추천 코드 입력

**위치**: 회원가입 폼에 추가

```tsx
// 추천 코드 입력 필드
<div className="space-y-1">
  <label className="block text-sm text-gray-500 dark:text-gray-400">
    추천 코드 (선택)
  </label>
  <input
    type="text"
    placeholder="추천 코드 입력"
    value={referralCode}
    onChange={(e) => setReferralCode(e.target.value.toLowerCase())}
    maxLength={8}
    className="w-full px-3 py-2 border border-black/7 dark:border-white/10 rounded-md bg-white dark:bg-[#1D1D1D] text-gray-900 dark:text-[#F0F0F0]"
  />
  <p className="text-xs text-gray-400 dark:text-gray-500">
    추천 코드가 있으면 가입 시 300P를 받아요!
  </p>
</div>
```

---

## 구현 순서

```
1단계: DB 마이그레이션 (30분)
├── profiles 테이블에 referred_by, referral_count 컬럼 추가
├── referrals 테이블 생성
├── referral_milestones 테이블 생성
└── RLS 정책 설정

2단계: 백엔드 액션 (1일)
├── validateReferralCode - 추천 코드 검증
├── processReferral - 추천 처리 및 보상 지급
├── checkReferralMilestone - 마일스톤 체크
└── getReferralStats - 추천 현황 조회

3단계: 회원가입 연동 (반나절)
├── 회원가입 폼에 추천 코드 입력 필드 추가
├── 가입 완료 시 processReferral 호출
└── 추천 코드 유효성 검사

4단계: 프로필 UI (반나절)
├── ReferralSection 컴포넌트 생성
├── ProfileForm에 추가
└── 추천 현황 표시

5단계: 마일스톤 연동 (반나절)
├── 게시글 작성 시 first_post 체크
├── 댓글 작성 시 first_comment 체크
└── 7일 연속 출석 시 7day_streak 체크
```

---

## 보상 요약

### 추천인 총 획득 가능 보상 (1명당)

| 항목 | 포인트 | 경험치 |
|------|--------|--------|
| 가입 시 | 500 P | 100 XP |
| 첫 게시글 | 200 P | 50 XP |
| 첫 댓글 | 100 P | 25 XP |
| 7일 연속 출석 | 500 P | 100 XP |
| **총합** | **1,300 P** | **275 XP** |

### 피추천인 획득 보상

| 항목 | 포인트 | 경험치 |
|------|--------|--------|
| 가입 시 | 300 P | 50 XP |

---

## 확장 가능 기능

- [ ] 추천 랭킹 (월간 최다 추천인)
- [ ] 추천인 전용 뱃지/칭호
- [ ] 추천 이벤트 (특정 기간 보상 2배)
- [ ] 추천인 알림 (누가 가입했는지)
