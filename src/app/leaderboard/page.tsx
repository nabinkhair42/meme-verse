"use client";

import { useState, useEffect, useCallback } from "react";
import { useDispatch, useSelector } from "react-redux";
import { AppDispatch, RootState } from "@/redux/store";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import Image from "next/image";
import Link from "next/link";
import { Heart, ImageIcon, Trophy, User, Star, TrendingUp, Crown, Medal } from "lucide-react";
import { motion } from "framer-motion";
import { Skeleton } from "@/components/ui/skeleton";
import { Badge } from "@/components/ui/badge";
import { leaderboardService } from "@/services/api";

// Define interfaces for the data
interface TopMeme {
  id: string;
  title: string;
  url: string;
  author: string;
  category: string;
  likes: number;
}

interface TopUser {
  id: string;
  username: string;
  avatar: string;
  likes: number;
  memes: number;
  topCategory: string;
}

export default function LeaderboardPage() {
  const dispatch = useDispatch<AppDispatch>();
  const { items } = useSelector((state: RootState) => state.memes);
  
  const [isLoading, setIsLoading] = useState(true);
  const [period, setPeriod] = useState("all-time");
  const [topMemes, setTopMemes] = useState<TopMeme[]>([]);
  const [topUsers, setTopUsers] = useState<TopUser[]>([]);
  const [error, setError] = useState<string | null>(null);
  
  // Fetch leaderboard data based on selected period
  const fetchLeaderboardData = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    
    try {
      // Fetch top memes
      const memesData = await leaderboardService.getTopMemes(period);
      if (Array.isArray(memesData)) {
        setTopMemes(memesData);
      } else if (memesData && memesData.data && Array.isArray(memesData.data)) {
        setTopMemes(memesData.data);
      } else {
        console.error("Unexpected memes data format:", memesData);
        throw new Error("Invalid memes data format");
      }
      
      // Fetch top users
      const usersData = await leaderboardService.getTopUsers(period);
      if (Array.isArray(usersData)) {
        setTopUsers(usersData);
      } else if (usersData && usersData.data && Array.isArray(usersData.data)) {
        setTopUsers(usersData.data);
      } else {
        console.error("Unexpected users data format:", usersData);
        throw new Error("Invalid users data format");
      }
    } catch (error) {
      console.error("Error fetching leaderboard data:", error);
      setError("Failed to load leaderboard data");
      
      // Fallback to local data if API fails
      const sortedMemes = [...items].sort((a, b) => b.likes - a.likes).slice(0, 10);
      setTopMemes(sortedMemes as any);
    } finally {
      setTimeout(() => {
        setIsLoading(false);
      }, 500);
    }
  }, [period, items]);
  
  useEffect(() => {
    fetchLeaderboardData();
  }, [fetchLeaderboardData]);
  
  // Animation variants
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
  
  // Icon for ranking position
  const getRankIcon = (position: number) => {
    switch (position) {
      case 0:
        return <Crown className="h-5 w-5 text-yellow-500" />;
      case 1:
        return <Crown className="h-5 w-5 text-gray-300" />;
      case 2:
        return <Crown className="h-5 w-5 text-amber-600" />;
      default:
        return <span className="h-5 w-5 flex items-center justify-center font-medium">{position + 1}</span>;
    }
  };
  
  return (
    <div className="py-8 md:py-12 max-w-7xl mx-auto px-4">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
      >
        <div className="flex flex-col md:flex-row justify-between items-center mb-8">
          <div className="flex items-center gap-3 mb-4 md:mb-0">
            <Trophy className="h-6 w-6 text-primary" />
            <h1 className="text-3xl font-bold">Leaderboard</h1>
          </div>
          
          <div className="flex items-center space-x-2">
            <Button 
              variant={period === "today" ? "default" : "outline"} 
              size="sm"
              onClick={() => setPeriod("today")}
            >
              Today
            </Button>
            <Button 
              variant={period === "week" ? "default" : "outline"} 
              size="sm"
              onClick={() => setPeriod("week")}
            >
              This Week
            </Button>
            <Button 
              variant={period === "month" ? "default" : "outline"} 
              size="sm"
              onClick={() => setPeriod("month")}
            >
              This Month
            </Button>
            <Button 
              variant={period === "all-time" ? "default" : "outline"} 
              size="sm"
              onClick={() => setPeriod("all-time")}
            >
              All Time
            </Button>
          </div>
        </div>
        
        <Tabs defaultValue="memes" className="space-y-8">
          <TabsList className="w-full flex justify-start border-b rounded-none h-auto p-0 bg-transparent">
            <TabsTrigger 
              value="memes"
              className="flex items-center gap-1 px-4 py-2 data-[state=active]:bg-transparent data-[state=active]:shadow-none data-[state=active]:border-b-2 data-[state=active]:border-primary rounded-none"
            >
              <ImageIcon className="h-4 w-4" />
              Top Memes
            </TabsTrigger>
            <TabsTrigger
              value="creators"
              className="flex items-center gap-1 px-4 py-2 data-[state=active]:bg-transparent data-[state=active]:shadow-none data-[state=active]:border-b-2 data-[state=active]:border-primary rounded-none"
            >
              <User className="h-4 w-4" />
              Top Creators
            </TabsTrigger>
          </TabsList>
          
          <TabsContent value="memes">
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="flex items-center gap-2">
                  <TrendingUp className="h-5 w-5 text-primary" />
                  Most Popular Memes
                </CardTitle>
              </CardHeader>
              <CardContent>
                {error && (
                  <div className="text-center py-4">
                    <p className="text-red-500">{error}</p>
                    <Button 
                      onClick={() => fetchLeaderboardData()} 
                      variant="outline"
                      className="mt-2"
                    >
                      Try Again
                    </Button>
                  </div>
                )}
                
                {isLoading ? (
                  <div className="space-y-4">
                    {[...Array(5)].map((_, i) => (
                      <div key={i} className="flex gap-4 items-center">
                        <Skeleton className="h-10 w-10 rounded-full" />
                        <div className="flex-1 space-y-2">
                          <Skeleton className="h-6 w-3/4" />
                          <Skeleton className="h-4 w-1/2" />
                        </div>
                        <Skeleton className="h-10 w-20" />
                      </div>
                    ))}
                  </div>
                ) : topMemes.length === 0 ? (
                  <div className="text-center py-8">
                    <p className="text-muted-foreground">No memes found for this period</p>
                  </div>
                ) : (
                  <motion.div 
                    className="space-y-4"
                    variants={container}
                    initial="hidden"
                    animate="show"
                  >
                    {topMemes.map((meme, index) => (
                      <motion.div 
                        key={meme.id} 
                        variants={item}
                        className="flex items-center gap-4 py-2 border-b last:border-0"
                      >
                        <div className="flex items-center justify-center w-10 h-10 rounded-full bg-muted">
                          {getRankIcon(index)}
                        </div>
                        
                        <div className="flex flex-1 items-center gap-3 min-w-0">
                          <div className="aspect-square h-16 w-16 relative rounded-md overflow-hidden">
                            <Image
                              src={meme.url}
                              alt={meme.title}
                              fill
                              className="object-cover"
                              unoptimized
                            />
                          </div>
                          
                          <div className="min-w-0 flex-1">
                            <Link 
                              href={`/meme/${meme.id}`}
                              className="font-medium hover:text-primary truncate block"
                            >
                              {meme.title}
                            </Link>
                            <div className="flex items-center text-sm text-muted-foreground gap-4">
                              <span>By {meme.author}</span>
                              <Badge variant="secondary" className="text-xs">
                                {meme.category}
                              </Badge>
                            </div>
                          </div>
                        </div>
                        
                        <div className="flex items-center gap-1 pr-2">
                          <Heart className="h-4 w-4 text-primary" />
                          <span className="font-medium">{meme.likes}</span>
                        </div>
                      </motion.div>
                    ))}
                  </motion.div>
                )}
              </CardContent>
            </Card>
          </TabsContent>
          
          <TabsContent value="creators">
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="flex items-center gap-2">
                  <Star className="h-5 w-5 text-primary" />
                  Top Meme Creators
                </CardTitle>
              </CardHeader>
              <CardContent>
                {isLoading ? (
                  <div className="space-y-4">
                    {[...Array(5)].map((_, i) => (
                      <div key={i} className="flex gap-4 items-center">
                        <Skeleton className="h-10 w-10 rounded-full" />
                        <div className="flex-1 space-y-2">
                          <Skeleton className="h-6 w-3/4" />
                          <Skeleton className="h-4 w-1/2" />
                        </div>
                        <Skeleton className="h-10 w-20" />
                      </div>
                    ))}
                  </div>
                ) : topUsers.length === 0 ? (
                  <div className="text-center py-8">
                    <p className="text-muted-foreground">No creators found for this period</p>
                  </div>
                ) : (
                  <motion.div 
                    className="space-y-4"
                    variants={container}
                    initial="hidden"
                    animate="show"
                  >
                    {topUsers.map((user, index) => (
                      <motion.div 
                        key={user.id} 
                        variants={item}
                        className="flex items-center gap-4 py-2 border-b last:border-0"
                      >
                        <div className="flex items-center justify-center w-10 h-10 rounded-full bg-muted">
                          {getRankIcon(index)}
                        </div>
                        
                        <div className="flex flex-1 items-center gap-4 min-w-0">
                          <Avatar>
                            <AvatarImage src={`https://api.dicebear.com/7.x/avataaars/svg?seed=${user.avatar || user.username}`} />
                            <AvatarFallback>{user.username?.[0]?.toUpperCase() || 'U'}</AvatarFallback>
                          </Avatar>
                          
                          <div className="min-w-0 flex-1">
                            <Link 
                              href={`/profile/${user.id}`}
                              className="font-medium hover:text-primary truncate block"
                            >
                              {user.username}
                            </Link>
                            <div className="flex items-center text-sm text-muted-foreground gap-2">
                              <span>{user.memes} memes</span>
                              <span className="text-xs">•</span>
                              <span className="flex items-center">
                                <Badge variant="secondary" className="text-xs">
                                  {user.topCategory || 'Various'}
                                </Badge>
                              </span>
                            </div>
                          </div>
                        </div>
                        
                        <div className="flex items-center gap-1 pr-2">
                          <Heart className="h-4 w-4 text-primary" />
                          <span className="font-medium">{user.likes}</span>
                        </div>
                      </motion.div>
                    ))}
                  </motion.div>
                )}
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
        
      </motion.div>
    </div>
  );
} 