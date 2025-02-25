"use client";

import { useState } from "react";
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

interface MemeCardProps {
  meme: Meme;
  isLiked: boolean;
  isSaved: boolean;
  isAuthenticated: boolean;
  onLikeToggle?: (meme: Meme, newState: boolean) => void;
  onSaveToggle?: (meme: Meme, newState: boolean) => void;
}

export function MemeCard({ 
  meme, 
  isLiked, 
  isSaved, 
  isAuthenticated,
  onLikeToggle,
  onSaveToggle
}: MemeCardProps) {
  const [isInteracting, setIsInteracting] = useState(false);
  
  const handleLike = async () => {
    if (!isAuthenticated) {
      toast.error("Please log in to like memes");
      return;
    }
    
    if (isInteracting) return;
    
    setIsInteracting(true);
    
    try {
      // Call API
      const result = await memeService.toggleLike(meme.id);
      
      // Notify parent component
      if (onLikeToggle) {
        onLikeToggle(meme, result.liked);
      }
      
    } catch (error) {
      console.error(`Error toggling like for meme ${meme.id}:`, error);
      toast.error("Failed to update like status");
    } finally {
      setIsInteracting(false);
    }
  };
  
  const handleSave = async () => {
    if (!isAuthenticated) {
      toast.error("Please log in to save memes");
      return;
    }
    
    if (isInteracting) return;
    
    setIsInteracting(true);
    
    try {
      // Call API
      const result = await memeService.toggleSave(meme.id);
      
      // Notify parent component
      if (onSaveToggle) {
        onSaveToggle(meme, result.saved);
      }
      
      toast.success(result.saved 
        ? "Meme saved to your collection" 
        : "Meme removed from your collection");
    } catch (error) {
      console.error(`Error toggling save for meme ${meme.id}:`, error);
      toast.error("Failed to update save status");
    } finally {
      setIsInteracting(false);
    }
  };
  
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
            <Image
              src={meme.url}
              alt={meme.title}
              fill
              className="object-contain"
              unoptimized
            />
          </div>
        </Link>
        
        <div className="p-4">
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center gap-1 text-sm text-muted-foreground">
              <ThumbsUp className="h-4 w-4 fill-primary text-primary" />
              <span>{meme.likes} likes</span>
            </div>
            <div className="flex items-center gap-4 text-sm text-muted-foreground">
              <span>{meme.comments?.length || 0} comments</span>
            </div>
          </div>
          
          <div className="flex border-t border-b py-1 mt-1">
            <Button 
              variant="ghost" 
              size="sm" 
              className="flex-1"
              onClick={handleLike}
              disabled={isInteracting}
            >
              <ThumbsUp className={`mr-2 h-4 w-4 ${isLiked ? "fill-primary text-primary" : ""}`} />
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
              disabled={isInteracting}
            >
              <Bookmark className={`mr-2 h-4 w-4 ${isSaved ? "fill-primary text-primary" : ""}`} />
              Save
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  );
} 