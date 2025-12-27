// 위젯 컴포넌트 exports
export { NewsWidget, NewsWidgetClient } from './news-widget';
export { default as AllPostsWidget } from './AllPostsWidget';
export { default as LiveScoreWidget } from './live-score-widget';
export { default as BannerWidget } from './banner-widget';
export { BoardCollectionWidget } from './board-collection-widget';
export { BoardQuickLinksWidget } from './board-quick-links-widget';

// 배너 위젯 관련 exports
export * from './banner-widget';
export * from './board-quick-links-widget';

// 타입 exports
export type { NewsItem, NewsWidgetProps } from './news-widget';
export type { BoardCollectionData, BoardPost, BoardInfo } from './board-collection-widget'; 