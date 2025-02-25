import { ObjectId, Document } from 'mongodb';
import { dbService, DatabaseService } from '@/lib/db';
import { User, UserCreateInput, UserUpdateInput } from '@/types/user';
import { hashPassword, comparePassword } from '@/lib/auth';

// MongoDB document type for User
interface UserDocument extends Document {
  username: string;
  email: string;
  password?: string;
  avatar?: string;
  bio?: string;
  joinDate: Date;
  savedMemes?: string[];
  likedMemes?: string[];
  role?: 'user' | 'admin';
}

/**
 * User Model - handles all database operations for users
 */
export class UserModel {
  private collection: string = 'users';
  
  /**
   * Create a new user
   */
  async create(userData: UserCreateInput): Promise<User> {
    const userCollection = await dbService.getCollection<UserDocument>(this.collection);
    
    // Check if user with email already exists
    const existingUser = await userCollection.findOne({ email: userData.email });
    if (existingUser) {
      throw new Error('User with this email already exists');
    }
    
    // Check if username is taken
    const existingUsername = await userCollection.findOne({ username: userData.username });
    if (existingUsername) {
      throw new Error('Username is already taken');
    }
    
    // Hash password
    const hashedPassword = await hashPassword(userData.password);
    
    // Create new user without _id field (MongoDB will generate it)
    const newUser = {
      username: userData.username,
      email: userData.email,
      password: hashedPassword,
      avatar: `https://api.dicebear.com/7.x/avataaars/svg?seed=${userData.username}`,
      joinDate: new Date(),
      savedMemes: [],
      likedMemes: [],
      role: 'user' as const
    };
    
    // Insert user into database
    const result = await userCollection.insertOne(newUser as UserDocument);
    
    // Get the inserted user
    const insertedUser = await userCollection.findOne({ _id: result.insertedId });
    
    if (!insertedUser) {
      throw new Error('Failed to create user');
    }
    
    // Remove password from returned user
    if (insertedUser.password) {
      delete insertedUser.password;
    }
    
    // Convert MongoDB document to User type
    return DatabaseService.documentToType<User>(insertedUser)!;
  }
  
  /**
   * Find a user by ID
   */
  async findById(id: string): Promise<User | null> {
    const userCollection = await dbService.getCollection<UserDocument>(this.collection);
    
    const objectId = DatabaseService.stringToObjectId(id);
    if (!objectId) {
      return null;
    }
    
    const user = await userCollection.findOne({ _id: objectId });
    
    if (!user) {
      return null;
    }
    
    // Remove password from returned user
    if (user.password) {
      delete user.password;
    }
    
    // Convert MongoDB document to User type
    return DatabaseService.documentToType<User>(user);
  }
  
  /**
   * Find a user by email
   */
  async findByEmail(email: string): Promise<User | null> {
    const userCollection = await dbService.getCollection<UserDocument>(this.collection);
    
    const user = await userCollection.findOne({ email });
    
    // Convert MongoDB document to User type
    return DatabaseService.documentToType<User>(user);
  }
  
  /**
   * Find a user by username
   */
  async findByUsername(username: string): Promise<User | null> {
    const userCollection = await dbService.getCollection<UserDocument>(this.collection);
    
    const user = await userCollection.findOne({ username });
    
    if (!user) {
      return null;
    }
    
    // Remove password from returned user
    if (user.password) {
      delete user.password;
    }
    
    // Convert MongoDB document to User type
    return DatabaseService.documentToType<User>(user);
  }
  
  /**
   * Update a user
   */
  async update(id: string, userData: UserUpdateInput): Promise<User | null> {
    const userCollection = await dbService.getCollection<UserDocument>(this.collection);
    
    const objectId = DatabaseService.stringToObjectId(id);
    if (!objectId) {
      return null;
    }
    
    // Check if username is taken if updating username
    if (userData.username) {
      const existingUsername = await userCollection.findOne({ 
        username: userData.username,
        _id: { $ne: objectId }
      });
      
      if (existingUsername) {
        throw new Error('Username is already taken');
      }
    }
    
    // Hash password if updating password
    if (userData.password) {
      userData.password = await hashPassword(userData.password);
    }
    
    // Update user
    await userCollection.updateOne(
      { _id: objectId },
      { $set: { ...userData, updatedAt: new Date() } }
    );
    
    // Get updated user
    const updatedUser = await userCollection.findOne({ _id: objectId });
    
    if (!updatedUser) {
      return null;
    }
    
    // Remove password from returned user
    if (updatedUser.password) {
      delete updatedUser.password;
    }
    
    // Convert MongoDB document to User type
    return DatabaseService.documentToType<User>(updatedUser);
  }
  
  /**
   * Delete a user
   */
  async delete(id: string): Promise<boolean> {
    const userCollection = await dbService.getCollection<UserDocument>(this.collection);
    
    const objectId = DatabaseService.stringToObjectId(id);
    if (!objectId) {
      return false;
    }
    
    const result = await userCollection.deleteOne({ _id: objectId });
    
    return result.deletedCount === 1;
  }
  
  /**
   * Authenticate a user
   */
  async authenticate(email: string, password: string): Promise<User | null> {
    const userCollection = await dbService.getCollection<UserDocument>(this.collection);
    
    const user = await userCollection.findOne({ email });
    
    if (!user || !user.password) {
      return null;
    }
    
    const isPasswordValid = await comparePassword(password, user.password);
    
    if (!isPasswordValid) {
      return null;
    }
    
    // Remove password from returned user
    delete user.password;
    
    // Convert MongoDB document to User type
    return DatabaseService.documentToType<User>(user);
  }
  
  /**
   * Save a meme for a user
   */
  async saveMeme(userId: string, memeId: string): Promise<boolean> {
    const userCollection = await dbService.getCollection<UserDocument>(this.collection);
    
    const objectId = DatabaseService.stringToObjectId(userId);
    if (!objectId) {
      return false;
    }
    
    // Check if meme is already saved
    const user = await userCollection.findOne({ 
      _id: objectId,
      savedMemes: memeId
    });
    
    if (user) {
      // Meme is already saved, remove it
      await userCollection.updateOne(
        { _id: objectId },
        { $pull: { savedMemes: memeId } as any }
      );
      return false;
    } else {
      // Meme is not saved, add it
      await userCollection.updateOne(
        { _id: objectId },
        { $addToSet: { savedMemes: memeId } }
      );
      return true;
    }
  }
  
  /**
   * Like a meme for a user
   */
  async likeMeme(userId: string, memeId: string): Promise<boolean> {
    const userCollection = await dbService.getCollection<UserDocument>(this.collection);
    
    const objectId = DatabaseService.stringToObjectId(userId);
    if (!objectId) {
      return false;
    }
    
    // Check if meme is already liked
    const user = await userCollection.findOne({ 
      _id: objectId,
      likedMemes: memeId
    });
    
    if (user) {
      // Meme is already liked, remove it
      await userCollection.updateOne(
        { _id: objectId },
        { $pull: { likedMemes: memeId } as any }
      );
      return false;
    } else {
      // Meme is not liked, add it
      await userCollection.updateOne(
        { _id: objectId },
        { $addToSet: { likedMemes: memeId } }
      );
      return true;
    }
  }
  
  /**
   * Check if a user has saved a meme
   */
  async hasSavedMeme(userId: string, memeId: string): Promise<boolean> {
    const userCollection = await dbService.getCollection<UserDocument>(this.collection);
    
    const objectId = DatabaseService.stringToObjectId(userId);
    if (!objectId) {
      return false;
    }
    
    const user = await userCollection.findOne({ 
      _id: objectId,
      savedMemes: memeId
    });
    
    return !!user;
  }
  
  /**
   * Check if a user has liked a meme
   */
  async hasLikedMeme(userId: string, memeId: string): Promise<boolean> {
    const userCollection = await dbService.getCollection<UserDocument>(this.collection);
    
    const objectId = DatabaseService.stringToObjectId(userId);
    if (!objectId) {
      return false;
    }
    
    const user = await userCollection.findOne({ 
      _id: objectId,
      likedMemes: memeId
    });
    
    return !!user;
  }
  
  /**
   * Get saved memes for a user
   */
  async getSavedMemes(userId: string): Promise<string[]> {
    const userCollection = await dbService.getCollection<UserDocument>(this.collection);
    
    const objectId = DatabaseService.stringToObjectId(userId);
    if (!objectId) {
      return [];
    }
    
    const user = await userCollection.findOne({ _id: objectId });
    
    if (!user || !user.savedMemes) {
      return [];
    }
    
    return user.savedMemes;
  }
} 