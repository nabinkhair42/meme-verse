import { ObjectId } from 'mongodb';
import clientPromise from '@/lib/mongodb';
import { MemeTemplate, TemplateCreateInput } from '@/types/template';

/**
 * Template Model - handles all database operations for meme templates
 */
export class TemplateModel {
  private collection: string = 'templates';
  
  /**
   * Create a new template
   */
  async create(templateData: TemplateCreateInput): Promise<MemeTemplate> {
    const client = await clientPromise;
    const db = client.db('meme-verse');
    
    // Create new template
    const newTemplate: Omit<MemeTemplate, '_id'> = {
      name: templateData.name,
      url: templateData.url,
      width: templateData.width,
      height: templateData.height,
      boxCount: templateData.boxCount,
      category: templateData.category || 'Other',
      popularity: 0
    };
    
    // Insert template into database
    const result = await db.collection(this.collection).insertOne(newTemplate);
    
    // Get the inserted template
    const insertedTemplate = await db.collection(this.collection).findOne({ _id: result.insertedId });
    
    return insertedTemplate as unknown as MemeTemplate;
  }
  
  /**
   * Find a template by ID
   */
  async findById(id: string): Promise<MemeTemplate | null> {
    const client = await clientPromise;
    const db = client.db('meme-verse');
    
    let objectId;
    try {
      objectId = new ObjectId(id);
    } catch (error) {
      return null;
    }
    
    const template = await db.collection(this.collection).findOne({ _id: objectId });
    
    return template as unknown as MemeTemplate | null;
  }
  
  /**
   * Get all templates
   */
  async findAll(category?: string): Promise<MemeTemplate[]> {
    const client = await clientPromise;
    const db = client.db('meme-verse');
    
    const query = category && category !== 'All' ? { category } : {};
    
    const templates = await db.collection(this.collection)
      .find(query)
      .sort({ popularity: -1 })
      .toArray();
    
    return templates as unknown as MemeTemplate[];
  }
  
  /**
   * Update template popularity
   */
  async incrementPopularity(id: string): Promise<void> {
    const client = await clientPromise;
    const db = client.db('meme-verse');
    
    let objectId;
    try {
      objectId = new ObjectId(id);
    } catch (error) {
      return;
    }
    
    await db.collection(this.collection).updateOne(
      { _id: objectId },
      { $inc: { popularity: 1 } }
    );
  }
  
  /**
   * Delete a template
   */
  async delete(id: string): Promise<boolean> {
    const client = await clientPromise;
    const db = client.db('meme-verse');
    
    let objectId;
    try {
      objectId = new ObjectId(id);
    } catch (error) {
      return false;
    }
    
    const result = await db.collection(this.collection).deleteOne({ _id: objectId });
    
    return result.deletedCount === 1;
  }
  
  /**
   * Get popular templates
   */
  async getPopular(limit: number = 10): Promise<MemeTemplate[]> {
    const client = await clientPromise;
    const db = client.db('meme-verse');
    
    const templates = await db.collection(this.collection)
      .find()
      .sort({ popularity: -1 })
      .limit(limit)
      .toArray();
    
    return templates as unknown as MemeTemplate[];
  }
  
  /**
   * Search templates by name
   */
  async search(query: string): Promise<MemeTemplate[]> {
    const client = await clientPromise;
    const db = client.db('meme-verse');
    
    const templates = await db.collection(this.collection)
      .find({ name: { $regex: query, $options: 'i' } })
      .sort({ popularity: -1 })
      .toArray();
    
    return templates as unknown as MemeTemplate[];
  }
} 