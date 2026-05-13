import Image from 'next/image';
import Link from 'next/link';
import { siteConfig } from '@/shared/config';

interface StandalonePageHeaderProps {
  priority?: boolean;
}

export default function StandalonePageHeader({ priority = false }: StandalonePageHeaderProps) {
  return (
    <div className="sticky top-0 z-50 border-b border-black/7 bg-white px-4 py-4 dark:border-white/10 dark:bg-[#1D1D1D] sm:px-6 sm:py-5 md:static md:border-b-0">
      <Link href="/" className="inline-block" prefetch={false}>
        <Image
          src={siteConfig.logo}
          alt="4590 Football"
          width={340}
          height={148}
          unoptimized
          className="h-10 sm:h-14 w-auto dark:invert"
          priority={priority}
        />
      </Link>
    </div>
  );
}
