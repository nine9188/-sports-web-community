// 위젯 컴포넌트 exports
export { default as NewsWidget } from './news-widget';
export { default as NewsWidgetClient } from './news-widget-client';
export { default as AllPostsWidget } from './AllPostsWidget';
export { default as LiveScoreWidget } from './live-score-widget';
export { default as BannerWidget } from './banner-widget';
export { BoardCollectionWidget } from './board-collection-widget';

// 배너 위젯 관련 exports
export * from './banner-widget';

// 타입 exports
export type { NewsItem } from './news-widget';
export type { BoardCollectionData, BoardPost, BoardInfo } from './board-collection-widget'; 