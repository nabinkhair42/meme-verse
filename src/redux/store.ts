import { configureStore } from "@reduxjs/toolkit";
import memesReducer from "./features/memes/memesSlice";
import userReducer from "./features/user/userSlice";
import authReducer from "./features/auth/authSlice";

export const store = configureStore({
  reducer: {
    memes: memesReducer,
    user: userReducer,
    auth: authReducer,
  },
  devTools: process.env.NODE_ENV !== 'production',
});

export type RootState = ReturnType<typeof store.getState>;
export type AppDispatch = typeof store.dispatch; 

