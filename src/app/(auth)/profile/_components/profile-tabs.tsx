"use client";

import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ImageIcon, Wand2, Bookmark } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { cn } from "@/lib/utils";
import ProfileMemeGrid from "./profile-meme-grid";

interface ProfileTabsProps {
  userId: string;
}

const tabVariants = {
  hidden: { opacity: 0, y: 20 },
  visible: { opacity: 1, y: 0 },
  exit: { opacity: 0, y: -20 }
};

export function ProfileTabs({ userId }: ProfileTabsProps) {
  return (
    <Tabs defaultValue="uploaded" className="space-y-8">
      <TabsList className="grid grid-cols-3 w-full max-w-2xl mx-auto">
        <TabsTrigger 
          value="uploaded" 
          className="data-[state=active]:bg-primary data-[state=active]:text-primary-foreground transition-all"
        >
          <ImageIcon className="h-4 w-4 mr-2" />
          Uploaded
        </TabsTrigger>
        <TabsTrigger 
          value="generated"
          className="data-[state=active]:bg-primary data-[state=active]:text-primary-foreground transition-all"
        >
          <Wand2 className="h-4 w-4 mr-2" />
          Generated
        </TabsTrigger>
        <TabsTrigger 
          value="saved"
          className="data-[state=active]:bg-primary data-[state=active]:text-primary-foreground transition-all"
        >
          <Bookmark className="h-4 w-4 mr-2" />
          Saved
        </TabsTrigger>
      </TabsList>
      
      <AnimatePresence mode="wait">
        <TabsContent value="uploaded">
          <motion.div
            variants={tabVariants}
            initial="hidden"
            animate="visible"
            exit="exit"
            transition={{ duration: 0.3 }}
          >
            <ProfileMemeGrid userId={userId} type="uploaded" />
          </motion.div>
        </TabsContent>
        
        <TabsContent value="generated">
          <motion.div
            variants={tabVariants}
            initial="hidden"
            animate="visible"
            exit="exit"
            transition={{ duration: 0.3 }}
          >
            <ProfileMemeGrid userId={userId} type="generated" />
          </motion.div>
        </TabsContent>
        
        <TabsContent value="saved">
          <motion.div
            variants={tabVariants}
            initial="hidden"
            animate="visible"
            exit="exit"
            transition={{ duration: 0.3 }}
          >
            <ProfileMemeGrid userId={userId} type="saved" />
          </motion.div>
        </TabsContent>
      </AnimatePresence>
    </Tabs>
  );
} 