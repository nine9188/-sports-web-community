'use client';

import { useState } from 'react';
import { useAuth } from '@/app/context/AuthContext';
import { toast, ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import { createClient } from '@/app/lib/supabase-browser';
import { AlertTriangle } from 'lucide-react';

export default function DeleteAccountSettings() {
  const { user } = useAuth();
  const [password, setPassword] = useState('');
  const [confirmText, setConfirmText] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isDone, setIsDone] = useState(false);
  
  // 회원 탈퇴 처리
  const handleDeleteAccount = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    
    if (!user) return;
    
    // 확인 텍스트 검증
    if (confirmText !== '회원 탈퇴') {
      toast.error('확인 문구가 일치하지 않습니다.');
      return;
    }
    
    try {
      setIsLoading(true);
      const supabase = createClient();
      
      // 현재 비밀번호로 로그인 시도하여 검증
      const { error: signInError } = await supabase.auth.signInWithPassword({
        email: user.email!,
        password,
      });
      
      if (signInError) {
        toast.error('비밀번호가 올바르지 않습니다.');
        setIsLoading(false);
        return;
      }
      
      // 1. 게시글 삭제 전에 관련된 모든 데이터 삭제
      try {
        console.log('사용자 데이터 삭제 시작');
        
        // 1. 댓글 좋아요 삭제
        await supabase.from('comment_likes').delete().eq('user_id', user.id);
        console.log('댓글 좋아요 삭제 완료');
        
        // 2. 게시글 좋아요 삭제
        await supabase.from('post_likes').delete().eq('user_id', user.id);
        console.log('게시글 좋아요 삭제 완료');
        
        // 3. 대댓글 삭제
        const { data: userComments } = await supabase
          .from('comments')
          .select('id')
          .eq('user_id', user.id);
        
        if (userComments && userComments.length > 0) {
          for (const comment of userComments) {
            await supabase.from('comments').delete().eq('parent_id', comment.id);
          }
        }
        
        // 4. 모든 댓글 삭제
        await supabase.from('comments').delete().eq('user_id', user.id);
        console.log('댓글 삭제 완료');
        
        // 5. 게시글에 달린 모든 댓글 삭제
        const { data: userPosts } = await supabase
          .from('posts')
          .select('id')
          .eq('user_id', user.id);
        
        if (userPosts && userPosts.length > 0) {
          for (const post of userPosts) {
            // 각 게시글의 댓글 삭제
            await supabase.from('comments').delete().eq('post_id', post.id);
            // 게시글의 좋아요 삭제
            await supabase.from('post_likes').delete().eq('post_id', post.id);
          }
        }
        
        // 6. 이제 게시글 삭제
        await supabase.from('posts').delete().eq('user_id', user.id);
        console.log('게시글 삭제 완료');
        
        // 나머지 데이터 삭제
        await supabase.from('exp_history').delete().eq('user_id', user.id);
        await supabase.from('point_history').delete().eq('user_id', user.id);
        await supabase.from('icon_purchases').delete().eq('user_id', user.id);
        await supabase.from('user_icons').delete().eq('user_id', user.id);
        await supabase.from('user_items').delete().eq('user_id', user.id);
        await supabase.from('item_purchases').delete().eq('user_id', user.id);
        
        // 프로필 삭제 또는 익명화
        const { error: profileDeleteError } = await supabase
          .from('profiles')
          .delete()
          .eq('id', user.id);
        
        if (profileDeleteError) {
          // 삭제가 안되면 익명화
          const randomSuffix = Math.random().toString(36).substring(2);
          await supabase
            .from('profiles')
            .update({
              nickname: '탈퇴한 사용자',
              username: `deleted_${randomSuffix}`,
              email: `deleted_${randomSuffix}@deleted.com`,
              is_admin: false
            })
            .eq('id', user.id);
        }
        
        console.log('사용자 데이터 처리 완료');
      } catch (e) {
        console.error('사용자 데이터 삭제 중 오류:', e);
      }
      
      // 인증 정보 처리
      try {
        // 비밀번호 무작위화
        const randomPassword = Math.random().toString(36).substring(2) + 
                             Math.random().toString(36).substring(2);
        
        await supabase.auth.updateUser({ 
          password: randomPassword,
          data: { deleted: true }
        });
        
        // 로그아웃 처리
        await supabase.auth.signOut({ scope: 'global' });
      } catch (authError) {
        console.error('인증 정보 처리 오류:', authError);
        await supabase.auth.signOut();
      }
      
      // 탈퇴 완료
      setIsDone(true);
      setIsLoading(false);
      
    } catch (error: unknown) {
      console.error('회원 탈퇴 오류:', error);
      
      let errorMessage = '회원 탈퇴 처리 중 오류가 발생했습니다.';
      if (error instanceof Error) {
        errorMessage = error.message || errorMessage;
      }
      
      toast.error(errorMessage);
      setIsLoading(false);
    }
  };
  
  // 탈퇴 완료 후 확인 처리
  const handleConfirm = () => {
    // 로컬 스토리지 및 쿠키 정리
    localStorage.clear();
    sessionStorage.clear();
    document.cookie.split(";").forEach(function(c) {
      document.cookie = c.replace(/^ +/, "").replace(/=.*/, "=;expires=" + new Date().toUTCString() + ";path=/");
    });
    
    // 홈으로 이동 (새로고침 효과)
    window.location.href = '/';
  };

  // 탈퇴 완료 화면
  if (isDone) {
    return (
      <div className="text-center py-10">
        <h2 className="text-2xl font-bold mb-4">회원 탈퇴가 완료되었습니다</h2>
        <p className="text-gray-600 mb-6">
          그동안 서비스를 이용해 주셔서 감사합니다.<br />
          언제든지 다시 가입하여 서비스를 이용하실 수 있습니다.
        </p>
        <button
          onClick={handleConfirm}
          className="px-6 py-2 bg-slate-800 hover:bg-slate-700 text-white rounded-md"
        >
          확인
        </button>
      </div>
    );
  }

  if (!user) {
    return <div>로딩 중...</div>;
  }

  return (
    <div>
      <h2 className="text-xl font-semibold mb-4">회원 탈퇴</h2>
      
      <div className="bg-red-50 border-l-4 border-red-500 p-4 mb-6">
        <div className="flex items-start">
          <AlertTriangle className="h-5 w-5 text-red-500 mr-3 mt-0.5" />
          <div>
            <p className="text-red-700 font-semibold">주의: 회원 탈퇴 전 확인하세요</p>
            <ul className="mt-2 text-sm text-red-600 list-disc list-inside space-y-1">
              <li>탈퇴 시 계정과 관련된 모든 개인 정보와 작성한 게시글, 댓글이 삭제됩니다.</li>
              <li>보유하고 있던 포인트와 경험치는 모두 소멸됩니다.</li>
              <li>삭제된 데이터는 복구할 수 없습니다.</li>
              <li>탈퇴 후에는 동일한 이메일로 재가입이 가능합니다.</li>
              <li>탈퇴 처리는 즉시 완료되며, 취소할 수 없습니다.</li>
            </ul>
          </div>
        </div>
      </div>
      
      <form onSubmit={handleDeleteAccount} className="space-y-4">
        <div>
          <label className="block text-gray-700 mb-1">현재 비밀번호</label>
          <input
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="w-full p-2 border rounded bg-white"
            required
          />
        </div>
        
        <div>
          <label className="block text-gray-700 mb-1">확인을 위해 &apos;회원 탈퇴&apos;를 입력하세요</label>
          <input
            type="text"
            value={confirmText}
            onChange={(e) => setConfirmText(e.target.value)}
            className="w-full p-2 border rounded bg-white"
            placeholder="회원 탈퇴"
            required
          />
        </div>
        
        <button
          type="submit"
          disabled={isLoading || confirmText !== '회원 탈퇴'}
          className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded disabled:opacity-50"
        >
          {isLoading ? '처리 중...' : '회원 탈퇴하기'}
        </button>
      </form>
      <ToastContainer position="top-right" autoClose={2000} />
    </div>
  );
} 