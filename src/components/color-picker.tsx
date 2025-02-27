"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Copy, Check } from "lucide-react";
import { cn } from "@/lib/utils";

interface ColorPickerProps {
  color: string;
  onChange: (color: string) => void;
  label?: string;
}

// Predefined color presets
const colorPresets = [
  "#FF0000", "#FF4500", "#FFA500", "#FFD700", "#FFFF00",
  "#32CD32", "#008000", "#00FFFF", "#0000FF", "#4B0082",
  "#800080", "#FF69B4", "#FF1493", "#000000", "#808080",
  "#FFFFFF", "#F5F5F5", "#A0522D", "#DEB887", "#FFE4C4"
];

export default function ColorPicker({ color, onChange, label }: ColorPickerProps) {
  const [mounted, setMounted] = useState(false);
  const [colorHistory, setColorHistory] = useState<string[]>([]);
  const [copied, setCopied] = useState(false);
  const [rgbValues, setRgbValues] = useState({ r: 0, g: 0, b: 0 });
  
  // Convert hex to RGB on color change
  useEffect(() => {
    const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(color);
    if (result) {
      setRgbValues({
        r: parseInt(result[1], 16),
        g: parseInt(result[2], 16),
        b: parseInt(result[3], 16)
      });
    }
  }, [color]);

  // Only render on client side to prevent hydration mismatch
  useEffect(() => {
    setMounted(true);
    // Load color history from localStorage
    const savedHistory = localStorage.getItem('colorHistory');
    if (savedHistory) {
      setColorHistory(JSON.parse(savedHistory));
    }
  }, []);

  const handleColorChange = (newColor: string) => {
    onChange(newColor);
    // Add to history if it's a new color
    if (!colorHistory.includes(newColor)) {
      const newHistory = [newColor, ...colorHistory].slice(0, 10);
      setColorHistory(newHistory);
      localStorage.setItem('colorHistory', JSON.stringify(newHistory));
    }
  };

  const handleRgbChange = (channel: 'r' | 'g' | 'b', value: string) => {
    const numValue = Math.min(255, Math.max(0, parseInt(value) || 0));
    const newRgb = { ...rgbValues, [channel]: numValue };
    setRgbValues(newRgb);
    const newColor = '#' + 
      newRgb.r.toString(16).padStart(2, '0') +
      newRgb.g.toString(16).padStart(2, '0') +
      newRgb.b.toString(16).padStart(2, '0');
    handleColorChange(newColor.toUpperCase());
  };

  const copyToClipboard = async () => {
    await navigator.clipboard.writeText(color);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  if (!mounted) {
    return (
      <div className="w-full h-8 bg-muted animate-pulse rounded"></div>
    );
  }

  return (
    <div className="space-y-2">
      {label && <Label className="text-sm font-medium">{label}</Label>}
      <Popover>
        <PopoverTrigger asChild>
          <Button 
            variant="outline" 
            className="w-full justify-between group hover:shadow-md transition-all duration-200"
          >
            <div className="flex items-center gap-2">
              <div 
                className="w-6 h-6 rounded-md border shadow-sm" 
                style={{ backgroundColor: color }}
              />
              <span className="font-mono">{color}</span>
            </div>
            <Button
              variant="ghost"
              size="icon"
              className="h-6 w-6 opacity-0 group-hover:opacity-100 transition-opacity"
              onClick={(e) => {
                e.stopPropagation();
                copyToClipboard();
              }}
            >
              {copied ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
            </Button>
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-80" align="start">
          <div className="space-y-4">
            {/* Color preview */}
            <div 
              className="w-full h-24 rounded-lg shadow-inner border"
              style={{ backgroundColor: color }}
            />
            
            {/* Color input */}
            <div className="grid gap-2">
              <div className="flex gap-2">
                <Input
                  type="color"
                  value={color}
                  onChange={(e) => handleColorChange(e.target.value.toUpperCase())}
                  className="h-10 p-1 cursor-pointer"
                />
                <Input
                  type="text"
                  value={color}
                  onChange={(e) => handleColorChange(e.target.value.toUpperCase())}
                  className="font-mono"
                  maxLength={7}
                />
              </div>
              
              {/* RGB inputs */}
              <div className="grid grid-cols-3 gap-2">
                <div>
                  <Label className="text-xs">Red</Label>
                  <Input
                    type="number"
                    min="0"
                    max="255"
                    value={rgbValues.r}
                    onChange={(e) => handleRgbChange('r', e.target.value)}
                  />
                </div>
                <div>
                  <Label className="text-xs">Green</Label>
                  <Input
                    type="number"
                    min="0"
                    max="255"
                    value={rgbValues.g}
                    onChange={(e) => handleRgbChange('g', e.target.value)}
                  />
                </div>
                <div>
                  <Label className="text-xs">Blue</Label>
                  <Input
                    type="number"
                    min="0"
                    max="255"
                    value={rgbValues.b}
                    onChange={(e) => handleRgbChange('b', e.target.value)}
                  />
                </div>
              </div>
            </div>

            {/* Color presets */}
            <div className="space-y-2">
              <Label className="text-sm">Presets</Label>
              <div className="grid grid-cols-10 gap-1">
                {colorPresets.map((preset) => (
                  <button
                    key={preset}
                    className={cn(
                      "w-full aspect-square rounded-md border shadow-sm transition-all hover:scale-110",
                      color === preset && "ring-2 ring-primary ring-offset-2"
                    )}
                    style={{ backgroundColor: preset }}
                    onClick={() => handleColorChange(preset)}
                  />
                ))}
              </div>
            </div>

            {/* Color history */}
            {colorHistory.length > 0 && (
              <div className="space-y-2">
                <Label className="text-sm">Recent Colors</Label>
                <div className="grid grid-cols-10 gap-1">
                  {colorHistory.map((historyColor) => (
                    <button
                      key={historyColor}
                      className={cn(
                        "w-full aspect-square rounded-md border shadow-sm transition-all hover:scale-110",
                        color === historyColor && "ring-2 ring-primary ring-offset-2"
                      )}
                      style={{ backgroundColor: historyColor }}
                      onClick={() => handleColorChange(historyColor)}
                    />
                  ))}
                </div>
              </div>
            )}
          </div>
        </PopoverContent>
      </Popover>
    </div>
  );
} 