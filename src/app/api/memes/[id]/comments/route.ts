import { NextRequest, NextResponse } from "next/server";
import clientPromise from "@/lib/mongodb";
import { verifyAuth } from "@/lib/auth";
import { v4 as uuidv4 } from "uuid";

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
    
    const data = await request.json();
    const { text } = data;
    
    if (!text || text.trim() === "") {
      return NextResponse.json(
        { error: "Comment text is required" },
        { status: 400 }
      );
    }
    
    const client = await clientPromise;
    const db = client.db("meme-verse");
    
    // Create comment object
    const comment = {
      id: uuidv4(),
      text,
      author: user.username,
      authorId: user.id,
      createdAt: new Date().toISOString()
    };
    
    // Add comment to meme
    await db.collection("memes").updateOne(
      { id: params.id },
      { $push: { comments: comment } }
    );
    
    return NextResponse.json(comment);
  } catch (error) {
    console.error(`Error adding comment to meme ${params.id}:`, error);
    return NextResponse.json(
      { error: "Failed to add comment" },
      { status: 500 }
    );
  }
}

// GET endpoint to get all comments for a meme
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const client = await clientPromise;
    const db = client.db("meme-verse");
    
    // Get meme with comments
    const meme = await db.collection("memes").findOne(
      { id: params.id },
      { projection: { comments: 1 } }
    );
    
    if (!meme) {
      return NextResponse.json(
        { error: "Meme not found" },
        { status: 404 }
      );
    }
    
    return NextResponse.json(meme.comments || []);
  } catch (error) {
    console.error(`Error fetching comments for meme ${params.id}:`, error);
    return NextResponse.json(
      { error: "Failed to fetch comments" },
      { status: 500 }
    );
  }
} 