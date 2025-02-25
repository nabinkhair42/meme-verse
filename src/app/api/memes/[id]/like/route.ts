import { NextRequest, NextResponse } from "next/server";
import clientPromise from "@/lib/mongodb";
import { verifyAuth } from "@/lib/auth";

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
    
    // Get the meme
    const meme = await db.collection("memes").findOne({ id: params.id });
    
    if (!meme) {
      return NextResponse.json(
        { error: "Meme not found" },
        { status: 404 }
      );
    }
    
    // Check if user already liked this meme
    const userLike = await db.collection("likes").findOne({
      memeId: params.id,
      userId: user.id
    });
    
    if (userLike) {
      // User already liked this meme, so unlike it
      await db.collection("likes").deleteOne({
        memeId: params.id,
        userId: user.id
      });
      
      // Decrement meme likes count
      await db.collection("memes").updateOne(
        { id: params.id },
        { $inc: { likes: -1 } }
      );
      
      return NextResponse.json({ liked: false, likes: meme.likes - 1 });
    } else {
      // User hasn't liked this meme yet, so like it
      await db.collection("likes").insertOne({
        memeId: params.id,
        userId: user.id,
        createdAt: new Date().toISOString()
      });
      
      // Increment meme likes count
      await db.collection("memes").updateOne(
        { id: params.id },
        { $inc: { likes: 1 } }
      );
      
      return NextResponse.json({ liked: true, likes: meme.likes + 1 });
    }
  } catch (error) {
    console.error(`Error liking meme ${params.id}:`, error);
    return NextResponse.json(
      { error: "Failed to like meme" },
      { status: 500 }
    );
  }
}

// GET endpoint to check if user has liked a meme
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
    
    // Check if user liked this meme
    const userLike = await db.collection("likes").findOne({
      memeId: params.id,
      userId: user.id
    });
    
    return NextResponse.json({ liked: !!userLike });
  } catch (error) {
    console.error(`Error checking like status for meme ${params.id}:`, error);
    return NextResponse.json(
      { error: "Failed to check like status" },
      { status: 500 }
    );
  }
} 