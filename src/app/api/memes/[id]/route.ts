import { NextRequest, NextResponse } from "next/server";
import clientPromise from "@/lib/mongodb";

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const client = await clientPromise;
    const db = client.db("meme-verse");
    
    const meme = await db.collection("memes").findOne({ id: params.id });
    
    if (!meme) {
      return NextResponse.json(
        { error: "Meme not found" },
        { status: 404 }
      );
    }
    
    return NextResponse.json(meme);
  } catch (error) {
    console.error("Error fetching meme:", error);
    return NextResponse.json(
      { error: "Failed to fetch meme" },
      { status: 500 }
    );
  }
}

export async function PATCH(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const client = await clientPromise;
    const db = client.db("meme-verse");
    
    const data = await request.json();
    
    const result = await db
      .collection("memes")
      .updateOne({ id: params.id }, { $set: data });
    
    if (result.matchedCount === 0) {
      return NextResponse.json(
        { error: "Meme not found" },
        { status: 404 }
      );
    }
    
    const updatedMeme = await db.collection("memes").findOne({ id: params.id });
    
    return NextResponse.json(updatedMeme);
  } catch (error) {
    console.error("Error updating meme:", error);
    return NextResponse.json(
      { error: "Failed to update meme" },
      { status: 500 }
    );
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const client = await clientPromise;
    const db = client.db("meme-verse");
    
    const result = await db.collection("memes").deleteOne({ id: params.id });
    
    if (result.deletedCount === 0) {
      return NextResponse.json(
        { error: "Meme not found" },
        { status: 404 }
      );
    }
    
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error deleting meme:", error);
    return NextResponse.json(
      { error: "Failed to delete meme" },
      { status: 500 }
    );
  }
} 