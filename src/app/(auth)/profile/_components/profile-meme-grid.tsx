"use client";

import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Heart, MessageSquare } from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import { useEffect, useState } from "react";
import { useInView } from "react-intersection-observer";

interface Meme {
  id: string;
  title: string;
  imageUrl: string;
  likes: number;
  commentCount: number;
  createdAt: string;
  category?: string;
}

interface ProfileMemeGridProps {
  userId: string;
  type: "uploaded" | "generated" | "saved";
}

export default function ProfileMemeGrid({ userId, type }: ProfileMemeGridProps) {
  const [memes, setMemes] = useState<Meme[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);
  
  const { ref, inView } = useInView();
  
  const fetchMemes = async (pageNum: number) => {
    try {
      setIsLoading(true);
      setError(null);
      
      let endpoint = "";
      
      // Determine the endpoint based on the type
      if (type === "saved") {
        endpoint = `/api/auth/profile/${userId}/saved?page=${pageNum}&limit=9`;
      } else {
        // For uploaded and generated, use the same endpoint but with a type filter
        endpoint = `/api/auth/profile/${userId}/memes?page=${pageNum}&limit=9&type=${type}`;
      }
      
      const response = await fetch(endpoint);
      
      if (!response.ok) {
        throw new Error("Failed to fetch memes");
      }
      
      const data = await response.json();
      
      // Check if we have pagination info
      const newMemes = data.memes || data;
      const pagination = data.pagination;
      
      if (pageNum === 1) {
        setMemes(newMemes);
      } else {
        setMemes(prev => [...prev, ...newMemes]);
      }
      
      // Determine if there are more memes to load
      if (pagination) {
        setHasMore(pagination.page < pagination.totalPages);
      } else {
        setHasMore(newMemes.length > 0);
      }
      
    } catch (error) {
      console.error(`Error fetching ${type} memes:`, error);
      setError(`Failed to load ${type} memes`);
    } finally {
      setIsLoading(false);
    }
  };
  
  // Initial load
  useEffect(() => {
    setPage(1);
    fetchMemes(1);
  }, [userId, type]);
  
  // Load more when scrolling to the bottom
  useEffect(() => {
    if (inView && !isLoading && hasMore) {
      const nextPage = page + 1;
      setPage(nextPage);
      fetchMemes(nextPage);
    }
  }, [inView, isLoading, hasMore, page]);
  
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
        <Button onClick={() => fetchMemes(1)}>Try Again</Button>
      </div>
    );
  }
  
  return (
    <div>
      {memes.length === 0 && !isLoading ? (
        <div className="text-center py-12">
          <p className="text-muted-foreground mb-2">No {type} memes found</p>
          {type === "uploaded" && (
            <Link href="/create">
              <Button>Upload a Meme</Button>
            </Link>
          )}
          {type === "generated" && (
            <Link href="/generate">
              <Button>Generate a Meme</Button>
            </Link>
          )}
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
                    unoptimized
                  />
                </div>
                <div className="p-3">
                  <h3 className="font-medium truncate">{meme.title}</h3>
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
          {isLoading && (
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
          {hasMore && <div ref={ref} className="h-10" />}
        </div>
      )}
    </div>
  );
} 