import { NextRequest } from "next/server";
import jwt from "jsonwebtoken";
import clientPromise from "@/lib/mongodb";

const JWT_SECRET = process.env.JWT_SECRET || "memeverse-secret-key";

export const verifyAuth = async (request: NextRequest) => {
  try {
    // Get token from cookie or authorization header
    const token = request.cookies.get("auth-token")?.value || 
                  request.headers.get("authorization")?.split("Bearer ")[1];
    
    if (!token) {
      return null;
    }
    
    // Verify token
    const decoded = jwt.verify(token, JWT_SECRET) as {
      id: string;
      email: string;
      username: string;
    };
    
    // Get user from database
    const client = await clientPromise;
    const db = client.db("meme-verse");
    
    const user = await db.collection("users").findOne({ id: decoded.id });
    
    if (!user) {
      return null;
    }
    
    // Return user without password
    const { password, ...userWithoutPassword } = user;
    return userWithoutPassword;
  } catch (error) {
    console.error("Auth verification error:", error);
    return null;
  }
}; 