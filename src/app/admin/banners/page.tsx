import React from 'react';
import { getAllBanners } from '@/domains/widgets/actions/banners';
import BannerManagementClient from './components/BannerManagementClient';

export default async function BannerManagementPage() {
  try {
    const banners = await getAllBanners();
    
    return (
      <div className="container mx-auto p-6">
        <div className="mb-6">
          <h1 className="text-2xl font-bold text-gray-900 mb-2">배너 관리</h1>
          <p className="text-gray-600">
            사이트의 다양한 위치에 표시될 배너를 관리할 수 있습니다.
          </p>
        </div>
        
        <BannerManagementClient initialBanners={banners} />
      </div>
    );
  } catch (error) {
    console.error('배너 관리 페이지 로드 실패:', error);
    
    return (
      <div className="container mx-auto p-6">
        <div className="mb-6">
          <h1 className="text-2xl font-bold text-gray-900 mb-2">배너 관리</h1>
          <p className="text-red-600">
            배너 데이터를 불러올 수 없습니다. 관리자 권한을 확인해주세요.
          </p>
        </div>
        
        <div className="bg-red-50 border border-red-200 rounded-lg p-4">
          <h3 className="text-red-800 font-medium mb-2">오류 발생</h3>
          <p className="text-red-700 text-sm">
            {error instanceof Error ? error.message : '알 수 없는 오류가 발생했습니다.'}
          </p>
        </div>
      </div>
    );
  }
} 