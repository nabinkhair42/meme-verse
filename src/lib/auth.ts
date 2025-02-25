import { NextRequest } from "next/server";
import jwt from "jsonwebtoken";
import { User } from "@/types/user";
import { ObjectId } from "mongodb";
import clientPromise from "@/lib/mongodb";

// JWT secret key
const JWT_SECRET = process.env.JWT_SECRET || "your-secret-key";

/**
 * Generate a JWT token for a user
 */
export function generateToken(user: User): string {
  return jwt.sign(
    { 
      id: user._id, 
      email: user.email, 
      username: user.username,
      role: user.role || 'user'
    },
    JWT_SECRET,
    { expiresIn: "7d" }
  );
}

/**
 * Verify a JWT token
 */
export function verifyToken(token: string): any {
  try {
    return jwt.verify(token, JWT_SECRET);
  } catch (error) {
    return null;
  }
}

/**
 * Verify authentication from a request
 */
export async function verifyAuth(request: NextRequest): Promise<User | null> {
  try {
    // Get token from Authorization header
    const authHeader = request.headers.get("Authorization");
    
    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      return null;
    }
    
    const token = authHeader.split(" ")[1];
    
    // Verify token
    const decoded = verifyToken(token);
    
    if (!decoded || !decoded.id) {
      return null;
    }
    
    // Get user from database directly instead of using userModel
    const client = await clientPromise;
    const db = client.db("meme-verse");
    
    const objectId = new ObjectId(decoded.id);
    const user = await db.collection("users").findOne({ _id: objectId });
    
    if (!user) {
      return null;
    }
    
    // Remove password from returned user
    if (user.password) {
      delete user.password;
    }
    
    // Convert to User type
    return {
      _id: user._id.toString(),
      username: user.username,
      email: user.email,
      avatar: user.avatar,
      bio: user.bio,
      joinDate: user.joinDate,
      role: user.role
    } as User;
  } catch (error) {
    console.error("Auth error:", error);
    return null;
  }
} 