import { NextRequest, NextResponse } from "next/server";
import clientPromise from "@/lib/mongodb";
import { ObjectId } from "mongodb";
import { errorResponse, successResponse } from "@/lib/apiResponse";
import { verifyAuth } from "@/lib/auth";

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const userId = (await params).id;
    const { searchParams } = new URL(request.url);
    
    // Parse pagination parameters
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
        errorResponse("Unauthorized to view these memes", 403),
        { status: 403 }
      );
    }
    
    const client = await clientPromise;
    const db = client.db("meme-verse");
    
    // Build query for uploaded memes
    const query = {
      userId: userId,
      type: "uploaded"
    };
    
    // First check if user has any memes
    const totalResult = await db.collection("memes").countDocuments(query);
    
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
          "No uploaded memes found",
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
      .find(query)
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
      category: meme.category || "uncategorized",
      createdAt: meme.createdAt || new Date().toISOString(),
      author: meme.username || "Anonymous",
      authorId: meme.userId,
      type: "uploaded",
      tags: meme.tags || [],
      userAvatar: meme.userAvatar
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
        "Uploaded memes fetched successfully",
        200
      ),
      { status: 200 }
    );
    
  } catch (error) {
    console.error("Error fetching user memes:", error);
    return NextResponse.json(
      errorResponse("Failed to fetch user memes", 500),
      { status: 500 }
    );
  }
} 