"use client";

import { useState, useEffect } from "react";
import { useParams } from "next/navigation";
import { useInView } from "react-intersection-observer";
import { useInfiniteQuery } from "@tanstack/react-query";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Loader2, Hash } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { memeService } from "@/services/api";
import { MemeCard } from "@/components/meme-card";
import { useSelector } from "react-redux";
import { RootState } from "@/redux/store";
import Link from "next/link";

export default function CategoryPage() {
  const { slug } = useParams();
  const categoryName = typeof slug === 'string' ? slug : '';
  const formattedCategory = categoryName.charAt(0).toUpperCase() + categoryName.slice(1);
  
  const { isAuthenticated } = useSelector((state: RootState) => state.auth);
  
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
    queryKey: ['category-memes', categoryName],
    queryFn: async ({ pageParam = 1 }) => {
      return await memeService.getMemes({
        category: formattedCategory,
        page: pageParam,
        limit: 12
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
  const handleLikeToggle = (meme: any, newState: boolean) => {
    setLikedMemes(prev => ({ ...prev, [meme.id]: newState }));
  };
  
  // Handle save toggle
  const handleSaveToggle = (meme: any, newState: boolean) => {
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
    <div className="py-6 max-w-7xl mx-auto px-4">
      <div className="mb-8">
        <h1 className="text-3xl font-bold flex items-center mb-2">
          <Hash className="mr-2 h-8 w-8 text-primary" />
          {formattedCategory} Memes
        </h1>
        <p className="text-muted-foreground">
          Browse the best {formattedCategory.toLowerCase()} memes on MemeVerse
        </p>
      </div>
      
      {status === 'pending' ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
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
      ) : status === 'error' ? (
        <Card>
          <CardContent className="p-6 text-center">
            <p className="text-red-500 mb-2">Failed to load memes</p>
            <Button onClick={() => window.location.reload()}>
              Try Again
            </Button>
          </CardContent>
        </Card>
      ) : allMemes.length === 0 ? (
        <Card>
          <CardContent className="p-6 text-center">
            <p className="mb-2">No memes found in this category</p>
            <Button asChild>
              <Link href="/">Browse all memes</Link>
            </Button>
          </CardContent>
        </Card>
      ) : (
        <>
          <AnimatePresence>
            <motion.div 
              className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6"
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
      )}
    </div>
  );
} 