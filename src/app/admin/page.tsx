'use client';

import { useState, useEffect } from 'react';
import { getSupabaseBrowser } from '@/shared/lib/supabase';
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
  const supabase = getSupabaseBrowser();
  
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
    <>
      {isLoading ? (
        <div className="flex items-center justify-center h-64">
          <div className="inline-block animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-blue-500 mr-2"></div>
          <p>데이터 로딩 중...</p>
        </div>
      ) : (
        <>
          {/* 주요 통계 */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-6">
            <StatCard 
              title="전체 회원" 
              value={stats.totalUsers} 
              icon={<Users className="w-6 h-6 text-blue-500" />}
            />
            <StatCard 
              title="전체 게시글" 
              value={stats.totalPosts} 
              icon={<FileText className="w-6 h-6 text-green-500" />}
            />
            <StatCard 
              title="전체 댓글" 
              value={stats.totalComments} 
              icon={<MessageSquare className="w-6 h-6 text-indigo-500" />}
            />
            <StatCard 
              title="게시판 수" 
              value={stats.totalBoards} 
              icon={<FileText className="w-6 h-6 text-yellow-500" />}
            />
          </div>
          
          {/* 관리자 기능 안내 */}
          <div className="bg-gray-50 rounded-lg p-6">
            <h2 className="text-xl font-semibold text-gray-900 mb-6">관리자 기능 안내</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="flex items-start">
                <Users className="h-6 w-6 text-blue-500 mr-4 mt-1" />
                <div>
                  <p className="font-semibold text-gray-900">사용자 관리</p>
                  <p className="text-sm text-gray-600 mt-1">사용자 계정을 검색하고 관리할 수 있습니다.</p>
                </div>
              </div>
              
              <div className="flex items-start">
                <FileText className="h-6 w-6 text-green-500 mr-4 mt-1" />
                <div>
                  <p className="font-semibold text-gray-900">게시판 관리</p>
                  <p className="text-sm text-gray-600 mt-1">게시판을 생성, 수정하거나 권한을 설정할 수 있습니다.</p>
                </div>
              </div>
              
              <div className="flex items-start">
                <Coins className="h-6 w-6 text-yellow-500 mr-4 mt-1" />
                <div>
                  <p className="font-semibold text-gray-900">포인트 관리</p>
                  <p className="text-sm text-gray-600 mt-1">사용자 포인트를 조정하고 내역을 확인할 수 있습니다.</p>
                </div>
              </div>
              
              <div className="flex items-start">
                <TrendingUp className="h-6 w-6 text-purple-500 mr-4 mt-1" />
                <div>
                  <p className="font-semibold text-gray-900">경험치/레벨 관리</p>
                  <p className="text-sm text-gray-600 mt-1">사용자의 경험치와 레벨을 조정할 수 있습니다.</p>
                </div>
              </div>
            </div>
          </div>
        </>
      )}
    </>
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
    <div className="bg-white rounded-lg shadow-sm border p-6">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-sm font-medium text-gray-600">{title}</p>
          <p className="text-3xl font-bold text-gray-900 mt-2">{value}{suffix}</p>
        </div>
        <div className="p-3 rounded-full bg-gray-50">
          {icon}
        </div>
      </div>
    </div>
  );
} 