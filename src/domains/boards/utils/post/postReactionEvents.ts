import type { PostReactionType } from './postReactionClient';

export const POST_REACTION_UPDATED_EVENT = 'post-reaction-updated';

export interface PostReactionUpdatedDetail {
  postId: string;
  likes: number;
  dislikes: number;
  userAction: PostReactionType | null;
}

export function dispatchPostReactionUpdated(detail: PostReactionUpdatedDetail) {
  window.dispatchEvent(new CustomEvent(POST_REACTION_UPDATED_EVENT, { detail }));
}
