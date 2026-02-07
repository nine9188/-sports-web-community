import Image from 'next/image';
import { getLevelIconUrl } from '@/shared/utils/level-icons-shared';

interface UserIconServerProps {
  iconUrl?: string | null;
  level?: number;
  size?: number;
  alt?: string;
  className?: string;
}

/**
 * 서버 컴포넌트용 UserIcon
 * - SSR에서 바로 렌더링되어 깜빡임 없음
 * - 에러 핸들링은 CSS로 대체 (object-fit: contain + 배경색)
 */
export default function UserIconServer({
  iconUrl,
  level = 1,
  size = 20,
  alt = '유저 아이콘',
  className = '',
}: UserIconServerProps) {
  // 아이콘 URL 결정 (서버에서 즉시 계산)
  const src = iconUrl || getLevelIconUrl(level);

  return (
    <div
      className={`relative rounded-full overflow-hidden bg-gray-200 dark:bg-gray-700 ${className}`}
      style={{ width: size, height: size }}
    >
      <Image
        src={src}
        alt={alt}
        width={size}
        height={size}
        sizes={`${size}px`}
        className="w-full h-full object-contain"
        loading="eager"
      />
    </div>
  );
}
