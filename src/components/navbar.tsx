"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { ModeToggle } from "@/components/mode-toggle";
import { Menu } from "lucide-react";
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
import { logout } from "@/redux/features/auth/authSlice";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { 
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

const routes = [
  {
    href: "/explore",
    label: "Explore",
    active: (pathname: string) => pathname.startsWith("/explore"),
  },
  {
    href: "/generate",
    label: "Generate",
    active: (pathname: string) => pathname === "/generate",
  },
  {
    href: "/upload",
    label: "Upload",
    active: (pathname: string) => pathname === "/upload",
  },
  {
    href: "/leaderboard",
    label: "Leaderboard",
    active: (pathname: string) => pathname === "/leaderboard",
  },
];

export default function Navbar() {
  const pathname = usePathname();
  const router = useRouter();
  const [isOpen, setIsOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const [mounted, setMounted] = useState(false);
  const { isAuthenticated, user } = useSelector((state: RootState) => state.auth);
  const dispatch = useDispatch<AppDispatch>();

  // Only run client-side code after mounting
  useEffect(() => {
    setMounted(true);
    
    const handleScroll = () => {
      setScrolled(window.scrollY > 10);
    };
    
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  const handleLogout = () => {
    dispatch(logout());
    router.push("/");
  };

  return (
    <header 
      className={cn(
        "sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 transition-shadow duration-200",
        scrolled && "shadow-md"
      )}
    >
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="flex h-16 items-center justify-between">
          {/* Logo and Brand */}
          <div className="flex items-center">
            <Link href="/" className="flex items-center space-x-2">
              <svg 
                xmlns="http://www.w3.org/2000/svg" 
                viewBox="0 0 24 24" 
                fill="none" 
                stroke="currentColor" 
                strokeWidth="2" 
                strokeLinecap="round" 
                strokeLinejoin="round" 
                className="h-6 w-6 text-primary"
              >
                <rect width="18" height="18" x="3" y="3" rx="2" />
                <path d="M9.5 9v6.5H11V9Z" />
                <path d="M14.5 9v6.5H16V9Z" />
              </svg>
              <span className="font-bold text-xl hidden sm:inline-block">MemeVerse</span>
            </Link>
          </div>
          
          {/* Desktop Navigation */}
          <nav className="hidden md:flex items-center space-x-6">
            {routes.map((route) => (
              <Link
                key={route.href}
                href={route.href}
                className={cn(
                  "text-sm font-medium transition-colors hover:text-primary",
                  route.active(pathname)
                    ? "text-primary font-semibold"
                    : "text-foreground/60"
                )}
              >
                {route.label}
              </Link>
            ))}
          </nav>
          
          {/* Right Side Items */}
          <div className="flex items-center gap-4">
            {/* Theme Toggle */}
            <ModeToggle />
            
            {mounted && isAuthenticated && user ? (
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Avatar className="h-8 w-8 cursor-pointer">
                    <AvatarImage src={user.avatar} alt={user.username} />
                    <AvatarFallback>{user?.username?.[0]?.toUpperCase() || 'U'}</AvatarFallback>
                  </Avatar>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-56">
                  <div className="flex items-center gap-2 p-2">
                    <div className="flex flex-col">
                      <p className="text-sm font-medium">{user.username}</p>
                      <p className="text-xs text-muted-foreground">{user.email}</p>
                    </div>
                  </div>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem asChild>
                    <Link href="/profile" className="cursor-pointer">
                      Profile
                    </Link>
                  </DropdownMenuItem>
                  <DropdownMenuItem asChild>
                    <Link href="/upload" className="cursor-pointer">
                      Upload Meme
                    </Link>
                  </DropdownMenuItem>
                  <DropdownMenuItem asChild>
                    <Link href="/generate" className="cursor-pointer">
                      Generate Meme
                    </Link>
                  </DropdownMenuItem>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem onClick={handleLogout} className="cursor-pointer">
                    Log out
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            ) : mounted ? (
              <div className="hidden sm:flex items-center gap-2">
                <Button variant="ghost" size="sm" asChild>
                  <Link href="/login">Login</Link>
                </Button>
                <Button size="sm" asChild>
                  <Link href="/register">Sign Up</Link>
                </Button>
              </div>
            ) : (
              <div className="h-8 w-8 rounded-full bg-muted animate-pulse"></div>
            )}
            
            {/* Mobile Menu Trigger */}
            <Sheet open={isOpen} onOpenChange={setIsOpen}>
              <SheetTrigger asChild>
                <Button variant="ghost" size="icon" className="md:hidden">
                  <Menu className="h-5 w-5" />
                  <span className="sr-only">Toggle menu</span>
                </Button>
              </SheetTrigger>
              
              {/* Mobile Menu Content */}
              <SheetContent side="right" className="w-[85%] sm:w-[385px] pr-0 pt-12">
                <SheetHeader className="pb-6 border-b">
                  <SheetTitle>Menu</SheetTitle>
                </SheetHeader>
                
                <div className="py-6 space-y-6">
                  <div className="space-y-3">
                    <h3 className="text-sm font-medium">Navigation</h3>
                    <div className="space-y-1">
                      {routes.map((route) => (
                        <SheetClose asChild key={route.href}>
                          <Link
                            href={route.href}
                            className={cn(
                              "block py-2 px-3 text-base rounded-md transition-colors",
                              route.active(pathname)
                                ? "bg-primary/10 text-primary font-medium"
                                : "hover:bg-muted"
                            )}
                          >
                            {route.label}
                          </Link>
                        </SheetClose>
                      ))}
                    </div>
                  </div>
                  
                  {mounted && !isAuthenticated && (
                    <div className="space-y-3">
                      <h3 className="text-sm font-medium">Account</h3>
                      <div className="space-y-1">
                        <SheetClose asChild>
                          <Link
                            href="/login"
                            className="block py-2 px-3 text-base rounded-md transition-colors hover:bg-muted"
                          >
                            Login
                          </Link>
                        </SheetClose>
                        <SheetClose asChild>
                          <Link
                            href="/register"
                            className="block py-2 px-3 text-base rounded-md transition-colors hover:bg-muted"
                          >
                            Sign Up
                          </Link>
                        </SheetClose>
                      </div>
                    </div>
                  )}
                  
                  {mounted && isAuthenticated && (
                    <div className="space-y-3">
                      <h3 className="text-sm font-medium">Account</h3>
                      <div className="space-y-1">
                        <SheetClose asChild>
                          <Link
                            href="/profile"
                            className="block py-2 px-3 text-base rounded-md transition-colors hover:bg-muted"
                          >
                            Profile
                          </Link>
                        </SheetClose>
                        <button
                          onClick={() => {
                            handleLogout();
                            setIsOpen(false);
                          }}
                          className="w-full text-left py-2 px-3 text-base rounded-md transition-colors hover:bg-muted"
                        >
                          Logout
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              </SheetContent>
            </Sheet>
          </div>
        </div>
      </div>
    </header>
  );
} 