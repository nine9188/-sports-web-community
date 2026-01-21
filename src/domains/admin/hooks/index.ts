// Admin Dashboard
export { useAdminDashboard } from './useAdminDashboard';

// Admin Users
export {
  useAdminUsers,
  useToggleAdminMutation,
  useConfirmEmailMutation,
} from './useAdminUsers';

// Admin Boards
export {
  useAdminBoards,
  useCreateBoardMutation,
  useUpdateBoardMutation,
  useDeleteBoardMutation,
  useSwapBoardOrderMutation,
} from './useAdminBoards';

// Admin Notices
export {
  useAdminNotices,
  useBoardsForNotice,
  useSetNoticeMutation,
  useSetNoticeByNumberMutation,
  useRemoveNoticeMutation,
  useUpdateNoticeTypeMutation,
} from './useAdminNotices';

// Admin Reports
export {
  useAdminReports,
  useProcessReportMutation,
  useExecuteReportActionMutation,
  useRestoreHiddenContentMutation,
  useGetReportTargetAuthor,
} from './useAdminReports';

// Admin Logs
export { useAdminLogs, useLogStatistics } from './useAdminLogs';

// Admin Exp
export { useAdminExpHistory, useAdjustExpMutation } from './useAdminExp';

// Admin Shop
export {
  useCreateShopItemMutation,
  useUpdateShopItemMutation,
  useDeleteShopItemMutation,
} from './useAdminShop';

// Admin Predictions
export {
  useUpcomingMatches,
  usePredictionAutomationLogs,
  useGenerateAllPredictionsMutation,
  useGenerateLeaguePredictionMutation,
  useTogglePredictionAutomationMutation,
  useTestPredictionMutation,
  usePredictionPreview,
} from './useAdminPredictions';
