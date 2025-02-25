"use client";

import { useRef, useEffect } from "react";

interface CanvasProps {
  width: number;
  height: number;
  draw: (ctx: CanvasRenderingContext2D, frameCount: number) => void;
  className?: string;
}

export function Canvas({ width, height, draw, className }: CanvasProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    
    const context = canvas.getContext('2d');
    if (!context) return;
    
    let frameCount = 0;
    let animationFrameId: number;
    
    const render = () => {
      frameCount++;
      draw(context, frameCount);
      animationFrameId = window.requestAnimationFrame(render);
    };
    
    render();
    
    return () => {
      window.cancelAnimationFrame(animationFrameId);
    };
  }, [draw]);
  
  return (
    <canvas
      ref={canvasRef}
      width={width}
      height={height}
      className={className}
    />
  );
} 