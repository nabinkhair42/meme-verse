"use client"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import type React from "react"

import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader } from "@/components/ui/card"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Separator } from "@/components/ui/separator"
import { Skeleton } from "@/components/ui/skeleton"
import { Textarea } from "@/components/ui/textarea"
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip"
import { formatDate } from "@/lib/utils"
import type { RootState } from "@/redux/store"
import { memeService } from "@/services/api"
import type { Meme } from "@/types/meme"
import { useInfiniteQuery } from "@tanstack/react-query"
import { AnimatePresence, motion } from "framer-motion"
import {
  ArrowLeft,
  Bookmark,
  Download,
  Heart,
  ImageIcon,
  Loader2,
  MessageCircle,
  Send,
  Share2,
  User,
} from "lucide-react"
import Image from "next/image"
import Link from "next/link"
import { useParams, useRouter } from "next/navigation"
import { useEffect, useState } from "react"
import { useInView } from "react-intersection-observer"
import { useSelector } from "react-redux"
import { toast } from "sonner"
import { LeftSidebar } from "@/components/home/left-sidebar"
import { RightSidebar } from "@/components/home/right-sidebar"

// Define a local comment interface that matches the backend response
interface CommentData {
  _id?: string
  id?: string
  memeId: string
  userId: string
  username: string
  author?: string
  userAvatar?: string
  content: string
  text?: string
  createdAt: Date | string
  updatedAt?: Date | string
}

export default function MemePage() {
  const { id } = useParams()
  const router = useRouter()

  const { items, status } = useSelector((state: RootState) => state.memes)
  const { likedMemes, savedMemes, profile } = useSelector((state: RootState) => state.user)
  const { isAuthenticated, user } = useSelector((state: RootState) => state.auth)

  const [memeData, setMemeData] = useState<Meme | null>(null)
  const [commentText, setCommentText] = useState("")
  const [isLoading, setIsLoading] = useState(true)
  const [isSubmittingComment, setIsSubmittingComment] = useState(false)
  const [isLiking, setIsLiking] = useState(false)
  const [hasLiked, setHasLiked] = useState(false)
  const [hasSaved, setHasSaved] = useState(false)
  const [isSaving, setIsSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)

  // Set up intersection observer for infinite scrolling
  const { ref, inView } = useInView({
    threshold: 0.1,
    rootMargin: "200px",
  })

  // Fetch comments with infinite scrolling
  const {
    data: commentsData,
    fetchNextPage: fetchNextComments,
    hasNextPage: hasMoreComments,
    isFetchingNextPage: isFetchingNextComments,
    status: commentsStatus,
    refetch: refetchComments,
  } = useInfiniteQuery({
    queryKey: ["meme-comments", id],
    queryFn: async ({ pageParam = 1 }) => {
      console.log(`Fetching comments page ${pageParam} for meme ${id}`)
      const result = await memeService.getComments(id as string, pageParam, 10)
      return result
    },
    getNextPageParam: (lastPage) => {
      // Check if the response has pagination info
      if (lastPage.pagination) {
        const { page, totalPages } = lastPage.pagination
        return page < totalPages ? page + 1 : undefined
      }
      return undefined
    },
    initialPageParam: 1,
    enabled: !!id && !isLoading,
  })

  // Process all comments from all pages
  const comments =
    commentsData?.pages.flatMap((page) =>
      page.comments.map((comment) => ({
        id: comment.id || comment._id,
        _id: comment._id || comment.id,
        memeId: comment.memeId,
        userId: comment.userId,
        username: comment.username || comment.author,
        author: comment.username || comment.author,
        userAvatar: comment.userAvatar,
        content: comment.content || comment.text,
        text: comment.content || comment.text,
        createdAt: comment.createdAt,
        updatedAt: comment.updatedAt,
      })),
    ) || []

  // Load more comments when the user scrolls to the bottom
  useEffect(() => {
    if (inView && hasMoreComments && !isFetchingNextComments) {
      fetchNextComments()
    }
  }, [inView, fetchNextComments, hasMoreComments, isFetchingNextComments])

  // Fetch meme data from API
  useEffect(() => {
    const fetchMemeData = async () => {
      if (!id) return

      setIsLoading(true)
      setError(null)
      try {
        // Fetch meme data
        const data = await memeService.getMemeById(id as string)

        // Ensure data has all required properties
        const processedData = {
          ...data,
          likes: data.likes || 0,
          tags: data.tags || [],
          description: data.description || "",
        }

        setMemeData(processedData as any)

        // Check if user has liked this meme
        if (isAuthenticated) {
          const isLiked = await memeService.checkLikeStatus(id as string)
          setHasLiked(isLiked?.liked || false)

          // Check if user has saved this meme
          const isSaved = await memeService.checkSaveStatus(id as string)
          setHasSaved(isSaved?.saved || false)
        }
      } catch (error) {
        console.error("Error fetching meme:", error)
        setError("Failed to load meme. Please try again later.")

        // Fallback to Redux store if API fails
        const localMeme = items.find((meme) => meme._id === id)
        if (localMeme) {
          setMemeData({
            ...localMeme,
            likes: localMeme.likes || 0,
            tags: localMeme.tags || [],
            description: localMeme.description || "",
          } as any)
          setError(null)
        }
      } finally {
        setIsLoading(false)
      }
    }

    fetchMemeData()
  }, [id, items, isAuthenticated])

  // Handle like toggle with API
  const handleLike = async () => {
    if (!memeData || isLiking || !isAuthenticated) {
      if (!isAuthenticated) {
        router.push("/login")
        toast.error("Please log in to like memes")
      }
      return
    }

    setIsLiking(true)
    // Store original likes count for error recovery
    const originalLikes = memeData.likes

    try {
      // Optimistic update for UI responsiveness
      setHasLiked(!hasLiked)
      setMemeData((prev) => {
        if (!prev) return prev
        return {
          ...prev,
          likes: hasLiked ? prev.likes - 1 : prev.likes + 1,
        }
      })

      // Call API to toggle like
      const result = await memeService.likeMeme(memeData._id || "", !hasLiked, user?.id || "")
      // Log the response for debugging
      console.log(`Like response for meme ${memeData._id}:`, result)

      // Update with actual result from server
      const isLiked = result?.liked || false
      const likesCount = result?.likes || originalLikes

      setHasLiked(isLiked)
      setMemeData((prev) => {
        if (!prev) return prev
        return {
          ...prev,
          likes: likesCount,
        }
      })

      toast.success(isLiked ? "Added to your liked memes" : "Removed from your liked memes")
    } catch (error) {
      console.error("Error liking/unliking meme:", error)
      toast.error("Failed to update like status")

      // Revert optimistic update on error
      setHasLiked(!hasLiked)
      setMemeData((prev) => {
        if (!prev) return prev
        return {
          ...prev,
          likes: originalLikes,
        }
      })
    } finally {
      setIsLiking(false)
    }
  }

  // Handle comment submission with API
  const handleAddComment = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!memeData || !commentText.trim() || isSubmittingComment || !isAuthenticated) {
      if (!isAuthenticated) {
        toast.error("Please log in to comment")
        router.push("/login")
      }
      return
    }

    setIsSubmittingComment(true)
    const commentToSubmit = commentText.trim()

    try {
      // Call API to add comment
      const newComment = await memeService.addComment(memeData._id || "", commentToSubmit)

      // Log the response for debugging
      console.log(`Comment response for meme ${memeData._id}:`, newComment)

      // Ensure newComment is valid
      if (!newComment) {
        throw new Error("Invalid comment data received from server")
      }

      // Process the new comment to match our local interface
      // Log the actual structure of the newComment object to debug type issues
      console.log("New comment structure:", JSON.stringify(newComment, null, 2))

      const processedComment: CommentData = {
        id: newComment.id || (newComment as any)._id || "",
        _id: (newComment as any)._id || newComment.id || "",
        memeId: (newComment as any).memeId || memeData._id,
        userId: (newComment as any).userId || user?.id || "",
        username: (newComment as any).username || profile?.username || user?.username || "Anonymous",
        author: (newComment as any).username || profile?.username || user?.username || "Anonymous",
        userAvatar: (newComment as any).userAvatar || profile?.avatar || "",
        content: (newComment as any).content || commentToSubmit,
        text: (newComment as any).content || commentToSubmit,
        createdAt: newComment.createdAt || new Date().toISOString(),
        updatedAt: (newComment as any).updatedAt || new Date().toISOString(),
      }

      // Refetch comments to include the new one
      refetchComments()

      // Clear input
      setCommentText("")
      toast.success("Comment added!")
    } catch (error) {
      console.error("Error adding comment:", error)
      toast.error("Failed to add comment")
    } finally {
      setIsSubmittingComment(false)
    }
  }

  // Handle save toggle
  const handleSave = async () => {
    if (!memeData || isSaving || !isAuthenticated) {
      if (!isAuthenticated) {
        toast.error("Please log in to save memes")
        router.push("/login")
      }
      return
    }

    setIsSaving(true)
    // Store original saved state for error recovery
    const originalSavedState = hasSaved

    try {
      // Optimistic update for UI responsiveness
      setHasSaved(!hasSaved)

      // Call API to toggle save
      const result = await memeService.saveMeme(memeData._id || "")

      // Log the response for debugging
      console.log(`Save response for meme ${memeData._id}:`, result)

      // Update with actual result from server
      const isSaved = result?.saved || false
      setHasSaved(isSaved)

      toast.success(isSaved ? "Meme saved to your collection" : "Meme removed from your collection")
    } catch (error) {
      console.error("Error saving/unsaving meme:", error)
      toast.error("Failed to update save status")

      // Revert optimistic update on error
      setHasSaved(originalSavedState)
    } finally {
      setIsSaving(false)
    }
  }

  // Handle sharing
  const handleShare = () => {
    if (!memeData) return

    // In a real app, this would use the Web Share API if available
    // or create a shareable link
    navigator.clipboard.writeText(window.location.href)
    toast.success("Link copied to clipboard!")
  }

  // Handle download
  const handleDownload = () => {
    if (!memeData) return

    // Create an anchor element and set properties for download
    const link = document.createElement("a")
    link.href = memeData.imageUrl
    link.download = `meme-${memeData._id}.jpg`
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)

    toast.success("Meme downloaded successfully!")
  }

  const renderMemeContent = () => {
    if (isLoading) {
      return (
        <Card className="overflow-hidden border-border/40 mb-6">
          <CardHeader className="pb-0 pt-6 px-6">
            <div className="flex items-center gap-3 mb-4">
              <Skeleton className="h-10 w-10 rounded-full" />
              <div>
                <Skeleton className="h-4 w-24" />
                <Skeleton className="h-3 w-16 mt-1" />
              </div>
            </div>
            <Skeleton className="h-8 w-3/4 mb-2" />
            <Skeleton className="h-4 w-1/4" />
          </CardHeader>
          <CardContent className="p-6">
            <Skeleton className="h-[300px] w-full rounded-md mb-6" />
            <div className="space-y-2">
              <Skeleton className="h-4 w-full" />
              <Skeleton className="h-4 w-5/6" />
              <Skeleton className="h-4 w-4/6" />
            </div>
            <div className="flex flex-wrap gap-2 mt-6">
              <Skeleton className="h-9 w-20" />
              <Skeleton className="h-9 w-20" />
              <Skeleton className="h-9 w-20" />
              <Skeleton className="h-9 w-20" />
            </div>
          </CardContent>
        </Card>
      )
    }

    if (error || !memeData) {
      return (
        <Card className="border-destructive/20 bg-destructive/5">
          <CardContent className="text-center py-12">
            <ImageIcon className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
            <h2 className="text-2xl font-bold mb-4">Meme Not Found</h2>
            <p className="text-muted-foreground mb-6">
              {error || "The meme you're looking for doesn't exist or has been removed."}
            </p>
            <Button asChild>
              <Link href="/explore">Browse Memes</Link>
            </Button>
          </CardContent>
        </Card>
      )
    }

    return (
      <>
        <Card className="overflow-hidden border-border/40 mb-6">
          <CardHeader className="pb-0 pt-6 px-6">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-3">
                <Avatar className="h-10 w-10 border-2 border-background shadow-sm">
                  <AvatarImage src={memeData.userAvatar} alt={memeData.username || "Anonymous"} />
                  <AvatarFallback className="bg-primary/10 text-primary">
                    {(memeData.username || "A")[0]?.toUpperCase()}
                  </AvatarFallback>
                </Avatar>
                <div>
                  <p className="font-semibold">{memeData.username || "Anonymous"}</p>
                  <p className="text-xs text-muted-foreground">{formatDate(memeData.createdAt as string)}</p>
                </div>
              </div>
              <Badge variant="secondary" className="px-2 py-1">
                {memeData.category || "Uncategorized"}
              </Badge>
            </div>
            <h1 className="text-2xl sm:text-3xl font-bold tracking-tight mb-2">{memeData.title}</h1>
            {memeData.description && <p className="text-muted-foreground text-sm mb-4">{memeData.description}</p>}
          </CardHeader>

          <CardContent className="p-6">
            <div className="relative aspect-video md:aspect-[4/3] lg:aspect-[16/9] overflow-hidden rounded-md border bg-muted mb-6">
              {memeData.imageUrl ? (
                <Image
                  src={memeData.imageUrl || "/placeholder.svg"}
                  alt={memeData.title}
                  fill
                  className="object-contain"
                  unoptimized
                  priority
                />
              ) : (
                <div className="absolute inset-0 flex items-center justify-center">
                  <ImageIcon className="h-12 w-12 text-muted-foreground" />
                </div>
              )}
            </div>

            <div className="flex flex-wrap items-center gap-3 mb-6">
              <TooltipProvider>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Button
                      variant={hasLiked ? "default" : "outline"}
                      onClick={handleLike}
                      disabled={isLiking || !isAuthenticated}
                      className={`transition-all ${hasLiked ? "bg-primary text-primary-foreground" : ""}`}
                      size="sm"
                    >
                      {isLiking ? (
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      ) : (
                        <Heart className={`mr-2 h-4 w-4 transition-all ${hasLiked ? "fill-current" : ""}`} />
                      )}
                      {hasLiked ? "Liked" : "Like"} ({memeData.likes})
                    </Button>
                  </TooltipTrigger>
                  <TooltipContent>
                    {isAuthenticated ? (hasLiked ? "Remove like" : "Like this meme") : "Log in to like memes"}
                  </TooltipContent>
                </Tooltip>

                <Tooltip>
                  <TooltipTrigger asChild>
                    <Button
                      variant={hasSaved ? "default" : "outline"}
                      onClick={handleSave}
                      disabled={isSaving || !isAuthenticated}
                      className={`transition-all ${hasSaved ? "bg-primary text-primary-foreground" : ""}`}
                      size="sm"
                    >
                      {isSaving ? (
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      ) : (
                        <Bookmark className={`mr-2 h-4 w-4 transition-all ${hasSaved ? "fill-current" : ""}`} />
                      )}
                      {hasSaved ? "Saved" : "Save"}
                    </Button>
                  </TooltipTrigger>
                  <TooltipContent>
                    {isAuthenticated ? (hasSaved ? "Remove from saved" : "Save this meme") : "Log in to save memes"}
                  </TooltipContent>
                </Tooltip>

                <Tooltip>
                  <TooltipTrigger asChild>
                    <Button variant="outline" onClick={handleShare} size="sm">
                      <Share2 className="mr-2 h-4 w-4" />
                      Share
                    </Button>
                  </TooltipTrigger>
                  <TooltipContent>Copy link to clipboard</TooltipContent>
                </Tooltip>

                <Tooltip>
                  <TooltipTrigger asChild>
                    <Button variant="outline" onClick={handleDownload} size="sm">
                      <Download className="mr-2 h-4 w-4" />
                      Download
                    </Button>
                  </TooltipTrigger>
                  <TooltipContent>Download this meme</TooltipContent>
                </Tooltip>
              </TooltipProvider>
            </div>

            {memeData.tags && memeData.tags.length > 0 && (
              <div className="flex flex-wrap gap-2">
                {memeData.tags.map((tag, index) => (
                  <Badge key={index} variant="outline" className="px-2 py-0.5 text-xs">
                    #{tag}
                  </Badge>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        <Card className="border-border/40">
          <CardHeader className="pb-2 pt-6">
            <h3 className="text-xl font-semibold flex items-center gap-2">
              <MessageCircle className="h-5 w-5" />
              Comments ({commentsData?.pages[0]?.pagination?.total || comments.length})
            </h3>
          </CardHeader>

          <CardContent className="p-6">
            <form onSubmit={handleAddComment} className="mb-8">
              <div className="flex gap-3 items-start">
                <Avatar className="h-9 w-9 mt-1">
                  <AvatarImage src={profile?.avatar} alt={profile?.username || "User"} />
                  <AvatarFallback className="bg-primary/10 text-primary">
                    <User className="h-4 w-4" />
                  </AvatarFallback>
                </Avatar>
                <div className="flex-1 space-y-2">
                  <Textarea
                    placeholder={isAuthenticated ? "Add a comment..." : "Log in to comment"}
                    value={commentText}
                    onChange={(e) => setCommentText(e.target.value)}
                    className="resize-none min-h-[80px] focus-visible:ring-primary/50"
                    disabled={isSubmittingComment || !isAuthenticated}
                  />
                  <div className="flex justify-end">
                    <Button
                      type="submit"
                      size="sm"
                      disabled={!commentText.trim() || isSubmittingComment || !isAuthenticated}
                      className="transition-all"
                    >
                      {isSubmittingComment ? (
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      ) : (
                        <Send className="mr-2 h-4 w-4" />
                      )}
                      Post Comment
                    </Button>
                  </div>
                </div>
              </div>
            </form>

            <Separator className="my-6" />

            <AnimatePresence>
              {commentsStatus === "pending" ? (
                <div className="space-y-6">
                  {[1, 2, 3].map((i) => (
                    <div key={i} className="flex gap-3">
                      <Skeleton className="h-9 w-9 rounded-full" />
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-1">
                          <Skeleton className="h-4 w-24" />
                          <Skeleton className="h-3 w-16" />
                        </div>
                        <Skeleton className="h-4 w-full" />
                        <Skeleton className="h-4 w-2/3 mt-1" />
                      </div>
                    </div>
                  ))}
                </div>
              ) : commentsStatus === "error" ? (
                <div className="text-center py-8 bg-destructive/5 rounded-lg">
                  <p className="text-destructive mb-2">Failed to load comments</p>
                  <Button onClick={() => refetchComments()} variant="outline" size="sm">
                    Try Again
                  </Button>
                </div>
              ) : comments.length === 0 ? (
                <div className="text-center py-12 bg-muted/30 rounded-lg">
                  <MessageCircle className="h-8 w-8 mx-auto mb-4 text-muted-foreground" />
                  <h4 className="text-lg font-semibold mb-2">No comments yet</h4>
                  <p className="text-muted-foreground">Be the first to share your thoughts on this meme!</p>
                </div>
              ) : (
                <motion.div className="space-y-6" initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
                  {comments.map((comment) => (
                    <motion.div
                      key={comment.id || comment._id || `comment-${Math.random()}`}
                      className="flex gap-3 group"
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ duration: 0.2 }}
                    >
                      <Avatar className="h-9 w-9 mt-0.5">
                        <AvatarImage
                          src={
                            comment.userAvatar ||
                            `https://api.dicebear.com/7.x/avataaars/svg?seed=${comment.username || "anonymous"}`
                          }
                          alt={comment.username || "Anonymous User"}
                        />
                        <AvatarFallback className="bg-primary/10 text-primary">
                          {(comment.username || "A")[0]?.toUpperCase()}
                        </AvatarFallback>
                      </Avatar>
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-1">
                          <span className="font-medium text-sm">{comment.username || "Anonymous"}</span>
                          <span className="text-xs text-muted-foreground">
                            {formatDate(comment.createdAt as string)}
                          </span>
                        </div>
                        <div className="bg-muted/30 p-3 rounded-md">
                          <p className="text-sm leading-relaxed">{comment.content || comment.text || "No content"}</p>
                        </div>
                      </div>
                    </motion.div>
                  ))}

                  {/* Infinite Scroll Indicator */}
                  <div ref={ref} className="py-4 flex justify-center">
                    {isFetchingNextComments && (
                      <div className="flex items-center gap-2">
                        <Loader2 className="h-5 w-5 animate-spin text-primary" />
                        <p className="text-sm">Loading more comments...</p>
                      </div>
                    )}

                    {!hasMoreComments && comments.length > 0 && (
                      <p className="text-sm text-muted-foreground">End of comments</p>
                    )}
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </CardContent>
        </Card>
      </>
    )
  }

  return (
    <div className="min-h-[calc(100vh-64px)] bg-background">
      <div className="max-w-7xl mx-auto px-4 py-6">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          {/* Left Sidebar */}
          <div className="hidden lg:block lg:col-span-3">
            <div className="sticky top-[80px]">
              <LeftSidebar isAuthenticated={isAuthenticated} user={user} />
            </div>
          </div>

          {/* Main Content */}
          <main className="lg:col-span-6">
            <ScrollArea className="h-full">
              <div className="pr-4">
                <Button
                  variant="ghost"
                  onClick={() => router.back()}
                  className="group mb-6 text-muted-foreground hover:text-foreground"
                >
                  <ArrowLeft className="h-4 w-4 mr-2 transition-transform group-hover:-translate-x-1" />
                  Back
                </Button>
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.5 }}
                >
                  {renderMemeContent()}
                </motion.div>
              </div>
            </ScrollArea>
          </main>

          {/* Right Sidebar */}
          <div className="hidden lg:block lg:col-span-3">
            <div className="sticky top-[80px]">
              <RightSidebar />
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

