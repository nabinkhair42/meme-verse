import { NextRequest, NextResponse } from "next/server";
import { userModel } from "@/models";
import { successResponse, errorResponse } from "@/lib/apiResponse";
import { generateToken } from "@/lib/auth";

/**
 * POST /api/auth/login - Login a user
 */
export async function POST(request: NextRequest) {
  try {
    // Get login data from request
    const { email, password } = await request.json();
    
    // Validate required fields
    if (!email || !password) {
      return NextResponse.json(
        errorResponse("Email and password are required", 400),
        { status: 400 }
      );
    }
    
    // Authenticate user
    const user = await userModel.authenticate(email, password);
    
    if (!user) {
      return NextResponse.json(
        errorResponse("Invalid email or password", 401),
        { status: 401 }
      );
    }
    
    // Generate token
    const token = generateToken(user);
    
    return NextResponse.json(
      successResponse({ user, token }, "Login successful"),
      { status: 200 }
    );
  } catch (error) {
    console.error("Error logging in:", error);
    return NextResponse.json(
      errorResponse("Failed to login", 500),
      { status: 500 }
    );
  }
} 