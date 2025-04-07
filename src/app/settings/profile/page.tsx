'use client';

import { useState, useEffect, useRef } from 'react';
import { useAuth } from '@/app/context/AuthContext';
import { toast, ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import { createClient } from '@/app/lib/supabase-browser';

export default function ProfileSettings() {
  const { user, refreshUserData } = useAuth();
  const [nickname, setNickname] = useState('');
  const [originalNickname, setOriginalNickname] = useState('');
  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [birthdate, setBirthdate] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isCheckingNickname, setIsCheckingNickname] = useState(false);
  const [nicknameChecked, setNicknameChecked] = useState(false);
  const [nicknameMessage, setNicknameMessage] = useState('');
  const [nicknameAvailable, setNicknameAvailable] = useState(false);
  const [profileExists, setProfileExists] = useState(false);
  const hasLoadedUserData = useRef(false);
  const isSubmittingRef = useRef(false);
  
  // 사용자 정보 및 프로필 로드 - 수정
  useEffect(() => {
    if (hasLoadedUserData.current && user) {
      return;
    }
    
    if (user) {
      setEmail(user.email || '');
      
      // 프로필 정보 로드
      const loadProfile = async () => {
        try {
          const supabase = createClient();
          
          // profiles 테이블에서 데이터 가져오기
          const { data: profileData, error: profileError } = await supabase
            .from('profiles')
            .select('*')
            .eq('id', user.id)
            .single();
          
          // 메타데이터의 기본값 설정
          const metaNickname = user.user_metadata?.nickname || '';
          const metaFullName = user.user_metadata?.full_name || '';
          const metaBirthdate = user.user_metadata?.birthdate || '';
          
          if (profileError && profileError.code !== 'PGRST116') {
            console.error('프로필 조회 오류:', profileError);
          }
          
          // 프로필 데이터가 있으면 우선 사용
          if (profileData) {
            // 프로필에서 닉네임 가져오기 (중요!)
            const profileNickname = profileData.nickname || metaNickname;
            
            setNickname(profileNickname);
            setOriginalNickname(profileNickname);
            setFullName(profileData.full_name || metaFullName);
            setBirthdate(profileData.birthdate || metaBirthdate);
            setProfileExists(true);
          } else {
            // 프로필 데이터가 없으면 메타데이터 사용
            setNickname(metaNickname);
            setOriginalNickname(metaNickname);
            setFullName(metaFullName);
            setBirthdate(metaBirthdate);
          }
          
          // 로드 완료 표시
          hasLoadedUserData.current = true;
        } catch (error) {
          console.error('사용자 데이터 로딩 오류:', error);
        }
      };
      
      loadProfile();
    }
  }, [user]);
  
  // 닉네임이 변경되었을 때 확인 상태 초기화
  useEffect(() => {
    if (nickname !== originalNickname) {
      setNicknameChecked(false);
      setNicknameAvailable(false);
      setNicknameMessage('');
    } else if (originalNickname) {
      // 원래 닉네임으로 되돌아온 경우 확인 상태 복원
      setNicknameChecked(true);
      setNicknameAvailable(true);
      setNicknameMessage('');
    }
  }, [nickname, originalNickname]);
  
  // 닉네임 중복 확인 함수 - 재정의
  const checkNickname = async () => {
    if (!nickname) {
      setNicknameMessage('닉네임을 입력해주세요.');
      return;
    }
    
    if (nickname.length < 2) {
      setNicknameMessage('닉네임은 최소 2자 이상이어야 합니다.');
      return;
    }
    
    const MAX_NICKNAME_LENGTH = 12; // maxLength와 동일하게 설정
    
    if (nickname.length > MAX_NICKNAME_LENGTH) {
      setNicknameMessage(`닉네임은 최대 ${MAX_NICKNAME_LENGTH}자까지 입력 가능합니다.`);
      return;
    }
    
    if (!/^[a-zA-Z0-9가-힣_]+$/.test(nickname)) {
      setNicknameMessage('닉네임은 영문, 숫자, 한글, 언더스코어(_)만 사용 가능합니다.');
      return;
    }
    
    // 닉네임이 변경되지 않았다면 확인하지 않음
    if (nickname === originalNickname) {
      setNicknameChecked(true);
      setNicknameAvailable(true);
      setNicknameMessage('');
      return;
    }
    
    try {
      setIsCheckingNickname(true);
      
      // API 대신 직접 Supabase에 쿼리
      const supabaseClient = createClient();
      
      // 닉네임으로 중복 검사
      const { data, error } = await supabaseClient
        .from('profiles')
        .select('id, nickname')
        .eq('nickname', nickname);
        
      if (error) {
        console.error('닉네임 중복 확인 쿼리 오류:', error);
        throw error;
      }
      
      // 중복된 닉네임이 있는지 확인
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

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    
    if (!user) return;
    
    // 이미 제출 중이면 중복 제출 방지
    if (isSubmittingRef.current) {
      return;
    }
    
    // 닉네임이 변경되었지만 중복 확인을 하지 않은 경우
    if (nickname !== originalNickname && !nicknameChecked) {
      toast.error('닉네임 중복 확인을 해주세요.');
      return;
    }
    
    // 닉네임이 사용 불가능한 경우
    if (nickname !== originalNickname && !nicknameAvailable) {
      toast.error('사용할 수 없는 닉네임입니다. 다른 닉네임을 입력해주세요.');
      return;
    }
    
    try {
      setIsLoading(true);
      isSubmittingRef.current = true;
      
      const supabaseClient = createClient();
      
      // 1. profiles 테이블에 필요한 필드만 포함
      const profileData = {
        nickname,
        updated_at: new Date().toISOString()
      };
      
      if (profileExists) {
        // 프로필이 존재하면 업데이트
        const { error: profileError } = await supabaseClient
          .from('profiles')
          .update(profileData)
          .eq('id', user.id);
          
        if (profileError) {
          console.error('프로필 업데이트 오류:', profileError);
          throw profileError;
        }
      } else {
        // 프로필이 존재하지 않으면 삽입
        const { error: profileError } = await supabaseClient
          .from('profiles')
          .insert([{
            id: user.id,
            ...profileData
          }]);
          
        if (profileError) {
          console.error('프로필 생성 오류:', profileError);
          throw profileError;
        }
        
        // 프로필 생성 플래그 업데이트
        setProfileExists(true);
      }
      
      // 2. 메타데이터 업데이트
      const { data: userData } = await supabaseClient.auth.getUser();
      const currentMetadata = userData.user?.user_metadata || {};
      
      const { error: authError } = await supabaseClient.auth.updateUser({
        data: { 
          ...currentMetadata,
          nickname,
          full_name: fullName,
          birthdate: birthdate
        }
      });
      
      if (authError) {
        console.error('메타데이터 업데이트 오류:', authError);
        throw authError;
      }
      
      toast.success('프로필 정보가 성공적으로 업데이트되었습니다.');
      
      // 3. 상태 업데이트
      setOriginalNickname(nickname);
      setNicknameChecked(true);
      setNicknameAvailable(true);
      
      // 4. 전역 사용자 정보 새로고침
      await refreshUserData();
      
    } catch (error: unknown) {
      console.error('프로필 업데이트 오류:', error);
      
      let errorMessage = '프로필 업데이트 중 오류가 발생했습니다.';
      if (error instanceof Error) {
        errorMessage = error.message || errorMessage;
      }
      
      toast.error(errorMessage);
    } finally {
      setIsLoading(false);
      isSubmittingRef.current = false;
    }
  };

  if (!user) {
    return <div>로딩 중...</div>;
  }

  return (
    <div>
      <h2 className="text-xl font-semibold mb-4">기본 정보</h2>
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="block text-gray-700 mb-1">이메일</label>
          <input
            type="email"
            value={email}
            disabled
            className="w-full p-2 border rounded bg-gray-50 text-gray-500"
          />
          <p className="text-xs text-gray-500 mt-1">이메일은 변경할 수 없습니다.</p>
        </div>
        
        <div>
          <label className="block text-gray-700 mb-1">이름</label>
          <input
            type="text"
            value={fullName}
            disabled
            className="w-full p-2 border rounded bg-gray-50 text-gray-500"
          />
          <p className="text-xs text-gray-500 mt-1">이름은 변경할 수 없습니다.</p>
        </div>
        
        <div>
          <label className="block text-gray-700 mb-1">생년월일</label>
          <input
            type="date"
            value={birthdate}
            disabled
            className="w-full p-2 border rounded bg-gray-50 text-gray-500"
          />
          <p className="text-xs text-gray-500 mt-1">생년월일은 변경할 수 없습니다.</p>
        </div>
        
        <div>
          <label className="block text-gray-700 mb-1">닉네임</label>
          <div className="flex space-x-2">
            <input
              type="text"
              value={nickname}
              onChange={(e) => setNickname(e.target.value)}
              maxLength={12}
              className={`flex-1 p-2 border rounded bg-white ${
                nicknameChecked && !nicknameAvailable ? 'border-red-500' : 
                nicknameChecked && nicknameAvailable ? 'border-green-500' : ''
              }`}
              placeholder="닉네임을 입력하세요"
              required
            />
            <button
              type="button"
              onClick={checkNickname}
              disabled={isCheckingNickname || !nickname}
              className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-white rounded disabled:opacity-50"
            >
              {isCheckingNickname ? '확인 중...' : '중복 확인'}
            </button>
          </div>
          {nicknameMessage && (
            <p className={`text-sm mt-1 ${
              nicknameAvailable ? 'text-green-600' : 'text-red-600'
            }`}>
              {nicknameMessage}
            </p>
          )}
          <p className="text-xs text-gray-500 mt-1">영문, 숫자, 한글, 언더스코어(_)만 사용 가능합니다. (2~12자)</p>
        </div>
        
        <button
          type="submit"
          disabled={isLoading || (nickname !== originalNickname && (!nicknameChecked || !nicknameAvailable))}
          className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-white rounded disabled:opacity-50"
        >
          {isLoading ? '저장 중...' : '저장'}
        </button>
      </form>
      <ToastContainer position="top-right" autoClose={2000} />
    </div>
  );
} 