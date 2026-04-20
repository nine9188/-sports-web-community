'use client';

import { useState, useEffect } from 'react';
import { Copy, Check } from 'lucide-react';
import { getReferralStats, type ReferralStats } from '@/shared/actions/referral-actions';
import { REFERRAL_REWARDS, REFERRAL_MILESTONES } from '@/shared/constants/rewards';
import { Button } from '@/shared/components/ui';

interface ReferralSectionProps {
  userId: string;
  initialStats?: ReferralStats | null;
}

export default function ReferralSection({ userId, initialStats }: ReferralSectionProps) {
  const [stats, setStats] = useState<ReferralStats | null>(initialStats ?? null);
  const [loading, setLoading] = useState(!initialStats);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    if (initialStats !== undefined) return;
    getReferralStats(userId)
      .then(setStats)
      .finally(() => setLoading(false));
  }, [userId, initialStats]);

  const handleCopyCode = async () => {
    if (stats?.referralCode) {
      try {
        await navigator.clipboard.writeText(stats.referralCode);
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
      } catch (err) {
        console.error('복사 실패:', err);
      }
    }
  };

  if (loading) {
    return (
      <div className="space-y-3 border-t border-black/5 dark:border-white/10 pt-4">
        <h3 className="text-[13px] font-medium text-gray-900 dark:text-[#F0F0F0]">친구 추천</h3>
        <div className="animate-pulse space-y-3">
          <div className="h-16 bg-[#F5F5F5] dark:bg-[#262626] rounded-lg"></div>
          <div className="h-20 bg-[#F5F5F5] dark:bg-[#262626] rounded-lg"></div>
        </div>
      </div>
    );
  }

  if (!stats) return null;

  return (
    <div className="space-y-3 border-t border-black/5 dark:border-white/10 pt-4">
      <h3 className="text-[13px] font-medium text-gray-900 dark:text-[#F0F0F0]">친구 추천</h3>

      {/* 내 추천 코드 */}
      <div className="p-4 bg-[#F5F5F5] dark:bg-[#262626] rounded-lg">
        <div className="flex items-center justify-between mb-2">
          <span className="text-[13px] text-gray-700 dark:text-gray-300">내 추천 코드</span>
          <Button
            variant="primary"
            size="sm"
            onClick={handleCopyCode}
            className="gap-1.5 text-xs h-7 px-3"
          >
            {copied ? (
              <>
                <Check className="h-3.5 w-3.5" />
                복사됨
              </>
            ) : (
              <>
                <Copy className="h-3.5 w-3.5" />
                복사
              </>
            )}
          </Button>
        </div>
        <div className="font-mono text-lg font-bold text-gray-900 dark:text-[#F0F0F0] tracking-wider">
          {stats.referralCode}
        </div>
        <p className="text-xs text-gray-500 dark:text-gray-400 mt-2">
          친구에게 이 코드를 공유하면 친구 가입 시 서로 보상을 받습니다!
        </p>
      </div>

      {/* 보상 안내 */}
      <div className="p-3 bg-[#F5F5F5] dark:bg-[#262626] rounded-lg">
        <div className="text-[13px] font-medium text-gray-900 dark:text-[#F0F0F0] mb-2">
          추천 보상 안내
        </div>
        <ul className="text-xs text-gray-700 dark:text-gray-300 space-y-1">
          <li>- 친구 가입 시: {REFERRAL_REWARDS.REFERRER_SIGNUP.points}P + {REFERRAL_REWARDS.REFERRER_SIGNUP.exp}XP</li>
          {REFERRAL_MILESTONES.map((milestone) => (
            <li key={milestone.type}>
              - {milestone.label}: {milestone.points}P + {milestone.exp}XP
            </li>
          ))}
        </ul>
      </div>

      {/* 나를 추천한 사람 */}
      {stats.referredBy && (
        <div className="text-[13px] text-gray-600 dark:text-gray-400">
          <span className="font-medium">{stats.referredBy.nickname}</span>님의 추천으로 가입
        </div>
      )}

      {/* 추천 현황 */}
      <div className="p-3 bg-[#F5F5F5] dark:bg-[#262626] rounded-lg">
        <div className="text-[13px] font-medium text-gray-900 dark:text-[#F0F0F0] mb-2">
          추천 현황
        </div>
        <div className="flex items-center gap-4 text-xs text-gray-700 dark:text-gray-300">
          <span>추천 친구 <strong className="text-gray-900 dark:text-[#F0F0F0]">{stats.totalReferrals}명</strong></span>
          <span>포인트 <strong className="text-gray-900 dark:text-[#F0F0F0]">{stats.totalPointsEarned.toLocaleString()}P</strong></span>
          <span>경험치 <strong className="text-gray-900 dark:text-[#F0F0F0]">{stats.totalExpEarned.toLocaleString()}XP</strong></span>
        </div>
      </div>

      {/* 추천 친구 목록 */}
      <div className="p-3 bg-[#F5F5F5] dark:bg-[#262626] rounded-lg">
        <div className="text-[13px] font-medium text-gray-900 dark:text-[#F0F0F0] mb-2">
          추천 친구 목록
        </div>
        {stats.recentReferrals.length > 0 ? (
          <div className="grid grid-cols-5 gap-2">
            {stats.recentReferrals.map((referral, index) => (
              <div
                key={index}
                className="flex flex-col items-center gap-0.5 py-2 px-1 border border-black/10 dark:border-white/10 rounded-lg"
              >
                <span className="text-[11px] font-medium text-gray-900 dark:text-[#F0F0F0] truncate w-full text-center">
                  {referral.nickname}
                </span>
                <span className="text-[10px] text-gray-400 dark:text-gray-500">
                  {new Date(referral.created_at).toLocaleDateString('ko-KR')}
                </span>
              </div>
            ))}
          </div>
        ) : (
          <p className="text-xs text-gray-500 dark:text-gray-400">아직 추천한 친구가 없습니다.</p>
        )}
      </div>
    </div>
  );
}
