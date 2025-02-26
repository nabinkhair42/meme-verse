import { NextRequest, NextResponse } from "next/server";
import { memeModel } from "@/models";
import { verifyAuth } from "@/lib/auth";
import { successResponse, errorResponse } from "@/lib/apiResponse";
import { SearchParams } from "@/types/api";

/**
 * GET /api/memes - Get all memes with pagination and filters
 */
export async function GET(request: NextRequest) {
  try {
    // Get query parameters
    const url = new URL(request.url);
    const page = parseInt(url.searchParams.get("page") || "1");
    const limit = parseInt(url.searchParams.get("limit") || "10");
    const search = url.searchParams.get("search") || "";
    const sort = url.searchParams.get("sort") || "newest";
    const category = url.searchParams.get("category") || "";
    const type = url.searchParams.get("type") || "";
    
    // Create search params
    const params: SearchParams = {
      page,
      limit,
      search,
      sort,
      category,
      type
    };
    // Get memes from database
    const result = await memeModel.findAll({
      page: params.page,
      limit: params.limit,
      search: params.search,
      sort: params.sort as "newest" | "oldest" | "popular" | "comments" | undefined,
      category: params.category,
      type: params.type
    });
    
    return NextResponse.json(
      successResponse(result),
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

/**
 * POST /api/memes - Create a new meme
 */
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
      successResponse(newMeme, "Meme created successfully"),
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

