"use client";

import { useState, useEffect } from "react";
import { useInView } from "react-intersection-observer";
import { useInfiniteQuery } from "@tanstack/react-query";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Skeleton } from "@/components/ui/skeleton";
import { Loader2 } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { memeService } from "@/services/api";
import { MemeCard } from "@/components/meme-card";
import { useSelector } from "react-redux";
import { RootState } from "@/redux/store";
import { Meme } from "@/redux/features/memes/memesSlice";

export function MemeFeed() {
  const { isAuthenticated } = useSelector((state: RootState) => state.auth);
  
  const [activeTab, setActiveTab] = useState("for-you");
  const [likedMemes, setLikedMemes] = useState<Record<string, boolean>>({});
  const [savedMemes, setSavedMemes] = useState<Record<string, boolean>>({});
  
  // Set up intersection observer for infinite scrolling
  const { ref, inView } = useInView({
    threshold: 0.1,
    rootMargin: "200px",
  });
  
  // Fetch memes with infinite scrolling
  const {
    data,
    fetchNextPage,
    hasNextPage,
    isFetchingNextPage,
    status,
    error
  } = useInfiniteQuery({
    queryKey: ['feed-memes', activeTab],
    queryFn: async ({ pageParam = 1 }) => {
      return await memeService.getMemes({
        sort: activeTab === 'trending' ? 'likes' : 'newest',
        page: pageParam,
        limit: 10
      });
    },
    getNextPageParam: (lastPage) => {
      if (!lastPage.pagination) return undefined;
      return lastPage.pagination.page < lastPage.pagination.totalPages 
        ? lastPage.pagination.page + 1 
        : undefined;
    },
    initialPageParam: 1
  });
  
  // Load more memes when the user scrolls to the bottom
  useEffect(() => {
    if (inView && hasNextPage && !isFetchingNextPage) {
      fetchNextPage();
    }
  }, [inView, fetchNextPage, hasNextPage, isFetchingNextPage]);
  
  // Check like and save status for memes when user is authenticated
  useEffect(() => {
    const checkInteractionStatus = async () => {
      if (!isAuthenticated || !data) return;
      
      const allMemes = data.pages.flatMap(page => page.memes);
      
      for (const meme of allMemes) {
        try {
          // Only check if we haven't already checked
          if (likedMemes[meme.id] === undefined) {
            const isLiked = await memeService.checkLikeStatus(meme.id);
            setLikedMemes(prev => ({ ...prev, [meme.id]: isLiked }));
          }
          
          if (savedMemes[meme.id] === undefined) {
            const isSaved = await memeService.checkSaveStatus(meme.id);
            setSavedMemes(prev => ({ ...prev, [meme.id]: isSaved }));
          }
        } catch (error) {
          console.error(`Error checking interaction status for meme ${meme.id}:`, error);
        }
      }
    };
    
    checkInteractionStatus();
  }, [data, isAuthenticated, likedMemes, savedMemes]);
  
  // Handle like toggle
  const handleLikeToggle = (meme: Meme, newState: boolean) => {
    setLikedMemes(prev => ({ ...prev, [meme.id]: newState }));
  };
  
  // Handle save toggle
  const handleSaveToggle = (meme: Meme, newState: boolean) => {
    setSavedMemes(prev => ({ ...prev, [meme.id]: newState }));
  };
  
  // Flatten all memes from all pages
  const allMemes = data?.pages.flatMap(page => page.memes) || [];
  
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
  
  return (
    <Tabs defaultValue="for-you" onValueChange={setActiveTab}>
      <TabsList className="grid grid-cols-2 mb-4">
        <TabsTrigger value="for-you">For You</TabsTrigger>
        <TabsTrigger value="trending">Trending</TabsTrigger>
      </TabsList>
      
      <TabsContent value="for-you" className="mt-0">
        {status === 'pending' ? (
          <div className="space-y-4">
            {[1, 2, 3].map((i) => (
              <Card key={i}>
                <CardContent className="p-0">
                  <div className="p-4">
                    <div className="flex items-center gap-3 mb-3">
                      <Skeleton className="h-10 w-10 rounded-full" />
                      <div>
                        <Skeleton className="h-4 w-24 mb-1" />
                        <Skeleton className="h-3 w-16" />
                      </div>
                    </div>
                    <Skeleton className="h-5 w-3/4 mb-2" />
                    <Skeleton className="h-4 w-full mb-1" />
                    <Skeleton className="h-4 w-2/3 mb-3" />
                  </div>
                  <Skeleton className="h-[300px] w-full" />
                  <div className="p-4">
                    <div className="flex justify-between">
                      <Skeleton className="h-8 w-20" />
                      <div className="flex gap-2">
                        <Skeleton className="h-8 w-8" />
                        <Skeleton className="h-8 w-8" />
                        <Skeleton className="h-8 w-8" />
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        ) : status === 'error' ? (
          <Card>
            <CardContent className="p-6 text-center">
              <p className="text-red-500 mb-2">Failed to load memes</p>
              <Button onClick={() => window.location.reload()}>
                Try Again
              </Button>
            </CardContent>
          </Card>
        ) : (
          <AnimatePresence>
            <motion.div 
              className="space-y-4"
              variants={container}
              initial="hidden"
              animate="show"
            >
              {allMemes.map((meme) => (
                <motion.div key={meme.id} variants={item} layout>
                  <MemeCard 
                    meme={meme}
                    isLiked={likedMemes[meme.id] || false}
                    isSaved={savedMemes[meme.id] || false}
                    isAuthenticated={isAuthenticated}
                    onLikeToggle={handleLikeToggle}
                    onSaveToggle={handleSaveToggle}
                  />
                </motion.div>
              ))}
              
              {/* Loading indicator for infinite scroll */}
              <div ref={ref} className="py-4 flex justify-center">
                {isFetchingNextPage && (
                  <div className="flex items-center gap-2">
                    <Loader2 className="h-6 w-6 animate-spin text-primary" />
                    <p>Loading more memes...</p>
                  </div>
                )}
                
                {!hasNextPage && allMemes.length > 0 && (
                  <p className="text-muted-foreground">You've reached the end!</p>
                )}
              </div>
            </motion.div>
          </AnimatePresence>
        )}
      </TabsContent>
      
      <TabsContent value="trending" className="mt-0">
        {/* Same content structure as "for-you" tab but with trending memes */}
        {/* This is already handled by the query parameter in the useInfiniteQuery hook */}
        {status === 'pending' ? (
          <div className="space-y-4">
            {[1, 2, 3].map((i) => (
              <Card key={i}>
                <CardContent className="p-0">
                  <div className="p-4">
                    <div className="flex items-center gap-3 mb-3">
                      <Skeleton className="h-10 w-10 rounded-full" />
                      <div>
                        <Skeleton className="h-4 w-24 mb-1" />
                        <Skeleton className="h-3 w-16" />
                      </div>
                    </div>
                    <Skeleton className="h-5 w-3/4 mb-2" />
                    <Skeleton className="h-4 w-full mb-1" />
                    <Skeleton className="h-4 w-2/3 mb-3" />
                  </div>
                  <Skeleton className="h-[300px] w-full" />
                  <div className="p-4">
                    <div className="flex justify-between">
                      <Skeleton className="h-8 w-20" />
                      <div className="flex gap-2">
                        <Skeleton className="h-8 w-8" />
                        <Skeleton className="h-8 w-8" />
                        <Skeleton className="h-8 w-8" />
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        ) : status === 'error' ? (
          <Card>
            <CardContent className="p-6 text-center">
              <p className="text-red-500 mb-2">Failed to load trending memes</p>
              <Button onClick={() => window.location.reload()}>
                Try Again
              </Button>
            </CardContent>
          </Card>
        ) : (
          <AnimatePresence>
            <motion.div 
              className="space-y-4"
              variants={container}
              initial="hidden"
              animate="show"
            >
              {allMemes.map((meme) => (
                <motion.div key={meme.id} variants={item} layout>
                  <MemeCard 
                    meme={meme}
                    isLiked={likedMemes[meme.id] || false}
                    isSaved={savedMemes[meme.id] || false}
                    isAuthenticated={isAuthenticated}
                    onLikeToggle={handleLikeToggle}
                    onSaveToggle={handleSaveToggle}
                  />
                </motion.div>
              ))}
              
              {/* Loading indicator for infinite scroll */}
              <div ref={ref} className="py-4 flex justify-center">
                {isFetchingNextPage && (
                  <div className="flex items-center gap-2">
                    <Loader2 className="h-6 w-6 animate-spin text-primary" />
                    <p>Loading more memes...</p>
                  </div>
                )}
                
                {!hasNextPage && allMemes.length > 0 && (
                  <p className="text-muted-foreground">You've reached the end!</p>
                )}
              </div>
            </motion.div>
          </AnimatePresence>
        )}
      </TabsContent>
    </Tabs>
  );
} 