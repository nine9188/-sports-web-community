'use client';

import React, { useState, useRef, useEffect } from 'react';
import { Button } from '@/shared/components/ui';

interface ImageUploadFormProps {
  onCancel: () => void;
  onFileUpload: (file: File, caption: string) => void;
  onImageUrlAdd: (url: string, caption: string) => void;
  isOpen: boolean;
}

export default function ImageUploadForm({
  onCancel,
  onFileUpload,
  onImageUrlAdd,
  isOpen
}: ImageUploadFormProps) {
  const [activeTab, setActiveTab] = useState<'file' | 'link'>('file');
  const [imageUrl, setImageUrl] = useState('');
  const [imageCaption, setImageCaption] = useState('');
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [selectedFileName, setSelectedFileName] = useState('');
  const dropdownRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // 드롭다운이 열릴 때마다 상태 초기화
  useEffect(() => {
    if (isOpen) {
      setSelectedFile(null);
      setSelectedFileName('');
      setImageCaption('');
      setImageUrl('');
      setActiveTab('file');
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
  };

  const handleFileButtonClick = () => {
    fileInputRef.current?.click();
  };

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      setSelectedFile(file);
      setSelectedFileName(file.name);
    }
  };

  const handleSubmit = () => {
    if (activeTab === 'file' && selectedFile) {
      onFileUpload(selectedFile, imageCaption);
    } else if (activeTab === 'link' && imageUrl) {
      onImageUrlAdd(imageUrl, imageCaption);
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

            <div className="flex justify-end space-x-2 pt-2">
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={handleCancelClick}
                onMouseDown={(e) => e.stopPropagation()}
                className="text-xs"
              >
                취소
              </Button>
              <Button
                type="button"
                variant="primary"
                size="sm"
                onClick={handleSubmit}
                disabled={(activeTab === 'file' && !selectedFile) || (activeTab === 'link' && !imageUrl)}
                className="text-xs"
              >
                확인
              </Button>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
