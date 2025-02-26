"use client";

import { motion } from "framer-motion";
import { Card, CardContent } from "@/components/ui/card";
import Image from "next/image";
import Link from "next/link";
import { Heart, MessageCircle } from "lucide-react";
import { Meme } from "@/redux/features/memes/memesSlice";
import { format } from "date-fns";

interface MemeGridProps {
  memes: Meme[];
}

export function MemeGrid({ memes }: MemeGridProps) {
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
    <motion.div 
      className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4"
      variants={container}
      initial="hidden"
      animate="show"
    >
      {memes.map((meme) => (
        <motion.div key={meme.id} variants={item}>
          <Link href={`/meme/${meme.id}`}>
            <Card className="overflow-hidden hover:shadow-md transition-shadow">
              <div className="relative aspect-video overflow-hidden bg-muted">
                <Image
                  src={meme.imageUrl}
                  alt={meme.title}
                  fill
                  className="object-cover"
                  unoptimized
                />
              </div>
              <CardContent className="p-4">
                <h3 className="font-medium line-clamp-1 mb-1">{meme.title}</h3>
                <div className="flex justify-between items-center text-sm text-muted-foreground">
                  <div className="flex items-center gap-4">
                    <div className="flex items-center gap-1">
                      <Heart className="h-3 w-3" />
                      <span>{meme.likes || 0}</span>
                    </div>
                    <div className="flex items-center gap-1">
                      <MessageCircle className="h-3 w-3" />
                      <span>{meme.commentCount || 0}</span>
                    </div>
                  </div>
                  <div>
                    {meme.createdAt && (
                      <span>{format(new Date(meme.createdAt), 'MMM d, yyyy')}</span>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>
          </Link>
        </motion.div>
      ))}
    </motion.div>
  );
} 