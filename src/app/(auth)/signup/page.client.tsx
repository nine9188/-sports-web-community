"use client";

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { toast } from 'react-toastify';
import Link from 'next/link';
import { useAuth } from '@/shared/context/AuthContext';
import { getSupabaseBrowser } from '@/shared/lib/supabase';
import { signUp, checkEmailAvailability } from '@/domains/auth/actions';
import { validateReferralCode } from '@/shared/actions/referral-actions';
import { AlertCircle, Check, Eye, EyeOff, Gift, Calendar as CalendarIcon } from 'lucide-react';
import KakaoLoginButton from '@/domains/auth/components/KakaoLoginButton';
import TurnstileWidget from '@/shared/components/TurnstileWidget';
import { TermsContent, PrivacyContent } from '@/shared/components/legal';
import Calendar from '@/shared/components/Calendar';
import { Button } from '@/shared/components/ui';

export default function SignupPage() {
  const router = useRouter();
  const { user } = useAuth();
  const [isLoading, setIsLoading] = useState(false);
  const [captchaToken, setCaptchaToken] = useState<string | null>(null);
  
  // 단계 표시 상태
  const [showEmailStep, setShowEmailStep] = useState(false);
  const [showNameStep, setShowNameStep] = useState(false);
  const [showBirthStep, setShowBirthStep] = useState(false);
  const [showIdStep, setShowIdStep] = useState(false);
  const [showNicknameStep, setShowNicknameStep] = useState(false);
  const [showPasswordStep, setShowPasswordStep] = useState(false);
  
  // 입력값 상태
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [username, setUsername] = useState('');
  const [nickname, setNickname] = useState('');
  const [fullName, setFullName] = useState('');
  const [birthDate, setBirthDate] = useState('');
  
  // 유효성 검사 상태
  const [emailValid, setEmailValid] = useState(false);
  const [emailError, setEmailError] = useState('');
  const [isCheckingEmail, setIsCheckingEmail] = useState(false);
  const [emailChecked, setEmailChecked] = useState(false);
  const [emailAvailable, setEmailAvailable] = useState(false);
  const [emailMessage, setEmailMessage] = useState('');

  // 이름 유효성 검사 상태
  const [fullNameValid, setFullNameValid] = useState(false);
  const [fullNameError, setFullNameError] = useState('');

  // 생년월일 유효성 검사 상태
  const [birthValid, setBirthValid] = useState(false);
  const [birthError, setBirthError] = useState('');
  const [showCalendar, setShowCalendar] = useState(false);

  const [passwordValid, setPasswordValid] = useState(false);
  const [passwordError, setPasswordError] = useState('');
  const [passwordStrength, setPasswordStrength] = useState<'약함' | '보통' | '강함' | ''>('');
  const [confirmPasswordValid, setConfirmPasswordValid] = useState(false);
  const [confirmPasswordError, setConfirmPasswordError] = useState('');
  
  // 입력필드 상태
  const [showPassword, setShowPassword] = useState(false);
  const [isCheckingUsername, setIsCheckingUsername] = useState(false);
  const [usernameChecked, setUsernameChecked] = useState(false);
  const [usernameMessage, setUsernameMessage] = useState('');
  const [usernameAvailable, setUsernameAvailable] = useState(false);
  
  const [isCheckingNickname, setIsCheckingNickname] = useState(false);
  const [nicknameChecked, setNicknameChecked] = useState(false);
  const [nicknameMessage, setNicknameMessage] = useState('');
  const [nicknameAvailable, setNicknameAvailable] = useState(false);

  // 추천 코드 상태
  const [referralCode, setReferralCode] = useState('');
  const [isCheckingReferral, setIsCheckingReferral] = useState(false);
  const [referralChecked, setReferralChecked] = useState(false);
  const [referralMessage, setReferralMessage] = useState('');
  const [referralValid, setReferralValid] = useState(false);
  const [referrerNickname, setReferrerNickname] = useState('');

  // 약관 동의 상태
  const [agreeTerms, setAgreeTerms] = useState(false);
  const [agreePrivacy, setAgreePrivacy] = useState(false);

  // 약관 동의 후 다음 단계로
  const handleAgreeSubmit = () => {
    if (agreeTerms && agreePrivacy && captchaToken) {
      setShowEmailStep(true);
    }
  };

  // 이미 로그인된 사용자 처리
  useEffect(() => {
    if (user) {
      toast.info('이미 로그인되어 있습니다.');
      const timer = setTimeout(() => {
        router.push('/');
      }, 1500);
      
      return () => clearTimeout(timer);
    }
  }, [user, router]);
  
  // 이메일 유효성 검사
  const validateEmail = (value: string) => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!value) {
      setEmailError('이메일을 입력해주세요.');
      setEmailValid(false);
      setEmailChecked(false);
      setEmailAvailable(false);
      return false;
    } else if (!emailRegex.test(value)) {
      setEmailError('유효한 이메일 주소를 입력해주세요.');
      setEmailValid(false);
      setEmailChecked(false);
      setEmailAvailable(false);
      return false;
    } else {
      setEmailError('');
      setEmailValid(true);
      return true;
    }
  };

  // 이메일 중복 확인
  const checkEmail = async () => {
    if (!email) {
      setEmailMessage('이메일을 입력해주세요.');
      return;
    }

    if (!validateEmail(email)) {
      return;
    }

    try {
      setIsCheckingEmail(true);

      const result = await checkEmailAvailability(email);

      setEmailChecked(true);
      setEmailAvailable(result.available);
      setEmailMessage(result.message || '');

    } catch (error) {
      console.error('이메일 중복 확인 오류:', error);
      setEmailMessage('이메일 확인 중 오류가 발생했습니다.');
      setEmailAvailable(false);
    } finally {
      setIsCheckingEmail(false);
    }
  };

  // 이름 유효성 검사
  const validateFullName = (value: string) => {
    if (!value || !value.trim()) {
      setFullNameError('이름을 입력해주세요.');
      setFullNameValid(false);
      return false;
    }

    const trimmed = value.trim();

    if (trimmed.length < 2) {
      setFullNameError('이름은 최소 2자 이상이어야 합니다.');
      setFullNameValid(false);
      return false;
    }

    if (trimmed.length > 20) {
      setFullNameError('이름은 최대 20자까지 가능합니다.');
      setFullNameValid(false);
      return false;
    }

    // 한글, 영문, 공백만 허용
    const nameRegex = /^[가-힣a-zA-Z\s]+$/;
    if (!nameRegex.test(trimmed)) {
      setFullNameError('이름은 한글과 영문만 입력 가능합니다.');
      setFullNameValid(false);
      return false;
    }

    setFullNameError('');
    setFullNameValid(true);
    return true;
  };

  // 생년월일 입력 포맷팅 (YYYY.MM.DD)
  const formatBirthDate = (value: string) => {
    // 숫자만 추출
    const numbers = value.replace(/\D/g, '');

    // 포맷팅
    if (numbers.length <= 4) {
      return numbers;
    } else if (numbers.length <= 6) {
      return `${numbers.slice(0, 4)}.${numbers.slice(4)}`;
    } else {
      return `${numbers.slice(0, 4)}.${numbers.slice(4, 6)}.${numbers.slice(6, 8)}`;
    }
  };

  // 생년월일 유효성 검사
  const validateBirthDate = (value: string) => {
    if (!value) {
      setBirthError('생년월일을 입력해주세요.');
      setBirthValid(false);
      return false;
    }

    // YYYY.MM.DD 형식 체크
    const match = value.match(/^(\d{4})\.(\d{2})\.(\d{2})$/);
    if (!match) {
      setBirthError('YYYY.MM.DD 형식으로 입력해주세요.');
      setBirthValid(false);
      return false;
    }

    const [, year, month, day] = match;
    const yearNum = parseInt(year);
    const monthNum = parseInt(month);
    const dayNum = parseInt(day);

    const currentYear = new Date().getFullYear();

    // 연도 검증 (1900 ~ 현재년도)
    if (yearNum < 1900 || yearNum > currentYear) {
      setBirthError('올바른 연도를 입력해주세요.');
      setBirthValid(false);
      return false;
    }

    // 월 검증
    if (monthNum < 1 || monthNum > 12) {
      setBirthError('올바른 월을 입력해주세요.');
      setBirthValid(false);
      return false;
    }

    // 일 검증 (월별 일수 체크)
    const daysInMonth = new Date(yearNum, monthNum, 0).getDate();
    if (dayNum < 1 || dayNum > daysInMonth) {
      setBirthError('올바른 일을 입력해주세요.');
      setBirthValid(false);
      return false;
    }

    // 만 14세 이상 체크
    const birthDateObj = new Date(yearNum, monthNum - 1, dayNum);
    const today = new Date();
    let age = today.getFullYear() - birthDateObj.getFullYear();
    const monthDiff = today.getMonth() - birthDateObj.getMonth();
    if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birthDateObj.getDate())) {
      age--;
    }

    if (age < 14) {
      setBirthError('만 14세 이상만 가입할 수 있습니다.');
      setBirthValid(false);
      return false;
    }

    setBirthError('');
    setBirthValid(true);
    return true;
  };

  // 비밀번호 강도 계산
  const calculatePasswordStrength = (password: string): '약함' | '보통' | '강함' | '' => {
    if (!password) return '';
    
    let score = 0;
    
    // 길이 체크 (10자 이상)
    if (password.length >= 10) score += 2;
    else if (password.length >= 8) score += 1;
    
    // 특수문자 포함
    if (/[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]/.test(password)) score += 2;
    
    // 숫자 포함
    if (/\d/.test(password)) score += 1;
    
    // 대문자 포함
    if (/[A-Z]/.test(password)) score += 1;
    
    // 소문자 포함
    if (/[a-z]/.test(password)) score += 1;
    
    if (score <= 2) return '약함';
    if (score <= 4) return '보통';
    return '강함';
  };
  
  // 비밀번호 유효성 검사
  const validatePassword = (value: string) => {
    const strength = calculatePasswordStrength(value);
    setPasswordStrength(strength);
    
    if (!value) {
      setPasswordError('비밀번호를 입력해주세요.');
      setPasswordValid(false);
      return false;
    } else if (value.length < 10) {
      setPasswordError('비밀번호는 최소 10자 이상이어야 합니다.');
      setPasswordValid(false);
      return false;
    } else if (!/[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]/.test(value)) {
      setPasswordError('비밀번호에 특수문자를 포함해야 합니다.');
      setPasswordValid(false);
      return false;
    } else {
      setPasswordError('');
      setPasswordValid(true);
      return true;
    }
  };
  
  // 비밀번호 확인 유효성 검사
  const validateConfirmPassword = (value: string) => {
    if (!value) {
      setConfirmPasswordError('비밀번호 확인을 입력해주세요.');
      setConfirmPasswordValid(false);
      return false;
    } else if (value !== password) {
      setConfirmPasswordError('비밀번호가 일치하지 않습니다.');
      setConfirmPasswordValid(false);
      return false;
    } else {
      setConfirmPasswordError('');
      setConfirmPasswordValid(true);
      return true;
    }
  };
  
  // 이메일 제출 처리
  const handleEmailSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (emailChecked && emailAvailable) {
      setShowNameStep(true);
    }
  };
  
  // 이름 제출 처리
  const handleNameSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (validateFullName(fullName)) {
      setShowBirthStep(true);
    }
  };

  // 생년월일 제출 처리
  const handleBirthSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (validateBirthDate(birthDate)) {
      setShowIdStep(true);
    }
  };

  // 아이디 제출 처리
  const handleIdSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (usernameChecked && usernameAvailable) {
      setShowNicknameStep(true);
    }
  };
  
  // 닉네임 제출 처리
  const handleNicknameSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (nicknameChecked && nicknameAvailable) {
      setShowPasswordStep(true);
    }
  };
  
  // 아이디 유효성 검사
  const validateUsername = (value: string) => {
    // 길이 체크
    if (value.length < 4) {
      return '아이디는 최소 4자 이상이어야 합니다.';
    }
    if (value.length > 20) {
      return '아이디는 최대 20자까지 가능합니다.';
    }
    
    // 허용 문자 체크 (영문 소문자, 숫자, 밑줄, 마침표)
    if (!/^[a-z0-9._]+$/.test(value)) {
      return '아이디는 영문 소문자, 숫자, 밑줄(_), 마침표(.)만 사용 가능합니다.';
    }
    
    // 연속된 특수문자 체크
    if (/[_.]{2,}/.test(value)) {
      return '연속된 특수문자는 사용할 수 없습니다.';
    }
    
    // 특수문자로 시작하거나 끝나는 경우
    if (/^[_.]|[_.]$/.test(value)) {
      return '아이디는 특수문자로 시작하거나 끝날 수 없습니다.';
    }
    
    // 금지어 체크
    const forbiddenWords = ['admin', 'root', 'operator', 'manager', 'support', 'help', 'service', 'system'];
    if (forbiddenWords.some(word => value.toLowerCase().includes(word))) {
      return '사용할 수 없는 아이디입니다.';
    }
    
    // 아이디와 닉네임 동일 체크
    if (nickname && value === nickname) {
      return '아이디와 닉네임은 같을 수 없습니다.';
    }
    
    return '';
  };

  // 사용자명(아이디) 중복 확인
  const checkUsername = async () => {
    if (!username) {
      setUsernameMessage('아이디를 입력해주세요.');
      return;
    }
    
    // 유효성 검사 먼저 실행
    const validationError = validateUsername(username);
    if (validationError) {
      setUsernameMessage(validationError);
      setUsernameAvailable(false);
      return;
    }
    
    try {
      setIsCheckingUsername(true);
      
      // Supabase 클라이언트 생성
      const supabase = getSupabaseBrowser();
      
      // 프로필 테이블에서 해당 username으로 검색
      const { data, error } = await supabase
        .from('profiles')
        .select('id')
        .eq('username', username);
      
      if (error) {
        console.error('아이디 조회 오류:', error);
        throw error;
      }
      
      // 결과 확인 및 상태 업데이트
      const isAvailable = !data || data.length === 0;
      
      setUsernameChecked(true);
      setUsernameAvailable(isAvailable);
      setUsernameMessage(isAvailable ? '사용 가능한 아이디입니다.' : '이미 사용 중인 아이디입니다.');
      
    } catch (error) {
      console.error('아이디 중복 확인 오류:', error);
      setUsernameMessage('아이디 확인 중 오류가 발생했습니다.');
      setUsernameAvailable(false);
    } finally {
      setIsCheckingUsername(false);
    }
  };
  
  // 닉네임 유효성 검사
  const validateNickname = (value: string) => {
    // 길이 체크
    if (value.length < 2) {
      return '닉네임은 최소 2자 이상이어야 합니다.';
    }
    if (value.length > 16) {
      return '닉네임은 최대 16자까지 가능합니다.';
    }
    
    // 허용 문자 체크 (한글, 영문, 숫자, 일부 특수문자)
    if (!/^[가-힣a-zA-Z0-9_-]+$/.test(value)) {
      return '닉네임은 한글, 영문, 숫자, 밑줄(_), 하이픈(-)만 사용 가능합니다.';
    }
    
    // 연속된 동일 문자 체크 (4개 이상)
    if (/(.)\1{3,}/.test(value)) {
      return '동일한 문자를 4번 이상 연속 사용할 수 없습니다.';
    }
    
    // 의미 없는 문자 반복 체크 (ㅋㅋㅋㅋ 등)
    if (/[ㅋㅎㅠㅜㅡㅗㅁㄴㅇㄹㅇ]{4,}/.test(value)) {
      return '의미 없는 문자 반복은 사용할 수 없습니다.';
    }
    
    // 금지어 체크
    const forbiddenWords = ['admin', 'administrator', '관리자', '운영자', '매니저', 'manager', 'operator', 'support', '고객센터', 'service'];
    if (forbiddenWords.some(word => value.toLowerCase().includes(word.toLowerCase()))) {
      return '사용할 수 없는 닉네임입니다.';
    }
    
    // 아이디와 닉네임 동일 체크
    if (username && value === username) {
      return '닉네임과 아이디는 같을 수 없습니다.';
    }
    
    return '';
  };

  // 닉네임 중복 확인
  const checkNickname = async () => {
    if (!nickname) {
      setNicknameMessage('닉네임을 입력해주세요.');
      return;
    }

    // 유효성 검사 먼저 실행
    const validationError = validateNickname(nickname);
    if (validationError) {
      setNicknameMessage(validationError);
      setNicknameAvailable(false);
      return;
    }

    try {
      setIsCheckingNickname(true);

      // Supabase 클라이언트 생성
      const supabase = getSupabaseBrowser();

      // 프로필 테이블에서 해당 nickname으로 검색
      const { data, error } = await supabase
        .from('profiles')
        .select('id')
        .eq('nickname', nickname);

      if (error) {
        console.error('닉네임 조회 오류:', error);
        throw error;
      }

      // 결과 확인 및 상태 업데이트
      const isAvailable = !data || data.length === 0;

      setNicknameChecked(true);
      setNicknameAvailable(isAvailable);
      setNicknameMessage(isAvailable ? '사용 가능한 닉네임입니다.' : '이미 사용 중인 닉네임입니다.');

    } catch (error) {
      console.error('닉네임 중복 확인 오류:', error);
      setNicknameMessage('닉네임 확인 중 오류가 발생했습니다.');
      setNicknameAvailable(false);
    } finally {
      setIsCheckingNickname(false);
    }
  };

  // 추천 코드 확인
  const checkReferralCode = async () => {
    if (!referralCode.trim()) {
      // 추천 코드 미입력 시 건너뛰기 허용
      setReferralChecked(false);
      setReferralValid(false);
      setReferralMessage('');
      setReferrerNickname('');
      return;
    }

    try {
      setIsCheckingReferral(true);

      const result = await validateReferralCode(referralCode.trim());

      setReferralChecked(true);
      setReferralValid(result.valid);
      setReferrerNickname(result.referrerNickname || '');
      setReferralMessage(
        result.valid
          ? '올바른 추천코드입니다.'
          : result.error || '유효하지 않은 추천 코드입니다.'
      );

    } catch (error) {
      console.error('추천 코드 확인 오류:', error);
      setReferralMessage('추천 코드 확인 중 오류가 발생했습니다.');
      setReferralValid(false);
    } finally {
      setIsCheckingReferral(false);
    }
  };

  // 폼 제출 핸들러 (엔터 키 처리를 위해 현재 단계에 맞게 분기)
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    // 약관 동의 단계
    if (!showEmailStep) {
      handleAgreeSubmit();
      return;
    }

    // 이메일 단계
    if (showEmailStep && !showNameStep) {
      if (emailChecked && emailAvailable) {
        setShowNameStep(true);
      } else if (emailValid && !emailChecked) {
        // 이메일 유효하지만 중복확인 안됨 - 중복확인 실행
        checkEmail();
      }
      return;
    }

    // 이름 단계
    if (showNameStep && !showBirthStep) {
      if (validateFullName(fullName)) {
        setShowBirthStep(true);
      }
      return;
    }

    // 생년월일 단계
    if (showBirthStep && !showIdStep) {
      if (validateBirthDate(birthDate)) {
        setShowIdStep(true);
      }
      return;
    }

    // 아이디 단계
    if (showIdStep && !showNicknameStep) {
      if (usernameChecked && usernameAvailable) {
        setShowNicknameStep(true);
      } else if (username && validateUsername(username) === '' && !usernameChecked) {
        // 아이디 유효하지만 중복확인 안됨 - 중복확인 실행
        checkUsername();
      }
      return;
    }

    // 닉네임 단계
    if (showNicknameStep && !showPasswordStep) {
      if (nicknameChecked && nicknameAvailable) {
        setShowPasswordStep(true);
      } else if (nickname && validateNickname(nickname) === '' && !nicknameChecked) {
        // 닉네임 유효하지만 중복확인 안됨 - 중복확인 실행
        checkNickname();
      }
      return;
    }

    // 최종 회원가입 단계
    if (!usernameChecked || !usernameAvailable) {
      toast.error('아이디 중복 확인을 해주세요.');
      return;
    }

    if (!nicknameChecked || !nicknameAvailable) {
      toast.error('닉네임 중복 확인을 해주세요.');
      return;
    }
    if (!captchaToken) {
      toast.error('봇 검증을 완료해주세요.');
      return;
    }

    if (!passwordValid || !confirmPasswordValid) {
      return;
    }

    try {
      setIsLoading(true);

      const result = await signUp(email, password, {
        username,
        full_name: fullName,
        nickname,
        birth_date: birthDate.replace(/\./g, '-'), // YYYY.MM.DD -> YYYY-MM-DD
        ...(referralValid && referralCode.trim() ? { referral_code: referralCode.trim() } : {})
      }, captchaToken);

      if (result.success) {
        // 중복 토스트 제거 - signin 페이지의 message 파라미터만 사용
        router.push('/signin?message=회원가입이 완료되었습니다. 이메일을 확인하고 로그인해주세요.');
      } else {
        toast.error(result.error || '회원가입에 실패했습니다.');
      }
    } catch {
      toast.error('회원가입 중 오류가 발생했습니다.');
    } finally {
      setIsLoading(false);
    }
  };

  // 이미 로그인된 경우 폼 대신 메시지 표시
  if (user) {
    return (
      <div className="flex flex-col justify-center items-center min-h-[calc(100vh-120px)]">
        <div className="w-full max-w-md">
          <div className="text-center">
            <h2 className="text-2xl font-bold">이미 로그인되어 있습니다</h2>
            <p className="mt-2 text-gray-600">홈 화면으로 이동합니다...</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col justify-center items-center min-h-[calc(100vh-120px)]">
      <div className="max-w-md w-full md:bg-white md:dark:bg-[#2D2D2D] md:rounded-lg md:shadow-lg md:border md:border-black/10 md:dark:border-white/10 md:p-8">
        {/* 헤더 */}
        <div className="text-center mb-6">
          <h2 className="text-2xl font-bold text-gray-900 dark:text-[#F0F0F0] mb-2">4590 Football 회원가입</h2>
          <p className="text-gray-600 dark:text-gray-400 mb-8">
            모든 축구팬을 위한<br />
            4590 Football 커뮤니티에 오신 것을 환영합니다.
          </p>
        </div>

        {/* 콘텐츠 영역 - 최소 높이 설정 */}
        <div className="min-h-[400px]">
        
        <form onSubmit={handleSubmit} className="space-y-6">
          {/* 봇 검증 - 이메일 위 */}
          <div className="space-y-2">
            <label className="block text-gray-700 dark:text-gray-300 mb-1 text-sm font-medium">봇 검증</label>
            <TurnstileWidget
              siteKey={process.env.NEXT_PUBLIC_TURNSTILE_SITE_KEY as string}
              onToken={setCaptchaToken}
              className="w-full"
            />
          </div>

          {/* 약관 동의 */}
          {!showEmailStep && (
            <div className="space-y-4">
              {/* 전체 동의 */}
              <label className="flex items-center p-3 bg-[#F5F5F5] dark:bg-[#333333] rounded-lg cursor-pointer border border-black/7 dark:border-white/10">
                <input
                  type="checkbox"
                  checked={agreeTerms && agreePrivacy}
                  onChange={(e) => {
                    setAgreeTerms(e.target.checked);
                    setAgreePrivacy(e.target.checked);
                  }}
                  className="h-4 w-4 text-gray-600 border-black/7 dark:border-white/10 rounded focus:ring-gray-500"
                />
                <span className="ml-3 text-gray-900 dark:text-[#F0F0F0] font-semibold">
                  전체 동의
                </span>
              </label>

              {/* 이용약관 동의 */}
              <div className="border border-black/7 dark:border-white/10 rounded-lg overflow-hidden">
                <label className="flex items-center p-3 bg-[#F5F5F5] dark:bg-[#262626] cursor-pointer">
                  <input
                    type="checkbox"
                    checked={agreeTerms}
                    onChange={(e) => setAgreeTerms(e.target.checked)}
                    className="h-4 w-4 text-gray-600 border-black/7 dark:border-white/10 rounded focus:ring-gray-500"
                  />
                  <span className="ml-3 text-gray-900 dark:text-[#F0F0F0] font-medium">
                    이용약관에 동의합니다 <span className="text-red-500 text-sm">(필수)</span>
                  </span>
                </label>
                <div className="p-3 bg-white dark:bg-[#1D1D1D] text-xs text-gray-600 dark:text-gray-400 max-h-40 overflow-y-auto border-t border-black/7 dark:border-white/10">
                  <TermsContent />
                </div>
              </div>

              {/* 개인정보 수집 동의 */}
              <div className="border border-black/7 dark:border-white/10 rounded-lg overflow-hidden">
                <label className="flex items-center p-3 bg-[#F5F5F5] dark:bg-[#262626] cursor-pointer">
                  <input
                    type="checkbox"
                    checked={agreePrivacy}
                    onChange={(e) => setAgreePrivacy(e.target.checked)}
                    className="h-4 w-4 text-gray-600 border-black/7 dark:border-white/10 rounded focus:ring-gray-500"
                  />
                  <span className="ml-3 text-gray-900 dark:text-[#F0F0F0] font-medium">
                    개인정보 수집과 이용에 동의합니다 <span className="text-red-500 text-sm">(필수)</span>
                  </span>
                </label>
                <div className="p-3 bg-white dark:bg-[#1D1D1D] text-xs text-gray-600 dark:text-gray-400 max-h-40 overflow-y-auto border-t border-black/7 dark:border-white/10">
                  <PrivacyContent />
                </div>
              </div>

              {/* 다음 버튼 */}
              <Button
                type="button"
                variant="primary"
                onClick={handleAgreeSubmit}
                disabled={!agreeTerms || !agreePrivacy || !captchaToken}
                className="w-full py-3 h-auto"
              >
                다음
              </Button>
            </div>
          )}

          {/* 이메일 입력 단계 */}
          {showEmailStep && (
            <div className="space-y-4">
              <div>
                <label className="block text-gray-700 dark:text-gray-300 mb-1 text-sm font-medium">이메일 주소</label>
                <div className="flex space-x-2">
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => {
                      const value = e.target.value;
                      setEmail(value);
                      validateEmail(value);
                      setEmailChecked(false);
                      setEmailAvailable(false);
                      setEmailMessage('');
                    }}
                    onBlur={() => validateEmail(email)}
                    className={`flex-1 px-4 py-3 border rounded-md md:rounded-md max-md:rounded-lg focus:outline-none bg-white dark:bg-[#1D1D1D] text-gray-900 dark:text-[#F0F0F0] transition-colors ${
                      emailError ? 'border-red-500 dark:border-red-400' :
                      emailChecked && !emailAvailable ? 'border-red-500 dark:border-red-400' :
                      emailChecked && emailAvailable ? 'border-green-500 dark:border-green-400' :
                      'border-black/7 dark:border-white/10 focus:border-black/10 dark:focus:border-white/20 focus:bg-[#F5F5F5] dark:focus:bg-[#262626]'
                    }`}
                    placeholder="이메일 주소"
                    required
                    disabled={showNameStep}
                  />
                  <Button
                    type="button"
                    variant="primary"
                    onClick={checkEmail}
                    disabled={isCheckingEmail || !emailValid || showNameStep}
                  >
                    {isCheckingEmail ? '확인 중...' : '중복 확인'}
                  </Button>
                </div>
                {emailError && (
                  <p className="mt-1 text-sm text-red-600 flex items-center">
                    <AlertCircle className="h-4 w-4 mr-1" />
                    {emailError}
                  </p>
                )}
                {emailMessage && !emailError && (
                  <p className={`text-sm mt-1 flex items-center ${
                    emailAvailable ? 'text-green-600' : 'text-red-600'
                  }`}>
                    {emailAvailable ?
                      <Check className="h-4 w-4 mr-1" /> :
                      <AlertCircle className="h-4 w-4 mr-1" />
                    }
                    {emailMessage}
                  </p>
                )}
                {!showNameStep && (
                  <div className="mt-2">
                    <Button
                      type="button"
                      variant="primary"
                      onClick={handleEmailSubmit}
                      disabled={!emailChecked || !emailAvailable || isLoading}
                      className="w-full py-3 h-auto"
                    >
                      {isLoading ? '처리 중...' : '계속하기'}
                    </Button>
                  </div>
                )}
              </div>
            </div>
          )}
          
          {/* 이름 입력 단계 */}
          {showNameStep && (
            <div className="space-y-4">
              <div>
                <label className="block text-gray-700 dark:text-gray-300 mb-1 text-sm font-medium">이름</label>
                <p className="mb-2 text-xs text-gray-500 dark:text-gray-400">
                  *2-20자, 한글·영문만 사용 가능
                </p>
                <div className="relative">
                  <input
                    type="text"
                    value={fullName}
                    onChange={(e) => {
                      const value = e.target.value;
                      setFullName(value);
                      if (value) {
                        validateFullName(value);
                      } else {
                        setFullNameError('');
                        setFullNameValid(false);
                      }
                    }}
                    onBlur={() => {
                      if (fullName) validateFullName(fullName);
                    }}
                    className={`w-full p-3 border rounded-md md:rounded-md max-md:rounded-lg focus:outline-none bg-white dark:bg-[#1D1D1D] text-gray-900 dark:text-[#F0F0F0] transition-colors ${
                      fullNameError ? 'border-red-500 dark:border-red-400' :
                      fullNameValid ? 'border-green-500 dark:border-green-400' :
                      'border-black/7 dark:border-white/10 focus:border-black/10 dark:focus:border-white/20 focus:bg-[#F5F5F5] dark:focus:bg-[#262626]'
                    }`}
                    placeholder="이름"
                    required
                    disabled={showBirthStep}
                  />
                  {fullNameValid && !fullNameError && (
                    <div className="absolute right-3 top-1/2 transform -translate-y-1/2">
                      <Check className="h-5 w-5 text-green-500" />
                    </div>
                  )}
                </div>
                {fullNameError && (
                  <p className="mt-1 text-sm text-red-600 flex items-center">
                    <AlertCircle className="h-4 w-4 mr-1" />
                    {fullNameError}
                  </p>
                )}
                {!showBirthStep && (
                  <div className="mt-2">
                    <Button
                      type="button"
                      variant="primary"
                      onClick={handleNameSubmit}
                      disabled={!fullNameValid || isLoading}
                      className="w-full py-3 h-auto"
                    >
                      {isLoading ? '처리 중...' : '계속하기'}
                    </Button>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* 생년월일 입력 단계 */}
          {showBirthStep && (
            <div className="space-y-4">
              <div>
                <label className="block text-gray-700 dark:text-gray-300 mb-1 text-sm font-medium">생년월일</label>
                <p className="mb-2 text-xs text-gray-500 dark:text-gray-400">
                  *만 14세 이상만 가입 가능합니다
                </p>
                <div className="relative">
                  {/* 텍스트 입력 필드 */}
                  <input
                    type="text"
                    value={birthDate}
                    onChange={(e) => {
                      const formatted = formatBirthDate(e.target.value);
                      setBirthDate(formatted);
                      // 10자리 완성 시 자동 검증
                      if (formatted.length === 10) {
                        validateBirthDate(formatted);
                      } else {
                        setBirthError('');
                        setBirthValid(false);
                      }
                    }}
                    onBlur={() => {
                      if (birthDate) validateBirthDate(birthDate);
                    }}
                    className={`w-full p-3 pr-10 border rounded-md focus:outline-none bg-white dark:bg-[#1D1D1D] text-gray-900 dark:text-[#F0F0F0] transition-colors ${
                      birthError ? 'border-red-500 dark:border-red-400' :
                      birthValid ? 'border-green-500 dark:border-green-400' :
                      'border-black/7 dark:border-white/10 focus:border-black/10 dark:focus:border-white/20 focus:bg-[#F5F5F5] dark:focus:bg-[#262626]'
                    }`}
                    placeholder="YYYY.MM.DD"
                    maxLength={10}
                  />
                  {/* 캘린더 아이콘 버튼 */}
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    onClick={() => setShowCalendar(true)}
                    className="absolute right-1 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 h-8 w-8"
                  >
                    <CalendarIcon className="h-5 w-5" />
                  </Button>

                  {/* 캘린더 팝업 */}
                  {showCalendar && (
                    <div className="absolute top-full left-0 mt-2 z-50">
                      <Calendar
                        selectedDate={birthDate ? new Date(birthDate.replace(/\./g, '-')) : new Date()}
                        onDateSelect={(date) => {
                          const year = date.getFullYear();
                          const month = String(date.getMonth() + 1).padStart(2, '0');
                          const day = String(date.getDate()).padStart(2, '0');
                          const formatted = `${year}.${month}.${day}`;
                          setBirthDate(formatted);
                          validateBirthDate(formatted);
                          setShowCalendar(false);
                        }}
                        onClose={() => setShowCalendar(false)}
                        maxDate={new Date()}
                        minDate={new Date(1900, 0, 1)}
                      />
                    </div>
                  )}
                </div>
                {birthError && (
                  <p className="mt-1 text-sm text-red-600 flex items-center">
                    <AlertCircle className="h-4 w-4 mr-1" />
                    {birthError}
                  </p>
                )}
                {birthValid && !birthError && (
                  <p className="mt-1 text-sm text-green-600 flex items-center">
                    <Check className="h-4 w-4 mr-1" />
                    확인되었습니다.
                  </p>
                )}
                {!showIdStep && (
                  <div className="mt-2">
                    <Button
                      type="button"
                      variant="primary"
                      onClick={handleBirthSubmit}
                      disabled={!birthValid || isLoading}
                      className="w-full py-3 h-auto"
                    >
                      {isLoading ? '처리 중...' : '계속하기'}
                    </Button>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* 아이디 입력 단계 */}
          {showIdStep && (
            <div className="space-y-4">
              <div>
                <label className="block text-gray-700 dark:text-gray-300 mb-1 text-sm font-medium">아이디</label>
                <p className="mb-2 text-xs text-gray-500 dark:text-gray-400">
                  *4-20자, 영문 소문자·숫자·밑줄(_)·마침표(.) 사용 가능
                </p>
                <div className="flex space-x-2">
                  <input
                    type="text"
                    value={username}
                    onChange={(e) => {
                      const value = e.target.value;
                      setUsername(value);
                      setUsernameChecked(false);
                      setUsernameAvailable(false);
                      
                      // 실시간 유효성 검사
                      if (value) {
                        const validationError = validateUsername(value);
                        setUsernameMessage(validationError || '');
                      } else {
                        setUsernameMessage('');
                      }
                    }}
                    className={`flex-1 p-3 border rounded-md focus:outline-none bg-white dark:bg-[#1D1D1D] text-gray-900 dark:text-[#F0F0F0] transition-colors ${
                      usernameChecked && !usernameAvailable ? 'border-red-500 dark:border-red-400' :
                      usernameChecked && usernameAvailable ? 'border-green-500 dark:border-green-400' :
                      'border-black/7 dark:border-white/10 focus:border-black/10 dark:focus:border-white/20 focus:bg-[#F5F5F5] dark:focus:bg-[#262626]'
                    }`}
                    placeholder="아이디"
                    required
                    disabled={showNicknameStep}
                  />
                  <Button
                    type="button"
                    variant="primary"
                    onClick={checkUsername}
                    disabled={isCheckingUsername || !username || validateUsername(username) !== '' || showNicknameStep}
                  >
                    {isCheckingUsername ? '확인 중...' : '중복 확인'}
                  </Button>
                </div>
                {usernameMessage && (
                  <p className={`text-sm mt-1 flex items-center ${
                    usernameAvailable ? 'text-green-600' : 'text-red-600'
                  }`}>
                    {usernameAvailable ? 
                      <Check className="h-4 w-4 mr-1" /> : 
                      <AlertCircle className="h-4 w-4 mr-1" />
                    }
                    {usernameMessage}
                  </p>
                )}
                {!showNicknameStep && (
                  <div className="mt-2">
                    <Button
                      type="button"
                      variant="primary"
                      onClick={handleIdSubmit}
                      disabled={!usernameChecked || !usernameAvailable || isLoading}
                      className="w-full py-3 h-auto"
                    >
                      {isLoading ? '처리 중...' : '계속하기'}
                    </Button>
                  </div>
                )}
              </div>
            </div>
          )}
          
          {/* 닉네임 입력 단계 */}
          {showNicknameStep && (
            <div className="space-y-4">
              <div>
                <label className="block text-gray-700 dark:text-gray-300 mb-1 text-sm font-medium">닉네임</label>
                <p className="mb-2 text-xs text-gray-500 dark:text-gray-400">
                  *2-16자, 한글·영문·숫자·밑줄(_)·하이픈(-) 사용 가능
                </p>
                <div className="flex space-x-2">
                  <input
                    type="text"
                    value={nickname}
                    onChange={(e) => {
                      const value = e.target.value;
                      setNickname(value);
                      setNicknameChecked(false);
                      setNicknameAvailable(false);
                      
                      // 실시간 유효성 검사
                      if (value) {
                        const validationError = validateNickname(value);
                        setNicknameMessage(validationError || '');
                      } else {
                        setNicknameMessage('');
                      }
                    }}
                    className={`flex-1 p-3 border rounded-md focus:outline-none bg-white dark:bg-[#1D1D1D] text-gray-900 dark:text-[#F0F0F0] transition-colors ${
                      nicknameChecked && !nicknameAvailable ? 'border-red-500 dark:border-red-400' :
                      nicknameChecked && nicknameAvailable ? 'border-green-500 dark:border-green-400' :
                      'border-black/7 dark:border-white/10 focus:border-black/10 dark:focus:border-white/20 focus:bg-[#F5F5F5] dark:focus:bg-[#262626]'
                    }`}
                    placeholder="닉네임"
                    required
                    disabled={showPasswordStep}
                  />
                  <Button
                    type="button"
                    variant="primary"
                    onClick={checkNickname}
                    disabled={isCheckingNickname || !nickname || validateNickname(nickname) !== '' || showPasswordStep}
                  >
                    {isCheckingNickname ? '확인 중...' : '중복 확인'}
                  </Button>
                </div>
                {nicknameMessage && (
                  <p className={`text-sm mt-1 flex items-center ${
                    nicknameAvailable ? 'text-green-600' : 'text-red-600'
                  }`}>
                    {nicknameAvailable ?
                      <Check className="h-4 w-4 mr-1" /> :
                      <AlertCircle className="h-4 w-4 mr-1" />
                    }
                    {nicknameMessage}
                  </p>
                )}

                {!showPasswordStep && (
                  <div className="mt-4">
                    <Button
                      type="button"
                      variant="primary"
                      onClick={handleNicknameSubmit}
                      disabled={!nicknameChecked || !nicknameAvailable || isLoading}
                      className="w-full py-3 h-auto"
                    >
                      {isLoading ? '처리 중...' : '계속하기'}
                    </Button>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* 비밀번호 입력 단계 */}
          {showPasswordStep && (
            <div className="space-y-4">
              <div>
                <label className="block text-gray-700 dark:text-gray-300 mb-1 text-sm font-medium">비밀번호</label>
                <div className="relative">
                  <input
                    type={showPassword ? "text" : "password"}
                    value={password}
                    onChange={(e) => {
                      setPassword(e.target.value);
                      validatePassword(e.target.value);
                      if (confirmPassword) validateConfirmPassword(confirmPassword);
                    }}
                    onBlur={() => validatePassword(password)}
                    className={`w-full px-4 py-3 border rounded-md md:rounded-md max-md:rounded-lg focus:outline-none bg-white dark:bg-[#1D1D1D] text-gray-900 dark:text-[#F0F0F0] transition-colors ${
                      passwordError ? 'border-red-500 dark:border-red-400' :
                      passwordValid ? 'border-green-500 dark:border-green-400' :
                      'border-black/7 dark:border-white/10 focus:border-black/10 dark:focus:border-white/20 focus:bg-[#F5F5F5] dark:focus:bg-[#262626]'
                    }`}
                    placeholder="비밀번호"
                    required
                  />
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    className="absolute right-1 top-1/2 transform -translate-y-1/2 text-gray-500 dark:text-gray-400 h-8 w-8"
                    onClick={() => setShowPassword(!showPassword)}
                    tabIndex={-1}
                  >
                    {showPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
                  </Button>
                </div>
                
                {/* 비밀번호 안내 메시지 */}
                <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
                  *10자 이상, 특수문자 포함
                </p>
                
                {/* 비밀번호 강도 표시 */}
                {password && (
                  <div className="mt-2">
                    <div className="flex items-center space-x-2">
                      <span className="text-xs text-gray-600">강도:</span>
                      <span className={`text-xs font-medium ${
                        passwordStrength === '강함' ? 'text-green-600' :
                        passwordStrength === '보통' ? 'text-yellow-600' :
                        'text-red-600'
                      }`}>
                        {passwordStrength}
                      </span>
                    </div>
                    <div className="flex space-x-1 mt-1">
                      <div className={`h-1 w-1/3 rounded ${
                        passwordStrength === '약함' ? 'bg-red-400' :
                        passwordStrength === '보통' ? 'bg-yellow-400' :
                        passwordStrength === '강함' ? 'bg-green-400' : 'bg-gray-200'
                      }`}></div>
                      <div className={`h-1 w-1/3 rounded ${
                        passwordStrength === '보통' ? 'bg-yellow-400' :
                        passwordStrength === '강함' ? 'bg-green-400' : 'bg-gray-200'
                      }`}></div>
                      <div className={`h-1 w-1/3 rounded ${
                        passwordStrength === '강함' ? 'bg-green-400' : 'bg-gray-200'
                      }`}></div>
                    </div>
                  </div>
                )}
                
                {passwordError && (
                  <p className="mt-1 text-sm text-red-600 flex items-center">
                    <AlertCircle className="h-4 w-4 mr-1" />
                    {passwordError}
                  </p>
                )}
              </div>
              
              <div>
                <label className="block text-gray-700 dark:text-gray-300 mb-1 text-sm font-medium">비밀번호 확인</label>
                <div className="relative">
                  <input
                    type={showPassword ? "text" : "password"}
                    value={confirmPassword}
                    onChange={(e) => {
                      setConfirmPassword(e.target.value);
                      validateConfirmPassword(e.target.value);
                    }}
                    onBlur={() => validateConfirmPassword(confirmPassword)}
                    className={`w-full px-4 py-3 border rounded-md md:rounded-md max-md:rounded-lg focus:outline-none bg-white dark:bg-[#1D1D1D] text-gray-900 dark:text-[#F0F0F0] transition-colors ${
                      confirmPasswordError ? 'border-red-500 dark:border-red-400' :
                      confirmPasswordValid ? 'border-green-500 dark:border-green-400' :
                      'border-black/7 dark:border-white/10 focus:border-black/10 dark:focus:border-white/20 focus:bg-[#F5F5F5] dark:focus:bg-[#262626]'
                    }`}
                    placeholder="비밀번호 확인"
                    required
                  />
                </div>
                {confirmPasswordError && (
                  <p className="mt-1 text-sm text-red-600 flex items-center">
                    <AlertCircle className="h-4 w-4 mr-1" />
                    {confirmPasswordError}
                  </p>
                )}
              </div>

              {/* 추천 코드 입력 (선택) */}
              <div className="p-4 bg-[#F5F5F5] dark:bg-[#262626] rounded-lg border border-black/7 dark:border-white/10">
                <div className="flex items-center gap-2 mb-2">
                  <Gift className="h-4 w-4 text-green-600 dark:text-green-400" />
                  <label className="text-sm font-medium text-gray-700 dark:text-gray-300">
                    추천 코드 <span className="text-gray-500 dark:text-gray-400 font-normal">(선택)</span>
                  </label>
                </div>
                <p className="text-xs text-gray-500 dark:text-gray-400 mb-2">
                  친구의 추천 코드가 있다면 입력하세요. 가입 시 300P + 50XP를 받을 수 있습니다!
                </p>
                <div className="flex space-x-2">
                  <input
                    type="text"
                    value={referralCode}
                    onChange={(e) => {
                      setReferralCode(e.target.value.toLowerCase());
                      setReferralChecked(false);
                      setReferralValid(false);
                      setReferralMessage('');
                      setReferrerNickname('');
                    }}
                    className={`flex-1 p-3 border rounded-md focus:outline-none bg-white dark:bg-[#1D1D1D] text-gray-900 dark:text-[#F0F0F0] transition-colors ${
                      referralChecked && !referralValid && referralCode.trim() ? 'border-red-500 dark:border-red-400' :
                      referralChecked && referralValid ? 'border-green-500 dark:border-green-400' :
                      'border-black/7 dark:border-white/10 focus:border-black/10 dark:focus:border-white/20 focus:bg-[#F5F5F5] dark:focus:bg-[#262626]'
                    }`}
                    placeholder="예: a1b2c3d4"
                    maxLength={8}
                  />
                  <Button
                    type="button"
                    variant="primary"
                    onClick={checkReferralCode}
                    disabled={isCheckingReferral || !referralCode.trim()}
                  >
                    {isCheckingReferral ? '확인 중...' : '확인'}
                  </Button>
                </div>
                {referralMessage && (
                  <p className={`text-sm mt-2 flex items-center ${
                    referralValid ? 'text-green-600' : 'text-red-600'
                  }`}>
                    {referralValid ?
                      <Check className="h-4 w-4 mr-1" /> :
                      <AlertCircle className="h-4 w-4 mr-1" />
                    }
                    {referralMessage}
                  </p>
                )}
              </div>

              <div className="mt-2">
                <Button
                  type="submit"
                  variant="primary"
                  disabled={isLoading || !passwordValid || !confirmPasswordValid || !emailValid || !usernameChecked || !usernameAvailable || !nicknameChecked || !nicknameAvailable}
                  className="w-full py-3 h-auto mt-4"
                >
                  {isLoading ? '처리 중...' : '계정 생성하기'}
                </Button>
              </div>
            </div>
          )}

        </form>

        {/* 소셜 로그인 구분선 */}
        <div className="mt-6 mb-6">
          <div className="relative">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-black/7 dark:border-white/10" />
            </div>
            <div className="relative flex justify-center text-sm">
              <span className="px-2 bg-white dark:bg-[#1F1F1F] md:dark:bg-[#2D2D2D] text-gray-500 dark:text-gray-400">또는</span>
            </div>
          </div>
        </div>

        {/* 카카오 회원가입 */}
        <div className="mb-6">
          <KakaoLoginButton 
            disabled={isLoading}
            onLoading={setIsLoading}
          />
        </div>
        
          <div className="mt-8 text-center">
            <p className="text-gray-600 dark:text-gray-400">
              이미 계정이 있으신가요?{' '}
              <Link href="/signin" className="text-gray-700 dark:text-gray-300 hover:text-gray-900 dark:hover:text-[#F0F0F0] hover:underline transition-colors">
                로그인
              </Link>
            </p>
          </div>
        </div>
      </div>

      <div className="mt-8 flex space-x-4 text-sm text-gray-500 dark:text-gray-400">
        <Link href="/terms" className="hover:text-gray-900 dark:hover:text-[#F0F0F0] hover:underline transition-colors">이용약관</Link>
        <Link href="/privacy" className="hover:text-gray-900 dark:hover:text-[#F0F0F0] hover:underline transition-colors">개인정보처리방침</Link>
      </div>
    </div>
  );
} 