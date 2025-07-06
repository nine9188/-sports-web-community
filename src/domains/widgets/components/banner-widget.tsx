import React from 'react';
import { getBannersByPosition } from '../actions/banners';
import BannerWidgetClient from './banner-widget-client';
import { BannerPosition } from '../types/banner';

interface BannerWidgetProps {
  position?: BannerPosition;
}

export default async function BannerWidget({ position = 'main_top' }: BannerWidgetProps) {
  try {
    // 지정된 위치의 배너 데이터 가져오기
    const banners = await getBannersByPosition(position);
    
    // 배너가 없으면 기본 빈 배너 표시
    if (!banners || banners.length === 0) {
      const emptyBanners = [{
        id: `empty-${position}-${Date.now()}`,
        position,
        type: 'empty' as const,
        title: '새로운 배너를 추가해보세요',
        subtitle: '관리자 페이지에서 배너를 관리할 수 있습니다',
        background_color: '#f8fafc',
        text_color: '#64748b',
        is_active: true,
        display_order: 1,
        display_type: 'slide' as const,
        sort_type: 'created' as const,
        desktop_per_row: 2,
        mobile_per_row: 1,
        auto_slide_interval: 10000,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      }, {
        id: `empty-${position}-${Date.now()}-2`,
        position,
        type: 'empty' as const,
        title: '관리자 페이지에서 배너 관리',
        subtitle: '이미지, HTML, 투표 등 다양한 배너 타입 지원',
        background_color: '#f0f9ff',
        text_color: '#1e40af',
        is_active: true,
        display_order: 2,
        display_type: 'slide' as const,
        sort_type: 'created' as const,
        desktop_per_row: 2,
        mobile_per_row: 1,
        auto_slide_interval: 10000,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      }];
      
      return <BannerWidgetClient banners={emptyBanners} />;
    }
    
    return <BannerWidgetClient banners={banners} />;
  } catch (error) {
    console.error('배너 로드 실패:', error);
    
    // 에러 시 기본 빈 배너 표시
    const errorBanners = [{
      id: `error-${position}-${Date.now()}`,
      position,
      type: 'empty' as const,
      title: '배너를 불러올 수 없습니다',
      subtitle: '잠시 후 다시 시도해주세요',
      background_color: '#fef2f2',
      text_color: '#dc2626',
      is_active: true,
      display_order: 1,
      display_type: 'slide' as const,
      sort_type: 'created' as const,
      desktop_per_row: 2,
      mobile_per_row: 1,
      auto_slide_interval: 10000,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    }];
    
    return <BannerWidgetClient banners={errorBanners} />;
  }
} 