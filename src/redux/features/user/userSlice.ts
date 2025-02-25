import { createSlice, PayloadAction } from "@reduxjs/toolkit";
import { createAsyncThunk } from "@reduxjs/toolkit";
import { userService } from "@/services/api";

interface UserProfile {
  username: string;
  bio: string;
  avatar: string;
  joinDate: string;
}

interface UserState {
  profile: UserProfile;
  likedMemes: string[];
  savedMemes: string[];
  uploadedMemes: string[];
  generatedMemes: string[];
  status: 'idle' | 'loading' | 'succeeded' | 'failed';
  error: string | null;
}

const initialState: UserState = {
  profile: {
    username: 'MemeCreator123',
    bio: 'Meme enthusiast and creator. I make memes about programming, cats, and everything in between.',
    avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=user123',
    joinDate: '2023-01-15T00:00:00Z'
  },
  likedMemes: ['1', '3', '5'],
  savedMemes: ['2', '4'],
  uploadedMemes: ['5', '6'],
  generatedMemes: [],
  status: 'idle',
  error: null
};

const userSlice = createSlice({
  name: 'user',
  initialState,
  reducers: {
    toggleLikeMeme: (state, action: PayloadAction<string>) => {
      const memeId = action.payload;
      const index = state.likedMemes.indexOf(memeId);
      
      if (index === -1) {
        state.likedMemes.push(memeId);
      } else {
        state.likedMemes.splice(index, 1);
      }
    },
    toggleSaveMeme: (state, action: PayloadAction<string>) => {
      const memeId = action.payload;
      const index = state.savedMemes.indexOf(memeId);
      
      if (index === -1) {
        state.savedMemes.push(memeId);
      } else {
        state.savedMemes.splice(index, 1);
      }
    },
    addUploadedMeme: (state, action: PayloadAction<string>) => {
      state.uploadedMemes.push(action.payload);
    },
    addGeneratedMeme: (state, action: PayloadAction<string>) => {
      state.generatedMemes.push(action.payload);
    },
    updateProfile: (state, action: PayloadAction<Partial<UserProfile>>) => {
      state.profile = { ...state.profile, ...action.payload };
    }
  },
  extraReducers: (builder) => {
    builder
      .addCase(fetchUserProfile.pending, (state) => {
        state.status = 'loading';
      })
      .addCase(fetchUserProfile.fulfilled, (state, action) => {
        state.status = 'succeeded';
        state.profile = action.payload;
      })
      .addCase(fetchUserProfile.rejected, (state, action) => {
        state.status = 'failed';
        state.error = action.payload as string;
      });
  }
});

export const { 
  toggleLikeMeme, 
  toggleSaveMeme, 
  addUploadedMeme, 
  addGeneratedMeme,
  updateProfile 
} = userSlice.actions;

export const fetchUserProfile = createAsyncThunk(
  'user/fetchProfile',
  async (userId: string, { rejectWithValue }) => {
    try {
      const response = await userService.getProfile(userId);
      return response;
    } catch (error) {
      return rejectWithValue('Failed to fetch user profile');
    }
  }
);

export default userSlice.reducer; 