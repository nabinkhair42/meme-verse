import { ObjectId } from 'mongodb';
import { dbService, DatabaseService } from '@/lib/db';

// MongoDB document type for SavedMeme
interface SavedMemeDocument {
  userId: string;
  memeId: string;
  createdAt: string;
}

/**
 * SavedMeme Model - handles all database operations for saved memes
 */
export class SavedMemeModel {
  private static collection: string = 'saves';
  
  /**
   * Save a meme for a user
   */
  static async saveMeme(userId: string, memeId: string): Promise<boolean> {
    const savedMemeCollection = await dbService.getCollection<SavedMemeDocument>(this.collection);
    
    const userObjectId = DatabaseService.stringToObjectId(userId);
    if (!userObjectId) {
      return false;
    }
    
    // Check if meme is already saved
    const existingSave = await savedMemeCollection.findOne({ 
      userId,
      memeId
    });
    
    if (existingSave) {
      // Meme is already saved, remove it
      await savedMemeCollection.deleteOne({ 
        userId,
        memeId
      });
      return false;
    } else {
      // Meme is not saved, add it
      await savedMemeCollection.insertOne({ 
        userId,
        memeId,
        createdAt: new Date().toISOString()
      });
      return true;
    }
  }
  
  /**
   * Check if a user has saved a meme
   */
  static async hasSavedMeme(userId: string, memeId: string): Promise<boolean> {
    const savedMemeCollection = await dbService.getCollection<SavedMemeDocument>(this.collection);
    
    const existingSave = await savedMemeCollection.findOne({ 
      userId,
      memeId
    });
    
    return !!existingSave;
  }
  
  /**
   * Get all memes saved by a user
   */
  static async getSavedMemes(userId: string): Promise<string[]> {
    const savedMemeCollection = await dbService.getCollection<SavedMemeDocument>(this.collection);
    
    const savedMemes = await savedMemeCollection.find({ 
      userId
    }).toArray();
    
    return savedMemes.map(saved => saved.memeId);
  }
  
  /**
   * Get all users who saved a meme
   */
  static async getUsersWhoSavedMeme(memeId: string): Promise<string[]> {
    const savedMemeCollection = await dbService.getCollection<SavedMemeDocument>(this.collection);
    
    const savedByUsers = await savedMemeCollection.find({ 
      memeId
    }).toArray();
    
    return savedByUsers.map(saved => saved.userId);
  }
  
  /**
   * Delete a saved meme for a specific user
   */
  static async deleteSavedMeme(userId: string, memeId: string): Promise<boolean> {
    const savedMemeCollection = await dbService.getCollection<SavedMemeDocument>(this.collection);
    
    const result = await savedMemeCollection.deleteOne({ userId, memeId });
    
    return result.deletedCount > 0;
  }
  
  /**
   * Delete all saved records for a meme
   */
  static async deleteAllSavedForMeme(memeId: string): Promise<number> {
    const savedMemeCollection = await dbService.getCollection<SavedMemeDocument>(this.collection);
    
    const result = await savedMemeCollection.deleteMany({ memeId });
    
    return result.deletedCount;
  }
  
  /**
   * Delete all saved records for a user
   */
  static async deleteSavedMemesByUser(userId: string): Promise<number> {
    const savedMemeCollection = await dbService.getCollection<SavedMemeDocument>(this.collection);
    
    const result = await savedMemeCollection.deleteMany({ userId });
    
    return result.deletedCount;
  }
} 