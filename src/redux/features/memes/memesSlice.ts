import { createSlice, createAsyncThunk, PayloadAction } from "@reduxjs/toolkit";
import { v4 as uuidv4 } from "uuid";

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
  url: string;
  category: string;
  author: string;
  authorId?: string;
  createdAt: string;
  likes: number;
  comments: Comment[];
  tags?: string[];
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
    url: "https://i.imgflip.com/7ry9vh.jpg",
    category: "Programming",
    author: "CodeMaster",
    createdAt: "2023-01-15T09:24:00Z",
    likes: 543,
    comments: [
      { id: "c1", text: "This never happens to me 😂", author: "BugHunter", createdAt: "2023-01-15T10:30:00Z" },
      { id: "c2", text: "Must be nice!", author: "JavaScripter", createdAt: "2023-01-15T11:15:00Z" }
    ],
    tags: ["programming", "coding", "success"]
  },
  {
    id: "2",
    title: "Frontend vs Backend",
    description: "The eternal struggle between what users see and what actually happens",
    url: "https://i.imgflip.com/6yvpkj.jpg",
    category: "Programming",
    author: "FullStackDev",
    createdAt: "2023-01-18T14:35:00Z",
    likes: 921,
    comments: [
      { id: "c3", text: "As a backend dev, I feel attacked 😅", author: "ServerSide", createdAt: "2023-01-18T15:42:00Z" }
    ],
    tags: ["programming", "frontend", "backend"]
  },
  {
    id: "3",
    title: "When the cat knocks over your water",
    description: "Every cat owner knows this feeling",
    url: "https://i.imgflip.com/7q1sxg.jpg",
    category: "Animals",
    author: "CatLover",
    createdAt: "2023-01-20T08:12:00Z",
    likes: 782,
    comments: [
      { id: "c4", text: "My cat does this every morning!", author: "PetOwner", createdAt: "2023-01-20T09:05:00Z" },
      { id: "c5", text: "That's why I use closed bottles now", author: "LessonLearned", createdAt: "2023-01-20T10:30:00Z" }
    ],
    tags: ["cats", "pets", "funny"]
  },
  {
    id: "4",
    title: "Monday morning feelings",
    description: "That moment when the alarm goes off",
    url: "https://i.imgflip.com/76j59w.jpg",
    category: "Reactions",
    author: "WeekendLover",
    createdAt: "2023-01-23T07:30:00Z",
    likes: 1032,
    comments: [
      { id: "c6", text: "Me every single Monday 😭", author: "SleepyHead", createdAt: "2023-01-23T08:15:00Z" }
    ],
    tags: ["monday", "morning", "work"]
  },
  {
    id: "5",
    title: "Debugging be like",
    description: "When you've been staring at the same code for hours",
    url: "https://i.imgflip.com/7slwsi.jpg",
    category: "Programming",
    author: "BugFixer",
    createdAt: "2023-01-25T16:20:00Z",
    likes: 876,
    comments: [
      { id: "c7", text: "And then it's just a missing semicolon", author: "SyntaxError", createdAt: "2023-01-25T17:00:00Z" },
      { id: "c8", text: "Story of my life", author: "DevLife", createdAt: "2023-01-25T18:12:00Z" }
    ],
    tags: ["programming", "debugging", "coding"]
  },
  {
    id: "6",
    title: "When someone uses light mode",
    description: "Dark mode users be like",
    url: "https://i.imgflip.com/6o7hks.jpg",
    category: "Programming",
    author: "DarkThemeFan",
    createdAt: "2023-01-28T20:15:00Z",
    likes: 654,
    comments: [
      { id: "c9", text: "My eyes!!!", author: "NightOwl", createdAt: "2023-01-28T21:05:00Z" }
    ],
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
        meme.comments.push(comment);
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