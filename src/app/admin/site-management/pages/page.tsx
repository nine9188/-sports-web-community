import { getAllPageMetadataForAdmin } from '@/domains/site-config/actions';
import PageMetadataList from './PageMetadataList';

export const metadata = {
  title: '페이지 메타데이터 | 사이트 관리',
};

export default async function PageMetadataPage() {
  const pages = await getAllPageMetadataForAdmin();

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">페이지별 메타데이터</h1>
          <p className="mt-1 text-sm text-gray-600">
            각 페이지의 SEO 설정을 관리합니다
          </p>
        </div>
      </div>

      <PageMetadataList pages={pages} />
    </div>
  );
}
