// Export all models from this central file
import { UserModel } from './User';
import { MemeModel } from './Meme';
import { CommentModel } from './Comment';
import { TemplateModel } from './Template';

// Create singleton instances of each model
export const userModel = new UserModel();
export const memeModel = new MemeModel();
export const commentModel = new CommentModel();
export const templateModel = new TemplateModel();

// Export model classes
export { UserModel } from './User';
export { MemeModel } from './Meme';
export { CommentModel } from './Comment';
export { TemplateModel } from './Template';