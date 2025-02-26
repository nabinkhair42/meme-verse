"use client";

import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Heart, MessageSquare } from "lucide-react";
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
  
  // Configure IntersectionObserver with threshold and rootMargin
  const { ref, inView } = useInView({
    threshold: 0,
    rootMargin: "100px",
    delay: 100, // Add delay to prevent rapid firing
  });
  
  const fetchMemes = useCallback(async (pageNum: number, isInitial: boolean = false) => {
    // Prevent duplicate requests
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
      
      // Process memes only if we have new data
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
  
  // Initial load
  useEffect(() => {
    setMemes([]);
    setPage(1);
    setHasMore(true);
    setError(null);
    setIsInitialLoad(true);
    fetchMemes(1, true);
  }, [userId, type, fetchMemes]);
  
  // Handle infinite scroll with debounce
  useEffect(() => {
    if (!inView || isLoading || !hasMore || isInitialLoad) return;
    
    const timer = setTimeout(() => {
      setPage(prev => prev + 1);
      fetchMemes(page + 1, false);
    }, 300); // Add debounce delay
    
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
  
  if (error) {
    return (
      <div className="text-center py-8">
        <p className="text-red-500 mb-4">{error}</p>
        <Button onClick={() => {
          setPage(1);
          setMemes([]);
          setHasMore(true);
          setError(null);
          fetchMemes(1);
        }}>Try Again</Button>
      </div>
    );
  }
  
  const getEmptyStateMessage = () => {
    switch (type) {
      case "uploaded":
        return {
          message: "No uploaded memes found",
          action: "/create",
          buttonText: "Upload a Meme"
        };
      case "generated":
        return {
          message: "No generated memes found",
          action: "/generate",
          buttonText: "Generate a Meme"
        };
      case "saved":
        return {
          message: "No saved memes found",
          action: "/explore",
          buttonText: "Explore Memes"
        };
    }
  };
  
  return (
    <div>
      {memes.length === 0 && !isLoading && !isInitialLoad ? (
        <div className="text-center py-12">
          <p className="text-muted-foreground mb-4">{getEmptyStateMessage().message}</p>
          <Link href={getEmptyStateMessage().action}>
            <Button>{getEmptyStateMessage().buttonText}</Button>
          </Link>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {memes.map((meme) => (
            <Link href={`/meme/${meme.id}`} key={meme.id}>
              <Card className="overflow-hidden h-full hover:shadow-md transition-shadow">
                <div className="aspect-square relative">
                  <Image
                    src={meme.imageUrl}
                    alt={meme.title}
                    fill
                    className="object-cover"
                    sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
                    loading="lazy"
                    unoptimized
                  />
                </div>
                <div className="p-3">
                  <h3 className="font-medium truncate">{meme.title}</h3>
                  {meme.description && (
                    <p className="text-sm text-muted-foreground truncate mt-1">
                      {meme.description}
                    </p>
                  )}
                  <div className="flex items-center justify-between mt-2 text-sm text-muted-foreground">
                    <div className="flex items-center gap-3">
                      <span className="flex items-center">
                        <Heart className="h-4 w-4 mr-1" />
                        {meme.likes}
                      </span>
                      <span className="flex items-center">
                        <MessageSquare className="h-4 w-4 mr-1" />
                        {meme.commentCount}
                      </span>
                    </div>
                    <span>{formatDate(meme.createdAt)}</span>
                  </div>
                </div>
              </Card>
            </Link>
          ))}
          
          {/* Loading skeletons */}
          {(isLoading || isInitialLoad) && (
            <>
              {[...Array(3)].map((_, i) => (
                <Card key={`skeleton-${i}`} className="overflow-hidden">
                  <Skeleton className="aspect-square" />
                  <div className="p-3">
                    <Skeleton className="h-5 w-3/4 mb-2" />
                    <Skeleton className="h-4 w-1/2" />
                  </div>
                </Card>
              ))}
            </>
          )}
          
          {/* Load more trigger */}
          {hasMore && !isLoading && !isInitialLoad && (
            <div ref={ref} className="h-10 col-span-full" />
          )}
        </div>
      )}
    </div>
  );
} 