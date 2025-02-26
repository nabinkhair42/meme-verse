"use client";

import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import Link from "next/link";
import { Home, Bookmark, User, TrendingUp, Clock, Settings, Search, Hash } from "lucide-react";
import { usePathname } from "next/navigation";

interface LeftSidebarProps {
  isAuthenticated: boolean;
  user: any;
}

export function LeftSidebar({ isAuthenticated, user }: LeftSidebarProps) {
  const pathname = usePathname();
  
  // Popular categories
  const categories = [
    "Programming", "Reactions", "Animals", "Gaming", "Movies", "Wholesome"
  ];
  
  // Check if a path is active
  const isActive = (path: string) => {
    if (path === '/') return pathname === '/';
    return pathname.startsWith(path);
  };
  
  // Check if a category is active
  const isCategoryActive = (category: string) => {
    return pathname === `/category/${category.toLowerCase()}`;
  };
  
  return (
    <div className="space-y-4">
      <Card>
        <CardContent className="p-4">
          {isAuthenticated ? (
            <div className="flex items-center gap-3 mb-6">
              <Avatar className="h-12 w-12">
                <AvatarImage src={user?.avatar} />
                <AvatarFallback>{user?.username?.[0]}</AvatarFallback>
              </Avatar>
              <div>
                <h3 className="font-medium">{user?.username}</h3>
                <p className="text-sm text-muted-foreground">@{user?.username?.toLowerCase()}</p>
              </div>
            </div>
          ) : (
            <div className="mb-6">
              <h3 className="font-medium mb-2">Welcome to MemeVerse!</h3>
              <p className="text-sm text-muted-foreground mb-4">Sign in to like, save, and share memes.</p>
              <div className="flex gap-2">
                <Button asChild size="sm" className="flex-1">
                  <Link href="/login">Login</Link>
                </Button>
                <Button asChild size="sm" variant="outline" className="flex-1">
                  <Link href="/register">Register</Link>
                </Button>
              </div>
            </div>
          )}
          
          <nav className="space-y-1">
            <Button 
              variant={isActive('/') ? "default" : "ghost"} 
              className="w-full justify-start" 
              asChild
            >
              <Link href="/">
                <Home className="mr-2 h-4 w-4" />
                Home
              </Link>
            </Button>
            
            <Button 
              variant={isActive('/search') ? "default" : "ghost"} 
              className="w-full justify-start" 
              asChild
            >
              <Link href="/search">
                <Search className="mr-2 h-4 w-4" />
                Search & Explore
              </Link>
            </Button>
            
            <Button 
              variant={isActive('/trending') ? "default" : "ghost"} 
              className="w-full justify-start" 
              asChild
            >
              <Link href="/trending">
                <TrendingUp className="mr-2 h-4 w-4" />
                Trending
              </Link>
            </Button>
            
            {isAuthenticated && (
              <>
                <Button 
                  variant={isActive('/profile') && !pathname.includes('saved') ? "default" : "ghost"} 
                  className="w-full justify-start" 
                  asChild
                >
                  <Link href="/profile">
                    <User className="mr-2 h-4 w-4" />
                    Profile
                  </Link>
                </Button>
                
                <Button 
                  variant={pathname.includes('saved') ? "default" : "ghost"} 
                  className="w-full justify-start" 
                  asChild
                >
                  <Link href="/profile?tab=saved">
                    <Bookmark className="mr-2 h-4 w-4" />
                    Saved Memes
                  </Link>
                </Button>
                
                <Button 
                  variant={isActive('/settings') ? "default" : "ghost"} 
                  className="w-full justify-start" 
                  asChild
                >
                  <Link href="/settings">
                    <Settings className="mr-2 h-4 w-4" />
                    Settings
                  </Link>
                </Button>
              </>
            )}
          </nav>
        </CardContent>
      </Card>
      
      <Card>
        <CardContent className="p-4">
          <h3 className="font-medium mb-2 flex items-center">
            <Hash className="mr-2 h-4 w-4 text-primary" />
            Categories
          </h3>
          <div className="space-y-1">
            {categories.map((category) => (
              <Button 
                key={category} 
                variant={isCategoryActive(category) ? "default" : "ghost"} 
                size="sm"
                className="w-full justify-start"
                asChild
              >
                <Link href={`/category/${category.toLowerCase()}`}>
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