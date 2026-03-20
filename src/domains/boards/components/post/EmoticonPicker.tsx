"use client";

import React, { useState, useRef, useEffect, useMemo } from 'react';
import { EMOTICONS, EMOTICON_PACKAGES } from '@/domains/boards/constants/emoticons';
import { X } from 'lucide-react';
import { Pagination } from '@/shared/components/ui';
import { useMediaQuery } from '@/hooks/useMediaQuery';
import { type PickerPackage, type EmoticonPackInfo } from '@/domains/boards/actions/emoticons';
import { usePickerData } from '@/domains/boards/hooks/useEmoticonQueries';
import PackageTabs from './emoticon/PackageTabs';
import EmoticonButton from './emoticon/EmoticonButton';
import ShopView from './emoticon/ShopView';
import DetailView from './emoticon/DetailView';
import PurchaseView from './emoticon/PurchaseView';
import SettingsView from './emoticon/SettingsView';
import { ITEMS_PER_PAGE } from './emoticon/constants';

interface EmoticonPickerProps {
  onSelect: (code: string) => void;
  onClose: () => void;
}

type ViewMode = 'picker' | 'shop' | 'detail' | 'purchase' | 'settings';

// DB 실패 시 로컬 상수 fallback
const FALLBACK_PACKAGES: PickerPackage[] = EMOTICON_PACKAGES.map(pkg => ({
  pack_id: pkg.id,
  pack_name: pkg.name,
  pack_thumbnail: pkg.thumbnail,
  emoticons: EMOTICONS
    .filter(e => e.packageId === pkg.id)
    .map((e, i) => ({
      id: i, pack_id: pkg.id, pack_name: pkg.name, pack_thumbnail: pkg.thumbnail,
      code: e.code, name: e.name, url: e.url, shop_item_id: null, display_order: i,
    })),
}));

export default function EmoticonPicker({ onSelect, onClose }: EmoticonPickerProps) {
  const [viewMode, setViewMode] = useState<ViewMode>('picker');
  const [selectedPackId, setSelectedPackId] = useState<string | null>(null);
  const [purchasePack, setPurchasePack] = useState<EmoticonPackInfo | null>(null);
  const [activePackageId, setActivePackageId] = useState<string>('');
  const [page, setPage] = useState(1);

  const tabContainerRef = useRef<HTMLDivElement>(null);
  const isDesktop = useMediaQuery('(min-width: 768px)');

  // React Query로 피커 데이터 로드 (캐시됨)
  const { data: pickerData, isLoading: pickerLoading, isError } = usePickerData();

  // 데이터 소스: DB 성공 시 pickerData, 실패 시 fallback
  const packages = useMemo(() => {
    if (pickerData && pickerData.length > 0) return pickerData;
    if (isError) return FALLBACK_PACKAGES;
    return null;
  }, [pickerData, isError]);

  // 첫 팩 자동 선택
  useEffect(() => {
    if (packages && packages.length > 0 && !activePackageId) {
      setActivePackageId(packages[0].pack_id);
    }
  }, [packages, activePackageId]);

  const currentPackage = packages?.find(p => p.pack_id === activePackageId);
  const filteredEmoticons = currentPackage?.emoticons || [];
  const totalPages = Math.max(1, Math.ceil(filteredEmoticons.length / ITEMS_PER_PAGE));
  const currentEmoticons = filteredEmoticons.slice((page - 1) * ITEMS_PER_PAGE, page * ITEMS_PER_PAGE);

  const handlePackageChange = (packageId: string) => {
    setActivePackageId(packageId);
    setPage(1);
  };

  const handleSelect = (code: string) => {
    onSelect(code);
    onClose();
  };

  const scrollTabs = (direction: 'left' | 'right') => {
    tabContainerRef.current?.scrollBy({
      left: direction === 'left' ? -100 : 100,
      behavior: 'smooth',
    });
  };

  // 뷰 전환
  const goToShop = () => setViewMode('shop');
  const goToSettings = () => setViewMode('settings');
  const goToPicker = () => { setViewMode('picker'); setSelectedPackId(null); setPurchasePack(null); };
  const goToDetail = (packId: string) => { setSelectedPackId(packId); setViewMode('detail'); };
  const goToPurchase = (pack: EmoticonPackInfo) => { setPurchasePack(pack); setViewMode('purchase'); };
  const onPurchaseComplete = () => { setViewMode('detail'); setPurchasePack(null); };
  const onSettingsSave = () => { setViewMode('picker'); };

  const headerTitle = (() => {
    switch (viewMode) {
      case 'shop': return '이모티콘 상점';
      case 'detail': return '팩 상세';
      case 'purchase': return '구매 확인';
      case 'settings': return '설정';
      default: return '이모티콘';
    }
  })();

  const renderView = () => {
    switch (viewMode) {
      case 'shop':
        return <ShopView isMobile={!isDesktop} onBack={goToPicker} onPackClick={goToDetail} />;
      case 'detail':
        return selectedPackId ? (
          <DetailView packId={selectedPackId} isMobile={!isDesktop} onBack={() => setViewMode('shop')} onPurchase={goToPurchase} />
        ) : null;
      case 'purchase':
        return purchasePack ? (
          <PurchaseView pack={purchasePack} isMobile={!isDesktop} onBack={() => setViewMode('detail')} onComplete={onPurchaseComplete} />
        ) : null;
      case 'settings':
        return <SettingsView isMobile={!isDesktop} onBack={goToPicker} onSave={onSettingsSave} />;
      default:
        return null;
    }
  };

  const renderPickerContent = () => {
    if (pickerLoading || !packages) {
      return (
        <>
          <div className="flex items-center border-b border-black/5 dark:border-white/10 bg-[#F5F5F5] dark:bg-[#262626] h-11 flex-shrink-0" />
          <div className={isDesktop ? 'h-[462px]' : 'flex-1 min-h-0'} />
          <div className="border-t border-black/5 dark:border-white/10 h-[64px]" />
        </>
      );
    }

    return (
      <>
        <PackageTabs
          packages={packages}
          activePackageId={activePackageId}
          onPackageChange={handlePackageChange}
          tabContainerRef={tabContainerRef}
          onScrollTabs={scrollTabs}
          onShopClick={goToShop}
          onSettingsClick={goToSettings}
        />

        {isDesktop ? (
          <div className="px-4 py-4">
            <div className="grid grid-cols-6 gap-2.5">
              {currentEmoticons.map((emo) => (
                <EmoticonButton key={emo.id} emoticon={emo} onSelect={handleSelect} size="desktop" />
              ))}
              {Array.from({ length: ITEMS_PER_PAGE - currentEmoticons.length }).map((_, i) => (
                <div key={`empty-${i}`} className="w-[100px] h-[100px]" />
              ))}
            </div>
          </div>
        ) : (
          <div data-emoticon-scroll className="flex-1 min-h-0 overflow-y-auto overscroll-contain px-3 py-3">
            <div className="grid grid-cols-6 gap-1.5">
              {filteredEmoticons.map((emo) => (
                <EmoticonButton key={emo.id} emoticon={emo} onSelect={handleSelect} size="mobile" />
              ))}
            </div>
          </div>
        )}

        {!isDesktop && (
          <div className="h-16 flex-shrink-0 border-t border-black/5 dark:border-white/10" />
        )}

        {isDesktop && (
          <div className="flex items-center justify-center border-t border-black/5 dark:border-white/10 h-[64px]">
            {totalPages > 1 ? (
              <Pagination currentPage={page} totalPages={totalPages} onPageChange={setPage} mode="button" withBorder={false} withMargin={false} />
            ) : (
              <span className="text-xs text-gray-400 dark:text-gray-500">1 / 1</span>
            )}
          </div>
        )}
      </>
    );
  };

  // 모바일
  if (!isDesktop) {
    return (
      <div className="fixed inset-0 z-50 flex flex-col justify-end"
        onTouchMove={(e) => {
          const target = e.target as HTMLElement;
          if (!target.closest('[data-emoticon-scroll]')) e.preventDefault();
        }}>
        <div className="absolute inset-0 bg-black/40" onClick={onClose} />
        <div className="relative bg-white dark:bg-[#1D1D1D] rounded-t-2xl flex flex-col animate-in slide-in-from-bottom duration-200" style={{ height: '85vh' }}>
          <div className="flex flex-col items-center pt-2 pb-1 border-b border-black/5 dark:border-white/10 flex-shrink-0">
            <div className="w-10 h-1 bg-gray-300 dark:bg-gray-600 rounded-full mb-2" />
            <div className="flex items-center justify-between w-full px-4 pb-1">
              <span className="text-sm font-semibold text-gray-900 dark:text-[#F0F0F0]">{headerTitle}</span>
              <button type="button" onClick={onClose} className="p-1.5 hover:bg-black/5 dark:hover:bg-white/10 rounded-full transition-colors">
                <X className="w-5 h-5 text-gray-500" />
              </button>
            </div>
          </div>
          {viewMode === 'picker' ? renderPickerContent() : renderView()}
        </div>
      </div>
    );
  }

  // 데스크톱
  return (
    <div className="absolute z-50 bottom-full mb-2 left-0 w-[min(692px,calc(100vw-2rem))] shadow-xl flex flex-col bg-white dark:bg-[#1D1D1D] rounded-lg border border-black/5 dark:border-white/10 overflow-hidden h-[610px]">
      <div className="flex items-center justify-between px-4 h-11 flex-shrink-0 border-b border-black/5 dark:border-white/10 bg-[#F5F5F5] dark:bg-[#262626]">
        <span className="text-sm font-semibold text-gray-900 dark:text-[#F0F0F0]">{headerTitle}</span>
        <button type="button" onClick={onClose} className="h-8 w-8 inline-flex items-center justify-center rounded-md hover:bg-[#EAEAEA] dark:hover:bg-[#333333] transition-colors">
          <X className="h-4 w-4 text-gray-500 dark:text-gray-400" />
        </button>
      </div>
      {viewMode === 'picker' ? renderPickerContent() : renderView()}
    </div>
  );
}
