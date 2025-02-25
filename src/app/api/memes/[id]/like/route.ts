import { NextRequest, NextResponse } from "next/server";
import clientPromise from "@/lib/mongodb";
import { verifyAuth } from "@/lib/auth";

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const user = await verifyAuth(request);
    
    if (!user) {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      );
    }
    
    const client = await clientPromise;
    const db = client.db("meme-verse");
    
    // Get the ID from params
    const memeId = String(params.id);
    
    // Check if user liked this meme
    const userLike = await db.collection("likes").findOne({
      memeId,
      userId: user.id
    });
    
    return NextResponse.json({ liked: !!userLike });
  } catch (error) {
    console.error(`Error checking like status:`, error);
    return NextResponse.json(
      { error: "Failed to check like status" },
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
        { error: "Unauthorized" },
        { status: 401 }
      );
    }
    
    const client = await clientPromise;
    const db = client.db("meme-verse");
    
    // Get the ID from params
    const memeId = String(params.id);
    
    // Get the meme
    const meme = await db.collection("memes").findOne({ id: memeId });
    
    if (!meme) {
      return NextResponse.json(
        { error: "Meme not found" },
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
    
    return NextResponse.json({ liked, likes });
  } catch (error) {
    console.error(`Error toggling like:`, error);
    return NextResponse.json(
      { error: "Failed to toggle like" },
      { status: 500 }
    );
  }
} 