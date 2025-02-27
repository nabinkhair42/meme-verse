"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { ModeToggle } from "@/components/mode-toggle";
import { Menu, Home, PlusCircle, Upload, Trophy, User, LogOut, Settings, Bookmark, Bug } from "lucide-react";
import { useState, useEffect } from "react";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
  SheetClose,
} from "@/components/ui/sheet";
import { useSelector, useDispatch } from "react-redux";
import { RootState, AppDispatch } from "@/redux/store";
import { logout, login, setUser } from "@/redux/features/auth/authSlice";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { 
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
  DropdownMenuGroup,
  DropdownMenuLabel,
} from "@/components/ui/dropdown-menu";
import { Badge } from "@/components/ui/badge";
import { FaFire, FaSearch } from "react-icons/fa";
import { authService } from "@/services/api";

interface User {
  _id: string;
  username: string;
  email: string;
  avatar?: string;
}

// Define routes outside of the component to ensure consistent rendering
const routes = [
  {
    href: "/",
    label: "Home",
    icon: Home,
    active: (pathname: string) => pathname === "/",
  },
  {
    href: "/trending",
    label: "Trending",
    icon: FaFire,
    active: (pathname: string) => pathname.startsWith("/trending"),
  },
  {
    href: "/search",
    label: "Explore",
    icon: FaSearch,
    active: (pathname: string) => pathname.startsWith("/search"),
  },
  {
    href: "/generate",
    label: "Create",
    icon: PlusCircle,
    active: (pathname: string) => pathname === "/generate",
    highlight: true,
  },
  {
    href: "/upload",
    label: "Upload",
    icon: Upload,
    active: (pathname: string) => pathname === "/upload",
  },
  {
    href: "/leaderboard",
    label: "Leaderboard",
    icon: Trophy,
    active: (pathname: string) => pathname === "/leaderboard",
  },
 
];

export function Navbar() {
  const pathname = usePathname();
  const router = useRouter();
  const dispatch = useDispatch<AppDispatch>();
  const { isAuthenticated, user } = useSelector((state: RootState) => state.auth);
  
  const [mounted, setMounted] = useState(false);
  const [localUser, setLocalUser] = useState<User | null>(null);
  
  useEffect(() => {
    setMounted(true);
  }, []);
  
  // Add a useEffect to validate token and update auth state
  useEffect(() => {
    const validateAuth = async () => {
      if (typeof window !== 'undefined') {
        const token = localStorage.getItem('token');
        const storedUser = localStorage.getItem('user');
        
        if (token && storedUser && !isAuthenticated) {
          try {
            // Parse stored user data
            const parsedUser = JSON.parse(storedUser);
            setLocalUser(parsedUser);
            
            // Validate token with backend
            const validatedUser = await authService.validateToken();
            if (validatedUser) {
              // Update Redux state with validated user data
              dispatch(setUser({
                token,
                user: validatedUser
              }));
            } else {
              // Clear invalid data
              localStorage.removeItem('token');
              localStorage.removeItem('user');
              setLocalUser(null);
            }
          } catch (error) {
            console.error('Error validating auth:', error);
            localStorage.removeItem('token');
            localStorage.removeItem('user');
            setLocalUser(null);
          }
        }
      }
    };

    validateAuth();
  }, [dispatch, isAuthenticated]);
  
  const handleLogout = async () => {
    try {
      // Clear local storage first
      localStorage.removeItem('token');
      localStorage.removeItem('user');
      // Then dispatch logout action
      await dispatch(logout());
      router.push("/");
    } catch (error) {
      console.error('Error during logout:', error);
    }
  };
  
  // Update user data fallback to use localUser as well
  const activeUser = user || localUser;
  const userDisplayName = activeUser?.username || 'User';
  const userAvatar = activeUser?.avatar || `https://api.dicebear.com/7.x/avataaars/svg?seed=${activeUser?._id || 'default'}`;
  const userInitial = userDisplayName[0]?.toUpperCase() || 'U';
  
  console.log("CUrrent User",activeUser);
  // Only render the full component after mounting on the client
  if (!mounted) {
    return (
      <header className="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
        <div className="container flex h-16 max-w-7xl mx-auto items-center px-4">
          {/* Simple placeholder that matches the structure but has no dynamic content */}
          <div className="md:hidden mr-2">
            <Button variant="outline" size="icon" disabled>
              <span className="h-5 w-5" />
            </Button>
          </div>
          
          <div className="flex items-center flex-1 md:flex-initial">
            <div className="mr-4 md:mr-6 flex items-center space-x-2">
              <span className="font-bold text-lg md:text-xl">MemeVerse</span>
            </div>
            <div className="hidden md:flex items-center space-x-1">
              {/* Placeholder for nav items */}
            </div>
          </div>
          
          <div className="flex items-center justify-end ml-auto space-x-2">
            {/* Placeholder for right side controls */}
          </div>
        </div>
      </header>
    );
  }
  
  return (
    <header className="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="container flex h-16 max-w-7xl mx-auto items-center px-4">
        {/* Mobile menu - moved to the left */}
        <div className="md:hidden mr-2">
          <Sheet>
            <SheetTrigger asChild>
              <Button
                variant="outline"
                size="icon"
              >
                <Menu className="h-5 w-5" />
                <span className="sr-only">Toggle Menu</span>
              </Button>
            </SheetTrigger>
            <SheetContent side="left">
              <SheetHeader className="mb-4">
                <SheetTitle className="text-xl font-bold text-primary">MemeVerse</SheetTitle>
              </SheetHeader>
              <nav className="flex flex-col gap-2">
                {routes.map((route) => (
                  <SheetClose asChild key={route.href}>
                    <Link
                      href={route.href}
                      className={cn(
                        "flex items-center px-3 py-2 text-sm font-medium rounded-md transition-colors",
                        route.active(pathname)
                          ? "bg-muted text-foreground"
                          : "text-foreground/60 hover:text-foreground hover:bg-muted/50",
                        route.highlight && !route.active(pathname) && "text-primary hover:text-primary"
                      )}
                    >
                      {route.icon && <route.icon className={cn("mr-2 h-4 w-4", route.href === "/trending" && "text-orange-500")} />}
                      {route.label}
                    </Link>
                  </SheetClose>
                ))}
                
                {isAuthenticated && (
                  <>
                    <div className="h-px bg-border my-2" />
                    <SheetClose asChild>
                      <Link
                        href="/profile"
                        className="flex items-center px-3 py-2 text-sm font-medium rounded-md transition-colors text-foreground/60 hover:text-foreground hover:bg-muted/50"
                      >
                        <User className="mr-2 h-4 w-4" />
                        Profile
                      </Link>
                    </SheetClose>
                    <SheetClose asChild>
                      <Link
                        href="/profile?tab=saved"
                        className="flex items-center px-3 py-2 text-sm font-medium rounded-md transition-colors text-foreground/60 hover:text-foreground hover:bg-muted/50"
                      >
                        <Bookmark className="mr-2 h-4 w-4" />
                        Saved Memes
                      </Link>
                    </SheetClose>
                    <SheetClose asChild>
                      <Link
                        href="/settings"
                        className="flex items-center px-3 py-2 text-sm font-medium rounded-md transition-colors text-foreground/60 hover:text-foreground hover:bg-muted/50"
                      >
                        <Settings className="mr-2 h-4 w-4" />
                        Settings
                      </Link>
                    </SheetClose>
                    <SheetClose asChild>
                      <button
                        onClick={handleLogout}
                        className="flex items-center px-3 py-2 text-sm font-medium rounded-md transition-colors text-foreground/60 hover:text-foreground hover:bg-muted/50 w-full text-left"
                      >
                        <LogOut className="mr-2 h-4 w-4" />
                        Log out
                      </button>
                    </SheetClose>
                  </>
                )}
              </nav>
            </SheetContent>
          </Sheet>
        </div>
        
        {/* Logo and desktop navigation */}
        <div className="flex items-center flex-1 md:flex-initial">
          <Link href="/" className="mr-4 md:mr-6 flex items-center space-x-2">
            <span className="font-bold text-lg md:text-xl text-primary">MemeVerse</span>
          </Link>
          <nav className="hidden md:flex items-center space-x-1">
            {routes
              .map((route) => (
                <Link
                  key={route.href}
                  href={route.href}
                  className={cn(
                    "flex items-center px-2 py-2 text-sm font-medium rounded-md transition-colors",
                    route.active(pathname)
                      ? "bg-muted text-foreground"
                      : "text-foreground/60 hover:text-foreground hover:bg-muted/50",
                    route.highlight && !route.active(pathname) && "text-primary hover:text-primary",
                    "lg:px-3" // More padding on larger screens
                  )}
                >
                  {route.icon && <route.icon className={cn("mr-1 h-4 w-4 lg:mr-2", route.href === "/trending" && "text-orange-500")} />}
                  <span className="hidden sm:inline">{route.label}</span>
                </Link>
              ))}
          </nav>
        </div>
        
        {/* Right side controls */}
        <div className="flex items-center justify-end ml-auto space-x-2">
          <ModeToggle />
          
          {isAuthenticated ? (
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" className="relative h-8 w-8 rounded-full">
                  <Avatar className="h-8 w-8 transition-transform hover:scale-110">
                    <AvatarImage src={userAvatar} alt={userDisplayName} />
                    <AvatarFallback>{userInitial}</AvatarFallback>
                  </Avatar>
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-56">
                <DropdownMenuLabel>
                  <div className="flex flex-col space-y-1">
                    {userDisplayName && (
                      <p className="font-medium text-sm">{userDisplayName}</p>
                    )}
                    {activeUser?.email && (
                      <p className="truncate text-xs text-muted-foreground">
                        {activeUser.email}
                      </p>
                    )}
                  </div>
                </DropdownMenuLabel>
                <DropdownMenuSeparator />
                <DropdownMenuGroup>
                  <DropdownMenuItem asChild>
                    <Link href="/profile" className="flex items-center cursor-pointer">
                      <User className="mr-2 h-4 w-4" />
                      <span>Profile</span>
                    </Link>
                  </DropdownMenuItem>
                  <DropdownMenuItem asChild>
                    <Link href="/profile?tab=saved" className="flex items-center cursor-pointer">
                      <Bookmark className="mr-2 h-4 w-4" />
                      <span>Saved Memes</span>
                    </Link>
                  </DropdownMenuItem>
                  <DropdownMenuItem asChild>
                    <Link href="/settings" className="flex items-center cursor-pointer">
                      <Settings className="mr-2 h-4 w-4" />
                      <span>Settings</span>
                    </Link>
                  </DropdownMenuItem>
                </DropdownMenuGroup>
                <DropdownMenuSeparator />
                <DropdownMenuItem
                  className="cursor-pointer text-red-500 focus:text-red-500"
                  onSelect={handleLogout}
                >
                  <LogOut className="mr-2 h-4 w-4" />
                  <span>Log out</span>
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          ) : (
            <div className="flex gap-2">
              <Button variant="outline" size="sm" asChild className="hidden xs:flex">
                <Link href="/login">Login</Link>
              </Button>
              <Button size="sm" asChild>
                <Link href="/register">Sign Up</Link>
              </Button>
            </div>
          )}
        </div>
      </div>
    </header>
  );
} 