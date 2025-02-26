import { NextRequest, NextResponse } from "next/server";
import clientPromise from "@/lib/mongodb";
import { successResponse, errorResponse } from "@/lib/apiResponse";

export async function GET(request: NextRequest) {
  try {
    const client = await clientPromise;
    const db = client.db("meme-verse");
    
    const { searchParams } = new URL(request.url);
    const period = searchParams.get("period") || "all-time";
    const limit = parseInt(searchParams.get("limit") || "10", 10);
    
    let dateFilter = {};
    
    // Set up date filter based on period
    if (period === "today") {
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      dateFilter = { createdAt: { $gte: today } };
    } else if (period === "week") {
      const lastWeek = new Date();
      lastWeek.setDate(lastWeek.getDate() - 7);
      dateFilter = { createdAt: { $gte: lastWeek } };
    } else if (period === "month") {
      const lastMonth = new Date();
      lastMonth.setMonth(lastMonth.getMonth() - 1);
      dateFilter = { createdAt: { $gte: lastMonth } };
    }
    
    // Get top memes based on likes
    const memes = await db
      .collection("memes")
      .find(dateFilter)
      .sort({ likes: -1 })
      .limit(limit)
      .toArray();
    
    // Map the memes to a consistent format
    const formattedMemes = memes.map(meme => ({
      id: meme._id.toString(),
      title: meme.title,
      description: meme.description || '',
      url: meme.imageUrl || meme.url,
      author: meme.username || meme.author || 'Unknown',
      authorId: meme.userId || meme.authorId || '',
      category: meme.category || 'Uncategorized',
      likes: meme.likes || 0,
      commentCount: meme.commentCount || 0,
      createdAt: meme.createdAt
    }));
    
    return NextResponse.json(formattedMemes);
  } catch (error) {
    console.error("Error fetching top memes:", error);
    return NextResponse.json(
      { error: "Failed to fetch top memes" },
      { status: 500 }
    );
  }
} 