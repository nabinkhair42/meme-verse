"use client";

import { useState } from "react";
import { useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";

interface ColorPickerProps {
  color: string;
  onChange: (color: string) => void;
  label?: string;
}

export default function ColorPicker({ color, onChange, label }: ColorPickerProps) {
  const [mounted, setMounted] = useState(false);
  
  // Only render on client side to prevent hydration mismatch
  useEffect(() => {
    setMounted(true);
  }, []);
  
  if (!mounted) {
    return (
      <div className="w-full h-8 bg-muted animate-pulse rounded"></div>
    );
  }
  
  return (
    <div className="space-y-2">
      {label && <label className="text-sm font-medium">{label}</label>}
      <Popover>
        <PopoverTrigger asChild>
          <Button 
            variant="outline" 
            className="w-full justify-start"
          >
            <div className="w-4 h-4 mr-2 rounded-full" style={{ backgroundColor: color }} />
            {color}
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-auto p-0" align="start">
          <div className="p-3">
            <div 
              className="w-full h-6 mb-2 rounded" 
              style={{ backgroundColor: color }} 
            />
            <input
              type="color"
              value={color}
              onChange={(e) => onChange(e.target.value)}
              className="w-full"
            />
          </div>
        </PopoverContent>
      </Popover>
    </div>
  );
} 