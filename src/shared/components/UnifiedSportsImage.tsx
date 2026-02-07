import { ImageType } from '@/shared/types/image';
import {
  getTeamLogoUrl,
  getLeagueLogoUrl,
  getPlayerPhotoUrl,
  getCoachPhotoUrl,
} from '@/domains/livescore/actions/images';
import UnifiedSportsImageClient from './UnifiedSportsImageClient';

type SizeVariant = 'sm' | 'md' | 'lg' | 'xl' | 'xxl';
type ShapeVariant = 'square' | 'circle';

interface UnifiedSportsImageProps {
  imageId: string | number;
  imageType: ImageType;
  alt: string;
  isDark?: boolean;
  size?: SizeVariant;
  variant?: ShapeVariant;
  showFallback?: boolean;
  fallbackContent?: React.ReactNode;
  loading?: 'lazy' | 'eager';
  priority?: boolean;
  fit?: 'cover' | 'contain';
  className?: string;
  showBorder?: boolean;
  width?: number;
  height?: number;
}

/**
 * 통합 스포츠 이미지 컴포넌트 (4590 표준 - 서버 컴포넌트)
 *
 * 4590 표준:
 * - 서버에서 URL 확정 → 클라이언트는 렌더링만
 * - 클라이언트 URL 조합 금지
 */
export default async function UnifiedSportsImage({
  imageId,
  imageType,
  alt,
  isDark = false,
  size = 'md',
  variant = 'square',
  showFallback = true,
  fallbackContent,
  loading = 'lazy',
  priority = false,
  fit,
  className = '',
  showBorder = false,
  width,
  height,
}: UnifiedSportsImageProps) {
  const defaultFit = (imageType === ImageType.Teams || imageType === ImageType.Leagues)
    ? 'contain'
    : 'cover';
  const finalFit = fit ?? defaultFit;

  const numericId = typeof imageId === 'string' ? parseInt(imageId, 10) : imageId;

  let src: string;

  switch (imageType) {
    case ImageType.Teams:
      src = await getTeamLogoUrl(numericId);
      break;
    case ImageType.Leagues:
      src = await getLeagueLogoUrl(numericId, isDark);
      break;
    case ImageType.Players:
      src = await getPlayerPhotoUrl(numericId);
      break;
    case ImageType.Coachs:
      src = await getCoachPhotoUrl(numericId);
      break;
    default:
      src = '/images/placeholder-team.svg';
  }

  return (
    <UnifiedSportsImageClient
      src={src}
      alt={alt}
      size={size}
      variant={variant}
      showFallback={showFallback}
      fallbackContent={fallbackContent}
      loading={loading}
      priority={priority}
      fit={finalFit}
      className={className}
      showBorder={showBorder}
      width={width}
      height={height}
    />
  );
}

export { default as UnifiedSportsImageClient } from './UnifiedSportsImageClient';
