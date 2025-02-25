import { MongoClient, Db, Collection, ObjectId, Document } from 'mongodb';
import clientPromise from './mongodb';

/**
 * Database service - provides optimized access to MongoDB collections
 * with proper typing and connection pooling
 */
export class DatabaseService {
  private static instance: DatabaseService;
  private client: MongoClient | null = null;
  private db: Db | null = null;
  private collections: Map<string, Collection<Document>> = new Map();
  
  private constructor() {}
  
  /**
   * Get singleton instance of DatabaseService
   */
  public static getInstance(): DatabaseService {
    if (!DatabaseService.instance) {
      DatabaseService.instance = new DatabaseService();
    }
    return DatabaseService.instance;
  }
  
  /**
   * Initialize database connection
   */
  public async initialize(): Promise<void> {
    if (!this.client) {
      this.client = await clientPromise;
      this.db = this.client.db('meme-verse');
    }
  }
  
  /**
   * Get a collection with connection handling
   */
  public async getCollection<T extends Document>(name: string): Promise<Collection<T>> {
    await this.initialize();
    
    if (!this.collections.has(name)) {
      if (!this.db) {
        throw new Error('Database not initialized');
      }
      this.collections.set(name, this.db.collection(name));
    }
    
    // Use a proper type assertion with unknown as intermediate step
    const collection = this.collections.get(name);
    return (collection as unknown) as Collection<T>;
  }
  
  /**
   * Convert MongoDB ObjectId to string
   */
  public static objectIdToString(id: ObjectId): string {
    return id.toString();
  }
  
  /**
   * Convert string to MongoDB ObjectId
   */
  public static stringToObjectId(id: string): ObjectId | null {
    try {
      return new ObjectId(id);
    } catch (error) {
      return null;
    }
  }
  
  /**
   * Convert MongoDB document to application type
   * by converting _id from ObjectId to string
   */
  public static documentToType<T>(doc: Document | null): T | null {
    if (!doc) return null;
    
    if (doc._id && doc._id instanceof ObjectId) {
      return {
        ...doc,
        _id: doc._id.toString()
      } as unknown as T;
    }
    
    return doc as unknown as T;
  }
  
  /**
   * Convert array of MongoDB documents to application types
   */
  public static documentsToTypes<T>(docs: Document[]): T[] {
    return docs.map(doc => DatabaseService.documentToType<T>(doc)).filter((doc): doc is T => doc !== null);
  }
}

// Export singleton instance
export const dbService = DatabaseService.getInstance(); 