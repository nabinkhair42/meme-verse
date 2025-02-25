import { NextRequest, NextResponse } from "next/server";
import { commentModel } from "@/models";
import { verifyAuth } from "@/lib/auth";
import { successResponse, errorResponse } from "@/lib/apiResponse";

/**
 * GET /api/memes/[id]/comments - Get comments for a meme
 */
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    // IMPORTANT: Await the params object before accessing its properties
    const memeId = (await params).id;
    
    // Get comments from database
    const comments = await commentModel.findByMemeId(memeId);
    
    return NextResponse.json(
      successResponse(comments),
      { status: 200 }
    );
  } catch (error) {
    console.error("Error fetching comments:", error);
    return NextResponse.json(
      errorResponse("Failed to fetch comments", 500),
      { status: 500 }
    );
  }
}

/**
 * POST /api/memes/[id]/comments - Add a comment to a meme
 */
export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    // Verify user is authenticated
    const user = await verifyAuth(request);
    
    if (!user) {
      return NextResponse.json(
        errorResponse("Unauthorized", 401),
        { status: 401 }
      );
    }
    
    // IMPORTANT: Await the params object before accessing its properties
    const memeId = (await params).id;
    
    // Get comment data from request
    const data = await request.json();
    
    // Check if text exists
    if (!data.text || typeof data.text !== 'string') {
      return NextResponse.json(
        errorResponse("Comment text is required and must be a string", 400),
        { status: 400 }
      );
    }
    
    // Create comment in database with the text field mapped to content
    const newComment = await commentModel.create(
      {
        memeId,
        content: data.text
      },
      user._id?.toString() || "",
      user.username,
      user.avatar
    );
    
    return NextResponse.json(
      successResponse(newComment, "Comment added successfully"),
      { status: 201 }
    );
  } catch (error) {
    console.error("Error adding comment:", error);
    return NextResponse.json(
      errorResponse("Failed to add comment", 500),
      { status: 500 }
    );
  }
} 