"use client";

import { useSelector } from "react-redux";
import { RootState } from "@/redux/store";
import { LeftSidebar } from "@/components/home/left-sidebar";
import { RightSidebar } from "@/components/home/right-sidebar";
import { MemeFeed } from "@/components/home/meme-feed";

export default function Home() {
  const { isAuthenticated, user } = useSelector((state: RootState) => state.auth);
  
  return (
    <div className="py-4 md:py-6 max-w-7xl mx-auto px-4">
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left Sidebar */}
        <div className="hidden lg:block lg:col-span-3">
          <LeftSidebar isAuthenticated={isAuthenticated} user={user} />
        </div>
        
        {/* Main Content */}
        <div className="lg:col-span-6">
          <MemeFeed />
        </div>
        
        {/* Right Sidebar */}
        <div className="hidden lg:block lg:col-span-3">
          <RightSidebar />
        </div>
      </div>
    </div>
  );
}
