"use client"

import { Button } from "@/components/ui/button"
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Skeleton } from "@/components/ui/skeleton"
import { Badge } from "@/components/ui/badge"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Separator } from "@/components/ui/separator"
import { memeService } from "@/services/api"
import { useQuery } from "@tanstack/react-query"
import { Heart, MessageCircle, RefreshCcw, TrendingUp } from "lucide-react"
import Image from "next/image"
import Link from "next/link"
import { useState } from "react"

export function RightSidebar() {
  const [timeframe, setTimeframe] = useState<"day" | "week" | "month">("week")

  const {
    data: trendingMemes,
    status,
    refetch,
    isRefetching,
  } = useQuery({
    queryKey: ["trending-memes-sidebar", timeframe],
    queryFn: async () => {
      try {
        console.log(`Fetching trending memes for sidebar (${timeframe})`)
        const response = await memeService.getTrendingMemes(1, 5, timeframe)
        console.log("Trending API response:", response)
        return response
      } catch (error) {
        console.error("Error using trending API, falling back to regular API:", error)
        return await memeService.getMemes({
          sort: "likes",
          limit: 5,
        })
      }
    },
    retry: 1,
    staleTime: 5 * 60 * 1000, // 5 minutes
  })

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
          ) : trendingMemes && (trendingMemes.data || trendingMemes.memes)?.length > 0 ? (
            <TrendingMemesList memes={trendingMemes.data || trendingMemes.memes || []} />
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

function TrendingMemesList({ memes }: { memes: any[] }) {
  return (
    <div className="space-y-4 py-2">
      {memes.slice(0, 5).map((meme: any, index: number) => (
        <Link href={`/meme/${meme.id}`} key={meme.id} className="group block">
          <div className="flex gap-3 p-3 rounded-lg transition-all hover:bg-accent group-hover:shadow-sm">
            <div className="relative h-20 w-20 rounded-md overflow-hidden flex-shrink-0 bg-muted">
              <Image
                src={meme.url || meme.imageUrl}
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
                  <span>{(meme.commentCount || meme.comments?.length || 0).toLocaleString()}</span>
                </div>
              </div>
            </div>
          </div>
        </Link>
      ))}
    </div>
  )
}

