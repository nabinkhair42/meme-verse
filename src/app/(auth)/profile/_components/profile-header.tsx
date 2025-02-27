"use client";

import { useState } from "react";
import { useDispatch } from "react-redux";
import { AppDispatch } from "@/redux/store";
import { updateProfile } from "@/redux/features/user/userSlice";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Skeleton } from "@/components/ui/skeleton";
import { Badge } from "@/components/ui/badge";
import { Settings, Check, X, Calendar, Heart, ImageIcon, MessageSquare } from "lucide-react";
import { toast } from "sonner";
import { userService } from "@/services/api";
import { motion, AnimatePresence } from "framer-motion";
import { cn } from "@/lib/utils";

interface ProfileData {
  username: string;
  bio: string;
  avatar: string;
}

interface ProfileHeaderProps {
  userId: string;
  profileData: ProfileData;
  isLoading: boolean;
  stats: {
    memesCount: number;
    likesCount: number;
    commentsCount: number;
  };
}

export function ProfileHeader({ userId, profileData, isLoading, stats }: ProfileHeaderProps) {
  const dispatch = useDispatch<AppDispatch>();
  const [isEditing, setIsEditing] = useState(false);
  const [editData, setEditData] = useState<ProfileData>(profileData);
  const [isSaving, setIsSaving] = useState(false);
  
  const handleEditProfile = () => {
    setEditData(profileData);
    setIsEditing(true);
  };
  
  const handleCancelEdit = () => {
    setIsEditing(false);
    setEditData(profileData);
  };
  
  const handleSaveProfile = async () => {
    if (!editData.username.trim()) {
      toast.error("Username is required");
      return;
    }
    
    setIsSaving(true);
    try {
      await userService.updateProfile(userId, editData);
      dispatch(updateProfile(editData));
      toast.success("Profile updated successfully!");
      setIsEditing(false);
    } catch (error) {
      console.error("Error updating profile:", error);
      toast.error("Failed to update profile");
    } finally {
      setIsSaving(false);
    }
  };
  
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setEditData(prev => ({
      ...prev,
      [name]: value
    }));
  };
  
  const renderSkeleton = () => (
    <div className="animate-pulse space-y-4">
      <div className="flex items-center gap-4">
        <Skeleton className="h-24 w-24 rounded-full" />
        <div className="space-y-2 flex-1">
          <Skeleton className="h-8 w-48" />
          <Skeleton className="h-4 w-32" />
        </div>
      </div>
      <Skeleton className="h-20 w-full" />
      <div className="flex gap-4">
        <Skeleton className="h-8 w-24" />
        <Skeleton className="h-8 w-24" />
        <Skeleton className="h-8 w-24" />
      </div>
    </div>
  );
  
  return (
    <Card className="border-border/40">
      <CardContent className="p-6">
        <AnimatePresence mode="wait">
          {isLoading ? (
            <motion.div
              key="skeleton"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
            >
              {renderSkeleton()}
            </motion.div>
          ) : isEditing ? (
            <motion.div
              key="edit-form"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              className="space-y-6"
            >
              <div className="flex items-start gap-6">
                <Avatar className="h-24 w-24 ring-2 ring-background">
                  <AvatarImage src={editData.avatar} />
                  <AvatarFallback className="bg-primary/10 text-primary text-xl">
                    {editData.username?.[0]?.toUpperCase() || 'U'}
                  </AvatarFallback>
                </Avatar>
                
                <div className="flex-1 space-y-4">
                  <div>
                    <Input
                      name="username"
                      value={editData.username}
                      onChange={handleInputChange}
                      placeholder="Username"
                      className="max-w-md font-medium text-lg"
                    />
                    <Input
                      name="avatar"
                      value={editData.avatar}
                      onChange={handleInputChange}
                      placeholder="Avatar URL"
                      className="max-w-md mt-2"
                    />
                  </div>
                  
                  <Textarea
                    name="bio"
                    value={editData.bio}
                    onChange={handleInputChange}
                    placeholder="Write something about yourself..."
                    className="resize-none h-24"
                  />
                  
                  <div className="flex gap-2">
                    <Button
                      onClick={handleSaveProfile}
                      disabled={isSaving}
                      className="transition-all"
                    >
                      {isSaving ? (
                        <>
                          <motion.div
                            className="mr-2 h-4 w-4"
                            animate={{ rotate: 360 }}
                            transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
                          >
                            ⭮
                          </motion.div>
                          Saving...
                        </>
                      ) : (
                        <>
                          <Check className="h-4 w-4 mr-2" />
                          Save Changes
                        </>
                      )}
                    </Button>
                    <Button
                      variant="outline"
                      onClick={handleCancelEdit}
                      disabled={isSaving}
                    >
                      <X className="h-4 w-4 mr-2" />
                      Cancel
                    </Button>
                  </div>
                </div>
              </div>
            </motion.div>
          ) : (
            <motion.div
              key="profile-view"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="space-y-6"
            >
              <div className="flex flex-col md:flex-row md:items-start gap-6">
                <motion.div
                  initial={{ scale: 0.9 }}
                  animate={{ scale: 1 }}
                  className="relative group"
                >
                  <Avatar className="h-24 w-24 ring-2 ring-background shadow-lg">
                    <AvatarImage src={profileData.avatar} />
                    <AvatarFallback className="bg-primary/10 text-primary text-xl">
                      {profileData.username?.[0]?.toUpperCase() || 'U'}
                    </AvatarFallback>
                  </Avatar>
                </motion.div>
                
                <div className="flex-1">
                  <div className="flex flex-col md:flex-row md:items-center gap-4 mb-4">
                    <div>
                      <h1 className="text-2xl font-bold">{profileData.username}</h1>
                      <p className="text-muted-foreground">@{profileData.username?.toLowerCase()}</p>
                    </div>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={handleEditProfile}
                      className="md:ml-auto group transition-colors hover:bg-primary/5"
                    >
                      <Settings className="h-4 w-4 mr-2 transition-transform group-hover:rotate-180" />
                      Edit Profile
                    </Button>
                  </div>
                  
                  <p className="text-muted-foreground mb-6">
                    {profileData.bio || "No bio yet."}
                  </p>
                  
                  <div className="flex flex-wrap gap-6">
                    <Badge variant="secondary" className="px-2 py-1 flex items-center gap-1">
                      <ImageIcon className="h-4 w-4" />
                      <span className="font-semibold">{stats.memesCount}</span> memes
                    </Badge>
                    <Badge variant="secondary" className="px-2 py-1 flex items-center gap-1">
                      <Heart className="h-4 w-4" />
                      <span className="font-semibold">{stats.likesCount}</span> likes
                    </Badge>
                    <Badge variant="secondary" className="px-2 py-1 flex items-center gap-1">
                      <MessageSquare className="h-4 w-4" />
                      <span className="font-semibold">{stats.commentsCount}</span> comments
                    </Badge>
                  </div>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </CardContent>
    </Card>
  );
} 