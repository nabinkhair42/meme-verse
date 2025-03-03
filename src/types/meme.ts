/**
 * Meme interface - represents a meme in the system
 */
export interface Meme {
  _id: string;
  id?: string;
  title: string;
  imageUrl: string;
  url?: string;
  description?: string;
  userId: string;
  username: string;
  author?: string;
  userAvatar?: string;
  authorId?: string;
  createdAt: Date | string;
  updatedAt: Date | string;
  likes: number;
  commentCount: number;
  comments?: Comment[];
  category?: string;
  tags?: string[];
  type: 'generated' | 'uploaded';
  templateId?: string;
  templateUrl?: string;
  isLiked?: boolean;
  isSaved?: boolean;
}

/**
 * Comment interface - represents a comment on a meme
 */
export interface Comment {
  _id?: string;
  id?: string;
  memeId: string;
  userId: string;
  username: string;
  author?: string;
  userAvatar?: string;
  content: string;
  text?: string;
  createdAt: Date | string;
  updatedAt?: Date | string;
}

/**
 * TextElement interface - represents a text element in a meme
 */
export interface TextElement {
  id: string;
  text: string;
  x: number;
  y: number;
  fontSize: number;
  color: string;
  strokeColor: string;
  rotation: number;
}

/**
 * MemeTemplate interface - represents a meme template
 */
export interface MemeTemplate {
  id: string;
  name: string;
  url: string;
  width: number;
  height: number;
  box_count: number;
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
  textElements?: TextElement[];
}

/**
 * MemeUpdateInput - data that can be updated for a meme
 */
export interface MemeUpdateInput {
  title?: string;
  description?: string;
  tags?: string[];
  category?: string;
  textElements?: TextElement[];
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

/**
 * GenerateMemeInput - data required to generate a new meme
 */
export interface GenerateMemeInput {
  templateId: string;
  topText?: string;
  bottomText?: string;
  textElements?: TextElement[];
}

/**
 * GenerateMemeResponse - response from meme generation
 */
export interface GenerateMemeResponse {
  url: string;
  templateId: string;
  textElements?: TextElement[];
} 