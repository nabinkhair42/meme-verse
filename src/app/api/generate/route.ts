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
    const { templateId, topText, bottomText, textElements } = await request.json();
    
    if (!templateId) {
      return NextResponse.json(
        { error: "Template ID is required" },
        { status: 400 }
      );
    }
 
    
    // For development/testing, return a reliable fallback URL
    if (process.env.NODE_ENV === "development") {
      // Use template-specific fallbacks for better testing
      const fallbackUrls = {
        "181913649": "https://i.imgflip.com/30b1gx.jpg", // Drake
        "87743020": "https://i.imgflip.com/1g8my4.jpg",  // Two Buttons
        "112126428": "https://i.imgflip.com/1ur9b0.jpg", // Distracted Boyfriend
        "default": "https://i.imgflip.com/30b1gx.jpg"    // Default to Drake
      };
      
      const fallbackUrl = fallbackUrls[templateId as keyof typeof fallbackUrls] || fallbackUrls.default;
      
      // Simulate a delay to mimic API call
      await new Promise(resolve => setTimeout(resolve, 500));
      
      return NextResponse.json({ url: fallbackUrl });
    }
    
    // Create form data for Imgflip API
    const formData = new URLSearchParams();
    formData.append("template_id", templateId);
    formData.append("username", IMGFLIP_USERNAME);
    formData.append("password", IMGFLIP_PASSWORD);
    
    // Add text boxes
    formData.append("text0", topText || "");
    formData.append("text1", bottomText || "");
    
    // If we have text elements with positions, use them for box positioning
    if (textElements && Array.isArray(textElements)) {
      textElements.forEach((element, index) => {
        if (index < 2) { // Imgflip API supports only 2 text boxes for most templates
          // Convert relative positions to percentages
          const x = Math.round(element.x);
          const y = Math.round(element.y);
          
          formData.append(`boxes[${index}][text]`, element.text);
          formData.append(`boxes[${index}][x]`, x.toString());
          formData.append(`boxes[${index}][y]`, y.toString());
          formData.append(`boxes[${index}][width]`, "200");
          formData.append(`boxes[${index}][height]`, "100");
          formData.append(`boxes[${index}][color]`, element.color || "#FFFFFF");
          formData.append(`boxes[${index}][outline_color]`, element.strokeColor || "#000000");
        }
      });
    }
    
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
    return NextResponse.json(
      { error: (error as Error).message },
      { status: 500 }
    );
  }
} 