/**
 * Meme interface - represents a meme in the system
 */
export interface Meme {
  _id?: string;
  title: string;
  description?: string;
  imageUrl: string;
  userId: string;
  username: string;
  userAvatar?: string;
  createdAt: Date | string;
  updatedAt: Date | string;
  likes: number;
  commentCount: number;
  tags?: string[];
  category?: string;
  type: 'generated' | 'uploaded';
  templateId?: string;
  templateUrl?: string;
}

/**
 * MemeCreateInput - data required to create a new meme
 */
export interface MemeCreateInput {
  title: string;
  imageUrl: string;
  description?: string;
  tags?: string[];
  category?: string;
  type: 'generated' | 'uploaded';
  templateId?: string;
  templateUrl?: string;
}

/**
 * MemeUpdateInput - data that can be updated for a meme
 */
export interface MemeUpdateInput {
  title?: string;
  description?: string;
  tags?: string[];
  category?: string;
}

/**
 * MemeWithLikeStatus - meme with additional like status for the current user
 */
export interface MemeWithLikeStatus extends Meme {
  isLiked?: boolean;
  isSaved?: boolean;
}

/**
 * PaginatedMemes - paginated response for memes
 */
export interface PaginatedMemes {
  memes: Meme[];
  pagination: {
    total: number;
    page: number;
    limit: number;
    totalPages: number;
  };
} 