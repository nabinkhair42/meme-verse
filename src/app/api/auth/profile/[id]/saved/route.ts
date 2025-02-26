import { NextRequest, NextResponse } from "next/server";
import clientPromise from "@/lib/mongodb";
import { ObjectId } from "mongodb";
import { verifyAuth } from "@/lib/auth";
import { successResponse, errorResponse } from "@/lib/apiResponse";
import { SavedMemeModel } from "@/models/SavedMeme";

// GET /api/auth/profile/[id]/saved - Get memes saved by a specific user
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const userId = (await params).id;
    const { searchParams } = new URL(request.url);
    
    // Parse pagination parameters with mutable page
    let page = parseInt(searchParams.get("page") || "1", 10);
    const limit = parseInt(searchParams.get("limit") || "9", 10);
    
    // Validate ObjectId
    if (!ObjectId.isValid(userId)) {
      return NextResponse.json(
        errorResponse("Invalid user ID", 400),
        { status: 400 }
      );
    }
    
    // Verify authentication for private data
    const currentUser = await verifyAuth(request);
    if (!currentUser || !currentUser._id) {
      return NextResponse.json(
        errorResponse("Unauthorized", 401),
        { status: 401 }
      );
    }

    const isOwnProfile = currentUser._id.toString() === userId;
    if (!isOwnProfile) {
      return NextResponse.json(
        errorResponse("Unauthorized to view saved memes", 403),
        { status: 403 }
      );
    }
    
    const client = await clientPromise;
    const db = client.db("meme-verse");
    
    // First get the saved meme IDs for the user
    const savedMemeIds = await SavedMemeModel.getSavedMemes(userId);
    
    if (!savedMemeIds.length) {
      return NextResponse.json(
        successResponse(
          {
            memes: [],
            pagination: {
              total: 0,
              page,
              limit,
              totalPages: 0
            }
          },
          "No saved memes found",
          200
        ),
        { status: 200 }
      );
    }

    // Convert saved meme IDs to ObjectIds
    const memeObjectIds = savedMemeIds
      .filter(id => ObjectId.isValid(id))
      .map(id => new ObjectId(id));

    // First check total count
    const totalResult = await db.collection("memes").countDocuments({
      _id: { $in: memeObjectIds }
    });
    
    if (totalResult === 0) {
      return NextResponse.json(
        successResponse(
          {
            memes: [],
            pagination: {
              total: 0,
              page,
              limit,
              totalPages: 0
            }
          },
          "No saved memes found",
          200
        ),
        { status: 200 }
      );
    }
    
    // Calculate pagination
    const totalPages = Math.ceil(totalResult / limit);
    
    // Adjust page number if it exceeds total pages
    if (page > totalPages) {
      page = totalPages;
    }
    
    const skip = (page - 1) * limit;
    
    // Get memes with pagination
    const memesResult = await db.collection("memes")
      .find({
        _id: { $in: memeObjectIds }
      })
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit)
      .toArray();

    // Format memes for response
    const formattedMemes = memesResult.map(meme => ({
      id: meme._id.toString(),
      title: meme.title || "",
      imageUrl: meme.imageUrl,
      description: meme.description || "",
      likes: meme.likes || 0,
      commentCount: meme.commentCount || 0,
      category: meme.category || "Saved",
      createdAt: meme.createdAt || new Date().toISOString(),
      author: meme.username || "Anonymous",
      authorId: meme.userId?.toString(),
      type: "saved"
    }));
    
    return NextResponse.json(
      successResponse(
        {
          memes: formattedMemes,
          pagination: {
            total: totalResult,
            page,
            limit,
            totalPages
          }
        },
        "Saved memes fetched successfully",
        200
      ),
      { status: 200 }
    );
    
  } catch (error) {
    console.error("Error fetching saved memes:", error);
    return NextResponse.json(
      errorResponse("Failed to fetch saved memes", 500),
      { status: 500 }
    );
  }
} 