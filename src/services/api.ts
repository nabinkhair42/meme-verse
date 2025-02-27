import { ApiResponse } from "@/lib/apiResponse";
import axios from "axios";
import { toast } from "sonner";
import { 
  GenerateMemeInput, 
  GenerateMemeResponse, 
  Meme,
  MemeTemplate,
  Comment 
} from "@/types/meme";
import { PaginatedResponse } from "@/types/api";
import { TextElement } from "@/types/template";
import { User } from "@/types";
import { 
  IMGBB_API_KEY, 
  AUTH_ROUTES,
  FEED_ROUTES,
  MEME_ROUTES,
  USER_ROUTES,
  LEADERBOARD_ROUTES,
  EXTERNAL_ROUTES
} from "./routes";
import api from "./axios";

// Define fallback templates outside the function to avoid recreation
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

// Imgflip API services
export const imgflipService = {
  // Get popular meme templates
  getTemplates: async (): Promise<any[]> => {
    try {
      console.log("Fetching templates from API...");
      
      try {
        const response = await api.get(MEME_ROUTES.TEMPLATES);
        
        if (!response.data || !response.data.templates || !Array.isArray(response.data.templates)) {
          console.error("Invalid response format:", response.data);
          return fallbackTemplates;
        }
        
        // Validate templates
        const templates = response.data.templates;
        const validTemplates = templates.filter((template: any) => {
          return template && typeof template === 'object' && template.id && template.imageUrl;
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
      const response = await api.post(MEME_ROUTES.GENERATE, { 
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
      const response = await api.get(FEED_ROUTES.TRENDING, {
        params: { page, limit, period }
      });
      
      if (response.data && response.data.success && response.data.data) {
        return {
          data: response.data.data.memes,
          pagination: response.data.data.pagination
        };
      }
      
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

      const response = await axios.post(EXTERNAL_ROUTES.IMGBB_UPLOAD, formData);
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
  getMemes: async ({ 
    page = 1, 
    limit = 10, 
    category = "", 
    sort = "latest",
  } = {}): Promise<PaginatedResponse<Meme>> => {
    try {
      const response = await api.get(FEED_ROUTES.BASE, {
        params: { page, limit, category, sort }
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
      const response = await api.get(MEME_ROUTES.BY_ID(id));
      
      if (!response.data.success) {
        throw new Error(response.data.error || "Failed to fetch meme");
      }

      return response.data.data;
    } catch (error) {
      console.error(`Error fetching meme ${id}:`, error);
      throw error;
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
      
      const response = await api.post(MEME_ROUTES.BASE, memeWithCategory);
      
      if (!response.data || !response.data.id) {
        console.error("Invalid response from create meme API:", response.data);
        throw new Error("Invalid response from server");
      }
      
      console.log("Meme created successfully:", response.data);
      return response.data;
    } catch (error) {
      console.error("Error creating meme:", error);
    
      throw error;
    }
  },

  // Like a meme
  likeMeme: async (memeId: string): Promise<{ liked: boolean; likes: number }> => {
    try {
      const response = await api.post<ApiResponse>(MEME_ROUTES.LIKE(memeId));
      
      if (!response.data.success) {
        throw new Error(response.data.error || "Failed to update like status");
      }
      
      return response.data.data;
    } catch (error) {
      console.error("Error liking meme:", error);
      throw error;
    }
  },

  // Check like status
  checkLikeStatus: async (memeId: string): Promise<{ liked: boolean }> => {
    try {
      const response = await api.get<ApiResponse>(MEME_ROUTES.LIKE(memeId));
      
      if (!response.data.success) {
        throw new Error(response.data.error || "Failed to check like status");
      }
      
      return response.data.data;
    } catch (error) {
      console.error("Error checking like status:", error);
      return { liked: false };
    }
  },

  // Save a meme
  saveMeme: async (memeId: string): Promise<{ saved: boolean }> => {
    try {
      const response = await api.post<ApiResponse>(MEME_ROUTES.SAVE(memeId));
      
      if (!response.data.success) {
        throw new Error(response.data.error || "Failed to update save status");
      }
      
      return response.data.data;
    } catch (error) {
      console.error("Error saving meme:", error);
      throw error;
    }
  },

  // Check save status
  checkSaveStatus: async (memeId: string): Promise<{ saved: boolean }> => {
    try {
      const response = await api.get<ApiResponse>(MEME_ROUTES.SAVE(memeId));
      
      if (!response.data.success) {
        throw new Error(response.data.error || "Failed to check save status");
      }
      
      return response.data.data;
    } catch (error) {
      console.error("Error checking save status:", error);
      return { saved: false };
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
      
      if (!response.data.success) {
        throw new Error(response.data.error || "Failed to fetch comments");
      }

      // Process comments to ensure consistent format
      const comments = (Array.isArray(response.data.data.comments) 
        ? response.data.data.comments 
        : Array.isArray(response.data.data) 
          ? response.data.data 
          : []
      ).map((comment: any) => ({
        _id: comment._id || comment.id || `comment-${Date.now()}`,
        id: comment.id || comment._id || `comment-${Date.now()}`,
        memeId: comment.memeId || id,
        userId: comment.userId || 'anonymous',
        username: comment.username || comment.author || 'Anonymous',
        author: comment.author || comment.username || 'Anonymous',
        userAvatar: comment.userAvatar || '',
        content: comment.content || comment.text || '',
        text: comment.text || comment.content || '',
        createdAt: comment.createdAt || new Date().toISOString(),
        updatedAt: comment.updatedAt || comment.createdAt || new Date().toISOString()
      }));

      const pagination = response.data.data.pagination || {
        page: 1,
        totalPages: 1,
        total: comments.length,
        limit
      };

      return {
        comments,
        pagination
      };
    } catch (error) {
      console.error(`Error fetching comments for meme ${id}:`, error);
      return { 
        comments: [],
        pagination: {
          page: 1,
          totalPages: 1,
          total: 0,
          limit
        }
      };
    }
  },
  
  // Add a comment to a meme
  addComment: async (id: string, text: string): Promise<Comment> => {
    try {
      const response = await api.post(`/api/memes/${id}/comments`, { text });
      
      if (!response.data.success) {
        throw new Error(response.data.error || "Failed to add comment");
      }

      const comment = response.data.data;
      return {
        _id: comment._id || comment.id || `comment-${Date.now()}`,
        id: comment.id || comment._id || `comment-${Date.now()}`,
        memeId: comment.memeId || id,
        userId: comment.userId || 'anonymous',
        username: comment.username || comment.author || 'Anonymous',
        author: comment.author || comment.username || 'Anonymous',
        userAvatar: comment.userAvatar || '',
        content: comment.content || text || '',
        text: comment.text || text || '',
        createdAt: comment.createdAt || new Date().toISOString(),
        updatedAt: comment.updatedAt || new Date().toISOString()
      };
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
      const response = await api.get(MEME_ROUTES.USER_GENERATED, {
        params: { generated: onlyGenerated }
      });
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
      const response = await api.post(MEME_ROUTES.USER_GENERATED, memeData);
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
      const response = await api.get(FEED_ROUTES.TRENDING, {
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
      const response = await api.get(FEED_ROUTES.SEARCH, { params: options });
      return response.data;
    } catch (error) {
      console.error("Error searching memes:", error);
      return this.getMemes(options);
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
      const response = await api.get(FEED_ROUTES.CATEGORY, { 
        params: { ...options, category } 
      });
      return response.data;
    } catch (error) {
      console.error(`Error fetching memes for category ${category}:`, error);
      return this.getMemes({ ...options, category });
    }
  },
};

export const userService = {
  // Get user profile
  getProfile: async (userId: string) => {
    try {
      const response = await api.get(USER_ROUTES.BY_ID(userId));
      return response.data;
    } catch (error) {
      console.error(`Error fetching user profile ${userId}:`, error);
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
      const response = await api.patch(USER_ROUTES.BY_ID(userId), profileData);
      return response.data;
    } catch (error) {
      console.error(`Error updating user profile ${userId}:`, error);
      throw error;
    }
  },

  // Get user's memes
  getUserMemes: async (userId: string) => {
    try {
      const response = await api.get(USER_ROUTES.MEMES(userId));
      return response.data;
    } catch (error) {
      console.error(`Error fetching memes for user ${userId}:`, error);
      throw error;
    }
  },

  // Get saved memes for a user
  getSavedMemes: async (userId: string) => {
    try {
      const response = await api.get(USER_ROUTES.SAVED(userId));
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
      const response = await api.get(LEADERBOARD_ROUTES.MEMES, {
        params: { period }
      });
      return response.data.success ? response.data.data : response.data;
    } catch (error) {
      console.error(`Error fetching top memes:`, error);
      throw error;
    }
  },

  // Get top users
  getTopUsers: async (period: string = "all-time") => {
    try {
      const response = await api.get(LEADERBOARD_ROUTES.USERS, {
        params: { period }
      });
      return response.data.success ? response.data.data : response.data;
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
      const timestamp = new Date().getTime();
      const response = await api.get<ApiResponse>(`${AUTH_ROUTES.VALIDATE}?t=${timestamp}`);
      
      if (!response.data.success) {
        localStorage.removeItem('token');
        localStorage.removeItem('user');
        throw new Error(response.data.error || "Invalid token");
      }
      
      return response.data.data.user;
    } catch (error) {
      console.error("Error validating token:", error);
      localStorage.removeItem('token');
      localStorage.removeItem('user');
      throw error;
    }
  },
  
  login: async (credentials: { email: string; password: string }): Promise<{ token: string; user: User }> => {
    try {
      const response = await api.post<ApiResponse>(AUTH_ROUTES.LOGIN, credentials, {
        withCredentials: true
      });
      
      if (!response.data.success) {
        throw new Error(response.data.error || "Login failed");
      }
      
      if (response.data.data.token) {
        localStorage.setItem('token', response.data.data.token);
      }
      
      if (response.data.data.user) {
        localStorage.setItem('user', JSON.stringify(response.data.data.user));
      }
      
      return response.data.data;
    } catch (error: any) {
      console.error("Login error:", error);
      throw error;
    }
  },
  
  register: async (userData: { username: string; email: string; password: string }) => {
    try {
      const response = await api.post<ApiResponse>(AUTH_ROUTES.REGISTER, userData, {
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
      const response = await api.get(AUTH_ROUTES.ME, {
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
      await api.post(AUTH_ROUTES.LOGOUT, {}, { withCredentials: true });
      localStorage.removeItem('token');
      localStorage.removeItem('user');
      return true;
    } catch (error) {
      console.error("Logout error:", error);
      localStorage.removeItem('token');
      localStorage.removeItem('user');
      return false;
    }
  }
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