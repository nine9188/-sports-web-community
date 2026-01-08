'use client';

import React, { useState } from 'react';
import { Eye, EyeOff } from 'lucide-react';
import { toast } from 'react-toastify';
import { changePassword } from '@/domains/settings';
import TurnstileWidget from '@/shared/components/TurnstileWidget';
import Spinner from '@/shared/components/Spinner';

interface PasswordFormProps {
  isOAuthAccount?: boolean;
}

export default function PasswordForm({ isOAuthAccount = false }: PasswordFormProps) {

  const [formData, setFormData] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: '',
  });

  const [errors, setErrors] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: '',
  });

  const [isLoading, setIsLoading] = useState(false);
  const [showCurrentPassword, setShowCurrentPassword] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [captchaToken, setCaptchaToken] = useState<string | null>(null);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
    
    // 에러 초기화
    setErrors(prev => ({ ...prev, [name]: '' }));
  };

  const validateForm = (): boolean => {
    let isValid = true;
    const newErrors = { ...errors };

    // 현재 비밀번호 검증
    if (!formData.currentPassword) {
      newErrors.currentPassword = '현재 비밀번호를 입력해주세요.';
      isValid = false;
    }

    // 새 비밀번호 검증
    if (!formData.newPassword) {
      newErrors.newPassword = '새 비밀번호를 입력해주세요.';
      isValid = false;
    } else if (formData.newPassword.length < 8) {
      newErrors.newPassword = '비밀번호는 최소 8자 이상이어야 합니다.';
      isValid = false;
    }

    // 비밀번호 확인 검증
    if (formData.newPassword !== formData.confirmPassword) {
      newErrors.confirmPassword = '비밀번호가 일치하지 않습니다.';
      isValid = false;
    }

    setErrors(newErrors);
    return isValid;
  };

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();

    // OAuth 계정은 비밀번호 변경 불가
    if (isOAuthAccount) {
      toast.error('소셜 로그인 계정은 비밀번호를 변경할 수 없습니다.');
      return;
    }

    if (!validateForm()) {
      return;
    }

    if (!captchaToken) {
      toast.error('봇 검증을 완료해주세요.');
      return;
    }

    // 비밀번호 변경 확인 다이얼로그
    const confirmed = window.confirm(
      '비밀번호를 변경하시겠습니까?\n\n변경 후 페이지가 새로고침됩니다.'
    );

    if (!confirmed) {
      return;
    }

    setIsLoading(true);

    try {
      const result = await changePassword(
        formData.currentPassword,
        formData.newPassword,
        captchaToken
      );

      if (!result.success) {
        throw new Error(result.error);
      }

      // 비밀번호 변경 성공
      toast.success('비밀번호가 변경되었습니다.');

      // Supabase는 비밀번호 변경 시 자동으로 새 세션을 발급하므로
      // 메인 페이지로 이동하면 새 세션으로 자동 로그인됨
      window.location.href = '/';
    } catch (error) {
      console.error('비밀번호 변경 오류:', error);
      toast.error(error instanceof Error ? error.message : '비밀번호 변경에 실패했습니다. 다시 시도해주세요.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div>
      <form onSubmit={handleSubmit} className="space-y-4">
        {/* 봇 검증 (소셜 로그인 계정은 표시하지 않음) */}
        {!isOAuthAccount && (
          <div className="space-y-1">
            <label className="block text-sm font-medium text-gray-900 dark:text-[#F0F0F0]">봇 검증</label>
            <TurnstileWidget
              siteKey={process.env.NEXT_PUBLIC_TURNSTILE_SITE_KEY as string}
              onToken={setCaptchaToken}
              className="w-full"
            />
            <p className="text-xs text-gray-500 dark:text-gray-400">보안을 위해 자동 입력 방지를 확인합니다.</p>
          </div>
        )}

        {/* 현재 비밀번호 필드 */}
        <div className="space-y-1">
          <label htmlFor="currentPassword" className="block text-sm font-medium text-gray-900 dark:text-[#F0F0F0]">
            현재 비밀번호
          </label>
          <div className="relative">
            <input
              type={showCurrentPassword ? "text" : "password"}
              id="currentPassword"
              name="currentPassword"
              value={formData.currentPassword}
              onChange={handleChange}
              disabled={isLoading || isOAuthAccount}
              className={`w-full px-3 py-2 border ${errors.currentPassword ? 'border-red-500 dark:border-red-500' : 'border-black/7 dark:border-white/10'} rounded-md shadow-sm bg-white dark:bg-[#1D1D1D] text-gray-900 dark:text-[#F0F0F0] outline-none focus:outline-none focus-visible:outline-none focus-visible:ring-0 focus-visible:ring-offset-0 focus:bg-[#EAEAEA] dark:focus:bg-[#333333] disabled:bg-[#EAEAEA] disabled:dark:bg-[#333333] disabled:cursor-not-allowed transition-colors`}
            />
            <button
              type="button"
              className="absolute inset-y-0 right-0 pr-3 flex items-center text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300 outline-none focus:outline-none focus-visible:outline-none focus-visible:ring-0 focus-visible:ring-offset-0 transition-colors"
              onClick={() => setShowCurrentPassword(!showCurrentPassword)}
            >
              {showCurrentPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
            </button>
          </div>
          {errors.currentPassword && (
            <p className="text-xs text-red-500 dark:text-red-400">{errors.currentPassword}</p>
          )}
        </div>

        {/* 새 비밀번호 필드 */}
        <div className="space-y-1">
          <label htmlFor="newPassword" className="block text-sm font-medium text-gray-900 dark:text-[#F0F0F0]">
            새 비밀번호
          </label>
          <div className="relative">
            <input
              type={showNewPassword ? "text" : "password"}
              id="newPassword"
              name="newPassword"
              value={formData.newPassword}
              onChange={handleChange}
              disabled={isLoading || isOAuthAccount}
              className={`w-full px-3 py-2 border ${errors.newPassword ? 'border-red-500 dark:border-red-500' : 'border-black/7 dark:border-white/10'} rounded-md shadow-sm bg-white dark:bg-[#1D1D1D] text-gray-900 dark:text-[#F0F0F0] outline-none focus:outline-none focus-visible:outline-none focus-visible:ring-0 focus-visible:ring-offset-0 focus:bg-[#EAEAEA] dark:focus:bg-[#333333] disabled:bg-[#EAEAEA] disabled:dark:bg-[#333333] disabled:cursor-not-allowed transition-colors`}
            />
            <button
              type="button"
              className="absolute inset-y-0 right-0 pr-3 flex items-center text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300 outline-none focus:outline-none focus-visible:outline-none focus-visible:ring-0 focus-visible:ring-offset-0 transition-colors"
              onClick={() => setShowNewPassword(!showNewPassword)}
            >
              {showNewPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
            </button>
          </div>
          {errors.newPassword ? (
            <p className="text-xs text-red-500 dark:text-red-400">{errors.newPassword}</p>
          ) : (
            <p className="text-xs text-gray-500 dark:text-gray-400">비밀번호는 최소 8자 이상이어야 합니다.</p>
          )}
        </div>

        {/* 비밀번호 확인 필드 */}
        <div className="space-y-1">
          <label htmlFor="confirmPassword" className="block text-sm font-medium text-gray-900 dark:text-[#F0F0F0]">
            비밀번호 확인
          </label>
          <div className="relative">
            <input
              type={showConfirmPassword ? "text" : "password"}
              id="confirmPassword"
              name="confirmPassword"
              value={formData.confirmPassword}
              onChange={handleChange}
              disabled={isLoading || isOAuthAccount}
              className={`w-full px-3 py-2 border ${errors.confirmPassword ? 'border-red-500 dark:border-red-500' : 'border-black/7 dark:border-white/10'} rounded-md shadow-sm bg-white dark:bg-[#1D1D1D] text-gray-900 dark:text-[#F0F0F0] outline-none focus:outline-none focus-visible:outline-none focus-visible:ring-0 focus-visible:ring-offset-0 focus:bg-[#EAEAEA] dark:focus:bg-[#333333] disabled:bg-[#EAEAEA] disabled:dark:bg-[#333333] disabled:cursor-not-allowed transition-colors`}
            />
            <button
              type="button"
              className="absolute inset-y-0 right-0 pr-3 flex items-center text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300 outline-none focus:outline-none focus-visible:outline-none focus-visible:ring-0 focus-visible:ring-offset-0 transition-colors"
              onClick={() => setShowConfirmPassword(!showConfirmPassword)}
            >
              {showConfirmPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
            </button>
          </div>
          {errors.confirmPassword && (
            <p className="text-xs text-red-500 dark:text-red-400">{errors.confirmPassword}</p>
          )}
        </div>

        {/* 제출 버튼 */}
        <div className="pt-4 flex justify-end">
          <button
            type="submit"
            disabled={isLoading || isOAuthAccount}
            className="px-4 py-2 bg-slate-800 dark:bg-[#3F3F3F] text-white hover:bg-slate-700 dark:hover:bg-[#4A4A4A] outline-none focus:outline-none focus-visible:outline-none focus-visible:ring-0 focus-visible:ring-offset-0 disabled:opacity-50 disabled:cursor-not-allowed flex items-center rounded-md transition-colors"
            >
            {isLoading && <Spinner size="xs" className="mr-2" />}
            <span className="text-sm">비밀번호 변경</span>
          </button>
        </div>
      </form>
    </div>
  );
} 