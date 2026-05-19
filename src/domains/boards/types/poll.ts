export interface PostPollDraft {
  question: string;
  options: string[];
}

export interface PostPollOption {
  id: string;
  text: string;
  displayOrder: number;
  voteCount: number;
}

export interface PostPoll {
  id: string;
  postId: string;
  question: string;
  totalVotes: number;
  viewerVoteOptionId: string | null;
  options: PostPollOption[];
}
