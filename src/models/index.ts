// Export all models from this central file
import { UserModel } from './User';
import { MemeModel } from './Meme';
import { CommentModel } from './Comment';
import { TemplateModel } from './Template';
import { SavedMemeModel } from './SavedMeme';
import { LikedMemeModel } from './LikedMeme';

// Create singleton instances of models that need them
export const userModel = new UserModel();
export const memeModel = new MemeModel();
export const commentModel = new CommentModel();
export const templateModel = new TemplateModel();

// SavedMemeModel and LikedMemeModel now use static methods
// No need to create instances

// Export model classes
export { UserModel } from './User';
export { MemeModel } from './Meme';
export { CommentModel } from './Comment';
export { TemplateModel } from './Template';
export { SavedMemeModel } from './SavedMeme';
export { LikedMemeModel } from './LikedMeme';