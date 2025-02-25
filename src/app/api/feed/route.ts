import { NextRequest, NextResponse } from "next/server";
import clientPromise from "@/lib/mongodb";
import { verifyAuth } from "@/lib/auth";

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const page = parseInt(searchParams.get("page") || "1");
    const limit = parseInt(searchParams.get("limit") || "10");
    
    const skip = (page - 1) * limit;
    
    const client = await clientPromise;
    const db = client.db("meme-verse");
    
    // Try to get the user for personalized feed
    const user = await verifyAuth(request);
    
    let query = {};
    let sortOption = { createdAt: -1 };
    
    // If user is authenticated, we can personalize the feed
    if (user) {
      // Get categories from user's liked and saved memes
      const userLikes = await db.collection("likes")
        .find({ userId: user.id })
        .toArray();
      
      const likedMemeIds = userLikes.map(like => like.memeId);
      
      if (likedMemeIds.length > 0) {
        // Get categories from liked memes
        const likedMemes = await db.collection("memes")
          .find({ id: { $in: likedMemeIds } })
          .toArray();
        
        const likedCategories = [...new Set(likedMemes.map(meme => meme.category))];
        
        if (likedCategories.length > 0) {
          // Boost memes from categories the user likes
          query = {
            $or: [
              { category: { $in: likedCategories } },
              {} // Still include all memes, but they'll be ranked lower
            ]
          };
          
          // Custom sort: first by category match, then by recency
          sortOption = { 
            categoryMatch: -1, // This will be added in the aggregation
            createdAt: -1 
          };
        }
      }
    }
    
    // Get memes with pagination
    let memes;
    
    if (user && Object.keys(query).length > 0) {
      // Personalized feed with aggregation
      const likedCategories = [...new Set(
        (await db.collection("memes")
          .find({ id: { $in: await db.collection("likes")
            .find({ userId: user.id })
            .map(like => like.memeId)
            .toArray() } })
          .toArray())
          .map(meme => meme.category)
      )];
      
      memes = await db.collection("memes")
        .aggregate([
          { $match: query },
          { $addFields: {
            categoryMatch: {
              $cond: [
                { $in: ["$category", likedCategories] },
                1,
                0
              ]
            }
          }},
          { $sort: sortOption },
          { $skip: skip },
          { $limit: limit }
        ])
        .toArray();
    } else {
      // Standard feed
      memes = await db.collection("memes")
        .find(query)
        .sort(sortOption)
        .skip(skip)
        .limit(limit)
        .toArray();
    }
    
    // Get total count for pagination
    const total = await db.collection("memes").countDocuments(query);
    
    return NextResponse.json({
      memes,
      pagination: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
      },
    });
  } catch (error) {
    console.error("Error fetching feed:", error);
    return NextResponse.json(
      { error: "Failed to fetch feed" },
      { status: 500 }
    );
  }
} 