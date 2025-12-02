-- Add 'hot_post' notification type to CHECK constraint
-- Migration: Add HOT post notification support

-- Step 1: Drop existing constraint
ALTER TABLE notifications
DROP CONSTRAINT IF EXISTS notifications_type_check;

-- Step 2: Add new constraint with 'hot_post' type
ALTER TABLE notifications
ADD CONSTRAINT notifications_type_check
CHECK (type IN (
  'comment',
  'reply',
  'post_like',
  'comment_like',
  'level_up',
  'report_result',
  'admin_notice',
  'welcome',
  'hot_post'
));

-- Step 3: Add comment for documentation
COMMENT ON CONSTRAINT notifications_type_check ON notifications IS
'Allowed notification types: comment, reply, post_like, comment_like, level_up, report_result, admin_notice, welcome, hot_post';
