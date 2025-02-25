import { NextRequest, NextResponse } from "next/server";
import clientPromise from "@/lib/mongodb";
import { v4 as uuidv4 } from "uuid";

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const category = searchParams.get("category");
    const search = searchParams.get("search");
    const sort = searchParams.get("sort") || "newest";
    const period = searchParams.get("period") || "all-time";
    const page = parseInt(searchParams.get("page") || "1");
    const limit = parseInt(searchParams.get("limit") || "10");
    
    const skip = (page - 1) * limit;
    
    const client = await clientPromise;
    const db = client.db("meme-verse");
    
    // Build query
    let query: any = {};
    
    if (category) {
      query.category = category;
    }
    
    if (search) {
      query.$or = [
        { title: { $regex: search, $options: "i" } },
        { description: { $regex: search, $options: "i" } },
        { tags: { $in: [new RegExp(search, "i")] } }
      ];
    }
    
    // Add period filter
    if (period !== "all-time") {
      let date = new Date();
      
      if (period === "today") {
        date.setHours(0, 0, 0, 0);
      } else if (period === "week") {
        date.setDate(date.getDate() - 7);
      } else if (period === "month") {
        date.setMonth(date.getMonth() - 1);
      }
      
      query.createdAt = { $gte: date.toISOString() };
    }
    
    // Determine sort order
    let sortOption = {};
    
    if (sort === "newest") {
      sortOption = { createdAt: -1 };
    } else if (sort === "oldest") {
      sortOption = { createdAt: 1 };
    } else if (sort === "likes") {
      sortOption = { likes: -1, createdAt: -1 };
    } else if (sort === "comments") {
      sortOption = { "comments.length": -1, createdAt: -1 };
    }
    
    // Get memes with pagination
    const memes = await db.collection("memes")
      .find(query)
      .sort(sortOption)
      .skip(skip)
      .limit(limit)
      .toArray();
    
    // Get total count for pagination
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