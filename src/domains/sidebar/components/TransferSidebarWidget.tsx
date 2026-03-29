import Link from 'next/link';
import { ChevronRight } from 'lucide-react';
import { UnifiedSportsImageClient } from '@/shared/components/UnifiedSportsImage';
import {
  Container,
  ContainerHeader,
  ContainerTitle,
} from '@/shared/components/ui';
import { fetchBannerTransfers, type BannerTransferItem } from '@/domains/livescore/actions/transfers/bannerTransfers';

export default async function TransferSidebarWidget() {
  const items = await fetchBannerTransfers(8);

  if (!items || items.length === 0) return null;

  return (
    <Container className="bg-white dark:bg-[#1D1D1D]">
      <ContainerHeader className="justify-between">
        <ContainerTitle>이적시장</ContainerTitle>
        <Link
          href="/transfers"
          className="text-xs text-gray-600 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300 flex items-center gap-0.5"
        >
          이적센터
          <ChevronRight className="w-3.5 h-3.5" />
        </Link>
      </ContainerHeader>

      {/* 이적 리스트 */}
      <div className="bg-white dark:bg-[#1D1D1D] divide-y divide-black/5 dark:divide-white/10">
        {items.map((item: BannerTransferItem) => (
          <Link
            key={`${item.playerId}-${item.transferDate}`}
            href="/transfers"
            className="flex items-center gap-2.5 px-3 py-2 md:hover:bg-[#EAEAEA] md:dark:hover:bg-[#333333] transition-colors"
          >
            {/* 선수명 */}
            <span className="text-[13px] font-medium text-gray-900 dark:text-[#F0F0F0] truncate min-w-0 flex-1">
              {item.playerName}
            </span>

            {/* 이적 경로 - 고정 크기 래퍼로 크기 통일 */}
            <div className="flex items-center gap-1 shrink-0">
              <div className="w-4 h-4 flex-shrink-0">
                <UnifiedSportsImageClient
                  src={item.teamOutLogo}
                  alt={item.teamOutName}
                  width={16}
                  height={16}
                  fit="contain"
                  className="w-full h-full"
                />
              </div>
              <span className="text-[10px] text-gray-400 dark:text-gray-500">→</span>
              <div className="w-4 h-4 flex-shrink-0">
                <UnifiedSportsImageClient
                  src={item.teamInLogo}
                  alt={item.teamInName}
                  width={16}
                  height={16}
                  fit="contain"
                  className="w-full h-full"
                />
              </div>
            </div>

            {/* 이적유형 뱃지 */}
            <span className={`shrink-0 px-1.5 py-0.5 rounded text-[10px] font-medium ${item.transferTypeColor}`}>
              {item.transferTypeFormatted}
            </span>
          </Link>
        ))}
      </div>
    </Container>
  );
}
