import { NextRequest, NextResponse } from "next/server";
import axios from "axios";
import { successResponse, errorResponse } from "@/lib/apiResponse";



// Cache templates to avoid hitting the API too often
let cachedTemplates: any[] = [];
let lastFetchTime = 0;
const CACHE_DURATION = 60 * 60 * 1000; // 1 hour

export async function GET(request: NextRequest) {
  try {
    // Define fallback templates
    const fallbackTemplates = [
      {
        id: "181913649",
        name: "Drake Hotline Bling",
        url: "https://i.imgflip.com/30b1gx.jpg",
        width: 1200,
        height: 1200,
        box_count: 2
      },
      {
        id: "87743020",
        name: "Two Buttons",
        url: "https://i.imgflip.com/1g8my4.jpg",
        width: 600,
        height: 908,
        box_count: 3
      },
      {
        id: "112126428",
        name: "Distracted Boyfriend",
        url: "https://i.imgflip.com/1ur9b0.jpg",
        width: 1200,
        height: 800,
        box_count: 3
      }
    ];
    
    
    const currentTime = Date.now();
    
    // Use cached templates if available and not expired
    if (cachedTemplates.length > 0 && currentTime - lastFetchTime < CACHE_DURATION) {
      console.log("Returning cached templates");
      return NextResponse.json({ templates: cachedTemplates });
    }
    
    // Fetch templates from Imgflip API
    try {
      const response = await axios.get("https://api.imgflip.com/get_memes");
      
      if (!response.data.success) {
        console.error("Imgflip API error:", response.data);
        return NextResponse.json({ templates: fallbackTemplates });
      }
      
      // Validate templates
      const templates = response.data.data.memes;
      const validTemplates = templates.filter((template: any) => {
        return template && typeof template === 'object' && template.id && template.url;
      });
      
      if (validTemplates.length === 0) {
        console.error("No valid templates in Imgflip response");
        return NextResponse.json({ templates: fallbackTemplates });
      }
      
      // Update cache
      cachedTemplates = validTemplates;
      lastFetchTime = currentTime;
      
      return NextResponse.json({ templates: validTemplates });
    } catch (error) {
      console.error("Error fetching from Imgflip API:", error);
      return NextResponse.json({ templates: fallbackTemplates });
    }
  } catch (error) {
    return NextResponse.json(
      successResponse(
        { templates: [
        {
          id: "181913649",
          name: "Drake Hotline Bling",
          url: "https://i.imgflip.com/30b1gx.jpg",
          width: 1200,
          height: 1200,
          box_count: 2
        },
        {
          id: "87743020",
          name: "Two Buttons",
          url: "https://i.imgflip.com/1g8my4.jpg",
          width: 600,
          height: 908,
          box_count: 3
        },
        {
          id: "112126428",
          name: "Distracted Boyfriend",
          url: "https://i.imgflip.com/1ur9b0.jpg",
          width: 1200,
          height: 800,
          box_count: 3
        }
      ] },
      "Templates fetched successfully",
      200
    ),
      { status: 200 }
    );
  }
} 