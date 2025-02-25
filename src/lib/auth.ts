import { NextRequest } from "next/server";
import jwt from "jsonwebtoken";
import clientPromise from "@/lib/mongodb";

const JWT_SECRET = process.env.JWT_SECRET!;

export async function verifyAuth(request: NextRequest) {
  try {
    // Get token from Authorization header
    const authHeader = request.headers.get("Authorization");
    
    if (!authHeader) {
      console.log(`No Authorization header found for request to ${request.url}`);
      return null;
    }
    
    if (!authHeader.startsWith("Bearer ")) {
      console.log("Invalid Authorization header format, expected 'Bearer <token>'");
      return null;
    }
    
    const token = authHeader.substring(7);
    
    if (!token || token === "undefined" || token === "null") {
      console.log(`Invalid token found: "${token}"`);
      return null;
    }
    
    // Verify token
    try {
      // Log the token for debugging (only first few characters)
      console.log(`Verifying token: ${token.substring(0, 10)}...`);
      
      const decoded = jwt.verify(token, JWT_SECRET) as any;
      
      if (!decoded) {
        console.log("Token verification failed: decoded payload is empty");
        return null;
      }
      
      console.log("Token decoded successfully:", {
        id: decoded.id,
        username: decoded.username
      });
      
      if (!decoded.id) {
        console.log("Token verification failed: no id in payload", decoded);
        return null;
      }
      
      // Get user from database
      const client = await clientPromise;
      const db = client.db("meme-verse");
      
      // Try to find by id or _id
      const user = await db.collection("users").findOne({
        $or: [
          { id: decoded.id },
          { _id: decoded.id }
        ]
      });
      
      if (!user) {
        return null;
      }
      
      
      // Return user without password
      const { password, ...userWithoutPassword } = user;
      return userWithoutPassword;
    } catch (jwtError: any) {
      return null;
    }
  } catch (error) {
    return null;
  }
} 