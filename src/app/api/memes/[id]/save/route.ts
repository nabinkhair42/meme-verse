import { NextRequest, NextResponse } from "next/server";
import { verifyAuth } from "@/lib/auth";
import { successResponse, errorResponse } from "@/lib/apiResponse";
import { SavedMemeModel } from "@/models/SavedMeme";

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
    const userId = user._id?.toString();
    
    if (!userId) {
      return NextResponse.json(
        errorResponse("Invalid user ID", 400),
        { status: 400 }
      );
    }
    
    // Check if user saved this meme using SavedMemeModel
    const isSaved = await SavedMemeModel.hasSavedMeme(userId, memeId);
    
    return NextResponse.json(
      successResponse({ saved: isSaved }, "Save status checked successfully", 200),
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
    const userId = user._id?.toString();
    
    if (!userId) {
      return NextResponse.json(
        errorResponse("Invalid user ID", 400),
        { status: 400 }
      );
    }
    
    // Toggle save status using SavedMemeModel
    const saved = await SavedMemeModel.saveMeme(userId, memeId);
    
    return NextResponse.json(
      successResponse({ saved }, "Save status updated successfully", 200),
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