import { NextRequest, NextResponse } from "next/server";
import clientPromise from "@/lib/mongodb";
import { verifyAuth } from "@/lib/auth";
import { ObjectId } from "mongodb";

// GET /api/auth/me - Get current user profile
export async function GET(request: NextRequest) {
  try {
    // Get the current user session
    const user = await verifyAuth(request);
    if (!user || !user._id) {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      );
    }
    
    const client = await clientPromise;
    const db = client.db("meme-verse");
    
    // Get user from database
    const userId = typeof user._id === 'string' ? new ObjectId(user._id) : user._id;
    
    const dbUser = await db.collection("users").findOne(
      { _id: userId },
      { projection: { password: 0 } } // Exclude password
    );
    
    if (!dbUser) {
      return NextResponse.json(
        { error: "User not found" },
        { status: 404 }
      );
    }
    
    // Get user stats
    const userIdStr = userId.toString();
    const memesCount = await db.collection("memes").countDocuments({ userId: userIdStr });
    const likesReceived = await db.collection("memes").aggregate([
      { $match: { userId: userIdStr } },
      { $group: { _id: null, total: { $sum: "$likes" } } }
    ]).toArray();
    
    const totalLikes = likesReceived.length > 0 ? likesReceived[0].total : 0;
    
    return NextResponse.json({
      id: dbUser._id,
      name: dbUser.name,
      email: dbUser.email,
      username: dbUser.username,
      bio: dbUser.bio || "",
      avatar: dbUser.avatar || "",
      createdAt: dbUser.createdAt,
      stats: {
        memes: memesCount,
        likes: totalLikes
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

// PATCH /api/auth/me - Update current user profile
export async function PATCH(request: NextRequest) {
  try {
    // Get the current user session
    const user = await verifyAuth(request);
    if (!user || !user._id) {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      );
    }
    
    // Parse request body
    const body = await request.json();
    
    // Validate fields
    const { username, name, bio, avatar } = body;
    
    // Create update object with only provided fields
    const updateData: any = {};
    if (username !== undefined) updateData.username = username;
    if (name !== undefined) updateData.name = name;
    if (bio !== undefined) updateData.bio = bio;
    if (avatar !== undefined) updateData.avatar = avatar;
    
    // Add updatedAt timestamp
    updateData.updatedAt = new Date();
    
    const client = await clientPromise;
    const db = client.db("meme-verse");
    
    // Convert user._id to ObjectId if it's a string
    const userId = typeof user._id === 'string' ? new ObjectId(user._id) : user._id;
    
    // Check if username is already taken (if username is being updated)
    if (username) {
      const existingUser = await db.collection("users").findOne({ 
        username, 
        _id: { $ne: userId } 
      });
      
      if (existingUser) {
        return NextResponse.json(
          { error: "Username is already taken" },
          { status: 400 }
        );
      }
    }
    
    // Update user in database
    const result = await db.collection("users").updateOne(
      { _id: userId },
      { $set: updateData }
    );
    
    if (result.matchedCount === 0) {
      return NextResponse.json(
        { error: "User not found" },
        { status: 404 }
      );
    }
    
    // Get updated user
    const updatedUser = await db.collection("users").findOne(
      { _id: userId },
      { projection: { password: 0 } }
    );
    
    return NextResponse.json({
      id: updatedUser?._id,
      name: updatedUser?.name,
      email: updatedUser?.email,
      username: updatedUser?.username,
      bio: updatedUser?.bio || "",
      avatar: updatedUser?.avatar || "",
      updatedAt: updatedUser?.updatedAt
    });
    
  } catch (error) {
    console.error("Error updating user profile:", error);
    return NextResponse.json(
      { error: "Failed to update user profile" },
      { status: 500 }
    );
  }
} 