// 게시판 응답 관련 타입 정의
import { Board } from './board';

// 계층적 게시판 구조를 위한 타입
export interface HierarchicalBoard extends Board {
  children?: HierarchicalBoard[];
}

// 게시판 API 응답 타입
export interface BoardsResponse {
  boards: Board[];
  hierarchical: HierarchicalBoard[];
} 