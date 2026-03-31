import { fetchBannerTransfers } from '@/domains/livescore/actions/transfers/bannerTransfers';
import TransferBannerCard from './TransferBannerCard';

export default async function TransferBannerWidget() {
  const items = await fetchBannerTransfers(12);

  if (!items || items.length === 0) return null;

  return <TransferBannerCard items={items} />;
}
