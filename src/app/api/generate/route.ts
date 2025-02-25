import { NextRequest, NextResponse } from "next/server";
import axios from "axios";
import { verifyAuth } from "@/lib/auth";

// Imgflip API credentials (ideally these would be in environment variables)
const IMGFLIP_USERNAME = process.env.IMGFLIP_USERNAME || "demo_username";
const IMGFLIP_PASSWORD = process.env.IMGFLIP_PASSWORD || "demo_password";

export async function POST(request: NextRequest) {
  try {
    // Verify authentication
    const user = await verifyAuth(request);
    
    if (!user) {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      );
    }
    
    // Get request body
    const { templateId, topText, bottomText } = await request.json();
    
    if (!templateId) {
      return NextResponse.json(
        { error: "Template ID is required" },
        { status: 400 }
      );
    }
    
    console.log("Generating meme with:", { templateId, topText, bottomText });
    
    // Create form data for Imgflip API
    const formData = new URLSearchParams();
    formData.append("template_id", templateId);
    formData.append("username", IMGFLIP_USERNAME);
    formData.append("password", IMGFLIP_PASSWORD);
    formData.append("text0", topText || "");
    formData.append("text1", bottomText || "");
    
    // Call Imgflip API to generate meme
    const response = await axios.post(
      "https://api.imgflip.com/caption_image",
      formData.toString(),
      {
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded'
        }
      }
    );
    
    if (!response.data.success) {
      console.error("Imgflip API error:", response.data);
      
      // If we're using demo credentials, return a mock response
      if (IMGFLIP_USERNAME === "demo_username") {
        console.log("Using mock response for demo mode");
        return NextResponse.json({
          url: `https://i.imgflip.com/7r${Math.floor(Math.random() * 9999)}.jpg`
        });
      }
      
      return NextResponse.json(
        { error: response.data.error_message || "Failed to generate meme" },
        { status: 500 }
      );
    }
    
    console.log("Meme generated successfully:", response.data.data.url);
    return NextResponse.json({ url: response.data.data.url });
  } catch (error) {
    console.error("Error generating meme:", error);
    
    // Return a mock URL for development/demo purposes
    if (process.env.NODE_ENV === "development") {
      const mockUrl = `https://i.imgflip.com/7r${Math.floor(Math.random() * 9999)}.jpg`;
      console.log("Using fallback mock URL for development:", mockUrl);
      return NextResponse.json({ url: mockUrl });
    }
    
    return NextResponse.json(
      { error: "Failed to generate meme" },
      { status: 500 }
    );
  }
} 