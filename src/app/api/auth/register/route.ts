import { NextRequest, NextResponse } from "next/server";
import { userModel } from "@/models";
import { successResponse, errorResponse } from "@/lib/apiResponse";

/**
 * POST /api/auth/register - Register a new user
 */
export async function POST(request: NextRequest) {
  try {
    // Get user data from request
    const userData = await request.json();
    
    // Validate required fields
    if (!userData.username || !userData.email || !userData.password) {
      return NextResponse.json(
        errorResponse("Username, email, and password are required", 400),
        { status: 400 }
      );
    }
    
    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(userData.email)) {
      return NextResponse.json(
        errorResponse("Invalid email format", 400),
        { status: 400 }
      );
    }
    
    // Validate password length
    if (userData.password.length < 6) {
      return NextResponse.json(
        errorResponse("Password must be at least 6 characters", 400),
        { status: 400 }
      );
    }
    
    try {
      // Create user in database
      const newUser = await userModel.create({
        username: userData.username,
        email: userData.email,
        password: userData.password
      });
      
      // Remove password from response
      if (newUser.password) {
        delete newUser.password;
      }
      
      return NextResponse.json(
        successResponse(newUser, "User registered successfully", 201),
        { status: 201 }
      );
    } catch (error: any) {
      // Handle duplicate email or username
      if (error.message.includes("already exists") || error.message.includes("already taken")) {
        return NextResponse.json(
          errorResponse(error.message, 409),
          { status: 409 }
        );
      }
      
      throw error;
    }
  } catch (error) {
    console.error("Error registering user:", error);
    return NextResponse.json(
      errorResponse("Failed to register user", 500),
      { status: 500 }
    );
  }
} 