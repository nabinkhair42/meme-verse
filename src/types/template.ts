/**
 * MemeTemplate - represents a meme template
 */
export interface MemeTemplate {
  _id?: string;
  name: string;
  url: string;
  width?: number;
  height?: number;
  boxCount?: number;
  category?: string;
  popularity?: number;
}

/**
 * TextElement - represents a text element on a meme
 */
export interface TextElement {
  _id?: string;
  text: string;
  x: number;
  y: number;
  fontSize: number;
  color: string;
  strokeColor: string;
  rotation: number;
}

/**
 * TemplateCreateInput - data required to create a new template
 */
export interface TemplateCreateInput {
  name: string;
  url: string;
  width?: number;
  height?: number;
  boxCount?: number;
  category?: string;
} 