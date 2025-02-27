import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ScrollArea } from "@/components/ui/scroll-area";
import { MemeTemplate, TextElement } from "@/types/meme";
import { DndContext, DragEndEvent, PointerSensor, useSensor, useSensors } from "@dnd-kit/core";
import { restrictToParentElement } from "@dnd-kit/modifiers";
import { Move, Plus } from "lucide-react";
import Image from "next/image";
import DraggableText from "@/components/draggable-text";
import { TextElementControls } from "./text-element-controls";
import { PreviewButton } from "./preview-button";

interface MemeEditorProps {
  selectedTemplate: MemeTemplate;
  textElements: TextElement[];
  selectedTextId: string | null;
  isGenerating: boolean;
  onTextSelect: (id: string | null) => void;
  onTextUpdate: (id: string, updates: Partial<TextElement>) => void;
  onTextRemove: (id: string) => void;
  onTextAdd: () => void;
  onGenerate: () => void;
  imageRef: React.RefObject<HTMLImageElement>;
  canvasRef: React.RefObject<HTMLCanvasElement>;
  onImageLoad: () => void;
  onImageError: () => void;
}

export function MemeEditor({
  selectedTemplate,
  textElements,
  selectedTextId,
  isGenerating,
  onTextSelect,
  onTextUpdate,
  onTextRemove,
  onTextAdd,
  onGenerate,
  imageRef,
  canvasRef,
  onImageLoad,
  onImageError
}: MemeEditorProps) {
  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 8,
      },
    })
  );

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, delta } = event;
    const id = active.id as string;
    
    const element = textElements.find(el => el.id === id);
    if (!element) return;

    onTextUpdate(id, {
      x: Math.max(0, Math.min(500, element.x + delta.x)),
      y: Math.max(0, Math.min(500, element.y + delta.y))
    });
  };

  return (
    <Card className="border-2 shadow-md bg-background/50 backdrop-blur-sm">
      <CardHeader className="border-b pb-4">
        <CardTitle className="text-2xl text-center font-bold">
          Customize Your Meme
        </CardTitle>
        <p className="text-center text-muted-foreground mt-2">Drag text to position, customize colors and size</p>
      </CardHeader>
      <CardContent className="pt-6">
        <div className="grid gap-8 lg:grid-cols-2">
          <div className="space-y-6">
            <div className="relative aspect-square max-w-[500px] mx-auto overflow-hidden rounded-lg border-2 shadow-lg bg-muted/10">
              <DndContext
                sensors={sensors}
                modifiers={[restrictToParentElement]}
                onDragEnd={handleDragEnd}
              >
                <div className="relative h-full">
                  {selectedTemplate.url ? (
                    <Image
                      ref={imageRef}
                      src={selectedTemplate.url}
                      alt={selectedTemplate.name}
                      fill
                      className="object-contain"
                      onLoad={onImageLoad}
                      onError={onImageError}
                      crossOrigin="anonymous"
                    />
                  ) : (
                    <div className="flex h-full items-center justify-center text-muted-foreground">
                      No template selected
                    </div>
                  )}
                  {textElements.map((element) => (
                    <DraggableText
                      key={element.id}
                      element={element}
                      isSelected={selectedTextId === element.id}
                      onSelect={() => onTextSelect(element.id)}
                      onDrag={(id, delta) => onTextUpdate(id, { x: delta.x, y: delta.y })}
                      onTextChange={(id, text) => onTextUpdate(id, { text })}
                    />
                  ))}
                </div>
              </DndContext>
              <canvas
                ref={canvasRef}
                className="hidden"
                width={500}
                height={500}
              />
            </div>
            
            <div className="flex justify-between gap-4 max-w-[500px] mx-auto">
              <Button
                onClick={onTextAdd}
                variant="outline"
                className="flex-1 gap-2"
              >
                <Plus className="h-4 w-4" />
                Add Text
              </Button>
              <PreviewButton
                onClick={onGenerate}
                isGenerating={isGenerating}
                className="flex-1"
              />
            </div>
          </div>
          
          <div className="space-y-4 max-w-[500px] mx-auto w-full">
            <ScrollArea className="h-[600px] rounded-lg border-2 p-6 shadow-sm">
              {textElements.length === 0 ? (
                <div className="flex h-full items-center justify-center text-center text-muted-foreground">
                  <div className="space-y-4">
                    <Move className="mx-auto h-12 w-12 opacity-50" />
                    <p className="text-lg">
                      Add text elements and drag them to position
                    </p>
                    <Button
                      onClick={onTextAdd}
                      variant="outline"
                      className="gap-2"
                    >
                      <Plus className="h-4 w-4" />
                      Add Your First Text
                    </Button>
                  </div>
                </div>
              ) : (
                <div className="space-y-6">
                  {textElements.map((element) => (
                    <TextElementControls
                      key={element.id}
                      element={element}
                      onUpdate={(updates) => onTextUpdate(element.id, updates)}
                      onRemove={() => onTextRemove(element.id)}
                    />
                  ))}
                </div>
              )}
            </ScrollArea>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}