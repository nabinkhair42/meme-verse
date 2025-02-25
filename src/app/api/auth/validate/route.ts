import { NextRequest, NextResponse } from "next/server";
import { verifyAuth } from "@/lib/auth";

export async function GET(request: NextRequest) {
  try {
    // Log the request for debugging
    console.log("Validate request headers:", {
      authorization: request.headers.get("Authorization"),
      url: request.url
    });
    
    const user = await verifyAuth(request);
    
    if (!user) {
      console.log("Auth validation failed: No user returned from verifyAuth");
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      );
    }
    
    console.log("Auth validation successful for user:", user.username);
    
    return NextResponse.json({ user });
  } catch (error) {
    console.error("Error validating token:", error);
    return NextResponse.json(
      { error: "Authentication failed" },
      { status: 401 }
    );
  }
} 