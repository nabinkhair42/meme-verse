import { NextRequest, NextResponse } from "next/server";
import clientPromise from "@/lib/mongodb";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import { successResponse, errorResponse } from "@/lib/apiResponse";

const JWT_SECRET = process.env.JWT_SECRET || "your-secret-key";

export async function POST(request: NextRequest) {
  try {
    const { email, password } = await request.json();
    
    if (!email || !password) {
      return NextResponse.json(
        errorResponse("Email and password are required", 400),
        { status: 400 }
      );
    }
    
    const client = await clientPromise;
    const db = client.db("meme-verse");
    
    // Find user by email
    const user = await db.collection("users").findOne({ email });
    
    if (!user) {
      return NextResponse.json(
        errorResponse("Invalid credentials", 401),
        { status: 401 }
      );
    }
    
    // Compare passwords
    const isMatch = await bcrypt.compare(password, user.password);
    
    if (!isMatch) {
      return NextResponse.json(
        errorResponse("Invalid credentials", 401),
        { status: 401 }
      );
    }
    
    // Create token
    const token = jwt.sign(
      { id: user._id, email: user.email, username: user.username },
      JWT_SECRET,
      { expiresIn: "7d" }
    );
    
    // Remove password from user object
    const { password: _, ...userWithoutPassword } = user;
    
    return NextResponse.json(
      successResponse(
        { token, user: userWithoutPassword },
        "Login successful",
        200
      ),
      { status: 200 }
    );
  } catch (error) {
    console.error("Login error:", error);
    return NextResponse.json(
      errorResponse("Login failed", 500),
      { status: 500 }
    );
  }
} 