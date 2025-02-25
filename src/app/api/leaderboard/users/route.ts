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
    
    // Aggregate to get top users based on their memes' likes
    const topUsers = await db.collection("memes").aggregate([
      { $match: dateFilter },
      { 
        $group: {
          _id: "$authorId",
          username: { $first: "$author" },
          totalLikes: { $sum: "$likes" },
          memeCount: { $sum: 1 },
          categories: { $addToSet: "$category" }
        }
      },
      { 
        $project: {
          id: "$_id",
          username: 1,
          totalLikes: 1,
          memeCount: 1,
          topCategory: { $arrayElemAt: ["$categories", 0] }
        }
      },
      { $sort: { totalLikes: -1 } },
      { $limit: 10 }
    ]).toArray();
    
    return NextResponse.json(topUsers);
  } catch (error) {
    console.error("Error fetching top users:", error);
    return NextResponse.json(
      { error: "Failed to fetch top users" },
      { status: 500 }
    );
  }
} 