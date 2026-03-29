import { fetchBannerTransfers } from '@/domains/livescore/actions/transfers/bannerTransfers';
import TransferBannerCard from './TransferBannerSlide';

export default async function TransferBannerSlideServer() {
  const items = await fetchBannerTransfers(12);

  if (!items || items.length === 0) return null;

  return <TransferBannerCard items={items} />;
}
