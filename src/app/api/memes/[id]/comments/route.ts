import { NextRequest, NextResponse } from "next/server";
import clientPromise from "@/lib/mongodb";
import { verifyAuth } from "@/lib/auth";
import { v4 as uuidv4 } from "uuid";

export async function GET(
  request: NextRequest,
  context: { params: { id: string } }
) {
  try {
    const client = await clientPromise;
    const db = client.db("meme-verse");
    
    // Get the ID from params
    const memeId = String(context.params.id);
    
    // Get comments for this meme
    const comments = await db.collection("comments")
      .find({ memeId })
      .sort({ createdAt: -1 })
      .toArray();
    
    return NextResponse.json(comments);
  } catch (error) {
    console.error(`Error fetching comments:`, error);
    return NextResponse.json(
      { error: "Failed to fetch comments" },
      { status: 500 }
    );
  }
}

export async function POST(
  request: NextRequest,
  context: { params: { id: string } }
) {
  try {
    const user = await verifyAuth(request);
    
    if (!user) {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      );
    }
    
    const { text } = await request.json();
    
    if (!text) {
      return NextResponse.json(
        { error: "Comment text is required" },
        { status: 400 }
      );
    }
    
    const client = await clientPromise;
    const db = client.db("meme-verse");
    
    // Get the ID from params
    const memeId = String(context.params.id);
    
    // Create new comment
    const newComment = {
      id: uuidv4(),
      memeId,
      userId: user.id,
      author: user.username,
      authorAvatar: user.avatar,
      text,
      createdAt: new Date().toISOString()
    };
    
    await db.collection("comments").insertOne(newComment);
    
    // Update meme with new comment
    await db.collection("memes").updateOne(
      { id: memeId },
      { $push: { comments: newComment.id } as any }
    );
    
    return NextResponse.json(newComment);
  } catch (error) {
    console.error(`Error adding comment:`, error);
    return NextResponse.json(
      { error: "Failed to add comment" },
      { status: 500 }
    );
  }
} 