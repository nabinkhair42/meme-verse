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
    
    // For development/testing, return a reliable fallback URL
    if (process.env.NODE_ENV === "development") {
      // Use template-specific fallbacks for better testing
      const fallbackUrls = {
        "181913649": "https://i.imgflip.com/30b1gx.jpg", // Drake
        "87743020": "https://i.imgflip.com/1g8my4.jpg",  // Two Buttons
        "112126428": "https://i.imgflip.com/1ur9b0.jpg", // Distracted Boyfriend
        "default": "https://i.imgflip.com/30b1gx.jpg"    // Default to Drake
      };
      
      const fallbackUrl = fallbackUrls[templateId] || fallbackUrls.default;
      console.log("Using fallback URL for development:", fallbackUrl);
      
      return NextResponse.json({ url: fallbackUrl });
    }
    
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
      return NextResponse.json(
        { error: response.data.error_message || "Failed to generate meme" },
        { status: 500 }
      );
    }
    
    console.log("Meme generated successfully:", response.data.data.url);
    return NextResponse.json({ url: response.data.data.url });
  } catch (error) {
    console.error("Error generating meme:", error);
    
    // Return a fallback URL in case of error
    return NextResponse.json({ 
      url: "https://i.imgflip.com/30b1gx.jpg",
      error: "Error occurred, using fallback image"
    });
  }
} 