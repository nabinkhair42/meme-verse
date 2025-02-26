import { errorResponse, successResponse } from "@/lib/apiResponse";
import clientPromise from "@/lib/mongodb";
import { NextRequest, NextResponse } from "next/server";
import { ObjectId } from "mongodb";

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
      { 
        $match: { 
          ...dateFilter,
          userId: { $exists: true, $ne: null },
        }
      },
      { 
        $group: {
          _id: "$userId",
          totalLikes: { $sum: { $ifNull: ["$likes", 0] } },
          memeCount: { $sum: 1 },
          categories: { $addToSet: "$category" }
        }
      },
      {
        $lookup: {
          from: "users",
          let: { userId: "$_id" },
          pipeline: [
            {
              $match: {
                $expr: {
                  $eq: ["$_id", { $toObjectId: "$$userId" }]
                }
              }
            }
          ],
          as: "userDetails"
        }
      },
      {
        $unwind: {
          path: "$userDetails",
          preserveNullAndEmptyArrays: false
        }
      },
      { 
        $project: {
          _id: "$userDetails._id",
          username: "$userDetails.username",
          likes: "$totalLikes",
          memes: "$memeCount",
          topCategory: { $ifNull: [{ $arrayElemAt: ["$categories", 0] }, "uncategorized"] },
          avatar: { $ifNull: ["$userDetails.avatar", ""] },
          bio: { $ifNull: ["$userDetails.bio", ""] },
          joinDate: "$userDetails.joinDate"
        }
      },
      { $sort: { likes: -1 } },
      { $limit: limit }
    ]).toArray();

    if (!topUsers.length) {
      return NextResponse.json(
        successResponse([], "No users found", 200),
        { status: 200 }
      );
    }
    
    // Format the response ensuring all fields are present
    const formattedUsers = topUsers.map(user => ({
      id: user._id.toString(),
      username: user.username,
      likes: user.likes,
      memes: user.memes,
      topCategory: user.topCategory,
      avatar: user.avatar,
      bio: user.bio,
      joinDate: user.joinDate
    }));
    
    return NextResponse.json(
      successResponse(formattedUsers, "Top users fetched successfully", 200),
      { status: 200 }
    );
  } catch (error) {
    console.error("Error fetching top users:", error);
    return NextResponse.json(
      errorResponse("Failed to fetch top users", 500),
      { status: 500 }
    );
  }
}