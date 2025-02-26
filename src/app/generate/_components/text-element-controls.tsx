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
    <div className="space-y-4 rounded-lg border p-4">
      <div className="flex items-center justify-between">
        <Label>Text</Label>
        <Button
          variant="ghost"
          size="icon"
          onClick={onRemove}
          className="h-8 w-8 text-destructive"
        >
          <Trash2 className="h-4 w-4" />
          <span className="sr-only">Remove text</span>
        </Button>
      </div>
      
      <Input
        value={element.text}
        onChange={(e) => onUpdate({ text: e.target.value })}
        placeholder="Enter text"
      />
      
      <div className="space-y-2">
        <Label>Font Size</Label>
        <Slider
          value={[element.fontSize]}
          min={12}
          max={72}
          step={1}
          onValueChange={([value]) => onUpdate({ fontSize: value })}
        />
      </div>
      
      <div className="space-y-2">
        <Label>Colors</Label>
        <div className="flex gap-2">
          <ColorPicker
            color={element.color}
            onChange={(color) => onUpdate({ color })}
            label="Text Color"
          />
          <ColorPicker
            color={element.strokeColor}
            onChange={(strokeColor) => onUpdate({ strokeColor })}
            label="Outline Color"
          />
        </div>
      </div>
      
      <div className="space-y-2">
        <Label>Rotation</Label>
        <Slider
          value={[element.rotation]}
          min={-180}
          max={180}
          step={5}
          onValueChange={([value]) => onUpdate({ rotation: value })}
        />
      </div>
    </div>
  );
} 