import { NextRequest, NextResponse } from "next/server";
import clientPromise from "@/lib/mongodb";
import { verifyAuth } from "@/lib/auth";

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const user = await verifyAuth(request);
    
    if (!user || (user.id !== params.id && !user.isAdmin)) {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      );
    }
    
    const client = await clientPromise;
    const db = client.db("meme-verse");
    
    // Get all saved meme IDs for this user
    const savedMemes = await db.collection("saves")
      .find({ userId: params.id })
      .toArray();
    
    const memeIds = savedMemes.map(save => save.memeId);
    
    // Get the actual meme data for these IDs
    const memes = await db.collection("memes")
      .find({ id: { $in: memeIds } })
      .toArray();
    
    return NextResponse.json(memes);
  } catch (error) {
    return NextResponse.json(
      { error: (error as Error).message },
      { status: 500 }
    );
  }
} 