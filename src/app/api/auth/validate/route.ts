import { NextRequest, NextResponse } from "next/server";
import jwt from "jsonwebtoken";
import clientPromise from "@/lib/mongodb";
import { successResponse, errorResponse } from "@/lib/apiResponse";

const JWT_SECRET = process.env.JWT_SECRET || "your-secret-key";

export async function GET(request: NextRequest) {
  try {
    // Get the token from the Authorization header
    const authHeader = request.headers.get("Authorization");
    
    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      return NextResponse.json(
        errorResponse("No token provided", 401),
        { status: 401 }
      );
    }
    
    const token = authHeader.split(" ")[1];
    
    // Verify the token
    try {
      const decoded = jwt.verify(token, JWT_SECRET) as any;
      
      // Get user from database to ensure they still exist
      const client = await clientPromise;
      const db = client.db("meme-verse");
      
      const user = await db.collection("users").findOne({ 
        $or: [
          { _id: decoded.id },
          { email: decoded.email }
        ]
      });
      
      if (!user) {
        return NextResponse.json(
          errorResponse("User not found", 401),
          { status: 401 }
        );
      }
      
      // Remove password from user object
      const { password, ...userWithoutPassword } = user;
      
      return NextResponse.json(
        successResponse({ user: userWithoutPassword }, "Token is valid"),
        { status: 200 }
      );
    } catch (error) {
      console.error("Token verification error:", error);
      return NextResponse.json(
        errorResponse("Invalid token", 401),
        { status: 401 }
      );
    }
  } catch (error) {
    console.error("Validation error:", error);
    return NextResponse.json(
      errorResponse("Token validation failed", 500),
      { status: 500 }
    );
  }
} 