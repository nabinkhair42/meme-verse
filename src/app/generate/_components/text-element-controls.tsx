import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Slider } from "@/components/ui/slider";
import ColorPicker from "@/components/color-picker";
import { Trash2 } from "lucide-react";
import { TextElement } from "@/types/meme";

interface TextElementControlsProps {
  element: TextElement;
  onUpdate: (updates: Partial<TextElement>) => void;
  onRemove: () => void;
}

export function TextElementControls({ element, onUpdate, onRemove }: TextElementControlsProps) {
  return (
    <div className="space-y-5 rounded-lg border border-border/60 p-5 bg-card shadow-sm transition-all hover:shadow-md">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="bg-primary/20 text-primary rounded-full w-6 h-6 flex items-center justify-center font-medium text-sm">
            {element.text.charAt(0).toUpperCase() || 'T'}
          </div>
          <Label className="font-medium">Text Element</Label>
        </div>
        <Button
          variant="ghost"
          size="icon"
          onClick={onRemove}
          className="h-8 w-8 text-destructive hover:bg-destructive/10 hover:text-destructive transition-colors"
        >
          <Trash2 className="h-4 w-4" />
          <span className="sr-only">Remove text</span>
        </Button>
      </div>
      
      <div className="space-y-1.5">
        <Label className="text-sm text-muted-foreground">Content</Label>
        <Input
          value={element.text}
          onChange={(e) => onUpdate({ text: e.target.value })}
          placeholder="Enter text content"
          className="focus-visible:ring-primary/30"
        />
      </div>
      
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <Label className="text-sm text-muted-foreground">Font Size: {element.fontSize}px</Label>
          <div className="flex gap-1">
            <Button 
              size="icon" 
              variant="outline" 
              className="h-6 w-6" 
              onClick={() => onUpdate({ fontSize: Math.max(12, element.fontSize - 2) })}
            >
              <span>-</span>
            </Button>
            <Button 
              size="icon" 
              variant="outline" 
              className="h-6 w-6" 
              onClick={() => onUpdate({ fontSize: Math.min(72, element.fontSize + 2) })}
            >
              <span>+</span>
            </Button>
          </div>
        </div>
        <Slider
          value={[element.fontSize]}
          min={12}
          max={72}
          step={1}
          onValueChange={([value]) => onUpdate({ fontSize: value })}
          className="cursor-pointer"
        />
      </div>
      
      <div className="space-y-3">
        <Label className="text-sm text-muted-foreground">Colors</Label>
        <div className="grid grid-cols-2 gap-3">
          <div className="border rounded-md p-2 bg-background/50">
            <ColorPicker
              color={element.color}
              onChange={(color) => onUpdate({ color })}
              label="Text Color"
            />
          </div>
          <div className="border rounded-md p-2 bg-background/50">
            <ColorPicker
              color={element.strokeColor}
              onChange={(strokeColor) => onUpdate({ strokeColor })}
              label="Outline Color"
            />
          </div>
        </div>
      </div>
      
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <Label className="text-sm text-muted-foreground">Rotation: {element.rotation}°</Label>
          <Button 
            size="sm" 
            variant="outline" 
            className="h-7 text-xs" 
            onClick={() => onUpdate({ rotation: 0 })}
          >
            Reset
          </Button>
        </div>
        <Slider
          value={[element.rotation]}
          min={-180}
          max={180}
          step={5}
          onValueChange={([value]) => onUpdate({ rotation: value })}
          className="cursor-pointer"
        />
      </div>
    </div>
  );
}