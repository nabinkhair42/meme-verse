import { NextRequest, NextResponse } from "next/server";
import clientPromise from "@/lib/mongodb";

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
    
    // Aggregate to get top users based on their memes' likes
    const topUsers = await db.collection("memes").aggregate([
      { $match: dateFilter },
      { 
        $group: {
          _id: "$userId",
          username: { $first: "$username" },
          totalLikes: { $sum: "$likes" },
          memeCount: { $sum: 1 },
          categories: { $addToSet: "$category" }
        }
      },
      {
        $lookup: {
          from: "users",
          localField: "_id",
          foreignField: "_id",
          as: "userDetails"
        }
      },
      {
        $addFields: {
          userDetails: { $arrayElemAt: ["$userDetails", 0] }
        }
      },
      { 
        $project: {
          id: "$_id",
          username: { 
            $cond: [
              { $eq: ["$username", null] }, 
              { $ifNull: ["$userDetails.username", "Anonymous"] },
              "$username"
            ]
          },
          likes: "$totalLikes",
          memes: "$memeCount",
          topCategory: { $arrayElemAt: ["$categories", 0] },
          avatar: { 
            $cond: [
              { $eq: ["$username", null] }, 
              { $ifNull: ["$userDetails.username", "$_id"] },
              "$username"
            ]
          }
        }
      },
      { $sort: { likes: -1 } },
      { $limit: limit }
    ]).toArray();
    
    // Format the response
    const formattedUsers = topUsers.map(user => ({
      id: user.id || user._id || "unknown",
      username: user.username || 'Anonymous',
      likes: user.likes || 0,
      memes: user.memes || 0,
      topCategory: user.topCategory || 'Uncategorized',
      avatar: user.avatar || user.username || user.id || 'user' // For avatar generation
    }));
    
    return NextResponse.json(formattedUsers);
  } catch (error) {
    console.error("Error fetching top users:", error);
    return NextResponse.json(
      { error: "Failed to fetch top users" },
      { status: 500 }
    );
  }
} 