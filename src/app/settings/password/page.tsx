'use client';

import { useState } from 'react';
import { useAuth } from '@/app/context/AuthContext';
import { toast, ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import { createClient } from '@/app/lib/supabase-browser';

export default function PasswordSettings() {
  const { user } = useAuth();
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  
  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    
    if (!user) return;
    
    // 비밀번호 유효성 검사
    if (newPassword.length < 6) {
      toast.error('비밀번호는 최소 6자 이상이어야 합니다.');
      return;
    }
    
    if (newPassword !== confirmPassword) {
      toast.error('새 비밀번호와 확인이 일치하지 않습니다.');
      return;
    }
    
    try {
      setIsLoading(true);
      
      const supabase = createClient();
      
      // 현재 비밀번호로 로그인 시도하여 검증
      const { error: signInError } = await supabase.auth.signInWithPassword({
        email: user.email!,
        password: currentPassword,
      });
      
      if (signInError) {
        toast.error('현재 비밀번호가 올바르지 않습니다.');
        return;
      }
      
      // 비밀번호 업데이트
      const { error } = await supabase.auth.updateUser({
        password: newPassword
      });
      
      if (error) throw error;
      
      // 입력 필드 초기화
      setCurrentPassword('');
      setNewPassword('');
      setConfirmPassword('');
      
      toast.success('비밀번호가 성공적으로 변경되었습니다.');
    } catch (error: unknown) {
      console.error('비밀번호 변경 오류:', error);
      
      // 에러 객체가 message 속성을 가지고 있는지 확인
      if (error && typeof error === 'object' && 'message' in error) {
        toast.error((error as { message: string }).message || '비밀번호 변경 중 오류가 발생했습니다.');
      } else {
        toast.error('비밀번호 변경 중 오류가 발생했습니다.');
      }
    } finally {
      setIsLoading(false);
    }
  };

  if (!user) {
    return <div>로딩 중...</div>;
  }

  return (
    <div>
      <h2 className="text-xl font-semibold mb-4">비밀번호 변경</h2>
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="block text-gray-700 mb-1">현재 비밀번호</label>
          <input
            type="password"
            value={currentPassword}
            onChange={(e) => setCurrentPassword(e.target.value)}
            className="w-full p-2 border rounded bg-white"
            required
          />
        </div>
        
        <div>
          <label className="block text-gray-700 mb-1">새 비밀번호</label>
          <input
            type="password"
            value={newPassword}
            onChange={(e) => setNewPassword(e.target.value)}
            className="w-full p-2 border rounded bg-white"
            required
            minLength={6}
          />
          <p className="text-xs text-gray-500 mt-1">비밀번호는 최소 6자 이상이어야 합니다.</p>
        </div>
        
        <div>
          <label className="block text-gray-700 mb-1">새 비밀번호 확인</label>
          <input
            type="password"
            value={confirmPassword}
            onChange={(e) => setConfirmPassword(e.target.value)}
            className="w-full p-2 border rounded bg-white"
            required
          />
        </div>
        
        <button
          type="submit"
          disabled={isLoading}
          className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-white rounded disabled:opacity-50"
        >
          {isLoading ? '변경 중...' : '비밀번호 변경'}
        </button>
      </form>
      <ToastContainer position="top-right" autoClose={2000} />
    </div>
  );
} 