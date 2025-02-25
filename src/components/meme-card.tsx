import React from 'react';
import { Card, CardContent } from '@/components/ui/card';
import Image from 'next/image';
import { ImageIcon } from 'lucide-react';
import { Meme } from '@/redux/features/memes/memesSlice';

export function MemeCard({ meme }: { meme: Meme }) {
  if (!meme) return null;
  
  return (
    <Card className="overflow-hidden hover:shadow-lg transition-all duration-300">
      <CardContent className="p-0">
        <div className="aspect-video relative overflow-hidden">
          {meme.url ? (
            <Image
              src={meme.url}
              alt={meme.title || "Meme image"}
              fill
              className="object-cover transition-transform hover:scale-105 duration-300"
              unoptimized
            />
          ) : (
            <div className="w-full h-full flex items-center justify-center bg-muted">
              <ImageIcon className="h-12 w-12 text-muted-foreground" />
            </div>
          )}
        </div>
        <div className="p-4">
          <h3 className="font-semibold mb-2 truncate">{meme.title || "Untitled meme"}</h3>
          {/* Rest of your component */}
        </div>
      </CardContent>
    </Card>
  );
} 