"use client";

import { useState, useEffect } from "react";
import { useDispatch, useSelector } from "react-redux";
import { AppDispatch, RootState } from "@/redux/store";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import Image from "next/image";
import Link from "next/link";
import { Heart, MessageCircle, Upload, Bookmark, User, Calendar, Settings, Check, X } from "lucide-react";
import { motion } from "framer-motion";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Skeleton } from "@/components/ui/skeleton";
import { format } from "date-fns";
import { Badge } from "@/components/ui/badge";
import { userService } from "@/services/api";
import { ProtectedRoute } from "@/components/auth/protected-route";
import { toast } from "sonner";
import { updateProfile } from "@/redux/features/user/userSlice";
import { Meme } from "@/redux/features/memes/memesSlice";

export default function ProfilePage() {
  const dispatch = useDispatch<AppDispatch>();
  const { items } = useSelector((state: RootState) => state.memes);
  const { user } = useSelector((state: RootState) => state.auth);
  
  const [isLoading, setIsLoading] = useState(true);
  const [uploadedMemes, setUploadedMemes] = useState<Meme[]>([]);
  const [likedMemes, setLikedMemes] = useState<Meme[]>([]);
  const [savedMemes, setSavedMemes] = useState<Meme[]>([]);
  const [isEditing, setIsEditing] = useState(false);
  const [profileData, setProfileData] = useState({
    username: '',
    bio: '',
    avatar: ''
  });
  
  // Animation
  const container = {
    hidden: { opacity: 0 },
    show: {
      opacity: 1,
      transition: {
        staggerChildren: 0.1
      }
    }
  };
  
  const item = {
    hidden: { opacity: 0, y: 20 },
    show: { opacity: 1, y: 0 }
  };
  
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
  
  const handleEditProfile = () => {
    setIsEditing(true);
  };
  
  const handleCancelEdit = () => {
    setIsEditing(false);
    // Reset form data
    if (user) {
      setProfileData({
        username: user.username || '',
        bio: user.bio || '',
        avatar: user.avatar || ''
      });
    }
  };
  
  const handleSaveProfile = async () => {
    try {
      if (user?.id) {
        await userService.updateProfile(user.id, profileData);
        dispatch(updateProfile(profileData));
        toast.success("Profile updated successfully!");
      }
      setIsEditing(false);
    } catch (error) {
      console.error("Error updating profile:", error);
      toast.error("Failed to update profile");
    }
  };
  
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setProfileData(prev => ({
      ...prev,
      [name]: value
    }));
  };
  
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
          {/* Profile Header */}
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
                          value={profileData.username}
                          onChange={handleInputChange}
                          className="max-w-md"
                        />
                      </div>
                      
                      <div>
                        <label className="text-sm font-medium mb-1 block">Bio</label>
                        <Textarea 
                          name="bio"
                          value={profileData.bio}
                          onChange={handleInputChange}
                          className="max-w-md"
                          rows={3}
                        />
                      </div>
                      
                      <div>
                        <label className="text-sm font-medium mb-1 block">Avatar URL</label>
                        <Input 
                          name="avatar"
                          value={profileData.avatar}
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
                      
                      <div className="flex flex-wrap gap-2">
                        <div className="flex items-center text-muted-foreground text-sm">
                          <Calendar className="h-4 w-4 mr-1" />
                          Joined {user?.joinDate ? format(new Date(user.joinDate), 'MMMM yyyy') : 'Recently'}
                        </div>
                      </div>
                    </>
                  )}
                </div>
              </div>
              
              {/* Stats */}
              {!isLoading && (
                <div className="grid grid-cols-3 gap-4 mt-6 pt-6 border-t">
                  <div className="text-center">
                    <p className="text-2xl font-bold">{memesCount}</p>
                    <p className="text-muted-foreground text-sm">Memes</p>
                  </div>
                  <div className="text-center">
                    <p className="text-2xl font-bold">{likesCount}</p>
                    <p className="text-muted-foreground text-sm">Likes</p>
                  </div>
                  <div className="text-center">
                    <p className="text-2xl font-bold">{commentsCount}</p>
                    <p className="text-muted-foreground text-sm">Comments</p>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
          
          {/* Memes Tabs */}
          <Tabs defaultValue="uploaded" className="space-y-6">
            <TabsList className="w-full flex justify-start border-b rounded-none h-auto p-0 bg-transparent">
              <TabsTrigger 
                value="uploaded"
                className="flex items-center gap-1 px-4 py-2 data-[state=active]:bg-transparent data-[state=active]:shadow-none data-[state=active]:border-b-2 data-[state=active]:border-primary rounded-none"
              >
                <Upload className="h-4 w-4" />
                Uploaded
              </TabsTrigger>
              <TabsTrigger
                value="liked"
                className="flex items-center gap-1 px-4 py-2 data-[state=active]:bg-transparent data-[state=active]:shadow-none data-[state=active]:border-b-2 data-[state=active]:border-primary rounded-none"
              >
                <Heart className="h-4 w-4" />
                Liked
              </TabsTrigger>
              <TabsTrigger
                value="saved"
                className="flex items-center gap-1 px-4 py-2 data-[state=active]:bg-transparent data-[state=active]:shadow-none data-[state=active]:border-b-2 data-[state=active]:border-primary rounded-none"
              >
                <Bookmark className="h-4 w-4" />
                Saved
              </TabsTrigger>
            </TabsList>
            
            <TabsContent value="uploaded">
              {isLoading ? (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                  {[1, 2, 3].map((i) => (
                    <Card key={i} className="overflow-hidden">
                      <CardContent className="p-0">
                        <Skeleton className="h-[200px] w-full" />
                        <div className="p-4 space-y-3">
                          <Skeleton className="h-6 w-3/4" />
                          <div className="flex justify-between">
                            <Skeleton className="h-4 w-1/3" />
                            <div className="flex gap-3">
                              <Skeleton className="h-4 w-10" />
                              <Skeleton className="h-4 w-10" />
                            </div>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              ) : uploadedMemes.length === 0 ? (
                <div className="text-center py-12 bg-muted/30 rounded-lg">
                  <Upload className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
                  <h3 className="text-lg font-semibold mb-2">No uploaded memes</h3>
                  <p className="text-muted-foreground mb-6 max-w-md mx-auto">
                    You haven't uploaded any memes yet. Create or upload your first meme to get started!
                  </p>
                  <div className="flex flex-wrap justify-center gap-4">
                    <Button asChild>
                      <Link href="/upload">Upload a Meme</Link>
                    </Button>
                    <Button asChild variant="outline">
                      <Link href="/generate">Create a Meme</Link>
                    </Button>
                  </div>
                </div>
              ) : (
                <motion.div 
                  className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6"
                  variants={container}
                  initial="hidden"
                  animate="show"
                >
                  {uploadedMemes.map((meme) => (
                    <motion.div key={meme.id} variants={item}>
                      <Link href={`/meme/${meme.id}`}>
                        <Card className="overflow-hidden hover:shadow-lg transition-shadow">
                          <CardContent className="p-0">
                            <div className="aspect-video relative">
                              <Image
                                src={meme.url}
                                alt={meme.title}
                                fill
                                className="object-cover"
                                unoptimized
                              />
                            </div>
                            <div className="p-4">
                              <h3 className="font-semibold mb-2 truncate">{meme.title}</h3>
                              <div className="flex justify-between items-center">
                                <div className="flex items-center">
                                  <Badge variant="secondary" className="text-xs">
                                    {meme.category}
                                  </Badge>
                                </div>
                                <div className="flex items-center gap-3">
                                  <span className="flex items-center gap-1 text-sm">
                                    <Heart className="h-4 w-4" /> {meme.likes}
                                  </span>
                                  <span className="flex items-center gap-1 text-sm">
                                    <MessageCircle className="h-4 w-4" /> {meme.comments.length}
                                  </span>
                                </div>
                              </div>
                            </div>
                          </CardContent>
                        </Card>
                      </Link>
                    </motion.div>
                  ))}
                </motion.div>
              )}
            </TabsContent>
            
            <TabsContent value="liked">
              {isLoading ? (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                  {[1, 2, 3].map((i) => (
                    <Card key={i} className="overflow-hidden">
                      <CardContent className="p-0">
                        <Skeleton className="h-[200px] w-full" />
                        <div className="p-4 space-y-3">
                          <Skeleton className="h-6 w-3/4" />
                          <div className="flex justify-between">
                            <Skeleton className="h-4 w-1/3" />
                            <div className="flex gap-3">
                              <Skeleton className="h-4 w-10" />
                              <Skeleton className="h-4 w-10" />
                            </div>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              ) : likedMemes.length === 0 ? (
                <div className="text-center py-12 bg-muted/30 rounded-lg">
                  <Heart className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
                  <h3 className="text-lg font-semibold mb-2">No liked memes</h3>
                  <p className="text-muted-foreground mb-6 max-w-md mx-auto">
                    You haven't liked any memes yet. Browse around and hit the like button on memes you enjoy!
                  </p>
                  <Button asChild>
                    <Link href="/explore">Explore Memes</Link>
                  </Button>
                </div>
              ) : (
                <motion.div 
                  className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6"
                  variants={container}
                  initial="hidden"
                  animate="show"
                >
                  {likedMemes.map((meme) => (
                    <motion.div key={meme.id} variants={item}>
                      <Link href={`/meme/${meme.id}`}>
                        <Card className="overflow-hidden hover:shadow-lg transition-shadow">
                          <CardContent className="p-0">
                            <div className="aspect-video relative">
                              <Image
                                src={meme.url}
                                alt={meme.title}
                                fill
                                className="object-cover"
                                unoptimized
                              />
                            </div>
                            <div className="p-4">
                              <h3 className="font-semibold mb-2 truncate">{meme.title}</h3>
                              <div className="flex justify-between items-center">
                                <p className="text-sm text-muted-foreground">
                                  By {meme.author}
                                </p>
                                <div className="flex items-center gap-3">
                                  <span className="flex items-center gap-1 text-sm">
                                    <Heart className="h-4 w-4 fill-primary text-primary" /> {meme.likes}
                                  </span>
                                  <span className="flex items-center gap-1 text-sm">
                                    <MessageCircle className="h-4 w-4" /> {meme.comments.length}
                                  </span>
                                </div>
                              </div>
                            </div>
                          </CardContent>
                        </Card>
                      </Link>
                    </motion.div>
                  ))}
                </motion.div>
              )}
            </TabsContent>
            
            <TabsContent value="saved">
              {isLoading ? (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                  {[1, 2, 3].map((i) => (
                    <Card key={i} className="overflow-hidden">
                      <CardContent className="p-0">
                        <Skeleton className="h-[200px] w-full" />
                        <div className="p-4 space-y-3">
                          <Skeleton className="h-6 w-3/4" />
                          <div className="flex justify-between">
                            <Skeleton className="h-4 w-1/3" />
                            <div className="flex gap-3">
                              <Skeleton className="h-4 w-10" />
                              <Skeleton className="h-4 w-10" />
                            </div>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              ) : savedMemes.length === 0 ? (
                <div className="text-center py-12 bg-muted/30 rounded-lg">
                  <Bookmark className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
                  <h3 className="text-lg font-semibold mb-2">No saved memes</h3>
                  <p className="text-muted-foreground mb-6 max-w-md mx-auto">
                    You haven't saved any memes for later. Use the bookmark icon to save memes you want to reference later.
                  </p>
                  <Button asChild>
                    <Link href="/explore">Explore Memes</Link>
                  </Button>
                </div>
              ) : (
                <motion.div 
                  className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6"
                  variants={container}
                  initial="hidden"
                  animate="show"
                >
                  {savedMemes.map((meme: any) => (
                    <motion.div key={meme.id} variants={item}>
                      <Link href={`/meme/${meme.id}`}>
                        <Card className="overflow-hidden hover:shadow-lg transition-shadow">
                          <CardContent className="p-0">
                            <div className="aspect-video relative">
                              <Image
                                src={meme.url}
                                alt={meme.title}
                                fill
                                className="object-cover"
                                unoptimized
                              />
                            </div>
                            <div className="p-4">
                              <h3 className="font-semibold mb-2 truncate">{meme.title}</h3>
                              <div className="flex justify-between items-center">
                                <p className="text-sm text-muted-foreground">
                                  By {meme.author}
                                </p>
                                <div className="flex items-center gap-3">
                                  <span className="flex items-center gap-1 text-sm">
                                    <Heart className="h-4 w-4" /> {meme.likes}
                                  </span>
                                  <span className="flex items-center gap-1 text-sm">
                                    <MessageCircle className="h-4 w-4" /> {meme.comments?.length || 0}
                                  </span>
                                </div>
                              </div>
                            </div>
                          </CardContent>
                        </Card>
                      </Link>
                    </motion.div>
                  ))}
                </motion.div>
              )}
            </TabsContent>
          </Tabs>
        </motion.div>
      </div>
    </ProtectedRoute>
  );
} 