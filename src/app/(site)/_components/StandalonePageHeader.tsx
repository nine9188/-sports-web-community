import Link from 'next/link';
import SiteLogo from '@/shared/components/SiteLogo';

interface StandalonePageHeaderProps {
  priority?: boolean;
}

export default function StandalonePageHeader({ priority = false }: StandalonePageHeaderProps) {
  return (
    <div className="sticky top-0 z-50 border-b border-black/7 bg-white px-4 py-4 dark:border-white/10 dark:bg-[#1D1D1D] sm:px-6 sm:py-5 md:static md:border-b-0">
      <Link href="/" className="inline-block" prefetch={false}>
        <SiteLogo className="h-10 w-auto sm:h-14" priority={priority} />
      </Link>
    </div>
  );
}
