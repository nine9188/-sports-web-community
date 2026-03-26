"use client";

import { useState, Suspense } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { toast } from 'react-toastify';
import { sendIdRecoveryCode, findUsernameWithCode } from '@/domains/auth/actions';
import { AlertCircle, Check, Mail } from 'lucide-react';
import { Button } from '@/shared/components/ui';
import BrandingPanel from '../../components/BrandingPanel';

function FindIdContent() {
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [fullName, setFullName] = useState('');
  const [loading, setLoading] = useState(false);
  const [verificationSent, setVerificationSent] = useState(false);
  const [verificationCode, setVerificationCode] = useState('');

  const [emailValid, setEmailValid] = useState(false);
  const [emailError, setEmailError] = useState('');
  const [fullNameValid, setFullNameValid] = useState(false);
  const [fullNameError, setFullNameError] = useState('');
  const [codeValid, setCodeValid] = useState(false);
  const [codeError, setCodeError] = useState('');

  const validateEmail = (value: string) => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!value) {
      setEmailError('이메일을 입력해주세요.');
      setEmailValid(false);
      return false;
    } else if (!emailRegex.test(value)) {
      setEmailError('유효한 이메일 주소를 입력해주세요.');
      setEmailValid(false);
      return false;
    } else {
      setEmailError('');
      setEmailValid(true);
      return true;
    }
  };

  const validateFullName = (value: string) => {
    if (!value) {
      setFullNameError('이름을 입력해주세요.');
      setFullNameValid(false);
      return false;
    } else if (value.length < 2) {
      setFullNameError('이름은 2자 이상이어야 합니다.');
      setFullNameValid(false);
      return false;
    } else {
      setFullNameError('');
      setFullNameValid(true);
      return true;
    }
  };

  const validateCode = (value: string) => {
    if (!value) {
      setCodeError('인증코드를 입력해주세요.');
      setCodeValid(false);
      return false;
    } else if (value.length !== 6) {
      setCodeError('인증코드는 6자리입니다.');
      setCodeValid(false);
      return false;
    } else {
      setCodeError('');
      setCodeValid(true);
      return true;
    }
  };

  const sendVerificationCode = async () => {
    if (!email || !fullName) {
      toast.error('이름과 이메일을 모두 입력해주세요.');
      return;
    }

    try {
      setLoading(true);
      const result = await sendIdRecoveryCode(email, fullName);

      if (!result.success) {
        toast.error(result.error || '인증 코드 발송에 실패했습니다.');
        return;
      }

      setVerificationSent(true);
      toast.success(result.message || '인증 코드가 이메일로 전송되었습니다.');
    } catch (error: unknown) {
      console.error('이메일 인증 오류:', error);
      toast.error('인증 코드 발송 중 오류가 발생했습니다.');
    } finally {
      setLoading(false);
    }
  };

  const handleFindId = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!email || !verificationCode) {
      toast.error('이메일과 인증 코드를 입력해주세요.');
      return;
    }

    try {
      setLoading(true);
      const result = await findUsernameWithCode(email, verificationCode);

      if (!result.success) {
        toast.error('error' in result ? result.error || '아이디 찾기에 실패했습니다.' : '아이디 찾기에 실패했습니다.');
        return;
      }

      if ('username' in result) {
        const params = new URLSearchParams({
          type: 'id',
          username: result.username || '',
          maskedUsername: 'maskedUsername' in result ? (result.maskedUsername || '') : ''
        });
        router.push(`/help/account-found?${params.toString()}`);
      } else {
        toast.error('결과 데이터가 올바르지 않습니다.');
      }
    } catch (error: unknown) {
      console.error('아이디 찾기 오류:', error);
      toast.error('계정 정보를 찾는 중 오류가 발생했습니다.');
    } finally {
      setLoading(false);
    }
  };

  const inputBaseClass = "w-full px-4 py-3 border rounded-lg outline-none focus:outline-none focus-visible:outline-none focus-visible:ring-0 focus-visible:ring-offset-0 bg-white dark:bg-[#1D1D1D] text-gray-900 dark:text-[#F0F0F0] text-base transition-colors";

  return (
    <div className="w-full lg:w-1/2 max-w-md lg:max-w-none md:bg-white md:dark:bg-[#2D2D2D] md:rounded-lg lg:rounded-l-none md:shadow-lg md:border md:border-black/10 md:dark:border-white/10 lg:border-l-0 md:p-8 lg:p-14 flex flex-col justify-center">
      <div>
        <div className="mb-6">
          <h2 className="text-2xl font-bold text-gray-900 dark:text-[#F0F0F0] mb-2">아이디 찾기</h2>
          <p className="text-gray-600 dark:text-gray-400">
            가입시 사용한 이름과 이메일로 아이디를 찾을 수 있습니다.
          </p>
        </div>

        <form onSubmit={handleFindId} className="space-y-6">
          <div>
            <label htmlFor="fullName" className="block text-gray-700 dark:text-gray-300 mb-1.5 text-[13px] font-medium">
              이름
            </label>
            <div className="relative">
              <input
                id="fullName"
                type="text"
                value={fullName}
                onChange={(e) => { setFullName(e.target.value); validateFullName(e.target.value); }}
                onBlur={() => validateFullName(fullName)}
                className={`${inputBaseClass} ${
                  fullNameError ? 'border-red-500 dark:border-red-400' :
                  fullNameValid ? 'border-green-500 dark:border-green-400' :
                  'border-black/7 dark:border-white/10 focus:border-black/10 dark:focus:border-white/20 focus:bg-[#F5F5F5] dark:focus:bg-[#262626]'
                } ${verificationSent ? 'bg-[#F5F5F5] dark:bg-[#262626]' : ''}`}
                placeholder="가입시 입력한 이름"
                readOnly={verificationSent}
                required
              />
              {fullNameValid && !fullNameError && !verificationSent && (
                <div className="absolute right-3 top-1/2 transform -translate-y-1/2">
                  <Check className="h-5 w-5 text-green-500" />
                </div>
              )}
            </div>
            {fullNameError && (
              <p className="mt-1 text-[13px] text-red-600 flex items-center">
                <AlertCircle className="h-4 w-4 mr-1" />{fullNameError}
              </p>
            )}
          </div>

          <div>
            <label htmlFor="email" className="block text-gray-700 dark:text-gray-300 mb-1.5 text-[13px] font-medium">
              이메일 주소
            </label>
            <div className="relative">
              <input
                id="email"
                type="email"
                value={email}
                onChange={(e) => { setEmail(e.target.value); validateEmail(e.target.value); }}
                onBlur={() => validateEmail(email)}
                className={`${inputBaseClass} ${
                  emailError ? 'border-red-500 dark:border-red-400' :
                  emailValid ? 'border-green-500 dark:border-green-400' :
                  'border-black/7 dark:border-white/10 focus:border-black/10 dark:focus:border-white/20 focus:bg-[#F5F5F5] dark:focus:bg-[#262626]'
                } ${verificationSent ? 'bg-[#F5F5F5] dark:bg-[#262626]' : ''}`}
                placeholder="가입시 사용한 이메일"
                readOnly={verificationSent}
                required
              />
              {emailValid && !emailError && !verificationSent && (
                <div className="absolute right-3 top-1/2 transform -translate-y-1/2">
                  <Check className="h-5 w-5 text-green-500" />
                </div>
              )}
              {verificationSent && (
                <div className="absolute right-3 top-1/2 transform -translate-y-1/2">
                  <Mail className="h-5 w-5 text-gray-500" />
                </div>
              )}
            </div>
            {emailError && (
              <p className="mt-1 text-[13px] text-red-600 flex items-center">
                <AlertCircle className="h-4 w-4 mr-1" />{emailError}
              </p>
            )}
          </div>

          {!verificationSent && (
            <Button
              type="button"
              variant="primary"
              onClick={sendVerificationCode}
              disabled={loading || !emailValid || !fullNameValid}
              className="w-full py-3 h-auto"
            >
              {loading ? '발송중...' : '인증코드 받기'}
            </Button>
          )}

          {verificationSent && (
            <>
              <div>
                <label htmlFor="verification-code" className="block text-gray-700 dark:text-gray-300 mb-1.5 text-[13px] font-medium">
                  인증 코드
                </label>
                <div className="relative">
                  <input
                    id="verification-code"
                    type="text"
                    value={verificationCode}
                    onChange={(e) => { setVerificationCode(e.target.value); validateCode(e.target.value); }}
                    onBlur={() => validateCode(verificationCode)}
                    className={`${inputBaseClass} ${
                      codeError ? 'border-red-500 dark:border-red-400' :
                      codeValid ? 'border-green-500 dark:border-green-400' :
                      'border-black/7 dark:border-white/10 focus:border-black/10 dark:focus:border-white/20 focus:bg-[#F5F5F5] dark:focus:bg-[#262626]'
                    }`}
                    placeholder="6자리 인증코드"
                    maxLength={6}
                    required
                  />
                  {codeValid && !codeError && (
                    <div className="absolute right-3 top-1/2 transform -translate-y-1/2">
                      <Check className="h-5 w-5 text-green-500" />
                    </div>
                  )}
                </div>
                {codeError && (
                  <p className="mt-1 text-[13px] text-red-600 flex items-center">
                    <AlertCircle className="h-4 w-4 mr-1" />{codeError}
                  </p>
                )}
                <p className="text-xs text-gray-500 dark:text-gray-400 mt-2">
                  이메일로 받은 인증 코드를 입력해주세요. 인증 코드는 5분간 유효합니다.
                </p>
                <Button
                  type="button"
                  variant="link"
                  onClick={() => { setVerificationSent(false); setVerificationCode(''); setCodeValid(false); setCodeError(''); }}
                  className="text-xs text-gray-600 hover:text-gray-800 dark:text-gray-400 dark:hover:text-gray-200 p-0 h-auto mt-1"
                >
                  다른 이메일로 재발송
                </Button>
              </div>

              <Button
                type="submit"
                variant="primary"
                disabled={loading || !codeValid}
                className="w-full py-3 h-auto"
              >
                {loading ? '처리 중...' : '아이디 찾기'}
              </Button>
            </>
          )}
        </form>

        <div className="mt-8 text-center space-y-3">
          <p className="text-gray-600 dark:text-gray-400">
            비밀번호를 잊으셨나요?{' '}
            <Link href="/help/find-password" className="text-gray-700 dark:text-gray-300 hover:text-gray-900 dark:hover:text-[#F0F0F0] hover:underline font-medium transition-colors">
              비밀번호 찾기
            </Link>
          </p>
          <p className="text-gray-600 dark:text-gray-400">
            계정이 기억나셨나요?{' '}
            <Link href="/signin" className="text-gray-700 dark:text-gray-300 hover:text-gray-900 dark:hover:text-[#F0F0F0] hover:underline font-medium transition-colors">
              로그인
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}

export default function FindIdPage() {
  return (
    <div className="flex flex-col items-center lg:justify-center min-h-[calc(100vh-120px)]">
      <div className="flex flex-col lg:flex-row w-full max-w-md lg:max-w-full">
        <BrandingPanel variant="find-id" />
        <Suspense fallback={
          <div className="w-full lg:w-1/2 max-w-md lg:max-w-none md:bg-white md:dark:bg-[#2D2D2D] md:rounded-lg lg:rounded-l-none md:shadow-lg md:border md:border-black/10 md:dark:border-white/10 lg:border-l-0 md:p-8">
            <div className="animate-pulse">
              <div className="h-8 bg-[#EAEAEA] dark:bg-[#333333] rounded w-48 mb-2"></div>
              <div className="h-4 bg-[#EAEAEA] dark:bg-[#333333] rounded w-full mb-2"></div>
              <div className="h-4 bg-[#EAEAEA] dark:bg-[#333333] rounded w-3/4 mb-8"></div>
              <div className="space-y-4">
                <div className="h-12 bg-[#EAEAEA] dark:bg-[#333333] rounded"></div>
                <div className="h-12 bg-[#EAEAEA] dark:bg-[#333333] rounded"></div>
                <div className="h-12 bg-[#EAEAEA] dark:bg-[#333333] rounded"></div>
              </div>
            </div>
          </div>
        }>
          <FindIdContent />
        </Suspense>
      </div>
      <div className="mt-8 flex space-x-4 text-[13px] text-gray-500 dark:text-gray-400">
        <Link href="/terms" className="hover:text-gray-900 dark:hover:text-[#F0F0F0] hover:underline transition-colors">이용약관</Link>
        <Link href="/privacy" className="hover:text-gray-900 dark:hover:text-[#F0F0F0] hover:underline transition-colors">개인정보처리방침</Link>
      </div>
    </div>
  );
}
