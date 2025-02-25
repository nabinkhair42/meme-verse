import { DatabaseService, dbService } from '@/lib/db';
import { ObjectId } from 'mongodb';

// MongoDB document type for LikedMeme
interface LikedMemeDocument {
  userId: string;
  memeId: string;
  createdAt: string;
}

/**
 * LikedMeme Model - handles all database operations for liked memes
 */
export class LikedMemeModel {
  private static collection: string = 'likes';
  
  /**
   * Like a meme for a user
   */
  static async likeMeme(userId: string, memeId: string): Promise<boolean> {
    const likedMemeCollection = await dbService.getCollection<LikedMemeDocument>(this.collection);
    
    const userObjectId = DatabaseService.stringToObjectId(userId);
    if (!userObjectId) {
      return false;
    }
    
    // Check if meme is already liked
    const existingLike = await likedMemeCollection.findOne({ 
      userId,
      memeId
    });
    
    if (existingLike) {
      // Meme is already liked, remove it
      await likedMemeCollection.deleteOne({ 
        userId,
        memeId
      });
      
      // Update meme likes count
      await LikedMemeModel.updateMemelikesCount(memeId, false);
      
      return false;
    } else {
      // Meme is not liked, add it
      await likedMemeCollection.insertOne({ 
        userId,
        memeId,
        createdAt: new Date().toISOString()
      });
      
      // Update meme likes count
      await LikedMemeModel.updateMemelikesCount(memeId, true);
      
      return true;
    }
  }
  
  /**
   * Update the likes count for a meme
   */
  private static async updateMemelikesCount(memeId: string, increment: boolean): Promise<void> {
    const memesCollection = await dbService.getCollection('memes');
    
    try {
      // Convert string ID to ObjectId
      const objectId = new ObjectId(memeId);
      
      // Get current meme using _id
      const meme = await memesCollection.findOne({ _id: objectId });
      
      if (!meme) {
        console.error(`Meme not found with ID: ${memeId}`);
        return;
      }
      
      let likes = meme.likes || 0;
      
      if (increment) {
        likes += 1;
      } else {
        likes = Math.max(0, likes - 1);
      }
      
      // Update meme likes count using _id
      await memesCollection.updateOne(
        { _id: objectId },
        { $set: { likes } }
      );
      
      console.log(`Updated likes for meme ${memeId} to ${likes}`);
    } catch (error) {
      console.error(`Error updating likes count for meme ${memeId}:`, error);
    }
  }
  
  /**
   * Check if a user has liked a meme
   */
  static async hasLikedMeme(userId: string, memeId: string): Promise<boolean> {
    const likedMemeCollection = await dbService.getCollection<LikedMemeDocument>(this.collection);
    
    const existingLike = await likedMemeCollection.findOne({ 
      userId,
      memeId
    });
    
    return !!existingLike;
  }
  
  /**
   * Get all memes liked by a user
   */
  static async getLikedMemes(userId: string): Promise<string[]> {
    const likedMemeCollection = await dbService.getCollection<LikedMemeDocument>(this.collection);
    
    const likedMemes = await likedMemeCollection.find({ 
      userId
    }).toArray();
    
    return likedMemes.map(liked => liked.memeId);
  }
  
  /**
   * Get all users who liked a meme
   */
  static async getUsersWhoLikedMeme(memeId: string): Promise<string[]> {
    const likedMemeCollection = await dbService.getCollection<LikedMemeDocument>(this.collection);
    
    const likedByUsers = await likedMemeCollection.find({ 
      memeId
    }).toArray();
    
    return likedByUsers.map(liked => liked.userId);
  }
  
  /**
   * Count the number of likes for a meme
   */
  static async countLikes(memeId: string): Promise<number> {
    try {
      const likedMemeCollection = await dbService.getCollection<LikedMemeDocument>(this.collection);
      
      // Count documents where memeId matches
      const count = await likedMemeCollection.countDocuments({ memeId });
      
      return count;
    } catch (error) {
      console.error(`Error counting likes for meme ${memeId}:`, error);
      return 0;
    }
  }
  
  /**
   * Delete a liked meme for a specific user
   */
  static async deleteLikedMeme(userId: string, memeId: string): Promise<boolean> {
    const likedMemeCollection = await dbService.getCollection<LikedMemeDocument>(this.collection);
    
    const result = await likedMemeCollection.deleteOne({ userId, memeId });
    
    return result.deletedCount > 0;
  }
  
  /**
   * Delete all like records for a meme
   */
  static async deleteAllLikesForMeme(memeId: string): Promise<number> {
    const likedMemeCollection = await dbService.getCollection<LikedMemeDocument>(this.collection);
    
    const result = await likedMemeCollection.deleteMany({ memeId });
    
    return result.deletedCount;
  }
  
  /**
   * Delete all like records for a user
   */
  static async deleteLikedMemesByUser(userId: string): Promise<number> {
    const likedMemeCollection = await dbService.getCollection<LikedMemeDocument>(this.collection);
    
    const result = await likedMemeCollection.deleteMany({ userId });
    
    return result.deletedCount;
  }
} 