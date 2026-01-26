'use client';

import React, { useState, useRef, useEffect } from 'react';
import { getSupabaseBrowser } from '@/shared/lib/supabase';
import { toast } from 'react-toastify';
import { Button } from '@/shared/components/ui';

interface ImageUploadFormProps {
  onCancel: () => void;
  onImageUrlAdd: (url: string, caption: string) => void;
  isOpen: boolean;
}

export default function ImageUploadForm({
  onCancel,
  onImageUrlAdd,
  isOpen
}: ImageUploadFormProps) {
  const [activeTab, setActiveTab] = useState<'file' | 'link'>('file');
  const [imageUrl, setImageUrl] = useState('');
  const [imageCaption, setImageCaption] = useState('');
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [selectedFileName, setSelectedFileName] = useState('');
  const [isUploading, setIsUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const supabase = getSupabaseBrowser();

  // 드롭다운이 열릴 때마다 상태 초기화
  useEffect(() => {
    if (isOpen) {
      setSelectedFile(null);
      setSelectedFileName('');
      setImageCaption('');
      setImageUrl('');
      setActiveTab('file');
      setError(null);
    }
  }, [isOpen]);

  // 외부 클릭 감지 - 다른 폼들과 동일한 방식
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        onCancel();
      }
    }

    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isOpen, onCancel]);

  const handleTabChange = (tab: 'file' | 'link') => {
    setActiveTab(tab);
    setError(null);
  };

  const handleFileButtonClick = () => {
    fileInputRef.current?.click();
  };

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    setError(null);

    if (file) {
      // 이미지 파일 타입 확인
      if (!file.type.startsWith('image/')) {
        setError('이미지 파일만 업로드할 수 있습니다.');
        return;
      }

      // 파일 크기 확인 (10MB 제한)
      if (file.size > 10 * 1024 * 1024) {
        setError('파일 크기는 10MB를 초과할 수 없습니다.');
        return;
      }

      setSelectedFile(file);
      setSelectedFileName(file.name);
    }
  };

  const handleSubmit = async () => {
    if (activeTab === 'link' && imageUrl) {
      onImageUrlAdd(imageUrl, imageCaption);
      return;
    }

    if (activeTab === 'file' && selectedFile) {
      try {
        setIsUploading(true);
        setError(null);

        // 사용자 인증 확인
        const { data: userData, error: userError } = await supabase.auth.getUser();

        if (userError || !userData?.user) {
          throw new Error('사용자 인증이 필요합니다. 로그인 상태를 확인해주세요.');
        }

        // 파일명 생성
        const timestamp = new Date().getTime();
        const randomString = Math.random().toString(36).substring(2, 8);
        const safeFileName = selectedFile.name.replace(/[^a-zA-Z0-9.]/g, '_');
        const fileName = `${userData.user.id}/images/${timestamp}_${randomString}_${safeFileName}`;

        // Supabase Storage에 업로드
        const { error: uploadError } = await supabase.storage
          .from('post-images')
          .upload(fileName, selectedFile, {
            cacheControl: '3600',
            upsert: true,
            contentType: selectedFile.type
          });

        if (uploadError) {
          let errorMessage = '파일 업로드에 실패했습니다.';
          if (uploadError.message.includes('Row Level Security')) {
            errorMessage = '업로드 권한이 없습니다. 로그인 상태를 확인해주세요.';
          } else if (uploadError.message.includes('Bucket not found')) {
            errorMessage = 'post-images 스토리지 버킷이 존재하지 않습니다. 관리자에게 문의해주세요.';
          } else {
            errorMessage = `업로드 실패: ${uploadError.message}`;
          }
          throw new Error(errorMessage);
        }

        // 업로드된 파일의 공개 URL 가져오기
        const { data: urlData } = supabase.storage
          .from('post-images')
          .getPublicUrl(fileName);

        if (!urlData.publicUrl) {
          throw new Error('파일 URL을 가져올 수 없습니다.');
        }

        // 부모 컴포넌트에 이미지 URL 전달
        onImageUrlAdd(urlData.publicUrl, imageCaption || selectedFile.name);
        toast.success('이미지가 업로드되었습니다.');
      } catch (err: unknown) {
        console.error('이미지 업로드 오류:', err);
        const errorMessage = err instanceof Error ? err.message : '알 수 없는 오류가 발생했습니다.';
        setError(errorMessage);
        toast.error(errorMessage);
      } finally {
        setIsUploading(false);
      }
    }
  };

  const handleCancelClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    onCancel();
  };

  if (!isOpen) return null;

  return (
    <>
      {/* 모바일 오버레이 */}
      <div
        className="fixed inset-0 bg-black/20 z-40 sm:hidden"
        onClick={onCancel}
        aria-hidden="true"
      />
      <div
        ref={dropdownRef}
        className="z-50 bg-white dark:bg-[#1D1D1D] rounded-lg shadow-lg border border-black/7 dark:border-white/10 overflow-hidden fixed sm:absolute left-1/2 top-1/2 sm:left-0 sm:top-full -translate-x-1/2 -translate-y-1/2 sm:translate-x-0 sm:translate-y-0 w-[90vw] max-w-sm sm:w-80"
        style={{ marginTop: '0.5rem' }}
      >
        <div className="bg-[#F5F5F5] dark:bg-[#262626] h-12 px-4 flex items-center">
          <h3 className="text-sm font-bold text-gray-900 dark:text-[#F0F0F0]">이미지 추가</h3>
        </div>
        <div className="p-4">
          <div className="border-b border-black/5 dark:border-white/10 mb-4">
            <div className="flex gap-4">
              <Button
                type="button"
                variant="ghost"
                onClick={() => handleTabChange('file')}
                className={`px-1 py-1 text-xs rounded-none ${activeTab === 'file'
                  ? 'border-b-2 border-gray-900 dark:border-[#F0F0F0] text-gray-900 dark:text-[#F0F0F0] font-medium'
                  : 'text-gray-700 dark:text-gray-300 hover:text-gray-600 dark:hover:text-gray-200'}`}
              >
                파일
              </Button>
              <Button
                type="button"
                variant="ghost"
                onClick={() => handleTabChange('link')}
                className={`px-1 py-1 text-xs rounded-none ${activeTab === 'link'
                  ? 'border-b-2 border-gray-900 dark:border-[#F0F0F0] text-gray-900 dark:text-[#F0F0F0] font-medium'
                  : 'text-gray-700 dark:text-gray-300 hover:text-gray-600 dark:hover:text-gray-200'}`}
              >
                주소
              </Button>
            </div>
          </div>

          <div className="space-y-4">
            {activeTab === 'file' ? (
              <>
                <div className="flex items-center space-x-2">
                  <Button
                    type="button"
                    variant="secondary"
                    onClick={handleFileButtonClick}
                    disabled={isUploading}
                    className="px-3 py-2 text-xs flex-shrink-0"
                  >
                    파일 선택
                  </Button>
                  <input
                    type="file"
                    accept="image/*"
                    onChange={handleFileChange}
                    className="hidden"
                    ref={fileInputRef}
                  />
                  <div className="text-xs text-gray-700 dark:text-gray-300 truncate border border-black/7 dark:border-white/10 rounded-md px-3 py-2 flex-1 min-h-[28px] flex items-center bg-[#EAEAEA] dark:bg-[#333333]">
                    {selectedFileName || '선택된 파일 없음'}
                  </div>
                </div>

                <div>
                  <input
                    type="text"
                    id="file-imageCaption"
                    value={imageCaption}
                    onChange={(e) => setImageCaption(e.target.value)}
                    className="w-full border border-black/7 dark:border-white/10 rounded-md px-3 py-2 text-xs bg-white dark:bg-[#1D1D1D] text-gray-900 dark:text-[#F0F0F0] placeholder:text-gray-500 dark:placeholder:text-gray-400 outline-none focus:outline-none focus-visible:outline-none focus-visible:ring-0 focus-visible:ring-offset-0 focus:bg-[#F5F5F5] dark:focus:bg-[#262626] transition-colors"
                    placeholder="표시할 텍스트 (선택사항)"
                    disabled={isUploading}
                  />
                </div>
              </>
            ) : (
              <>
                <div>
                  <input
                    type="text"
                    id="imageUrl"
                    value={imageUrl}
                    onChange={(e) => setImageUrl(e.target.value)}
                    className="w-full border border-black/7 dark:border-white/10 rounded-md px-3 py-2 text-xs bg-white dark:bg-[#1D1D1D] text-gray-900 dark:text-[#F0F0F0] placeholder:text-gray-500 dark:placeholder:text-gray-400 outline-none focus:outline-none focus-visible:outline-none focus-visible:ring-0 focus-visible:ring-offset-0 focus:bg-[#F5F5F5] dark:focus:bg-[#262626] transition-colors"
                    placeholder="이미지 URL을 입력하세요"
                  />
                </div>

                <div>
                  <input
                    type="text"
                    id="link-imageCaption"
                    value={imageCaption}
                    onChange={(e) => setImageCaption(e.target.value)}
                    className="w-full border border-black/7 dark:border-white/10 rounded-md px-3 py-2 text-xs bg-white dark:bg-[#1D1D1D] text-gray-900 dark:text-[#F0F0F0] placeholder:text-gray-500 dark:placeholder:text-gray-400 outline-none focus:outline-none focus-visible:outline-none focus-visible:ring-0 focus-visible:ring-offset-0 focus:bg-[#F5F5F5] dark:focus:bg-[#262626] transition-colors"
                    placeholder="이미지 설명 (선택사항)"
                  />
                </div>
              </>
            )}

            {error && (
              <div className="text-xs text-red-500">
                {error}
              </div>
            )}

            <div className="flex justify-end space-x-2 pt-2">
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={handleCancelClick}
                onMouseDown={(e) => e.stopPropagation()}
                disabled={isUploading}
                className="text-xs"
              >
                취소
              </Button>
              <Button
                type="button"
                variant="primary"
                size="sm"
                onClick={handleSubmit}
                disabled={isUploading || (activeTab === 'file' && !selectedFile) || (activeTab === 'link' && !imageUrl)}
                className="text-xs"
              >
                {isUploading ? '업로드 중...' : '확인'}
              </Button>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
