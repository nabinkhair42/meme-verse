import { ApiResponse } from "@/lib/apiResponse";
import axios from "axios";
import { toast } from "sonner";
import { GenerateMemeInput, GenerateMemeResponse } from "@/types/meme";
import type { MemeTemplate } from "@/types/meme";

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
  _id?: string;
  text?: string;
  content?: string;
  author?: string;
  username?: string;
  authorId?: string;
  userId?: string;
  authorAvatar?: string;
  userAvatar?: string;
  memeId?: string;
  createdAt: string;
  updatedAt?: string;
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
  data: T[];
  pagination: {
    total: number;
    page: number;
    limit: number;
    totalPages: number;
  };
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
  withCredentials: true, // Enable cookies for all requests
});

// Add a request interceptor to automatically add the token to all requests
api.interceptors.request.use(
  (config) => {
    // Get token from localStorage
    const token = localStorage.getItem('token');
    
    // If token exists, add it to the Authorization header
    if (token && !config.headers.Authorization) {
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
  getTrendingMemes: async (page = 1, limit = 10, period = 'week') => {
    try {
      const response = await api.get('/api/feed/trending', {
        params: { page, limit, period }
      });
      
      // Check if the response has the expected structure
      if (response.data && response.data.success && response.data.data) {
        // Map the memes to the expected format
        const mappedMemes = response.data.data.memes.map((meme: any) => ({
          id: meme._id || meme.id, // Use _id as id if available
          title: meme.title,
          description: meme.description || '',
          url: meme.imageUrl || meme.url, // Use imageUrl as url if available
          category: meme.category || 'Other',
          author: meme.username || meme.author || 'Unknown',
          authorId: meme.userId || meme.authorId || '',
          createdAt: meme.createdAt,
          likes: meme.likes || 0,
          commentCount: meme.commentCount || 0,
          comments: meme.comments || [],
          tags: meme.tags || [],
          isLiked: meme.isLiked || false,
          isSaved: meme.isSaved || false
        }));
        
        return {
          data: mappedMemes,
          pagination: response.data.data.pagination
        };
      }
      
      // Fallback to the original response if it doesn't match the expected structure
      return response.data;
    } catch (error) {
      console.error("Error fetching trending memes:", error);
      throw error;
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
  // Get memes with pagination and filters
  getMemes: async ({ page = 1, limit = 10, category = "", sort = "latest" } = {}): Promise<PaginatedResponse<Meme>> => {
    try {
      // Use the new feed API
      const response = await api.get(`/api/feed`, {
        params: {
          page,
          limit,
          category,
          sort
        }
      });

      if (!response.data.success) {
        throw new Error(response.data.error || "Failed to fetch memes");
      }

      return response.data.data;
    } catch (error) {
      console.error("Error fetching memes:", error);
      throw error;
    }
  },

  // Get a single meme by ID
  getMemeById: async (id: string): Promise<Meme> => {
    try {
      const response = await api.get(`/api/memes/${id}`);
      
      // Map the API response to the expected format
      const apiResponse = response.data;
      
      // Check if the response has the expected structure
      if (apiResponse && apiResponse.success && apiResponse.data) {
        const meme = apiResponse.data;
        return {
          id: meme._id || meme.id, // Use _id as id if available
          title: meme.title,
          description: meme.description || '',
          url: meme.imageUrl || meme.url, // Use imageUrl as url if available
          category: meme.category || 'Other',
          author: meme.username || meme.author || 'Unknown',
          authorId: meme.userId || meme.authorId || '',
          createdAt: meme.createdAt,
          likes: meme.likes || 0,
          comments: meme.comments || [],
          tags: meme.tags || []
        };
      }
      
      // Fallback to the original response if it doesn't match the expected structure
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
    url?: string;
    imageUrl?: string;
    description?: string;
    category?: string;
    tags?: string[];
    type?: 'generated' | 'uploaded';
  }): Promise<Meme> => {
    try {
      console.log("Creating meme with data:", memeData);
      
      // Ensure category is always a string
      const memeWithCategory = {
        ...memeData,
        // If imageUrl is not provided but url is, use url as imageUrl
        imageUrl: memeData.imageUrl || memeData.url,
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
          url: memeData.url || memeData.imageUrl || "",
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
  getComments: async (id: string, page = 1, limit = 10): Promise<{
    comments: Comment[];
    pagination?: {
      page: number;
      totalPages: number;
      total: number;
      limit: number;
    }
  }> => {
    try {
      const response = await api.get(`/api/memes/${id}/comments`, {
        params: { page, limit }
      });
      
      // Check if the response has the expected structure
      if (response.data && response.data.success && response.data.data) {
        // If the API returns paginated data
        if (response.data.data.comments && response.data.data.pagination) {
          return {
            comments: response.data.data.comments,
            pagination: response.data.data.pagination
          };
        }
        
        // If the API returns just an array of comments
        if (Array.isArray(response.data.data)) {
          return {
            comments: response.data.data,
            pagination: {
              page: 1,
              totalPages: 1,
              total: response.data.data.length,
              limit: response.data.data.length
            }
          };
        }
      }
      
      // Fallback for unexpected response structure
      return {
        comments: Array.isArray(response.data) ? response.data : [],
        pagination: {
          page: 1,
          totalPages: 1,
          total: Array.isArray(response.data) ? response.data.length : 0,
          limit: 10
        }
      };
    } catch (error) {
      console.error(`Error fetching comments for meme ${id}:`, error);
      return { comments: [] };
    }
  },
  
  // Add a comment to a meme
  addComment: async (id: string, text: string): Promise<Comment> => {
    try {
      const response = await api.post(`/api/memes/${id}/comments`, { text });
      
      // Check if the response has the expected structure
      if (response.data && response.data.success && response.data.data) {
        return response.data.data;
      }
      
      // Fallback to the original response if it doesn't match the expected structure
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
      
      // If we're in development mode and no API key, return the original URL
      if (process.env.NODE_ENV === "development" && !IMGBB_API_KEY) {
        console.log("Development mode: skipping actual upload to ImgBB");
        return { url: imageUrl };
      }

      if (!IMGBB_API_KEY) {
        throw new Error("ImgBB API key is not configured");
      }
      
      // Create form data for ImgBB API
      const formData = new FormData();
      formData.append("key", IMGBB_API_KEY);
      
      // If the image is a URL, we need to use the URL parameter
      if (imageUrl.startsWith('http')) {
        formData.append("image", imageUrl);
      } else {
        // If it's base64, we need to use the image parameter
        // Remove the data:image/[type];base64, prefix if present
        const base64Data = imageUrl.includes('base64') ? imageUrl.split(',')[1] : imageUrl;
        formData.append("image", base64Data);
      }
      
      // Call ImgBB API to upload image
      const response = await axios.post(
        "https://api.imgbb.com/1/upload",
        formData
      );
      
      // Validate the response
      if (!response.data || !response.data.success || !response.data.data?.url) {
        console.error("Invalid ImgBB API response:", response.data);
        throw new Error("Failed to upload image to ImgBB: Invalid response");
      }
      
      const uploadedUrl = response.data.data.url;
      
      // Validate the returned URL
      if (!uploadedUrl.startsWith('http')) {
        throw new Error("Invalid URL received from ImgBB");
      }
      
      console.log("Image uploaded successfully to ImgBB:", uploadedUrl);
      return { url: uploadedUrl };
    } catch (error: any) {
      console.error("Error uploading to ImgBB:", error?.response?.data || error);
      
      // If we're in development mode, fallback to the original URL
      if (process.env.NODE_ENV === "development") {
        console.log("Development mode: falling back to original URL");
        return { url: imageUrl };
      }
      
      // In production, rethrow the error
      throw new Error(error?.response?.data?.error?.message || error?.message || "Failed to upload image to ImgBB");
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

  /**
   * Get trending memes with pagination and period filtering
   * @param page Page number (starts at 1)
   * @param limit Number of memes per page
   * @param period Time period ('day', 'week', 'month', 'all')
   * @returns Paginated response with memes
   */
  async getTrendingMemes(page = 1, limit = 10, period = 'week') {
    try {
      // Try to use the dedicated trending API
      const response = await api.get(`/api/feed/trending`, {
        params: { page, limit, period }
      });
      
      // Check if the response has the expected structure
      if (response.data && response.data.success && response.data.data) {
        // Map the memes to the expected format
        const memes = response.data.data.memes.map((meme: any) => ({
          id: meme._id || meme.id,
          title: meme.title,
          description: meme.description,
          url: meme.imageUrl || meme.url,
          category: meme.category,
          author: meme.username || meme.author,
          createdAt: meme.createdAt,
          likes: meme.likes || 0,
          commentCount: meme.commentCount || meme.comments?.length || 0,
          comments: meme.comments || [],
          tags: meme.tags || [],
          isLiked: meme.isLiked || false,
          isSaved: meme.isSaved || false
        }));
        
        return {
          data: memes,
          pagination: response.data.data.pagination
        };
      }
      
      // If the response doesn't have the expected structure, return it as is
      return response.data;
    } catch (error) {
      console.error("Error fetching trending memes:", error);
      
      // Fall back to the regular API
      console.log("Falling back to regular API for trending memes");
      return this.getMemes({
        sort: 'likes',
        page,
        limit
      });
    }
  },

  /**
   * Search for memes with filters
   * @param options Search options
   * @returns Paginated response with memes
   */
  searchMemes: async function(options: { 
    search?: string; 
    category?: string; 
    sort?: string; 
    page?: number; 
    limit?: number 
  }) {
    try {
      const { search = '', category = '', sort = 'newest', page = 1, limit = 10 } = options;
      
      const params = new URLSearchParams();
      if (search) params.append('search', search);
      if (category) params.append('category', category);
      if (sort) params.append('sort', sort);
      if (page) params.append('page', page.toString());
      if (limit) params.append('limit', limit.toString());
      
      const response = await api.get(`/api/search?${params.toString()}`);
      
      // Check if the response has the expected structure
      if (response.data && response.data.success && response.data.data) {
        // Map the memes to the expected format
        const mappedMemes = response.data.data.memes.map((meme: any) => ({
          id: meme._id || meme.id,
          title: meme.title,
          description: meme.description || '',
          url: meme.imageUrl || meme.url,
          category: meme.category || 'Other',
          author: meme.username || meme.author || 'Unknown',
          authorId: meme.userId || meme.authorId || '',
          createdAt: meme.createdAt,
          likes: meme.likes || 0,
          commentCount: meme.commentCount || 0,
          comments: meme.comments || [],
          tags: meme.tags || [],
          isLiked: meme.isLiked || false,
          isSaved: meme.isSaved || false
        }));
        
        return {
          data: mappedMemes,
          pagination: response.data.data.pagination
        };
      }
      
      // Fallback to the original response if it doesn't match the expected structure
      return response.data;
    } catch (error) {
      console.error("Error searching memes:", error);
      
      // Fall back to the regular API
      console.log("Falling back to regular API for search");
      return this.getMemes({
        category: options?.category,
        sort: options?.sort,
        page: options?.page,
        limit: options?.limit
      });
    }
  },

  /**
   * Get memes by category
   * @param category Category name
   * @param options Additional options
   * @returns Paginated response with memes
   */
  getMemesByCategory: async function(category: string, options: { 
    sort?: string; 
    page?: number; 
    limit?: number 
  } = {}) {
    try {
      const { sort = 'newest', page = 1, limit = 10 } = options;
      
      const params = new URLSearchParams();
      params.append('category', category);
      if (sort) params.append('sort', sort);
      if (page) params.append('page', page.toString());
      if (limit) params.append('limit', limit.toString());
      
      const response = await api.get(`/api/category?${params.toString()}`);
      
      // Check if the response has the expected structure
      if (response.data && response.data.success && response.data.data) {
        // Map the memes to the expected format
        const mappedMemes = response.data.data.memes.map((meme: any) => ({
          id: meme._id || meme.id,
          title: meme.title,
          description: meme.description || '',
          url: meme.imageUrl || meme.url,
          category: meme.category || 'Other',
          author: meme.username || meme.author || 'Unknown',
          authorId: meme.userId || meme.authorId || '',
          createdAt: meme.createdAt,
          likes: meme.likes || 0,
          commentCount: meme.commentCount || 0,
          comments: meme.comments || [],
          tags: meme.tags || [],
          isLiked: meme.isLiked || false,
          isSaved: meme.isSaved || false
        }));
        
        return {
          data: mappedMemes,
          pagination: response.data.data.pagination
        };
      }
      
      // Fallback to the original response if it doesn't match the expected structure
      return response.data;
    } catch (error) {
      console.error(`Error fetching memes for category ${category}:`, error);
      
      // Fall back to the regular API
      console.log("Falling back to regular API for category");
      return this.getMemes({
        category,
        sort: options?.sort,
        page: options?.page,
        limit: options?.limit
      });
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
      
      // Check if the response has the expected structure
      if (response.data && response.data.success && response.data.data) {
        return response.data.data;
      }
      
      // Return the data directly if it's already in the expected format
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
      
      // Check if the response has the expected structure
      if (response.data && response.data.success && response.data.data) {
        return response.data.data;
      }
      
      // Return the data directly if it's already in the expected format
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
      // Include credentials to ensure cookies are sent/received
      const response = await api.post<ApiResponse>('/api/auth/login', credentials, {
        withCredentials: true
      });
      
      if (!response.data.success) {
        throw new Error(response.data.error || "Login failed");
      }
      
      // Store in localStorage for client-side access
      // The HTTP-only cookie will be used for API requests
      if (response.data.data.token) {
        localStorage.setItem('token', response.data.data.token);
      }
      
      if (response.data.data.user) {
        localStorage.setItem('user', JSON.stringify(response.data.data.user));
        localStorage.setItem('wasLoggedIn', 'true');
      }
      
      return response.data.data;
    } catch (error: any) {
      console.error("Login error:", error);
      
      if (error.response?.data?.error) {
        throw new Error(error.response.data.error);
      } else if (error.response?.status === 401) {
        throw new Error("Invalid email or password");
      } else if (error.response?.status === 400) {
        throw new Error("Email and password are required");
      } else if (!error.response) {
        throw new Error("Network error. Please check your connection.");
      }
      
      throw new Error(error.message || "Login failed");
    }
  },
  
  register: async (userData: { username: string; email: string; password: string }) => {
    try {
      const response = await axios.post<ApiResponse>("/api/auth/register", userData, {
        withCredentials: true
      });
      
      if (!response.data.success) {
        throw new Error(response.data.error || "Registration failed");
      }
      
      // Store in localStorage for client-side access
      if (response.data.data.token) {
        localStorage.setItem('token', response.data.data.token);
      }
      
      if (response.data.data.user) {
        localStorage.setItem('user', JSON.stringify(response.data.data.user));
        localStorage.setItem('wasLoggedIn', 'true');
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
      const response = await api.get('/api/auth/me', {
        ...config,
        withCredentials: true
      });
      return response.data.user;
    } catch (error) {
      console.error("Error getting current user:", error);
      throw error;
    }
  },

  logout: async () => {
    try {
      // Call logout endpoint to clear cookies
      await api.post('/api/auth/logout', {}, { withCredentials: true });
      
      // Clear localStorage
      localStorage.removeItem('token');
      localStorage.removeItem('user');
      
      return true;
    } catch (error) {
      console.error("Logout error:", error);
      
      // Even if the API call fails, clear localStorage
      localStorage.removeItem('token');
      localStorage.removeItem('user');
      
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

/**
 * Meme Generation Service
 */
export const memeGenerationService = {
  /**
   * Get available meme templates
   */
  async getTemplates(): Promise<MemeTemplate[]> {
    try {
      const response = await fetch("https://api.imgflip.com/get_memes");
      const data = await response.json();
      
      if (!data.success || !data.data || !data.data.memes) {
        throw new Error("Failed to fetch meme templates");
      }
      
      // Validate and filter out templates without valid URLs
      const validTemplates = data.data.memes.filter((template: MemeTemplate) => 
        template && 
        template.url && 
        template.url.startsWith('http') &&
        template.id &&
        template.name
      );
      
      if (validTemplates.length === 0) {
        throw new Error("No valid templates found");
      }
      
      return validTemplates;
    } catch (error) {
      console.error("Error fetching templates:", error);
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
  
  /**
   * Generate a meme using a template
   */
  async generateMeme(input: GenerateMemeInput): Promise<GenerateMemeResponse> {
    try {
      if (!input.templateId) {
        throw new Error("Template ID is required");
      }
      
      const response = await fetch("/api/generate", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(input),
      });
      
      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || "Failed to generate meme");
      }
      
      const data = await response.json();
      
      if (!data.success || !data.data?.url) {
        throw new Error(data.message || "Failed to generate meme");
      }
      
      // Validate URL
      if (!data.data.url.startsWith('http')) {
        throw new Error("Invalid image URL received");
      }
      
      return {
        url: data.data.url,
        templateId: data.data.templateId,
        textElements: data.data.textElements
      };
    } catch (error) {
      console.error("Error generating meme:", error);
      throw error;
    }
  },
  
  /**
   * Save a generated meme
   */
  async saveMeme(meme: GenerateMemeResponse, title: string, category?: string): Promise<void> {
    try {
      if (!meme.url || !meme.url.startsWith('http')) {
        throw new Error("Invalid meme URL");
      }
      
      if (!title) {
        throw new Error("Title is required");
      }
      
      const response = await fetch("/api/memes", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          title,
          imageUrl: meme.url,
          type: "generated",
          templateId: meme.templateId,
          category: category || "Generated",
          textElements: meme.textElements
        }),
      });
      
      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || "Failed to save meme");
      }
      
      const data = await response.json();
      
      if (!data.success) {
        throw new Error(data.message || "Failed to save meme");
      }
      
      return data.data;
    } catch (error) {
      console.error("Error saving meme:", error);
      throw error;
    }
  }
}; 