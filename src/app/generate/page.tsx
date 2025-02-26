"use client";

import { ProtectedRoute } from "@/components/auth/protected-route";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { addMeme, Meme as ReduxMeme, Comment as ReduxComment } from "@/redux/features/memes/memesSlice";
import { addGeneratedMeme } from "@/redux/features/user/userSlice";
import { AppDispatch, RootState } from "@/redux/store";
import { imgflipService, memeService } from "@/services/api";
import { MemeTemplate, TextElement, Meme as ApiMeme } from "@/types/meme";
import { useRouter } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { toast } from "sonner";
import { v4 as uuidv4 } from "uuid";
import { TemplateSelector } from "./_components/template-selector";
import { MemeEditor } from "./_components/meme-editor";
import { MemePreview } from "./_components/meme-preview";

// Type guard function to check if an object is a MemeTemplate
function isValidTemplate(template: any): template is MemeTemplate {
  return (
    template &&
    typeof template === 'object' &&
    typeof template.id === 'string' &&
    typeof template.name === 'string' &&
    typeof template.url === 'string' &&
    template.url.startsWith('http')
  );
}

export default function GeneratePage() {
  const router = useRouter();
  const dispatch = useDispatch<AppDispatch>();
  const { user } = useSelector((state: RootState) => state.auth);
  
  // State management
  const [selectedTemplate, setSelectedTemplate] = useState<MemeTemplate | null>(null);
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
  const [filteredTemplates, setFilteredTemplates] = useState<MemeTemplate[]>([]);
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
            box_count: 2
          },
          {
            id: "87743020",
            name: "Two Buttons",
            url: "https://i.imgflip.com/1g8my4.jpg",
            width: 600,
            height: 908,
            box_count: 3
          },
          {
            id: "112126428",
            name: "Distracted Boyfriend",
            url: "https://i.imgflip.com/1ur9b0.jpg",
            width: 1200,
            height: 800,
            box_count: 3
          }
        ];
        
        try {
          const fetchedTemplates = await imgflipService.getTemplates();
          
          if (!fetchedTemplates || !Array.isArray(fetchedTemplates) || fetchedTemplates.length === 0) {
            console.error("No templates returned from API");
            toast.error("Failed to load meme templates. Using fallback templates.");
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
          toast.error("Failed to load meme templates. Using fallback templates.");
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
    const filtered = templates.filter(template => 
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
      rotation: 0
    };

    setTextElements(prev => [...prev, newElement]);
    setSelectedTextId(newElement.id);
  };
  
  const updateTextElement = (id: string, updates: Partial<TextElement>) => {
    setTextElements(textElements.map(element => 
      element.id === id ? { ...element, ...updates } : element
    ));
  };
  
  const removeTextElement = (id: string) => {
    setTextElements(textElements.filter(element => element.id !== id));
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
    const ctx = canvas.getContext('2d');
    if (!ctx) return null;

    try {
      canvas.width = imageRef.current.width;
      canvas.height = imageRef.current.height;
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      ctx.drawImage(imageRef.current, 0, 0, canvas.width, canvas.height);

      textElements.forEach(element => {
        ctx.save();
        ctx.font = `bold ${element.fontSize}px Impact, sans-serif`;
        ctx.fillStyle = element.color;
        ctx.strokeStyle = element.strokeColor;
        ctx.lineWidth = Math.max(2, element.fontSize * 0.1);
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.lineJoin = 'round';

        if (element.rotation !== 0) {
          ctx.translate(element.x, element.y);
          ctx.rotate(element.rotation * Math.PI / 180);
          ctx.translate(-element.x, -element.y);
        }

        ctx.strokeText(element.text, element.x, element.y);
        ctx.fillText(element.text, element.x, element.y);
        ctx.restore();
      });

      return canvas.toDataURL('image/jpeg', 0.95);
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
      toast.error(error.message || "Failed to generate meme. Please try again.");
    } finally {
      setIsGenerating(false);
    }
  };
  
  // Save meme
  const handleSaveMeme = async () => {
    if (!generatedMeme || !title || !user?.id) {
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
        textElements
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
        id: result.data.id,
        title,
        imageUrl: generatedMeme,
        description: "",
        category,
        author: user.username || "Anonymous",
        authorId: user.id,
        createdAt: new Date().toISOString(),
        likes: 0,
        commentCount: 0,
        type: "generated",
        tags: []
      };

      dispatch(addMeme(reduxMeme));
      dispatch(addGeneratedMeme(reduxMeme.id));

      toast.success("Meme saved successfully!");
      router.push(`/meme/${result.data.id}`);
    } catch (error) {
      console.error("Error saving meme:", error);
      toast.error(error instanceof Error ? error.message : "Failed to save meme");
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
          rotation: 0
        },
        {
          id: uuidv4(),
          text: "BOTTOM TEXT",
          x: width / 2,
          y: height * 0.9,
          fontSize: Math.max(24, Math.min(36, width * 0.06)),
          color: "#FFFFFF",
          strokeColor: "#000000",
          rotation: 0
        }
      ]);
    }
  };

  const handleImageError = () => {
    toast.error("Failed to load template image");
  };

  return (
    <ProtectedRoute>
      <div className="container py-8 space-y-8">
        <Tabs defaultValue="template">
          <TabsList className="grid grid-cols-3 mb-6">
            <TabsTrigger value="template">Choose Template</TabsTrigger>
            <TabsTrigger value="editor" disabled={!selectedTemplate}>
              Add Text
            </TabsTrigger>
            <TabsTrigger value="preview" disabled={!generatedMeme}>
              Preview & Save
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
    </ProtectedRoute>
  );
}