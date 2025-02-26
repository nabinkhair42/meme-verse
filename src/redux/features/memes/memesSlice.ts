import { createSlice, createAsyncThunk, PayloadAction } from "@reduxjs/toolkit";

// Define types
export interface Comment {
  id: string;
  text: string;
  author: string;
  createdAt: string;
}

export interface Meme {
  id: string;
  title: string;
  description?: string;
  imageUrl: string;
  category: string;
  tags?: string[];
  author: string;
  authorId?: string;
  userAvatar?: string;
  createdAt: string;
  updatedAt?: string;
  likes: number;
  commentCount: number;
  type?: 'generated' | 'uploaded';
  isGenerated?: boolean;
  isPublic?: boolean;
  templateId?: string | null;
  templateUrl?: string | null;
}

interface MemesState {
  items: Meme[];
  trending: Meme[];
  status: 'idle' | 'loading' | 'succeeded' | 'failed';
  error: string | null;
}

// Define category constants
export const CATEGORIES = [
  { value: "Trending", label: "Trending" },
  { value: "Programming", label: "Programming" },
  { value: "Reactions", label: "Reactions" },
  { value: "Wholesome", label: "Wholesome" },
  { value: "Animals", label: "Animals" },
  { value: "Sports", label: "Sports" },
  { value: "Movies", label: "Movies & TV" },
  { value: "Gaming", label: "Gaming" },
  { value: "Other", label: "Other" },
];

// Define meme templates for generator
export const MEME_TEMPLATES = [
  { id: "drake", name: "Drake Hotline Bling", url: "https://i.imgflip.com/30b1gx.jpg" },
  { id: "distracted", name: "Distracted Boyfriend", url: "https://i.imgflip.com/1ur9b0.jpg" },
  { id: "buttons", name: "Two Buttons", url: "https://i.imgflip.com/1g8my4.jpg" },
  { id: "change-mind", name: "Change My Mind", url: "https://i.imgflip.com/24y43o.jpg" },
  { id: "thinking", name: "Roll Safe Think About It", url: "https://i.imgflip.com/1h7in3.jpg" },
  { id: "disaster-girl", name: "Disaster Girl", url: "https://i.imgflip.com/23ls.jpg" },
  { id: "success-kid", name: "Success Kid", url: "https://i.imgflip.com/1bhk.jpg" },
  { id: "always-has-been", name: "Always Has Been", url: "https://i.imgflip.com/43a45p.jpg" },
];

// Sample memes for initial state
const initialMemes: Meme[] = [
  {
    id: "1",
    title: "When the code works on the first try",
    description: "That rare moment when everything just works",
    imageUrl: "https://i.imgflip.com/7ry9vh.jpg",
    category: "Programming",
    author: "CodeMaster",
    createdAt: "2023-01-15T09:24:00Z",
    likes: 543,
    commentCount: 0,
    tags: ["programming", "coding", "success"]
  },
  {
    id: "2",
    title: "Frontend vs Backend",
    description: "The eternal struggle between what users see and what actually happens",
    imageUrl: "https://i.imgflip.com/6yvpkj.jpg",
    category: "Programming",
    author: "FullStackDev",
    createdAt: "2023-01-18T14:35:00Z",
    likes: 921,
    commentCount: 0,
    tags: ["programming", "frontend", "backend"]
  },
  {
    id: "3",
    title: "When the cat knocks over your water",
    description: "Every cat owner knows this feeling",
    imageUrl: "https://i.imgflip.com/7q1sxg.jpg",
    category: "Animals",
    author: "CatLover",
    createdAt: "2023-01-20T08:12:00Z",
    likes: 782,
    commentCount: 0,
    tags: ["cats", "pets", "funny"]
  },
  {
    id: "4",
    title: "Monday morning feelings",
    description: "That moment when the alarm goes off",
    imageUrl: "https://i.imgflip.com/76j59w.jpg",
    category: "Reactions",
    author: "WeekendLover",
    createdAt: "2023-01-23T07:30:00Z",
    likes: 1032,
    commentCount: 0,
    tags: ["monday", "morning", "work"]
  },
  {
    id: "5",
    title: "Debugging be like",
    description: "When you've been staring at the same code for hours",
    imageUrl: "https://i.imgflip.com/7slwsi.jpg",
    category: "Programming",
    author: "BugFixer",
    createdAt: "2023-01-25T16:20:00Z",
    likes: 876,
    commentCount: 0,
    tags: ["programming", "debugging", "coding"]
  },
  {
    id: "6",
    title: "When someone uses light mode",
    description: "Dark mode users be like",
    imageUrl: "https://i.imgflip.com/6o7hks.jpg",
    category: "Programming",
    author: "DarkThemeFan",
    createdAt: "2023-01-28T20:15:00Z",
    likes: 654,
    commentCount: 0,
    tags: ["darkmode", "programming", "lightmode"]
  }
];

// Async thunks for API calls
export const fetchTrendingMemes = createAsyncThunk(
  'memes/fetchTrending',
  async (_, { rejectWithValue }) => {
    try {
      // In a real app, this would be an API call
      // For demo purposes, we'll just return some of our memes
      // Simulate API delay
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      // Sort by likes to get "trending" memes
      return initialMemes.sort((a, b) => b.likes - a.likes);
    } catch (error) {
      return rejectWithValue('Failed to fetch trending memes');
    }
  }
);

export const fetchMemesByCategory = createAsyncThunk(
  'memes/fetchByCategory',
  async (category: string, { rejectWithValue }) => {
    try {
      // Simulate API delay
      await new Promise(resolve => setTimeout(resolve, 800));
      
      if (category === 'all') {
        return initialMemes;
      }
      
      return initialMemes.filter(meme => 
        meme.category.toLowerCase() === category.toLowerCase()
      );
    } catch (error) {
      return rejectWithValue('Failed to fetch memes by category');
    }
  }
);

// Create the slice
const memesSlice = createSlice({
  name: 'memes',
  initialState: {
    items: [],
    trending: [],
    status: 'idle',
    error: null
  } as MemesState,
  reducers: {
    // Add a new meme
    addMeme: (state, action: PayloadAction<Meme>) => {
      state.items.unshift(action.payload);
    },
    
    // Like a meme
    likeMeme: (state, action: PayloadAction<string>) => {
      const meme = state.items.find(m => m.id === action.payload);
      if (meme) {
        meme.likes += 1;
      }
    },
    
    // Unlike a meme
    unlikeMeme: (state, action: PayloadAction<string>) => {
      const meme = state.items.find(m => m.id === action.payload);
      if (meme && meme.likes > 0) {
        meme.likes -= 1;
      }
    },
    
    // Add a comment to a meme
    addComment: (state, action: PayloadAction<{ memeId: string, comment: Comment }>) => {
      const { memeId, comment } = action.payload;
      const meme = state.items.find(m => m.id === memeId);
      if (meme) {
        meme.commentCount += 1;
      }
    }
  },
  extraReducers: (builder) => {
    builder
      // Handle fetchTrendingMemes
      .addCase(fetchTrendingMemes.pending, (state) => {
        state.status = 'loading';
      })
      .addCase(fetchTrendingMemes.fulfilled, (state, action) => {
        state.status = 'succeeded';
        state.trending = action.payload;
      })
      .addCase(fetchTrendingMemes.rejected, (state, action) => {
        state.status = 'failed';
        state.error = action.payload as string;
      })
      
      // Handle fetchMemesByCategory
      .addCase(fetchMemesByCategory.pending, (state) => {
        state.status = 'loading';
      })
      .addCase(fetchMemesByCategory.fulfilled, (state, action) => {
        state.status = 'succeeded';
        state.items = action.payload;
      })
      .addCase(fetchMemesByCategory.rejected, (state, action) => {
        state.status = 'failed';
        state.error = action.payload as string;
      });
  }
});

export const { addMeme, likeMeme, unlikeMeme, addComment } = memesSlice.actions;
export default memesSlice.reducer; 