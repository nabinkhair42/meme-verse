"use client";

import { useEffect, useState } from "react";
import { Input } from "@/components/ui/input";
import { useDraggable } from "@dnd-kit/core";

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
}

export default function DraggableText({
  element,
  isSelected,
  onSelect,
  onTextChange
}: DraggableTextProps) {
  const [mounted, setMounted] = useState(false);
  
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
    cursor: 'move',
    userSelect: 'none',
    padding: '4px',
    border: isSelected ? '2px dashed #3b82f6' : 'none',
    borderRadius: '4px',
    backgroundColor: isSelected ? 'rgba(59, 130, 246, 0.1)' : 'transparent',
    boxShadow: isSelected ? '0 0 0 4px rgba(59, 130, 246, 0.2)' : 'none',
    transition: 'box-shadow 0.2s, border 0.2s, background-color 0.2s',
    fontFamily: 'Impact, sans-serif',
    textAlign: 'center',
    width: 'auto',
    minWidth: '100px',
    maxWidth: '400px',
    textShadow: `2px 2px 0 ${element.strokeColor}, -2px -2px 0 ${element.strokeColor}, 2px -2px 0 ${element.strokeColor}, -2px 2px 0 ${element.strokeColor}`,
    zIndex: isSelected ? 10 : 1,
  } as React.CSSProperties;
  
  return (
    <div 
      ref={setNodeRef}
      style={style}
      onClick={onSelect}
      {...listeners}
      {...attributes}
    >
      {isSelected ? (
        <Input
          value={element.text}
          onChange={(e) => onTextChange(element.id, e.target.value)}
          onClick={(e) => e.stopPropagation()}
          className="bg-transparent border-none focus:ring-0 p-0 text-inherit font-inherit"
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
        element.text
      )}
    </div>
  );
} 