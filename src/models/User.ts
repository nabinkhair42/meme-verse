import { ObjectId, Document } from 'mongodb';
import { dbService, DatabaseService } from '@/lib/db';
import { User, UserCreateInput, UserUpdateInput } from '@/types/user';
import { hashPassword, comparePassword } from '@/lib/password';
import { SavedMemeModel } from './SavedMeme';
import { LikedMemeModel } from './LikedMeme';

// MongoDB document type for User
interface UserDocument extends Document {
  username: string;
  email: string;
  password?: string;
  avatar?: string;
  bio?: string;
  joinDate: Date;
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
    // This method is now just a wrapper around the SavedMemeModel
    return SavedMemeModel.saveMeme(userId, memeId);
  }
  
  /**
   * Like a meme for a user
   */
  async likeMeme(userId: string, memeId: string): Promise<boolean> {
    // This method is now just a wrapper around the LikedMemeModel
    return LikedMemeModel.likeMeme(userId, memeId);
  }
  
  /**
   * Check if a user has saved a meme
   */
  async hasSavedMeme(userId: string, memeId: string): Promise<boolean> {
    // This method is now just a wrapper around the SavedMemeModel
    return SavedMemeModel.hasSavedMeme(userId, memeId);
  }
  
  /**
   * Check if a user has liked a meme
   */
  async hasLikedMeme(userId: string, memeId: string): Promise<boolean> {
    // This method is now just a wrapper around the LikedMemeModel
    return LikedMemeModel.hasLikedMeme(userId, memeId);
  }
  
  /**
   * Get all memes saved by a user
   */
  async getSavedMemes(userId: string): Promise<string[]> {
    // This method is now just a wrapper around the SavedMemeModel
    return SavedMemeModel.getSavedMemes(userId);
  }
  
  /**
   * Get all memes liked by a user
   */
  async getLikedMemes(userId: string): Promise<string[]> {
    // This method is now just a wrapper around the LikedMemeModel
    return LikedMemeModel.getLikedMemes(userId);
  }
} 