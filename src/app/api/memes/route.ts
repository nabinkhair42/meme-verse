import { NextRequest, NextResponse } from "next/server";
import { memeModel } from "@/models";
import { verifyAuth } from "@/lib/auth";
import { successResponse, errorResponse } from "@/lib/apiResponse";
import { SearchParams } from "@/types/api";
import clientPromise from "@/lib/mongodb";

/**
 * GET /api/memes - Get all memes with pagination and filters
 */
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    
    // Parse pagination parameters
    let page = parseInt(searchParams.get("page") || "1", 10);
    const limit = parseInt(searchParams.get("limit") || "10", 10);
    const search = searchParams.get("search") || "";
    const category = searchParams.get("category") || "";
    const sort = searchParams.get("sort") || "latest";
    
    const client = await clientPromise;
    const db = client.db("meme-verse");
    
    // Build query
    const query: any = {
      isPublic: true // Only show public memes in the feed
    };
    
    // Add search filter if provided
    if (search) {
      query.$or = [
        { title: { $regex: search, $options: "i" } },
        { description: { $regex: search, $options: "i" } },
        { tags: { $in: [new RegExp(search, "i")] } }
      ];
    }
    
    // Add category filter if provided
    if (category && category !== "all") {
      query.category = category;
    }
    
    // Determine sort order
    const sortOptions: any = {
      latest: { createdAt: -1 },
      oldest: { createdAt: 1 },
      popular: { likes: -1 },
      comments: { commentCount: -1 }
    };
    
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
      .sort(sortOptions[sort] || sortOptions.latest)
      .skip(skip)
      .limit(limit)
      .toArray();
    
    // Format memes for response
    const formattedMemes = memesResult.map(meme => ({
      id: meme._id.toString(),
      title: meme.title || "",
      url: meme.url || meme.imageUrl,
      description: meme.description || "",
      category: meme.category || "Other",
      tags: meme.tags || [],
      author: meme.author || "Anonymous",
      authorId: meme.userId,
      createdAt: meme.createdAt || new Date().toISOString(),
      likes: meme.likes || 0,
      commentCount: meme.commentCount || 0,
      isGenerated: meme.isGenerated || false,
      isPublic: meme.isPublic || false,
      templateId: meme.templateId,
      templateUrl: meme.templateUrl
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
    console.error("Error fetching memes:", error);
    return NextResponse.json(
      errorResponse("Failed to fetch memes", 500),
      { status: 500 }
    );
  }
}


export async function POST(request: NextRequest) {
  try {
    // Verify user is authenticated
    const user = await verifyAuth(request);
    
    if (!user) {
      return NextResponse.json(
        errorResponse("Unauthorized", 401),
        { status: 401 }
      );
    }
    
    // Get meme data from request
    const memeData = await request.json();
    
    // Validate required fields
    if (!memeData.title || !memeData.imageUrl) {
      return NextResponse.json(
        errorResponse("Title and image URL are required", 400),
        { status: 400 }
      );
    }
    
    // Create meme in database
    const newMeme = await memeModel.create(
      {
        title: memeData.title,
        imageUrl: memeData.imageUrl,
        description: memeData.description,
        tags: Array.isArray(memeData.tags) ? memeData.tags : [],
        category: memeData.category ? memeData.category.toLowerCase() : 'other',
        type: memeData.type || 'uploaded',
        templateId: memeData.templateId,
        templateUrl: memeData.templateUrl
      },
      user._id?.toString() || "",
      user.username,
      user.avatar
    );
    
    return NextResponse.json(
      successResponse(newMeme, "Meme created successfully", 201),
      { status: 201 }
    );
  } catch (error) {
    console.error("Error creating meme:", error);
    return NextResponse.json(
      errorResponse("Failed to create meme", 500),
      { status: 500 }
    );
  }
} 

