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
    
    // Check if user exists
    const isUserAvailable = await userModel.findByEmail(email);
    if (!isUserAvailable) {
      return NextResponse.json(
        errorResponse("User not found", 401),
        { status: 401 }
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
    
    // Set HTTP-only cookie for better security
    const response = NextResponse.json(
      successResponse(user, "Login successful", 200),
      { status: 200 }
    );
    
    // Set cookie with token
    response.cookies.set({
      name: 'auth-token',
      value: token,
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'strict',
      maxAge: 60 * 60 * 24 * 7, // 7 days
      path: '/',
    });
    
    return response;
  } catch (error) {
    console.error("Error logging in:", error);
    return NextResponse.json(
      errorResponse("Failed to login", 500),
      { status: 500 }
    );
  }
} 