// Create a new API route for user-generated memes
import { NextRequest, NextResponse } from "next/server";
import clientPromise from "@/lib/mongodb";
import { verifyAuth } from "@/lib/auth";
import { successResponse, errorResponse } from "@/lib/apiResponse";

export async function GET(request: NextRequest) {
  try {
    const user = await verifyAuth(request);
    
    if (!user || !user._id) {
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
    const query: any = { userId: user._id.toString() };
    
    // Filter by isGenerated flag if requested
    if (onlyGenerated) {
      query.isGenerated = true;
    }
    
    // Get user-generated memes from the memes collection
    const memes = await db.collection("memes")
      .find(query)
      .sort({ createdAt: -1 })
      .toArray();
    
    // Format memes for response
    const formattedMemes = memes.map(meme => ({
      id: meme._id.toString(),
      title: meme.title || "",
      url: meme.url || meme.imageUrl,
      description: meme.description || "",
      category: meme.category || "Generated",
      tags: meme.tags || [],
      author: meme.author || user.username,
      authorId: meme.userId,
      createdAt: meme.createdAt,
      likes: meme.likes || 0,
      comments: meme.comments || [],
      isGenerated: meme.isGenerated || false,
      isPublic: meme.isPublic || false,
      templateId: meme.templateId,
      templateUrl: meme.templateUrl
    }));
    
    return NextResponse.json(
      successResponse(formattedMemes, "User-generated memes fetched successfully", 200),
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
    
    if (!user || !user._id) {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      );
    }
    
    const { title, url, category, description, tags, isGenerated, templateId, templateUrl, isPublic } = await request.json();
    
    if (!title || !url) {
      return NextResponse.json(
        { error: "Title and URL are required" },
        { status: 400 }
      );
    }
    
    const client = await clientPromise;
    const db = client.db("meme-verse");
    
    // Create new meme with consistent schema
    const newMeme = {
      title,
      imageUrl: url, // Use consistent field name
      description: description || "",
      userId: user._id.toString(),
      username: user.username,
      userAvatar: user.avatar,
      createdAt: new Date(),
      updatedAt: new Date(),
      likes: 0,
      commentCount: 0, // Use commentCount instead of comments array
      tags: tags || [],
      category: category || "Generated",
      type: "generated",
      isGenerated: true,
      isPublic: !!isPublic,
      templateId: templateId || null,
      templateUrl: templateUrl || null
    };
    
    // Insert into memes collection
    const result = await db.collection("memes").insertOne(newMeme);
    
    // Return the created meme with its ID
    const createdMeme = {
      id: result.insertedId.toString(),
      ...newMeme
    };
    
    return NextResponse.json(
      successResponse(createdMeme, "Meme created successfully", 201),
      { status: 201 }
    );
  } catch (error) {
    console.error("Error creating user-generated meme:", error);
    return NextResponse.json(
      errorResponse("Failed to create meme", 500),
      { status: 500 }
    );
  }
} 