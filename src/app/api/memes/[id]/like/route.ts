import { NextRequest, NextResponse } from "next/server";
import { verifyAuth } from "@/lib/auth";
import { successResponse, errorResponse } from "@/lib/apiResponse";
import { LikedMemeModel } from "@/models/LikedMeme";
import { MemeModel } from "@/models";

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
    
    // Check if user liked this meme using LikedMemeModel
    const isLiked = await LikedMemeModel.hasLikedMeme(userId, memeId);
    
    
    return NextResponse.json(
      successResponse(isLiked, "Liked meme status fetched successfully", 200),
      { status: 200 }
    );
  } catch (error) {
    console.error("Error checking meme like status:", error);
    return NextResponse.json(
      errorResponse("Failed to check like status", 500),
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
    
    // Toggle like status using LikedMemeModel
    // This will handle checking if already liked, toggling the status,
    // and updating the meme's likes count
    const liked = await LikedMemeModel.likeMeme(userId, memeId);
    
    // Get updated likes count
    const likes = await LikedMemeModel.countLikes(memeId);
    
    return NextResponse.json(
      successResponse(liked, "Liked meme status fetched successfully", 200),
      { status: 200 }
    );
  } catch (error) {
    console.error("Error toggling like:", error);
    return NextResponse.json(
      errorResponse("Failed to update like status", 500),
      { status: 500 }
    );
  }
} 