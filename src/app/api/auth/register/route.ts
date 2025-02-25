import { NextRequest, NextResponse } from "next/server";
import clientPromise from "@/lib/mongodb";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import { successResponse, errorResponse } from "@/lib/apiResponse";

const JWT_SECRET = process.env.JWT_SECRET || "your-secret-key";

export async function POST(request: NextRequest) {
  try {
    const { username, email, password } = await request.json();
    
    if (!username || !email || !password) {
      return NextResponse.json(
        errorResponse("All fields are required", 400),
        { status: 400 }
      );
    }
    
    const client = await clientPromise;
    const db = client.db("meme-verse");
    
    // Check if user already exists
    const existingUser = await db.collection("users").findOne({
      $or: [{ email }, { username }]
    });
    
    if (existingUser) {
      return NextResponse.json(
        errorResponse("User already exists", 400),
        { status: 400 }
      );
    }
    
    // Hash password
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);
    
    // Create user
    const newUser = {
      username,
      email,
      password: hashedPassword,
      avatar: `https://api.dicebear.com/7.x/avataaars/svg?seed=${username}`,
      bio: "",
      joinDate: new Date().toISOString(),
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };
    
    await db.collection("users").insertOne(newUser);
    
    // Create token
    const token = jwt.sign(
      { email, username },
      JWT_SECRET,
      { expiresIn: "7d" }
    );
    
    // Remove password from user object
    const { password: _, ...userWithoutPassword } = newUser;
    
    return NextResponse.json(
      successResponse(
        { token, user: userWithoutPassword },
        "Registration successful",
        201
      ),
      { status: 201 }
    );
  } catch (error) {
    console.error("Registration error:", error);
    return NextResponse.json(
      errorResponse("Registration failed", 500),
      { status: 500 }
    );
  }
} 