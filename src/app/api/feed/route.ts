import { NextRequest, NextResponse } from "next/server";
import clientPromise from "@/lib/mongodb";
import { successResponse, errorResponse } from "@/lib/apiResponse";

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    
    // Parse pagination parameters
    let page = parseInt(searchParams.get("page") || "1", 10);
    const limit = parseInt(searchParams.get("limit") || "10", 10);
    const category = searchParams.get("category") || "";
    
    const client = await clientPromise;
    const db = client.db("meme-verse");
    
    // Build query for public memes
    const query: any = {
      $or: [
        { 
          $and: [
            { isGenerated: true },
            { isPublic: true }
          ]
        },
        { type: "uploaded" }
      ]
    };
    
    // Add category filter if provided
    if (category && category !== "all") {
      query.category = category;
    }
    
    // First check total count
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
          "No memes found",
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
    
    // Format memes for response with consistent field names
    const formattedMemes = memesResult.map(meme => ({
      id: meme._id.toString(),
      title: meme.title,
      imageUrl: meme.imageUrl || meme.url, // Handle both field names
      description: meme.description || "",
      category: meme.category || "Other",
      tags: meme.tags || [],
      author: meme.username || meme.author || "Anonymous",
      authorId: meme.userId,
      userAvatar: meme.userAvatar,
      createdAt: meme.createdAt,
      updatedAt: meme.updatedAt || meme.createdAt,
      likes: meme.likes || 0,
      commentCount: meme.commentCount || 0,
      type: meme.type || "uploaded",
      isGenerated: meme.isGenerated || false,
      isPublic: meme.isPublic || false,
      templateId: meme.templateId || null,
      templateUrl: meme.templateUrl || null
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
        "Memes fetched successfully",
        200
      ),
      { status: 200 }
    );
    
  } catch (error) {
    console.error("Error fetching feed:", error);
    return NextResponse.json(
      errorResponse("Failed to fetch feed", 500),
      { status: 500 }
    );
  }
} 