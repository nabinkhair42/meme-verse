import { NextRequest, NextResponse } from "next/server";
import clientPromise from "@/lib/mongodb";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import { v4 as uuidv4 } from "uuid";

const JWT_SECRET = process.env.JWT_SECRET || "your-secret-key";

export async function POST(request: NextRequest) {
  try {
    // Only allow in development
    if (process.env.NODE_ENV !== "development") {
      return NextResponse.json(
        { error: "This endpoint is only available in development mode" },
        { status: 403 }
      );
    }
    
    const client = await clientPromise;
    const db = client.db("meme-verse");
    
    // Create a test user
    const testUser = {
      id: uuidv4(),
      username: "testuser",
      email: "test@example.com",
      password: await bcrypt.hash("password123", 10),
      avatar: "https://api.dicebear.com/7.x/avataaars/svg?seed=testuser",
      bio: "This is a test user for debugging",
      joinDate: new Date().toISOString(),
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };
    
    // Check if user already exists
    const existingUser = await db.collection("users").findOne({
      $or: [{ email: testUser.email }, { username: testUser.username }]
    });
    
    if (existingUser) {
      // Update the existing user
      await db.collection("users").updateOne(
        { _id: existingUser._id },
        { $set: { ...testUser, _id: existingUser._id } }
      );
      
      // Create token
      const token = jwt.sign(
        { id: existingUser.id || existingUser._id, email: testUser.email, username: testUser.username },
        JWT_SECRET,
        { expiresIn: "7d" }
      );
      
      const { password, ...userWithoutPassword } = testUser;
      
      return NextResponse.json({
        message: "Test user updated",
        token,
        user: { ...userWithoutPassword, _id: existingUser._id }
      });
    }
    
    // Insert new user
    const result = await db.collection("users").insertOne(testUser);
    
    // Create token
    const token = jwt.sign(
      { id: testUser.id, email: testUser.email, username: testUser.username },
      JWT_SECRET,
      { expiresIn: "7d" }
    );
    
    const { password, ...userWithoutPassword } = testUser;
    
    return NextResponse.json({
      message: "Test user created",
      token,
      user: userWithoutPassword
    });
  } catch (error) {
    console.error("Error creating test user:", error);
    return NextResponse.json(
      { error: "Failed to create test user", details: error.message },
      { status: 500 }
    );
  }
} 