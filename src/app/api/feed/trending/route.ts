import { NextRequest, NextResponse } from "next/server";
import clientPromise from "@/lib/mongodb";
import { verifyAuth } from "@/lib/auth";
import { successResponse, errorResponse } from "@/lib/apiResponse";

// Helper function to generate mock memes for development
function generateMockMemes(count: number, period: string, userId?: string) {
    const memes = [];
    const categories = ['Funny', 'Programming', 'Animals', 'Gaming', 'Movies', 'Wholesome'];
    const now = new Date();
    
    // Adjust date range based on period
    let minDate = new Date(now);
    if (period === 'day') {
        minDate.setDate(now.getDate() - 1);
    } else if (period === 'week') {
        minDate.setDate(now.getDate() - 7);
    } else if (period === 'month') {
        minDate.setMonth(now.getMonth() - 1);
    } else {
        minDate.setFullYear(now.getFullYear() - 2);
    }
    
    for (let i = 0; i < count; i++) {
        const id = `mock-${Date.now()}-${i}`;
        const randomDate = new Date(minDate.getTime() + Math.random() * (now.getTime() - minDate.getTime()));
        
        memes.push({
            _id: id,
            id: id,
            title: `Mock Trending Meme ${i + 1}`,
            description: `This is a mock meme for development when MongoDB is unavailable`,
            imageUrl: `https://picsum.photos/seed/${id}/600/400`,
            url: `https://picsum.photos/seed/${id}/600/400`,
            category: categories[Math.floor(Math.random() * categories.length)],
            userId: `mock-user-${i % 5}`,
            username: `MockUser${i % 5}`,
            createdAt: randomDate.toISOString(),
            likes: Math.floor(Math.random() * 1000),
            commentCount: Math.floor(Math.random() * 50),
            comments: [],
            tags: ['mock', 'development', 'trending'],
            isLiked: userId ? Math.random() > 0.5 : false,
            isSaved: userId ? Math.random() > 0.7 : false
        });
    }
    
    // Sort by likes for trending
    return memes.sort((a, b) => b.likes - a.likes);
}

export async function GET(request: NextRequest) {
    try {
        // Get user from auth (optional)
        const user = await verifyAuth(request).catch(() => null);
        const userId = user?._id?.toString();
        
        // Get query parameters
        const { searchParams } = new URL(request.url);
        const page = parseInt(searchParams.get('page') || '1');
        const limit = parseInt(searchParams.get('limit') || '10');
        const period = searchParams.get('period') || 'week'; // day, week, month, all
        
        // Connect to database with timeout handling
        let client;
        let db;
        let memesWithStatus = [];
        let total = 0;
        
        try {
            const client = await clientPromise            
            db = client.db("meme-verse");
            
            const now = new Date();
            let dateFilter = {};
            
            if (period === 'day') {
                const yesterday = new Date(now);
                yesterday.setDate(now.getDate() - 1);
                dateFilter = { createdAt: { $gte: yesterday } };
            } else if (period === 'week') {
                const lastWeek = new Date(now);
                lastWeek.setDate(now.getDate() - 7);
                dateFilter = { createdAt: { $gte: lastWeek } };
            } else if (period === 'month') {
                const lastMonth = new Date(now);
                lastMonth.setMonth(now.getMonth() - 1);
                dateFilter = { createdAt: { $gte: lastMonth } };
            }
            
            const skip = (page - 1) * limit;
            
            // Get trending memes sorted by likes
            const memes = await db.collection('memes')
                .find(dateFilter)
                .sort({ likes: -1 })
                .skip(skip)
                .limit(limit)
                .toArray();
            
            // Get total count for pagination
            total = await db.collection('memes')
                .countDocuments(dateFilter);
            
            // Check if user has liked or saved these memes
            let likedMemes = [];
            let savedMemes = [];
            
            if (userId) {
                // Get liked memes for this user
                const likedMemesData = await db.collection('likes')
                    .find({ userId })
                    .toArray();
                
                likedMemes = likedMemesData.map(like => like.memeId);
                
                // Get saved memes for this user
                const savedMemesData = await db.collection('saved_memes')
                    .find({ userId })
                    .toArray();
                
                savedMemes = savedMemesData.map(saved => saved.memeId);
            }
            
            // Add like and save status to memes
            memesWithStatus = memes.map(meme => ({
                ...meme,
                isLiked: likedMemes.includes(meme._id.toString()),
                isSaved: savedMemes.includes(meme._id.toString())
            }));
        } catch (dbError) {
            console.error("MongoDB connection error:", dbError);
            
            // Return mock data in development mode
            if (process.env.NODE_ENV === 'development') {
                console.log("Returning mock trending data for development");
                memesWithStatus = generateMockMemes(limit, period, userId);
                total = 100; // Mock total count
            } else {
                throw dbError; // Re-throw in production
            }
        }
        
        return NextResponse.json(
            successResponse({
                memes: memesWithStatus,
                pagination: {
                    total,
                    page,
                    limit,
                    totalPages: Math.ceil(total / limit)
                }
            }),
            { status: 200 }
        );
    } catch (error) {
        console.error("Error fetching trending memes:", error);
        return NextResponse.json(
            errorResponse("Failed to fetch trending memes", 500),
            { status: 500 }
        );
    }
}

