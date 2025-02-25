// Create a new API route for user-generated memes
import { NextRequest, NextResponse } from "next/server";
import clientPromise from "@/lib/mongodb";
import { verifyAuth } from "@/lib/auth";
import { v4 as uuidv4 } from "uuid";

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
    const query: any = { authorId: user.id };
    
    // Filter by isGenerated flag if requested
    if (onlyGenerated) {
      query.isGenerated = true;
    }
    
    // Get user-generated memes
    const memes = await db.collection("user-generated-memes")
      .find(query)
      .sort({ createdAt: -1 })
      .toArray();
    
    return NextResponse.json(memes);
  } catch (error) {
    console.error("Error fetching user-generated memes:", error);
    return NextResponse.json(
      { error: "Failed to fetch user-generated memes" },
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
      id: uuidv4(),
      title,
      url,
      category: category || "Other",
      description: description || "",
      tags: tags || [],
      author: user.username,
      authorId: user.id,
      createdAt: new Date().toISOString(),
      likes: 0,
      comments: [],
      isGenerated: !!isGenerated, // Ensure boolean
      templateId: templateId || null
    };
    
    // Insert into both collections
    await db.collection("memes").insertOne(newMeme);
    await db.collection("user-generated-memes").insertOne(newMeme);
    
    return NextResponse.json(newMeme, { status: 201 });
  } catch (error) {
    console.error("Error creating user-generated meme:", error);
    return NextResponse.json(
      { error: "Failed to create user-generated meme" },
      { status: 500 }
    );
  }
} 