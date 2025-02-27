"use client";

import { useState, useEffect } from "react";
import { useInView } from "react-intersection-observer";
import { useInfiniteQuery } from "@tanstack/react-query";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Skeleton } from "@/components/ui/skeleton";
import { Loader2, TrendingUp, Clock, Award } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { memeService } from "@/services/api";
import { MemeCard } from "@/components/meme-card";
import { useSelector } from "react-redux";
import { RootState } from "@/redux/store";
import { FaFire } from "react-icons/fa";
import { LeftSidebar } from "@/components/home/left-sidebar";
import { RightSidebar } from "@/components/home/right-sidebar";
import { ScrollArea } from "@/components/ui/scroll-area";

export default function TrendingPage() {
  const { isAuthenticated, user } = useSelector((state: RootState) => state.auth);
  
  const [activeTab, setActiveTab] = useState("today");
  const [likedMemes, setLikedMemes] = useState<Record<string, boolean>>({});
  const [savedMemes, setSavedMemes] = useState<Record<string, boolean>>({});
  
  // Set up intersection observer for infinite scrolling
  const { ref, inView } = useInView({
    threshold: 0.1,
    rootMargin: "200px",
  });
  
  // Map tab values to API period values
  const getPeriodFromTab = (tab: string) => {
    switch (tab) {
      case 'today': return 'day';
      case 'week': return 'week';
      case 'month': return 'month';
      case 'all-time': return 'all';
      default: return 'week';
    }
  };
  
  // Fetch memes with infinite scrolling
  const {
    data,
    fetchNextPage,
    hasNextPage,
    isFetchingNextPage,
    status,
    error
  } = useInfiniteQuery({
    queryKey: ['trending-memes', activeTab],
    queryFn: async ({ pageParam = 1 }) => {
      try {
        // Use the new trending API with the appropriate period
        console.log(`Fetching trending memes with period: ${getPeriodFromTab(activeTab)}, page: ${pageParam}`);
        return await memeService.getTrendingMemes(
          pageParam, 
          12, 
          getPeriodFromTab(activeTab)
        );
      } catch (error) {
        console.error("Error using trending API, falling back to regular API:", error);
        // Fall back to the regular API if the trending API fails
        return await memeService.getMemes({
          page: pageParam,
          limit: 12,
          sort: 'likes',
        });
      }
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
      
      const allMemes = data.pages.flatMap(page => {
        // Check if page.memes exists and is an array
        const memes = page && (page as any).memes;
        return Array.isArray(memes) ? memes : [];
      });
      
      for (const meme of allMemes) {
        try {
          // Skip if meme or meme.id is undefined
          if (!meme || !meme.id) continue;
          
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
          console.error(`Error checking interaction status for meme:`, error);
        }
      }
    };
    
    checkInteractionStatus();
  }, [data, isAuthenticated, likedMemes, savedMemes]);
  
  // Handle like toggle
  const handleLikeToggle = (meme: any, newState: boolean) => {
    if (!meme || !meme.id) return;
    setLikedMemes(prev => ({ ...prev, [meme.id]: newState }));
  };
  
  // Handle save toggle
  const handleSaveToggle = (meme: any, newState: boolean) => {
    if (!meme || !meme.id) return;
    setSavedMemes(prev => ({ ...prev, [meme.id]: newState }));
  };
  
  // Flatten all memes from all pages
  const allMemes = data?.pages.flatMap(page => {
    // Check if page has data property (new API) or memes property (old API)
    const memes = page.data || page.memes;
    return Array.isArray(memes) ? memes : [];
  }) || [];
  
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
                <div className="mb-8">
                  <h1 className="text-3xl font-bold flex items-center mb-2">
                    <TrendingUp className="mr-2 h-8 w-8 text-primary" />
                    Trending Memes
                  </h1>
                  <p className="text-muted-foreground">
                    Discover the most popular memes that are making waves across MemeVerse
                  </p>
                </div>
                
                <Tabs defaultValue="today" onValueChange={setActiveTab}>
                  <TabsList className="mb-6">
                    <TabsTrigger value="today" className="flex items-center">
                      <FaFire className="mr-2 h-4 w-4" />
                      Today
                    </TabsTrigger>
                    <TabsTrigger value="week" className="flex items-center">
                      <Clock className="mr-2 h-4 w-4" />
                      This Week
                    </TabsTrigger>
                    <TabsTrigger value="month" className="flex items-center">
                      <Award className="mr-2 h-4 w-4" />
                      This Month
                    </TabsTrigger>
                    <TabsTrigger value="all-time" className="flex items-center">
                      <TrendingUp className="mr-2 h-4 w-4" />
                      All Time
                    </TabsTrigger>
                  </TabsList>
                  
                  <TabsContent value="today" className="mt-0">
                    {renderMemeGrid()}
                  </TabsContent>
                  
                  <TabsContent value="week" className="mt-0">
                    {renderMemeGrid()}
                  </TabsContent>
                  
                  <TabsContent value="month" className="mt-0">
                    {renderMemeGrid()}
                  </TabsContent>
                  
                  <TabsContent value="all-time" className="mt-0">
                    {renderMemeGrid()}
                  </TabsContent>
                </Tabs>
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
  
  function renderMemeGrid() {
    if (status === 'pending') {
      return (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {[1, 2, 3, 4, 5, 6].map((i) => (
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
      );
    }
    
    if (status === 'error') {
      return (
        <Card>
          <CardContent className="p-6 text-center">
            <p className="text-red-500 mb-2">Failed to load trending memes</p>
            <Button onClick={() => window.location.reload()}>
              Try Again
            </Button>
          </CardContent>
        </Card>
      );
    }
    
    return (
      <>
        <AnimatePresence>
          <motion.div 
            className="grid grid-cols-1 md:grid-cols-2 gap-6"
            variants={container}
            initial="hidden"
            animate="show"
          >
            {allMemes
              .filter(meme => meme && meme.id) // Filter out any memes without an id
              .map((meme) => (
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
          </motion.div>
        </AnimatePresence>
        
        {/* Loading indicator for infinite scroll */}
        <div ref={ref} className="py-8 flex justify-center">
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
      </>
    );
  }
} 