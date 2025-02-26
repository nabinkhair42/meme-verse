import { NextRequest, NextResponse } from "next/server";
import clientPromise from "@/lib/mongodb";
import { verifyAuth } from "@/lib/auth";
import { successResponse, errorResponse } from "@/lib/apiResponse";

/**
 * GET /api/category - Get memes by category with pagination
 */
export async function GET(request: NextRequest) {
  try {
    // Get user from auth (optional)
    const user = await verifyAuth(request).catch(() => null);
    const userId = user?._id?.toString();
    
    // Get query parameters
    const { searchParams } = new URL(request.url);
    const page = parseInt(searchParams.get("page") || "1");
    const limit = parseInt(searchParams.get("limit") || "10");
    const category = searchParams.get("category") || "";
    console.log("Asked Category",category);
    const sort = searchParams.get("sort") || "newest";
    
    if (!category || category === 'All') {
      return NextResponse.json(
        errorResponse("Category parameter is required", 400),
        { status: 400 }
      );
    }
    
    // Connect to database
    const client = await clientPromise;
    const db = client.db("meme-verse");
    
    // Build query
    const query: any = { category };
    
    // Determine sort order
    let sortOptions: any = {};
    switch (sort) {
      case 'newest':
        sortOptions = { createdAt: -1 };
        break;
      case 'oldest':
        sortOptions = { createdAt: 1 };
        break;
      case 'most-liked':
        sortOptions = { likes: -1 };
        break;
      case 'most-commented':
        sortOptions = { commentCount: -1 };
        break;
      default:
        sortOptions = { createdAt: -1 };
    }
    
    // Calculate pagination
    const skip = (page - 1) * limit;
    
    // Get total count
    const total = await db.collection("memes").countDocuments(query);
    
    // Get memes
    const memes = await db.collection("memes")
      .find(query)
      .sort(sortOptions)
      .skip(skip)
      .limit(limit)
      .toArray();
    
    // Check if user has liked or saved these memes
    let likedMemes: string[] = [];
    let savedMemes: string[] = [];
    
    if (userId) {
      // Get liked memes for this user
      const likedMemesData = await db.collection('likes')
        .find({ userId })
        .toArray();
      
      likedMemes = likedMemesData.map(like => like.memeId);
      
      // Get saved memes for this user
      const savedMemesData = await db.collection('saved_memes')
        .find({ userId })
        .toArray();
      
      savedMemes = savedMemesData.map(saved => saved.memeId);
    }
    
    // Add like and save status to memes
    const memesWithStatus = memes.map(meme => ({
      ...meme,
      isLiked: likedMemes.includes(meme._id.toString()),
      isSaved: savedMemes.includes(meme._id.toString())
    }));
    
    return NextResponse.json(
      successResponse(memesWithStatus, "Memes fetched successfully", 200),
      { status: 200 }
    );
  } catch (error) {
    console.error("Error fetching category memes:", error);
    return NextResponse.json(
      errorResponse("Failed to fetch category memes", 500),
      { status: 500 }
    );
  }
} 