import { NextRequest, NextResponse } from "next/server";
import clientPromise from "@/lib/mongodb";
import { ObjectId } from "mongodb";
import { verifyAuth } from "@/lib/auth";

// GET /api/auth/profile/[id]/saved - Get memes saved by a specific user
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const { id } = params;
    const { searchParams } = new URL(request.url);
    
    // Parse pagination parameters
    const page = parseInt(searchParams.get("page") || "1", 10);
    const limit = parseInt(searchParams.get("limit") || "10", 10);
    
    // Validate ObjectId
    if (!ObjectId.isValid(id)) {
      return NextResponse.json(
        { error: "Invalid user ID" },
        { status: 400 }
      );
    }
    
    // Verify authentication for private data
    const currentUser = await verifyAuth(request);
    const isOwnProfile = currentUser && currentUser._id && 
      (currentUser._id.toString() === id || 
       (typeof currentUser._id === 'string' && currentUser._id === id));
    
    // Only allow access to saved memes if it's the user's own profile
    if (!isOwnProfile) {
      return NextResponse.json(
        { error: "Unauthorized to view saved memes" },
        { status: 403 }
      );
    }
    
    const client = await clientPromise;
    const db = client.db("meme-verse");
    
    // First, get the user's saved meme IDs from the saves collection
    const savedMemes = await db.collection("saves").find(
      { userId: id }
    ).toArray();
    
    // If user has no saved memes, return empty array
    if (!savedMemes || savedMemes.length === 0) {
      return NextResponse.json({
        memes: [],
        pagination: {
          total: 0,
          page,
          limit,
          totalPages: 0
        }
      });
    }
    
    // Extract meme IDs from saved memes
    const savedMemeIds = savedMemes
      .filter(save => save.memeId && ObjectId.isValid(save.memeId))
      .map(save => new ObjectId(save.memeId));
    
    // Calculate pagination
    const total = savedMemeIds.length;
    const skip = (page - 1) * limit;
    const paginatedMemeIds = savedMemeIds.slice(skip, skip + limit);
    
    // Get the actual meme data from the memes collection
    const memes = await db.collection("memes")
      .find({ _id: { $in: paginatedMemeIds } })
      .toArray();
    
    // Format memes for response
    const formattedMemes = memes.map(meme => ({
      id: meme._id.toString(),
      title: meme.title,
      imageUrl: meme.imageUrl,
      description: meme.description || "",
      likes: meme.likes || 0,
      commentCount: meme.commentCount || 0,
      category: meme.category || "Uncategorized",
      createdAt: meme.createdAt,
      author: meme.username || "Anonymous",
      authorId: meme.userId
    }));
    
    return NextResponse.json({
      memes: formattedMemes,
      pagination: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit)
      }
    });
    
  } catch (error) {
    console.error("Error fetching saved memes:", error);
    return NextResponse.json(
      { error: "Failed to fetch saved memes" },
      { status: 500 }
    );
  }
} 