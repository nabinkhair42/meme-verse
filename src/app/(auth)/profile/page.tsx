"use client";
import { useState, useEffect } from "react";
import { useSelector } from "react-redux";
import { RootState } from "@/redux/store";
import { motion } from "framer-motion";
import { userService } from "@/services/api";
import { ProtectedRoute } from "@/components/auth/protected-route";
import { ProfileHeader } from "@/app/(auth)/profile/_components/profile-header";
import { ProfileTabs } from "@/app/(auth)/profile/_components/profile-tabs";
import { Meme } from "@/redux/features/memes/memesSlice";

export default function ProfilePage() {
  const { items } = useSelector((state: RootState) => state.memes);
  const { user } = useSelector((state: RootState) => state.auth);
  
  const [isLoading, setIsLoading] = useState(true);
  const [uploadedMemes, setUploadedMemes] = useState<Meme[]>([]);
  const [likedMemes, setLikedMemes] = useState<Meme[]>([]);
  const [savedMemes, setSavedMemes] = useState<Meme[]>([]);
  const [profileData, setProfileData] = useState({
    username: '',
    bio: '',
    avatar: ''
  });
  
  // Add state and data fetching for created memes
  const [createdMemes, setCreatedMemes] = useState<Meme[]>([]);
  const [isLoadingCreatedMemes, setIsLoadingCreatedMemes] = useState(true);
  
  useEffect(() => {
    const fetchUserData = async () => {
      setIsLoading(true);
      try {
        // Fetch the user's memes and saved memes
        if (user?.id) {
          const [userMemes, savedMemes] = await Promise.all([
            userService.getUserMemes(user.id),
            userService.getSavedMemes(user.id)
          ]);
          
          setUploadedMemes(userMemes);
          setSavedMemes(savedMemes);
          
          // Set profile data from user
          setProfileData({
            username: user.username || '',
            bio: user.bio || '',
            avatar: user.avatar || ''
          });
        }
      } catch (error) {
        console.error("Error fetching user data:", error);
        // Fallback to Redux store
        const userUploadedMemes = items.filter(meme => 
          meme.authorId === user?.id || meme.author === user?.username
        );
        setUploadedMemes(userUploadedMemes);
      } finally {
        setIsLoading(false);
      }
    };
    
    fetchUserData();
  }, [user, items]);
  
  // Fetch created memes
  useEffect(() => {
    const fetchCreatedMemes = async () => {
      try {
        setIsLoadingCreatedMemes(true);
        // Get only generated memes
        const memes = await userService.getUserMemes(user?.id || '');
        setCreatedMemes(memes);
      } catch (error) {
        console.error("Error fetching created memes:", error);
      } finally {
        setIsLoadingCreatedMemes(false);
      }
    };
    
    if (user) {
      fetchCreatedMemes();
    }
  }, [user]);
  
  const memesCount = uploadedMemes.length;
  const likesCount = uploadedMemes.reduce((sum, meme: any) => sum + (meme.likes || 0), 0);
  const commentsCount = uploadedMemes.reduce((sum, meme: any) => sum + (meme.comments?.length || 0), 0);
  
  return (
    <ProtectedRoute>
      <div className="py-8 md:py-12 max-w-7xl mx-auto px-4">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
        >
          <ProfileHeader 
            userId={user?.id || ''}
            profileData={profileData}
            isLoading={isLoading}
            stats={{ memesCount, likesCount, commentsCount }}
          />
          
          <ProfileTabs 
            uploadedMemes={uploadedMemes}
            savedMemes={savedMemes}
            createdMemes={createdMemes}
            isLoading={isLoading}
            isLoadingCreatedMemes={isLoadingCreatedMemes}
          />
        </motion.div>
      </div>
    </ProtectedRoute>
  );
} 