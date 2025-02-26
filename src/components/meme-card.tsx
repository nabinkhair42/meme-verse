"use client";

import { useState, useEffect, useRef } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import Image from "next/image";
import Link from "next/link";
import {  MessageCircle, Share2, Bookmark, ThumbsUp } from "lucide-react";
import { format } from "date-fns";
import { toast } from "sonner";
import { Meme } from "@/redux/features/memes/memesSlice";
import { memeService } from "@/services/api";
import { useSelector } from "react-redux";
import { RootState } from "@/redux/store";

interface MemeCardProps {
  meme: Meme;
  isAuthenticated: boolean;
  onLikeToggle?: (meme: Meme, newState: boolean) => void;
  isLiked: boolean;
  onSaveToggle?: (meme: Meme, newState: boolean) => void;
  isSaved: boolean;
}

// Create global caches outside of component
// These will be shared across all MemeCard instances
const globalLikeCache = new Map<string, boolean>();
const globalSaveCache = new Map<string, boolean>();

// Debounce function at module level
function debounce(func: Function, wait: number) {
  let timeout: NodeJS.Timeout;
  return function(...args: any[]) {
    clearTimeout(timeout);
    timeout = setTimeout(() => func(...args), wait);
  };
}

export function MemeCard({ meme, isLiked, isSaved, ...props }: MemeCardProps) {
  const { isAuthenticated } = useSelector((state: RootState) => state.auth);
  const [liked, setLiked] = useState(isLiked);
  const [saved, setSaved] = useState(isSaved);
  const [isLoading, setIsLoading] = useState(false);
  const [likesCount, setLikesCount] = useState(meme.likes || 0);
  
  // Update likesCount when meme prop changes
  useEffect(() => {
    setLikesCount(meme.likes || 0);
  }, [meme.likes]);
  
  // Use refs to track if we've already checked status to prevent infinite loops
  const likeChecked = useRef(false);
  const saveChecked = useRef(false);
  
  // Check like status only once when component mounts
  useEffect(() => {
    if (isAuthenticated && !likeChecked.current) {
      likeChecked.current = true;
      
      // Check cache first
      if (globalLikeCache.has(meme.id)) {
        setLiked(globalLikeCache.get(meme.id) || false);
        return;
      }
      
      memeService.checkLikeStatus(meme.id)
        .then(response => {
          const isLiked = response?.liked || false;
          setLiked(isLiked);
          // Update cache
          globalLikeCache.set(meme.id, isLiked);
        })
        .catch(error => {
          console.error("Error checking like status:", error);
        });
    }
  }, [isAuthenticated, meme.id]);
  
  // Check save status only once when component mounts
  useEffect(() => {
    if (isAuthenticated && !saveChecked.current) {
      saveChecked.current = true;
      
      // Check cache first
      if (globalSaveCache.has(meme.id)) {
        setSaved(globalSaveCache.get(meme.id) || false);
        return;
      }
      
      memeService.checkSaveStatus(meme.id)
        .then(response => {
          const isSaved = response?.saved || false;
          setSaved(isSaved);
          // Update cache
          globalSaveCache.set(meme.id, isSaved);
        })
        .catch(error => {
          console.error("Error checking save status:", error);
        });
    }
  }, [isAuthenticated, meme.id]);
  
  const [isInteracting, setIsInteracting] = useState(false);
  
  const handleLike = debounce(async () => {
    if (!isAuthenticated) {
      toast.error("Please log in to like memes");
      return;
    }
    
    setIsLoading(true);
    const oldLikesCount = likesCount;
    try {
      // Optimistic update for better UX
      const newLikedState = !liked;
      setLiked(newLikedState);
      setLikesCount(prev => newLikedState ? prev + 1 : prev - 1);
      
      // Call API to toggle like
      const response = await memeService.likeMeme(meme.id);
      
      // Log the response for debugging
      console.log(`Like response for meme ${meme.id}:`, response);
      
      // Update with actual server response
      const isLiked = response?.liked || false;
      const serverLikesCount = response?.likes || oldLikesCount;
      
      // Update the UI with the server's response
      setLiked(isLiked);
      setLikesCount(serverLikesCount);
      
      // Update the global cache
      globalLikeCache.set(meme.id, isLiked);
      
      // Notify parent component
      if (props.onLikeToggle) {
        // Pass the server's like count to ensure consistency
        const updatedMeme = { ...meme, likes: serverLikesCount };
        props.onLikeToggle(updatedMeme, isLiked);
      }
    } catch (error) {
      console.error("Error liking meme:", error);
      // Revert optimistic update on error
      setLiked(!liked);
      setLikesCount(oldLikesCount);
      toast.error("Failed to update like status");
    } finally {
      setIsLoading(false);
    }
  }, 300);
  
  const handleSave = debounce(async () => {
    if (!isAuthenticated) {
      toast.error("Please log in to save memes");
      return;
    }
    
    setIsLoading(true);
    try {
      const response = await memeService.saveMeme(meme.id);
      const isSaved = response?.saved || false;
      setSaved(isSaved);
      
      // Notify parent component
      if (props.onSaveToggle) {
        props.onSaveToggle(meme, isSaved);
      }
      
      toast.success(isSaved 
        ? "Meme saved to your collection" 
        : "Meme removed from your collection");
    } catch (error) {
      console.error("Error saving meme:", error);
    } finally {
      setIsLoading(false);
    }
  }, 300);
  
  const handleShare = () => {
    navigator.clipboard.writeText(`${window.location.origin}/meme/${meme.id}`);
    toast.success("Link copied to clipboard!");
  };
  
  return (
    <Card>
      <CardContent className="p-0">
        <div className="p-4">
          <div className="flex items-center gap-3 mb-2">
            <Avatar>
              <AvatarImage src={`https://api.dicebear.com/7.x/avataaars/svg?seed=${meme.author}`} />
              <AvatarFallback>{meme.author[0]}</AvatarFallback>
            </Avatar>
            <div>
              <Link href={`/profile/${meme.authorId || 'user'}`} className="font-medium hover:underline">
                {meme.author}
              </Link>
              <p className="text-xs text-muted-foreground">
                {format(new Date(meme.createdAt), 'MMM d, yyyy')}
              </p>
            </div>
          </div>
          
          <Link href={`/meme/${meme.id}`}>
            <h3 className="text-lg font-semibold mb-2 hover:text-primary transition-colors">
              {meme.title}
            </h3>
          </Link>
          
          {meme.description && (
            <p className="text-muted-foreground mb-3">
              {meme.description.length > 120 
                ? `${meme.description.substring(0, 120)}...` 
                : meme.description}
            </p>
          )}
        </div>
        
        <Link href={`/meme/${meme.id}`}>
          <div className="relative aspect-video overflow-hidden bg-muted">
            {meme.imageUrl ? (
              <Image
                src={meme.imageUrl}
                alt={meme.title}
                fill
                className="object-contain"
                unoptimized
              />
            ) : (
              <div className="flex h-full items-center justify-center text-muted-foreground">
                No image available
              </div>
            )}
          </div>
        </Link>
        
        <div className="p-4">
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center gap-1 text-sm text-muted-foreground">
              <ThumbsUp className="h-4 w-4 fill-primary text-primary" />
              <span>{likesCount} likes</span>
            </div>
            <div className="flex items-center gap-4 text-sm text-muted-foreground">
              <span>
                {meme.commentCount || 0} comments
              </span>
            </div>
          </div>
          
          <div className="flex border-t border-b py-1 mt-1">
            <Button 
              variant="ghost" 
              size="sm" 
              className="flex-1"
              onClick={handleLike}
              disabled={isLoading}
            >
              <ThumbsUp className={`mr-2 h-4 w-4 ${liked ? "fill-primary text-primary" : ""}`} />
              Like
            </Button>
            
            <Button 
              variant="ghost" 
              size="sm" 
              className="flex-1"
              asChild
            >
              <Link href={`/meme/${meme.id}`}>
                <MessageCircle className="mr-2 h-4 w-4" />
                Comment
              </Link>
            </Button>
            
            <Button 
              variant="ghost" 
              size="sm" 
              className="flex-1"
              onClick={handleShare}
            >
              <Share2 className="mr-2 h-4 w-4" />
              Share
            </Button>
            
            <Button 
              variant="ghost" 
              size="sm" 
              className="flex-1"
              onClick={handleSave}
              disabled={isLoading}
            >
              <Bookmark className={`mr-2 h-4 w-4 ${saved ? "fill-primary text-primary" : ""}`} />
              Save
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  );
} 