'use client';

import React, { useState, useRef, useEffect } from 'react';

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

  // 외부 클릭 감지
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

  // 드롭다운이 열릴 때마다 상태 초기화
  useEffect(() => {
    if (isOpen) {
      setSelectedFile(null);
      setSelectedFileName('');
      setImageCaption('');
      setImageUrl('');
    }
  }, [isOpen]);

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
      // 상태는 초기화하지 않고 모달이 닫힐 때 초기화함
    } else if (activeTab === 'link' && imageUrl) {
      onImageUrlAdd(imageUrl, imageCaption);
      // 상태는 초기화하지 않고 모달이 닫힐 때 초기화함
    }
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
        className={`z-50 bg-white rounded-lg shadow-lg border p-4
          fixed sm:absolute
          left-1/2 top-1/2 sm:left-0 sm:top-full
          -translate-x-1/2 -translate-y-1/2 sm:translate-x-0 sm:translate-y-0
          w-[90vw] max-w-sm sm:w-80
          ${activeTab === 'file' ? '' : ''}
        `}
        style={{ marginTop: '0.5rem' }}
      >
        <div className="min-h-[124px]">
          <div className="border-b mb-4">
            <div className="flex">
              <button
                type="button"
                onClick={() => handleTabChange('file')}
                className={`px-4 py-1 text-xs ${activeTab === 'file' 
                  ? 'border-b-2 border-blue-500 text-blue-600 font-medium' 
                  : 'text-gray-500'}`}
              >
                파일
              </button>
              <button
                type="button"
                onClick={() => handleTabChange('link')}
                className={`px-4 py-1 text-xs ${activeTab === 'link' 
                  ? 'border-b-2 border-blue-500 text-blue-600 font-medium' 
                  : 'text-gray-500'}`}
              >
                주소
              </button>
            </div>
          </div>
          
          <div>
            {activeTab === 'file' ? (
              <div className="space-y-4">
                <div className="flex items-center space-x-2">
                  <button
                    type="button"
                    onClick={handleFileButtonClick}
                    className="bg-gray-100 text-gray-700 px-3 py-2 text-xs rounded-md border border-gray-300 hover:bg-gray-200 flex-shrink-0"
                  >
                    파일 선택
                  </button>
                  <input
                    type="file"
                    accept="image/*"
                    onChange={handleFileChange}
                    className="hidden"
                    ref={fileInputRef}
                  />
                  <div className="text-xs text-gray-600 truncate border border-gray-300 rounded-md px-3 py-2 flex-1 min-h-[28px] flex items-center">
                    {selectedFileName || '선택된 파일 없음'}
                  </div>
                </div>
                
                <div>
                  <input
                    type="text"
                    id="file-imageCaption"
                    value={imageCaption}
                    onChange={(e) => setImageCaption(e.target.value)}
                    className="w-full border border-gray-300 rounded-md px-3 py-2 text-xs"
                    placeholder="표시할 텍스트 (선택사항)"
                  />
                </div>
              </div>
            ) : (
              <div className="space-y-4">
                <div>
                  <input
                    type="text"
                    id="imageUrl"
                    value={imageUrl}
                    onChange={(e) => setImageUrl(e.target.value)}
                    className="w-full border border-gray-300 rounded-md px-3 py-2 text-xs"
                    placeholder="이미지 URL을 입력하세요"
                  />
                </div>
                
                <div>
                  <input
                    type="text"
                    id="link-imageCaption"
                    value={imageCaption}
                    onChange={(e) => setImageCaption(e.target.value)}
                    className="w-full border border-gray-300 rounded-md px-3 py-2 text-xs"
                    placeholder="선택적 파일을 설명하세요."
                  />
                </div>
              </div>
            )}
          </div>
        </div>
        
        <div className="flex justify-end space-x-2 mt-4">
          <button
            type="button"
            onClick={onCancel}
            className="bg-[#F5F5F5] dark:bg-[#262626] text-gray-900 dark:text-[#F0F0F0] hover:bg-[#EAEAEA] dark:hover:bg-[#333333] px-3 py-1 rounded text-xs transition-colors h-7"
          >
            취소
          </button>
          <button
            type="button"
            onClick={handleSubmit}
            disabled={(activeTab === 'file' && !selectedFile) || (activeTab === 'link' && !imageUrl)}
            className="bg-slate-800 dark:bg-[#3F3F3F] text-white hover:bg-slate-700 dark:hover:bg-[#4A4A4A] px-3 py-1 rounded text-xs transition-colors disabled:opacity-50 disabled:cursor-not-allowed h-7"
          >
            확인
          </button>
        </div>
      </div>
    </>
  );
} 