import { NextRequest, NextResponse } from "next/server";
import clientPromise from "@/lib/mongodb";

export async function GET(request: NextRequest) {
  try {
    const client = await clientPromise;
    const db = client.db("meme-verse");
    
    const { searchParams } = new URL(request.url);
    const period = searchParams.get("period") || "all-time";
    
    let dateFilter = {};
    
    // Set up date filter based on period
    if (period === "today") {
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      dateFilter = { createdAt: { $gte: today.toISOString() } };
    } else if (period === "week") {
      const lastWeek = new Date();
      lastWeek.setDate(lastWeek.getDate() - 7);
      dateFilter = { createdAt: { $gte: lastWeek.toISOString() } };
    } else if (period === "month") {
      const lastMonth = new Date();
      lastMonth.setMonth(lastMonth.getMonth() - 1);
      dateFilter = { createdAt: { $gte: lastMonth.toISOString() } };
    }
    
    const memes = await db
      .collection("memes")
      .find(dateFilter)
      .sort({ likes: -1 })
      .limit(10)
      .toArray();
    
    return NextResponse.json(memes);
  } catch (error) {
    console.error("Error fetching top memes:", error);
    return NextResponse.json(
      { error: "Failed to fetch top memes" },
      { status: 500 }
    );
  }
} 