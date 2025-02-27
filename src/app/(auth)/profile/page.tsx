"use client";

import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Calendar, Edit, Heart, ImageIcon } from "lucide-react";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import ProfileEditForm from "./_components/profile-edit-form";
import ProfileMemeGrid from "./_components/profile-meme-grid";
import ProfileStats from "./_components/profile-stats";
import { useSelector } from "react-redux";
import { RootState } from "@/redux/store";

interface UserProfile {
  id: string;
  name: string;
  email: string;
  username: string;
  bio: string;
  avatar: string;
  createdAt: string;
  stats: {
    memes: number;
    likes: number;
  };
}

export default function ProfilePage() {
  const router = useRouter();
  const { user, isAuthenticated } = useSelector((state: RootState) => state.auth);
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isEditing, setIsEditing] = useState(false);
  const [activeTab, setActiveTab] = useState("uploaded");
  
  // Fetch user profile
  useEffect(() => {
    const fetchProfile = async () => {
      if (!isAuthenticated) {
        router.push("/login");
        return;
      }
      
      try {
        setIsLoading(true);
        const response = await fetch("/api/auth/me");
        
        if (!response.ok) {
          throw new Error("Failed to fetch profile");
        }
        
        const data = await response.json();
        setProfile(data);
      } catch (error) {
        console.error("Error fetching profile:", error);
        toast.error("Failed to load profile");
      } finally {
        setIsLoading(false);
      }
    };
    
    fetchProfile();
  }, [isAuthenticated, router]);
  
  // Handle profile update
  const handleProfileUpdate = async (updatedProfile: Partial<UserProfile>) => {
    try {
      const response = await fetch("/api/auth/me", {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(updatedProfile),
      });
      
      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || "Failed to update profile");
      }
      
      const data = await response.json();
      setProfile(prev => prev ? { ...prev, ...data } : data);
      setIsEditing(false);
      toast.success("Profile updated successfully");
    } catch (error) {
      console.error("Error updating profile:", error);
      toast.error((error as Error).message || "Failed to update profile");
    }
  };
  
  if (isLoading) {
    return (
      <div className="flex w-full justify-center py-8 px-4">
        <div className="max-w-7xl mx-auto w-full">
          <Card className="mb-8">
            <CardContent className="p-6">
              <div className="flex flex-col md:flex-row gap-6">
                <div className="flex flex-col items-center">
                  <Skeleton className="h-24 w-24 rounded-full" />
                  <Skeleton className="h-9 w-28 mt-4" />
                </div>
                <div className="flex-1 space-y-4">
                  <div>
                    <Skeleton className="h-8 w-48 mb-2" />
                    <Skeleton className="h-4 w-32" />
                  </div>
                  <Skeleton className="h-20 w-full" />
                  <div className="flex flex-wrap gap-4">
                    <Skeleton className="h-5 w-32" />
                    <Skeleton className="h-5 w-32" />
                    <Skeleton className="h-5 w-32" />
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          <div className="mb-8">
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {[...Array(3)].map((_, i) => (
                <Card key={`stat-${i}`} className="p-4">
                  <Skeleton className="h-8 w-24 mb-2" />
                  <Skeleton className="h-6 w-full" />
                </Card>
              ))}
            </div>
          </div>

          <div className="space-y-4">
            <div className="flex space-x-1 rounded-lg bg-muted p-1 w-fit">
              {[...Array(3)].map((_, i) => (
                <Skeleton key={`tab-${i}`} className="h-9 w-28" />
              ))}
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {[...Array(6)].map((_, i) => (
                <Card key={`meme-${i}`} className="overflow-hidden">
                  <Skeleton className="aspect-square" />
                  <CardContent className="p-4">
                    <Skeleton className="h-6 w-3/4 mb-2" />
                    <Skeleton className="h-4 w-1/2" />
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        </div>
      </div>
    );
  }
  
  if (!isAuthenticated) {
    router.push("/login");
    return null;
  }
  
  if (!profile) {
    return (
      <div className="max-w-7xl mx-auto py-8 px-4 text-center">
        <h1 className="text-2xl font-bold mb-4">Profile not found</h1>
        <p className="text-muted-foreground mb-4">We couldn't find your profile information.</p>
        <Button onClick={() => window.location.reload()}>Retry</Button>
      </div>
    );
  }
  
  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString("en-US", {
      year: "numeric",
      month: "long",
      day: "numeric",
    });
  };
  
  return (
    <div className="flex w-full justify-center py-8 px-4">
      <div className="max-w-7xl mx-auto w-full">
        <Card className="mb-8">
          <CardContent className="p-6">
            {isEditing ? (
              <ProfileEditForm 
                profile={profile} 
                onSave={handleProfileUpdate} 
                onCancel={() => setIsEditing(false)} 
              />
            ) : (
              <div className="flex flex-col md:flex-row gap-6">
                <div className="flex flex-col items-center">
                  <Avatar className="h-24 w-24">
                    <AvatarImage 
                      src={profile.avatar || `https://api.dicebear.com/7.x/avataaars/svg?seed=${profile.username}`} 
                      alt={profile.name}
                    />
                    <AvatarFallback>{profile.username?.[0]?.toUpperCase() || 'U'}</AvatarFallback>
                  </Avatar>
                  
                  <Button 
                    variant="outline" 
                    size="sm" 
                    className="mt-4"
                    onClick={() => setIsEditing(true)}
                  >
                    <Edit className="h-4 w-4 mr-2" />
                    Edit Profile
                  </Button>
                </div>
                
                <div className="flex-1">
                  <div className="mb-4">
                    <h1 className="text-2xl font-bold">{profile.name}</h1>
                    <p className="text-muted-foreground">@{profile.username}</p>
                  </div>
                  
                  <p className="mb-4">{profile.bio || "No bio provided."}</p>
                  
                  <div className="flex flex-wrap gap-4 text-sm text-muted-foreground">
                    <div className="flex items-center">
                      <Calendar className="h-4 w-4 mr-1" />
                      Joined {formatDate(profile.createdAt)}
                    </div>
                    <div className="flex items-center">
                      <ImageIcon className="h-4 w-4 mr-1" />
                      {profile.stats.memes} memes
                    </div>
                    <div className="flex items-center">
                      <Heart className="h-4 w-4 mr-1" />
                      {profile.stats.likes} likes received
                    </div>
                  </div>
                </div>
              </div>
            )}
          </CardContent>
        </Card>
        
        <ProfileStats userId={profile.id} />
        
        <div className="mt-8">
          <Tabs value={activeTab} onValueChange={setActiveTab}>
            <TabsList className="mb-4">
              <TabsTrigger value="uploaded">Uploaded Memes</TabsTrigger>
              <TabsTrigger value="generated">Generated Memes</TabsTrigger>
              <TabsTrigger value="saved">Saved Memes</TabsTrigger>
            </TabsList>
            
            <TabsContent value="uploaded">
              <ProfileMemeGrid userId={profile.id} type="uploaded" />
            </TabsContent>
            
            <TabsContent value="generated">
              <ProfileMemeGrid userId={profile.id} type="generated" />
            </TabsContent>
            
            <TabsContent value="saved">
              <ProfileMemeGrid userId={profile.id} type="saved" />
            </TabsContent>
          </Tabs>
        </div>
      </div>
    </div>
  );
} 