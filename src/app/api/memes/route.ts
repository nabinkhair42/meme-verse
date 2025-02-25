import { NextRequest, NextResponse } from "next/server";
import clientPromise from "@/lib/mongodb";
import { verifyAuth } from "@/lib/auth";
import { v4 as uuidv4 } from "uuid";

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const sort = searchParams.get("sort") || "newest";
    const category = searchParams.get("category");
    const search = searchParams.get("search");
    const page = parseInt(searchParams.get("page") || "1");
    const limit = parseInt(searchParams.get("limit") || "10");
    
    const client = await clientPromise;
    const db = client.db("meme-verse");
    
    // Build query
    const query: any = {};
    
    if (category) {
      query.category = category;
    }
    
    if (search) {
      query.$or = [
        { title: { $regex: search, $options: "i" } },
        { description: { $regex: search, $options: "i" } }
      ];
    }
    
    // Build sort
    const sortOptions: any = {};
    
    if (sort === "newest") {
      sortOptions.createdAt = -1;
    } else if (sort === "oldest") {
      sortOptions.createdAt = 1;
    } else if (sort === "likes") {
      sortOptions.likes = -1;
    } else if (sort === "comments") {
      sortOptions.comments = -1;
    }
    
    // Get total count
    const total = await db.collection("memes").countDocuments(query);
    
    // Get memes
    const memes = await db.collection("memes")
      .find(query)
      .sort(sortOptions)
      .skip((page - 1) * limit)
      .limit(limit)
      .toArray();
    
    return NextResponse.json({
      memes,
      pagination: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit)
      }
    });
  } catch (error) {
    console.error("Error fetching memes:", error);
    return NextResponse.json(
      { error: "Failed to fetch memes" },
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
    
    const { title, url, description, category, tags } = await request.json();
    
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
      description: description || "",
      category: category || "Other",
      tags: tags || [],
      author: user.username,
      authorId: user.id,
      createdAt: new Date().toISOString(),
      likes: 0,
      comments: []
    };
    
    await db.collection("memes").insertOne(newMeme);
    
    return NextResponse.json(newMeme, { status: 201 });
  } catch (error) {
    console.error("Error creating meme:", error);
    return NextResponse.json(
      { error: "Failed to create meme" },
      { status: 500 }
    );
  }
} 