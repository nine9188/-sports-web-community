// 레벨 아이콘 경로 (Supabase 스토리지 URL)
export const LEVEL_ICON_BASE_URL = 'https://vnjjfhsuzoxcljqqwwvx.supabase.co/storage/v1/object/public/profile-icons/level-icons/';

import { createClient } from '@/app/lib/supabase-browser';

// 레벨별 필요 경험치 테이블
export const LEVEL_EXP_REQUIREMENTS = [
  0,     // 레벨 1
  50,    // 레벨 2
  500,   // 레벨 3
  1000,  // 레벨 4
  1500,  // 레벨 5
  2000,  // 레벨 6
  2500,  // 레벨 7
  3000,  // 레벨 8
  6000,  // 레벨 9
  9000,  // 레벨 10
  12000, // 레벨 11
  15000, // 레벨 12
  21000, // 레벨 13
  27000, // 레벨 14
  33000, // 레벨 15
  39000, // 레벨 16
  51000, // 레벨 17
  63000, // 레벨 18
  75000, // 레벨 19
  87000, // 레벨 20
  111000, // 레벨 21
  135000, // 레벨 22
  159000, // 레벨 23
  183000, // 레벨 24
  231000, // 레벨 25
  279000, // 레벨 26
  327000, // 레벨 27
  375000, // 레벨 28
  471000, // 레벨 29
  567000, // 레벨 30
  663000, // 레벨 31
  759000, // 레벨 32
  855000, // 레벨 33
  951000, // 레벨 34
  1047000, // 레벨 35
  1143000, // 레벨 36
  1239000, // 레벨 37
  1335000, // 레벨 38
  1431000, // 레벨 39
  1527000, // 레벨 40
  1623000, // 레벨 41
  1719000, // 레벨 42
  1815000, // 레벨 43
  1911000, // 레벨 44
  2007000, // 레벨 45
  2103000, // 레벨 46
  2199000, // 레벨 47
  2295000, // 레벨 48
  2391000, // 레벨 49
];

// 레벨에 따른 아이콘 파일명 생성 함수
export const getLevelIconUrl = (level: number): string => {
  let iconIndex;
  
  if (level <= 40) {
    // 1~40레벨: 4레벨당 하나의 아이콘
    iconIndex = Math.ceil(level / 4);
  } else {
    // 41레벨 이상: 레벨당 하나의 아이콘
    // 41레벨은 11번째 아이콘(인덱스 11)부터 시작
    iconIndex = 10 + (level - 40);
  }
  
  // 최대 19개의 아이콘으로 제한
  iconIndex = Math.min(iconIndex, 19);
  
  return `${LEVEL_ICON_BASE_URL}level-${iconIndex}.png`;
};

// 레벨 아이콘 인덱스 계산 함수
export const getLevelIconIndex = (level: number): number => {
  if (level <= 0) return 0;
  
  if (level <= 40) {
    // 1~40까지는 4레벨당 하나의 아이콘 (1~4, 5~8, 9~12, ...)
    return Math.ceil(level / 4) - 1;
  } else {
    // 41부터는 레벨당 하나의 아이콘
    // 40까지 10개의 아이콘(0~9)이 사용되었으므로, 41은 인덱스 10부터 시작
    return 10 + (level - 41);
  }
};

// 경험치를 바탕으로 레벨 계산 함수
export const calculateLevelFromExp = (exp: number): number => {
  if (exp < 0) return 1;
  
  for (let level = LEVEL_EXP_REQUIREMENTS.length; level > 0; level--) {
    if (exp >= LEVEL_EXP_REQUIREMENTS[level - 1]) {
      return level;
    }
  }
  
  return 1;
};

// 다음 레벨까지 필요한 경험치 계산 함수
export const getExpForNextLevel = (currentLevel: number): number => {
  if (currentLevel < 1) return 0;
  if (currentLevel >= LEVEL_EXP_REQUIREMENTS.length) return Infinity;
  
  return LEVEL_EXP_REQUIREMENTS[currentLevel];
};

// 레벨 진행률 계산 함수
export const calculateLevelProgress = (level: number, exp: number): number => {
  if (level < 1 || exp < 0) return 0;
  
  // 현재 레벨의 최소 경험치
  const currentLevelMinExp = LEVEL_EXP_REQUIREMENTS[level - 1] || 0;
  
  // 다음 레벨에 도달하기 위한 경험치
  const nextLevelExp = (level < LEVEL_EXP_REQUIREMENTS.length) 
    ? LEVEL_EXP_REQUIREMENTS[level] 
    : Infinity;
  
  // 현재 레벨 내에서의 경험치
  const expInLevel = exp - currentLevelMinExp;
  
  // 현재 레벨에서 다음 레벨까지 필요한 경험치
  const expNeededForNextLevel = nextLevelExp - currentLevelMinExp;
  
  // 진행률 계산
  return Math.min(Math.round((expInLevel / expNeededForNextLevel) * 100), 100);
};

// 다음 레벨까지 필요한 경험치 계산
export const getExpToNextLevel = (level: number, exp: number): number => {
  if (level < 1 || exp < 0) return 0;
  
  // 다음 레벨에 도달하기 위한 총 경험치
  const nextLevelTotalExp = (level < LEVEL_EXP_REQUIREMENTS.length) 
    ? LEVEL_EXP_REQUIREMENTS[level] 
    : Infinity;
  
  // 다음 레벨까지 남은 경험치
  return Math.max(0, nextLevelTotalExp - exp);
};

// 사용자별 아이콘 관련 유틸리티 함수들

// 구매한 아이콘 URL 가져오기
export async function getPurchasedIconUrl(iconId: number): Promise<string | null> {
  if (!iconId) return null;
  
  try {
    const supabase = createClient();
    const { data, error } = await supabase
      .from('shop_items')
      .select('image_url')
      .eq('id', iconId)
      .single();
      
    if (error || !data) {
      console.error('구매한 아이콘 URL 가져오기 오류:', error);
      return null;
    }
    
    return data.image_url;
  } catch (error) {
    console.error('구매한 아이콘 URL 가져오기 예외:', error);
    return null;
  }
}

// 아이콘 이름 가져오기
export async function getIconName(iconId: number): Promise<string | null> {
  if (!iconId) return null;
  
  try {
    const supabase = createClient();
    const { data, error } = await supabase
      .from('shop_items')
      .select('name')
      .eq('id', iconId)
      .single();
      
    if (error || !data) {
      console.error('아이콘 이름 가져오기 오류:', error);
      return null;
    }
    
    return data.name;
  } catch (error) {
    console.error('아이콘 이름 가져오기 예외:', error);
    return null;
  }
}

// 사용자의 현재 아이콘 정보 가져오기
export async function getUserIconInfo(userId: string) {
  if (!userId) {
    console.log('사용자 ID가 제공되지 않았습니다. 기본 아이콘 정보를 반환합니다.');
    return getDefaultIconInfo();
  }
  
  try {
    const supabase = createClient();
    
    // 프로필에서 사용자 정보 가져오기
    const { data: profile, error: profileError } = await supabase
      .from('profiles')
      .select('level, exp, icon_id')
      .eq('id', userId)
      .single();
      
    if (profileError) {
      console.error('프로필 정보 가져오기 오류:', profileError);
      
      // 프로필이 존재하지 않는 경우 - 사용자는 있지만 프로필이 없을 수 있음
      if (profileError.code === 'PGRST116') {
        console.log('프로필이 존재하지 않습니다. 새 프로필을 생성합니다.');
        
        // 프로필 생성 시도 (실패해도 기본 아이콘 정보 반환)
        try {
          await supabase.from('profiles').insert({
            id: userId,
            level: 1,
            exp: 0,
            updated_at: new Date().toISOString()
          });
        } catch (insertError) {
          console.error('새 프로필 생성 실패:', insertError);
        }
      }
      
      return getDefaultIconInfo();
    }
    
    // 프로필이 없는 경우 확인
    if (!profile) {
      console.log('프로필이 존재하지 않습니다. 기본 아이콘 정보를 반환합니다.');
      return getDefaultIconInfo();
    }
    
    // 사용자 레벨, 경험치, 아이콘 ID
    const level = profile.level || 1;
    const exp = profile.exp || 0;
    const iconId = profile.icon_id;
    const levelIconUrl = getLevelIconUrl(level);
    
    // 사용자가 구매한 아이콘 사용 중인지 확인
    const isUsingLevelIcon = !iconId;
    
    let purchasedIconUrl = null;
    let iconName = null;
    
    // 구매한 아이콘 사용 중이라면 해당 아이콘 정보 가져오기
    if (iconId && !isUsingLevelIcon) {
      try {
        purchasedIconUrl = await getPurchasedIconUrl(iconId);
        iconName = await getIconName(iconId);
      } catch (iconError) {
        console.error('구매한 아이콘 정보 가져오기 실패:', iconError);
        // 구매 아이콘 정보를 가져오지 못해도 레벨 아이콘은 표시
      }
    }
    
    return {
      level,
      exp,
      iconId,
      isUsingLevelIcon,
      levelIconUrl,
      purchasedIconUrl,
      iconName,
      currentIconUrl: isUsingLevelIcon || !purchasedIconUrl ? levelIconUrl : purchasedIconUrl,
      currentIconName: isUsingLevelIcon || !iconName ? `레벨 ${level} 아이콘` : iconName
    };
  } catch (error) {
    console.error('사용자 아이콘 정보 가져오기 오류:', error);
    return getDefaultIconInfo();
  }
}

// 기본 아이콘 정보 반환 함수
function getDefaultIconInfo() {
  const level = 1;
  const levelIconUrl = getLevelIconUrl(level);
  
  return {
    level,
    exp: 0,
    iconId: null,
    isUsingLevelIcon: true,
    levelIconUrl,
    purchasedIconUrl: null,
    iconName: null,
    currentIconUrl: levelIconUrl,
    currentIconName: `레벨 ${level} 아이콘`
  };
}

// 아이콘 설정 저장 함수
export async function saveIconSetting(
  userId: string, 
  { iconId, usingLevelIcon }: { iconId: number | null, usingLevelIcon: boolean }
) {
  if (!userId) return false;
  
  try {
    const supabase = createClient();
    
    // 레벨 아이콘 사용 시 iconId는 null, 아닐 경우 선택한 아이콘 ID
    const finalIconId = usingLevelIcon ? null : iconId;
    
    // 1. 프로필 테이블 업데이트
    const { error: profileError } = await supabase
      .from('profiles')
      .update({
        icon_id: finalIconId,
        updated_at: new Date().toISOString()
      })
      .eq('id', userId);
      
    if (profileError) {
      console.error('프로필 업데이트 오류:', profileError);
      return false;
    }
    
    // 2. 메타데이터 업데이트를 위한 정보 준비
    let iconUrl = null;
    
    if (usingLevelIcon) {
      // 레벨 정보 가져오기
      const { data: profileData } = await supabase
        .from('profiles')
        .select('level')
        .eq('id', userId)
        .single();
        
      const level = profileData?.level || 1;
      iconUrl = getLevelIconUrl(level);
    } else if (iconId) {
      // 구매한 아이콘 URL 가져오기
      iconUrl = await getPurchasedIconUrl(iconId);
    }
    
    // 3. 메타데이터 업데이트
    const { data: userData } = await supabase.auth.getUser();
    const currentMetadata = userData.user?.user_metadata || {};
    
    const { error: authError } = await supabase.auth.updateUser({
      data: { 
        ...currentMetadata,
        icon_id: finalIconId,
        icon_url: iconUrl,
        using_level_icon: usingLevelIcon
      }
    });
    
    if (authError) {
      console.error('메타데이터 업데이트 오류:', authError);
      return false;
    }
    
    // 4. 아이콘 업데이트 이벤트 발생
    window.dispatchEvent(new CustomEvent('icon-updated', { 
      detail: { 
        iconId: finalIconId,
        usingLevelIcon
      } 
    }));
    
    return true;
  } catch (error) {
    console.error('아이콘 설정 저장 오류:', error);
    return false;
  }
} 