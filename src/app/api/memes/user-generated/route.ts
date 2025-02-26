// Create a new API route for user-generated memes
import { NextRequest, NextResponse } from "next/server";
import clientPromise from "@/lib/mongodb";
import { verifyAuth } from "@/lib/auth";
import { successResponse, errorResponse } from "@/lib/apiResponse";

export async function GET(request: NextRequest) {
  try {
    const user = await verifyAuth(request);
    
    if (!user) {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      );
    }
    
    const { searchParams } = new URL(request.url);
    const onlyGenerated = searchParams.get("generated") === "true";
    
    const client = await clientPromise;
    const db = client.db("meme-verse");
    
    // Build query
    const query: any = { authorId: user._id };
    
    // Filter by isGenerated flag if requested
    if (onlyGenerated) {
      query.isGenerated = true;
    }
    
    // Get user-generated memes
    const memes = await db.collection("user-generated-memes")
      .find(query)
      .sort({ createdAt: -1 })
      .toArray();
    
    return NextResponse.json(
      successResponse(memes, "User-generated memes fetched successfully", 200),
      { status: 200 }
    );
  } catch (error) {
    console.error("Error fetching user-generated memes:", error);
    return NextResponse.json(
      errorResponse("Failed to fetch user-generated memes", 500),
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const user = await verifyAuth(request);
    
    if (!user) {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      );
    }
    
    const { title, url, category, description, tags, isGenerated, templateId } = await request.json();
    
    if (!title || !url) {
      return NextResponse.json(
        { error: "Title and URL are required" },
        { status: 400 }
      );
    }
    
    const client = await clientPromise;
    const db = client.db("meme-verse");
    
    // Create new meme
    const newMeme = {
      title,
      url,
      category: category || "Other",
      description: description || "",
      tags: tags || [],
      author: user.username,
      authorId: user._id,
      createdAt: new Date().toISOString(),
      likes: 0,
      comments: [],
      isGenerated: !!isGenerated, // Ensure boolean
      templateId: templateId || null
    };
    
    // Insert into both collections
    await db.collection("memes").insertOne(newMeme);
    await db.collection("user-generated-memes").insertOne(newMeme);
    
      return NextResponse.json(
      successResponse(newMeme, "Meme created successfully", 201),
      { status: 201 }
    );
  } catch (error) {
    return NextResponse.json(
      errorResponse("Failed to create meme", 500),
      { status: 500 }
    );
  }
} 