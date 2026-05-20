import Image from 'next/image';
import { SITE_LOGO_DARK_URL, SITE_LOGO_LIGHT_URL } from '@/shared/images/urls';

interface SiteLogoProps {
  className?: string;
  width?: number;
  height?: number;
  priority?: boolean;
  fetchPriority?: 'high' | 'low' | 'auto';
}

export default function SiteLogo({
  className = 'h-10 w-auto',
  width = 340,
  height = 148,
  priority = false,
  fetchPriority,
}: SiteLogoProps) {
  return (
    <>
      <Image
        src={SITE_LOGO_LIGHT_URL}
        alt="4590football logo"
        width={width}
        height={height}
        priority={priority}
        fetchPriority={fetchPriority}
        unoptimized
        className={`${className} dark:hidden`}
      />
      <Image
        src={SITE_LOGO_DARK_URL}
        alt="4590football logo"
        width={width}
        height={height}
        priority={priority}
        fetchPriority={fetchPriority}
        unoptimized
        className={`${className} hidden dark:block`}
      />
    </>
  );
}
