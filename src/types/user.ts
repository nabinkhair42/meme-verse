/**
 * User interface - represents a user in the system
 */
export interface User {
  _id?: string;
  username: string;
  email: string;
  password?: string;
  avatar?: string;
  bio?: string;
  joinDate: Date | string;
  savedMemes?: string[];
  likedMemes?: string[];
  role?: 'user' | 'admin';
}

/**
 * UserCreateInput - data required to create a new user
 */
export interface UserCreateInput {
  username: string;
  email: string;
  password: string;
}

/**
 * UserUpdateInput - data that can be updated for a user
 */
export interface UserUpdateInput {
  username?: string;
  avatar?: string;
  bio?: string;
  password?: string;
}

/**
 * UserAuthResponse - response after successful authentication
 */
export interface UserAuthResponse {
  user: User;
  token: string;
}

/**
 * UserProfile - public user profile without sensitive information
 */
export interface UserProfile {
  _id: string;
  username: string;
  avatar?: string;
  bio?: string;
  joinDate: Date | string;
  memeCount?: number;
  likeCount?: number;
} 