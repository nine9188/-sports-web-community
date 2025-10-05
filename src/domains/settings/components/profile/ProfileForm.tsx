'use client';

import React from 'react';
import { Calendar, Clock } from 'lucide-react';
import { formatDate } from '@/shared/utils/date';

interface ProfileFormProps {
  initialData: {
    id: string;
    nickname: string | null;
    email: string | null;
    full_name: string | null;
    created_at?: string;
    last_sign_in_at?: string;
  };
}

export default function ProfileForm({ initialData }: ProfileFormProps) {

  return (
    <div>
      {/* 이메일 필드 */}
      <div className="space-y-1">
        <label htmlFor="email" className="block text-sm font-medium text-gray-700">
          이메일
        </label>
        <input
          type="email"
          id="email"
          value={initialData.email || ''}
          disabled
          className="w-full px-3 py-2 border border-gray-200 bg-gray-50 rounded-md shadow-sm cursor-not-allowed"
        />
        <p className="text-xs text-gray-500">
          이메일 주소는 로그인 및 계정 복구에 사용됩니다.
        </p>
      </div>

      {/* 실명 필드 */}
      <div className="space-y-1">
        <label htmlFor="full_name" className="block text-sm font-medium text-gray-700">
          이름
        </label>
        <input
          type="text"
          id="full_name"
          value={initialData.full_name || ''}
          disabled
          className="w-full px-3 py-2 border border-gray-200 bg-gray-50 rounded-md shadow-sm cursor-not-allowed"
        />
        <p className="text-xs text-gray-500">
          이름은 계정 복구 및 관리 용도로만 사용됩니다.
        </p>
      </div>

      {/* 닉네임 필드 */}
      <div className="space-y-1">
        <label htmlFor="nickname" className="block text-sm font-medium text-gray-700">
          닉네임
        </label>
        <input
          type="text"
          id="nickname"
          value={initialData.nickname || ''}
          disabled
          className="w-full px-3 py-2 border border-gray-200 bg-gray-50 rounded-md shadow-sm cursor-not-allowed"
        />
        <p className="text-xs text-gray-500">
          닉네임은 커뮤니티에서 사용자를 식별하는 데 사용됩니다.
        </p>
      </div>

      {/* 계정 정보 */}
      <div className="space-y-3 border-t pt-4">
        <h3 className="text-sm font-medium text-gray-700">계정 정보</h3>
        
        <div className="flex items-center text-sm text-gray-600">
          <Calendar className="h-4 w-4 mr-2 text-gray-400" />
          <span className="mr-1 font-medium">가입일:</span>
                          {formatDate(initialData.created_at) || '-'}
        </div>
        
        <div className="flex items-center text-sm text-gray-600">
          <Clock className="h-4 w-4 mr-2 text-gray-400" />
          <span className="mr-1 font-medium">마지막 로그인:</span>
                          {formatDate(initialData.last_sign_in_at) || '-'}
        </div>
      </div>
    </div>
  );
} 