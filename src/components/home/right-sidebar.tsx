"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import Image from "next/image";
import Link from "next/link";
import { ImageIcon,  Heart, MessageCircle } from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import { memeService } from "@/services/api";
import { FaFire } from "react-icons/fa";
import { Meme } from "@/redux/features/memes/memesSlice";

export function RightSidebar() {
  // Fetch trending memes
  const { data: trendingMemes, status: trendingStatus } = useQuery({
    queryKey: ['trending-memes-sidebar'],
    queryFn: async () => {
      return await memeService.getMemes({
        sort: 'likes',
        limit: 5
      });
    }
  });
  
  return (
    <div className="space-y-4">
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-base">Create Content</CardTitle>
        </CardHeader>
        <CardContent className="p-4 pt-0">
          <div className="space-y-2">
            <Button className="w-full justify-start" asChild>
              <Link href="/generate">
                <ImageIcon className="mr-2 h-4 w-4" />
                Generate Meme
              </Link>
            </Button>
            <Button variant="outline" className="w-full justify-start" asChild>
              <Link href="/upload">
                <ImageIcon className="mr-2 h-4 w-4" />
                Upload Image
              </Link>
            </Button>
          </div>
        </CardContent>
      </Card>
      
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-base flex items-center">
            <FaFire className="mr-2 h-4 w-4 text-orange-500" />
            Trending Memes
          </CardTitle>
        </CardHeader>
        <CardContent className="p-4 pt-0">
          {trendingStatus === 'pending' ? (
            <div className="space-y-4">
              {[1, 2, 3].map((i) => (
                <div key={i} className="flex gap-3">
                  <Skeleton className="h-16 w-16 rounded" />
                  <div className="flex-1">
                    <Skeleton className="h-4 w-3/4 mb-2" />
                    <Skeleton className="h-3 w-1/2" />
                  </div>
                </div>
              ))}
            </div>
          ) : trendingMemes ? (
            <div className="space-y-4">
              {trendingMemes.memes?.slice(0, 5).map((meme: Meme) => (
                <Link href={`/meme/${meme.id}`} key={meme.id} className="flex gap-3 group">
                  <div className="relative h-16 w-16 rounded overflow-hidden flex-shrink-0">
                    <Image
                      src={meme.url}
                      alt={meme.title}
                      fill
                      className="object-cover group-hover:scale-105 transition-transform"
                      unoptimized
                    />
                  </div>
                  <div className="flex-1">
                    <h4 className="font-medium line-clamp-2 group-hover:text-primary transition-colors">
                      {meme.title}
                    </h4>
                    <div className="flex items-center text-xs text-muted-foreground mt-1">
                      <Heart className="h-3 w-3 mr-1" />
                      <span>{meme.likes}</span>
                      <MessageCircle className="h-3 w-3 ml-2 mr-1" />
                      <span>{meme.comments?.length || 0}</span>
                    </div>
                  </div>
                </Link>
              ))}
              
              <Button variant="ghost" size="sm" className="w-full" asChild>
                <Link href="/trending">
                  View All Trending
                </Link>
              </Button>
            </div>
          ) : (
            <p className="text-muted-foreground">No trending memes available</p>
          )}
        </CardContent>
      </Card>
      
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-base">Popular Categories</CardTitle>
        </CardHeader>
        <CardContent className="p-4 pt-0">
          <div className="flex flex-wrap gap-2">
            {["Programming", "Reactions", "Animals", "Gaming", "Movies", "Wholesome"].map((category) => (
              <Button 
                key={category} 
                variant="outline" 
                size="sm"
                asChild
              >
                <Link href={`/search?category=${category}`}>
                  {category}
                </Link>
              </Button>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
} 