import { createSlice, createAsyncThunk, PayloadAction } from "@reduxjs/toolkit";
import {Meme} from "@/types/meme"
// Define types
export interface Comment {
  id: string;
  text: string;
  author: string;
  createdAt: string;
}

// Extended Meme interface to handle both _id and id properties
export interface Meme extends MemeType {
  id?: string; // Add id property for compatibility with components
  author?: string; // Add author property for compatibility with components
  authorId?: string; // Add authorId property for compatibility with components
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
    _id: "1",
    id: "1", // Add id for compatibility
    title: "When the code works on the first try",
    description: "That rare moment when everything just works",
    imageUrl: "https://i.imgflip.com/7ry9vh.jpg",
    category: ["Programming"],
    createdAt: "2023-01-15T09:24:00Z",
    likes: 543,
    commentCount: 0,
    tags: ["programming", "coding", "success"],
    userId: "",
    username: "",
    author: "Anonymous", // Add author for compatibility
    updatedAt: "",
    type: "generated"
  },
  {
    _id: "2",
    id: "2", // Add id for compatibility
    title: "Frontend vs Backend",
    description: "The eternal struggle between what users see and what actually happens",
    imageUrl: "https://i.imgflip.com/6yvpkj.jpg",
    category: ["Programming"],
    createdAt: "2023-01-18T14:35:00Z",
    likes: 921,
    commentCount: 0,
    tags: ["programming", "frontend", "backend"],
    userId: "",
    username: "",
    author: "Anonymous", // Add author for compatibility
    updatedAt: "",
    type: "generated"
  },
  {
    _id: "3",
    id: "3", // Add id for compatibility
    title: "When the cat knocks over your water",
    description: "Every cat owner knows this feeling",
    imageUrl: "https://i.imgflip.com/7q1sxg.jpg",
    category: ["Reactions"],
    createdAt: "2023-01-20T08:12:00Z",
    likes: 782,
    commentCount: 0,
    tags: ["cats", "pets", "funny"],
    userId: "",
    username: "",
    author: "Anonymous", // Add author for compatibility
    updatedAt: "",
    type: "generated"
  },
  {
    _id: "4",
    id: "4", // Add id for compatibility
    title: "Monday morning feelings",
    description: "That moment when the alarm goes off",
    imageUrl: "https://i.imgflip.com/76j59w.jpg",
    category: ["Reactions"],
    createdAt: "2023-01-23T07:30:00Z",
    likes: 1032,
    commentCount: 0,
    tags: ["monday", "morning", "work"],
    userId: "",
    username: "",
    author: "Anonymous", // Add author for compatibility
    updatedAt: "",
    type: "generated"
  },
  {
    _id: "5",
    id: "5", // Add id for compatibility
    title: "Debugging be like",
    description: "When you've been staring at the same code for hours",
    imageUrl: "https://i.imgflip.com/7slwsi.jpg",
    category: ["Programming"],
    createdAt: "2023-01-25T16:20:00Z",
    likes: 876,
    commentCount: 0,
    tags: ["programming", "debugging", "coding"],
    userId: "",
    username: "",
    author: "Anonymous", // Add author for compatibility
    updatedAt: "",
    type: "generated"
  },
  {
    _id: "6",
    id: "6", // Add id for compatibility
    title: "When someone uses light mode",
    description: "Dark mode users be like",
    imageUrl: "https://i.imgflip.com/6o7hks.jpg",
    category: ["Programming"],
    createdAt: "2023-01-28T20:15:00Z",
    likes: 654,
    commentCount: 0,
    tags: ["darkmode", "programming", "lightmode"],
    userId: "",
    username: "",
    author: "Anonymous", // Add author for compatibility
    updatedAt: "",
    type: "generated"
  }
];

// Async thunks for API calls

// Create the slice
const memesSlice = createSlice({
  name: 'memes',
  initialState: {
    items: initialMemes, // Use initialMemes to populate the initial state
    trending: [],
    status: 'idle',
    error: null
  } as MemesState,
  reducers: {
    // Add a new meme
    addMeme: (state, action: PayloadAction<Meme>) => {
      // Ensure both id and _id are set for compatibility
      const meme = action.payload;
      if (meme._id && !meme.id) meme.id = meme._id;
      if (meme.id && !meme._id) meme._id = meme.id;
      if (meme.username && !meme.author) meme.author = meme.username;
      if (meme.author && !meme.username) meme.username = meme.author;
      
      state.items.unshift(meme);
    },
    
    // Like a meme
    likeMeme: (state, action: PayloadAction<string>) => {
      const memeId = action.payload;
      const meme = state.items.find(m => m._id === memeId || m.id === memeId);
      if (meme) {
        meme.likes += 1;
      }
    },
    
    // Unlike a meme
    unlikeMeme: (state, action: PayloadAction<string>) => {
      const memeId = action.payload;
      const meme = state.items.find(m => m._id === memeId || m.id === memeId);
      if (meme && meme.likes > 0) {
        meme.likes -= 1;
      }
    },
    
    // Add a comment to a meme
    addComment: (state, action: PayloadAction<{ memeId: string, comment: Comment }>) => {
      const { memeId, comment } = action.payload;
      const meme = state.items.find(m => m._id === memeId || m.id === memeId);
      if (meme) {
        meme.commentCount += 1;
      }
    }
  },
});

export const { addMeme, likeMeme, unlikeMeme, addComment } = memesSlice.actions;
export default memesSlice.reducer;