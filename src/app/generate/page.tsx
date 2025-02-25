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
import { Loader2, DownloadCloud, Shuffle, Share2, Wand2, Plus, Trash2, Move } from "lucide-react";
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
import { Canvas } from "@/components/canvas";

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
  const [selectedTemplate, setSelectedTemplate] = useState<string | null>(null);
  const [isGenerating, setIsGenerating] = useState(false);
  const [generatedMeme, setGeneratedMeme] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState("edit");
  const [title, setTitle] = useState("");
  const [category, setCategory] = useState("");
  
  // State for templates from API
  const [templates, setTemplates] = useState<any[]>([]);
  
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
  
  // Fetch templates from Imgflip API
  useEffect(() => {
    const fetchTemplates = async () => {
      try {
        setLoading(true);
        const templatesData = await imgflipService.getTemplates();
        setTemplates(templatesData.slice(0, 20)); // Limit to 20 templates
      } catch (error) {
        console.error("Error fetching templates:", error);
        toast.error("Failed to load meme templates");
      } finally {
        setLoading(false);
      }
    };

    fetchTemplates();
  }, []);
  
  // Handle template selection
  const handleSelectTemplate = (templateId: string) => {
    setSelectedTemplate(templateId);
    
    // Reset the texts when changing templates
    setTextElements([]);
    setGeneratedMeme(null);
    setActiveTab("edit");
    setTitle("");
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
    if (!currentTemplate || !canvasRef.current || !imageRef.current) return;
    
    setIsGenerating(true);
    
    try {
      const canvas = canvasRef.current;
      const ctx = canvas.getContext('2d');
      
      if (!ctx) {
        throw new Error("Could not get canvas context");
      }
      
      // Set canvas dimensions to match image
      canvas.width = imageRef.current.naturalWidth;
      canvas.height = imageRef.current.naturalHeight;
      
      // Draw the template image
      ctx.drawImage(imageRef.current, 0, 0, canvas.width, canvas.height);
      
      // Draw each text element
      textElements.forEach(element => {
        ctx.save();
        
        // Set text properties
        ctx.font = `${element.fontSize}px Impact`;
        ctx.fillStyle = element.color;
        ctx.strokeStyle = element.strokeColor;
        ctx.lineWidth = element.fontSize / 15;
        ctx.textAlign = 'center';
        
        // Apply rotation if needed
        if (element.rotation !== 0) {
          ctx.translate(element.x, element.y);
          ctx.rotate(element.rotation * Math.PI / 180);
          ctx.translate(-element.x, -element.y);
        }
        
        // Draw the text
        ctx.fillText(element.text, element.x, element.y);
        ctx.strokeText(element.text, element.x, element.y);
        
        ctx.restore();
      });
      
      // Convert canvas to data URL
      const dataUrl = canvas.toDataURL('image/png');
      setGeneratedMeme(dataUrl);
      setActiveTab("preview");
      
      toast.success("Meme generated successfully!");
    } catch (error) {
      console.error("Error generating meme:", error);
      toast.error("Failed to generate meme");
    } finally {
      setIsGenerating(false);
    }
  };
  
  // Handle download
  const handleDownload = () => {
    if (!generatedMeme) return;
    
    const link = document.createElement('a');
    link.href = generatedMeme;
    link.download = `meme-${Date.now()}.png`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };
  
  // Handle publish to MemeVerse
  const handlePublish = async () => {
    if (!generatedMeme || !title || !category) {
      toast.error("Please provide a title and category");
      return;
    }
    
    setIsGenerating(true);
    
    try {
      // In a real app, you would upload the image to ImgBB first
      // For demo purposes, we'll use the data URL directly
      
      const newMeme = {
        id: uuidv4(),
        title,
        description: `A meme generated using the ${currentTemplate?.name} template`,
        url: generatedMeme,
        category,
        author: user?.username || "Anonymous",
        authorId: user?.id,
        createdAt: new Date().toISOString(),
        likes: 0,
        comments: [],
        tags: [category.toLowerCase(), "ai-generated"]
      };
      
      // Save to backend
      const savedMeme = await memeService.createMeme(newMeme);
      
      // Update Redux store
      dispatch(addMeme(savedMeme || newMeme));
      dispatch(addGeneratedMeme(savedMeme?.id || newMeme.id));
      
      toast.success("Meme published successfully!");
      
      // Redirect to the meme page
      router.push(`/meme/${savedMeme?.id || newMeme.id}`);
    } catch (error) {
      console.error("Error publishing meme:", error);
      toast.error("Failed to publish meme");
    } finally {
      setIsGenerating(false);
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
              </CardHeader>
              <CardContent>
                {loading ? (
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
                  <motion.div 
                    className="space-y-2 max-h-[500px] overflow-y-auto pr-2"
                    variants={container}
                    initial="hidden"
                    animate="show"
                  >
                    {templates.map((template) => (
                      <motion.div 
                        key={template.id}
                        variants={item}
                        onClick={() => handleSelectTemplate(template.id)}
                        className={`flex items-center gap-4 p-2 rounded-md cursor-pointer hover:bg-accent transition-colors ${
                          selectedTemplate === template.id ? 'bg-accent border border-primary/20' : ''
                        }`}
                      >
                        <div className="h-16 w-16 relative rounded overflow-hidden border">
                          <Image
                            src={template.url}
                            alt={template.name}
                            fill
                            className="object-cover"
                            unoptimized
                          />
                        </div>
                        <div>
                          <h3 className="font-medium">{template.name}</h3>
                          <p className="text-xs text-muted-foreground">Classic template</p>
                        </div>
                      </motion.div>
                    ))}
                  </motion.div>
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
                            <div className="flex justify-between items-center">
                              <h3 className="text-lg font-semibold">Text Elements</h3>
                              <Button 
                                onClick={addTextElement} 
                                size="sm"
                                variant="outline"
                              >
                                <Plus className="mr-2 h-4 w-4" />
                                Add Text
                              </Button>
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
                            <div className="border rounded-lg overflow-hidden bg-muted/30">
                              <div className="relative">
                                <img
                                  src={generatedMeme}
                                  alt="Generated Meme"
                                  className="w-full h-auto"
                                />
                                <div className="absolute top-2 right-2">
                                  <Button 
                                    size="sm" 
                                    variant="secondary" 
                                    onClick={() => setActiveTab("edit")}
                                  >
                                    Edit
                                  </Button>
                                </div>
                              </div>
                            </div>
                            
                            <div className="space-y-4">
                              <div className="space-y-2">
                                <Label htmlFor="meme-title">Title</Label>
                                <Input
                                  id="meme-title"
                                  value={title}
                                  onChange={(e) => setTitle(e.target.value)}
                                  placeholder="Give your meme a catchy title"
                                  className="mb-4"
                                />
                              </div>
                              
                              <div>
                                <Label htmlFor="meme-category">Category</Label>
                                <Select value={category} onValueChange={setCategory}>
                                  <SelectTrigger>
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
                            
                            <div className="flex flex-col sm:flex-row gap-4">
                              <Button 
                                onClick={handleDownload} 
                                className="flex-1"
                                variant="outline"
                              >
                                <DownloadCloud className="mr-2 h-4 w-4" />
                                Download
                              </Button>
                              <Button 
                                onClick={handlePublish} 
                                className="flex-1"
                                disabled={!title || !category}
                              >
                                <Share2 className="mr-2 h-4 w-4" />
                                Publish to MemeVerse
                              </Button>
                            </div>
                            
                            <Button 
                              variant="ghost" 
                              className="w-full" 
                              onClick={() => setActiveTab("edit")}
                            >
                              Back to Editing
                            </Button>
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