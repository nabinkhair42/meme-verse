"use client";

import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Badge } from "@/components/ui/badge";
import { Heart, MessageSquare, ImageIcon, RefreshCcw, Loader2 } from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import { useEffect, useState, useCallback } from "react";
import { useInView } from "react-intersection-observer";

interface Meme {
  id: string;
  title: string;
  imageUrl: string;
  likes: number;
  commentCount: number;
  createdAt: string;
  category?: string;
  description?: string;
  author?: string;
  authorId?: string;
  type?: "uploaded" | "generated" | "saved";
}

interface ApiResponse {
  success: boolean;
  data: {
    memes: Meme[];
    pagination: {
      total: number;
      page: number;
      limit: number;
      totalPages: number;
    };
  };
}

interface ProfileMemeGridProps {
  userId: string;
  type: "uploaded" | "generated" | "saved";
}

export default function ProfileMemeGrid({ userId, type }: ProfileMemeGridProps) {
  const [memes, setMemes] = useState<Meme[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isInitialLoad, setIsInitialLoad] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);
  
  const { ref, inView } = useInView({
    threshold: 0,
    rootMargin: "200px",
    delay: 100,
  });
  
  const fetchMemes = useCallback(async (pageNum: number, isInitial: boolean = false) => {
    if (isLoading) return;
    
    try {
      setIsLoading(true);
      if (isInitial) setError(null);
      
      const endpoint = `/api/auth/profile/${userId}/${type === "saved" ? "saved" : type === "generated" ? "generated" : "memes"}?page=${pageNum}&limit=9${type === "uploaded" ? "&type=uploaded" : ""}`;
      
      const response = await fetch(endpoint, {
        headers: {
          'Cache-Control': 'no-store'
        }
      });
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || `Failed to fetch ${type} memes`);
      }
      
      const result: ApiResponse = await response.json();
      
      if (!result.success) {
        throw new Error(result.data as any || `Failed to fetch ${type} memes`);
      }
      
      const { memes: newMemes, pagination } = result.data;
      
      if (newMemes?.length) {
        const processedMemes = newMemes.map(meme => ({
          ...meme,
          likes: meme.likes || 0,
          commentCount: meme.commentCount || 0,
          category: meme.category || (type === "generated" ? "Generated" : "Uncategorized"),
          author: meme.author || "Anonymous",
          type
        }));
        
        setMemes(prev => isInitial ? processedMemes : [...prev, ...processedMemes]);
        setHasMore(pagination.page < pagination.totalPages);
      } else {
        setHasMore(false);
      }
      
    } catch (error) {
      console.error(`Error fetching ${type} memes:`, error);
      setError((error as Error).message || `Failed to load ${type} memes`);
    } finally {
      setIsLoading(false);
      if (isInitial) setIsInitialLoad(false);
    }
  }, [userId, type]);
  
  useEffect(() => {
    setMemes([]);
    setPage(1);
    setHasMore(true);
    setError(null);
    setIsInitialLoad(true);
    fetchMemes(1, true);
  }, [userId, type, fetchMemes]);
  
  useEffect(() => {
    if (!inView || isLoading || !hasMore || isInitialLoad) return;
    
    const timer = setTimeout(() => {
      setPage(prev => prev + 1);
      fetchMemes(page + 1, false);
    }, 300);
    
    return () => clearTimeout(timer);
  }, [inView, isLoading, hasMore, page, fetchMemes, isInitialLoad]);
  
  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
    });
  };

  const getEmptyStateMessage = () => {
    switch (type) {
      case "uploaded":
        return {
          message: "No uploaded memes found",
          action: "/create",
          buttonText: "Upload a Meme",
          icon: <ImageIcon className="h-12 w-12 mb-4 text-muted-foreground" />
        };
      case "generated":
        return {
          message: "No generated memes found",
          action: "/generate",
          buttonText: "Generate a Meme",
          icon: <ImageIcon className="h-12 w-12 mb-4 text-muted-foreground" />
        };
      case "saved":
        return {
          message: "No saved memes found",
          action: "/explore",
          buttonText: "Explore Memes",
          icon: <Heart className="h-12 w-12 mb-4 text-muted-foreground" />
        };
    }
  };

  if (error) {
    return (
      <div className="text-center py-12 bg-destructive/5 rounded-lg">
        <ImageIcon className="h-12 w-12 mx-auto mb-4 text-destructive/60" />
        <p className="text-destructive mb-6">{error}</p>
        <Button 
          onClick={() => {
            setPage(1);
            setMemes([]);
            setHasMore(true);
            setError(null);
            fetchMemes(1, true);
          }}
          variant="outline"
          className="group"
        >
          <RefreshCcw className="h-4 w-4 mr-2" />
          Try Again
        </Button>
      </div>
    );
  }

  // Loading skeleton
  if (isInitialLoad) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {[...Array(6)].map((_, i) => (
          <Card key={`skeleton-${i}`} className="overflow-hidden">
            <Skeleton className="aspect-square" />
            <CardContent className="p-4 space-y-2">
              <Skeleton className="h-6 w-3/4" />
              <Skeleton className="h-4 w-1/2" />
              <div className="flex justify-between items-center">
                <div className="space-x-2">
                  <Skeleton className="h-4 w-12 inline-block" />
                  <Skeleton className="h-4 w-12 inline-block" />
                </div>
                <Skeleton className="h-4 w-16" />
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    );
  }

  if (memes.length === 0 && !isLoading) {
    const emptyState = getEmptyStateMessage();
    return (
      <div className="text-center py-12 bg-muted/30 rounded-lg">
        {emptyState.icon}
        <p className="text-lg font-medium mb-2">{emptyState.message}</p>
        <p className="text-muted-foreground mb-6">Start creating and sharing your memes with the world!</p>
        <Link href={emptyState.action}>
          <Button>{emptyState.buttonText}</Button>
        </Link>
      </div>
    );
  }

  return (
    <div>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {memes.map((meme) => (
          <Link key={meme.id} href={`/meme/${meme.id}`}>
            <Card className="overflow-hidden h-full hover:shadow-lg transition-all duration-300 border-border/40">
              <div className="aspect-square relative">
                <Image
                  src={meme.imageUrl}
                  alt={meme.title}
                  fill
                  className="object-cover"
                  sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
                  priority={false}
                  loading="lazy"
                  quality={75}
                />
              </div>
              <CardContent className="p-4">
                <div className="space-y-2">
                  <h3 className="font-medium line-clamp-1 group-hover:text-primary">
                    {meme.title}
                  </h3>
                  {meme.description && (
                    <p className="text-sm text-muted-foreground line-clamp-2">
                      {meme.description}
                    </p>
                  )}
                  <div className="flex items-center justify-between text-sm">
                    <div className="flex items-center gap-3 text-muted-foreground">
                      <span className="flex items-center">
                        <Heart className="h-4 w-4 mr-1" />
                        {meme.likes}
                      </span>
                      <span className="flex items-center">
                        <MessageSquare className="h-4 w-4 mr-1" />
                        {meme.commentCount}
                      </span>
                    </div>
                    <Badge variant="secondary" className="text-xs">
                      {meme.category}
                    </Badge>
                  </div>
                  <p className="text-xs text-muted-foreground">
                    {formatDate(meme.createdAt)}
                  </p>
                </div>
              </CardContent>
            </Card>
          </Link>
        ))}
      </div>

      {/* Load more trigger */}
      {hasMore && !isLoading && (
        <div ref={ref} className="flex justify-center mt-8">
          <Button variant="outline" disabled className="opacity-0">
            <Loader2 className="h-4 w-4 mr-2 animate-spin" />
            Loading more...
          </Button>
        </div>
      )}

      {/* Loading more indicator */}
      {isLoading && !isInitialLoad && (
        <div className="flex justify-center mt-8">
          <Button variant="outline" disabled>
            <Loader2 className="h-4 w-4 mr-2 animate-spin" />
            Loading more...
          </Button>
        </div>
      )}
    </div>
  );
} 