'use client';

import React, { useState, useRef, useEffect } from 'react';
import { Button } from '@/shared/ui';
import { createClient } from '@/shared/api/supabase';
import { AlertCircle, FileVideo } from 'lucide-react';
import { toast } from 'react-hot-toast';

interface VideoFormProps {
  onCancel: () => void;
  onVideoAdd: (videoUrl: string, caption: string) => void;
  isOpen: boolean;
}

export default function VideoForm({ 
  onCancel, 
  onVideoAdd,
  isOpen
}: VideoFormProps) {
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [selectedFileName, setSelectedFileName] = useState('');
  const [caption, setCaption] = useState('');
  const [isUploading, setIsUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [error, setError] = useState<string | null>(null);
  const [fileSize, setFileSize] = useState<string>('');
  const [retryCount, setRetryCount] = useState(0);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const uploadAbortController = useRef<AbortController | null>(null);
  const supabase = createClient();

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
      setCaption('');
      setUploadProgress(0);
      setError(null);
      setFileSize('');
      setRetryCount(0);
      
      // 진행 중인 업로드 취소
      if (uploadAbortController.current) {
        uploadAbortController.current.abort();
        uploadAbortController.current = null;
      }
    }
  }, [isOpen]);

  const handleFileButtonClick = () => {
    fileInputRef.current?.click();
  };

  // 파일 크기를 사람이 읽기 쉬운 형태로 변환
  const formatFileSize = (bytes: number): string => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    setError(null);
    
    if (file) {
      // 비디오 파일 타입 확인
      if (!file.type.startsWith('video/')) {
        setError('비디오 파일만 업로드할 수 있습니다.');
        return;
      }

      // 파일 크기 확인 (50MB 제한)
      if (file.size > 50 * 1024 * 1024) {
        setError('파일 크기는 50MB를 초과할 수 없습니다.');
        return;
      }

      setSelectedFile(file);
      setSelectedFileName(file.name);
      setFileSize(formatFileSize(file.size));
    }
  };
  
  const handleCancelUpload = () => {
    if (uploadAbortController.current) {
      uploadAbortController.current.abort();
      uploadAbortController.current = null;
    }
    setIsUploading(false);
    setUploadProgress(0);
    setError(null);
    toast.success('업로드가 취소되었습니다.');
  };

  const handleRetry = () => {
    setRetryCount(prev => prev + 1);
    handleSubmit();
  };

  const handleSubmit = async () => {
    if (!selectedFile) return;
    
    try {
      setIsUploading(true);
      setUploadProgress(10);
      setError(null);
      
      // 업로드 취소를 위한 AbortController 생성
      uploadAbortController.current = new AbortController();

      // 현재 로그인한 사용자 정보 가져오기
      const { data: userData, error: userError } = await supabase.auth.getUser();
      
      if (userError || !userData?.user) {
        throw new Error('사용자 인증이 필요합니다. 로그인 상태를 확인해주세요.');
      }
      
      setUploadProgress(20);
      
      // Supabase Storage 버킷 상태 확인
      try {
        const { data: buckets, error: bucketError } = await supabase.storage.listBuckets();
        
        if (bucketError) {
          console.error('버킷 조회 오류:', bucketError);
        } else {
          console.log('사용 가능한 버킷들:', buckets);
          const postVideosBucket = buckets.find(bucket => bucket.name === 'post-videos');
          
          if (!postVideosBucket) {
            throw new Error('post-videos 스토리지 버킷이 존재하지 않습니다. 관리자에게 문의해주세요.');
          }
          
          console.log('post-videos 버킷 정보:', postVideosBucket);
        }
      } catch (bucketCheckError) {
        console.warn('버킷 상태 확인 실패:', bucketCheckError);
        // 버킷 확인 실패해도 업로드는 시도
      }
      
      // 파일 유효성 재검사
      if (!selectedFile.type.startsWith('video/')) {
        throw new Error('비디오 파일만 업로드할 수 있습니다.');
      }
      
      // 파일 크기 재검사 (50MB로 제한 감소)
      if (selectedFile.size > 50 * 1024 * 1024) {
        throw new Error('파일 크기는 50MB를 초과할 수 없습니다.');
      }
      
      // 파일명에서 특수문자 및 공백 제거하여, 고유한 파일명 생성
      const timestamp = new Date().getTime();
      const randomString = Math.random().toString(36).substring(2, 8);
      const safeFileName = selectedFile.name.replace(/[^a-zA-Z0-9.]/g, '_');
      
      // 파일 확장자 확인
      const fileExtension = safeFileName.split('.').pop()?.toLowerCase();
      const allowedExtensions = ['mp4', 'webm', 'mov', 'avi', 'mkv'];
      
      if (!fileExtension || !allowedExtensions.includes(fileExtension)) {
        throw new Error('지원되지 않는 파일 형식입니다. MP4, WebM, MOV, AVI, MKV 파일만 업로드 가능합니다.');
      }
      
      // 중요: RLS 정책에 맞게 경로 지정 - storage.foldername(name)[1] = auth.uid()
      // 이 형식은 "user_id/폴더명/파일명" 형태여야 함
      const fileName = `${userData.user.id}/videos/${timestamp}_${randomString}_${safeFileName}`;
      
      console.log('업로드 시작:', {
        fileName,
        fileSize: selectedFile.size,
        fileType: selectedFile.type
      });
      
      // Supabase Storage에 업로드
      setUploadProgress(30);
      
      // 청크 업로드 방식으로 변경 (큰 파일에 대한 안정성 향상)
      const { error: uploadError } = await supabase.storage
        .from('post-videos')
        .upload(fileName, selectedFile, {
          cacheControl: '3600',
          upsert: true,
          contentType: selectedFile.type
        });
        
      if (uploadError) {
        console.error('비디오 업로드 오류:', uploadError);
        
        // 구체적인 오류 메시지 제공
        let errorMessage = '파일 업로드에 실패했습니다.';
        
        if (uploadError.message.includes('Row Level Security')) {
          errorMessage = '업로드 권한이 없습니다. 로그인 상태를 확인해주세요.';
        } else if (uploadError.message.includes('Bucket not found')) {
          errorMessage = 'post-videos 스토리지 버킷이 존재하지 않습니다. 관리자에게 문의해주세요.';
        } else if (uploadError.message.includes('File size')) {
          errorMessage = '파일 크기가 너무 큽니다. 50MB 이하의 파일을 업로드해주세요.';
        } else if (uploadError.message.includes('timeout')) {
          errorMessage = '업로드 시간이 초과되었습니다. 네트워크 연결을 확인하고 다시 시도해주세요.';
        } else {
          errorMessage = `업로드 실패: ${uploadError.message}`;
        }
        
        throw new Error(errorMessage);
      }
      
      setUploadProgress(70);
      
      // 업로드된 파일의 공개 URL 가져오기
      const { data: urlData } = supabase.storage
        .from('post-videos')
        .getPublicUrl(fileName);
        
      if (!urlData.publicUrl) {
        throw new Error('파일 URL을 가져올 수 없습니다.');
      }
      
      console.log('업로드 완료:', urlData.publicUrl);
      
      setUploadProgress(100);
      
      // 부모 컴포넌트에 비디오 URL 전달
      onVideoAdd(urlData.publicUrl, caption);
      setIsUploading(false);
      onCancel();
      
      toast.success('비디오가 성공적으로 업로드되었습니다!');
    } catch (error: unknown) {
      console.error('비디오 업로드 오류:', error);
      const errorMessage = error instanceof Error ? error.message : '알 수 없는 오류가 발생했습니다.';
      setError(errorMessage);
      setIsUploading(false);
      toast.error(errorMessage);
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
        `}
        style={{ marginTop: '0.5rem' }}
      >
        <div className="h-auto">
          <div className="border-b mb-4">
            <div className="flex">
              <button
                type="button"
                className="px-4 py-1 text-xs border-b-2 border-blue-500 text-blue-600 font-medium"
              >
                동영상 추가
              </button>
            </div>
          </div>
          
          <div className="space-y-4">
            <div className="flex items-center space-x-2">
              <button
                type="button"
                onClick={handleFileButtonClick}
                className="bg-gray-100 text-gray-700 px-3 py-2 text-xs rounded-md border border-gray-300 hover:bg-gray-200 flex-shrink-0 flex items-center"
                disabled={isUploading}
              >
                <FileVideo className="h-3 w-3 mr-1" />
                파일 선택
              </button>
              <input
                type="file"
                accept="video/*"
                onChange={handleFileChange}
                className="hidden"
                ref={fileInputRef}
              />
              <div className="text-xs text-gray-600 truncate border border-gray-300 rounded-md px-3 py-2 flex-1 min-h-[28px] flex items-center">
                {selectedFileName || '선택된 파일 없음'}
              </div>
            </div>
            
            {fileSize && (
              <div className="text-xs text-gray-600">
                파일 크기: {fileSize}
              </div>
            )}
            
            <div>
              <input
                type="text"
                value={caption}
                onChange={(e) => setCaption(e.target.value)}
                className="w-full border border-gray-300 rounded-md px-3 py-2 text-xs"
                placeholder="동영상 설명을 입력하세요 (선택사항)"
                disabled={isUploading}
              />
            </div>
            
            <div className="text-xs text-gray-500">
              <p>최대 업로드 크기: 50MB</p>
              <p>지원 형식: MP4, WebM, MOV, AVI, MKV</p>
            </div>
          </div>
        </div>
        
        {error && (isUploading || retryCount >= 3) && (
          <div className="my-2 text-xs text-red-500 flex items-center">
            <AlertCircle className="h-3 w-3 mr-1" />
            {error}
            {retryCount >= 3 && (
              <span className="ml-2 text-gray-500">(재시도 한도 초과)</span>
            )}
          </div>
        )}
        
        {isUploading && (
          <div className="my-2">
            <div className="w-full bg-gray-200 rounded-full h-2.5">
              <div 
                className="bg-blue-600 h-2.5 rounded-full transition-all duration-300" 
                style={{ width: `${uploadProgress}%` }}
              ></div>
            </div>
            <div className="flex items-center justify-between mt-1">
              <p className="text-xs text-gray-500">
                업로드 중... {uploadProgress}%
              </p>
              <button
                type="button"
                onClick={handleCancelUpload}
                className="text-xs text-red-500 hover:text-red-700 underline"
              >
                취소
              </button>
            </div>
          </div>
        )}
        
        {error && !isUploading && retryCount < 3 && (
          <div className="my-2 flex items-center justify-between">
            <div className="text-xs text-red-500 flex items-center flex-1">
              <AlertCircle className="h-3 w-3 mr-1" />
              <span className="flex-1">{error}</span>
            </div>
            <button
              type="button"
              onClick={handleRetry}
              className="text-xs text-blue-500 hover:text-blue-700 underline ml-2"
            >
              재시도
            </button>
          </div>
        )}
        
        <div className="flex justify-end space-x-2 mt-4">
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={onCancel}
            className="text-xs py-1 px-2 h-6"
            disabled={isUploading}
          >
            취소
          </Button>
          <Button
            type="button"
            size="sm"
            onClick={handleSubmit}
            disabled={!selectedFile || isUploading}
            className="text-xs py-1 px-2 h-6"
          >
            {isUploading ? '업로드 중...' : '확인'}
          </Button>
        </div>
      </div>
    </>
  );
} 