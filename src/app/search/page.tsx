"use client";

import { LeftSidebar } from "@/components/home/left-sidebar";
import { RightSidebar } from "@/components/home/right-sidebar";
import { MemeCard } from "@/components/meme-card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Skeleton } from "@/components/ui/skeleton";
import { RootState } from "@/redux/store";
import { memeService } from "@/services/api";
import { useInfiniteQuery } from "@tanstack/react-query";
import { AnimatePresence, motion } from "framer-motion";
import { Clock, Filter, Loader2, Search as SearchIcon, TrendingUp, X } from "lucide-react";
import { useRouter, useSearchParams } from "next/navigation";
import { useEffect, useState, useMemo } from "react";
import { FaFire } from "react-icons/fa";
import { useInView } from "react-intersection-observer";
import { useSelector } from "react-redux";

export default function SearchPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const initialQuery = searchParams.get("q") || "";
  const initialCategory = searchParams.get("category") || "";
  const initialSort = searchParams.get("sort") || "newest";
  
  const { isAuthenticated, user } = useSelector((state: RootState) => state.auth);
  
  const [searchQuery, setSearchQuery] = useState(initialQuery);
  const [activeCategory, setActiveCategory] = useState(initialCategory);
  const [activeSort, setActiveSort] = useState(initialSort);
  const [likedMemes, setLikedMemes] = useState<Record<string, boolean>>({});
  const [savedMemes, setSavedMemes] = useState<Record<string, boolean>>({});
  const [isSearching, setIsSearching] = useState(false);
  
  // Categories
  const categories = [
    "Programming", "Reactions", "Animals", "Gaming", 
    "Movies", "Wholesome", "Sports", "Politics", "Science"
  ];
  
  // Set up intersection observer for infinite scrolling
  const { ref, inView } = useInView({
    threshold: 0.1,
    rootMargin: "200px",
  });
  
  // Update URL when search parameters change
  useEffect(() => {
    const params = new URLSearchParams();
    if (searchQuery) params.set("q", searchQuery);
    if (activeCategory) params.set("category", activeCategory);
    if (activeSort !== "newest") params.set("sort", activeSort);
    
    const newUrl = `/search${params.toString() ? `?${params.toString()}` : ''}`;
    router.push(newUrl, { scroll: false });
  }, [searchQuery, activeCategory, activeSort, router]);
  
  // Fetch memes with infinite scrolling
  const {
    data,
    fetchNextPage,
    hasNextPage,
    isFetchingNextPage,
    status,
    error,
    refetch
  } = useInfiniteQuery({
    queryKey: ['search-memes', searchQuery, activeCategory, activeSort],
    queryFn: async ({ pageParam = 1 }) => {
      console.log(`Fetching search page ${pageParam} with query: ${searchQuery}, category: ${activeCategory}, sort: ${activeSort}`);
      try {
        // Use the new searchMemes API
        const result = await memeService.searchMemes({
          search: searchQuery,
          category: activeCategory !== 'All' ? activeCategory : '',
          sort: activeSort,
          page: pageParam,
          limit: 12
        });
        
        return result;
      } catch (err) {
        console.error("Error fetching search results:", err);
        // Fall back to the old API if the new one fails
        return memeService.getMemes({
          page: pageParam,
          limit: 12,
          category: activeCategory !== 'All' ? activeCategory : '',
          sort: activeSort,
        });
      }
    },
    getNextPageParam: (lastPage) => {
      // Check if the response has the expected structure
      if (lastPage && lastPage.pagination) {
        const { page, totalPages } = lastPage.pagination;
        return page < totalPages ? page + 1 : undefined;
      }
      return undefined;
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
  
  // Handle search
  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    setIsSearching(true);
    refetch().finally(() => setIsSearching(false));
  };
  
  // Clear filters
  const clearFilters = () => {
    setSearchQuery("");
    setActiveCategory("");
    setActiveSort("newest");
  };
  
  // Update the memes variable to handle both API response formats
  const memes = useMemo(() => {
    if (!data) return [];
    
    // Flatten all pages of memes
    return data.pages.flatMap(page => {
      // Check if the response has the expected structure
      if (page && page.data) {
        return page.data;
      } else if (page && page.memes) {
        return page.memes;
      }
      return [];
    });
  }, [data]);
  
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
                  <h1 className="text-3xl font-bold flex items-center mb-4">
                    <SearchIcon className="mr-2 h-8 w-8 text-primary" />
                    Search & Explore
                  </h1>
                  
                  {/* Search form */}
                  <form onSubmit={handleSearch} className="flex gap-2 mb-6">
                    <div className="relative flex-1">
                      <SearchIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                      <Input
                        type="text"
                        placeholder="Search for memes..."
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        className="pl-10"
                      />
                    </div>
                    <Button type="submit" disabled={isSearching}>
                      {isSearching ? (
                        <Loader2 className="h-4 w-4 animate-spin mr-2" />
                      ) : (
                        <SearchIcon className="h-4 w-4 mr-2" />
                      )}
                      Search
                    </Button>
                  </form>
                  
                  {/* Active filters */}
                  {(activeCategory || searchQuery || activeSort !== "newest") && (
                    <div className="flex flex-wrap gap-2 mb-6">
                      <div className="flex items-center">
                        <Filter className="h-4 w-4 mr-2 text-muted-foreground" />
                        <span className="text-sm text-muted-foreground mr-2">Active filters:</span>
                      </div>
                      
                      {searchQuery && (
                        <Badge variant="secondary" className="flex items-center gap-1">
                          Query: {searchQuery}
                          <Button 
                            variant="ghost" 
                            size="icon" 
                            className="h-4 w-4 p-0 ml-1" 
                            onClick={() => setSearchQuery("")}
                          >
                            <X className="h-3 w-3" />
                          </Button>
                        </Badge>
                      )}
                      
                      {activeCategory && (
                        <Badge variant="secondary" className="flex items-center gap-1">
                          Category: {activeCategory}
                          <Button 
                            variant="ghost" 
                            size="icon" 
                            className="h-4 w-4 p-0 ml-1" 
                            onClick={() => setActiveCategory("")}
                          >
                            <X className="h-3 w-3" />
                          </Button>
                        </Badge>
                      )}
                      
                      {activeSort !== "newest" && (
                        <Badge variant="secondary" className="flex items-center gap-1">
                          Sort: {activeSort}
                          <Button 
                            variant="ghost" 
                            size="icon" 
                            className="h-4 w-4 p-0 ml-1" 
                            onClick={() => setActiveSort("newest")}
                          >
                            <X className="h-3 w-3" />
                          </Button>
                        </Badge>
                      )}
                      
                      <Button 
                        variant="ghost" 
                        size="sm" 
                        className="text-xs" 
                        onClick={clearFilters}
                      >
                        Clear all
                      </Button>
                    </div>
                  )}
                  
                  {/* Categories */}
                  <div className="mb-6">
                    <h2 className="text-sm font-medium mb-3 text-muted-foreground">Categories</h2>
                    <div className="flex flex-wrap gap-2">
                      {categories.map((category) => (
                        <Button
                          key={category}
                          variant={activeCategory === category ? "default" : "outline"}
                          size="sm"
                          onClick={() => setActiveCategory(activeCategory === category ? "" : category)}
                          className={activeCategory === category ? "bg-primary/90 hover:bg-primary" : ""}
                        >
                          {category}
                        </Button>
                      ))}
                    </div>
                  </div>
                  
                  {/* Sort options */}
                  <div className="mb-6">
                    <h2 className="text-sm font-medium mb-3 text-muted-foreground">Sort by</h2>
                    <div className="flex flex-wrap gap-2">
                      <Button
                        variant={activeSort === "newest" ? "default" : "outline"}
                        size="sm"
                        onClick={() => setActiveSort("newest")}
                        className={activeSort === "newest" ? "bg-primary/90 hover:bg-primary" : ""}
                      >
                        <Clock className="mr-2 h-4 w-4" />
                        Newest
                      </Button>
                      
                      <Button
                        variant={activeSort === "likes" ? "default" : "outline"}
                        size="sm"
                        onClick={() => setActiveSort("likes")}
                        className={activeSort === "likes" ? "bg-primary/90 hover:bg-primary" : ""}
                      >
                        <FaFire className="mr-2 h-4 w-4" />
                        Most Liked
                      </Button>
                      
                      <Button
                        variant={activeSort === "comments" ? "default" : "outline"}
                        size="sm"
                        onClick={() => setActiveSort("comments")}
                        className={activeSort === "comments" ? "bg-primary/90 hover:bg-primary" : ""}
                      >
                        <TrendingUp className="mr-2 h-4 w-4" />
                        Most Commented
                      </Button>
                    </div>
                  </div>
                </div>
                
                {/* Results */}
                <div>
                  <h2 className="text-xl font-semibold mb-4 flex items-center">
                    {searchQuery ? (
                      <>Search Results for "{searchQuery}"</>
                    ) : activeCategory ? (
                      <>{activeCategory} Memes</>
                    ) : (
                      <>All Memes</>
                    )}
                    {status !== 'pending' && data && (
                      <Badge variant="outline" className="ml-2">
                        {data.pages[0].pagination?.total || 0} results
                      </Badge>
                    )}
                  </h2>
                  
                  {status === 'pending' ? (
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
                  ) : status === 'error' ? (
                    <Card>
                      <CardContent className="p-6 text-center">
                        <p className="text-red-500 mb-2">Failed to load memes</p>
                        <Button onClick={() => refetch()}>
                          Try Again
                        </Button>
                      </CardContent>
                    </Card>
                  ) : memes.length === 0 ? (
                    <Card>
                      <CardContent className="p-6 text-center">
                        <p className="mb-2">No memes found matching your criteria</p>
                        <Button onClick={clearFilters}>
                          Clear Filters
                        </Button>
                      </CardContent>
                    </Card>
                  ) : (
                    <>
                      <AnimatePresence>
                        <motion.div 
                          className="grid grid-cols-1 md:grid-cols-2 gap-6"
                          variants={container}
                          initial="hidden"
                          animate="show"
                        >
                          {memes
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
                        
                        {!hasNextPage && memes.length > 0 && (
                          <p className="text-muted-foreground">You've reached the end!</p>
                        )}
                      </div>
                    </>
                  )}
                </div>
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