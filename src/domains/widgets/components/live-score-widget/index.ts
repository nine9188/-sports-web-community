import LiveScoreWidgetV2Server, { LiveScoreWidgetStreaming } from './LiveScoreWidgetV2Server';

export { LiveScoreWidgetV2Server as LiveScoreWidgetV2, LiveScoreWidgetStreaming };
export default LiveScoreWidgetV2Server;
export { transformToWidgetLeagues } from './LiveScoreWidgetV2Server';

// 타입 re-export
export type { WidgetTeam, WidgetMatch, WidgetLeague, LiveScoreWidgetV2Props } from './types';
