import axios from "axios";
import { handleApiError } from "@/lib/api-utils";

const IMGFLIP_API_URL = "https://api.imgflip.com";
const IMGBB_API_URL = "https://api.imgbb.com/1";
const IMGBB_API_KEY = process.env.NEXT_PUBLIC_IMGBB_API_KEY;

// Imgflip API services
export const imgflipService = {
  // Get popular meme templates
  getTemplates: async () => {
    try {
      const response = await axios.get(`${IMGFLIP_API_URL}/get_memes`);
      return response.data.data.memes;
    } catch (error) {
      console.error("Error fetching meme templates:", error);
      throw error;
    }
  },

  // Create a meme with the Imgflip API
  createMeme: async (templateId: string, text0: string, text1: string) => {
    try {
      // In a real application, you would make a POST request to the Imgflip API
      // For demo purposes, we'll just return a mock response
      const mockResponse = {
        success: true,
        data: {
          url: `https://i.imgflip.com/${Math.random().toString(36).substring(7)}.jpg`,
        },
      };
      return mockResponse;
    } catch (error) {
      console.error("Error creating meme:", error);
      throw error;
    }
  },

  // Get trending memes
  getTrendingMemes: async () => {
    try {
      // First try to get from API
      const response = await axios.get('/api/memes?sort=likes&limit=10');
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
  uploadImage: async (file: File) => {
    try {
      const formData = new FormData();
      formData.append("image", file);
      formData.append("key", IMGBB_API_KEY || "");

      const response = await axios.post(`${IMGBB_API_URL}/upload`, formData);
      return response.data.data;
    } catch (error) {
      console.error("Error uploading image:", error);
      throw error;
    }
  },
};

// Internal API services for our MongoDB backend
export const memeService = {
  // Get memes with filters
  getMemes: async (params: {
    category?: string;
    search?: string;
    sort?: string;
    page?: number;
    limit?: number;
  }) => {
    try {
      const queryParams = new URLSearchParams();
      if (params.category) queryParams.append("category", params.category);
      if (params.search) queryParams.append("search", params.search);
      if (params.sort) queryParams.append("sort", params.sort);
      if (params.page) queryParams.append("page", params.page.toString());
      if (params.limit) queryParams.append("limit", params.limit.toString());

      const response = await axios.get(`/api/memes?${queryParams.toString()}`);
      return response.data;
    } catch (error) {
      return handleApiError(error, {
        memes: [],
        pagination: { total: 0, page: 1, limit: 10, totalPages: 1 }
      });
    }
  },

  // Get a single meme by ID
  getMemeById: async (id: string) => {
    try {
      const response = await axios.get(`/api/memes/${id}`);
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
  createMeme: async (memeData: any) => {
    try {
      const response = await axios.post("/api/memes", memeData);
      return response.data;
    } catch (error) {
      console.error("Error creating meme:", error);
      throw error;
    }
  },

  // Like a meme
  likeMeme: async (id: string) => {
    try {
      const response = await axios.post(`/api/memes/${id}/like`);
      return response.data;
    } catch (error) {
      console.error(`Error liking meme ${id}:`, error);
      handleApiError(error, null);
      // Rethrow to handle in component
      throw error;
    }
  },

  // Add a comment to a meme
  addComment: async (id: string, commentData: { text: string; author: string }) => {
    try {
      const response = await axios.post(`/api/memes/${id}/comments`, commentData);
      return response.data;
    } catch (error) {
      console.error(`Error adding comment to meme ${id}:`, error);
      throw error;
    }
  },

  // Check if user has liked a meme
  checkLikeStatus: async (id: string) => {
    try {
      const response = await axios.get(`/api/memes/${id}/like`);
      return response.data.liked;
    } catch (error) {
      console.error(`Error checking like status for meme ${id}:`, error);
      return false;
    }
  },

  // Toggle like on a meme
  toggleLike: async (id: string) => {
    try {
      const response = await axios.post(`/api/memes/${id}/like`);
      return response.data;
    } catch (error) {
      console.error(`Error toggling like for meme ${id}:`, error);
      throw error;
    }
  },

  // Check if user has saved a meme
  checkSaveStatus: async (id: string) => {
    try {
      const response = await axios.get(`/api/memes/${id}/save`);
      return response.data.saved;
    } catch (error) {
      console.error(`Error checking save status for meme ${id}:`, error);
      return false;
    }
  },

  // Toggle save on a meme
  toggleSave: async (id: string) => {
    try {
      const response = await axios.post(`/api/memes/${id}/save`);
      return response.data;
    } catch (error) {
      console.error(`Error toggling save for meme ${id}:`, error);
      throw error;
    }
  },

  // Get comments for a meme
  getComments: async (id: string) => {
    try {
      const response = await axios.get(`/api/memes/${id}/comments`);
      return response.data;
    } catch (error) {
      console.error(`Error fetching comments for meme ${id}:`, error);
      return [];
    }
  },

  // Add a comment to a meme
  addComment: async (id: string, text: string) => {
    try {
      const response = await axios.post(`/api/memes/${id}/comments`, { text });
      return response.data;
    } catch (error) {
      console.error(`Error adding comment to meme ${id}:`, error);
      throw error;
    }
  },
};

export const userService = {
  // Get user profile
  getProfile: async (userId: string) => {
    try {
      const response = await axios.get(`/api/users/${userId}`);
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
      const response = await axios.patch(`/api/users/${userId}`, profileData);
      return response.data;
    } catch (error) {
      console.error(`Error updating user profile ${userId}:`, error);
      throw error;
    }
  },

  // Get user's memes
  getUserMemes: async (userId: string) => {
    try {
      const response = await axios.get(`/api/users/${userId}/memes`);
      return response.data;
    } catch (error) {
      console.error(`Error fetching memes for user ${userId}:`, error);
      throw error;
    }
  },

  // Get saved memes for a user
  getSavedMemes: async (userId: string) => {
    try {
      const response = await axios.get(`/api/users/${userId}/saved`);
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
      const response = await axios.get(`/api/leaderboard/memes?period=${period}`);
      return response.data;
    } catch (error) {
      console.error(`Error fetching top memes:`, error);
      throw error;
    }
  },

  // Get top users
  getTopUsers: async (period: string = "all-time") => {
    try {
      const response = await axios.get(`/api/leaderboard/users?period=${period}`);
      return response.data;
    } catch (error) {
      console.error(`Error fetching top users:`, error);
      throw error;
    }
  },
}; 