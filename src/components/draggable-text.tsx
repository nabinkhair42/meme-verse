"use client";

import { useEffect, useState } from "react";
import { Input } from "@/components/ui/input";
import { useDraggable } from "@dnd-kit/core";
import { motion } from "framer-motion";
import { ChevronRight, RotateCw } from "lucide-react";

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

interface DraggableTextProps {
  element: TextElement;
  isSelected: boolean;
  onSelect: () => void;
  onDrag: (id: string, delta: { x: number, y: number }) => void;
  onTextChange: (id: string, text: string) => void;
  onResize?: (id: string, fontSize: number) => void;
  onRotate?: (id: string, rotation: number) => void;
}

export default function DraggableText({
  element,
  isSelected,
  onSelect,
  onDrag,
  onTextChange,
  onResize,
  onRotate
}: DraggableTextProps) {
  const [mounted, setMounted] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [isDragging, setIsDragging] = useState(false);
  
  const { attributes, listeners, setNodeRef, transform } = useDraggable({
    id: element.id,
    data: {
      type: 'text',
      element
    }
  });
  
  useEffect(() => {
    setMounted(true);
  }, []);
  
  useEffect(() => {
    if (transform) {
      setIsDragging(true);
      // Call onDrag with the current transform delta
      onDrag(element.id, { x: transform.x, y: transform.y });
    } else if (isDragging) {
      setIsDragging(false);
    }
  }, [transform, element.id, onDrag, isDragging]);
  
  // Handle double click to enter edit mode
  const handleDoubleClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (isSelected) {
      setIsEditing(true);
    }
  };
  
  // Handle resize
  const handleResize = (e: React.MouseEvent, direction: string) => {
    e.stopPropagation();
    e.preventDefault();
    
    if (!onResize) return;
    
    // Increase/decrease font size based on direction
    const newSize = direction === 'increase' 
      ? element.fontSize + 2 
      : Math.max(12, element.fontSize - 2);
    
    onResize(element.id, newSize);
  };
  
  // Handle rotation
  const handleRotate = (e: React.MouseEvent) => {
    e.stopPropagation();
    e.preventDefault();
    
    if (!onRotate) return;
    
    // Rotate by 15 degrees
    const newRotation = (element.rotation + 15) % 360;
    onRotate(element.id, newRotation);
  };
  
  if (!mounted) {
    return (
      <div 
        style={{
          position: 'absolute',
          left: element.x,
          top: element.y,
          fontSize: `${element.fontSize}px`,
          color: element.color,
          WebkitTextStroke: `1px ${element.strokeColor}`,
          transform: `rotate(${element.rotation}deg)`,
          cursor: 'move',
          userSelect: 'none',
          padding: '4px',
          border: isSelected ? '1px dashed #3b82f6' : 'none',
          borderRadius: '4px',
          backgroundColor: isSelected ? 'rgba(59, 130, 246, 0.1)' : 'transparent',
          fontFamily: 'Impact, sans-serif',
          textAlign: 'center',
          width: 'auto',
          minWidth: '100px',
          maxWidth: '400px',
          textShadow: `2px 2px 0 ${element.strokeColor}, -2px -2px 0 ${element.strokeColor}, 2px -2px 0 ${element.strokeColor}, -2px 2px 0 ${element.strokeColor}`,
        }}
        className="animate-pulse"
      >
        {element.text}
      </div>
    );
  }
  
  const style = {
    position: 'absolute',
    left: element.x,
    top: element.y,
    fontSize: `${element.fontSize}px`,
    color: element.color,
    WebkitTextStroke: `1px ${element.strokeColor}`,
    transform: transform ? 
      `translate3d(${transform.x}px, ${transform.y}px, 0) rotate(${element.rotation}deg)` : 
      `rotate(${element.rotation}deg)`,
    cursor: isSelected ? 'move' : 'pointer',
    userSelect: 'none',
    padding: '8px',
    border: isSelected ? '2px dashed #3b82f6' : '1px dashed transparent',
    borderRadius: '6px',
    backgroundColor: isSelected ? 'rgba(59, 130, 246, 0.15)' : 'transparent',
    boxShadow: isSelected ? '0 0 0 4px rgba(59, 130, 246, 0.2), 0 4px 12px rgba(0, 0, 0, 0.1)' : 'none',
    transition: isDragging ? 'none' : 'box-shadow 0.3s, border 0.3s, background-color 0.3s, transform 0.2s',
    fontFamily: 'Impact, sans-serif',
    textAlign: 'center',
    width: 'auto',
    minWidth: '100px',
    maxWidth: '400px',
    textShadow: `2px 2px 0 ${element.strokeColor}, -2px -2px 0 ${element.strokeColor}, 2px -2px 0 ${element.strokeColor}, -2px 2px 0 ${element.strokeColor}`,
    zIndex: isSelected ? 10 : 1,
  } as React.CSSProperties;
  
  return (
    <motion.div 
      ref={setNodeRef}
      style={style}
      onClick={onSelect}
      onDoubleClick={handleDoubleClick}
      initial={{ opacity: 0, scale: 0.8 }}
      animate={{ opacity: 1, scale: 1 }}
      whileHover={{ scale: isSelected ? 1 : 1.02 }}
      whileTap={{ scale: 0.98 }}
      {...listeners}
      {...attributes}
    >
      {isSelected && isEditing ? (
        <Input
          value={element.text}
          onChange={(e) => onTextChange(element.id, e.target.value)}
          onClick={(e) => e.stopPropagation()}
          onBlur={() => setIsEditing(false)}
          autoFocus
          className="bg-transparent border-none focus:ring-2 focus:ring-primary p-0 text-inherit font-inherit"
          style={{
            fontSize: 'inherit',
            color: 'inherit',
            WebkitTextStroke: 'inherit',
            width: `${Math.max(element.text.length + 2, 10)}ch`,
            minWidth: '100px',
            textShadow: 'inherit',
            fontFamily: 'inherit',
            textAlign: 'center',
          }}
        />
      ) : (
        <>
          {element.text}
          
          {isSelected && (
            <div className="absolute -right-2 -bottom-2 flex flex-col gap-2">
              {/* Resize handle */}
              <button 
                className="bg-primary text-white rounded-full p-1 shadow-md hover:bg-primary/80 transition-colors"
                onClick={(e) => handleResize(e, 'increase')}
                title="Increase size"
              >
                <ChevronRight className="h-3 w-3" />
              </button>
              
              {/* Rotate handle */}
              <button 
                className="bg-primary text-white rounded-full p-1 shadow-md hover:bg-primary/80 transition-colors"
                onClick={handleRotate}
                title="Rotate text"
              >
                <RotateCw className="h-3 w-3" />
              </button>
            </div>
          )}
        </>
      )}
      
      {/* Size indicator tooltip */}
      {isSelected && !isEditing && (
        <div className="absolute -top-8 left-1/2 -translate-x-1/2 bg-black/70 text-white text-xs px-2 py-1 rounded pointer-events-none">
          {Math.round(element.fontSize)}px
        </div>
      )}
    </motion.div>
  );
}