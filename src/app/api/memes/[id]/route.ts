import { NextRequest, NextResponse } from "next/server";
import { memeModel } from "@/models";
import { verifyAuth } from "@/lib/auth";
import { successResponse, errorResponse } from "@/lib/apiResponse";

/**
 * GET /api/memes/[id] - Get a meme by ID
 */
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    // IMPORTANT: Await the params object before accessing its properties
    const memeId = (await params).id;
    
    // Get meme from database
    const meme = await memeModel.findById(memeId);
    
    if (!meme) {
      return NextResponse.json(
        errorResponse("Meme not found", 404),
        { status: 404 }
      );
    }
    
    return NextResponse.json(
      successResponse(meme, "Meme fetched successfully", 200),
      { status: 200 }
    );
  } catch (error) {
    console.error("Error fetching meme:", error);
    return NextResponse.json(
      errorResponse("Failed to fetch meme", 500),
      { status: 500 }
    );
  }
}

/**
 * PATCH /api/memes/[id] - Update a meme
 */
export async function PATCH(
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
    
    // Get meme from database
    const meme = await memeModel.findById(memeId);
    
    if (!meme) {
      return NextResponse.json(
        errorResponse("Meme not found", 404),
        { status: 404 }
      );
    }
    
    // Check if user is the owner of the meme
    // Convert both to string for comparison
    if (String(meme.userId) !== String(user._id)) {
      return NextResponse.json(
        errorResponse("You are not authorized to update this meme", 403),
        { status: 403 }
      );
    }
    
    // Get update data from request
    const updateData = await request.json();
    
    // Update meme in database
    const updatedMeme = await memeModel.update(memeId, updateData);
    
    return NextResponse.json(
      successResponse(updatedMeme, "Meme updated successfully", 200),
      { status: 200 }
    );
  } catch (error) {
    console.error("Error updating meme:", error);
    return NextResponse.json(
      errorResponse("Failed to update meme", 500),
      { status: 500 }
    );
  }
}

/**
 * DELETE /api/memes/[id] - Delete a meme
 */
export async function DELETE(
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
    
    // Get meme from database
    const meme = await memeModel.findById(memeId);
    
    if (!meme) {
      return NextResponse.json(
        errorResponse("Meme not found", 404),
        { status: 404 }
      );
    }
    
    // Check if user is the owner of the meme or an admin
    // Convert both to string for comparison
    if (String(meme.userId) !== String(user._id) && user.role !== 'admin') {
      return NextResponse.json(
        errorResponse("You are not authorized to delete this meme", 403),
        { status: 403 }
      );
    }
    
    // Delete meme from database
    const deleted = await memeModel.delete(memeId);
    
    if (!deleted) {
      return NextResponse.json(
        errorResponse("Failed to delete meme", 500),
        { status: 500 }
      );
    }
    
    return NextResponse.json(
      successResponse({ success: true }, "Meme deleted successfully", 200),
      { status: 200 }
    );
  } catch (error) {
    console.error("Error deleting meme:", error);
    return NextResponse.json(
      errorResponse("Failed to delete meme", 500),
      { status: 500 }
    );
  }
} 