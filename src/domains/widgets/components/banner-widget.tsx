import React from 'react';
import { getBannersByPosition } from '../actions/banners';
import BannerWidgetClient from './banner-widget/BannerWidget';
import { BannerPosition } from '../types/banner';

interface BannerWidgetProps {
  position?: BannerPosition;
}

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
    
    // 에러 시에도 아무것도 렌더링하지 않음
    return null;
  }
} 