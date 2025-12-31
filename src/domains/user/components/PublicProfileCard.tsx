'use client';

import { PublicProfile } from '../types';
import UserIcon from '@/shared/components/UserIcon';
import ReportButton from '@/domains/reports/components/ReportButton';

interface PublicProfileCardProps {
  profile: PublicProfile;
}

/**
 * 공개 프로필 헤더 컴포넌트
 * 헤더로 사용되며 아래 탭/리스트와 연결됩니다.
 */
export default function PublicProfileCard({ profile }: PublicProfileCardProps) {
  return (
    <div className="px-4 py-2 bg-[#F5F5F5] dark:bg-[#262626] border-b border-black/5 dark:border-white/10">
      {/* PC: 한 줄 */}
      <div className="hidden md:flex items-center justify-between h-8">
        <div className="flex items-center">
          {/* 아이콘 + 닉네임 */}
          <div className="flex items-center gap-2">
            <UserIcon
              iconUrl={profile.icon_url}
              level={profile.level}
              size={24}
              alt={`${profile.nickname} 프로필`}
            />
            <span className="text-sm font-semibold text-gray-900 dark:text-[#F0F0F0]">
              {profile.nickname}
            </span>
          </div>

          {/* 구분점 */}
          <span className="mx-2 text-gray-300 dark:text-gray-600">·</span>

          {/* 레벨 / 아이디(마스킹) / 게시글 / 댓글 / 방문 */}
          <div className="flex items-center gap-1.5 text-xs text-gray-600 dark:text-gray-400">
            <span>Lv.{profile.level}</span>
            <span className="text-gray-300 dark:text-gray-600">/</span>
            <span>{profile.masked_id}</span>
            <span className="text-gray-300 dark:text-gray-600">/</span>
            <span>글 {profile.post_count}</span>
            <span className="text-gray-300 dark:text-gray-600">/</span>
            <span>댓글 {profile.comment_count}</span>
            <span className="text-gray-300 dark:text-gray-600">/</span>
            <span>방문 {profile.visit_count}</span>
          </div>
        </div>

        {/* 신고하기 버튼 */}
        <ReportButton
          targetType="user"
          targetId={profile.id}
          showText
        />
      </div>

      {/* 모바일: 두 줄 */}
      <div className="md:hidden space-y-1.5">
        {/* 첫째 줄: 아이콘 + 닉네임 + 레벨 + 아이디 */}
        <div className="flex items-center">
          <div className="flex items-center gap-2">
            <UserIcon
              iconUrl={profile.icon_url}
              level={profile.level}
              size={20}
              alt={`${profile.nickname} 프로필`}
            />
            <span className="text-sm font-semibold text-gray-900 dark:text-[#F0F0F0]">
              {profile.nickname}
            </span>
          </div>
          <span className="mx-1.5 text-gray-300 dark:text-gray-600">·</span>
          <div className="flex items-center gap-1 text-xs text-gray-600 dark:text-gray-400">
            <span>Lv.{profile.level}</span>
            <span className="text-gray-300 dark:text-gray-600">/</span>
            <span>{profile.masked_id}</span>
          </div>
        </div>

        {/* 둘째 줄: 글 / 댓글 / 방문 + 신고 */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-1.5 text-xs text-gray-600 dark:text-gray-400">
            <span>글 {profile.post_count}</span>
            <span className="text-gray-300 dark:text-gray-600">/</span>
            <span>댓글 {profile.comment_count}</span>
            <span className="text-gray-300 dark:text-gray-600">/</span>
            <span>방문 {profile.visit_count}</span>
          </div>
          <ReportButton
            targetType="user"
            targetId={profile.id}
            size="sm"
          />
        </div>
      </div>
    </div>
  );
}
