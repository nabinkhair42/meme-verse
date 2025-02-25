/**
 * Comment interface - represents a comment on a meme
 */
export interface Comment {
  _id?: string;
  memeId: string;
  userId: string;
  username: string;
  userAvatar?: string;
  content: string;
  createdAt: Date | string;
  updatedAt?: Date | string;
}

/**
 * CommentCreateInput - data required to create a new comment
 */
export interface CommentCreateInput {
  memeId: string;
  content: string;
}

/**
 * CommentUpdateInput - data that can be updated for a comment
 */
export interface CommentUpdateInput {
  content: string;
} 