import { NextRequest, NextResponse } from "next/server";
import clientPromise from "@/lib/mongodb";
import { ObjectId } from "mongodb";

// GET /api/auth/profile/[id] - Get user profile by ID
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const { id } = params;
    
    // Validate ObjectId
    if (!ObjectId.isValid(id)) {
      return NextResponse.json(
        { error: "Invalid user ID" },
        { status: 400 }
      );
    }
    
    const client = await clientPromise;
    const db = client.db("meme-verse");
    
    // Get user from database
    const user = await db.collection("users").findOne(
      { _id: new ObjectId(id) },
      { projection: { password: 0, email: 0 } } // Exclude sensitive data
    );
    
    if (!user) {
      return NextResponse.json(
        { error: "User not found" },
        { status: 404 }
      );
    }
    
    // Get user stats
    const memesCount = await db.collection("memes").countDocuments({ userId: id });
    const likesReceived = await db.collection("memes").aggregate([
      { $match: { userId: id } },
      { $group: { _id: null, total: { $sum: "$likes" } } }
    ]).toArray();
    
    const totalLikes = likesReceived.length > 0 ? likesReceived[0].total : 0;
    
    // Get user's top categories
    const topCategories = await db.collection("memes").aggregate([
      { $match: { userId: id } },
      { $group: { _id: "$category", count: { $sum: 1 } } },
      { $sort: { count: -1 } },
      { $limit: 3 }
    ]).toArray();
    
    return NextResponse.json({
      id: user._id,
      username: user.username,
      name: user.name,
      bio: user.bio || "",
      avatar: user.avatar || "",
      createdAt: user.createdAt,
      stats: {
        memes: memesCount,
        likes: totalLikes,
        topCategories: topCategories.map(cat => ({
          name: cat._id || "Uncategorized",
          count: cat.count
        }))
      }
    });
    
  } catch (error) {
    console.error("Error fetching user profile:", error);
    return NextResponse.json(
      { error: "Failed to fetch user profile" },
      { status: 500 }
    );
  }
} 