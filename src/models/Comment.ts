import { ObjectId } from 'mongodb';
import clientPromise from '@/lib/mongodb';
import { Comment, CommentCreateInput, CommentUpdateInput } from '@/types/comment';

/**
 * Comment Model - handles all database operations for comments
 */
export class CommentModel {
  private collection: string = 'comments';
  
  /**
   * Create a new comment
   */
  async create(commentData: CommentCreateInput, userId: string, username: string, userAvatar?: string): Promise<Comment> {
    const client = await clientPromise;
    const db = client.db('meme-verse');
    
    // Create new comment
    const newComment: Omit<Comment, '_id'> = {
      memeId: commentData.memeId,
      userId,
      username,
      userAvatar,
      content: commentData.content,
      createdAt: new Date(),
      updatedAt: new Date()
    };
    
    // Insert comment into database
    const result = await db.collection(this.collection).insertOne(newComment);
    
    // Get the inserted comment
    const insertedComment = await db.collection(this.collection).findOne({ _id: result.insertedId });
    
    // Update meme comment count
    const memeModel = db.collection('memes');
    await memeModel.updateOne(
      { _id: new ObjectId(commentData.memeId) },
      { $inc: { commentCount: 1 } }
    );
    
    return insertedComment as unknown as Comment;
  }
  
  /**
   * Find a comment by ID
   */
  async findById(id: string): Promise<Comment | null> {
    const client = await clientPromise;
    const db = client.db('meme-verse');
    
    let objectId;
    try {
      objectId = new ObjectId(id);
    } catch (error) {
      return null;
    }
    
    const comment = await db.collection(this.collection).findOne({ _id: objectId });
    
    return comment as unknown as Comment | null;
  }
  
  /**
   * Update a comment
   */
  async update(id: string, commentData: CommentUpdateInput): Promise<Comment | null> {
    const client = await clientPromise;
    const db = client.db('meme-verse');
    
    let objectId;
    try {
      objectId = new ObjectId(id);
    } catch (error) {
      return null;
    }
    
    // Update comment
    await db.collection(this.collection).updateOne(
      { _id: objectId },
      { $set: { ...commentData, updatedAt: new Date() } }
    );
    
    // Get updated comment
    const updatedComment = await db.collection(this.collection).findOne({ _id: objectId });
    
    return updatedComment as unknown as Comment | null;
  }
  
  /**
   * Delete a comment
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
    
    // Get the comment to find its meme ID
    const comment = await db.collection(this.collection).findOne({ _id: objectId });
    
    if (!comment) {
      return false;
    }
    
    // Delete the comment
    const result = await db.collection(this.collection).deleteOne({ _id: objectId });
    
    if (result.deletedCount === 1) {
      // Decrement meme comment count
      const memeModel = db.collection('memes');
      await memeModel.updateOne(
        { _id: new ObjectId(comment.memeId) },
        { $inc: { commentCount: -1 } }
      );
      
      return true;
    }
    
    return false;
  }
  
  /**
   * Get comments for a meme
   */
  async findByMemeId(memeId: string): Promise<Comment[]> {
    const client = await clientPromise;
    const db = client.db('meme-verse');
    
    const comments = await db.collection(this.collection)
      .find({ memeId })
      .sort({ createdAt: -1 })
      .toArray();
    
    return comments as unknown as Comment[];
  }
  
  /**
   * Get comments for a meme with pagination
   */
  async findByMemeIdWithPagination(
    memeId: string, 
    page: number = 1, 
    limit: number = 10
  ): Promise<{ comments: Comment[], total: number }> {
    const client = await clientPromise;
    const db = client.db('meme-verse');
    
    // Calculate skip value for pagination
    const skip = (page - 1) * limit;
    
    // Get total count of comments for this meme
    const total = await db.collection(this.collection).countDocuments({ memeId });
    
    // Get paginated comments
    const comments = await db.collection(this.collection)
      .find({ memeId })
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit)
      .toArray();
    
    return {
      comments: comments as unknown as Comment[],
      total
    };
  }
  
  /**
   * Get comments by user ID
   */
  async findByUserId(userId: string): Promise<Comment[]> {
    const client = await clientPromise;
    const db = client.db('meme-verse');
    
    const comments = await db.collection(this.collection)
      .find({ userId })
      .sort({ createdAt: -1 })
      .toArray();
    
    return comments as unknown as Comment[];
  }
} 