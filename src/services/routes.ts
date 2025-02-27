export const IMGBB_API_KEY = process.env.NEXT_PUBLIC_IMGBB_API_KEY;

export const BACKEND_BASE_URL = process.env.NEXT_PUBLIC_API_URL;

// Auth routes
export const AUTH_ROUTES = {
  LOGIN: '/api/auth/login',
  REGISTER: '/api/auth/register',
  LOGOUT: '/api/auth/logout',
  VALIDATE: '/api/auth/validate',
  ME: '/api/auth/me'
} as const;

// Feed routes
export const FEED_ROUTES = {
  BASE: '/api/feed',
  TRENDING: '/api/feed/trending',
  SEARCH: '/api/search',
  CATEGORY: '/api/category'
} as const;

// Meme routes
export const MEME_ROUTES = {
  BASE: '/api/memes',
  BY_ID: (id: string) => `/api/memes/${id}`,
  LIKE: (id: string) => `/api/memes/${id}/like`,
  SAVE: (id: string) => `/api/memes/${id}/save`,
  COMMENTS: (id: string) => `/api/memes/${id}/comments`,
  USER_GENERATED: '/api/memes/user-generated',
  GENERATE: '/api/generate',
  TEMPLATES: '/api/templates'
} as const;

// User routes
export const USER_ROUTES = {
  BASE: '/api/users',
  BY_ID: (id: string) => `/api/users/${id}`,
  MEMES: (id: string) => `/api/users/${id}/memes`,
  SAVED: (id: string) => `/api/users/${id}/saved`
} as const;

// Leaderboard routes
export const LEADERBOARD_ROUTES = {
  MEMES: '/api/leaderboard/memes',
  USERS: '/api/leaderboard/users'
} as const;

// External API routes
export const EXTERNAL_ROUTES = {
  IMGBB_UPLOAD: 'https://api.imgbb.com/1/upload'
} as const;
