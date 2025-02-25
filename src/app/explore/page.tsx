"use client";

import { useEffect, useState } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { useDispatch, useSelector } from "react-redux";
import { AppDispatch, RootState } from "@/redux/store";
import { fetchMemesByCategory, CATEGORIES } from "@/redux/features/memes/memesSlice";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import Image from "next/image";
import Link from "next/link";
import { Heart, MessageCircle, ChevronDown, Filter, SlidersHorizontal, Search as SearchIcon, X, Loader2 } from "lucide-react";
import { motion } from "framer-motion";
import { Badge } from "@/components/ui/badge";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
  SheetClose,
  SheetFooter,
} from "@/components/ui/sheet";
import { Skeleton } from "@/components/ui/skeleton";
import { useInfiniteQuery } from "@tanstack/react-query";
import { useInView } from "react-intersection-observer";
import { useDebounce } from "@/hooks/useDebounce";
import { memeService } from "@/services/api";
import { Meme } from "@/redux/features/memes/memesSlice";

export default function ExplorePage() {
  const dispatch = useDispatch<AppDispatch>();
  const { items, status, error } = useSelector((state: RootState) => state.memes);
  const router = useRouter();
  const searchParams = useSearchParams();
  
  const [category, setCategory] = useState(searchParams.get("category") || "all");
  const [sort, setSort] = useState(searchParams.get("sort") || "newest");
  const [searchInput, setSearchInput] = useState(searchParams.get("q") || "");
  
  // Debounce search to prevent too many API calls
  const debouncedSearch = useDebounce(searchInput, 500);
  
  // InfiniteQuery for pagination with API
  const {
    data,
    fetchNextPage,
    hasNextPage,
    isFetchingNextPage,
    status: apiStatus,
    error: apiError
  } = useInfiniteQuery({
    queryKey: ['memes', category, sort, debouncedSearch],
    queryFn: async ({ pageParam = 1 }) => {
      return await memeService.getMemes({
        category: category !== 'all' ? category : undefined,
        search: debouncedSearch || undefined,
        sort: mapSortValue(sort),
        page: pageParam,
        limit: 9
      });
    },
    getNextPageParam: (lastPage) => {
      const { pagination } = lastPage;
      return pagination.page < pagination.totalPages ? pagination.page + 1 : undefined;
    },
    initialPageParam: 1
  });
  
  // Helper function to map UI sort values to API sort values
  const mapSortValue = (sortValue: string) => {
    switch (sortValue) {
      case 'newest': return 'date';
      case 'popular': return 'likes';
      case 'comments': return 'comments';
      default: return 'date';
    }
  };
  
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
  
  // Update URL when filters change
  useEffect(() => {
    const params = new URLSearchParams();
    if (category !== "all") params.set("category", category);
    if (sort !== "newest") params.set("sort", sort);
    if (debouncedSearch) params.set("q", debouncedSearch);
    
    const newUrl = params.toString() ? `?${params.toString()}` : "";
    router.push(`/explore${newUrl}`, { scroll: false });
  }, [category, sort, debouncedSearch, router]);
  
  // Setup intersection observer for infinite scroll
  const { ref, inView } = useInView();
  
  useEffect(() => {
    if (inView && hasNextPage && !isFetchingNextPage) {
      fetchNextPage();
    }
  }, [inView, hasNextPage, isFetchingNextPage, fetchNextPage]);
  
  // Handle search submission
  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    // The debouncedSearch will update automatically
  };
  
  // Clear all filters
  const clearFilters = () => {
    setCategory("all");
    setSort("newest");
    setSearchInput("");
  };
  
  // Flatten all pages of memes for rendering
  const allMemes = data?.pages.flatMap(page => page.memes) || [];
  
  // Type the state properly
  const [allMemesState, setAllMemesState] = useState<Meme[]>([]);
  
  return (
    <div className="py-8 md:py-12 max-w-7xl mx-auto px-4">
      <div className="flex flex-col space-y-8">
        <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
          <h1 className="text-3xl font-bold">Explore Memes</h1>
          
          {/* Search - Desktop */}
          <div className="hidden md:flex w-full max-w-sm items-center space-x-2">
            <div className="flex flex-col gap-4 mb-6">
              <div className="flex flex-col sm:flex-row gap-4">
                <div className="relative flex-1">
                  <form onSubmit={handleSearch} className="flex w-full">
                    <div className="relative flex-1">
                      <SearchIcon className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                      <Input
                        type="text"
                        placeholder="Search memes..."
                        className="pl-10 pr-4 w-full"
                        value={searchInput}
                        onChange={(e) => setSearchInput(e.target.value)}
                        onKeyDown={(e) => {
                          if (e.key === 'Enter') {
                            e.preventDefault();
                            handleSearch(e);
                          }
                        }}
                      />
                      {searchInput && (
                        <button
                          type="button"
                          onClick={() => setSearchInput("")}
                          className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                        >
                          <X className="h-4 w-4" />
                        </button>
                      )}
                    </div>
                    <Button type="submit" className="ml-2">
                      Search
                    </Button>
                  </form>
                </div>
                
                <div className="flex gap-2">
                  <Select value={category} onValueChange={setCategory}>
                    <SelectTrigger className="w-[180px]">
                      <SelectValue placeholder="Category" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Categories</SelectItem>
                      {CATEGORIES.map((cat) => (
                        <SelectItem key={cat.value} value={cat.value}>
                          {cat.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  
                  <Select value={sort} onValueChange={setSort}>
                    <SelectTrigger className="w-[180px]">
                      <SelectValue placeholder="Sort by" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="newest">Newest</SelectItem>
                      <SelectItem value="popular">Most Popular</SelectItem>
                      <SelectItem value="comments">Most Comments</SelectItem>
                    </SelectContent>
                  </Select>
                  
                  <Button variant="outline" onClick={clearFilters} className="hidden sm:flex">
                    Clear
                  </Button>
                </div>
              </div>
              
              {/* Mobile clear button */}
              <Button variant="outline" onClick={clearFilters} className="sm:hidden">
                Clear Filters
              </Button>
              
              {/* Active filters */}
              {(category !== "all" || sort !== "newest" || searchInput) && (
                <div className="flex flex-wrap gap-2 mt-2">
                  {category !== "all" && (
                    <Badge variant="secondary" className="px-3 py-1">
                      Category: {category}
                      <button 
                        className="ml-2 hover:text-primary"
                        onClick={() => setCategory("all")}
                      >
                        <X className="h-3 w-3" />
                      </button>
                    </Badge>
                  )}
                  
                  {sort !== "newest" && (
                    <Badge variant="secondary" className="px-3 py-1">
                      Sort: {sort}
                      <button 
                        className="ml-2 hover:text-primary"
                        onClick={() => setSort("newest")}
                      >
                        <X className="h-3 w-3" />
                      </button>
                    </Badge>
                  )}
                  
                  {searchInput && (
                    <Badge variant="secondary" className="px-3 py-1">
                      Search: {searchInput}
                      <button 
                        className="ml-2 hover:text-primary"
                        onClick={() => setSearchInput("")}
                      >
                        <X className="h-3 w-3" />
                      </button>
                    </Badge>
                  )}
                </div>
              )}
            </div>
          </div>
          
          {/* Mobile Filters Button */}
          <div className="flex md:hidden w-full gap-2">
            <div className="relative flex-1">
              <SearchIcon className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input
                type="text"
                placeholder="Search memes..."
                className="flex-1"
                value={searchInput}
                onChange={(e) => setSearchInput(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    e.preventDefault();
                    const target = e.target as HTMLInputElement;
                    setSearchInput(target.value);
                  }
                }}
              />
            </div>
            
            <Sheet>
              <SheetTrigger asChild>
                <Button variant="outline" size="icon">
                  <SlidersHorizontal className="h-4 w-4" />
                  <span className="sr-only">Open filters</span>
                </Button>
              </SheetTrigger>
              <SheetContent>
                <SheetHeader>
                  <SheetTitle>Filter Memes</SheetTitle>
                </SheetHeader>
                <div className="py-6 space-y-6">
                  <div className="space-y-3">
                    <h3 className="text-sm font-medium">Category</h3>
                    <Select value={category} onValueChange={setCategory}>
                      <SelectTrigger>
                        <SelectValue placeholder="Select a category" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">All Categories</SelectItem>
                        {CATEGORIES.map((cat) => (
                          <SelectItem key={cat.value} value={cat.value}>
                            {cat.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  
                  <div className="space-y-3">
                    <h3 className="text-sm font-medium">Sort By</h3>
                    <Select value={sort} onValueChange={setSort}>
                      <SelectTrigger>
                        <SelectValue placeholder="Sort by" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="newest">Newest First</SelectItem>
                        <SelectItem value="oldest">Oldest First</SelectItem>
                        <SelectItem value="popular">Most Popular</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
                <SheetFooter>
                  <SheetClose asChild>
                    <Button onClick={clearFilters} variant="outline" className="w-full">
                      Clear Filters
                    </Button>
                  </SheetClose>
                  <SheetClose asChild>
                    <Button className="w-full">Apply Filters</Button>
                  </SheetClose>
                </SheetFooter>
              </SheetContent>
            </Sheet>
          </div>
        </div>
        
        {/* Desktop Filters */}
        <div className="hidden md:flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Select value={category} onValueChange={setCategory}>
              <SelectTrigger className="w-[180px]">
                <SelectValue placeholder="Select a category" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Categories</SelectItem>
                {CATEGORIES.map((cat) => (
                  <SelectItem key={cat.value} value={cat.value}>
                    {cat.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            
            <Select value={sort} onValueChange={setSort}>
              <SelectTrigger className="w-[150px]">
                <SelectValue placeholder="Sort by" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="newest">Newest First</SelectItem>
                <SelectItem value="oldest">Oldest First</SelectItem>
                <SelectItem value="popular">Most Popular</SelectItem>
              </SelectContent>
            </Select>
            
            {(category !== "all" || sort !== "newest" || searchInput) && (
              <Button variant="ghost" onClick={clearFilters} className="h-9 px-3">
                <X className="mr-1 h-4 w-4" />
                Clear
              </Button>
            )}
          </div>
        </div>
        
        {/* Active Filters */}
        {(category !== "all" || searchInput) && (
          <div className="flex flex-wrap gap-2">
            {category !== "all" && (
              <Badge variant="secondary" className="px-3 py-1">
                {CATEGORIES.find(cat => cat.value === category)?.label || "Category"}
                <button 
                  className="ml-2 hover:text-primary"
                  onClick={() => setCategory("all")}
                >
                  <X className="h-3 w-3" />
                </button>
              </Badge>
            )}
            
            {searchInput && (
              <Badge variant="secondary" className="px-3 py-1">
                Search: {searchInput}
                <button 
                  className="ml-2 hover:text-primary"
                  onClick={() => {
                    setSearchInput("");
                  }}
                >
                  <X className="h-3 w-3" />
                </button>
              </Badge>
            )}
          </div>
        )}
        
        {/* Status Messages */}
        {apiStatus === "pending" && !data && (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {[1, 2, 3, 4, 5, 6].map((i) => (
              <Card key={i} className="overflow-hidden">
                <CardContent className="p-0">
                  <Skeleton className="aspect-video w-full" />
                  <div className="p-4 space-y-3">
                    <Skeleton className="h-6 w-3/4" />
                    <div className="flex justify-between">
                      <Skeleton className="h-4 w-1/3" />
                      <div className="flex gap-3">
                        <Skeleton className="h-4 w-10" />
                        <Skeleton className="h-4 w-10" />
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
        
        {apiStatus === "error" && (
          <div className="text-center py-12 bg-muted/30 rounded-lg">
            <p className="text-lg text-red-500 mb-4">Failed to load memes: {apiError.message}</p>
            <Button onClick={() => window.location.reload()} variant="outline">
              Try Again
            </Button>
          </div>
        )}
        
        {apiStatus === "success" && allMemes.length === 0 && (
          <div className="text-center py-12 bg-muted/30 rounded-lg">
            <Filter className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
            <h3 className="text-lg font-semibold mb-2">No memes found</h3>
            <p className="text-muted-foreground mb-6 max-w-md mx-auto">
              We couldn't find any memes matching your filters. Try adjusting your search or category selection.
            </p>
            <Button onClick={clearFilters}>Clear Filters</Button>
          </div>
        )}
        
        {apiStatus === "success" && allMemes.length > 0 && (
          <motion.div 
            className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6"
            variants={container}
            initial="hidden"
            animate="show"
          >
            {allMemes.map((meme: Meme) => (
              <motion.div key={meme.id} variants={item}>
                <Link href={`/meme/${meme.id}`}>
                  <Card className="overflow-hidden hover:shadow-lg transition-all duration-300">
                    <CardContent className="p-0">
                      <div className="aspect-video relative overflow-hidden">
                        <Image
                          src={meme.url}
                          alt={meme.title}
                          fill
                          className="object-cover transition-transform hover:scale-105 duration-300"
                          unoptimized
                        />
                      </div>
                      <div className="p-4">
                        <h3 className="font-semibold mb-2 truncate">{meme.title}</h3>
                        <div className="flex justify-between items-center">
                          <p className="text-sm text-muted-foreground">
                            By {meme.author}
                          </p>
                          <div className="flex items-center gap-3">
                            <span className="flex items-center gap-1 text-sm">
                              <Heart className="h-4 w-4" /> {meme.likes}
                            </span>
                            <span className="flex items-center gap-1 text-sm">
                              <MessageCircle className="h-4 w-4" /> {meme.comments.length}
                            </span>
                          </div>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </Link>
              </motion.div>
            ))}
            
            {/* Infinite scroll loading indicator */}
            {hasNextPage && (
              <div 
                ref={ref} 
                className="col-span-full flex justify-center py-8"
              >
                {isFetchingNextPage ? (
                  <div className="flex items-center gap-2">
                    <Loader2 className="h-6 w-6 animate-spin" />
                    <p>Loading more memes...</p>
                  </div>
                ) : (
                  <Button onClick={() => fetchNextPage()} disabled={isFetchingNextPage}>
                    Load More
                  </Button>
                )}
              </div>
            )}
          </motion.div>
        )}
      </div>
    </div>
  );
} 