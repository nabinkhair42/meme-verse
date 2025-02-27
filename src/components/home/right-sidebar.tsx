"use client"

import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Separator } from "@/components/ui/separator"
import { Skeleton } from "@/components/ui/skeleton"
import { memeService } from "@/services/api"
import { useQuery } from "@tanstack/react-query"
import { Heart, MessageCircle, RefreshCcw, TrendingUp } from "lucide-react"
import Image from "next/image"
import Link from "next/link"
import { useState } from "react"

interface ApiMeme {
  _id?: string;
  id?: string;
  title: string;
  imageUrl?: string;
  url?: string;
  description?: string;
  userId: string;
  username?: string;
  author?: string;
  userAvatar?: string;
  createdAt: string;
  likes?: number;
  commentCount?: number;
  tags?: string[];
  category?: string;
  type?: 'uploaded' | 'generated';
  isLiked?: boolean;
  isSaved?: boolean;
}

interface TrendingMeme {
  _id: string;
  title: string;
  imageUrl: string;
  description?: string;
  userId: string;
  username: string;
  userAvatar: string;
  createdAt: string;
  likes: number;
  commentCount: number;
  tags: string[];
  category?: string;
  type: 'uploaded' | 'generated';
  isLiked: boolean;
  isSaved: boolean;
}

export function RightSidebar() {
  const [timeframe, setTimeframe] = useState<"day" | "week" | "month">("week")

  const {
    data: trendingMemes,
    status,
    refetch,
    isRefetching,
  } = useQuery<TrendingMeme[]>({
    queryKey: ["trending-memes", timeframe],
    queryFn: async () => {
      try {
        const response = await memeService.getTrendingMemes(1, 5, timeframe)
        console.log(`Raw API response for timeframe ${timeframe}:`, response)
        
        // Handle both possible response structures
        let memesToProcess = [];
        
        if (response?.success && response?.data) {
          // Handle the API response structure
          memesToProcess = Array.isArray(response.data) ? response.data : [];
        } else if (response?.data?.memes) {
          memesToProcess = response.data.memes;
        } else if (Array.isArray(response)) {
          memesToProcess = response;
        }
        
        if (memesToProcess.length > 0) {
          console.log(`Processing ${memesToProcess.length} memes for timeframe ${timeframe}:`, memesToProcess)
          
          return memesToProcess.map((meme: ApiMeme) => ({
            _id: meme._id || meme.id || '',
            title: meme.title || 'Untitled Meme',
            imageUrl: meme.imageUrl || meme.url || '',
            description: meme.description,
            userId: meme.userId || '',
            username: meme.username || meme.author || 'Anonymous',
            userAvatar: meme.userAvatar || `https://api.dicebear.com/7.x/avataaars/svg?seed=${meme.username || meme.author || 'anon'}`,
            createdAt: meme.createdAt || new Date().toISOString(),
            likes: typeof meme.likes === 'number' ? meme.likes : 0,
            commentCount: typeof meme.commentCount === 'number' ? meme.commentCount : 0,
            tags: Array.isArray(meme.tags) ? meme.tags : [],
            category: meme.category || 'Uncategorized',
            type: meme.type || 'uploaded',
            isLiked: Boolean(meme.isLiked),
            isSaved: Boolean(meme.isSaved)
          }))
        }
        
        console.log(`No memes found for timeframe ${timeframe}`)
        return []
      } catch (error) {
        console.error(`Error fetching trending memes for timeframe ${timeframe}:`, error)
        throw error
      }
    },
    refetchOnWindowFocus: false,
    staleTime: 1000 * 60 * 5, // Data stays fresh for 5 minutes
    gcTime: 1000 * 60 * 10, // Keep unused data for 10 minutes
    refetchOnMount: false // Don't refetch when component remounts
  })

  console.log(`Current trending memes state for ${timeframe}:`, { status, trendingMemes, isRefetching })

  const handleRefresh = () => {
    refetch()
  }

  const handleTimeframeChange = (newTimeframe: "day" | "week" | "month") => {
    setTimeframe(newTimeframe)
  }

  return (
    <Card className="w-full max-w-sm border-border shadow-sm">
      <CardHeader className="pb-2 space-y-1">
        <div className="flex items-center justify-between">
          <CardTitle className="text-base font-medium flex items-center">
            <TrendingUp className="mr-2 h-4 w-4 text-primary" />
            Trending Memes
          </CardTitle>
          <Button variant="ghost" size="icon" className="h-8 w-8" onClick={handleRefresh} disabled={isRefetching}>
            <RefreshCcw className={`h-4 w-4 ${isRefetching ? "animate-spin" : ""}`} />
            <span className="sr-only">Refresh</span>
          </Button>
        </div>
        <div className="flex space-x-1 text-xs">
          <Button
            variant={timeframe === "day" ? "default" : "outline"}
            size="sm"
            className="h-7 text-xs px-2.5"
            onClick={() => handleTimeframeChange("day")}
          >
            Today
          </Button>
          <Button
            variant={timeframe === "week" ? "default" : "outline"}
            size="sm"
            className="h-7 text-xs px-2.5"
            onClick={() => handleTimeframeChange("week")}
          >
            This Week
          </Button>
          <Button
            variant={timeframe === "month" ? "default" : "outline"}
            size="sm"
            className="h-7 text-xs px-2.5"
            onClick={() => handleTimeframeChange("month")}
          >
            This Month
          </Button>
        </div>
      </CardHeader>
      <Separator />
      <CardContent className="p-0">
        <ScrollArea className="h-[400px] px-4 py-2">
          {status === "pending" || isRefetching ? (
            <TrendingSkeleton />
          ) : status === "error" ? (
            <ErrorState onRetry={handleRefresh} />
          ) : trendingMemes?.length > 0 ? (
            <TrendingMemesList memes={trendingMemes} />
          ) : (
            <EmptyState />
          )}
        </ScrollArea>
      </CardContent>
      <Separator />
      <CardFooter className="p-4">
        <Button variant="outline" size="sm" className="w-full" asChild>
          <Link href="/trending">
            <TrendingUp className="mr-2 h-4 w-4" />
            View All Trending
          </Link>
        </Button>
      </CardFooter>
    </Card>
  )
}

function TrendingSkeleton() {
  return (
    <div className="space-y-4 py-2">
      {[1, 2, 3, 4, 5].map((i) => (
        <div key={i} className="flex gap-3 animate-pulse">
          <Skeleton className="h-20 w-20 rounded-md" />
          <div className="flex-1 py-1">
            <Skeleton className="h-4 w-[85%] mb-2" />
            <Skeleton className="h-4 w-[70%] mb-2" />
            <div className="flex items-center gap-3 mt-2">
              <Skeleton className="h-3 w-12" />
              <Skeleton className="h-3 w-12" />
            </div>
          </div>
        </div>
      ))}
    </div>
  )
}

function ErrorState({ onRetry }: { onRetry: () => void }) {
  return (
    <div className="text-center py-12 px-4">
      <div className="inline-flex items-center justify-center w-12 h-12 rounded-full bg-red-100 text-red-500 mb-4">
        <TrendingUp className="h-6 w-6" />
      </div>
      <h3 className="text-base font-medium mb-2">Failed to load trending memes</h3>
      <p className="text-muted-foreground text-sm mb-4">We couldn't load the trending memes. Please try again later.</p>
      <Button onClick={onRetry}>
        <RefreshCcw className="mr-2 h-4 w-4" />
        Try Again
      </Button>
    </div>
  )
}

function EmptyState() {
  return (
    <div className="text-center py-12 px-4">
      <div className="inline-flex items-center justify-center w-12 h-12 rounded-full bg-primary/10 text-primary mb-4">
        <TrendingUp className="h-6 w-6" />
      </div>
      <h3 className="text-base font-medium mb-2">No trending memes</h3>
      <p className="text-muted-foreground text-sm mb-4">
        There are no trending memes available right now. Check back later!
      </p>
    </div>
  )
}

function TrendingMemesList({ memes }: { memes: TrendingMeme[] }) {
  console.log("TrendingMemesList received memes:", memes)
  return (
    <div className="space-y-4 py-2">
      {memes?.slice(0, 5).map((meme: TrendingMeme, index: number) => {
        console.log(`Rendering meme ${index}:`, meme)
        return (
          <Link href={`/meme/${meme._id}`} key={meme._id} className="group block">
            <div className="flex gap-3 p-3 rounded-lg transition-all hover:bg-accent group-hover:shadow-sm">
              <div className="relative h-20 w-20 rounded-md overflow-hidden flex-shrink-0 bg-muted">
                <Image
                  src={meme.imageUrl}
                  alt={meme.title}
                  fill
                  className="object-cover transition-all duration-300 group-hover:scale-105"
                  sizes="80px"
                  unoptimized
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/30 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center mb-1">
                  <Badge variant="outline" className="text-xs font-normal px-1.5 py-0">
                    #{index + 1}
                  </Badge>
                </div>
                <h4 className="font-medium text-sm line-clamp-2 group-hover:text-primary transition-colors">
                  {meme.title}
                </h4>
                <div className="flex items-center gap-3 text-xs text-muted-foreground mt-2">
                  <div className="flex items-center">
                    <Heart className="h-3.5 w-3.5 mr-1 text-red-500" />
                    <span>{meme.likes?.toLocaleString() || 0}</span>
                  </div>
                  <div className="flex items-center">
                    <MessageCircle className="h-3.5 w-3.5 mr-1 text-blue-500" />
                    <span>{meme.commentCount?.toLocaleString() || 0}</span>
                  </div>
                </div>
              </div>
            </div>
          </Link>
        )
      })}
    </div>
  )
}

