-- page_metadata 테이블의 "/" 경로 데이터 삭제 또는 업데이트

-- 방법 1: 삭제 (그럼 site_settings 값 사용됨)
DELETE FROM page_metadata WHERE page_path = '/';

-- 또는 방법 2: 업데이트
UPDATE page_metadata
SET
  title = '4590 Football',
  description = '실시간 축구 경기 일정과 스코어, 팀·선수 정보를 확인하고, 사랑하는 축구 팀의 팬들과 함께 소통할 수 있는 커뮤니티 플랫폼입니다.',
  is_active = false  -- 또는 삭제 대신 비활성화
WHERE page_path = '/';
