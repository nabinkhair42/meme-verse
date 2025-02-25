import { NextRequest, NextResponse } from "next/server";
import clientPromise from "@/lib/mongodb";
import { verifyAuth } from "@/lib/auth";
import { successResponse, errorResponse } from "@/lib/apiResponse";

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    // Verify authentication
    const user = await verifyAuth(request);
    
    if (!user) {
      return NextResponse.json(
        errorResponse("Unauthorized", 401),
        { status: 401 }
      );
    }
    
    // Get the database connection
    const client = await clientPromise;
    const db = client.db("meme-verse");
    
    // IMPORTANT: Await the params object before accessing its properties
    const memeId = (await params).id;
    
    const userLike = await db.collection("likes").findOne({
      memeId,
      userId: user.id
    });
    
    return NextResponse.json(
      successResponse({ liked: !!userLike }),
      { status: 200 }
    );
  } catch (error) {
    console.error("Error checking meme like status:", error);
    return NextResponse.json(
      errorResponse("Failed to check like status", 500),
      { status: 500 }
    );
  }
}

export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const user = await verifyAuth(request);
    
    if (!user) {
      return NextResponse.json(
        errorResponse("Unauthorized", 401),
        { status: 401 }
      );
    }
    
    // IMPORTANT: Await the params object before accessing its properties
    const memeId = (await params).id;
    
    const client = await clientPromise;
    const db = client.db("meme-verse");
    
    // Get the meme
    const meme = await db.collection("memes").findOne({ id: memeId });
    
    if (!meme) {
      return NextResponse.json(
        errorResponse("Meme not found", 404),
        { status: 404 }
      );
    }
    
    // Check if user already liked this meme
    const userLike = await db.collection("likes").findOne({
      memeId,
      userId: user.id
    });
    
    let liked = false;
    let likes = meme.likes || 0;
    
    if (userLike) {
      // User already liked this meme, so unlike it
      await db.collection("likes").deleteOne({
        memeId,
        userId: user.id
      });
      
      // Decrement likes count
      likes = Math.max(0, likes - 1);
      
      // Update meme likes count
      await db.collection("memes").updateOne(
        { id: memeId },
        { $set: { likes } }
      );
    } else {
      // User hasn't liked this meme yet, so like it
      await db.collection("likes").insertOne({
        memeId,
        userId: user.id,
        createdAt: new Date().toISOString()
      });
      
      // Increment likes count
      likes = likes + 1;
      
      // Update meme likes count
      await db.collection("memes").updateOne(
        { id: memeId },
        { $set: { likes } }
      );
      
      liked = true;
    }
    
    return NextResponse.json(
      successResponse({ liked, likes }),
      { status: 200 }
    );
  } catch (error) {
    console.error("Error toggling like:", error);
    return NextResponse.json(
      errorResponse("Failed to update like status", 500),
      { status: 500 }
    );
  }
} 