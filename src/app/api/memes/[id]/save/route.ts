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
    
    // IMPORTANT: Await the params object before accessing its properties
    const memeId = (await params).id;
    
    // Get the database connection
    const client = await clientPromise;
    const db = client.db("meme-verse");
    
    // Check if user saved this meme
    const userSave = await db.collection("saves").findOne({
      memeId,
      userId: user.id
    });
    
    return NextResponse.json(
      successResponse({ saved: !!userSave }),
      { status: 200 }
    );
  } catch (error) {
    console.error("Error checking save status:", error);
    return NextResponse.json(
      errorResponse("Failed to check save status", 500),
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
    
    return NextResponse.json(
      successResponse({ saved }),
      { status: 200 }
    );
  } catch (error) {
    console.error("Error toggling save:", error);
    return NextResponse.json(
      errorResponse("Failed to update save status", 500),
      { status: 500 }
    );
  }
} 