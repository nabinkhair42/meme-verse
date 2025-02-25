"use client";

import { useState, useEffect, useRef } from "react";
import { useDispatch, useSelector } from "react-redux";
import { AppDispatch, RootState } from "@/redux/store";
import { addMeme, MEME_TEMPLATES, CATEGORIES } from "@/redux/features/memes/memesSlice";
import {  addGeneratedMeme } from "@/redux/features/user/userSlice";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Slider } from "@/components/ui/slider";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import Image from "next/image";
import { toast } from "sonner";
import { useRouter } from "next/navigation";
import { Loader2, DownloadCloud, Share2, Wand2, Plus, Trash2, Move } from "lucide-react";
import { motion } from "framer-motion";
import { v4 as uuidv4 } from "uuid";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Skeleton } from "@/components/ui/skeleton";
import { imgflipService,  memeService } from "@/services/api";
import { ProtectedRoute } from "@/components/auth/protected-route";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import ColorPicker from "@/components/color-picker";
import DraggableText from "@/components/draggable-text";
import { DndContext, DragEndEvent, useSensor, useSensors, PointerSensor } from "@dnd-kit/core";
import { restrictToParentElement } from "@dnd-kit/modifiers";
import { ScrollArea } from "@/components/ui/scroll-area";
import { MemeTemplate } from "@/services/api";

// Define a text element interface
interface TextElement {
  id: string;
  text: string;
  x: number;
  y: number;
  fontSize: number;
  color: string;
  strokeColor: string;
  rotation: number;
}

// Add a type guard function to check if an object is a MemeTemplate
function isMemeTemplate(obj: any): obj is MemeTemplate {
  return obj && typeof obj === 'object' && 'id' in obj && 'name' in obj && 'url' in obj;
}

const PreviewButton = ({ onClick, isGenerating }: { onClick: () => void, isGenerating: boolean }) => (
  <Button 
    onClick={onClick} 
    className="w-full" 
    disabled={isGenerating}
    size="lg"
  >
    {isGenerating ? (
      <>
        <Loader2 className="mr-2 h-5 w-5 animate-spin" />
        Generating...
      </>
    ) : (
      <>
        <Wand2 className="mr-2 h-5 w-5" />
        Generate Meme
      </>
    )}
  </Button>
);

const FloatingActionButton = ({ onClick, isGenerating }: { onClick: () => void, isGenerating: boolean }) => (
  <div className="fixed bottom-6 right-6 z-10">
    <Button 
      onClick={onClick} 
      size="lg" 
      className="rounded-full h-14 w-14 p-0 shadow-lg"
      disabled={isGenerating}
    >
      {isGenerating ? (
        <Loader2 className="h-6 w-6 animate-spin" />
      ) : (
        <Wand2 className="h-6 w-6" />
      )}
      <span className="sr-only">Generate Meme</span>
    </Button>
  </div>
);

export default function GeneratePage() {
  const router = useRouter();
  const dispatch = useDispatch<AppDispatch>();
  const { user } = useSelector((state: RootState) => state.auth);
  
  // State for selected template and generated meme
  const [selectedTemplate, setSelectedTemplate] = useState<string | MemeTemplate | null>(null);
  const [isGenerating, setIsGenerating] = useState(false);
  const [generatedMeme, setGeneratedMeme] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState("edit");
  const [title, setTitle] = useState("");
  const [category, setCategory] = useState("");
  const [isSaving, setIsSaving] = useState(false);
  
  // State for templates from API
  const [templates, setTemplates] = useState<any[]>([]);
  const [filteredTemplates, setFilteredTemplates] = useState<any[]>([]);
  const [isLoadingTemplates, setIsLoadingTemplates] = useState(true);
  
  // State for text elements (draggable text boxes)
  const [textElements, setTextElements] = useState<TextElement[]>([]);
  const [selectedTextId, setSelectedTextId] = useState<string | null>(null);
  
  // Refs for canvas and image
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const imageRef = useRef<HTMLImageElement>(null);
  
  // Animation variants
  const container = {
    hidden: { opacity: 0 },
    show: {
      opacity: 1,
      transition: {
        staggerChildren: 0.1
      }
    }
  };
  
  const item = {
    hidden: { opacity: 0, y: 20 },
    show: { opacity: 1, y: 0 }
  };
  
  // Add state for template search
  const [searchQuery, setSearchQuery] = useState("");
  
  // Add this state to track image loading
  const [isImageLoaded, setIsImageLoaded] = useState(false);
  
  // Fetch templates from Imgflip API
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
          const templates = await imgflipService.getTemplates();
          
          if (!templates || !Array.isArray(templates) || templates.length === 0) {
            console.error("No templates returned from API");
            toast.error("Failed to load meme templates. Using fallback templates.");
            setTemplates(fallbackTemplates);
            setFilteredTemplates(fallbackTemplates);
            return;
          }
          
          // Validate each template
          const validTemplates = templates.filter((template) => {
            return template && typeof template === 'object' && template.id && template.url;
          });
          
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
        
        // Set empty arrays to prevent further errors
        setTemplates([]);
        setFilteredTemplates([]);
      } finally {
        setIsLoadingTemplates(false);
      }
    };
    
    fetchTemplates();
  }, []);
  
  // Add useEffect to filter templates based on search query
  useEffect(() => {
    if (!templates || templates.length === 0) return;
    
    if (!searchQuery.trim()) {
      setFilteredTemplates(templates);
      return;
    }
    
    const query = searchQuery.toLowerCase();
    const filtered = templates.filter(template => 
      template && 
      template.name && 
      template.name.toLowerCase().includes(query)
    );
    
    setFilteredTemplates(filtered);
  }, [searchQuery, templates]);
  
  // Handle template selection
  const handleSelectTemplate = (template: MemeTemplate) => {
    try {
      // Validate the template
      if (!template) {
        toast.error("Invalid template selection");
        return;
      }
      
      console.log("Selected template:", template);
      
      // Set the selected template
      setSelectedTemplate(template);
      
      // Reset text elements when changing templates
      if (textElements.length === 0) {
        // Add default text elements based on template
        setTextElements([
          {
            id: uuidv4(),
            text: "TOP TEXT",
            x: 250,
            y: 50,
            fontSize: 36,
            color: "#FFFFFF",
            strokeColor: "#000000",
            rotation: 0
          },
          {
            id: uuidv4(),
            text: "BOTTOM TEXT",
            x: 250,
            y: 450,
            fontSize: 36,
            color: "#FFFFFF",
            strokeColor: "#000000",
            rotation: 0
          }
        ]);
      }
      
      toast.success("Template selected!");
    } catch (error) {
      console.error("Error selecting template:", error);
      toast.error("Failed to select template");
    }
  };
  
  // Find the current template
  const currentTemplate = templates.find(template => template.id === selectedTemplate) || 
                         MEME_TEMPLATES.find(template => template.id === selectedTemplate);
  
  // Add a new text element
  const addTextElement = () => {
    const newElement: TextElement = {
      id: uuidv4(),
      text: "Add your text here",
      x: 50, // Default position
      y: 50,
      fontSize: 32,
      color: "#FFFFFF",
      strokeColor: "#000000",
      rotation: 0
    };
    
    setTextElements([...textElements, newElement]);
    setSelectedTextId(newElement.id);
  };
  
  // Remove a text element
  const removeTextElement = (id: string) => {
    setTextElements(textElements.filter(element => element.id !== id));
    if (selectedTextId === id) {
      setSelectedTextId(null);
    }
  };
  
  // Update a text element
  const updateTextElement = (id: string, updates: Partial<TextElement>) => {
    setTextElements(textElements.map(element => 
      element.id === id ? { ...element, ...updates } : element
    ));
  };
  
  // Handle text drag
  const handleDragEnd = (event: DragEndEvent) => {
    const { active, delta } = event;
    const id = active.id as string;
    
    // Update the position of the dragged element
    setTextElements(prev => 
      prev.map(el => 
        el.id === id 
          ? { 
              ...el, 
              x: Math.max(0, Math.min(500, el.x + delta.x)), 
              y: Math.max(0, Math.min(500, el.y + delta.y)) 
            } 
          : el
      )
    );
  };
  
  // Add this for better drag behavior
  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 8,
      },
    })
  );
  
  // Generate meme by drawing on canvas
  const generateMeme = async () => {
    if (!selectedTemplate) {
      toast.error("Please select a template first");
      return;
    }
    
    if (textElements.length === 0) {
      toast.error("Please add at least one text element");
      return;
    }
    
    setIsGenerating(true);
    
    try {
      // Sort text elements by vertical position (top to bottom)
      const sortedTextElements = [...textElements].sort((a, b) => a.y - b.y);
      
      // Get the top and bottom text (or use empty strings if not available)
      const topText = sortedTextElements[0]?.text || "";
      const bottomText = sortedTextElements.length > 1 ? sortedTextElements[1].text : "";
      
      // Get the template ID regardless of whether selectedTemplate is a string or object
      let finalTemplateId: string;
      
      if (typeof selectedTemplate === 'string') {
        finalTemplateId = selectedTemplate;
      } else if (selectedTemplate && typeof selectedTemplate === 'object' && 'id' in selectedTemplate) {
        finalTemplateId = selectedTemplate.id;
      } else {
        // Use a fallback template ID
        finalTemplateId = "181913649"; // Drake template
      }
      
      console.log("Generating meme with:", {
        templateId: finalTemplateId,
        topText,
        bottomText,
        textElements: sortedTextElements
      });
      
      try {
        // First, try to render the meme locally using canvas
        if (canvasRef.current && imageRef.current && imageRef.current.complete) {
          try {
            const canvas = canvasRef.current;
            const ctx = canvas.getContext('2d');
            
            if (ctx) {
              // Clear canvas
              ctx.clearRect(0, 0, canvas.width, canvas.height);
              
              // Draw the template image
              ctx.drawImage(imageRef.current, 0, 0, canvas.width, canvas.height);
              
              // Draw each text element
              sortedTextElements.forEach(element => {
                ctx.save();
                
                // Set text properties
                ctx.font = `${element.fontSize}px Impact, sans-serif`;
                ctx.fillStyle = element.color;
                ctx.strokeStyle = element.strokeColor;
                ctx.lineWidth = 2;
                ctx.textAlign = 'center';
                ctx.textBaseline = 'middle';
                
                // Apply rotation if needed
                if (element.rotation !== 0) {
                  ctx.translate(element.x, element.y);
                  ctx.rotate(element.rotation * Math.PI / 180);
                  ctx.translate(-element.x, -element.y);
                }
                
                // Draw text with stroke for better visibility
                const text = element.text;
                
                // Add stroke (outline)
                ctx.strokeText(text, element.x, element.y);
                
                // Add fill
                ctx.fillText(text, element.x, element.y);
                
                ctx.restore();
              });
              
              // Get the canvas data URL
              const localMemeUrl = canvas.toDataURL('image/jpeg', 0.95);
              
              // Use the local rendering
              setGeneratedMeme(localMemeUrl);
              setActiveTab("preview");
              toast.success("Meme generated successfully!");
              
              // Return early - we've successfully rendered locally
              setIsGenerating(false);
              return;
            }
          } catch (canvasError) {
            console.error("Canvas rendering failed, falling back to API:", canvasError);
            // Continue to API fallback
          }
        }
        
        // Fallback to API if local rendering fails
        const result = await imgflipService.createMeme(
          finalTemplateId,
          topText,
          bottomText,
          sortedTextElements
        );
        
        console.log("API response:", result);
        
        if (result && result.url) {
          // Ensure the URL is valid
          const url = result.url.startsWith('http') ? result.url : `https://i.imgflip.com/${result.url}`;
          
          // Set the generated meme URL
          setGeneratedMeme(url);
          
          // Switch to preview tab
          setActiveTab("preview");
          
          toast.success("Meme generated successfully!");
        } else {
          throw new Error("Invalid response from API");
        }
      } catch (apiError) {
        console.error("API error:", apiError);
        
        // Try one more time with a simpler approach
        try {
          // Create a simple canvas rendering as fallback
          if (canvasRef.current && imageRef.current && imageRef.current.complete) {
            const canvas = canvasRef.current;
            const ctx = canvas.getContext('2d');
            
            if (ctx) {
              // Clear canvas
              ctx.clearRect(0, 0, canvas.width, canvas.height);
              
              // Draw the template image
              ctx.drawImage(imageRef.current, 0, 0, canvas.width, canvas.height);
              
              // Draw simple top and bottom text
              ctx.font = '32px Impact';
              ctx.fillStyle = '#FFFFFF';
              ctx.strokeStyle = '#000000';
              ctx.lineWidth = 2;
              ctx.textAlign = 'center';
              
              // Top text
              ctx.strokeText(topText, canvas.width / 2, 50);
              ctx.fillText(topText, canvas.width / 2, 50);
              
              // Bottom text
              ctx.strokeText(bottomText, canvas.width / 2, canvas.height - 30);
              ctx.fillText(bottomText, canvas.width / 2, canvas.height - 30);
              
              // Get the canvas data URL
              const fallbackMemeUrl = canvas.toDataURL('image/jpeg', 0.9);
              
              setGeneratedMeme(fallbackMemeUrl);
              setActiveTab("preview");
              toast.success("Meme generated with fallback method");
              return;
            }
          }
        } catch (fallbackError) {
          console.error("Fallback rendering failed:", fallbackError);
        }
        
        // Use a reliable fallback image as last resort
        const fallbackUrl = "https://i.imgflip.com/30b1gx.jpg"; // Drake meme
        setGeneratedMeme(fallbackUrl);
        setActiveTab("preview");
        toast.warning("Using fallback image due to generation errors");
      }
    } catch (error) {
      console.error("Error generating meme:", error);
      toast.error("Failed to generate meme. Please try again.");
    } finally {
      setIsGenerating(false);
    }
  };
  
  // Handle download
  const handleDownload = () => {
    if (!generatedMeme) {
      toast.error("Please generate a meme first");
      return;
    }
    
    try {
      // Create a link element
      const link = document.createElement('a');
      link.href = generatedMeme;
      link.download = `meme-${Date.now()}.jpg`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      
      toast.success("Download started!");
    } catch (error) {
      console.error("Error downloading meme:", error);
      
      // Fallback: open in new tab
      window.open(generatedMeme, '_blank');
      toast.info("Image opened in new tab. Right-click and select 'Save image as...' to download.");
    }
  };
  
  // Handle publish to MemeVerse
  const handlePublish = async () => {
    if (!generatedMeme) {
      toast.error("Please generate a meme first");
      return;
    }
    
    if (!title) {
      toast.error("Please enter a title for your meme");
      return;
    }
    
    if (!category) {
      toast.error("Please select a category for your meme");
      return;
    }
    
    setIsSaving(true);
    
    try {
      // First, upload the image to ImgBB
      console.log("Uploading meme to ImgBB...");
      
      // Convert image URL to base64 if it's not already
      let imageData = generatedMeme;
      
      // If the image is a URL, we need to fetch it and convert to base64
      if (generatedMeme.startsWith('http') && !generatedMeme.startsWith('data:')) {
        try {
          const imgbbResponse = await memeService.uploadToImgBB(generatedMeme);
          
          if (!imgbbResponse || !imgbbResponse.url) {
            throw new Error("Failed to upload image to ImgBB");
          }
          
          imageData = imgbbResponse.url;
          console.log("Image uploaded to ImgBB:", imageData);
        } catch (uploadError) {
          console.error("Error uploading to ImgBB:", uploadError);
          toast.error("Failed to upload image. Using original URL.");
          // Continue with the original URL if upload fails
        }
      }
      
      // Create a new meme object
      const newMeme = {
        title,
        url: imageData,
        category,
        description: "",
        tags: [],
        isGenerated: true, // Flag to identify this as a generated meme
        templateId: typeof selectedTemplate === 'string' ? selectedTemplate : 
                   (selectedTemplate && 'id' in selectedTemplate ? selectedTemplate.id : null)
      };
      
      console.log("Publishing meme with data:", newMeme);
      
      // Save the meme to the database as a user-generated meme
      const savedMeme = await memeService.createUserGeneratedMeme(newMeme);
      
      // Update Redux store
      dispatch(addMeme(savedMeme));
      dispatch(addGeneratedMeme(savedMeme.id));
      
      toast.success("Meme published successfully!");
      
      // Redirect to the meme page
      router.push(`/meme/${savedMeme.id}`);
    } catch (error) {
      console.error("Error publishing meme:", error);
      toast.error("Failed to publish meme. Please try again.");
    } finally {
      setIsSaving(false);
    }
  };
  
  // Get the selected text element
  const selectedText = selectedTextId 
    ? textElements.find(el => el.id === selectedTextId) 
    : null;
  
  // Modify the canvas operations to be client-side only
  useEffect(() => {
    if (typeof window === 'undefined') return;
    
    // When template changes, update the image source
    if (imageRef.current && selectedTemplate) {
      setIsImageLoaded(false);
      
      if (typeof selectedTemplate === 'object' && selectedTemplate.url) {
        imageRef.current.src = selectedTemplate.url;
      } else if (typeof selectedTemplate === 'string') {
        // Find the template by ID
        const template = templates.find(t => t.id === selectedTemplate);
        if (template && template.url) {
          imageRef.current.src = template.url;
        }
      }
    }
    
    // Set up canvas dimensions
    if (canvasRef.current && selectedTemplate) {
      const canvas = canvasRef.current;
      const ctx = canvas.getContext('2d');
      
      // Set canvas dimensions based on the template or a default size
      let templateWidth = 500;
      let templateHeight = 500;
      
      if (typeof selectedTemplate === 'object' && selectedTemplate.width && selectedTemplate.height) {
        templateWidth = selectedTemplate.width;
        templateHeight = selectedTemplate.height;
      }
      
      // Set canvas size
      canvas.width = templateWidth;
      canvas.height = templateHeight;
      
      // Clear canvas
      if (ctx) {
        ctx.clearRect(0, 0, canvas.width, canvas.height);
      }
    }
  }, [selectedTemplate, templates]);
  
  // Add a function to clear all text elements
  const clearTextElements = () => {
    setTextElements([]);
    setSelectedTextId(null);
  };
  
  // Hidden elements for canvas rendering
  const hiddenElements = (
    <div className="hidden">
      <canvas ref={canvasRef} width={500} height={500} />
      <Image
        ref={imageRef}
        src={typeof selectedTemplate === 'object' && selectedTemplate?.url ? selectedTemplate.url : ''}
        alt="Template"
        onLoad={() => setIsImageLoaded(true)}
        crossOrigin="anonymous"
      />
    </div>
  );
  
  return (
    <ProtectedRoute>
      <div className="py-8 md:py-12 max-w-7xl mx-auto px-4">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
        >
          <h1 className="text-3xl font-bold mb-8">Create a Meme</h1>
          
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
            {/* Template Selection */}
            <Card className="lg:col-span-4">
              <CardHeader>
                <CardTitle>Choose a Template</CardTitle>
                <div className="mt-2">
                  <Input
                    placeholder="Search templates..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="w-full"
                  />
                </div>
              </CardHeader>
              <CardContent>
                {isLoadingTemplates ? (
                  <div className="space-y-4">
                    {[1, 2, 3, 4, 5].map((i) => (
                      <div key={i} className="flex items-center gap-4">
                        <Skeleton className="h-16 w-16 rounded" />
                        <div className="space-y-2">
                          <Skeleton className="h-4 w-32" />
                          <Skeleton className="h-3 w-24" />
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <ScrollArea className="h-[700px] pr-4">
                    <motion.div 
                      className="space-y-2"
                      variants={container}
                      initial="hidden"
                      animate="show"
                    >
                      {filteredTemplates.map((template, index) => {
                        if (!template || !template.id || !template.url) {
                          return null;
                        }
                        
                        return (
                          <div 
                            key={template.id || index}
                            onClick={() => handleSelectTemplate(template)}
                            className={`flex items-center gap-4 p-2 rounded-md cursor-pointer hover:bg-accent transition-colors ${
                              selectedTemplate === template.id ? 'bg-accent border border-primary/20' : ''
                            }`}
                          >
                            <div className="h-16 w-16 relative rounded overflow-hidden border">
                              <Image
                                src={template.url}
                                alt={template.name || "Meme template"}
                                fill
                                className="object-cover"
                                unoptimized
                              />
                            </div>
                            <div>
                              <h3 className="font-medium">{template.name || "Unnamed template"}</h3>
                              <p className="text-xs text-muted-foreground">Classic template</p>
                            </div>
                          </div>
                        );
                      })}
                    </motion.div>
                  </ScrollArea>
                )}
              </CardContent>
            </Card>
            
            {/* Meme Editor */}
            <Card className="lg:col-span-8">
              <CardHeader>
                <CardTitle>Customize Your Meme</CardTitle>
              </CardHeader>
              <CardContent>
                {!selectedTemplate ? (
                  <div className="text-center py-12 bg-muted/30 rounded-lg">
                    <Wand2 className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
                    <h3 className="text-lg font-semibold mb-2">Select a template to get started</h3>
                    <p className="text-muted-foreground mb-6 max-w-md mx-auto">
                      Choose from our collection of popular meme templates on the left to begin creating your masterpiece.
                    </p>
                  </div>
                ) : (
                  <div>
                    <Tabs value={activeTab} onValueChange={setActiveTab}>
                      <TabsList className="mb-4">
                        <TabsTrigger value="edit">Edit</TabsTrigger>
                        <TabsTrigger value="preview" disabled={!generatedMeme}>Preview</TabsTrigger>
                      </TabsList>
                      
                      <TabsContent value="edit">
                        <div className="space-y-6">
                          {/* Template Preview with Draggable Text */}
                          <div className="relative border rounded-lg overflow-hidden bg-muted/30 mb-6">
                            <div className="relative aspect-square w-full">
                              {selectedTemplate ? (
                                <>
                                  {typeof selectedTemplate === 'object' && selectedTemplate.url ? (
                                    <Image
                                      src={selectedTemplate.url}
                                      alt="Template"
                                      fill
                                      className="object-contain"
                                      unoptimized
                                    />
                                  ) : (
                                    <div className="flex items-center justify-center h-full">
                                      <Loader2 className="h-8 w-8 animate-spin text-primary" />
                                    </div>
                                  )}
                                  
                                  <DndContext
                                    sensors={sensors}
                                    onDragEnd={handleDragEnd}
                                    modifiers={[restrictToParentElement]}
                                  >
                                    {textElements.map((element) => (
                                      <DraggableText
                                        key={element.id}
                                        element={element}
                                        isSelected={selectedTextId === element.id}
                                        onSelect={() => setSelectedTextId(element.id)}
                                        onDrag={(id, delta) => updateTextElement(id, { x: delta.x, y: delta.y })}
                                        onTextChange={(id, text) => updateTextElement(id, { text })}
                                      />
                                    ))}
                                  </DndContext>
                                </>
                              ) : (
                                <div className="flex items-center justify-center h-full">
                                  <p className="text-muted-foreground">Select a template to start</p>
                                </div>
                              )}
                            </div>
                          </div>
                          
                          {/* Text Controls */}
                          <div className="space-y-4">
                            <div className="flex justify-between items-center mb-4">
                              <h3 className="text-sm font-medium">Text Elements</h3>
                              <div className="flex gap-2">
                                <Button 
                                  variant="outline" 
                                  size="sm" 
                                  onClick={addTextElement}
                                >
                                  <Plus className="h-4 w-4 mr-1" /> Add Text
                                </Button>
                                {textElements.length > 0 && (
                                  <Button 
                                    variant="outline" 
                                    size="sm" 
                                    onClick={clearTextElements}
                                  >
                                    <Trash2 className="h-4 w-4 mr-1" /> Clear All
                                  </Button>
                                )}
                              </div>
                            </div>
                            
                            {textElements.length === 0 ? (
                              <div className="text-center py-6 bg-muted/30 rounded-lg">
                                <p className="text-muted-foreground">No text elements added yet</p>
                                <Button 
                                  variant="outline" 
                                  size="sm" 
                                  onClick={addTextElement}
                                  className="mt-2"
                                >
                                  <Plus className="h-4 w-4 mr-1" /> Add Text
                                </Button>
                              </div>
                            ) : (
                              <div className="space-y-3">
                                {textElements.map((element) => (
                                  <div 
                                    key={element.id}
                                    className={`p-3 border rounded-md cursor-pointer ${
                                      selectedTextId === element.id ? 'border-primary bg-primary/5' : ''
                                    }`}
                                    onClick={() => setSelectedTextId(element.id)}
                                  >
                                    <div className="flex justify-between items-center mb-2">
                                      <div className="font-medium truncate" style={{ color: element.color }}>
                                        {element.text || "Text Element"}
                                      </div>
                                      <div className="flex gap-1">
                                        <Button 
                                          variant="ghost" 
                                          size="icon" 
                                          className="h-7 w-7"
                                          onClick={(e) => {
                                            e.stopPropagation();
                                            removeTextElement(element.id);
                                          }}
                                        >
                                          <Trash2 className="h-4 w-4" />
                                        </Button>
                                        <Button 
                                          variant="ghost" 
                                          size="icon" 
                                          className="h-7 w-7 cursor-move"
                                        >
                                          <Move className="h-4 w-4" />
                                        </Button>
                                      </div>
                                    </div>
                                    
                                    <Input
                                      value={element.text}
                                      onChange={(e) => updateTextElement(element.id, { text: e.target.value })}
                                      onClick={(e) => e.stopPropagation()}
                                      className="mb-2"
                                      placeholder="Enter text"
                                    />
                                    
                                    {selectedTextId === element.id && (
                                      <div className="space-y-3 mt-3 pt-3 border-t">
                                        <div className="space-y-2">
                                          <Label className="text-xs">Font Size</Label>
                                          <Slider
                                            value={[element.fontSize]}
                                            min={12}
                                            max={72}
                                            step={1}
                                            onValueChange={(value) => updateTextElement(element.id, { fontSize: value[0] })}
                                          />
                                        </div>
                                        
                                        <div className="grid grid-cols-2 gap-2">
                                          <ColorPicker
                                            color={element.color}
                                            onChange={(color) => updateTextElement(element.id, { color })}
                                            label="Text Color"
                                          />
                                          
                                          <ColorPicker
                                            color={element.strokeColor}
                                            onChange={(color) => updateTextElement(element.id, { strokeColor: color })}
                                            label="Outline Color"
                                          />
                                        </div>
                                        
                                        <div className="space-y-2">
                                          <Label className="text-xs">Rotation</Label>
                                          <Slider
                                            value={[element.rotation]}
                                            min={-180}
                                            max={180}
                                            step={5}
                                            onValueChange={(value) => updateTextElement(element.id, { rotation: value[0] })}
                                          />
                                        </div>
                                      </div>
                                    )}
                                  </div>
                                ))}
                              </div>
                            )}
                          </div>
                          
                          <div className="mt-6">
                            <PreviewButton onClick={generateMeme} isGenerating={isGenerating} />
                          </div>
                        </div>
                      </TabsContent>
                      
                      <TabsContent value="preview">
                        {generatedMeme ? (
                          <div className="space-y-6">
                            <div className="relative border rounded-lg overflow-hidden bg-muted/30 mx-auto max-w-md">
                              <div className="relative aspect-square w-full">
                                <Image
                                  src={generatedMeme}
                                  alt="Generated Meme"
                                  fill
                                  className="object-contain"
                                  unoptimized
                                  onError={(e) => {
                                    console.error("Image failed to load:", generatedMeme);
                                    // Set a fallback image
                                    e.currentTarget.src = "https://i.imgflip.com/30b1gx.jpg";
                                    toast.error("Failed to load generated image, using fallback");
                                  }}
                                />
                              </div>
                            </div>
                            
                            <div className="space-y-4">
                              <div className="space-y-2">
                                <Label htmlFor="title">Title</Label>
                                <Input
                                  id="title"
                                  placeholder="Give your meme a title"
                                  value={title}
                                  onChange={(e) => setTitle(e.target.value)}
                                />
                              </div>
                              
                              <div className="space-y-2">
                                <Label htmlFor="category">Category</Label>
                                <Select value={category} onValueChange={setCategory}>
                                  <SelectTrigger id="category">
                                    <SelectValue placeholder="Select a category" />
                                  </SelectTrigger>
                                  <SelectContent>
                                    {CATEGORIES.map((cat) => (
                                      <SelectItem key={cat.value} value={cat.value}>
                                        {cat.label}
                                      </SelectItem>
                                    ))}
                                  </SelectContent>
                                </Select>
                              </div>
                            </div>
                            
                            <div className="flex flex-col sm:flex-row gap-3 mt-6">
                              <Button 
                                onClick={handlePublish} 
                                className="flex-1"
                                disabled={isSaving || !title || !category}
                              >
                                {isSaving ? (
                                  <>
                                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                    Publishing...
                                  </>
                                ) : (
                                  <>
                                    <Share2 className="mr-2 h-4 w-4" />
                                    Publish to MemeVerse
                                  </>
                                )}
                              </Button>
                              
                              <Button 
                                variant="outline" 
                                onClick={handleDownload}
                                className="flex-1"
                              >
                                <DownloadCloud className="mr-2 h-4 w-4" />
                                Download
                              </Button>
                              
                              <Button 
                                variant="outline"
                                onClick={generateMeme}
                                className="flex-1"
                                disabled={isGenerating}
                              >
                                {isGenerating ? (
                                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                ) : (
                                  <Wand2 className="mr-2 h-4 w-4" />
                                )}
                                Regenerate
                              </Button>
                              
                              <Button 
                                variant="ghost" 
                                onClick={() => setActiveTab("edit")}
                                className="flex-1 sm:flex-none"
                              >
                                Back to Editor
                              </Button>
                            </div>
                          </div>
                        ) : (
                          <div className="text-center py-12">
                            <Loader2 className="h-8 w-8 animate-spin mx-auto mb-4 text-primary" />
                            <p>Please generate a meme first</p>
                            <Button 
                              className="mt-4" 
                              onClick={() => setActiveTab("edit")}
                            >
                              Go to Editor
                            </Button>
                          </div>
                        )}
                      </TabsContent>
                    </Tabs>
                  </div>
                )}
              </CardContent>
            </Card>
            
            {/* Tips Section */}
            <Card className="lg:col-span-12 mt-4">
              <CardHeader>
                <CardTitle>Tips for Great Memes</CardTitle>
              </CardHeader>
              <CardContent>
                <ul className="list-disc pl-5 space-y-2">
                  <li>Keep text short and snappy for maximum impact</li>
                  <li>Use proper capitalization for the classic meme look</li>
                  <li>Make sure your text contrasts well with the image</li>
                  <li>Position text strategically by dragging it to the right spot</li>
                  <li>Adjust text size and rotation for creative effects</li>
                  <li>Use multiple text elements to create more complex memes</li>
                </ul>
              </CardContent>
            </Card>
          </div>
        </motion.div>
      </div>
      <FloatingActionButton onClick={generateMeme} isGenerating={isGenerating} />
      {hiddenElements}
    </ProtectedRoute>
  );
}