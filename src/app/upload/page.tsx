"use client";

import { useState, useCallback, useRef } from "react";
import { useDispatch, useSelector } from "react-redux";
import { AppDispatch, RootState } from "@/redux/store";
import { addMeme } from "@/redux/features/memes/memesSlice";
import { addUploadedMeme } from "@/redux/features/user/userSlice";
import { useDropzone } from "react-dropzone";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Card, CardContent } from "@/components/ui/card";
import Image from "next/image";
import { toast } from "sonner";
import { useRouter } from "next/navigation";
import { UploadCloud, Image as ImageIcon, X, FileWarning } from "lucide-react";
import { motion } from "framer-motion";
import { v4 as uuidv4 } from "uuid";
import { imgbbService, memeService } from "@/services/api";
import { ProtectedRoute } from "@/components/auth/protected-route";

const categories = [
  { value: "Trending", label: "Trending" },
  { value: "Programming", label: "Programming" },
  { value: "Reactions", label: "Reactions" },
  { value: "Wholesome", label: "Wholesome" },
  { value: "Animals", label: "Animals" },
  { value: "Sports", label: "Sports" },
  { value: "Movies", label: "Movies & TV" },
  { value: "Gaming", label: "Gaming" },
  { value: "Other", label: "Other" },
];

export default function UploadPage() {
  const router = useRouter();
  const dispatch = useDispatch<AppDispatch>();
  const { user } = useSelector((state: RootState) => state.auth);

  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [category, setCategory] = useState("");
  const [previewImage, setPreviewImage] = useState<string | null>(null);
  const [file, setFile] = useState<File | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // For scaling animation on drag
  const [isDragActive, setIsDragActive] = useState(false);

  // Reference for the form
  const formRef = useRef<HTMLFormElement>(null);

  // Handle file drop
  const onDrop = useCallback(
    (acceptedFiles: File[]) => {
      const selectedFile = acceptedFiles[0];

      // Only accept image files
      if (!selectedFile.type.startsWith("image/")) {
        toast.error("Please upload an image file");
        return;
      }

      // Create a preview URL
      const previewUrl = URL.createObjectURL(selectedFile);
      setPreviewImage(previewUrl);
      setFile(selectedFile);

      // Auto-generate a title from filename if no title is set
      if (!title) {
        const filename = selectedFile.name.split(".")[0];
        const formattedTitle = filename
          .replace(/[-_]/g, " ")
          .replace(/\b\w/g, (char) => char.toUpperCase());
        setTitle(formattedTitle);
      }
    },
    [title]
  );

  // Configure dropzone
  const { getRootProps, getInputProps } = useDropzone({
    onDrop,
    accept: {
      "image/*": [".jpeg", ".jpg", ".png", ".gif", ".webp"],
    },
    maxFiles: 1,
    onDragEnter: () => setIsDragActive(true),
    onDragLeave: () => setIsDragActive(false),
    onDropAccepted: () => setIsDragActive(false),
    onDropRejected: () => setIsDragActive(false),
  });

  // Remove the image preview
  const handleRemoveImage = () => {
    if (previewImage) {
      URL.revokeObjectURL(previewImage);
    }
    setPreviewImage(null);
    setFile(null);
  };

  // Submit the meme with real ImgBB upload
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!file || !title || !category) {
      toast.error("Please fill all required fields and upload an image");
      return;
    }

    setIsSubmitting(true);

    try {
      // Upload the file to ImgBB
      const uploadResult = await imgbbService.uploadImage(file);

      if (!uploadResult || !uploadResult.url) {
        throw new Error("Failed to upload image");
      }

      // Create a new meme object
      const newMeme = {
        id: uuidv4(),
        title,
        description,
        category,
        url: uploadResult.url,
        author: user?.username || "Anonymous",
        authorId: user?.id,
        createdAt: new Date().toISOString(),
        likes: 0,
        comments: [],
        tags: [category.toLowerCase(), "user-uploaded"],
      };

      // Save to your backend
      const savedMeme = await memeService.createMeme(newMeme);

      // Update Redux store
      dispatch(addMeme(savedMeme || newMeme));
      dispatch(addUploadedMeme(savedMeme?.id || newMeme.id));

      // Show success message
      toast.success("Meme uploaded successfully!");

      // Redirect to the new meme page
      router.push(`/meme/${savedMeme?.id || newMeme.id}`);
    } catch (error) {
      console.error("Error uploading meme:", error);
      toast.error("Failed to upload meme. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <ProtectedRoute>
      <div className="py-8 md:py-12 max-w-7xl mx-auto px-4">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="max-w-3xl mx-auto"
        >
          <h1 className="text-3xl font-bold mb-6">Upload a Meme</h1>

          <Card>
            <CardContent className="pt-6">
              <form ref={formRef} onSubmit={handleSubmit} className="space-y-6">
                {/* Upload Area */}
                <div className="space-y-2">
                  <Label htmlFor="image">Image</Label>

                  {!previewImage ? (
                    <motion.div
                      {...getRootProps({
                        onDrag: undefined, // Remove the HTML onDrag handler
                      })}
                      animate={{
                        scale: isDragActive ? 1.02 : 1,
                        borderColor: isDragActive
                          ? "hsl(var(--primary))"
                          : "hsl(var(--border))",
                        backgroundColor: isDragActive
                          ? "hsl(var(--primary) / 0.05)"
                          : "transparent",
                      }}
                      className="border-2 border-dashed rounded-lg cursor-pointer flex flex-col items-center justify-center p-12 text-center transition-colors"
                    >
                      <input {...getInputProps()} id="image" />
                      <UploadCloud className="h-10 w-10 text-muted-foreground mb-4" />
                      <p className="mb-2 text-lg font-semibold">
                        Drag & drop your image here
                      </p>
                      <p className="text-sm text-muted-foreground mb-4">
                        or click to browse (JPG, PNG, GIF up to 10MB)
                      </p>
                      <Button type="button" variant="secondary">
                        Select Image
                      </Button>
                    </motion.div>
                  ) : (
                    <div className="relative rounded-lg overflow-hidden border">
                      <div className="aspect-video relative">
                        <Image
                          src={previewImage}
                          alt="Preview"
                          fill
                          className="object-contain"
                          unoptimized
                        />
                      </div>
                      <Button
                        type="button"
                        size="icon"
                        variant="destructive"
                        onClick={handleRemoveImage}
                        className="absolute top-2 right-2 h-8 w-8 rounded-full"
                      >
                        <X className="h-4 w-4" />
                        <span className="sr-only">Remove image</span>
                      </Button>
                    </div>
                  )}
                </div>

                {/* Title */}
                <div className="space-y-2">
                  <Label htmlFor="title">
                    Title <span className="text-red-500">*</span>
                  </Label>
                  <Input
                    id="title"
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                    placeholder="Enter a catchy title for your meme"
                    required
                  />
                </div>

                {/* Description */}
                <div className="space-y-2">
                  <Label htmlFor="description">Description (optional)</Label>
                  <Textarea
                    id="description"
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    placeholder="Add some context or description for your meme"
                    rows={3}
                  />
                </div>

                {/* Category */}
                <div className="space-y-2">
                  <Label htmlFor="category">
                    Category <span className="text-red-500">*</span>
                  </Label>
                  <Select value={category} onValueChange={setCategory} required>
                    <SelectTrigger id="category">
                      <SelectValue placeholder="Select a category" />
                    </SelectTrigger>
                    <SelectContent>
                      {categories.map((cat) => (
                        <SelectItem key={cat.value} value={cat.value}>
                          {cat.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                {/* Submit Button */}
                <div className="pt-4">
                  <Button
                    type="submit"
                    className="w-full"
                    disabled={isSubmitting || !file || !title || !category}
                  >
                    {isSubmitting ? (
                      <>
                        <svg
                          className="animate-spin -ml-1 mr-2 h-4 w-4 text-white"
                          xmlns="http://www.w3.org/2000/svg"
                          fill="none"
                          viewBox="0 0 24 24"
                        >
                          <circle
                            className="opacity-25"
                            cx="12"
                            cy="12"
                            r="10"
                            stroke="currentColor"
                            strokeWidth="4"
                          ></circle>
                          <path
                            className="opacity-75"
                            fill="currentColor"
                            d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                          ></path>
                        </svg>
                        Uploading...
                      </>
                    ) : (
                      "Upload Meme"
                    )}
                  </Button>
                </div>
              </form>
            </CardContent>
          </Card>

          {/* Tips */}
          <div className="mt-8">
            <h3 className="text-lg font-semibold mb-4">
              Tips for a great meme:
            </h3>
            <ul className="space-y-2 text-muted-foreground">
              <li className="flex items-start gap-2">
                <div className="rounded-full bg-primary/10 p-1 mt-0.5">
                  <ImageIcon className="h-3 w-3 text-primary" />
                </div>
                <span>Use high-quality images for better visibility</span>
              </li>
              <li className="flex items-start gap-2">
                <div className="rounded-full bg-primary/10 p-1 mt-0.5">
                  <ImageIcon className="h-3 w-3 text-primary" />
                </div>
                <span>Choose the right category to reach your audience</span>
              </li>
              <li className="flex items-start gap-2">
                <div className="rounded-full bg-primary/10 p-1 mt-0.5">
                  <ImageIcon className="h-3 w-3 text-primary" />
                </div>
                <span>Be creative with your title to get more attention</span>
              </li>
            </ul>
          </div>
        </motion.div>
      </div>
    </ProtectedRoute>
  );
}
