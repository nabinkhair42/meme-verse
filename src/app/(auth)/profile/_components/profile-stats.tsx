"use client";

import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Heart, ImageIcon, MessageSquare, TrendingUp, Award } from "lucide-react";
import { toast } from "sonner";

interface ProfileStatsProps {
  userId: string;
}

interface UserStats {
  memes: number;
  likes: number;
  comments: number;
  topCategory?: string;
  mostLikedMeme?: {
    id: string;
    title: string;
    likes: number;
  };
}

export default function ProfileStats({ userId }: ProfileStatsProps) {
  const [stats, setStats] = useState<UserStats | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  
  useEffect(() => {
    const fetchStats = async () => {
      try {
        setIsLoading(true);
        
        // Fetch user profile by ID
        const response = await fetch(`/api/auth/profile/${userId}`);
        
        if (!response.ok) {
          throw new Error("Failed to fetch user stats");
        }
        
        const data = await response.json();
        
        // Extract stats from the response
        setStats({
          memes: data.stats.memes || 0,
          likes: data.stats.likes || 0,
          comments: data.stats.comments || 0,
          topCategory: data.stats.topCategories?.[0]?.name,
          mostLikedMeme: data.stats.mostLikedMeme
        });
      } catch (error) {
        console.error("Error fetching user stats:", error);
        toast.error("Failed to load user statistics");
        
        // Set default stats
        setStats({
          memes: 0,
          likes: 0,
          comments: 0
        });
      } finally {
        setIsLoading(false);
      }
    };
    
    if (userId) {
      fetchStats();
    }
  }, [userId]);
  
  if (isLoading) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-8">
        {[...Array(3)].map((_, i) => (
          <Card key={i}>
            <CardHeader className="pb-2">
              <Skeleton className="h-6 w-24" />
            </CardHeader>
            <CardContent>
              <Skeleton className="h-10 w-16" />
            </CardContent>
          </Card>
        ))}
      </div>
    );
  }
  
  if (!stats) {
    return null;
  }
  
  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-8">
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-sm font-medium flex items-center">
            <ImageIcon className="h-4 w-4 mr-2 text-primary" />
            Total Memes
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-2xl font-bold">{stats.memes}</p>
          <p className="text-xs text-muted-foreground mt-1">
            {stats.topCategory && `Mostly in ${stats.topCategory}`}
          </p>
        </CardContent>
      </Card>
      
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-sm font-medium flex items-center">
            <Heart className="h-4 w-4 mr-2 text-primary" />
            Total Likes
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-2xl font-bold">{stats.likes}</p>
          <p className="text-xs text-muted-foreground mt-1">
            {stats.mostLikedMeme && `Most liked: ${stats.mostLikedMeme.title} (${stats.mostLikedMeme.likes})`}
          </p>
        </CardContent>
      </Card>
      
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-sm font-medium flex items-center">
            <TrendingUp className="h-4 w-4 mr-2 text-primary" />
            Engagement
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-2xl font-bold">
            {stats.memes > 0 ? Math.round((stats.likes / stats.memes) * 10) / 10 : 0}
          </p>
          <p className="text-xs text-muted-foreground mt-1">
            Average likes per meme
          </p>
        </CardContent>
      </Card>
    </div>
  );
} 