"use client";

import { useState } from "react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Meme } from "@/redux/features/memes/memesSlice";
import { MemeGrid } from "./meme-grid";

interface ProfileTabsProps {
  uploadedMemes: Meme[];
  savedMemes: Meme[];
  createdMemes: Meme[];
  isLoading: boolean;
  isLoadingCreatedMemes: boolean;
}

export function ProfileTabs({ 
  uploadedMemes, 
  savedMemes, 
  createdMemes, 
  isLoading, 
  isLoadingCreatedMemes 
}: ProfileTabsProps) {
  const [activeTab, setActiveTab] = useState("uploaded");
  
  return (
    <Tabs defaultValue="uploaded" onValueChange={setActiveTab}>
      <TabsList className="grid grid-cols-3 mb-6">
        <TabsTrigger value="uploaded">Uploaded</TabsTrigger>
        <TabsTrigger value="created">Created</TabsTrigger>
        <TabsTrigger value="saved">Saved</TabsTrigger>
      </TabsList>
      
      <TabsContent value="uploaded">
        {isLoading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {[1, 2, 3, 4, 5, 6].map((i) => (
              <Card key={i} className="overflow-hidden">
                <Skeleton className="h-[200px] w-full" />
                <div className="p-4">
                  <Skeleton className="h-5 w-3/4 mb-2" />
                  <Skeleton className="h-4 w-1/2" />
                </div>
              </Card>
            ))}
          </div>
        ) : uploadedMemes.length === 0 ? (
          <div className="text-center py-12 bg-muted/30 rounded-lg">
            <h3 className="text-lg font-semibold mb-2">No memes uploaded yet</h3>
            <p className="text-muted-foreground">
              Upload your first meme to see it here
            </p>
          </div>
        ) : (
          <MemeGrid memes={uploadedMemes} />
        )}
      </TabsContent>
      
      <TabsContent value="created">
        {isLoadingCreatedMemes ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {[1, 2, 3, 4, 5, 6].map((i) => (
              <Card key={i} className="overflow-hidden">
                <Skeleton className="h-[200px] w-full" />
                <div className="p-4">
                  <Skeleton className="h-5 w-3/4 mb-2" />
                  <Skeleton className="h-4 w-1/2" />
                </div>
              </Card>
            ))}
          </div>
        ) : createdMemes.length === 0 ? (
          <div className="text-center py-12 bg-muted/30 rounded-lg">
            <h3 className="text-lg font-semibold mb-2">No memes created yet</h3>
            <p className="text-muted-foreground">
              Create your first meme to see it here
            </p>
          </div>
        ) : (
          <MemeGrid memes={createdMemes} />
        )}
      </TabsContent>
      
      <TabsContent value="saved">
        {isLoading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {[1, 2, 3, 4, 5, 6].map((i) => (
              <Card key={i} className="overflow-hidden">
                <Skeleton className="h-[200px] w-full" />
                <div className="p-4">
                  <Skeleton className="h-5 w-3/4 mb-2" />
                  <Skeleton className="h-4 w-1/2" />
                </div>
              </Card>
            ))}
          </div>
        ) : savedMemes.length === 0 ? (
          <div className="text-center py-12 bg-muted/30 rounded-lg">
            <h3 className="text-lg font-semibold mb-2">No saved memes yet</h3>
            <p className="text-muted-foreground">
              Save memes you like to see them here
            </p>
          </div>
        ) : (
          <MemeGrid memes={savedMemes} />
        )}
      </TabsContent>
    </Tabs>
  );
} 