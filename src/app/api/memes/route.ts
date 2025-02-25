import { NextRequest, NextResponse } from "next/server";
import clientPromise from "@/lib/mongodb";
import { v4 as uuidv4 } from "uuid";

export async function GET(request: NextRequest) {
  try {
    const client = await clientPromise;
    const db = client.db("meme-verse");
    
    const { searchParams } = new URL(request.url);
    const category = searchParams.get("category");
    const search = searchParams.get("search");
    const sort = searchParams.get("sort") || "date";
    const page = parseInt(searchParams.get("page") || "1");
    const limit = parseInt(searchParams.get("limit") || "10");
    
    const skip = (page - 1) * limit;
    
    let query: any = {};
    
    if (category && category !== "All") {
      query.category = category;
    }
    
    if (search) {
      query.$or = [
        { title: { $regex: search, $options: "i" } },
        { description: { $regex: search, $options: "i" } },
        { tags: { $in: [search.toLowerCase()] } }
      ];
    }
    
    let sortOption: any = {};
    switch (sort) {
      case "date":
        sortOption.createdAt = -1;
        break;
      case "likes":
        sortOption.likes = -1;
        break;
      case "comments":
        sortOption.commentsCount = -1;
        break;
      default:
        sortOption.createdAt = -1;
    }
    
    const memes = await db
      .collection("memes")
      .find(query)
      .sort(sortOption)
      .skip(skip)
      .limit(limit)
      .toArray();
    
    const total = await db.collection("memes").countDocuments(query);
    
    return NextResponse.json({
      memes,
      pagination: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
      },
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
    const client = await clientPromise;
    const db = client.db("meme-verse");
    
    const memeData = await request.json();
    
    if (!memeData.id) {
      memeData.id = uuidv4();
    }
    
    if (!memeData.createdAt) {
      memeData.createdAt = new Date().toISOString();
    }
    
    if (typeof memeData.likes !== 'number') {
      memeData.likes = 0;
    }
    
    if (!Array.isArray(memeData.comments)) {
      memeData.comments = [];
    }
    
    await db.collection("memes").insertOne(memeData);
    
    return NextResponse.json(memeData, { status: 201 });
  } catch (error) {
    console.error("Error creating meme:", error);
    return NextResponse.json(
      { error: "Failed to create meme" },
      { status: 500 }
    );
  }
} 