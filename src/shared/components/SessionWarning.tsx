'use client';

import { useAuth } from '@/shared/context/AuthContext';
import { Clock, RefreshCw } from 'lucide-react';

export default function SessionWarning() {
  const { timeUntilLogout, extendSession } = useAuth();
  
  if (!timeUntilLogout || timeUntilLogout <= 0) {
    return null;
  }
  
  const minutes = Math.floor(timeUntilLogout / 60);
  const seconds = timeUntilLogout % 60;
  
  return (
    <div className="fixed top-4 right-4 z-50 bg-yellow-50 border border-yellow-200 rounded-lg p-4 shadow-lg max-w-sm">
      <div className="flex items-start space-x-3">
        <div className="flex-shrink-0">
          <Clock className="h-5 w-5 text-yellow-600" />
        </div>
        <div className="flex-1">
          <h3 className="text-sm font-medium text-yellow-800">
            세션 만료 경고
          </h3>
          <p className="mt-1 text-sm text-yellow-700">
            <span data-testid="session-countdown">
              {minutes}분 {seconds.toString().padStart(2, '0')}초
            </span> 후 자동 로그아웃됩니다.
          </p>
          <div className="mt-3">
            <button
              data-testid="extend-session-button"
              onClick={extendSession}
              className="inline-flex items-center px-3 py-2 border border-transparent text-sm leading-4 font-medium rounded-md text-white bg-yellow-600 hover:bg-yellow-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-yellow-500 transition-colors"
            >
              <RefreshCw className="h-4 w-4 mr-1" />
              세션 연장
            </button>
          </div>
        </div>
      </div>
    </div>
  );
} 