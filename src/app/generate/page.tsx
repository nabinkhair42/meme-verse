"use client";

import { ProtectedRoute } from "@/components/auth/protected-route";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { addMeme } from "@/redux/features/memes/memesSlice";
import { addGeneratedMeme } from "@/redux/features/user/userSlice";
import { AppDispatch, RootState } from "@/redux/store";
import { imgflipService, memeService } from "@/services/api";
import { MemeTemplate, TextElement } from "@/types/meme";
import { useRouter } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { toast } from "sonner";
import { v4 as uuidv4 } from "uuid";
import { MemeEditor } from "./_components/meme-editor";
import { MemePreview } from "./_components/meme-preview";
import { TemplateSelector } from "./_components/template-selector";
import { Meme as ReduxMeme } from "@/types/meme";

// Type guard function to check if an object is a MemeTemplate
function isValidTemplate(template: any): template is MemeTemplate {
  return (
    template &&
    typeof template === "object" &&
    typeof template.id === "string" &&
    typeof template.name === "string" &&
    typeof template.url === "string" &&
    template.url.startsWith("http")
  );
}

export default function GeneratePage() {
  const router = useRouter();
  const dispatch = useDispatch<AppDispatch>();
  const { user } = useSelector((state: RootState) => state.auth);

  // State management
  const [selectedTemplate, setSelectedTemplate] = useState<MemeTemplate | null>(
    null
  );
  const [isGenerating, setIsGenerating] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [generatedMeme, setGeneratedMeme] = useState<string | null>(null);
  const [title, setTitle] = useState("");
  const [category, setCategory] = useState("Generated");
  const [isPublic, setIsPublic] = useState(true); // Default to public
  const [textElements, setTextElements] = useState<TextElement[]>([]);
  const [selectedTextId, setSelectedTextId] = useState<string | null>(null);

  // Template management
  const [templates, setTemplates] = useState<MemeTemplate[]>([]);
  const [filteredTemplates, setFilteredTemplates] = useState<MemeTemplate[]>(
    []
  );
  const [isLoadingTemplates, setIsLoadingTemplates] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");

  // Refs
  const canvasRef = useRef<HTMLCanvasElement>(null!);
  const imageRef = useRef<HTMLImageElement>(null!);

  // Fetch templates
  useEffect(() => {
    const fetchTemplates = async () => {
      try {
        setIsLoadingTemplates(true);

        // Define fallback templates
        const fallbackTemplates = [
          {
            id: "181913649",
            name: "Drake Hotline Bling",
            url: "https://i.imgflip.com/30b1gx.jpg",
            width: 1200,
            height: 1200,
            box_count: 2,
          },
          {
            id: "87743020",
            name: "Two Buttons",
            url: "https://i.imgflip.com/1g8my4.jpg",
            width: 600,
            height: 908,
            box_count: 3,
          },
          {
            id: "112126428",
            name: "Distracted Boyfriend",
            url: "https://i.imgflip.com/1ur9b0.jpg",
            width: 1200,
            height: 800,
            box_count: 3,
          },
        ];

        try {
          const fetchedTemplates = await imgflipService.getTemplates();

          if (
            !fetchedTemplates ||
            !Array.isArray(fetchedTemplates) ||
            fetchedTemplates.length === 0
          ) {
            console.error("No templates returned from API");
            toast.error(
              "Failed to load meme templates. Using fallback templates."
            );
            setTemplates(fallbackTemplates);
            setFilteredTemplates(fallbackTemplates);
            return;
          }

          // Validate each template
          const validTemplates = fetchedTemplates.filter(isValidTemplate);

          if (validTemplates.length === 0) {
            console.error("No valid templates found");
            toast.error("No valid templates found. Using fallback templates.");
            setTemplates(fallbackTemplates);
            setFilteredTemplates(fallbackTemplates);
            return;
          }

          console.log(`Loaded ${validTemplates.length} valid templates`);
          setTemplates(validTemplates);
          setFilteredTemplates(validTemplates);
        } catch (error) {
          console.error("Error fetching templates:", error);
          toast.error(
            "Failed to load meme templates. Using fallback templates."
          );
          setTemplates(fallbackTemplates);
          setFilteredTemplates(fallbackTemplates);
        }
      } catch (error) {
        console.error("Unexpected error in fetchTemplates:", error);
        toast.error("An unexpected error occurred");
        setTemplates([]);
        setFilteredTemplates([]);
      } finally {
        setIsLoadingTemplates(false);
      }
    };

    fetchTemplates();
  }, []);

  // Filter templates based on search
  useEffect(() => {
    if (!templates || templates.length === 0) return;

    if (!searchQuery.trim()) {
      setFilteredTemplates(templates);
      return;
    }

    const query = searchQuery.toLowerCase();
    const filtered = templates.filter((template) =>
      template.name.toLowerCase().includes(query)
    );

    setFilteredTemplates(filtered);
  }, [searchQuery, templates]);

  // Template selection handler
  const handleSelectTemplate = (template: MemeTemplate) => {
    try {
      if (!isValidTemplate(template)) {
        toast.error("Invalid template selected");
        return;
      }

      setSelectedTemplate(template);
      setGeneratedMeme(null);
    } catch (error) {
      console.error("Error selecting template:", error);
      toast.error("Failed to select template");
    }
  };

  // Text element management
  const addTextElement = () => {
    if (!imageRef.current) {
      toast.error("Please select a template first");
      return;
    }

    const { width, height } = imageRef.current;
    const newElement: TextElement = {
      id: uuidv4(),
      text: "Add your text here",
      x: width / 2,
      y: height / 2,
      fontSize: Math.max(24, Math.min(36, width * 0.06)),
      color: "#FFFFFF",
      strokeColor: "#000000",
      rotation: 0,
    };

    setTextElements((prev) => [...prev, newElement]);
    setSelectedTextId(newElement.id);
  };

  const updateTextElement = (id: string, updates: Partial<TextElement>) => {
    setTextElements(
      textElements.map((element) =>
        element.id === id ? { ...element, ...updates } : element
      )
    );
  };

  const removeTextElement = (id: string) => {
    setTextElements(textElements.filter((element) => element.id !== id));
    if (selectedTextId === id) {
      setSelectedTextId(null);
    }
  };

  // Canvas rendering
  const renderCanvas = async () => {
    if (!canvasRef.current || !imageRef.current || !imageRef.current.complete) {
      return null;
    }

    const canvas = canvasRef.current;
    const ctx = canvas.getContext("2d");
    if (!ctx) return null;

    try {
      canvas.width = imageRef.current.width;
      canvas.height = imageRef.current.height;
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      ctx.drawImage(imageRef.current, 0, 0, canvas.width, canvas.height);

      textElements.forEach((element) => {
        ctx.save();
        ctx.font = `bold ${element.fontSize}px Impact, sans-serif`;
        ctx.fillStyle = element.color;
        ctx.strokeStyle = element.strokeColor;
        ctx.lineWidth = Math.max(2, element.fontSize * 0.1);
        ctx.textAlign = "center";
        ctx.textBaseline = "middle";
        ctx.lineJoin = "round";

        if (element.rotation !== 0) {
          ctx.translate(element.x, element.y);
          ctx.rotate((element.rotation * Math.PI) / 180);
          ctx.translate(-element.x, -element.y);
        }

        ctx.strokeText(element.text, element.x, element.y);
        ctx.fillText(element.text, element.x, element.y);
        ctx.restore();
      });

      return canvas.toDataURL("image/jpeg", 0.95);
    } catch (error) {
      console.error("Canvas rendering error:", error);
      return null;
    }
  };

  // Generate meme
  const generateMeme = async () => {
    if (!selectedTemplate) {
      toast.error("Please select a template first");
      return;
    }

    setIsGenerating(true);

    try {
      // Try canvas rendering first
      const localMemeUrl = await renderCanvas();

      if (localMemeUrl) {
        try {
          // Upload the canvas-generated image to ImgBB
          const imgbbResponse = await memeService.uploadToImgBB(localMemeUrl);
          if (imgbbResponse?.url) {
            setGeneratedMeme(imgbbResponse.url);
            setIsGenerating(false);
            return;
          }
        } catch (error: any) {
          console.error("Error uploading to ImgBB:", error);
          // Don't show error toast here, continue with fallback
        }
      }

      // Fallback to Imgflip API if canvas or ImgBB upload fails
      const sortedTextElements = [...textElements].sort((a, b) => a.y - b.y);

      const result = await imgflipService.createMeme(
        selectedTemplate.id,
        sortedTextElements[0]?.text || "",
        sortedTextElements[1]?.text || "",
        sortedTextElements
      );

      if (result?.url) {
        // Upload Imgflip result to ImgBB
        try {
          const imgbbResponse = await memeService.uploadToImgBB(result.url);
          if (imgbbResponse?.url) {
            setGeneratedMeme(imgbbResponse.url);
            setIsGenerating(false);
            return;
          }
        } catch (error: any) {
          console.error("Error uploading to ImgBB:", error);
          // If ImgBB upload fails, use the Imgflip URL directly
          setGeneratedMeme(result.url);
        }
      } else {
        throw new Error("Failed to generate meme");
      }
    } catch (error: any) {
      console.error("Error generating meme:", error);
      toast.error(
        error.message || "Failed to generate meme. Please try again."
      );
    } finally {
      setIsGenerating(false);
    }
  };

  // Save meme
  const handleSaveMeme = async () => {
    if (!generatedMeme || !title || !user?._id) {
      toast.error("Please fill in all required fields");
      return;
    }

    try {
      setIsSaving(true);

      // Create the meme object
      const newMeme = {
        title,
        url: generatedMeme,
        category,
        description: "",
        tags: [],
        isGenerated: true,
        isPublic,
        templateId: selectedTemplate?.id,
        templateUrl: selectedTemplate?.url,
        textElements,
      };

      // Save to database
      const response = await fetch("/api/memes/user-generated", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(newMeme),
      });

      const result = await response.json();

      if (!response.ok || !result.success) {
        throw new Error(result.error || "Failed to save meme");
      }

      // Add to Redux store
      const reduxMeme: ReduxMeme = {
        _id: result.data.id,
        title,
        imageUrl: generatedMeme,
        description: "",
        category,
        author: user.username || "Anonymous",
        userId: user._id,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        likes: 0,
        commentCount: 0,
        type: "generated",
        tags: [],
        username: "",
      };

      dispatch(addMeme(reduxMeme));
      dispatch(addGeneratedMeme(reduxMeme._id));

      toast.success("Meme saved successfully!");
      router.push(`/meme/${result.data.id}`);
    } catch (error) {
      console.error("Error saving meme:", error);
      toast.error(
        error instanceof Error ? error.message : "Failed to save meme"
      );
    } finally {
      setIsSaving(false);
    }
  };

  // Image handling
  const handleImageLoad = () => {
    if (imageRef.current && textElements.length === 0) {
      const { width, height } = imageRef.current;
      setTextElements([
        {
          id: uuidv4(),
          text: "TOP TEXT",
          x: width / 2,
          y: height * 0.1,
          fontSize: Math.max(24, Math.min(36, width * 0.06)),
          color: "#FFFFFF",
          strokeColor: "#000000",
          rotation: 0,
        },
        {
          id: uuidv4(),
          text: "BOTTOM TEXT",
          x: width / 2,
          y: height * 0.9,
          fontSize: Math.max(24, Math.min(36, width * 0.06)),
          color: "#FFFFFF",
          strokeColor: "#000000",
          rotation: 0,
        },
      ]);
    }
  };

  const handleImageError = () => {
    toast.error("Failed to load template image");
  };

  return (
    <ProtectedRoute>
      <div className="container max-w-7xl mx-auto py-8 px-4 sm:px-6">
        <div className="text-center mb-8 bg-gradient-to-r from-primary/10 to-secondary/10 p-8 rounded-xl shadow-sm">
          <h1 className="text-4xl font-bold tracking-tight mb-3">
            Create Your Meme
          </h1>
          <p className="text-muted-foreground text-lg max-w-2xl mx-auto">
            Select a template, customize with text, and share your creation with
            the world
          </p>
        </div>

        <div className="relative mb-10">
          <div className="absolute inset-0 bg-gradient-to-r from-primary/5 via-secondary/5 to-primary/5 rounded-xl -z-10"></div>
          <Tabs defaultValue="template" className="w-full">
            <TabsList className="grid grid-cols-3 mb-8 w-full max-w-3xl mx-auto p-1 bg-background/80 backdrop-blur-sm rounded-xl shadow-md">
              <TabsTrigger
                value="template"
                className="text-base py-4 rounded-lg data-[state=active]:bg-primary data-[state=active]:text-primary-foreground transition-all duration-200"
              >
                <span className="flex items-center gap-2">
                  <span className="hidden sm:inline-flex size-6 rounded-full bg-primary/20 text-primary items-center justify-center font-bold">
                    1
                  </span>
                  Choose Template
                </span>
              </TabsTrigger>
              <TabsTrigger
                value="editor"
                disabled={!selectedTemplate}
                className="text-base py-4 rounded-lg data-[state=active]:bg-primary data-[state=active]:text-primary-foreground transition-all duration-200"
              >
                <span className="flex items-center gap-2">
                  <span className="hidden sm:inline-flex size-6 rounded-full bg-primary/20 text-primary items-center justify-center font-bold">
                    2
                  </span>
                  Add Text
                </span>
              </TabsTrigger>
              <TabsTrigger
                value="preview"
                disabled={!generatedMeme}
                className="text-base py-4 rounded-lg data-[state=active]:bg-primary data-[state=active]:text-primary-foreground transition-all duration-200"
              >
                <span className="flex items-center gap-2">
                  <span className="hidden sm:inline-flex size-6 rounded-full bg-primary/20 text-primary items-center justify-center font-bold">
                    3
                  </span>
                  Preview & Save
                </span>
              </TabsTrigger>
            </TabsList>

            <TabsContent value="template">
              <TemplateSelector
                templates={templates}
                selectedTemplate={selectedTemplate}
                isLoading={isLoadingTemplates}
                searchQuery={searchQuery}
                onSearchChange={setSearchQuery}
                onSelectTemplate={handleSelectTemplate}
              />
            </TabsContent>

            <TabsContent value="editor">
              {selectedTemplate && (
                <MemeEditor
                  selectedTemplate={selectedTemplate}
                  textElements={textElements}
                  selectedTextId={selectedTextId}
                  isGenerating={isGenerating}
                  onTextSelect={setSelectedTextId}
                  onTextUpdate={updateTextElement}
                  onTextRemove={removeTextElement}
                  onTextAdd={addTextElement}
                  onGenerate={generateMeme}
                  imageRef={imageRef}
                  canvasRef={canvasRef}
                  onImageLoad={handleImageLoad}
                  onImageError={handleImageError}
                />
              )}
            </TabsContent>

            <TabsContent value="preview">
              {generatedMeme && (
                <MemePreview
                  generatedMeme={generatedMeme}
                  title={title}
                  category={category}
                  isPublic={isPublic}
                  isSaving={isSaving}
                  onTitleChange={setTitle}
                  onCategoryChange={setCategory}
                  onIsPublicChange={setIsPublic}
                  onSave={handleSaveMeme}
                />
              )}
            </TabsContent>
          </Tabs>
        </div>
      </div>
    </ProtectedRoute>
  );
}
