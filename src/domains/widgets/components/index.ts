// 위젯 컴포넌트 exports
export { NewsWidget, NewsImageClient } from './news-widget';
export { default as AllPostsWidget } from './AllPostsWidget';
export { LiveScoreWidgetV2 } from './live-score-widget';
export { BoardCollectionWidget } from './board-collection-widget';
export { BoardQuickLinksWidget } from './board-quick-links-widget';

// board-quick-links 관련 exports
export * from './board-quick-links-widget';

// 타입 exports
export type { NewsItem, NewsWidgetProps } from './news-widget';
export type { BoardCollectionData, BoardPost, BoardInfo } from './board-collection-widget'; 