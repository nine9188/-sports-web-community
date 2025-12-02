import React from 'react';
import { getBannersByPosition } from '../actions/banners';
import { BannerPosition } from '../types/banner';
import BannerWidgetClient from './banner-widget-client';

interface BannerWidgetProps {
  position?: BannerPosition;
}

// 서버 컴포넌트 (데이터 fetch)
export default async function BannerWidget({ position = 'main_top' }: BannerWidgetProps) {
  try {
    // 지정된 위치의 배너 데이터 가져오기
    const banners = await getBannersByPosition(position);
    
    // 배너가 없으면 아무것도 렌더링하지 않음
    if (!banners || banners.length === 0) {
      return null;
    }
    
    return <BannerWidgetClient banners={banners} />;
  } catch (error) {
    console.error('배너 로드 실패:', error);
    return null;
  }
} 