import { NextRequest, NextResponse } from "next/server";
import clientPromise from "@/lib/mongodb";

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const client = await clientPromise;
    const db = client.db("meme-verse");
    
    const memes = await db
      .collection("memes")
      .find({ authorId: params.id })
      .sort({ createdAt: -1 })
      .toArray();
    
    return NextResponse.json(memes);
  } catch (error) {
    console.error(`Error fetching memes for user ${params.id}:`, error);
    return NextResponse.json(
      { error: "Failed to fetch user memes" },
      { status: 500 }
    );
  }
} 