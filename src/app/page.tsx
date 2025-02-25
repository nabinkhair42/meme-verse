"use client";

import { useEffect } from "react";
import { useDispatch, useSelector } from "react-redux";
import { AppDispatch, RootState } from "@/redux/store";
import { fetchTrendingMemes } from "@/redux/features/memes/memesSlice";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import Image from "next/image";
import Link from "next/link";
import { Heart, MessageCircle, TrendingUp, Zap, Award } from "lucide-react";
import { motion } from "framer-motion";
import { Skeleton } from "@/components/ui/skeleton";
import { imgflipService } from "@/services/api";

export default function Home() {
  const dispatch = useDispatch<AppDispatch>();
  const { trending, status, error } = useSelector((state: RootState) => state.memes);

  useEffect(() => {
    const fetchTrendingMemes = async () => {
      if (status === "idle" || trending.length === 0) {
        try {
          const trendingMemes = await imgflipService.getTrendingMemes();
          dispatch({ type: 'memes/setTrending', payload: trendingMemes });
        } catch (error) {
          console.error("Error fetching trending memes:", error);
        }
      }
    };
    
    fetchTrendingMemes();
  }, [status, trending.length, dispatch]);

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
    <div className="py-8 md:py-12 max-w-7xl mx-auto px-4">
      {/* Hero Section */}
      <section className="py-8 md:py-12">
        <motion.div 
          className="flex flex-col items-center text-center gap-6 max-w-3xl mx-auto"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
        >
          <h1 className="text-4xl md:text-5xl font-bold tracking-tight">
            Welcome to <span className="text-primary">MemeVerse</span>
          </h1>
          <p className="text-xl text-muted-foreground max-w-2xl">
            Discover, create, and share the funniest memes on the internet. Join our community of meme enthusiasts today!
          </p>
          <div className="flex flex-wrap gap-4 justify-center">
            <Button size="lg" asChild>
              <Link href="/explore">Explore Memes</Link>
            </Button>
            <Button size="lg" variant="outline" asChild>
              <Link href="/generate">Create a Meme</Link>
            </Button>
          </div>
        </motion.div>
      </section>
      
      {/* Trending Section */}
      <section className="py-8 md:py-12">
        <div className="space-y-6">
          <div className="flex items-center justify-between mb-2">
            <h2 className="text-2xl md:text-3xl font-bold flex items-center gap-2">
              <TrendingUp className="h-6 w-6 text-primary" />
              Trending Memes
            </h2>
            <Button variant="ghost" asChild>
              <Link href="/explore">View All</Link>
            </Button>
          </div>
          
          {status === "loading" && (
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
          
          {status === "failed" && (
            <div className="text-center py-12 bg-muted/30 rounded-lg">
              <p className="text-lg text-red-500">Failed to load memes: {error}</p>
              <Button 
                onClick={() => dispatch(fetchTrendingMemes())}
                variant="outline"
                className="mt-4"
              >
                Try Again
              </Button>
            </div>
          )}
          
          {status === "succeeded" && (
            <motion.div 
              className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6"
              variants={container}
              initial="hidden"
              animate="show"
            >
              {trending.map((meme) => (
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
            </motion.div>
          )}
        </div>
      </section>
      
      {/* Features Section */}
      <section className="py-8 md:py-12">
        <h2 className="text-2xl md:text-3xl font-bold mb-8 text-center">Why MemeVerse?</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <Card>
            <CardContent className="pt-6">
              <div className="mb-4 rounded-full bg-primary/10 p-3 w-fit">
                <TrendingUp className="h-6 w-6 text-primary" />
              </div>
              <h3 className="font-semibold text-lg mb-2">Discover Trending</h3>
              <p className="text-muted-foreground">
                Find the most popular and viral memes that everyone is talking about.
              </p>
            </CardContent>
          </Card>
          
          <Card>
            <CardContent className="pt-6">
              <div className="mb-4 rounded-full bg-primary/10 p-3 w-fit">
                <Zap className="h-6 w-6 text-primary" />
              </div>
              <h3 className="font-semibold text-lg mb-2">Easy Creation</h3>
              <p className="text-muted-foreground">
                Create memes in seconds with our intuitive meme generator. No design skills needed!
              </p>
            </CardContent>
          </Card>
          
          <Card>
            <CardContent className="pt-6">
              <div className="mb-4 rounded-full bg-primary/10 p-3 w-fit">
                <Award className="h-6 w-6 text-primary" />
              </div>
              <h3 className="font-semibold text-lg mb-2">Create & Share</h3>
              <p className="text-muted-foreground">
                Easily upload your own memes and share them instantly with friends and the MemeVerse community.
              </p>
            </CardContent>
          </Card>
        </div>
      </section>
      
      {/* Call to Action */}
      <section className="py-8 md:py-12">
        <div className="bg-accent rounded-lg p-8 text-center">
          <h2 className="text-2xl font-bold mb-4">Ready to join the fun?</h2>
          <p className="text-muted-foreground mb-6 max-w-2xl mx-auto">
            Start exploring thousands of memes, upload your own creations, and become part of our growing meme community.
          </p>
          <Button size="lg" asChild>
            <Link href="/explore">Get Started Now</Link>
          </Button>
        </div>
      </section>
    </div>
  );
}
