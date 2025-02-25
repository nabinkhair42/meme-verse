"use client";

import { LeftSidebar } from "@/components/home/left-sidebar";
import { RightSidebar } from "@/components/home/right-sidebar";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";
import { Skeleton } from "@/components/ui/skeleton";
import { Textarea } from "@/components/ui/textarea";
import { formatDate } from "@/lib/utils";
import { Meme } from "@/redux/features/memes/memesSlice";
import { RootState } from "@/redux/store";
import { memeService } from "@/services/api";
import { AnimatePresence, motion } from "framer-motion";
import { ArrowLeft, Bookmark, Download, Heart, ImageIcon, Loader2, MessageCircle, Send, Share2 } from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { useSelector } from "react-redux";
import { toast } from "sonner";

export default function MemePage() {
  const { id } = useParams();
  const router = useRouter();
  
  const { items, status } = useSelector((state: RootState) => state.memes);
  const { likedMemes, savedMemes, profile } = useSelector((state: RootState) => state.user);
  const { isAuthenticated, user } = useSelector((state: RootState) => state.auth);
  
  const [memeData, setMemeData] = useState<Meme | null>(null);
  const [commentText, setCommentText] = useState("");
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmittingComment, setIsSubmittingComment] = useState(false);
  const [isLiking, setIsLiking] = useState(false);
  const [hasLiked, setHasLiked] = useState(false);
  const [hasSaved, setHasSaved] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  // Check if the current user has liked or saved this meme
  const isLiked = likedMemes.includes(id as string);
  const isSaved = savedMemes.includes(id as string);
  
  // Fetch meme data from API
  useEffect(() => {
    const fetchMemeData = async () => {
      if (!id) return;
      
      setIsLoading(true);
      setError(null);
      try {
        // Fetch meme data
        const data = await memeService.getMemeById(id as string);
        
        // Fetch comments separately
        let comments: Comment[] = [];
        try {
          comments = await memeService.getComments(id as string);
          // Ensure comments is an array
          if (!Array.isArray(comments)) {
            console.error("Comments is not an array:", comments);
            comments = [];
          }
        } catch (commentError) {
          console.error("Error fetching comments:", commentError);
          comments = [];
        }
        
        // Ensure data has all required properties
        const processedData = {
          ...data,
          comments: comments,
          likes: data.likes || 0,
          tags: data.tags || [],
          description: data.description || ''
        };
        
        setMemeData(processedData as Meme);
        
        // Check if user has liked this meme
        if (isAuthenticated) {
          const isLiked = await memeService.checkLikeStatus(id as string);
          setHasLiked(isLiked?.liked || false);
          
          // Check if user has saved this meme
          const isSaved = await memeService.checkSaveStatus(id as string);
          setHasSaved(isSaved?.saved || false);
        }
      } catch (error) {
        console.error("Error fetching meme:", error);
        setError("Failed to load meme. Please try again later.");
        
        // Fallback to Redux store if API fails
        const localMeme = items.find(meme => meme.id === id);
        if (localMeme) {
          setMemeData({
            ...localMeme,
            comments: Array.isArray(localMeme.comments) ? localMeme.comments : [],
            likes: localMeme.likes || 0,
            tags: localMeme.tags || [],
            description: localMeme.description || ''
          });
          setError(null);
        }
      } finally {
        setIsLoading(false);
      }
    };
    
    fetchMemeData();
  }, [id, items, isAuthenticated]);
  
  // Handle like toggle with API
  const handleLike = async () => {
    if (!memeData || isLiking || !isAuthenticated) {
      if (!isAuthenticated) {
        router.push("/login");
        toast.error("Please log in to like memes");
      }
      return;
    }
    
    setIsLiking(true);
    // Store original likes count for error recovery
    const originalLikes = memeData.likes;
    
    try {
      // Optimistic update for UI responsiveness
      setHasLiked(!hasLiked);
      setMemeData(prev => {
        if (!prev) return prev;
        return {
          ...prev,
          likes: hasLiked ? prev.likes - 1 : prev.likes + 1
        };
      });
      
      // Call API to toggle like
      const result = await memeService.likeMeme(memeData.id);
      // Log the response for debugging
      console.log(`Like response for meme ${memeData.id}:`, result);
      
      // Update with actual result from server
      const isLiked = result?.liked || false;
      const likesCount = result?.likes || originalLikes;
      
      setHasLiked(isLiked);
      setMemeData(prev => {
        if (!prev) return prev;
        return {
          ...prev,
          likes: likesCount
        };
      });
      
      toast.success(isLiked 
        ? "Added to your liked memes" 
        : "Removed from your liked memes");
    } catch (error) {
      console.error("Error liking/unliking meme:", error);
      toast.error("Failed to update like status");
      
      // Revert optimistic update on error
      setHasLiked(!hasLiked);
      setMemeData(prev => {
        if (!prev) return prev;
        return {
          ...prev,
          likes: originalLikes
        };
      });
    } finally {
      setIsLiking(false);
    }
  };
  
  // Handle comment submission with API
  const handleAddComment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!memeData || !commentText.trim() || isSubmittingComment || !isAuthenticated) {
      if (!isAuthenticated) {
        toast.error("Please log in to comment");
        router.push("/login");
      }
      return;
    }
    
    setIsSubmittingComment(true);
    const commentToSubmit = commentText.trim();
    
    try {
      // Call API to add comment
      const newComment = await memeService.addComment(memeData.id, commentToSubmit);
      
      // Log the response for debugging
      console.log(`Comment response for meme ${memeData.id}:`, newComment);
      
      // Ensure newComment is valid
      if (!newComment || !newComment.id) {
        throw new Error("Invalid comment data received from server");
      }
      
      // Update local state with new comment
      setMemeData(prev => {
        if (!prev) return prev;
        
        // Ensure comments is an array
        const currentComments = Array.isArray(prev.comments) ? prev.comments : [];
        
        return {
          ...prev,
          comments: [...currentComments, newComment]
        };
      });
      
      // Clear input
      setCommentText("");
      toast.success("Comment added!");
    } catch (error) {
      console.error("Error adding comment:", error);
      toast.error("Failed to add comment");
    } finally {
      setIsSubmittingComment(false);
    }
  };
  
  // Handle save toggle
  const handleSave = async () => {
    if (!memeData || isSaving || !isAuthenticated) {
      if (!isAuthenticated) {
        toast.error("Please log in to save memes");
        router.push("/login");
      }
      return;
    }
    
    setIsSaving(true);
    // Store original saved state for error recovery
    const originalSavedState = hasSaved;
    
    try {
      // Optimistic update for UI responsiveness
      setHasSaved(!hasSaved);
      
      // Call API to toggle save
      const result = await memeService.saveMeme(memeData.id);
      
      // Log the response for debugging
      console.log(`Save response for meme ${memeData.id}:`, result);
      
      // Update with actual result from server
      const isSaved = result?.saved || false;
      setHasSaved(isSaved);
      
      toast.success(isSaved 
        ? "Meme saved to your collection" 
        : "Meme removed from your collection");
    } catch (error) {
      console.error("Error saving/unsaving meme:", error);
      toast.error("Failed to update save status");
      
      // Revert optimistic update on error
      setHasSaved(originalSavedState);
    } finally {
      setIsSaving(false);
    }
  };
  
  // Handle sharing
  const handleShare = () => {
    if (!memeData) return;
    
    // In a real app, this would use the Web Share API if available
    // or create a shareable link
    navigator.clipboard.writeText(window.location.href);
    toast.success("Link copied to clipboard!");
  };
  
  // Handle download
  const handleDownload = () => {
    if (!memeData) return;
    
    // Create an anchor element and set properties for download
    const link = document.createElement("a");
    link.href = memeData.url;
    link.download = `meme-${memeData.id}.jpg`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    
    toast.success("Meme downloaded successfully!");
  };
  
  // Render the meme content
  const renderMemeContent = () => {
    if (isLoading) {
      return (
        <div className="space-y-8">
          <Skeleton className="h-[400px] w-full rounded-lg" />
          <div className="space-y-2">
            <Skeleton className="h-10 w-3/4" />
            <Skeleton className="h-5 w-1/3" />
          </div>
          <div className="flex justify-between">
            <div className="space-x-2">
              <Skeleton className="h-10 w-20 inline-block" />
              <Skeleton className="h-10 w-20 inline-block" />
              <Skeleton className="h-10 w-20 inline-block" />
            </div>
            <Skeleton className="h-10 w-20" />
          </div>
          <Skeleton className="h-32 w-full" />
        </div>
      );
    }
    
    if (error || !memeData) {
      return (
        <div className="text-center py-12 bg-muted/30 rounded-lg">
          <h2 className="text-2xl font-bold mb-4">Meme Not Found</h2>
          <p className="text-muted-foreground mb-6">
            {error || "The meme you're looking for doesn't exist or has been removed."}
          </p>
          <Button asChild>
            <Link href="/explore">Browse Memes</Link>
          </Button>
        </div>
      );
    }
    
    return (
      <div>
        <h1 className="text-3xl font-bold mb-2">{memeData.title}</h1>
        <div className="flex items-center gap-2 mb-6">
          <p className="text-muted-foreground">
            By {memeData.author || 'Unknown'} • {formatDate(memeData.createdAt)}
          </p>
          <Badge variant="outline">{memeData.category || 'Uncategorized'}</Badge>
        </div>
        
        <Card className="mb-8 overflow-hidden">
          <CardContent className="p-0">
            <div className="relative aspect-video md:aspect-auto md:h-[500px]">
              {memeData.url ? (
                <Image
                  src={memeData.url}
                  alt={memeData.title || 'Meme'}
                  fill
                  className="object-contain"
                  unoptimized
                />
              ) : (
                <div className="w-full h-full flex items-center justify-center bg-muted">
                  <ImageIcon className="h-12 w-12 text-muted-foreground" />
                </div>
              )}
            </div>
          </CardContent>
        </Card>
        
        {/* Action buttons */}
        <div className="flex flex-wrap gap-4 mb-8">
          <Button
            variant={hasLiked ? "default" : "outline"}
            onClick={handleLike}
            disabled={isLiking || !isAuthenticated}
            className={hasLiked ? "bg-primary/90 hover:bg-primary" : ""}
          >
            {isLiking ? (
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            ) : (
              <Heart className={`mr-2 h-4 w-4 ${hasLiked ? "fill-current" : ""}`} />
            )}
            {hasLiked ? "Liked" : "Like"} ({memeData.likes})
          </Button>
          
          <Button
            variant={hasSaved ? "default" : "outline"}
            onClick={handleSave}
            disabled={isSaving || !isAuthenticated}
            className={hasSaved ? "bg-primary/90 hover:bg-primary" : ""}
          >
            {isSaving ? (
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            ) : (
              <Bookmark className={`mr-2 h-4 w-4 ${hasSaved ? "fill-current" : ""}`} />
            )}
            {hasSaved ? "Saved" : "Save"}
          </Button>
          
          <Button variant="outline" onClick={handleShare}>
            <Share2 className="mr-2 h-4 w-4" />
            Share
          </Button>
          
          <Button variant="outline" onClick={handleDownload}>
            <Download className="mr-2 h-4 w-4" />
            Download
          </Button>
        </div>
        
        {/* Tags */}
        {memeData.tags && memeData.tags.length > 0 && (
          <div className="mb-8">
            <h3 className="text-lg font-semibold mb-2">Tags</h3>
            <div className="flex flex-wrap gap-2">
              {memeData.tags.map((tag, index) => (
                <Badge key={index} variant="secondary">
                  {tag}
                </Badge>
              ))}
            </div>
          </div>
        )}
        
        {/* Description */}
        {memeData.description && (
          <div className="mb-8">
            <h3 className="text-lg font-semibold mb-2">About this meme</h3>
            <p className="text-muted-foreground">{memeData.description}</p>
          </div>
        )}
        
        <Separator className="my-8" />
        
        {/* Comments Section with real-time updates */}
        <div>
          <h3 className="text-xl font-semibold mb-6">Comments ({memeData.comments?.length || 0})</h3>
          
          <form onSubmit={handleAddComment} className="flex gap-4 mb-8">
            <Avatar>
              <AvatarImage src={profile?.avatar} />
              <AvatarFallback>{profile?.username?.[0]?.toUpperCase() || 'U'}</AvatarFallback>
            </Avatar>
            <div className="flex-1 flex gap-2">
              <Textarea
                placeholder={isAuthenticated ? "Add a comment..." : "Log in to comment"}
                value={commentText}
                onChange={(e) => setCommentText(e.target.value)}
                className="flex-1 resize-none"
                disabled={isSubmittingComment || !isAuthenticated}
              />
              <Button 
                type="submit" 
                size="icon" 
                disabled={!commentText.trim() || isSubmittingComment || !isAuthenticated}
              >
                {isSubmittingComment ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <Send className="h-4 w-4" />
                )}
                <span className="sr-only">Send comment</span>
              </Button>
            </div>
          </form>
          
          <AnimatePresence>
            {!memeData.comments || !Array.isArray(memeData.comments) || memeData.comments.length === 0 ? (
              <div className="text-center py-12 bg-muted/30 rounded-lg">
                <MessageCircle className="h-8 w-8 mx-auto mb-4 text-muted-foreground" />
                <h4 className="text-lg font-semibold mb-2">No comments yet</h4>
                <p className="text-muted-foreground mb-4">Be the first to share your thoughts on this meme!</p>
              </div>
            ) : (
              <motion.div 
                className="space-y-6"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
              >
                {memeData.comments.map((comment) => (
                  <motion.div 
                    key={comment.id || `comment-${Math.random()}`}
                    className="flex gap-4"
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                  >
                    <Avatar>
                      <AvatarImage 
                        src={`https://api.dicebear.com/7.x/avataaars/svg?seed=${comment.author}`} 
                        alt={comment.author}
                      />
                      <AvatarFallback>
                        {comment.author?.[0]?.toUpperCase() || '?'}
                      </AvatarFallback>
                    </Avatar>
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-1">
                        <span className="font-semibold">{comment.author}</span>
                        <span className="text-xs text-muted-foreground">
                          {formatDate(comment.createdAt)}
                        </span>
                      </div>
                      <p className="text-sm">{comment.text || (comment as any).content}</p>
                    </div>
                  </motion.div>
                ))}
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>
    );
  };
  
  return (
    <div className="h-[calc(100vh-64px)] overflow-hidden">
      <div className="max-w-7xl mx-auto px-4 h-full">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 h-full">
          {/* Left Sidebar - Fixed */}
          <div className="hidden lg:block lg:col-span-3 h-[calc(100vh-64px)] pt-6">
            <div className="pr-4 sticky top-[80px] max-h-[calc(100vh-80px)] overflow-y-auto">
              <LeftSidebar isAuthenticated={isAuthenticated} user={user} />
            </div>
          </div>
          
          {/* Main Content - Scrollable */}
          <div className="lg:col-span-6 h-[calc(100vh-64px)] pt-6">
            <ScrollArea className="h-full pb-6">
              <div className="pr-4">
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.5 }}
                >
                  <Button
                    variant="ghost"
                    className="flex items-center gap-2 mb-6"
                    onClick={() => router.back()}
                  >
                    <ArrowLeft className="h-4 w-4" />
                    <span>Back</span>
                  </Button>
                  
                  {renderMemeContent()}
                </motion.div>
              </div>
            </ScrollArea>
          </div>
          
          {/* Right Sidebar - Fixed */}
          <div className="hidden lg:block lg:col-span-3 h-[calc(100vh-64px)] pt-6">
            <div className="pl-4 sticky top-[80px] max-h-[calc(100vh-80px)] overflow-y-auto">
              <RightSidebar />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}