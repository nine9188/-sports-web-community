'use client';

import React, { useState, useTransition, useRef } from 'react';
import Image from 'next/image';
import { Banner, BannerPosition, BannerType, BANNER_POSITION_CONFIGS, BANNER_TYPE_INFO } from '@/domains/widgets/types/banner';
import { createBanner, updateBanner, deleteBanner, uploadBannerImage } from '@/domains/widgets/actions/banners';
import { toast } from 'react-toastify';
import { Button } from '@/shared/components/ui';

interface BannerManagementClientProps {
  initialBanners: Banner[];
}

// 현재 실제 사용되는 배너 위치만 필터링
const ACTIVE_BANNER_POSITIONS = BANNER_POSITION_CONFIGS.filter(config => 
  config.position === 'main_top' || 
  config.position === 'main_bottom'
).map(config => ({
  ...config,
  description: config.position === 'main_top' 
    ? '메인페이지 상단 (라이브스코어 위젯 위)' 
    : '메인페이지 하단 (뉴스 위젯 아래)'
}));

export default function BannerManagementClient({ initialBanners }: BannerManagementClientProps) {
  const [banners, setBanners] = useState<Banner[]>(initialBanners);
  const [selectedPosition, setSelectedPosition] = useState<BannerPosition | 'all'>('all');
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [isPending, startTransition] = useTransition();
  const [isUploadingImage, setIsUploadingImage] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  
  // 수정 관련 상태 추가
  const [editingBanner, setEditingBanner] = useState<Banner | null>(null);
  const [editForm, setEditForm] = useState<Partial<Banner>>({});

  // 위치별 배너 필터링 (활성 위치만)
  const filteredBanners = selectedPosition === 'all' 
    ? banners.filter(banner => ACTIVE_BANNER_POSITIONS.some(pos => pos.position === banner.position))
    : banners.filter(banner => banner.position === selectedPosition);

  // 배너 생성 폼 상태
  const [createForm, setCreateForm] = useState({
    position: 'main_top' as BannerPosition,
    type: 'image' as BannerType,
    title: '',
    subtitle: '',
    image_url: '',
    link_url: '',
    html_content: '',
    background_color: '#ffffff',
    text_color: '#000000',
    is_active: true,
    display_order: 1,
    display_type: 'slide' as const,
    sort_type: 'created' as const,
    desktop_per_row: 2,
    mobile_per_row: 1,
    auto_slide_interval: 10000
  });

  // 배너 생성
  const handleCreateBanner = async () => {
    if (!createForm.title.trim()) {
      toast.error('제목을 입력해주세요');
      return;
    }

    startTransition(async () => {
      try {
        const newBanner = await createBanner(createForm);
        setBanners([...banners, newBanner]);
        setShowCreateForm(false);
        setCreateForm({
          position: 'main_top',
          type: 'image',
          title: '',
          subtitle: '',
          image_url: '',
          link_url: '',
          html_content: '',
          background_color: '#ffffff',
          text_color: '#000000',
          is_active: true,
          display_order: 1,
          display_type: 'slide',
          sort_type: 'created',
          desktop_per_row: 2,
          mobile_per_row: 1,
          auto_slide_interval: 10000
        });
        toast.success('배너가 생성되었습니다');
      } catch (error) {
        toast.error(error instanceof Error ? error.message : '배너 생성에 실패했습니다');
      }
    });
  };

  // 배너 수정 시작
  const startEditBanner = (banner: Banner) => {
    setEditingBanner(banner);
    setEditForm({
      position: banner.position,
      type: banner.type,
      title: banner.title,
      subtitle: banner.subtitle,
      image_url: banner.image_url,
      link_url: banner.link_url,
      html_content: banner.html_content,
      background_color: banner.background_color,
      text_color: banner.text_color,
      is_active: banner.is_active,
      display_order: banner.display_order,
      display_type: banner.display_type,
      sort_type: banner.sort_type,
      desktop_per_row: banner.desktop_per_row,
      mobile_per_row: banner.mobile_per_row,
      auto_slide_interval: banner.auto_slide_interval
    });
  };

  // 배너 수정 취소
  const cancelEditBanner = () => {
    setEditingBanner(null);
    setEditForm({});
  };

  // 배너 수정 완료
  const handleEditBanner = async () => {
    if (!editingBanner || !editForm.title?.trim()) {
      toast.error('제목을 입력해주세요');
      return;
    }

    startTransition(async () => {
      try {
        const updatedBanner = await updateBanner(editingBanner.id, editForm);
        setBanners(banners.map(banner => 
          banner.id === editingBanner.id ? updatedBanner : banner
        ));
        setEditingBanner(null);
        setEditForm({});
        toast.success('배너가 수정되었습니다');
      } catch (error) {
        toast.error(error instanceof Error ? error.message : '배너 수정에 실패했습니다');
      }
    });
  };

  // 수정용 이미지 업로드 처리
  const handleEditImageUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    setIsUploadingImage(true);
    try {
      const result = await uploadBannerImage(file);
      if (result.success && result.url) {
        setEditForm({ ...editForm, image_url: result.url });
        toast.success('이미지가 업로드되었습니다');
      } else {
        toast.error(result.error || '이미지 업로드에 실패했습니다');
      }
    } catch (error) {
      console.error('이미지 업로드 오류:', error);
      toast.error('이미지 업로드 중 오류가 발생했습니다');
    } finally {
      setIsUploadingImage(false);
    }
  };

  // 배너 삭제
  const handleDeleteBanner = async (id: string) => {
    if (!confirm('정말로 이 배너를 삭제하시겠습니까?')) return;

    startTransition(async () => {
      try {
        await deleteBanner(id);
        setBanners(banners.filter(banner => banner.id !== id));
        toast.success('배너가 삭제되었습니다');
      } catch (error) {
        toast.error(error instanceof Error ? error.message : '배너 삭제에 실패했습니다');
      }
    });
  };

  // 배너 활성화/비활성화 토글
  const toggleBannerActive = async (banner: Banner) => {
    startTransition(async () => {
      try {
        const updatedBanner = await updateBanner(banner.id, { is_active: !banner.is_active });
        setBanners(banners.map(b => 
          b.id === banner.id ? updatedBanner : b
        ));
        toast.success(`배너가 ${!banner.is_active ? '활성화' : '비활성화'}되었습니다`);
      } catch (error) {
        toast.error(error instanceof Error ? error.message : '배너 상태 변경에 실패했습니다');
      }
    });
  };

  // 이미지 파일 업로드 처리
  const handleImageUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    setIsUploadingImage(true);
    try {
      const result = await uploadBannerImage(file);
      if (result.success && result.url) {
        setCreateForm({ ...createForm, image_url: result.url });
        toast.success('이미지가 업로드되었습니다');
      } else {
        toast.error(result.error || '이미지 업로드에 실패했습니다');
      }
    } catch (error) {
      console.error('이미지 업로드 오류:', error);
      toast.error('이미지 업로드 중 오류가 발생했습니다');
    } finally {
      setIsUploadingImage(false);
      // 파일 입력 초기화
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    }
  };

  return (
    <div className="space-y-6">
      {/* 배너 시스템 설명 */}
      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
        <h3 className="text-lg font-semibold text-blue-900 mb-2">🎯 배너 위치 안내</h3>
        <div className="text-sm text-blue-800 space-y-1">
          <p><strong>메인 상단:</strong> 메인페이지 상단, 라이브스코어 위젯 위에 표시</p>
          <p><strong>메인 하단:</strong> 메인페이지 하단, 뉴스 위젯 아래에 표시</p>
          <p className="mt-2 text-blue-600">💡 현재 이 두 위치에만 배너가 표시됩니다.</p>
        </div>
      </div>

      {/* 상단 컨트롤 */}
      <div className="flex flex-col sm:flex-row gap-4 justify-between items-start sm:items-center">
        <div className="flex flex-col sm:flex-row gap-2">
          <select
            value={selectedPosition}
            onChange={(e) => setSelectedPosition(e.target.value as BannerPosition | 'all')}
            className="px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="all">모든 위치</option>
            {ACTIVE_BANNER_POSITIONS.map(config => (
              <option key={config.position} value={config.position}>
                {config.name} - {config.description}
              </option>
            ))}
          </select>
        </div>
        
        <Button
          onClick={() => setShowCreateForm(true)}
          disabled={isPending}
          variant="primary"
        >
          + 새 배너 추가
        </Button>
      </div>

      {/* 배너 생성 폼 */}
      {showCreateForm && (
        <div className="bg-white border border-gray-200 rounded-lg p-6 shadow-sm">
          <h3 className="text-lg font-semibold mb-4">새 배너 추가</h3>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">위치</label>
              <select
                value={createForm.position}
                onChange={(e) => setCreateForm({ ...createForm, position: e.target.value as BannerPosition })}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                {ACTIVE_BANNER_POSITIONS.map(config => (
                  <option key={config.position} value={config.position}>
                    {config.name} - {config.description}
                  </option>
                ))}
              </select>
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">타입</label>
              <select
                value={createForm.type}
                onChange={(e) => setCreateForm({ ...createForm, type: e.target.value as BannerType })}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                {Object.entries(BANNER_TYPE_INFO).map(([type, info]) => (
                  <option key={type} value={type}>
                    {info.icon} {info.name} - {info.description}
                  </option>
                ))}
              </select>
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">제목 *</label>
              <input
                type="text"
                value={createForm.title}
                onChange={(e) => setCreateForm({ ...createForm, title: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="배너 제목을 입력하세요"
                required
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">부제목</label>
              <input
                type="text"
                value={createForm.subtitle}
                onChange={(e) => setCreateForm({ ...createForm, subtitle: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="배너 부제목을 입력하세요"
              />
            </div>
            
            {createForm.type === 'image' && (
              <>
                <div className="md:col-span-2">
                  <label className="block text-sm font-medium text-gray-700 mb-1">이미지 업로드</label>
                  <div className="space-y-3">
                    {/* 파일 업로드 버튼 */}
                    <div className="flex items-center gap-3">
                      <input
                        ref={fileInputRef}
                        type="file"
                        accept="image/*"
                        onChange={handleImageUpload}
                        className="hidden"
                        id="banner-image-upload"
                      />
                      <label
                        htmlFor="banner-image-upload"
                        className={`px-4 py-2 border border-gray-300 rounded-md text-sm font-medium cursor-pointer hover:bg-gray-50 transition-colors ${
                          isUploadingImage ? 'opacity-50 cursor-not-allowed' : ''
                        }`}
                      >
                        {isUploadingImage ? '업로드 중...' : '📁 이미지 선택'}
                      </label>
                      <span className="text-xs text-gray-500">
                        JPG, PNG, GIF 파일 (최대 5MB)
                      </span>
                    </div>
                    
                    {/* 이미지 미리보기 */}
                    {createForm.image_url && (
                      <div className="relative">
                        <div className="text-xs text-gray-600 mb-2">미리보기:</div>
                        <div className="relative w-full h-32 bg-gray-100 rounded-md overflow-hidden">
                          <Image
                            src={createForm.image_url}
                            alt="배너 이미지 미리보기"
                            fill
                            className="object-cover"
                            unoptimized
                          />
                        </div>
                        <Button
                          type="button"
                          onClick={() => setCreateForm({ ...createForm, image_url: '' })}
                          variant="destructive"
                          className="absolute top-6 right-2 rounded-full w-6 h-6 p-0 text-xs"
                        >
                          ×
                        </Button>
                      </div>
                    )}
                    
                    {/* 또는 URL 직접 입력 */}
                    <div className="border-t pt-3">
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        또는 이미지 URL 직접 입력
                      </label>
                      <input
                        type="url"
                        value={createForm.image_url}
                        onChange={(e) => setCreateForm({ ...createForm, image_url: e.target.value })}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                        placeholder="https://example.com/image.jpg"
                      />
                    </div>
                  </div>
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">링크 URL</label>
                  <input
                    type="text"
                    value={createForm.link_url}
                    onChange={(e) => setCreateForm({ ...createForm, link_url: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="/boards/Liverpool 또는 https://example.com"
                  />
                  <p className="mt-1 text-xs text-gray-500">
                    • 내부 링크: <code className="bg-gray-100 px-1 rounded">/boards/Liverpool</code> 또는 <code className="bg-gray-100 px-1 rounded">/boards/Liverpool/368</code><br/>
                    • 외부 링크: <code className="bg-gray-100 px-1 rounded">https://example.com</code> (새 탭에서 열림)
                  </p>
                </div>
              </>
            )}
            
            {createForm.type === 'html' && (
              <div className="md:col-span-2">
                <label className="block text-sm font-medium text-gray-700 mb-1">HTML 코드</label>
                <textarea
                  value={createForm.html_content}
                  onChange={(e) => setCreateForm({ ...createForm, html_content: e.target.value })}
                  rows={4}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="HTML 코드를 입력하세요 (예: 구글 애드센스 코드)"
                />
              </div>
            )}
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">배경색</label>
              <input
                type="color"
                value={createForm.background_color}
                onChange={(e) => setCreateForm({ ...createForm, background_color: e.target.value })}
                className="w-full h-10 border border-gray-300 rounded-md"
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">텍스트 색상</label>
              <input
                type="color"
                value={createForm.text_color}
                onChange={(e) => setCreateForm({ ...createForm, text_color: e.target.value })}
                className="w-full h-10 border border-gray-300 rounded-md"
              />
            </div>
          </div>
          
          <div className="flex gap-2 mt-6">
            <Button
              onClick={handleCreateBanner}
              disabled={isPending}
              variant="primary"
            >
              생성
            </Button>
            <Button
              onClick={() => setShowCreateForm(false)}
              disabled={isPending}
              variant="outline"
            >
              취소
            </Button>
          </div>
        </div>
      )}

      {/* 배너 수정 폼 */}
      {editingBanner && (
        <div className="bg-white border border-gray-200 rounded-lg p-6 shadow-sm">
          <h3 className="text-lg font-semibold mb-4">배너 수정</h3>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">위치</label>
              <select
                value={editForm.position || ''}
                onChange={(e) => setEditForm({ ...editForm, position: e.target.value as BannerPosition })}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                {ACTIVE_BANNER_POSITIONS.map(config => (
                  <option key={config.position} value={config.position}>
                    {config.name} - {config.description}
                  </option>
                ))}
              </select>
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">타입</label>
              <select
                value={editForm.type || ''}
                onChange={(e) => setEditForm({ ...editForm, type: e.target.value as BannerType })}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                {Object.entries(BANNER_TYPE_INFO).map(([type, info]) => (
                  <option key={type} value={type}>
                    {info.icon} {info.name} - {info.description}
                  </option>
                ))}
              </select>
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">제목 *</label>
              <input
                type="text"
                value={editForm.title || ''}
                onChange={(e) => setEditForm({ ...editForm, title: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="배너 제목을 입력하세요"
                required
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">부제목</label>
              <input
                type="text"
                value={editForm.subtitle || ''}
                onChange={(e) => setEditForm({ ...editForm, subtitle: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="배너 부제목을 입력하세요"
              />
            </div>
            
            {editForm.type === 'image' && (
              <>
                <div className="md:col-span-2">
                  <label className="block text-sm font-medium text-gray-700 mb-1">이미지 업로드</label>
                  <div className="space-y-3">
                    {/* 파일 업로드 버튼 */}
                    <div className="flex items-center gap-3">
                      <input
                        type="file"
                        accept="image/*"
                        onChange={handleEditImageUpload}
                        className="hidden"
                        id="edit-banner-image-upload"
                      />
                      <label
                        htmlFor="edit-banner-image-upload"
                        className={`px-4 py-2 border border-gray-300 rounded-md text-sm font-medium cursor-pointer hover:bg-gray-50 transition-colors ${
                          isUploadingImage ? 'opacity-50 cursor-not-allowed' : ''
                        }`}
                      >
                        {isUploadingImage ? '업로드 중...' : '📁 이미지 변경'}
                      </label>
                      <span className="text-xs text-gray-500">
                        JPG, PNG, GIF 파일 (최대 5MB)
                      </span>
                    </div>
                    
                    {/* 이미지 미리보기 */}
                    {editForm.image_url && (
                      <div className="relative">
                        <div className="text-xs text-gray-600 mb-2">미리보기:</div>
                        <div className="relative w-full h-32 bg-gray-100 rounded-md overflow-hidden">
                          <Image
                            src={editForm.image_url}
                            alt="배너 이미지 미리보기"
                            fill
                            className="object-cover"
                            unoptimized
                          />
                        </div>
                        <Button
                          type="button"
                          onClick={() => setEditForm({ ...editForm, image_url: '' })}
                          variant="destructive"
                          className="absolute top-6 right-2 rounded-full w-6 h-6 p-0 text-xs"
                        >
                          ×
                        </Button>
                      </div>
                    )}
                    
                    {/* 또는 URL 직접 입력 */}
                    <div className="border-t pt-3">
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        또는 이미지 URL 직접 입력
                      </label>
                      <input
                        type="url"
                        value={editForm.image_url || ''}
                        onChange={(e) => setEditForm({ ...editForm, image_url: e.target.value })}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                        placeholder="https://example.com/image.jpg"
                      />
                    </div>
                  </div>
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">링크 URL</label>
                  <input
                    type="text"
                    value={editForm.link_url || ''}
                    onChange={(e) => setEditForm({ ...editForm, link_url: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="/boards/Liverpool 또는 https://example.com"
                  />
                </div>
              </>
            )}
            
            {editForm.type === 'html' && (
              <div className="md:col-span-2">
                <label className="block text-sm font-medium text-gray-700 mb-1">HTML 코드</label>
                <textarea
                  value={editForm.html_content || ''}
                  onChange={(e) => setEditForm({ ...editForm, html_content: e.target.value })}
                  rows={4}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="HTML 코드를 입력하세요 (예: 구글 애드센스 코드)"
                />
              </div>
            )}
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">배경색</label>
              <input
                type="color"
                value={editForm.background_color || '#ffffff'}
                onChange={(e) => setEditForm({ ...editForm, background_color: e.target.value })}
                className="w-full h-10 border border-gray-300 rounded-md"
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">텍스트 색상</label>
              <input
                type="color"
                value={editForm.text_color || '#000000'}
                onChange={(e) => setEditForm({ ...editForm, text_color: e.target.value })}
                className="w-full h-10 border border-gray-300 rounded-md"
              />
            </div>
          </div>
          
          <div className="flex gap-2 mt-6">
            <Button
              onClick={handleEditBanner}
              disabled={isPending}
              variant="primary"
            >
              수정 완료
            </Button>
            <Button
              onClick={cancelEditBanner}
              disabled={isPending}
              variant="outline"
            >
              취소
            </Button>
          </div>
        </div>
      )}

      {/* 배너 목록 */}
      <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-6">
        {filteredBanners.map((banner) => (
          <div
            key={banner.id}
            className={`bg-white border rounded-lg p-4 shadow-sm transition-all ${
              banner.is_active ? 'border-gray-200' : 'border-gray-300 bg-gray-50'
            }`}
          >
            {/* 배너 미리보기 */}
            <div
              className="h-32 rounded-md mb-3 flex items-center justify-center relative overflow-hidden"
              style={{
                backgroundColor: banner.background_color,
                color: banner.text_color
              }}
            >
              {banner.type === 'image' && banner.image_url ? (
                <Image
                  src={banner.image_url}
                  alt={banner.title}
                  fill
                  className="object-cover"
                  unoptimized
                />
              ) : (
                <div className="text-center p-2">
                  <div className="text-2xl mb-1">
                    {BANNER_TYPE_INFO[banner.type]?.icon || '📋'}
                  </div>
                  <div className="text-sm font-medium">{banner.title}</div>
                  {banner.subtitle && (
                    <div className="text-xs opacity-75">{banner.subtitle}</div>
                  )}
                </div>
              )}
              
              {!banner.is_active && (
                <div className="absolute inset-0 bg-black/50 flex items-center justify-center">
                  <span className="text-white text-sm font-medium">비활성</span>
                </div>
              )}
            </div>
            
            {/* 배너 정보 */}
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium text-gray-900">{banner.title}</span>
                <span className={`text-xs px-2 py-1 rounded-full ${
                  banner.is_active 
                    ? 'bg-green-100 text-green-800' 
                    : 'bg-gray-100 text-gray-800'
                }`}>
                  {banner.is_active ? '활성' : '비활성'}
                </span>
              </div>
              
              <div className="text-xs text-gray-500 space-y-1">
                <div>위치: {ACTIVE_BANNER_POSITIONS.find(c => c.position === banner.position)?.name}</div>
                <div>타입: {BANNER_TYPE_INFO[banner.type]?.name}</div>
                <div>순서: {banner.display_order}</div>
              </div>
              
              {/* 액션 버튼 */}
              <div className="flex gap-1 pt-2">
                <Button
                  onClick={() => startEditBanner(banner)}
                  disabled={isPending}
                  variant="secondary"
                  size="sm"
                  className="flex-1 text-xs"
                >
                  수정
                </Button>

                <Button
                  onClick={() => toggleBannerActive(banner)}
                  disabled={isPending}
                  variant="outline"
                  size="sm"
                  className="flex-1 text-xs"
                >
                  {banner.is_active ? '비활성화' : '활성화'}
                </Button>

                <Button
                  onClick={() => handleDeleteBanner(banner.id)}
                  disabled={isPending}
                  variant="destructive"
                  size="sm"
                  className="flex-1 text-xs"
                >
                  삭제
                </Button>
              </div>
            </div>
          </div>
        ))}
      </div>

      {filteredBanners.length === 0 && (
        <div className="text-center py-12">
          <div className="text-gray-400 text-6xl mb-4">📋</div>
          <h3 className="text-lg font-medium text-gray-900 mb-2">배너가 없습니다</h3>
          <p className="text-gray-500 mb-4">
            {selectedPosition === 'all' 
              ? '아직 생성된 배너가 없습니다.' 
              : `${ACTIVE_BANNER_POSITIONS.find(c => c.position === selectedPosition)?.name} 위치에 배너가 없습니다.`
            }
          </p>
          <Button
            onClick={() => setShowCreateForm(true)}
            variant="primary"
          >
            첫 배너 추가하기
          </Button>
        </div>
      )}
    </div>
  );
} 