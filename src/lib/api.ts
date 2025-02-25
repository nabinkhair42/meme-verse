import axios from "axios";

// Use environment variable for ImgBB API key
const IMGBB_API_KEY = process.env.NEXT_PUBLIC_IMGBB_API_KEY;

// Function to upload an image to ImgBB
export const uploadImage = async (file: File): Promise<string> => {
  try {
    const formData = new FormData();
    formData.append("image", file);
    formData.append("key", IMGBB_API_KEY as string);

    const response = await axios.post(
      "https://api.imgbb.com/1/upload",
      formData
    );

    if (response.data.success) {
      return response.data.data.url;
    } else {
      throw new Error("Failed to upload image");
    }
  } catch (error) {
    console.error("Error uploading image:", error);
    throw error;
  }
};

// Function to fetch memes from Imgflip API
export const fetchImgflipMemes = async () => {
  try {
    const response = await axios.get("https://api.imgflip.com/get_memes");
    return response.data.data.memes;
  } catch (error) {
    console.error("Error fetching memes:", error);
    throw error;
  }
};

// Function to generate a meme using Memegen.link API
export const generateMeme = async (
  template: string,
  topText: string,
  bottomText: string
): Promise<string> => {
  try {
    // Encode the text for URL
    const encodedTop = encodeURIComponent(topText);
    const encodedBottom = encodeURIComponent(bottomText);
    
    // Generate the meme URL
    const memeUrl = `https://memegen.link/${template}/${encodedTop}/${encodedBottom}.jpg`;
    
    return memeUrl;
  } catch (error) {
    console.error("Error generating meme:", error);
    throw error;
  }
}; 