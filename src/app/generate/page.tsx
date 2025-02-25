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
  const handleSelectTemplate = (template: any) => {
    try {
      // Validate the template
      if (!template) {
        toast.error("Invalid template selection");
        return;
      }
      
      console.log("Selected template:", template);
      
      // Store the template ID instead of the whole object
      setSelectedTemplate(template.id);
      
      // Clear any previously generated meme
      setGeneratedMeme("");
      
      // Add default text elements if none exist
      if (textElements.length === 0) {
        setTextElements([
          {
            id: uuidv4(),
            text: "Top Text",
            x: 50,
            y: 50,
            fontSize: 32,
            color: "#FFFFFF",
            strokeColor: "#000000",
            rotation: 0
          },
          {
            id: uuidv4(),
            text: "Bottom Text",
            x: 50,
            y: 200,
            fontSize: 32,
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
    
    if (active) {
      const id = active.id as string;
      const element = textElements.find(el => el.id === id);
      
      if (element) {
        updateTextElement(id, { 
          x: element.x + delta.x, 
          y: element.y + delta.y 
        });
      }
    }
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
      // For simplicity, we'll use the first two text elements as top and bottom text
      const topText = textElements[0]?.text || "";
      const bottomText = textElements.length > 1 ? textElements[1].text : "";
      
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
        bottomText
      });
      
      try {
        // Call the API to generate the meme
        const result = await imgflipService.createMeme(
          finalTemplateId,
          topText,
          bottomText
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
        
        // Use a reliable fallback image
        const fallbackUrl = "https://i.imgflip.com/30b1gx.jpg"; // Drake meme
        setGeneratedMeme(fallbackUrl);
        setActiveTab("preview");
        toast.warning("Using fallback image due to API error");
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
      if (generatedMeme.startsWith('http')) {
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
        tags: []
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
    // This ensures canvas operations only happen on the client
    if (typeof window !== 'undefined' && canvasRef.current && imageRef.current) {
      // Canvas setup code can go here if needed
    }
  }, [canvasRef, imageRef]);
  
  // Add a function to clear all text elements
  const clearTextElements = () => {
    setTextElements([]);
    setSelectedTextId(null);
  };
  
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
                          <div className="relative border rounded-lg overflow-hidden bg-muted/30">
                            <DndContext 
                              sensors={sensors}
                              onDragEnd={handleDragEnd}
                              modifiers={[restrictToParentElement]}
                            >
                              <div className="relative w-full h-full">
                                <img
                                  ref={imageRef}
                                  src={currentTemplate.url}
                                  alt={currentTemplate.name}
                                  className="w-full h-auto"
                                  style={{ maxHeight: '400px', objectFit: 'contain' }}
                                />
                                
                                {textElements.map((element) => (
                                  <DraggableText
                                    key={element.id}
                                    element={element}
                                    isSelected={selectedTextId === element.id}
                                    onSelect={() => setSelectedTextId(element.id)}
                                    onDrag={(id, position) => updateTextElement(id, position)}
                                    onTextChange={(id, text) => updateTextElement(id, { text })}
                                  />
                                ))}
                              </div>
                            </DndContext>
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
                                <p className="text-muted-foreground">
                                  Add text elements to your meme and drag them to position.
                                </p>
                              </div>
                            ) : (
                              <div className="space-y-4">
                                {/* Text Element List */}
                                <div className="space-y-2">
                                  {textElements.map((element) => (
                                    <div 
                                      key={element.id}
                                      className={`flex items-center justify-between p-2 rounded-md border ${
                                        selectedTextId === element.id ? 'border-primary' : 'border-border'
                                      }`}
                                      onClick={() => setSelectedTextId(element.id)}
                                    >
                                      <div className="flex items-center gap-2">
                                        <Move className="h-4 w-4 text-muted-foreground" />
                                        <span className="truncate max-w-[200px]">
                                          {element.text || "Text Element"}
                                        </span>
                                      </div>
                                      <Button
                                        size="icon"
                                        variant="ghost"
                                        onClick={(e) => {
                                          e.stopPropagation();
                                          removeTextElement(element.id);
                                        }}
                                      >
                                        <Trash2 className="h-4 w-4" />
                                      </Button>
                                    </div>
                                  ))}
                                </div>
                                
                                {/* Selected Text Element Controls */}
                                {selectedText && (
                                  <div className="space-y-4 p-4 border rounded-md">
                                    <div className="space-y-2">
                                      <Label htmlFor="text-content">Text Content</Label>
                                      <Input
                                        id="text-content"
                                        value={selectedText.text}
                                        onChange={(e) => updateTextElement(selectedText.id, { text: e.target.value })}
                                        placeholder="Enter your text"
                                      />
                                    </div>
                                    
                                    <div className="space-y-2">
                                      <Label>Font Size: {selectedText.fontSize}px</Label>
                                      <Slider
                                        value={[selectedText.fontSize]}
                                        min={12}
                                        max={72}
                                        step={1}
                                        onValueChange={(value) => updateTextElement(selectedText.id, { fontSize: value[0] })}
                                      />
                                    </div>
                                    
                                    <div className="space-y-2">
                                      <Label>Rotation: {selectedText.rotation}°</Label>
                                      <Slider
                                        value={[selectedText.rotation]}
                                        min={-180}
                                        max={180}
                                        step={5}
                                        onValueChange={(value) => updateTextElement(selectedText.id, { rotation: value[0] })}
                                      />
                                    </div>
                                    
                                    <div className="grid grid-cols-2 gap-4">
                                      <div className="space-y-2">
                                        <Label>Text Color</Label>
                                        <Popover>
                                          <PopoverTrigger asChild>
                                            <Button 
                                              variant="outline" 
                                              className="w-full justify-start"
                                            >
                                              <div className="w-4 h-4 mr-2 rounded-full" style={{ backgroundColor: selectedText.color }} />
                                              {selectedText.color}
                                            </Button>
                                          </PopoverTrigger>
                                          <PopoverContent className="w-auto p-0" align="start">
                                            <ColorPicker 
                                              color={selectedText.color}
                                              onChange={(color) => updateTextElement(selectedText.id, { color })}
                                            />
                                          </PopoverContent>
                                        </Popover>
                                      </div>
                                      
                                      <div className="space-y-2">
                                        <Label>Stroke Color</Label>
                                        <Popover>
                                          <PopoverTrigger asChild>
                                            <Button 
                                              variant="outline" 
                                              className="w-full justify-start"
                                            >
                                              <div className="w-4 h-4 mr-2 rounded-full" style={{ backgroundColor: selectedText.strokeColor }} />
                                              {selectedText.strokeColor}
                                            </Button>
                                          </PopoverTrigger>
                                          <PopoverContent className="w-auto p-0" align="start">
                                            <ColorPicker 
                                              color={selectedText.strokeColor}
                                              onChange={(color) => updateTextElement(selectedText.id, { strokeColor: color })}
                                            />
                                          </PopoverContent>
                                        </Popover>
                                      </div>
                                    </div>
                                  </div>
                                )}
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
    </ProtectedRoute>
  );
}