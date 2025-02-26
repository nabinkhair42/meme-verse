"use client";

import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import ProfileMemeGrid from "./profile-meme-grid";

interface ProfileTabsProps {
  userId: string;
}

export function ProfileTabs({ userId }: ProfileTabsProps) {
  return (
    <Tabs defaultValue="uploaded">
      <TabsList className="grid grid-cols-3 mb-6">
        <TabsTrigger value="uploaded">Uploaded</TabsTrigger>
        <TabsTrigger value="generated">Generated</TabsTrigger>
        <TabsTrigger value="saved">Saved</TabsTrigger>
      </TabsList>
      
      <TabsContent value="uploaded">
        <ProfileMemeGrid userId={userId} type="uploaded" />
      </TabsContent>
      
      <TabsContent value="generated">
        <ProfileMemeGrid userId={userId} type="generated" />
      </TabsContent>
      
      <TabsContent value="saved">
        <ProfileMemeGrid userId={userId} type="saved" />
      </TabsContent>
    </Tabs>
  );
} 