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
    
    // Ensure params.id is properly awaited by using it in a variable first
    const memeId = params.id;
    
    // Check if user saved this meme
    const userSave = await db.collection("saves").findOne({
      memeId,
      userId: user.id
    });
    
    return NextResponse.json({ saved: !!userSave });
  } catch (error) {
    console.error(`Error checking save status for meme ${params.id}:`, error);
    return NextResponse.json(
      { error: "Failed to check save status" },
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
    
    // Ensure params.id is properly awaited by using it in a variable first
    const memeId = params.id;
    
    // Check if user already saved this meme
    const userSave = await db.collection("saves").findOne({
      memeId,
      userId: user.id
    });
    
    let saved = false;
    
    if (userSave) {
      // User already saved this meme, so unsave it
      await db.collection("saves").deleteOne({
        memeId,
        userId: user.id
      });
    } else {
      // User hasn't saved this meme yet, so save it
      await db.collection("saves").insertOne({
        memeId,
        userId: user.id,
        createdAt: new Date().toISOString()
      });
      
      saved = true;
    }
    
    return NextResponse.json({ saved });
  } catch (error) {
    console.error(`Error toggling save for meme ${params.id}:`, error);
    return NextResponse.json(
      { error: "Failed to toggle save" },
      { status: 500 }
    );
  }
} 