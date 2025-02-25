import axios, { InternalAxiosRequestConfig } from "axios";
import { toast } from "sonner";
import { ApiResponse } from "@/lib/apiResponse";

const IMGBB_API_KEY = process.env.NEXT_PUBLIC_IMGBB_API_KEY;

// Define types for better type safety
export interface Meme {
  id: string;
  title: string;
  description?: string;
  url: string;
  author: string;
  authorId: string;
  createdAt: string;
  likes: number;
  comments: Comment[];
  tags?: string[];
  category: string;
}

export interface Comment {
  id: string;
  text: string;
  author: string;
  authorId: string;
  authorAvatar?: string;
  createdAt: string;
}

export interface User {
  id: string;
  username: string;
  email: string;
  avatar: string;
  bio?: string;
  joinDate: string;
}

export interface PaginatedResponse<T> {
  items: T[];
  pagination: {
    total: number;
    page: number;
    limit: number;
    totalPages: number;
  };
}

// Define the MemeTemplate interface
export interface MemeTemplate {
  id: string;
  name: string;
  url: string;
  width?: number;
  height?: number;
  box_count?: number;
}

// Add TextElement interface
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

// Create an axios instance with interceptors
const api = axios.create({
  baseURL: process.env.NEXT_PUBLIC_API_URL || "",
});

// Add a request interceptor to automatically add the token to all requests
api.interceptors.request.use(
  (config) => {
    // Get token from localStorage
    const token = localStorage.getItem('token');
    
    // If token exists, add it to the Authorization header
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
      console.log(`Adding token to request: ${token.substring(0, 15)}...`);
    } else {
      console.log(`No token available for request to ${config.url}`);
    }
    
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Add a response interceptor to handle 401 errors
api.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config;
    
    // If there's no response, it's likely a network error
    if (!error.response) {
      console.error("Network error:", error.message);
      // Don't show toast for validation requests to avoid spam
      if (!originalRequest.url.includes('/api/auth/validate')) {
        toast.error("Network error. Please check your connection.");
      }
      return Promise.reject(error);
    }
    
    // Handle 401 Unauthorized errors
    if (error.response.status === 401) {
      console.log("401 Unauthorized error detected");
      
      // For validation requests, never retry - just fail cleanly
      if (originalRequest.url.includes('/api/auth/validate')) {
        // Set a flag to remember user was logged in before
        localStorage.setItem('wasLoggedIn', 'true');
        
        // Clear auth data
        localStorage.removeItem('token');
        localStorage.removeItem('user');
        
        return Promise.reject(error);
      }
      
      // If this is already a retry, don't retry again
      if (originalRequest._retry) {
        // Clear auth data on persistent auth failures
        localStorage.removeItem('token');
        localStorage.removeItem('user');
        
        // Redirect to login if needed
        if (typeof window !== 'undefined' && 
            !window.location.pathname.includes('/login') &&
            !window.location.pathname.includes('/register')) {
          toast.error("Your session has expired. Please log in again.");
          window.location.href = '/login';
        }
        
        return Promise.reject(error);
      }
      
      // Mark as retry attempt
      originalRequest._retry = true;
      
      // Try to get a new token or handle the error
      try {
        // You could implement token refresh here if needed
        console.log("Retrying request with existing token");
        return api(originalRequest);
      } catch (refreshError) {
        console.error("Error refreshing auth:", refreshError);
        
        // Clear auth data
        localStorage.removeItem('token');
        localStorage.removeItem('user');
        
        // Redirect to login
        if (typeof window !== 'undefined' && 
            !window.location.pathname.includes('/login') &&
            !window.location.pathname.includes('/register')) {
          window.location.href = '/login';
        }
        
        return Promise.reject(error);
      }
    }
    
    // Handle other errors
    return Promise.reject(error);
  }
);

// Imgflip API services
export const imgflipService = {
  // Get popular meme templates
  getTemplates: async (): Promise<any[]> => {
    try {
      console.log("Fetching templates from API...");
      
      // Define fallback templates
      const fallbackTemplates = [
        {
          id: "181913649",
          name: "Drake Hotline Bling",
          url: "https://i.imgflip.com/30b1gx.jpg",
          width: 1200,
          height: 1200,
          box_count: 2
        },
        {
          id: "87743020",
          name: "Two Buttons",
          url: "https://i.imgflip.com/1g8my4.jpg",
          width: 600,
          height: 908,
          box_count: 3
        },
        {
          id: "112126428",
          name: "Distracted Boyfriend",
          url: "https://i.imgflip.com/1ur9b0.jpg",
          width: 1200,
          height: 800,
          box_count: 3
        }
      ];
      
      try {
        const response = await api.get('/api/templates');
        
        if (!response.data || !response.data.templates || !Array.isArray(response.data.templates)) {
          console.error("Invalid response format:", response.data);
          return fallbackTemplates;
        }
        
        // Validate templates
        const templates = response.data.templates;
        const validTemplates = templates.filter((template: any) => {
          return template && typeof template === 'object' && template.id && template.url;
        });
        
        if (validTemplates.length === 0) {
          console.error("No valid templates in response");
          return fallbackTemplates;
        }
        
        console.log(`Successfully fetched ${validTemplates.length} templates`);
        return validTemplates;
      } catch (error) {
        console.error("Error in API call:", error);
        return fallbackTemplates;
      }
    } catch (error) {
      console.error("Error fetching meme templates:", error);
      
      // Return fallback templates instead of throwing
      return [
        {
          id: "181913649",
          name: "Drake Hotline Bling",
          url: "https://i.imgflip.com/30b1gx.jpg",
          width: 1200,
          height: 1200,
          box_count: 2
        },
        {
          id: "87743020",
          name: "Two Buttons",
          url: "https://i.imgflip.com/1g8my4.jpg",
          width: 600,
          height: 908,
          box_count: 3
        },
        {
          id: "112126428",
          name: "Distracted Boyfriend",
          url: "https://i.imgflip.com/1ur9b0.jpg",
          width: 1200,
          height: 800,
          box_count: 3
        }
      ];
    }
  },

  // Create a meme with the Imgflip API
  createMeme: async (
    templateId: string | MemeTemplate, 
    topText: string, 
    bottomText: string,
    textElements?: TextElement[]
  ): Promise<{ url: string }> => {
    try {
      // Validate inputs
      if (!templateId) {
        console.error("Invalid template ID:", templateId);
        throw new Error("Invalid template ID");
      }
      
      // Ensure templateId is a string
      const finalTemplateId = typeof templateId === 'object' && templateId.id 
        ? templateId.id 
        : String(templateId);
      
      console.log(`Generating meme with template ${finalTemplateId}...`);
      
      // Call the API
      const response = await api.post('/api/generate', { 
        templateId: finalTemplateId, 
        topText: topText || "", 
        bottomText: bottomText || "",
        textElements // Pass text elements if available
      });
      
      // Check the response
      if (!response.data || !response.data.url) {
        console.error("Invalid response format:", response.data);
        throw new Error("Invalid response from server");
      }
      
      console.log("Meme generated successfully:", response.data.url);
      return response.data;
    } catch (error) {
      console.error("Error creating meme:", error);
      
      // In development, return a mock URL to allow testing
      if (process.env.NODE_ENV === "development") {
        console.log("Using fallback mock URL for development due to error");
        return { 
          url: `https://i.imgflip.com/7r${Math.floor(Math.random() * 9999)}.jpg` 
        };
      }
      
      throw error;
    }
  },

  // Get trending memes
  getTrendingMemes: async () => {
    try {
      // First try to get from API
      const response = await api.get('/memes?sort=likes&limit=10');
      return response.data.memes;
    } catch (error) {
      console.error("Error fetching trending memes:", error);
      
      // Fallback: Generate mock data from Imgflip templates
      try {
        const templates = await imgflipService.getTemplates();
        return templates.slice(0, 10).map((meme: any) => ({
          id: meme.id,
          title: meme.name,
          url: meme.url,
          author: "Imgflip User",
          createdAt: new Date().toISOString(),
          likes: Math.floor(Math.random() * 1000),
          comments: [],
          category: ["Trending", "Programming", "Reactions", "Animals"][
            Math.floor(Math.random() * 4)
          ],
          description: `A popular meme template: ${meme.name}`,
          tags: ["trending", "popular", meme.name.toLowerCase().split(" ")[0]],
        }));
      } catch (fallbackError) {
        console.error("Fallback error:", fallbackError);
        return []; // Return empty array as last resort
      }
    }
  },
};

// ImgBB API services for image uploads
export const imgbbService = {
  uploadImage: async (file: File): Promise<{ url: string; delete_url: string }> => {
    try {
      const formData = new FormData();
      formData.append("image", file);
      formData.append("key", IMGBB_API_KEY || "");

      const response = await axios.post('https://api.imgbb.com/1/upload', formData);
      return {
        url: response.data.data.url,
        delete_url: response.data.data.delete_url
      };
    } catch (error) {
      console.error("Error uploading image:", error);
      throw error;
    }
  },
};

// Internal API services for our MongoDB backend
export const memeService = {
  // Get memes with filters
  getMemes: async (options: { 
    sort?: string; 
    category?: string; 
    search?: string; 
    period?: string;
    page?: number; 
    limit?: number 
  }): Promise<PaginatedResponse<Meme>> => {
    try {
      const { sort = 'newest', category, search, period, page = 1, limit = 10 } = options;
      
      const params = new URLSearchParams();
      if (sort) params.append('sort', sort);
      if (category) params.append('category', category);
      if (search) params.append('search', search);
      if (period) params.append('period', period);
      if (page) params.append('page', page.toString());
      if (limit) params.append('limit', limit.toString());
      
      const response = await api.get(`/api/memes?${params.toString()}`);
      return response.data;
    } catch (error) {
      console.error("Error fetching memes:", error);
      throw error;
    }
  },

  // Get a single meme by ID
  getMemeById: async (id: string): Promise<Meme> => {
    try {
      const response = await api.get(`/api/memes/${id}`);
      return response.data;
    } catch (error) {
      console.error(`Error fetching meme ${id}:`, error);
      // Return fallback data for demo purposes
      return {
        id,
        title: "Fallback Meme",
        description: "This meme couldn't be loaded from the server",
        url: "https://i.imgflip.com/7rybvh.jpg", // Generic fallback image
        author: "MemeVerse User",
        authorId: "unknown",
        createdAt: new Date().toISOString(),
        likes: 0,
        comments: [],
        tags: ["error", "fallback"],
        category: "Other"
      };
    }
  },

  // Create a new meme
  createMeme: async (memeData: {
    title: string;
    url: string;
    description?: string;
    category?: string;
    tags?: string[];
  }): Promise<Meme> => {
    try {
      console.log("Creating meme with data:", memeData);
      
      // Ensure category is always a string
      const memeWithCategory = {
        ...memeData,
        category: memeData.category || "Other" // Default to "Other" if category is undefined
      };
      
      const response = await api.post('/api/memes', memeWithCategory);
      
      if (!response.data || !response.data.id) {
        console.error("Invalid response from create meme API:", response.data);
        throw new Error("Invalid response from server");
      }
      
      console.log("Meme created successfully:", response.data);
      return response.data;
    } catch (error) {
      console.error("Error creating meme:", error);
      
      // In development, return a mock meme for testing
      if (process.env.NODE_ENV === "development") {
        console.log("Using mock meme for development");
        const mockMeme: Meme = {
          id: `mock-${Date.now()}`,
          title: memeData.title,
          url: memeData.url,
          description: memeData.description || "",
          category: memeData.category || "Other", // Ensure category is a string
          tags: memeData.tags || [],
          author: "You",
          authorId: "your-id",
          createdAt: new Date().toISOString(),
          likes: 0,
          comments: []
        };
        return mockMeme;
      }
      
      throw error;
    }
  },

  // Like a meme
  likeMeme: async (memeId: string): Promise<{ liked: boolean; likes: number }> => {
    try {
      const response = await api.post<ApiResponse>(`/api/memes/${memeId}/like`);
      
      if (!response.data.success) {
        throw new Error(response.data.error || "Failed to update like status");
      }
      
      return response.data.data;
    } catch (error: any) {
      console.error("Error liking meme:", error);
      throw error;
    }
  },

  // Check if user has liked a meme
  checkLikeStatus: async (memeId: string): Promise<{ liked: boolean }> => {
    try {
      // Throttle requests to prevent spamming
      const cacheKey = `like-${memeId}`;
      if (!throttleRequest(cacheKey)) {
        return { liked: false };
      }
      
      const response = await api.get<ApiResponse>(`/api/memes/${memeId}/like`);
      
      if (!response.data.success) {
        throw new Error(response.data.error || "Failed to check like status");
      }
      
      return response.data.data;
    } catch (error: any) {
      console.error("Error checking like status:", error);
      // Return default value on error instead of rethrowing
      return { liked: false };
    }
  },

  // Check if user has saved a meme
  checkSaveStatus: async (memeId: string): Promise<{ saved: boolean }> => {
    try {
      // Throttle requests to prevent spamming
      const cacheKey = `save-${memeId}`;
      if (!throttleRequest(cacheKey)) {
        return { saved: false };
      }
      
      const response = await api.get<ApiResponse>(`/api/memes/${memeId}/save`);
      
      if (!response.data.success) {
        throw new Error(response.data.error || "Failed to check save status");
      }
      
      return response.data.data;
    } catch (error: any) {
      console.error("Error checking save status:", error);
      // Return default value on error instead of rethrowing
      return { saved: false };
    }
  },

  // Toggle save on a meme
  saveMeme: async (memeId: string): Promise<{ saved: boolean }> => {
    try {
      const response = await api.post<ApiResponse>(`/api/memes/${memeId}/save`);
      
      if (!response.data.success) {
        throw new Error(response.data.error || "Failed to update save status");
      }
      
      return response.data.data;
    } catch (error: any) {
      console.error("Error saving meme:", error);
      throw error;
    }
  },

  // Get comments for a meme
  getComments: async (id: string): Promise<Comment[]> => {
    try {
      const response = await api.get(`/api/memes/${id}/comments`);
      return response.data;
    } catch (error) {
      console.error(`Error fetching comments for meme ${id}:`, error);
      return [];
    }
  },
  
  // Add a comment to a meme
  addComment: async (id: string, text: string): Promise<Comment> => {
    try {
      const response = await api.post(`/api/memes/${id}/comments`, { text });
      return response.data;
    } catch (error) {
      console.error(`Error adding comment to meme ${id}:`, error);
      throw error;
    }
  },

  // Get feed memes
  getFeedMemes: async (page = 1, limit = 10) => {
    try {
      const response = await api.get('/feed', {
        params: { page, limit }
      });
      return response.data;
    } catch (error) {
      console.error("Error fetching feed memes:", error);
      throw error;
    }
  },

  // Add uploadToImgBB function to memeService
  uploadToImgBB: async (imageUrl: string): Promise<{ url: string }> => {
    try {
      console.log("Uploading image to ImgBB:", imageUrl);
      
      // If we're in development mode, just return the original URL
      if (process.env.NODE_ENV === "development" && !IMGBB_API_KEY) {
        console.log("Development mode: skipping actual upload to ImgBB");
        return { url: imageUrl };
      }
      
      // Create form data for ImgBB API
      const formData = new FormData();
      formData.append("key", IMGBB_API_KEY || "");
      
      // If the image is a URL, we need to use the URL parameter
      if (imageUrl.startsWith('http')) {
        formData.append("image", imageUrl);
      } else {
        // If it's base64, we need to use the image parameter
        formData.append("image", imageUrl.split(',')[1]);
      }
      
      // Call ImgBB API to upload image
      const response = await axios.post(
        "https://api.imgbb.com/1/upload",
        formData
      );
      
      if (!response.data.success) {
        console.error("ImgBB API error:", response.data);
        throw new Error("Failed to upload image to ImgBB");
      }
      
      console.log("Image uploaded successfully:", response.data.data.url);
      return { url: response.data.data.url };
    } catch (error) {
      console.error("Error uploading to ImgBB:", error);
      throw error;
    }
  },

  // Get user-generated memes
  getUserGeneratedMemes: async (onlyGenerated = true): Promise<Meme[]> => {
    try {
      const url = onlyGenerated 
        ? '/api/memes/user-generated?generated=true'
        : '/api/memes/user-generated';
        
      const response = await api.get(url);
      return response.data;
    } catch (error) {
      console.error("Error fetching user-generated memes:", error);
      return [];
    }
  },
  createUserGeneratedMeme: async (memeData: {
    title: string;
    url: string;
    category?: string;
    description?: string;
    tags?: string[];
  }): Promise<Meme> => {
    try {
      console.log("Creating user-generated meme with data:", memeData);
      
      const response = await api.post('/api/memes/user-generated', memeData);
      
      if (!response.data || !response.data.id) {
        console.error("Invalid response from create user-generated meme API:", response.data);
        throw new Error("Invalid response from server");
      }
      
      return response.data;
    } catch (error) {
      console.error("Error creating user-generated meme:", error);
      throw error;
    }
  },
};

export const userService = {
  // Get user profile
  getProfile: async (userId: string) => {
    try {
      const response = await api.get(`/api/users/${userId}`);
      return response.data;
    } catch (error) {
      console.error(`Error fetching user profile ${userId}:`, error);
      // Return fallback data instead of throwing
      return {
        id: userId,
        username: 'MemeCreator123',
        bio: 'Meme enthusiast and creator.',
        avatar: `https://api.dicebear.com/7.x/avataaars/svg?seed=${userId}`,
        joinDate: '2023-01-15T00:00:00Z'
      };
    }
  },

  // Update user profile
  updateProfile: async (userId: string, profileData: any) => {
    try {
      const response = await api.patch(`/api/users/${userId}`, profileData);
      return response.data;
    } catch (error) {
      console.error(`Error updating user profile ${userId}:`, error);
      throw error;
    }
  },

  // Get user's memes
  getUserMemes: async (userId: string) => {
    try {
      const response = await api.get(`/api/users/${userId}/memes`);
      return response.data;
    } catch (error) {
      console.error(`Error fetching memes for user ${userId}:`, error);
      throw error;
    }
  },

  // Get saved memes for a user
  getSavedMemes: async (userId: string) => {
    try {
      const response = await api.get(`/api/users/${userId}/saved`);
      return response.data;
    } catch (error) {
      console.error(`Error fetching saved memes for user ${userId}:`, error);
      return [];
    }
  },
};

export const leaderboardService = {
  // Get top memes
  getTopMemes: async (period: string = "all-time") => {
    try {
      const response = await api.get(`/api/leaderboard/memes?period=${period}`);
      return response.data;
    } catch (error) {
      console.error(`Error fetching top memes:`, error);
      throw error;
    }
  },

  // Get top users
  getTopUsers: async (period: string = "all-time") => {
    try {
      const response = await api.get(`/api/leaderboard/users?period=${period}`);
      return response.data;
    } catch (error) {
      console.error(`Error fetching top users:`, error);
      throw error;
    }
  },
};

// Auth service for authentication
export const authService = {
  validateToken: async (): Promise<User> => {
    try {
      // Add a timestamp to prevent caching
      const timestamp = new Date().getTime();
      const response = await api.get<ApiResponse>(`/api/auth/validate?t=${timestamp}`);
      
      if (!response.data.success) {
        // Clear invalid tokens from localStorage
        localStorage.removeItem('token');
        localStorage.removeItem('user');
        throw new Error(response.data.error || "Invalid token");
      }
      
      return response.data.data.user;
    } catch (error: any) {
      console.error("Error validating token:", error);
      
      // Clear invalid tokens from localStorage
      localStorage.removeItem('token');
      localStorage.removeItem('user');
      
      // Check if it's a network error
      if (!error.response) {
        console.log("Network error - using fallback");
        // Try to get user from localStorage as fallback
        try {
          const user = localStorage.getItem('user');
          if (user) {
            return JSON.parse(user);
          }
        } catch (e) {
          console.error("Error parsing user from localStorage:", e);
        }
      }
      
      throw error;
    }
  },
  
  login: async (credentials: { email: string; password: string }): Promise<{ token: string; user: User }> => {
    try {
      const response = await api.post<ApiResponse>('/api/auth/login', credentials);
      
      if (!response.data.success) {
        throw new Error(response.data.error || "Login failed");
      }
      
      return response.data.data;
    } catch (error: any) {
      if (error.response?.data?.error) {
        throw new Error(error.response.data.error);
      }
      throw new Error(error.message || "Login failed");
    }
  },
  
  register: async (userData: { username: string; email: string; password: string }) => {
    try {
      const response = await axios.post<ApiResponse>("/api/auth/register", userData);
      
      if (!response.data.success) {
        throw new Error(response.data.error || "Registration failed");
      }
      
      return response.data.data;
    } catch (error: any) {
      if (error.response?.data?.error) {
        throw new Error(error.response.data.error);
      }
      throw new Error(error.message || "Registration failed");
    }
  },
  
  getCurrentUser: async (config: any): Promise<User> => {
    try {
      const response = await api.get('/api/auth/me', config);
      return response.data.user;
    } catch (error) {
      console.error("Error getting current user:", error);
      throw error;
    }
  },

  logout: async () => {
    try {
      await api.post('/api/auth/logout');
      return true;
    } catch (error) {
      console.error("Logout error:", error);
      return false;
    }
  }
};

// Add a request throttling mechanism
const requestThrottles = new Map<string, number>();

// Helper function to throttle requests
const throttleRequest = (key: string, timeMs: number = 5000): boolean => {
  const now = Date.now();
  const lastRequest = requestThrottles.get(key) || 0;
  
  if (now - lastRequest < timeMs) {
    console.log(`Request to ${key} throttled (too frequent)`);
    return false;
  }
  
  requestThrottles.set(key, now);
  return true;
}; 