import { NextRequest, NextResponse } from "next/server";
import clientPromise from "@/lib/mongodb";
import { ObjectId } from "mongodb";

// GET /api/auth/profile/[id]/memes - Get memes created by a specific user
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const { id } = params;
    const { searchParams } = new URL(request.url);
    
    // Parse pagination parameters
    const page = parseInt(searchParams.get("page") || "1", 10);
    const limit = parseInt(searchParams.get("limit") || "10", 10);
    const type = searchParams.get("type") || undefined; // "uploaded" or "generated"
    
    // Validate ObjectId
    if (!ObjectId.isValid(id)) {
      return NextResponse.json(
        { error: "Invalid user ID" },
        { status: 400 }
      );
    }
    
    const client = await clientPromise;
    const db = client.db("meme-verse");
    
    // Build query
    const query: any = { userId: id };
    
    // Add type filter if specified
    if (type === "uploaded" || type === "generated") {
      query.type = type;
    }
    
    // Calculate pagination
    const skip = (page - 1) * limit;
    
    // Get total count
    const total = await db.collection("memes").countDocuments(query);
    
    // Get memes with pagination
    const memes = await db.collection("memes")
      .find(query)
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit)
      .toArray();
    
    // Format memes for response
    const formattedMemes = memes.map(meme => ({
      id: meme._id.toString(),
      title: meme.title,
      imageUrl: meme.imageUrl,
      description: meme.description,
      likes: meme.likes || 0,
      commentCount: meme.commentCount || 0,
      category: meme.category || "Uncategorized",
      createdAt: meme.createdAt,
      type: meme.type
    }));
    
    return NextResponse.json({
      memes: formattedMemes,
      pagination: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit)
      }
    });
    
  } catch (error) {
    console.error("Error fetching user memes:", error);
    return NextResponse.json(
      { error: "Failed to fetch user memes" },
      { status: 500 }
    );
  }
} 