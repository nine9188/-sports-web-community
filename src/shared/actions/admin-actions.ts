'use server'

import { getSupabaseAction } from '@/shared/lib/supabase/server'

// 관리자 권한 확인 함수
async function checkAdminPermission() {
  const supabase = await getSupabaseAction()
  
  const { data: { user }, error } = await supabase.auth.getUser()
  
  if (error || !user) {
    throw new Error('인증되지 않은 사용자입니다.')
  }
  
  const { data: profile } = await supabase
    .from('profiles')
    .select('is_admin')
    .eq('id', user.id)
    .single()
  
  if (!profile?.is_admin) {
    throw new Error('관리자 권한이 필요합니다.')
  }
  
  return { user, supabase }
}

// 포인트 관리용 사용자 목록 조회
export async function getPointsUsers() {
  try {
    const { supabase } = await checkAdminPermission()
    
    const { data, error } = await supabase
      .from('profiles')
      .select('id, nickname, points')
      .order('points', { ascending: false })
    
    if (error) {
      throw new Error(`사용자 목록 조회 실패: ${error.message}`)
    }
    
    return {
      success: true,
      users: (data || []).map(user => ({
        id: user.id,
        nickname: user.nickname || '이름 없음',
        points: user.points || 0
      }))
    }
  } catch (error) {
    console.error('포인트 사용자 목록 조회 오류:', error)
    return {
      success: false,
      error: error instanceof Error ? error.message : '사용자 목록 조회 중 오류가 발생했습니다.'
    }
  }
}

// 경험치 관리용 사용자 목록 조회
export async function getExpUsers() {
  try {
    const { supabase } = await checkAdminPermission()
    
    const { data, error } = await supabase
      .from('profiles')
      .select('id, nickname, exp, level')
      .order('exp', { ascending: false })
    
    if (error) {
      throw new Error(`사용자 목록 조회 실패: ${error.message}`)
    }
    
    return {
      success: true,
      users: (data || []).map(user => ({
        id: user.id,
        nickname: user.nickname || '이름 없음',
        exp: user.exp || 0,
        level: user.level || 1
      }))
    }
  } catch (error) {
    console.error('경험치 사용자 목록 조회 오류:', error)
    return {
      success: false,
      error: error instanceof Error ? error.message : '사용자 목록 조회 중 오류가 발생했습니다.'
    }
  }
}

// 포인트 업데이트
export async function updateUserPoints(userId: string, points: number, reason: string) {
  try {
    const { supabase, user: adminUser } = await checkAdminPermission()
    
    const { error } = await supabase
      .from('profiles')
      .update({ points })
      .eq('id', userId)
    
    if (error) {
      throw new Error(`포인트 업데이트 실패: ${error.message}`)
    }
    
    // 로그 기록 (선택사항)
    console.log(`관리자 ${adminUser.id}가 사용자 ${userId}의 포인트를 ${points}로 변경. 사유: ${reason}`)
    
    return {
      success: true,
      message: '포인트가 성공적으로 업데이트되었습니다.'
    }
  } catch (error) {
    console.error('포인트 업데이트 오류:', error)
    return {
      success: false,
      error: error instanceof Error ? error.message : '포인트 업데이트 중 오류가 발생했습니다.'
    }
  }
}

// 경험치 업데이트
export async function updateUserExp(userId: string, exp: number, reason: string) {
  try {
    const { supabase, user: adminUser } = await checkAdminPermission()
    
    // 경험치에 따른 레벨 계산 (간단한 공식: 레벨 = floor(exp / 100) + 1)
    const level = Math.floor(exp / 100) + 1
    
    const { error } = await supabase
      .from('profiles')
      .update({ exp, level })
      .eq('id', userId)
    
    if (error) {
      throw new Error(`경험치 업데이트 실패: ${error.message}`)
    }
    
    // 로그 기록 (선택사항)
    console.log(`관리자 ${adminUser.id}가 사용자 ${userId}의 경험치를 ${exp}로 변경. 사유: ${reason}`)
    
    return {
      success: true,
      message: '경험치가 성공적으로 업데이트되었습니다.'
    }
  } catch (error) {
    console.error('경험치 업데이트 오류:', error)
    return {
      success: false,
      error: error instanceof Error ? error.message : '경험치 업데이트 중 오류가 발생했습니다.'
    }
  }
}

// 포인트 내역 조회 (관리자 전용)
export async function getPointHistory(limit: number = 50) {
  try {
    const { supabase } = await checkAdminPermission()
    
    // 서버 측에서 직접 쿼리 실행 (RLS 우회)
    const { data, error } = await supabase
      .from('point_history')
      .select(`
        id,
        user_id,
        points,
        reason,
        created_at,
        admin_id
      `)
      .order('created_at', { ascending: false })
      .limit(limit)
    
    if (error) {
      console.error('포인트 내역 조회 실패:', error)
      throw new Error(`포인트 내역 조회 실패: ${error.message}`)
    }
    
    // 사용자 정보 별도 조회
    const userIds = [...new Set(data?.map(item => item.user_id).filter(Boolean) as string[])]
    const { data: users } = await supabase
      .from('profiles')
      .select('id, nickname')
      .in('id', userIds)
    
    const userMap = new Map(users?.map(user => [user.id, user.nickname]) || [])
    
    return {
      success: true,
      history: (data || []).map(item => ({
        id: item.id,
        userId: item.user_id,
        userNickname: userMap.get(item.user_id || '') || '알 수 없음',
        points: item.points,
        reason: item.reason,
        createdAt: item.created_at,
        adminId: item.admin_id
      }))
    }
  } catch (error) {
    console.error('포인트 내역 조회 오류:', error)
    return {
      success: false,
      error: error instanceof Error ? error.message : '포인트 내역 조회 중 오류가 발생했습니다.'
    }
  }
}

// 경험치 내역 조회 (관리자 전용)
export async function getExpHistory(limit: number = 50) {
  try {
    const { supabase } = await checkAdminPermission()
    
    // 서버 측에서 직접 쿼리 실행 (RLS 우회)
    const { data, error } = await supabase
      .from('exp_history')
      .select(`
        id,
        user_id,
        exp,
        reason,
        created_at,
        admin_id
      `)
      .order('created_at', { ascending: false })
      .limit(limit)
    
    if (error) {
      console.error('경험치 내역 조회 실패:', error)
      throw new Error(`경험치 내역 조회 실패: ${error.message}`)
    }
    
    // 사용자 정보 별도 조회
    const userIds = [...new Set(data?.map(item => item.user_id).filter(Boolean) as string[])]
    const { data: users } = await supabase
      .from('profiles')
      .select('id, nickname')
      .in('id', userIds)
    
    const userMap = new Map(users?.map(user => [user.id, user.nickname]) || [])
    
    return {
      success: true,
      history: (data || []).map(item => ({
        id: item.id,
        userId: item.user_id,
        userNickname: userMap.get(item.user_id || '') || '알 수 없음',
        exp: item.exp,
        reason: item.reason,
        createdAt: item.created_at,
        adminId: item.admin_id
      }))
    }
  } catch (error) {
    console.error('경험치 내역 조회 오류:', error)
    return {
      success: false,
      error: error instanceof Error ? error.message : '경험치 내역 조회 중 오류가 발생했습니다.'
    }
  }
} 