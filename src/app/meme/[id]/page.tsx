"use client";

import { useEffect, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { AppDispatch, RootState } from "@/redux/store";
import { Meme } from "@/redux/features/memes/memesSlice";
import { useParams, useRouter } from "next/navigation";
import Image from "next/image";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Textarea } from "@/components/ui/textarea";
import { Separator } from "@/components/ui/separator";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { toast } from "sonner";
import { Heart, MessageCircle, Share2, Download, ArrowLeft, Send, Bookmark, Loader2 } from "lucide-react";
import Link from "next/link";
import { motion, AnimatePresence } from "framer-motion";
import { memeService } from "@/services/api";
import { ImageIcon } from "lucide-react";
import { formatDate, cn } from "@/lib/utils";

export default function MemePage() {
  const { id } = useParams();
  const router = useRouter();
  
  const { items, status } = useSelector((state: RootState) => state.memes);
  const { likedMemes, savedMemes, profile } = useSelector((state: RootState) => state.user);
  const { isAuthenticated } = useSelector((state: RootState) => state.auth);
  
  const [memeData, setMemeData] = useState<Meme | null>(null);
  const [commentText, setCommentText] = useState("");
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmittingComment, setIsSubmittingComment] = useState(false);
  const [isLiking, setIsLiking] = useState(false);
  const [hasLiked, setHasLiked] = useState(false);
  const [hasSaved, setHasSaved] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  
  // Check if the current user has liked or saved this meme
  const isLiked = likedMemes.includes(id as string);
  const isSaved = savedMemes.includes(id as string);
  
  // Fetch meme data from API
  useEffect(() => {
    const fetchMemeData = async () => {
      if (!id) return;
      
      setIsLoading(true);
      try {
        // Fetch meme data
        const data = await memeService.getMemeById(id as string);
        setMemeData(data as Meme);
        
        // Check if user has liked this meme
        if (isAuthenticated) {
          const isLiked = await memeService.checkLikeStatus(id as string);
          setHasLiked(isLiked);
          
          // Check if user has saved this meme
          const isSaved = await memeService.checkSaveStatus(id as string);
          setHasSaved(isSaved);
        }
      } catch (error) {
        console.error("Error fetching meme:", error);
        toast.error("Failed to load meme");
        
        // Fallback to Redux store if API fails
        const localMeme = items.find(meme => meme.id === id);
        if (localMeme) {
          setMemeData(localMeme);
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
      const result = await memeService.toggleLike(memeData.id);
      // Update with actual result from server
      setHasLiked(result.liked);
      setMemeData(prev => {
        if (!prev) return prev;
        return {
          ...prev,
          likes: result.likes
        };
      });
      
      toast.success(result.liked 
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
          likes: hasLiked ? prev.likes + 1 : prev.likes - 1
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
    
    try {
      // Call API to add comment
      const newComment = await memeService.addComment(memeData.id, commentText);
      // Update local state with new comment
      setMemeData(prev => {
        if (!prev) return prev;
        return {
          ...prev,
          comments: [...prev.comments, newComment]
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
    try {
      // Optimistic update for UI responsiveness
      setHasSaved(!hasSaved);
      
      // Call API to toggle save
      const result = await memeService.toggleSave(memeData.id);
      
      // Update with actual result from server
      setHasSaved(result.saved);
      
      toast.success(result.saved 
        ? "Meme saved to your collection" 
        : "Meme removed from your collection");
    } catch (error) {
      console.error("Error saving/unsaving meme:", error);
      toast.error("Failed to update save status");
      
      // Revert optimistic update on error
      setHasSaved(!hasSaved);
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
  
  return (
    <div className="py-8 md:py-12 max-w-7xl mx-auto px-4">
      <div className="max-w-4xl mx-auto">
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
        </motion.div>
        
        {isLoading && (
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
        )}
        
        {!isLoading && !memeData && (
          <div className="text-center py-12 bg-muted/30 rounded-lg">
            <h2 className="text-2xl font-bold mb-4">Meme Not Found</h2>
            <p className="text-muted-foreground mb-6">
              The meme you&apos;re looking for doesn&apos;t exist or has been removed.
            </p>
            <Button asChild>
              <Link href="/explore">Browse Memes</Link>
            </Button>
          </div>
        )}
        
        {!isLoading && memeData && (
          <div>
            <h1 className="text-3xl font-bold mb-2">{memeData.title}</h1>
            <div className="flex items-center gap-2 mb-6">
              <p className="text-muted-foreground">
                By {memeData.author} • {formatDate(memeData.createdAt)}
              </p>
              <Badge variant="outline">{memeData.category}</Badge>
            </div>
            
            <Card className="mb-8 overflow-hidden">
              <CardContent className="p-0">
                <div className="relative aspect-video md:aspect-auto md:h-[500px]">
                  {memeData.url ? (
                    <Image
                      src={memeData.url}
                      alt={memeData.title}
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
              <h3 className="text-xl font-semibold mb-6">Comments ({memeData.comments.length})</h3>
              
              <form onSubmit={handleAddComment} className="flex gap-4 mb-8">
                <Avatar>
                  <AvatarImage src={profile.avatar} />
                  <AvatarFallback>{profile.username[0].toUpperCase()}</AvatarFallback>
                </Avatar>
                <div className="flex-1 flex gap-2">
                  <Textarea
                    placeholder="Add a comment..."
                    value={commentText}
                    onChange={(e) => setCommentText(e.target.value)}
                    className="flex-1 resize-none"
                    disabled={isSubmittingComment}
                  />
                  <Button 
                    type="submit" 
                    size="icon" 
                    disabled={!commentText.trim() || isSubmittingComment}
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
                {memeData.comments.length === 0 ? (
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
                        key={comment.id}
                        className="flex gap-4"
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                      >
                        <Avatar>
                          <AvatarImage 
                            src={comment.author || `https://api.dicebear.com/7.x/avataaars/svg?seed=${comment.author}`} 
                            alt={comment.author}
                          />
                          <AvatarFallback>
                            {comment.author && comment.author[0] ? comment.author[0].toUpperCase() : '?'}
                          </AvatarFallback>
                        </Avatar>
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-1">
                            <span className="font-semibold">{comment.author}</span>
                            <span className="text-xs text-muted-foreground">
                              {formatDate(comment.createdAt)}
                            </span>
                          </div>
                          <p className="text-sm">{comment.text}</p>
                        </div>
                      </motion.div>
                    ))}
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}