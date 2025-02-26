"use client"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Skeleton } from "@/components/ui/skeleton"
import { memeService } from "@/services/api"
import { useQuery } from "@tanstack/react-query"
import { Heart, MessageCircle, TrendingUp } from "lucide-react"
import Image from "next/image"
import Link from "next/link"

export function RightSidebar() {

  const { data: trendingMemes, status: trendingStatus } = useQuery({
    queryKey: ["trending-memes-sidebar"],
    queryFn: async () => {
      try {
        console.log("Fetching trending memes for sidebar")
        const response = await memeService.getTrendingMemes(1, 5, "week")
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

  return (
    <Card className="w-full max-w-sm">
      <CardHeader className="pb-3">
        <CardTitle className="text-lg font-semibold flex items-center">
          <TrendingUp className="mr-2 h-5 w-5 text-primary" />
          Trending Memes
        </CardTitle>
      </CardHeader>
      <CardContent className="p-4 pt-0 space-y-4">
        {trendingStatus === "pending" ? (
          <TrendingSkeleton />
        ) : trendingStatus === "error" ? (
          <ErrorState />
        ) : trendingMemes ? (
          <TrendingMemesList memes={trendingMemes.data || trendingMemes.memes || []} />
        ) : (
          <p className="text-muted-foreground text-sm">No trending memes available</p>
        )}
      </CardContent>
    </Card>
  )
}

function TrendingSkeleton() {
  return (
    <div className="space-y-4">
      {[1, 2, 3].map((i) => (
        <div key={i} className="flex gap-3">
          <Skeleton className="h-16 w-16 rounded-md" />
          <div className="flex-1">
            <Skeleton className="h-4 w-3/4 mb-2" />
            <Skeleton className="h-3 w-1/2" />
          </div>
        </div>
      ))}
    </div>
  )
}

function ErrorState() {
  return (
    <div className="text-center py-4">
      <p className="text-muted-foreground text-sm mb-3">Failed to load trending memes</p>
      <Button variant="outline" size="sm" onClick={() => window.location.reload()}>
        Retry
      </Button>
    </div>
  )
}

function TrendingMemesList({ memes }: { memes: any[] }) {
  return (
    <div className="space-y-4">
      {memes.slice(0, 5).map((meme: any) => (
        <Link href={`/meme/${meme.id}`} key={meme.id} className="group">
          <div className="flex gap-3 p-2 rounded-lg transition-colors hover:bg-accent">
            <div className="relative h-16 w-16 rounded-md overflow-hidden flex-shrink-0">
              <Image
                src={meme.url || meme.imageUrl}
                alt={meme.title}
                fill
                className="object-cover transition-transform group-hover:scale-105"
                unoptimized
              />
            </div>
            <div className="flex-1 min-w-0">
              <h4 className="font-medium text-sm line-clamp-2 group-hover:text-primary transition-colors">
                {meme.title}
              </h4>
              <div className="flex items-center text-xs text-muted-foreground mt-1">
                <Heart className="h-3 w-3 mr-1" />
                <span>{meme.likes || 0}</span>
                <MessageCircle className="h-3 w-3 ml-2 mr-1" />
                <span>{meme.commentCount || meme.comments?.length || 0}</span>
              </div>
            </div>
          </div>
        </Link>
      ))}

      <Button variant="outline" size="sm" className="w-full" asChild>
        <Link href="/trending">View All Trending</Link>
      </Button>
    </div>
  )
}

