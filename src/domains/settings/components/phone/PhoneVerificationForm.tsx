'use client';

import React, { useState, useEffect } from 'react';
import { X } from 'lucide-react';
import { sendPhoneVerificationCode, verifyPhoneCode, getPhoneVerificationStatus } from '../../actions/phone';
import { Button } from '@/shared/components/ui';

interface PhoneVerificationFormProps {
  userId: string;
}

// 전화번호 마스킹 (010-****-1601)
function maskPhoneNumber(phone: string): string {
  const normalized = phone.replace(/[^0-9]/g, '');
  if (normalized.length < 10) return phone;
  return `${normalized.slice(0, 3)}-****-${normalized.slice(-4)}`;
}

export default function PhoneVerificationForm({ userId }: PhoneVerificationFormProps) {
  const [phoneNumber, setPhoneNumber] = useState('');
  const [code, setCode] = useState('');
  const [step, setStep] = useState<'input' | 'verify' | 'completed'>('input');
  const [isLoading, setIsLoading] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error' | 'info'; text: string } | null>(null);
  const [countdown, setCountdown] = useState(0);
  const [expiryTime, setExpiryTime] = useState(0);
  const [verifiedPhone, setVerifiedPhone] = useState<string | null>(null);
  const [reward, setReward] = useState<{ points: number; exp: number } | null>(null);

  // 초기 상태 로드
  useEffect(() => {
    const loadStatus = async () => {
      const result = await getPhoneVerificationStatus();
      if (result.success && result.verified) {
        setStep('completed');
        setVerifiedPhone(result.phoneNumber || null);
      }
    };
    loadStatus();
  }, []);

  // 재발송 쿨다운 타이머
  useEffect(() => {
    if (countdown > 0) {
      const timer = setTimeout(() => setCountdown(countdown - 1), 1000);
      return () => clearTimeout(timer);
    }
  }, [countdown]);

  // 인증번호 유효시간 타이머
  useEffect(() => {
    if (expiryTime > 0) {
      const timer = setTimeout(() => setExpiryTime(expiryTime - 1), 1000);
      return () => clearTimeout(timer);
    } else if (expiryTime === 0 && step === 'verify') {
      setMessage({ type: 'error', text: '인증번호가 만료되었습니다. 다시 요청해주세요.' });
    }
  }, [expiryTime, step]);

  // 유효시간 포맷 (M:SS)
  const formatTime = (seconds: number) => {
    const m = Math.floor(seconds / 60);
    const s = seconds % 60;
    return `${m}:${s.toString().padStart(2, '0')}`;
  };

  // 인증번호 발송
  const handleSendCode = async () => {
    if (!phoneNumber.trim()) {
      setMessage({ type: 'error', text: '휴대폰번호를 입력해주세요.' });
      return;
    }

    setIsLoading(true);
    setMessage(null);

    const result = await sendPhoneVerificationCode(phoneNumber.replace(/[^0-9]/g, ''));

    setIsLoading(false);

    if (result.success) {
      setStep('verify');
      setCountdown(60);
      setExpiryTime(180); // 3분
      setMessage({ type: 'info', text: `인증번호가 발송되었습니다. 유효시간 ${formatTime(180)}` });
    } else {
      setMessage({ type: 'error', text: result.error || '인증번호 발송에 실패했습니다.' });
    }
  };

  // 인증번호 확인
  const handleVerifyCode = async () => {
    if (!code.trim() || code.length !== 6) {
      setMessage({ type: 'error', text: '6자리 인증번호를 입력해주세요.' });
      return;
    }

    setIsLoading(true);
    setMessage(null);

    const result = await verifyPhoneCode(phoneNumber.replace(/[^0-9]/g, ''), code);

    setIsLoading(false);

    if (result.success) {
      setStep('completed');
      setVerifiedPhone(phoneNumber);
      setReward(result.reward || null);
      setMessage({ type: 'success', text: '인증이 완료되었습니다.' });
    } else {
      setMessage({ type: 'error', text: result.error || '인증에 실패했습니다.' });
    }
  };

  // 입력 초기화
  const handleClearPhone = () => {
    setPhoneNumber('');
    setCode('');
    setStep('input');
    setMessage(null);
    setExpiryTime(0);
  };

  const handleClearCode = () => {
    setCode('');
  };

  // 인증 완료 상태
  if (step === 'completed') {
    return (
      <div className="space-y-4">
        <div className="space-y-2">
          <label className="block text-sm font-medium text-gray-900 dark:text-[#F0F0F0]">
            휴대폰번호
          </label>
          <div className="flex items-center gap-2">
            <input
              type="text"
              value={verifiedPhone ? maskPhoneNumber(verifiedPhone) : ''}
              disabled
              className="flex-1 px-3 py-2 border border-black/7 dark:border-white/10 bg-[#EAEAEA] dark:bg-[#333333] text-gray-900 dark:text-[#F0F0F0] rounded-md cursor-not-allowed"
            />
            <Button
              variant="secondary"
              disabled
              className="whitespace-nowrap"
            >
              인증완료
            </Button>
          </div>
          <p className="text-sm text-gray-700 dark:text-gray-300">
            인증이 완료되었습니다.
          </p>
          {reward && (
            <p className="text-sm text-gray-500 dark:text-gray-400">
              보상 지급: 포인트 +{reward.points}P / 경험치 +{reward.exp}EXP
            </p>
          )}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* 휴대폰번호 입력 */}
      <div className="space-y-2">
        <label className="block text-sm font-medium text-gray-900 dark:text-[#F0F0F0]">
          휴대폰번호
        </label>
        <div className="flex items-center gap-2">
          <div className="relative flex-1">
            <input
              type="tel"
              value={phoneNumber}
              onChange={(e) => setPhoneNumber(e.target.value.replace(/[^0-9]/g, ''))}
              disabled={step === 'verify' || isLoading}
              placeholder="휴대폰번호를 입력하세요."
              maxLength={11}
              className="w-full px-3 py-2 pr-8 border border-black/7 dark:border-white/10 bg-white dark:bg-[#1D1D1D] text-gray-900 dark:text-[#F0F0F0] rounded-md outline-none focus:outline-none focus-visible:outline-none focus-visible:ring-0 focus-visible:ring-offset-0 focus:bg-[#EAEAEA] dark:focus:bg-[#333333] disabled:bg-[#EAEAEA] dark:disabled:bg-[#333333] disabled:cursor-not-allowed transition-colors"
            />
            {phoneNumber && step !== 'verify' && (
              <Button
                type="button"
                variant="ghost"
                size="icon"
                onClick={handleClearPhone}
                className="absolute right-2 top-1/2 -translate-y-1/2 h-6 w-6 text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300"
              >
                <X className="h-4 w-4" />
              </Button>
            )}
          </div>
          <Button
            variant="secondary"
            onClick={handleSendCode}
            disabled={isLoading || countdown > 0 || !phoneNumber.trim()}
            className="whitespace-nowrap"
          >
            {countdown > 0 ? `${countdown}초` : '인증번호 받기'}
          </Button>
        </div>
      </div>

      {/* 인증번호 입력 */}
      <div className="space-y-2">
        <div className="flex items-center gap-2">
          <div className="relative flex-1">
            <input
              type="text"
              value={code}
              onChange={(e) => setCode(e.target.value.replace(/[^0-9]/g, '').slice(0, 6))}
              disabled={step !== 'verify' || isLoading}
              placeholder="인증번호 입력"
              maxLength={6}
              className="w-full px-3 py-2 pr-8 border border-black/7 dark:border-white/10 bg-white dark:bg-[#1D1D1D] text-gray-900 dark:text-[#F0F0F0] rounded-md outline-none focus:outline-none focus-visible:outline-none focus-visible:ring-0 focus-visible:ring-offset-0 focus:bg-[#EAEAEA] dark:focus:bg-[#333333] disabled:bg-[#EAEAEA] dark:disabled:bg-[#333333] disabled:cursor-not-allowed transition-colors"
            />
            {code && step === 'verify' && (
              <Button
                type="button"
                variant="ghost"
                size="icon"
                onClick={handleClearCode}
                className="absolute right-2 top-1/2 -translate-y-1/2 h-6 w-6 text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300"
              >
                <X className="h-4 w-4" />
              </Button>
            )}
          </div>
          <Button
            variant="secondary"
            onClick={handleVerifyCode}
            disabled={step !== 'verify' || isLoading || code.length !== 6}
            className="whitespace-nowrap"
          >
            인증하기
          </Button>
        </div>

        {/* 메시지 */}
        {message && (
          <p className={`text-sm ${
            message.type === 'error'
              ? 'text-red-500 dark:text-red-400'
              : 'text-gray-700 dark:text-gray-300'
          }`}>
            {message.text}
            {step === 'verify' && expiryTime > 0 && message.type === 'info' && (
              <span> 유효시간 {formatTime(expiryTime)}</span>
            )}
          </p>
        )}

        {/* 유효시간만 표시 (메시지 없을 때) */}
        {step === 'verify' && expiryTime > 0 && !message && (
          <p className="text-sm text-gray-700 dark:text-gray-300">
            인증번호가 발송되었습니다. 유효시간 {formatTime(expiryTime)}
          </p>
        )}
      </div>

      {/* 안내 문구 */}
      <p className="text-xs text-gray-500 dark:text-gray-400">
        인증 완료 시 포인트 500P와 경험치 100EXP가 지급됩니다.
      </p>
    </div>
  );
}
