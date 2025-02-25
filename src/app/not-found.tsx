"use client";

import { Button } from "@/components/ui/button";
import Link from "next/link";
import { motion } from "framer-motion";
import Image from "next/image";

export default function NotFound() {
  return (
    <div className="min-h-[80vh] flex flex-col items-center justify-center px-4 py-12">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="text-center max-w-md"
      >
        <div className="mb-8 relative h-64 w-full">
          <Image
            src="https://i.imgflip.com/65efzo.jpg"
            alt="404 Not Found Meme"
            fill
            className="object-contain"
            unoptimized
          />
        </div>
        
        <h1 className="text-4xl font-bold mb-4">404 - Page Not Found</h1>
        <p className="text-muted-foreground mb-8">
          The meme you're looking for seems to have disappeared into the vast internet void. Maybe it was too dank?
        </p>
        
        <div className="flex flex-wrap justify-center gap-4">
          <Button asChild>
            <Link href="/">Return Home</Link>
          </Button>
          <Button variant="outline" asChild>
            <Link href="/explore">Explore Memes</Link>
          </Button>
        </div>
        
        <p className="mt-8 text-sm text-muted-foreground">
          Pro tip: If you're trying to reach a specific meme, check the URL and try again.
        </p>
      </motion.div>
    </div>
  );
} 