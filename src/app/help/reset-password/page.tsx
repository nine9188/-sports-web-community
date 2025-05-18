"use client";

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { toast } from 'react-toastify';
import { createClient } from '@/app/lib/supabase-browser';
import Link from 'next/link';

export default function ResetPasswordPage() {
  const router = useRouter();
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [loading, setLoading] = useState(false);
  
  const handleResetPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!password || !confirmPassword) {
      toast.error('모든 필드를 입력해주세요');
      return;
    }
    
    if (password !== confirmPassword) {
      toast.error('비밀번호가 일치하지 않습니다');
      return;
    }
    
    if (password.length < 6) {
      toast.error('비밀번호는 최소 6자 이상이어야 합니다');
      return;
    }
    
    try {
      setLoading(true);
      const supabase = createClient();
      
      // 비밀번호 변경 (URL에서 토큰 정보는 Supabase가 자동으로 처리)
      const { error } = await supabase.auth.updateUser({
        password: password
      });
      
      if (error) throw error;
      
      toast.success('비밀번호가 성공적으로 변경되었습니다');
      setTimeout(() => {
        router.push('/signin');
      }, 2000);
      
    } catch (error) {
      console.error('비밀번호 재설정 오류:', error);
      toast.error('비밀번호 변경 중 오류가 발생했습니다. 다시 시도해주세요.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col items-center justify-center p-4">
      <div className="w-full max-w-md bg-white rounded-lg shadow-md p-6">
        <div className="mb-6">
          <Link href="/" className="text-slate-800 hover:text-slate-600 font-bold text-xl">
            SPORTS
          </Link>
        </div>
        
        <h2 className="text-xl font-bold text-center mb-6">
          새로운 비밀번호를 입력해주세요
        </h2>
        
        <form onSubmit={handleResetPassword} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              새 비밀번호
            </label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full p-2 border rounded focus:ring-2 focus:ring-slate-500 focus:border-slate-500"
              placeholder="새 비밀번호"
              required
            />
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              새 비밀번호 확인
            </label>
            <input
              type="password"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              className="w-full p-2 border rounded focus:ring-2 focus:ring-slate-500 focus:border-slate-500"
              placeholder="새 비밀번호 확인"
              required
            />
          </div>
          
          <button
            type="submit"
            disabled={loading}
            className="w-full py-2 px-4 bg-slate-800 hover:bg-slate-700 text-white font-medium rounded transition-colors disabled:opacity-50"
          >
            {loading ? '처리 중...' : '비밀번호 변경'}
          </button>
        </form>
      </div>
    </div>
  );
} 