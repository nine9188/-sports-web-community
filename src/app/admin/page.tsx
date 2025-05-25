'use client';

import { useState, useEffect } from 'react';
import { createClient } from '@/shared/api/supabase';
import { Users, FileText, MessageSquare, Coins, TrendingUp } from 'lucide-react';

interface DashboardStats {
  totalUsers: number;
  totalPosts: number;
  totalComments: number;
  totalBoards: number;
}

export default function AdminDashboard() {
  const [stats, setStats] = useState<DashboardStats>({
    totalUsers: 0,
    totalPosts: 0,
    totalComments: 0,
    totalBoards: 0
  });
  
  const [isLoading, setIsLoading] = useState(true);
  const supabase = createClient();
  
  useEffect(() => {
    const fetchSimpleStats = async () => {
      try {
        setIsLoading(true);
        
        // 각 테이블 별로 개별적으로 통계 조회 (타입 안전성 확보)
        const fetchUsersCount = async () => {
          try {
            const { count, error } = await supabase
              .from('profiles')
              .select('*', { count: 'exact', head: true });
              
            if (error) {
              console.warn('프로필 카운트 오류:', error);
              return 0;
            }
            
            return count || 0;
          } catch (e) {
            console.warn('프로필 카운트 오류:', e);
            return 0;
          }
        };
        
        const fetchPostsCount = async () => {
          try {
            const { count, error } = await supabase
              .from('posts')
              .select('*', { count: 'exact', head: true });
              
            if (error) {
              console.warn('게시글 카운트 오류:', error);
              return 0;
            }
            
            return count || 0;
          } catch (e) {
            console.warn('게시글 카운트 오류:', e);
            return 0;
          }
        };
        
        const fetchCommentsCount = async () => {
          try {
            const { count, error } = await supabase
              .from('comments')
              .select('*', { count: 'exact', head: true });
              
            if (error) {
              console.warn('댓글 카운트 오류:', error);
              return 0;
            }
            
            return count || 0;
          } catch (e) {
            console.warn('댓글 카운트 오류:', e);
            return 0;
          }
        };
        
        const fetchBoardsCount = async () => {
          try {
            const { count, error } = await supabase
              .from('boards')
              .select('*', { count: 'exact', head: true });
              
            if (error) {
              console.warn('게시판 카운트 오류:', error);
              return 0;
            }
            
            return count || 0;
          } catch (e) {
            console.warn('게시판 카운트 오류:', e);
            return 0;
          }
        };
        
        // 각 테이블 별 통계 조회 (오류가 나도 중단되지 않게)
        const usersCount = await fetchUsersCount();
        const postsCount = await fetchPostsCount();
        const commentsCount = await fetchCommentsCount();
        const boardsCount = await fetchBoardsCount();
        
        setStats({
          totalUsers: usersCount,
          totalPosts: postsCount,
          totalComments: commentsCount,
          totalBoards: boardsCount
        });
        
      } catch (error) {
        console.warn('기본 통계 로딩 중 오류:', error);
      } finally {
        setIsLoading(false);
      }
    };
    
    fetchSimpleStats();
  }, [supabase]);
  
  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold mb-6">관리자 대시보드</h1>
      
      {isLoading ? (
        <div className="flex items-center justify-center h-64">
          <div className="inline-block animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-blue-500 mr-2"></div>
          <p>데이터 로딩 중...</p>
        </div>
      ) : (
        <>
          {/* 주요 통계 */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <StatCard 
              title="전체 회원" 
              value={stats.totalUsers} 
              icon={<Users className="w-5 h-5 text-blue-500" />}
            />
            <StatCard 
              title="전체 게시글" 
              value={stats.totalPosts} 
              icon={<FileText className="w-5 h-5 text-green-500" />}
            />
            <StatCard 
              title="전체 댓글" 
              value={stats.totalComments} 
              icon={<MessageSquare className="w-5 h-5 text-indigo-500" />}
            />
            <StatCard 
              title="게시판 수" 
              value={stats.totalBoards} 
              icon={<FileText className="w-5 h-5 text-yellow-500" />}
            />
          </div>
          
          {/* 추가 정보 섹션 */}
          <div className="grid grid-cols-1 gap-4">
            <div className="bg-white shadow rounded-lg p-6 border border-gray-200">
              <h2 className="text-lg font-medium mb-4">관리자 기능 안내</h2>
              <div className="space-y-4">
                <div className="flex items-start">
                  <Users className="h-5 w-5 text-blue-500 mr-3 mt-0.5" />
                  <div>
                    <p className="font-medium">사용자 관리</p>
                    <p className="text-sm text-gray-600 mt-1">사용자 계정을 검색하고 관리할 수 있습니다.</p>
                  </div>
                </div>
                
                <div className="flex items-start">
                  <FileText className="h-5 w-5 text-green-500 mr-3 mt-0.5" />
                  <div>
                    <p className="font-medium">게시판 관리</p>
                    <p className="text-sm text-gray-600 mt-1">게시판을 생성, 수정하거나 권한을 설정할 수 있습니다.</p>
                  </div>
                </div>
                
                <div className="flex items-start">
                  <Coins className="h-5 w-5 text-yellow-500 mr-3 mt-0.5" />
                  <div>
                    <p className="font-medium">포인트 관리</p>
                    <p className="text-sm text-gray-600 mt-1">사용자 포인트를 조정하고 내역을 확인할 수 있습니다.</p>
                  </div>
                </div>
                
                <div className="flex items-start">
                  <TrendingUp className="h-5 w-5 text-purple-500 mr-3 mt-0.5" />
                  <div>
                    <p className="font-medium">경험치/레벨 관리</p>
                    <p className="text-sm text-gray-600 mt-1">사용자의 경험치와 레벨을 조정할 수 있습니다.</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </>
      )}
    </div>
  );
}

// 통계 카드 컴포넌트
function StatCard({ 
  title, 
  value, 
  icon,
  suffix = "" 
}: { 
  title: string; 
  value: number | string; 
  icon: React.ReactNode;
  suffix?: string;
}) {
  return (
    <div className="bg-white rounded-lg shadow p-4 border border-gray-200">
      <div className="flex justify-between items-start">
        <h3 className="text-sm font-medium text-gray-500">{title}</h3>
        <div className="p-2 rounded-full bg-gray-100">{icon}</div>
      </div>
      <div className="mt-2">
        <p className="text-2xl font-bold">{value}{suffix}</p>
      </div>
    </div>
  );
} 