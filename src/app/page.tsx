"use client";

import { useSelector } from "react-redux";
import { RootState } from "@/redux/store";
import { LeftSidebar } from "@/components/home/left-sidebar";
import { RightSidebar } from "@/components/home/right-sidebar";
import { MemeFeed } from "@/components/home/meme-feed";
import { ScrollArea } from "@/components/ui/scroll-area";

export default function Home() {
  const { isAuthenticated, user } = useSelector((state: RootState) => state.auth);
  
  return (
    <div className="h-[calc(100vh-64px)] overflow-hidden">
      <div className="max-w-7xl mx-auto px-4 h-full">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 h-full">
          {/* Left Sidebar - Fixed */}
          <div className="hidden lg:block lg:col-span-3 h-[calc(100vh-64px)] pt-6">
            <div className="pr-4 sticky top-[80px] max-h-[calc(100vh-80px)] overflow-y-auto">
              <LeftSidebar isAuthenticated={isAuthenticated} user={user} />
            </div>
          </div>
          
          {/* Main Content - Scrollable */}
          <div className="lg:col-span-6 h-[calc(100vh-64px)] pt-6">
            <ScrollArea className="h-full pb-6">
              <div className="pr-4">
                <MemeFeed />
              </div>
            </ScrollArea>
          </div>
          
          {/* Right Sidebar - Fixed */}
          <div className="hidden lg:block lg:col-span-3 h-[calc(100vh-64px)] pt-6">
            <div className="pl-4 sticky top-[80px] max-h-[calc(100vh-80px)] overflow-y-auto">
              <RightSidebar />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
