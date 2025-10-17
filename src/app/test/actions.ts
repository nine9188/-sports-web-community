'use server'

import { createAdminClient } from '@/shared/api/supabaseServer'
import { ALL_TEAMS } from '@/domains/livescore/constants/teams'
import { revalidatePath } from 'next/cache'

export async function updateTeamMappings() {
  const supabase = createAdminClient() // 관리자 권한으로 실행

  try {
    // 1. DB에서 모든 팀 조회
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { data: dbTeams, error: fetchError } = await (supabase as any)
      .from('football_teams')
      .select('id, team_id, name_ko, country_ko')

    if (fetchError) {
      return {
        success: false,
        message: `데이터 조회 실패: ${fetchError.message}`,
      }
    }

    // 2. 업데이트할 팀 목록 생성
    const updates: Array<{
      id: number
      name_ko: string
      country_ko: string | null
    }> = []

    for (const dbTeam of dbTeams || []) {
      const mapping = ALL_TEAMS.find(t => t.id === dbTeam.team_id)
      
      if (mapping) {
        // 매핑 데이터가 있고, 기존 값과 다른 경우만 업데이트
        if (
          dbTeam.name_ko !== mapping.name_ko ||
          dbTeam.country_ko !== mapping.country_ko
        ) {
          updates.push({
            id: dbTeam.id,
            name_ko: mapping.name_ko,
            country_ko: mapping.country_ko || null,
          })
        }
      }
    }

    if (updates.length === 0) {
      return {
        success: true,
        message: '업데이트할 팀이 없습니다.',
        updatedCount: 0,
      }
    }

    // 3. 일괄 업데이트 (개별 update 사용)
    let successCount = 0
    const updateErrors: string[] = []

    for (const update of updates) {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const { error: updateError } = await (supabase as any)
        .from('football_teams')
        .update({
          name_ko: update.name_ko,
          country_ko: update.country_ko,
          updated_at: new Date().toISOString(),
        })
        .eq('id', update.id)

      if (updateError) {
        updateErrors.push(`ID ${update.id}: ${updateError.message}`)
      } else {
        successCount++
      }
    }

    if (updateErrors.length > 0 && successCount === 0) {
      return {
        success: false,
        message: `모든 업데이트 실패: ${updateErrors[0]}`,
      }
    }

    // 4. 페이지 재검증
    revalidatePath('/test')

    const message = updateErrors.length > 0
      ? `${successCount}개 팀 업데이트 완료 (${updateErrors.length}개 실패)`
      : `${successCount}개 팀의 한글명이 업데이트되었습니다.`

    return {
      success: true,
      message,
      updatedCount: successCount,
    }
  } catch (error) {
    console.error('Team mapping update error:', error)
    return {
      success: false,
      message: `예상치 못한 오류 발생: ${error instanceof Error ? error.message : '알 수 없는 오류'}`,
    }
  }
}

