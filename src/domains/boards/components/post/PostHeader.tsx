import { AuthorLink } from '@/domains/user/components';
import { formatDate } from '@/shared/utils/dateUtils';

interface PostHeaderProps {
  title: string;
  author: {
    nickname: string | null;
    id?: string;
    public_id?: string;
    level?: number;
    exp?: number;
    icon_id?: number | null;
    icon_url?: string | null;
  };
  createdAt: string;
  views: number;
  likes: number;
  boardName?: string;
  commentCount?: number;
  isEnded?: boolean;
}

export default function PostHeader({
  title,
  author,
  createdAt,
  views,
  likes,
  commentCount = 0,
  isEnded = false,
}: PostHeaderProps) {
  const cleanTitle = typeof title === 'string'
    ? title.replace(/&quot;|"|"|"/g, '"').replace(/&ldquo;|&rdquo;/g, '"')
    : title;
  const titleClassName = isEnded
    ? 'text-gray-400 dark:text-gray-500 line-through'
    : 'text-gray-900 dark:text-[#F0F0F0]';
  const displayTitle = isEnded ? `[종료] ${cleanTitle}` : cleanTitle;

  return (
    <div className="bg-[#F5F5F5] dark:bg-[#262626] border-b border-black/7 dark:border-white/10 px-4 py-3">
      {/* 제목 (핫딜의 경우 자동 생성된 제목 표시) */}
      <h1 className={`text-lg font-medium mb-2 ${titleClassName}`}>{displayTitle}</h1>

      {/* PC */}
      <div className="hidden md:flex flex-wrap items-center justify-between text-xs text-gray-500 dark:text-gray-400">
        <AuthorLink
          nickname={author.nickname || '알 수 없음'}
          publicId={author.public_id}
          oddsUserId={author.id}
          iconUrl={author.icon_url}
          level={author.level}
          exp={author.exp}
          iconSize={20}
          priority={true}
        />

        <div className="flex items-center space-x-4 flex-shrink-0 ml-auto">
          <div className="flex items-center space-x-3">
            <span>조회 {views || 0}</span>
            <span>추천 {likes || 0}</span>
            <span>댓글 {commentCount || 0}</span>
          </div>
          <span className="flex-shrink-0">{formatDate(createdAt)}</span>
        </div>
      </div>

      {/* Mobile */}
      <div className="md:hidden">
        <div className="flex flex-wrap items-center justify-between text-xs text-gray-500 dark:text-gray-400 mb-1">
          <AuthorLink
            nickname={author.nickname || '알 수 없음'}
            publicId={author.public_id}
            oddsUserId={author.id}
            iconUrl={author.icon_url}
            level={author.level}
            exp={author.exp}
            iconSize={20}
            priority={true}
            enableMobile
          />

          <span className="flex-shrink-0">{formatDate(createdAt)}</span>
        </div>

        <div className="flex justify-end text-xs text-gray-500 dark:text-gray-400">
          <div className="flex items-center space-x-3">
            <span>조회 {views || 0}</span>
            <span>추천 {likes || 0}</span>
            <span>댓글 {commentCount || 0}</span>
          </div>
        </div>
      </div>
    </div>
  );
}
