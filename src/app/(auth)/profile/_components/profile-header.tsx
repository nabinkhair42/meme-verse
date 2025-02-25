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
import { Settings, Check, X } from "lucide-react";
import { toast } from "sonner";
import { userService } from "@/services/api";

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
  
  const handleEditProfile = () => {
    setEditData(profileData);
    setIsEditing(true);
  };
  
  const handleCancelEdit = () => {
    setIsEditing(false);
    setEditData(profileData);
  };
  
  const handleSaveProfile = async () => {
    try {
      await userService.updateProfile(userId, editData);
      dispatch(updateProfile(editData));
      toast.success("Profile updated successfully!");
      setIsEditing(false);
    } catch (error) {
      console.error("Error updating profile:", error);
      toast.error("Failed to update profile");
    }
  };
  
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setEditData(prev => ({
      ...prev,
      [name]: value
    }));
  };
  
  return (
    <Card className="mb-8">
      <CardContent className="pt-6">
        <div className="flex flex-col md:flex-row items-center md:items-start gap-6">
          {isLoading ? (
            <Skeleton className="h-24 w-24 rounded-full" />
          ) : (
            <Avatar className="h-24 w-24 border-4 border-background">
              <AvatarImage src={profileData.avatar} />
              <AvatarFallback>{profileData.username?.[0]?.toUpperCase() || 'U'}</AvatarFallback>
            </Avatar>
          )}
          
          <div className="flex-1 text-center md:text-left">
            {isLoading ? (
              <div className="space-y-3">
                <Skeleton className="h-8 w-48 mx-auto md:mx-0" />
                <Skeleton className="h-4 w-32 mx-auto md:mx-0" />
                <Skeleton className="h-4 w-64 mx-auto md:mx-0" />
              </div>
            ) : isEditing ? (
              <div className="space-y-4">
                <div>
                  <label className="text-sm font-medium mb-1 block">Username</label>
                  <Input 
                    name="username"
                    value={editData.username}
                    onChange={handleInputChange}
                    className="max-w-md"
                  />
                </div>
                
                <div>
                  <label className="text-sm font-medium mb-1 block">Bio</label>
                  <Textarea 
                    name="bio"
                    value={editData.bio}
                    onChange={handleInputChange}
                    className="max-w-md"
                    rows={3}
                  />
                </div>
                
                <div>
                  <label className="text-sm font-medium mb-1 block">Avatar URL</label>
                  <Input 
                    name="avatar"
                    value={editData.avatar}
                    onChange={handleInputChange}
                    className="max-w-md"
                    placeholder="https://example.com/avatar.jpg"
                  />
                </div>
                
                <div className="flex gap-2">
                  <Button onClick={handleSaveProfile} className="flex items-center gap-1">
                    <Check className="h-4 w-4" />
                    Save Changes
                  </Button>
                  <Button variant="outline" onClick={handleCancelEdit} className="flex items-center gap-1">
                    <X className="h-4 w-4" />
                    Cancel
                  </Button>
                </div>
              </div>
            ) : (
              <>
                <div className="flex flex-col md:flex-row md:justify-between md:items-center gap-4">
                  <div>
                    <h1 className="text-2xl font-bold">{profileData.username}</h1>
                    <p className="text-muted-foreground">@{profileData.username?.toLowerCase()}</p>
                  </div>
                  <Button variant="outline" className="flex items-center gap-2" onClick={handleEditProfile}>
                    <Settings className="h-4 w-4" />
                    Edit Profile
                  </Button>
                </div>
                
                <p className="mt-2 mb-4">
                  {profileData.bio || "No bio yet."}
                </p>
                
                <div className="flex flex-wrap justify-center md:justify-start gap-4 text-sm">
                  <div>
                    <span className="font-bold">{stats.memesCount}</span> memes
                  </div>
                  <div>
                    <span className="font-bold">{stats.likesCount}</span> likes received
                  </div>
                  <div>
                    <span className="font-bold">{stats.commentsCount}</span> comments
                  </div>
                </div>
              </>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );
} 