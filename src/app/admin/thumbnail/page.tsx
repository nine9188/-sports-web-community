import { Metadata } from 'next';
import PredictionThumbnailMaker from '@/domains/admin/components/thumbnail/PredictionThumbnailMaker';

export const metadata: Metadata = {
  title: '예측분석 썸네일 - 4590 Football',
  robots: {
    index: false,
    follow: false,
    nocache: true,
  },
};

export default function AdminThumbnailPage() {
  return <PredictionThumbnailMaker />;
}
