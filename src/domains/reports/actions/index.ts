'use server';

import { createClient } from '@/shared/api/supabaseServer';
import { revalidatePath } from 'next/cache';
import { suspendUser } from '@/domains/admin/actions/suspension';
import { 
  CreateReportRequest, 
  ReportResponse, 
  GetReportsParams, 
  ReportWithReporter,
  ProcessReportRequest 
} from '../types';

/**
 * 신고 생성
 */
export async function createReport(request: CreateReportRequest): Promise<ReportResponse> {
  try {
    const supabase = await createClient();
    
    // 현재 사용자 확인
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      return { success: false, error: '로그인이 필요합니다.' };
    }

    // 중복 신고 확인
    const { data: existingReport } = await supabase
      .from('reports')
      .select('id')
      .eq('reporter_id', user.id)
      .eq('target_type', request.targetType)
      .eq('target_id', request.targetId)
      .single();

    if (existingReport) {
      return { success: false, error: '이미 신고한 내용입니다.' };
    }

    // 신고 생성
    const { data, error } = await supabase
      .from('reports')
      .insert({
        reporter_id: user.id,
        target_type: request.targetType,
        target_id: request.targetId,
        reason: request.reason,
        description: request.description || null,
      })
      .select()
      .single();

    if (error) {
      console.error('신고 생성 오류:', error);
      return { success: false, error: '신고 처리 중 오류가 발생했습니다.' };
    }

    // 관련 페이지 캐시 갱신
    revalidatePath('/admin/reports');
    
    return { success: true, data };
  } catch (error) {
    console.error('신고 생성 오류:', error);
    return { success: false, error: '신고 처리 중 오류가 발생했습니다.' };
  }
}

/**
 * 관리자용 신고 목록 조회
 */
export async function getReports(params: GetReportsParams = {}): Promise<ReportWithReporter[]> {
  try {
    const supabase = await createClient();
    
    // 관리자 권한 확인
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error('로그인이 필요합니다.');

    const { data: profile } = await supabase
      .from('profiles')
      .select('is_admin')
      .eq('id', user.id)
      .single();

    if (!profile?.is_admin) {
      throw new Error('관리자 권한이 필요합니다.');
    }

    // 신고 목록 조회
    let query = supabase
      .from('reports')
      .select(`
        *,
        reporter:profiles!reports_reporter_id_fkey(id, nickname, email),
        reviewer:profiles!reports_reviewed_by_fkey(id, nickname)
      `)
      .order('created_at', { ascending: false });

    // 필터 적용
    if (params.status) {
      query = query.eq('status', params.status);
    }
    if (params.targetType) {
      query = query.eq('target_type', params.targetType);
    }

    // 페이지네이션
    const limit = params.limit || 20;
    const offset = ((params.page || 1) - 1) * limit;
    query = query.range(offset, offset + limit - 1);

    const { data, error } = await query;

    if (error) {
      console.error('신고 목록 조회 오류:', error);
      throw error;
    }

    // 신고 대상 정보 추가
    const reportsWithTargetInfo = await Promise.all(
      (data || []).map(async (report) => {
        let target_info = {};

        try {
          if (report.target_type === 'post') {
            const { data: post } = await supabase
              .from('posts')
              .select('title, user_id, profiles(nickname)')
              .eq('id', report.target_id)
              .single();
            
            if (post) {
              target_info = {
                title: post.title,
                author: (post as { profiles?: { nickname?: string } }).profiles?.nickname || '알 수 없음'
              };
            }
          } else if (report.target_type === 'comment') {
            const { data: comment } = await supabase
              .from('comments')
              .select('content, user_id, profiles(nickname)')
              .eq('id', report.target_id)
              .single();
            
            if (comment) {
              target_info = {
                content: comment.content.substring(0, 100) + '...',
                author: (comment as { profiles?: { nickname?: string } }).profiles?.nickname || '알 수 없음'
              };
            }
          } else if (report.target_type === 'user') {
            const { data: targetUser } = await supabase
              .from('profiles')
              .select('nickname, email')
              .eq('id', report.target_id)
              .single();
            
            if (targetUser) {
              target_info = {
                title: targetUser.nickname || targetUser.email || '알 수 없음',
                author: '사용자'
              };
            }
          } else if (report.target_type === 'match_comment') {
            const { data: matchComment } = await supabase
              .from('match_support_comments')
              .select('content, user_id, profiles(nickname)')
              .eq('id', report.target_id)
              .single();
            
            if (matchComment) {
              target_info = {
                content: matchComment.content.substring(0, 100) + '...',
                author: (matchComment as { profiles?: { nickname?: string } }).profiles?.nickname || '알 수 없음'
              };
            }
          }
        } catch (error) {
          console.error('신고 대상 정보 조회 오류:', error);
        }

        return {
          ...report,
          target_info
        };
      })
    );

    return reportsWithTargetInfo;
  } catch (error) {
    console.error('신고 목록 조회 오류:', error);
    return [];
  }
}

/**
 * 신고 처리 (관리자용)
 */
export async function processReport(request: ProcessReportRequest): Promise<ReportResponse> {
  try {
    const supabase = await createClient();
    
    // 관리자 권한 확인
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      return { success: false, error: '로그인이 필요합니다.' };
    }

    const { data: profile } = await supabase
      .from('profiles')
      .select('is_admin')
      .eq('id', user.id)
      .single();

    if (!profile?.is_admin) {
      return { success: false, error: '관리자 권한이 필요합니다.' };
    }

    // 신고 상태 업데이트
    const { data, error } = await supabase
      .from('reports')
      .update({
        status: request.status,
        reviewed_by: user.id,
        reviewed_at: new Date().toISOString(),
      })
      .eq('id', request.reportId)
      .select()
      .single();

    if (error) {
      console.error('신고 처리 오류:', error);
      return { success: false, error: '신고 처리 중 오류가 발생했습니다.' };
    }

    // 캐시 갱신
    revalidatePath('/admin/reports');
    
    return { success: true, data };
  } catch (error) {
    console.error('신고 처리 오류:', error);
    return { success: false, error: '신고 처리 중 오류가 발생했습니다.' };
  }
}

/**
 * 신고 대상에 대한 조치 실행 (관리자용)
 */
export async function executeReportAction(
  reportId: string,
  action: 'delete' | 'hide' | 'suspend_user' | 'suspend_author',
  suspendDays?: number
): Promise<ReportResponse> {
  try {
    const supabase = await createClient();
    
    // 관리자 권한 확인
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      return { success: false, error: '로그인이 필요합니다.' };
    }

    const { data: profile } = await supabase
      .from('profiles')
      .select('is_admin')
      .eq('id', user.id)
      .single();

    if (!profile?.is_admin) {
      return { success: false, error: '관리자 권한이 필요합니다.' };
    }

    // 신고 정보 조회
    const { data: report, error: reportError } = await supabase
      .from('reports')
      .select('*')
      .eq('id', reportId)
      .single();

    if (reportError || !report) {
      return { success: false, error: '신고 정보를 찾을 수 없습니다.' };
    }

    let actionResult = { success: true, message: '' };

    // 작성자 정지 액션 처리
    if (action === 'suspend_author') {
      // 게시글/댓글의 작성자 ID 조회
      let authorId: string | null = null;
      
      if (report.target_type === 'post') {
        const { data: post } = await supabase
          .from('posts')
          .select('user_id')
          .eq('id', report.target_id)
          .single();
        authorId = post?.user_id || null;
      } else if (report.target_type === 'comment') {
        const { data: comment } = await supabase
          .from('comments')
          .select('user_id')
          .eq('id', report.target_id)
          .single();
        authorId = comment?.user_id || null;
      } else if (report.target_type === 'match_comment') {
        const { data: comment } = await supabase
          .from('match_support_comments')
          .select('user_id')
          .eq('id', report.target_id)
          .single();
        authorId = comment?.user_id || null;
      }
      
      if (!authorId) {
        return { success: false, error: '작성자 정보를 찾을 수 없습니다.' };
      }
      
      // 신고 사유를 포함한 정지 사유 생성
      const suspensionReason = `신고에 의한 정지 - ${report.reason}${report.description ? `: ${report.description}` : ''}`;
      
      actionResult = await handleUserSuspension(supabase, authorId, suspendDays || 7, suspensionReason);
    } else {
      // 기존 조치 실행
      switch (report.target_type) {
        case 'post':
          actionResult = await handlePostAction(supabase, report.target_id, action);
          break;
        case 'comment':
          actionResult = await handleCommentAction(supabase, report.target_id, action);
          break;
        case 'match_comment':
          actionResult = await handleMatchCommentAction(supabase, report.target_id, action);
          break;
        case 'user':
          if (action === 'suspend_user') {
            actionResult = await handleUserSuspension(supabase, report.target_id, suspendDays || 7);
          } else {
            return { success: false, error: '사용자에 대해서는 정지 조치만 가능합니다.' };
          }
          break;
        default:
          return { success: false, error: '지원하지 않는 대상 타입입니다.' };
      }
    }

    if (!actionResult.success) {
      return { success: false, error: actionResult.message };
    }

    // 신고 상태를 해결됨으로 업데이트
    await supabase
      .from('reports')
      .update({
        status: 'resolved',
        reviewed_by: user.id,
        reviewed_at: new Date().toISOString(),
      })
      .eq('id', reportId);

    // 캐시 갱신
    revalidatePath('/admin/reports');
    revalidatePath('/boards');
    revalidatePath('/livescore');
    
    return { success: true, data: { message: actionResult.message } };
  } catch (error) {
    console.error('신고 조치 실행 오류:', error);
    return { success: false, error: '조치 실행 중 오류가 발생했습니다.' };
  }
}

// 게시글 조치 처리
async function handlePostAction(supabase: Awaited<ReturnType<typeof createClient>>, postId: string, action: string) {
  try {
    if (action === 'delete') {
      // 게시글 삭제 처리 - 실제 삭제 대신 is_deleted 플래그 설정
      const { error } = await supabase
        .from('posts')
        .update({ 
          is_deleted: true,
          title: '[신고에 의해 삭제됨]',
          content: '신고에 의해 삭제되었습니다.'
        })
        .eq('id', postId);
      
      if (error) throw error;
      return { success: true, message: '게시글이 삭제되었습니다.' };
    } else if (action === 'hide') {
      // 게시글 숨김 처리 - 7일 후 자동 복구
      const hiddenUntil = new Date();
      hiddenUntil.setDate(hiddenUntil.getDate() + 7); // 7일 후
      
      const { error } = await supabase
        .from('posts')
        .update({ 
          is_hidden: true,
          hidden_until: hiddenUntil.toISOString(),
          hidden_reason: '신고에 의한 임시 숨김 처리',
          title: '[신고에 의해 숨김 처리됨]'
        })
        .eq('id', postId);
      
      if (error) throw error;
      return { success: true, message: `게시글이 7일간 숨김 처리되었습니다. (${hiddenUntil.toLocaleDateString()} 까지)` };
    }
    
    return { success: false, message: '알 수 없는 조치입니다.' };
  } catch (error) {
    console.error('게시글 조치 처리 오류:', error);
    return { success: false, message: '게시글 조치 처리 중 오류가 발생했습니다.' };
  }
}

// 댓글 조치 처리
async function handleCommentAction(supabase: Awaited<ReturnType<typeof createClient>>, commentId: string, action: string) {
  try {
    if (action === 'delete') {
      // 댓글 삭제 처리
      const { error } = await supabase
        .from('comments')
        .update({ 
          is_deleted: true,
          content: '신고에 의해 삭제되었습니다.'
        })
        .eq('id', commentId);
      
      if (error) throw error;
      return { success: true, message: '댓글이 삭제되었습니다.' };
    } else if (action === 'hide') {
      // 댓글 숨김 처리 - 7일 후 자동 복구
      const hiddenUntil = new Date();
      hiddenUntil.setDate(hiddenUntil.getDate() + 7); // 7일 후
      
      const { error } = await supabase
        .from('comments')
        .update({ 
          is_hidden: true,
          hidden_until: hiddenUntil.toISOString(),
          hidden_reason: '신고에 의한 임시 숨김 처리',
          content: '신고에 의해 일시 숨김처리 되었습니다. 7일 후 다시 확인됩니다.'
        })
        .eq('id', commentId);
      
      if (error) throw error;
      return { success: true, message: `댓글이 7일간 숨김 처리되었습니다. (${hiddenUntil.toLocaleDateString()} 까지)` };
    }
    
    return { success: false, message: '지원하지 않는 조치입니다.' };
  } catch (error) {
    console.error('댓글 조치 오류:', error);
    return { success: false, message: '댓글 조치 중 오류가 발생했습니다.' };
  }
}

// 응원 댓글 조치 처리
async function handleMatchCommentAction(supabase: Awaited<ReturnType<typeof createClient>>, commentId: string, action: string) {
  try {
    if (action === 'delete') {
      // 응원 댓글 삭제 처리
      const { error } = await supabase
        .from('match_support_comments')
        .update({ 
          is_deleted: true,
          content: '신고에 의해 삭제되었습니다.'
        })
        .eq('id', commentId);
      
      if (error) throw error;
      return { success: true, message: '응원 댓글이 삭제되었습니다.' };
    } else if (action === 'hide') {
      // 응원 댓글 숨김 처리 - 7일 후 자동 복구
      const hiddenUntil = new Date();
      hiddenUntil.setDate(hiddenUntil.getDate() + 7); // 7일 후
      
      const { error } = await supabase
        .from('match_support_comments')
        .update({ 
          is_hidden: true,
          hidden_until: hiddenUntil.toISOString(),
          hidden_reason: '신고에 의한 임시 숨김 처리',
          content: '신고에 의해 일시 숨김처리 되었습니다. 7일 후 다시 확인됩니다.'
        })
        .eq('id', commentId);
      
      if (error) throw error;
      return { success: true, message: `응원 댓글이 7일간 숨김 처리되었습니다. (${hiddenUntil.toLocaleDateString()} 까지)` };
    }
    
    return { success: false, message: '지원하지 않는 조치입니다.' };
  } catch (error) {
    console.error('응원 댓글 조치 오류:', error);
    return { success: false, message: '응원 댓글 조치 중 오류가 발생했습니다.' };
  }
}

// 사용자 정지 처리
async function handleUserSuspension(supabase: Awaited<ReturnType<typeof createClient>>, userId: string, days: number, reason?: string) {
  try {
    // 실제 정지 시스템 사용
    const result = await suspendUser({
      userId,
      reason: reason || '신고에 의한 정지',
      days
    });
    
    if (!result.success) {
      return { success: false, message: result.error || '사용자 정지 중 오류가 발생했습니다.' };
    }
    
    return { success: true, message: `사용자가 ${days}일간 정지되었습니다. (해제일: ${new Date(result.suspendedUntil!).toLocaleDateString('ko-KR', { timeZone: 'Asia/Seoul' })})` };
  } catch (error) {
    console.error('사용자 정지 오류:', error);
    return { success: false, message: '사용자 정지 중 오류가 발생했습니다.' };
  }
}

/**
 * 사용자의 신고 내역 조회
 */
export async function getUserReports(): Promise<ReportWithReporter[]> {
  try {
    const supabase = await createClient();
    
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return [];

    const { data, error } = await supabase
      .from('reports')
      .select('*')
      .eq('reporter_id', user.id)
      .order('created_at', { ascending: false });

    if (error) {
      console.error('사용자 신고 내역 조회 오류:', error);
      return [];
    }

    return data || [];
  } catch (error) {
    console.error('사용자 신고 내역 조회 오류:', error);
    return [];
  }
}

/**
 * 7일 기간이 지난 숨김 처리된 콘텐츠를 자동으로 복구
 */
export async function restoreExpiredHiddenContent(): Promise<{ success: boolean; message: string; restored: number }> {
  try {
    const supabase = await createClient();
    const now = new Date().toISOString();
    
    let totalRestored = 0;
    
    // 게시글 복구
    const { data: expiredPosts, error: postsError } = await supabase
      .from('posts')
      .select('id, title')
      .eq('is_hidden', true)
      .not('hidden_until', 'is', null)
      .lt('hidden_until', now);
    
    if (!postsError && expiredPosts && expiredPosts.length > 0) {
      // 각 게시글을 개별적으로 복구
      for (const post of expiredPosts) {
        const restoredTitle = post.title?.replace('[신고에 의해 숨김 처리됨]', '').trim() || '제목 없음';
        
        await supabase
          .from('posts')
          .update({
            is_hidden: false,
            hidden_until: null,
            hidden_reason: null,
            title: restoredTitle
          })
          .eq('id', post.id);
      }
      
      totalRestored += expiredPosts.length;
    }
    
    // 댓글 복구
    const { data: expiredComments, error: commentsError } = await supabase
      .from('comments')
      .select('id')
      .eq('is_hidden', true)
      .not('hidden_until', 'is', null)
      .lt('hidden_until', now);
    
    if (!commentsError && expiredComments && expiredComments.length > 0) {
      const { error: updateCommentsError } = await supabase
        .from('comments')
        .update({
          is_hidden: false,
          hidden_until: null,
          hidden_reason: null,
          content: '복구된 댓글입니다.' // 원본 내용 복구는 별도 로직 필요
        })
        .eq('is_hidden', true)
        .not('hidden_until', 'is', null)
        .lt('hidden_until', now);
      
      if (!updateCommentsError) {
        totalRestored += expiredComments.length;
      }
    }
    
    // 응원 댓글 복구
    const { data: expiredMatchComments, error: matchCommentsError } = await supabase
      .from('match_support_comments')
      .select('id')
      .eq('is_hidden', true)
      .not('hidden_until', 'is', null)
      .lt('hidden_until', now);
    
    if (!matchCommentsError && expiredMatchComments && expiredMatchComments.length > 0) {
      const { error: updateMatchCommentsError } = await supabase
        .from('match_support_comments')
        .update({
          is_hidden: false,
          hidden_until: null,
          hidden_reason: null,
          content: '복구된 응원 댓글입니다.' // 원본 내용 복구는 별도 로직 필요
        })
        .eq('is_hidden', true)
        .not('hidden_until', 'is', null)
        .lt('hidden_until', now);
      
      if (!updateMatchCommentsError) {
        totalRestored += expiredMatchComments.length;
      }
    }
    
    return {
      success: true,
      message: `${totalRestored}개의 콘텐츠가 자동 복구되었습니다.`,
      restored: totalRestored
    };
  } catch (error) {
    console.error('자동 복구 처리 오류:', error);
    return {
      success: false,
      message: '자동 복구 처리 중 오류가 발생했습니다.',
      restored: 0
    };
  }
}

/**
 * 신고 대상의 작성자 ID 조회
 */
export async function getReportTargetAuthorId(reportId: string): Promise<{ success: boolean; authorId?: string; error?: string }> {
  try {
    const supabase = await createClient();
    
    // 관리자 권한 확인
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      return { success: false, error: '로그인이 필요합니다.' };
    }

    const { data: profile } = await supabase
      .from('profiles')
      .select('is_admin')
      .eq('id', user.id)
      .single();

    if (!profile?.is_admin) {
      return { success: false, error: '관리자 권한이 필요합니다.' };
    }

    // 신고 정보 조회
    const { data: report, error: reportError } = await supabase
      .from('reports')
      .select('target_type, target_id')
      .eq('id', reportId)
      .single();

    if (reportError || !report) {
      return { success: false, error: '신고 정보를 찾을 수 없습니다.' };
    }

    let authorId: string | null = null;
    
    if (report.target_type === 'post') {
      const { data: post } = await supabase
        .from('posts')
        .select('user_id')
        .eq('id', report.target_id)
        .single();
      authorId = post?.user_id || null;
    } else if (report.target_type === 'comment') {
      const { data: comment } = await supabase
        .from('comments')
        .select('user_id')
        .eq('id', report.target_id)
        .single();
      authorId = comment?.user_id || null;
    } else if (report.target_type === 'match_comment') {
      const { data: comment } = await supabase
        .from('match_support_comments')
        .select('user_id')
        .eq('id', report.target_id)
        .single();
      authorId = comment?.user_id || null;
    }
    
    if (!authorId) {
      return { success: false, error: '작성자 정보를 찾을 수 없습니다.' };
    }
    
    return { success: true, authorId };
  } catch (error) {
    console.error('작성자 ID 조회 오류:', error);
    return { success: false, error: '작성자 정보 조회 중 오류가 발생했습니다.' };
  }
} 