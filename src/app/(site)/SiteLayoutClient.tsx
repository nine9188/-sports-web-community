'use client';

import React, {
  lazy,
  Suspense,
  useState,
  useMemo,
  useRef,
  useEffect,
  useCallback,
  startTransition,
  useDeferredValue,
} from 'react';
import { usePathname } from 'next/navigation';
import AuthStateManager from '@/shared/components/AuthStateManager';
import { IconProvider } from '@/shared/context/IconContext';
import AuthSection from '@/domains/sidebar/components/auth/AuthSection';
import PhoneVerificationPopup from '@/shared/components/PhoneVerificationPopup';
import { Board } from '@/domains/layout/types/board';
import { HeaderUserData, FullUserDataWithSession } from '@/shared/types/user';
import { scrollToTop } from '@/shared/utils/scroll';
import Footer from '@/shared/components/Footer';
const SuspensionPopup = lazy(() => import('@/shared/components/SuspensionPopup'));
const AttendanceChecker = lazy(() => import('@/shared/components/AttendanceChecker'));
const FloatingBottomAd = lazy(() => import('@/shared/components/FloatingBottomAd'));

interface SiteLayoutClientProps {
  children?: React.ReactNode;
  boardNavigation: React.ReactNode;
  rightSidebar: React.ReactNode;
  headerBoards?: Board[];
  headerTotalPostCountSlot?: React.ReactNode;
  isMobilePhone?: boolean;
  initialUserData?: FullUserDataWithSession | null;
}

export default function SiteLayoutClient({
  children,
  boardNavigation,
  rightSidebar,
  headerBoards,
  headerTotalPostCountSlot,
  isMobilePhone,
  initialUserData,
}: SiteLayoutClientProps) {
  const fullUserData = initialUserData ?? null;
  const isAdmin = fullUserData?.is_admin ?? false;

  const headerUserData: HeaderUserData | null = fullUserData
    ? {
        id: fullUserData.id,
        nickname: fullUserData.nickname,
        email: fullUserData.email,
        level: fullUserData.level,
        exp: fullUserData.exp,
        points: fullUserData.points,
        iconInfo: fullUserData.icon_url
          ? {
              iconUrl: fullUserData.icon_url,
              iconName: fullUserData.icon_name || undefined,
            }
          : null,
        isAdmin: fullUserData.is_admin,
      }
    : null;

  const authSection = <AuthSection userData={fullUserData} />;

  const [isOpen, setIsOpen] = useState(false);
  const [isProfileOpen, setIsProfileOpen] = useState(false);
  const pathname = usePathname();
  const prevPathnameRef = useRef<string>('');

  const deferredIsOpen = useDeferredValue(isOpen);
  const deferredIsProfileOpen = useDeferredValue(isProfileOpen);

  const isIndependentLayout = useMemo(() => {
    if (!pathname) return false;

    const standaloneRoots = ['/terms', '/privacy', '/about', '/contact', '/guide'];

    return (
      pathname.startsWith('/admin') ||
      pathname.startsWith('/help/') ||
      standaloneRoots.some(root => pathname === root || pathname.startsWith(`${root}/`))
    );
  }, [pathname]);

  const closeSidebar = useCallback(() => {
    startTransition(() => {
      setIsOpen(false);
    });
  }, []);

  const toggleProfileSidebar = useCallback(() => {
    startTransition(() => {
      setIsProfileOpen(prev => !prev);
    });
  }, []);

  const closeProfileSidebar = useCallback(() => {
    startTransition(() => {
      setIsProfileOpen(false);
    });
  }, []);

  useEffect(() => {
    if (pathname && prevPathnameRef.current !== pathname) {
      if ('scrollRestoration' in window.history) {
        window.history.scrollRestoration = 'manual';
      }

      scrollToTop('auto');

      startTransition(() => {
        if (isOpen) {
          setIsOpen(false);
        }

        if (isProfileOpen) {
          setIsProfileOpen(false);
        }
      });

      prevPathnameRef.current = pathname;
    }
  }, [pathname, isOpen, isProfileOpen]);

  return isIndependentLayout ? (
    <>
      {children}
      <Footer />
    </>
  ) : (
    <IconProvider>
      <AuthStateManager
        authSection={authSection}
        boardNavigation={boardNavigation}
        rightSidebar={rightSidebar}
        headerUserData={headerUserData}
        headerBoards={headerBoards}
        headerIsAdmin={isAdmin}
        headerTotalPostCountSlot={headerTotalPostCountSlot}
        fullUserData={fullUserData}
        isOpen={deferredIsOpen}
        onClose={closeSidebar}
        isProfileOpen={deferredIsProfileOpen}
        onProfileClose={closeProfileSidebar}
        onProfileClick={toggleProfileSidebar}
        isMobilePhone={isMobilePhone}
      >
        {children}
        {fullUserData && (
          <PhoneVerificationPopup userId={fullUserData.id} phoneVerified={fullUserData.phone_verified} />
        )}
      </AuthStateManager>
      <Suspense fallback={null}>
        <SuspensionPopup />
        <AttendanceChecker />
        <FloatingBottomAd />
      </Suspense>
    </IconProvider>
  );
}
