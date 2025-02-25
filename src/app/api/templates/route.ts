import { NextRequest, NextResponse } from "next/server";
import axios from "axios";

// Imgflip API credentials (ideally these would be in environment variables)
const IMGFLIP_USERNAME = process.env.IMGFLIP_USERNAME || "demo_username";
const IMGFLIP_PASSWORD = process.env.IMGFLIP_PASSWORD || "demo_password";

// Cache templates to avoid hitting the API too often
let cachedTemplates: any[] = [];
let lastFetchTime = 0;
const CACHE_DURATION = 60 * 60 * 1000; // 1 hour

export async function GET(request: NextRequest) {
  try {
    const currentTime = Date.now();
    
    // Use cached templates if available and not expired
    if (cachedTemplates.length > 0 && currentTime - lastFetchTime < CACHE_DURATION) {
      console.log("Returning cached templates");
      return NextResponse.json({ templates: cachedTemplates });
    }
    
    // Fetch templates from Imgflip API
    console.log("Fetching fresh templates from Imgflip API");
    const response = await axios.get("https://api.imgflip.com/get_memes");
    
    if (!response.data.success) {
      console.error("Imgflip API error:", response.data);
      return NextResponse.json(
        { error: "Failed to fetch templates from Imgflip" },
        { status: 500 }
      );
    }
    
    // Update cache
    cachedTemplates = response.data.data.memes;
    lastFetchTime = currentTime;
    
    return NextResponse.json({ templates: cachedTemplates });
  } catch (error) {
    console.error("Error fetching templates:", error);
    return NextResponse.json(
      { error: "Failed to fetch templates" },
      { status: 500 }
    );
  }
} 