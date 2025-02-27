"use client";

import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Heart, ImageIcon, MessageSquare, TrendingUp, Award, Trophy } from "lucide-react";
import { toast } from "sonner";
import { motion, AnimatePresence } from "framer-motion";
import { cn } from "@/lib/utils";

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

export default function ProfileStats({ userId }: ProfileStatsProps) {
  const [stats, setStats] = useState<UserStats | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  useEffect(() => {
    const fetchStats = async () => {
      try {
        setIsLoading(true);
        setError(null);
        
        const response = await fetch(`/api/auth/profile/${userId}`);
        
        if (!response.ok) {
          throw new Error("Failed to fetch user stats");
        }
        
        const data = await response.json();
        
        setStats({
          memes: data.stats.memes || 0,
          likes: data.stats.likes || 0,
          comments: data.stats.comments || 0,
          topCategory: data.stats.topCategories?.[0]?.name,
          mostLikedMeme: data.stats.mostLikedMeme
        });
      } catch (error) {
        console.error("Error fetching user stats:", error);
        setError("Failed to load user statistics");
        toast.error("Failed to load user statistics");
        
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
      <motion.div 
        className="grid grid-cols-1 md:grid-cols-3 gap-6 mt-8"
        variants={container}
        initial="hidden"
        animate="show"
      >
        {[...Array(3)].map((_, i) => (
          <motion.div key={i} variants={item}>
            <Card className="overflow-hidden border-border/40">
              <CardHeader className="pb-2">
                <Skeleton className="h-6 w-24" />
              </CardHeader>
              <CardContent>
                <Skeleton className="h-10 w-16" />
                <Skeleton className="h-4 w-32 mt-2" />
              </CardContent>
            </Card>
          </motion.div>
        ))}
      </motion.div>
    );
  }
  
  if (error) {
    return (
      <motion.div 
        className="mt-8 p-6 text-center bg-destructive/5 rounded-lg"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
      >
        <p className="text-destructive mb-2">{error}</p>
        <button
          onClick={() => window.location.reload()}
          className="text-sm text-muted-foreground hover:text-foreground transition-colors"
        >
          Refresh page
        </button>
      </motion.div>
    );
  }
  
  if (!stats) {
    return null;
  }
  
  const calculateEngagementRate = () => {
    if (stats.memes === 0) return 0;
    return ((stats.likes + stats.comments) / stats.memes).toFixed(1);
  };
  
  return (
    <motion.div 
      className="grid grid-cols-1 md:grid-cols-3 gap-6 mt-8"
      variants={container}
      initial="hidden"
      animate="show"
    >
      <motion.div variants={item}>
        <Card className="overflow-hidden border-border/40 hover:shadow-md transition-all group">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium flex items-center text-muted-foreground group-hover:text-foreground transition-colors">
              <ImageIcon className="h-4 w-4 mr-2 text-primary" />
              Total Memes
            </CardTitle>
          </CardHeader>
          <CardContent>
            <motion.p 
              className="text-3xl font-bold tracking-tight"
              initial={{ scale: 0.5, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              transition={{ type: "spring", stiffness: 200, damping: 10 }}
            >
              {stats.memes}
            </motion.p>
            {stats.topCategory && (
              <p className="text-sm text-muted-foreground mt-1 flex items-center">
                <Trophy className="h-4 w-4 mr-1 text-primary" />
                Most in {stats.topCategory}
              </p>
            )}
          </CardContent>
        </Card>
      </motion.div>
      
      <motion.div variants={item}>
        <Card className="overflow-hidden border-border/40 hover:shadow-md transition-all group">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium flex items-center text-muted-foreground group-hover:text-foreground transition-colors">
              <Heart className="h-4 w-4 mr-2 text-primary" />
              Total Likes
            </CardTitle>
          </CardHeader>
          <CardContent>
            <motion.p 
              className="text-3xl font-bold tracking-tight"
              initial={{ scale: 0.5, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              transition={{ type: "spring", stiffness: 200, damping: 10 }}
            >
              {stats.likes}
            </motion.p>
            {stats.mostLikedMeme && (
              <p className="text-sm text-muted-foreground mt-1 flex items-center">
                <Award className="h-4 w-4 mr-1 text-primary" />
                Top: {stats.mostLikedMeme.title} ({stats.mostLikedMeme.likes})
              </p>
            )}
          </CardContent>
        </Card>
      </motion.div>
      
      <motion.div variants={item}>
        <Card className="overflow-hidden border-border/40 hover:shadow-md transition-all group">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium flex items-center text-muted-foreground group-hover:text-foreground transition-colors">
              <TrendingUp className="h-4 w-4 mr-2 text-primary" />
              Engagement Rate
            </CardTitle>
          </CardHeader>
          <CardContent>
            <motion.p 
              className="text-3xl font-bold tracking-tight"
              initial={{ scale: 0.5, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              transition={{ type: "spring", stiffness: 200, damping: 10 }}
            >
              {calculateEngagementRate()}
            </motion.p>
            <p className="text-sm text-muted-foreground mt-1 flex items-center">
              <MessageSquare className="h-4 w-4 mr-1 text-primary" />
              Interactions per meme
            </p>
          </CardContent>
        </Card>
      </motion.div>
    </motion.div>
  );
} 