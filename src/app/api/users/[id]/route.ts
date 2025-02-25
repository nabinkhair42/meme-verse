import { NextRequest, NextResponse } from "next/server";
import clientPromise from "@/lib/mongodb";

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    // Ensure params is properly handled
    if (!params || !params.id) {
      return NextResponse.json(
        { error: "User ID is required" },
        { status: 400 }
      );
    }

    const client = await clientPromise;
    const db = client.db("meme-verse");
    
    // For demo purposes, return mock data if user not found
    const user = await db.collection("users").findOne({ id: params.id }) || {
      id: params.id,
      username: 'MemeCreator123',
      bio: 'Meme enthusiast and creator. I make memes about programming, cats, and everything in between.',
      avatar: `https://api.dicebear.com/7.x/avataaars/svg?seed=${params.id}`,
      joinDate: '2023-01-15T00:00:00Z'
    };
    
    return NextResponse.json(user);
  } catch (error) {
    return NextResponse.json(
      { error: (error as Error).message },
      { status: 500 }
    );
  }
}

export async function PATCH(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    // Ensure params is properly handled
    if (!params || !params.id) {
      return NextResponse.json(
        { error: "User ID is required" },
        { status: 400 }
      );
    }

    const client = await clientPromise;
    const db = client.db("meme-verse");
    
    const data = await request.json();
    
    const result = await db
      .collection("users")
      .updateOne({ id: params.id }, { $set: data });
    
    if (result.matchedCount === 0) {
      // Create user if not found
      await db.collection("users").insertOne({
        id: params.id,
        ...data
      });
    }
    
    const updatedUser = await db.collection("users").findOne({ id: params.id });
    
    return NextResponse.json(updatedUser);
  } catch (error) {
    return NextResponse.json(
      { error: (error as Error).message },
      { status: 500 }
    );
  }
} 