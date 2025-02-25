import { ObjectId, Document } from 'mongodb';
import { dbService, DatabaseService } from '@/lib/db';
import { Meme, MemeCreateInput, MemeUpdateInput, PaginatedMemes } from '@/types/meme';

// Define SearchParams interface if it's not exported from meme.ts
interface SearchParams {
  page?: number;
  limit?: number;
  search?: string;
  sort?: 'newest' | 'oldest' | 'popular' | 'comments';
  category?: string;
  type?: string;
}

// MongoDB document type for Meme
interface MemeDocument extends Document {
  title: string;
  imageUrl: string;
  description?: string;
  userId: string;
  username: string;
  userAvatar?: string;
  createdAt: Date;
  updatedAt: Date;
  likes: number;
  commentCount: number;
  tags?: string[];
  category?: string;
  type: 'generated' | 'uploaded';
  templateId?: string;
  templateUrl?: string;
}

/**
 * Meme Model - handles all database operations for memes
 */
export class MemeModel {
  private collection: string = 'memes';
  
  /**
   * Create a new meme
   */
  async create(memeData: MemeCreateInput, userId: string, username: string, userAvatar?: string): Promise<Meme> {
    const memeCollection = await dbService.getCollection<MemeDocument>(this.collection);
    
    // Create new meme without _id field (MongoDB will generate it)
    const newMeme = {
      title: memeData.title,
      imageUrl: memeData.imageUrl,
      description: memeData.description || '',
      userId,
      username,
      userAvatar,
      createdAt: new Date(),
      updatedAt: new Date(),
      likes: 0,
      commentCount: 0,
      tags: memeData.tags || [],
      category: memeData.category || 'Other',
      type: memeData.type,
      templateId: memeData.templateId,
      templateUrl: memeData.templateUrl
    };
    
    // Insert meme into database
    const result = await memeCollection.insertOne(newMeme as MemeDocument);
    
    // Get the inserted meme
    const insertedMeme = await memeCollection.findOne({ _id: result.insertedId });
    
    if (!insertedMeme) {
      throw new Error('Failed to create meme');
    }
    
    // Convert MongoDB document to Meme type
    return DatabaseService.documentToType<Meme>(insertedMeme)!;
  }
  
  /**
   * Find a meme by ID
   */
  async findById(id: string): Promise<Meme | null> {
    const memeCollection = await dbService.getCollection<MemeDocument>(this.collection);
    
    const objectId = DatabaseService.stringToObjectId(id);
    if (!objectId) {
      return null;
    }
    
    const meme = await memeCollection.findOne({ _id: objectId });
    
    // Convert MongoDB document to Meme type
    return DatabaseService.documentToType<Meme>(meme);
  }
  
  /**
   * Update a meme
   */
  async update(id: string, memeData: MemeUpdateInput): Promise<Meme | null> {
    const memeCollection = await dbService.getCollection<MemeDocument>(this.collection);
    
    const objectId = DatabaseService.stringToObjectId(id);
    if (!objectId) {
      return null;
    }
    
    // Update meme
    await memeCollection.updateOne(
      { _id: objectId },
      { $set: { ...memeData, updatedAt: new Date() } }
    );
    
    // Get updated meme
    const updatedMeme = await memeCollection.findOne({ _id: objectId });
    
    // Convert MongoDB document to Meme type
    return DatabaseService.documentToType<Meme>(updatedMeme);
  }
  
  /**
   * Delete a meme
   */
  async delete(id: string): Promise<boolean> {
    const memeCollection = await dbService.getCollection<MemeDocument>(this.collection);
    
    const objectId = DatabaseService.stringToObjectId(id);
    if (!objectId) {
      return false;
    }
    
    const result = await memeCollection.deleteOne({ _id: objectId });
    
    return result.deletedCount === 1;
  }
  
  /**
   * Get memes with pagination and filters
   */
  async findAll(params: SearchParams): Promise<PaginatedMemes> {
    const memeCollection = await dbService.getCollection<MemeDocument>(this.collection);
    
    const { 
      page = 1, 
      limit = 10, 
      search = '', 
      sort = 'newest',
      category = '',
      type = ''
    } = params;
    
    // Build query
    const query: any = {};
    
    // Add search filter
    if (search) {
      query.$or = [
        { title: { $regex: search, $options: 'i' } },
        { description: { $regex: search, $options: 'i' } },
        { tags: { $in: [new RegExp(search, 'i')] } }
      ];
    }
    
    // Add category filter
    if (category && category !== 'All') {
      query.category = category;
    }
    
    // Add type filter
    if (type && (type === 'generated' || type === 'uploaded')) {
      query.type = type;
    }
    
    // Determine sort order
    let sortOptions: any = {};
    switch (sort) {
      case 'newest':
        sortOptions = { createdAt: -1 };
        break;
      case 'oldest':
        sortOptions = { createdAt: 1 };
        break;
      case 'popular':
        sortOptions = { likes: -1 };
        break;
      case 'comments':
        sortOptions = { commentCount: -1 };
        break;
      default:
        sortOptions = { createdAt: -1 };
    }
    
    // Calculate pagination
    const skip = (page - 1) * limit;
    
    // Get total count
    const total = await memeCollection.countDocuments(query);
    
    // Get memes
    const memesResult = await memeCollection
      .find(query)
      .sort(sortOptions)
      .skip(skip)
      .limit(limit)
      .toArray();
    
    // Convert MongoDB documents to Meme types
    const memes = DatabaseService.documentsToTypes<Meme>(memesResult);
    
    return {
      memes,
      pagination: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit)
      }
    };
  }
  
  /**
   * Get memes by user ID
   */
  async findByUserId(userId: string, type?: 'generated' | 'uploaded'): Promise<Meme[]> {
    const memeCollection = await dbService.getCollection<MemeDocument>(this.collection);
    
    const query: any = { userId };
    
    // Add type filter if specified
    if (type) {
      query.type = type;
    }
    
    const memesResult = await memeCollection
      .find(query)
      .sort({ createdAt: -1 })
      .toArray();
    
    // Convert MongoDB documents to Meme types
    return DatabaseService.documentsToTypes<Meme>(memesResult);
  }
  
  /**
   * Increment like count for a meme
   */
  async incrementLikes(id: string): Promise<void> {
    const memeCollection = await dbService.getCollection<MemeDocument>(this.collection);
    
    const objectId = DatabaseService.stringToObjectId(id);
    if (!objectId) {
      return;
    }
    
    await memeCollection.updateOne(
      { _id: objectId },
      { $inc: { likes: 1 } }
    );
  }
  
  /**
   * Decrement like count for a meme
   */
  async decrementLikes(id: string): Promise<void> {
    const memeCollection = await dbService.getCollection<MemeDocument>(this.collection);
    
    const objectId = DatabaseService.stringToObjectId(id);
    if (!objectId) {
      return;
    }
    
    await memeCollection.updateOne(
      { _id: objectId },
      { $inc: { likes: -1 } }
    );
  }
  
  /**
   * Increment comment count for a meme
   */
  async incrementComments(id: string): Promise<void> {
    const memeCollection = await dbService.getCollection<MemeDocument>(this.collection);
    
    const objectId = DatabaseService.stringToObjectId(id);
    if (!objectId) {
      return;
    }
    
    await memeCollection.updateOne(
      { _id: objectId },
      { $inc: { commentCount: 1 } }
    );
  }
  
  /**
   * Decrement comment count for a meme
   */
  async decrementComments(id: string): Promise<void> {
    const memeCollection = await dbService.getCollection<MemeDocument>(this.collection);
    
    const objectId = DatabaseService.stringToObjectId(id);
    if (!objectId) {
      return;
    }
    
    await memeCollection.updateOne(
      { _id: objectId },
      { $inc: { commentCount: -1 } }
    );
  }
  
  /**
   * Get memes by IDs
   */
  async findByIds(ids: string[]): Promise<Meme[]> {
    if (!ids.length) {
      return [];
    }
    
    const memeCollection = await dbService.getCollection<MemeDocument>(this.collection);
    
    // Convert string IDs to ObjectIds
    const objectIds = ids
      .map(id => {
        try {
          return new ObjectId(id);
        } catch (error) {
          return null;
        }
      })
      .filter(id => id !== null);
    
    if (!objectIds.length) {
      return [];
    }
    
    const memesResult = await memeCollection
      .find({ _id: { $in: objectIds } })
      .toArray();
    
    // Convert MongoDB documents to Meme types
    return DatabaseService.documentsToTypes<Meme>(memesResult);
  }
} 