import React, { useRef, useState, useEffect } from 'react';
import { Button } from './button';
import { Eraser, Check } from 'lucide-react';

interface SignaturePadProps {
  onSignatureCapture: (signatureDataUrl: string) => void;
  width?: number;
  height?: number;
  label?: string;
  clearLabel?: string;
  doneLabel?: string;
}

export function SignaturePad({
  onSignatureCapture,
  width = 400,
  height = 200,
  label = "Please sign below",
  clearLabel = "Clear",
  doneLabel = "Done"
}: SignaturePadProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [isDrawing, setIsDrawing] = useState(false);
  const [hasSignature, setHasSignature] = useState(false);
  const [context, setContext] = useState<CanvasRenderingContext2D | null>(null);
  
  useEffect(() => {
    // Initialize canvas context
    const canvas = canvasRef.current;
    if (!canvas) return;
    
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    
    // Set up the canvas for drawing
    ctx.lineWidth = 2;
    ctx.lineCap = 'round';
    ctx.strokeStyle = '#000000';
    
    setContext(ctx);
    
    // Clear the canvas initially
    clearCanvas();
    
    // Handle window resize
    const handleResize = () => {
      if (ctx && canvas) {
        const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
        canvas.width = width;
        canvas.height = height;
        ctx.putImageData(imageData, 0, 0);
      }
    };
    
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, [width, height]);
  
  const clearCanvas = () => {
    if (!canvasRef.current || !context) return;
    context.clearRect(0, 0, canvasRef.current.width, canvasRef.current.height);
    setHasSignature(false);
  };
  
  const startDrawing = (e: React.MouseEvent<HTMLCanvasElement> | React.TouchEvent<HTMLCanvasElement>) => {
    if (!context) return;
    setIsDrawing(true);
    setHasSignature(true);
    
    // Get the correct position based on event type
    const pos = getEventPosition(e);
    
    context.beginPath();
    context.moveTo(pos.x, pos.y);
  };
  
  const draw = (e: React.MouseEvent<HTMLCanvasElement> | React.TouchEvent<HTMLCanvasElement>) => {
    if (!isDrawing || !context) return;
    
    // Prevent scrolling when drawing on touch devices
    if (e.type === 'touchmove') {
      e.preventDefault();
    }
    
    const pos = getEventPosition(e);
    
    context.lineTo(pos.x, pos.y);
    context.stroke();
    context.beginPath();
    context.moveTo(pos.x, pos.y);
  };
  
  const stopDrawing = () => {
    if (!isDrawing || !context) return;
    
    setIsDrawing(false);
    context.closePath();
  };
  
  const getEventPosition = (e: React.MouseEvent<HTMLCanvasElement> | React.TouchEvent<HTMLCanvasElement>) => {
    if (!canvasRef.current) {
      return { x: 0, y: 0 };
    }
    
    const rect = canvasRef.current.getBoundingClientRect();
    
    if ('touches' in e) {
      // Touch event
      return {
        x: e.touches[0].clientX - rect.left,
        y: e.touches[0].clientY - rect.top
      };
    } else {
      // Mouse event
      return {
        x: e.clientX - rect.left,
        y: e.clientY - rect.top
      };
    }
  };
  
  const handleDone = () => {
    if (!canvasRef.current) return;
    
    const dataUrl = canvasRef.current.toDataURL('image/png');
    onSignatureCapture(dataUrl);
  };
  
  return (
    <div className="space-y-4">
      {label && <div className="text-sm font-medium">{label}</div>}
      
      <div className="border border-gray-300 rounded">
        <canvas
          ref={canvasRef}
          width={width}
          height={height}
          onMouseDown={startDrawing}
          onMouseMove={draw}
          onMouseUp={stopDrawing}
          onMouseLeave={stopDrawing}
          onTouchStart={startDrawing}
          onTouchMove={draw}
          onTouchEnd={stopDrawing}
          className="touch-none w-full bg-white rounded"
          style={{ touchAction: 'none' }}
        />
      </div>
      
      <div className="flex gap-2 justify-end">
        <Button 
          variant="outline" 
          size="sm" 
          onClick={clearCanvas}
          type="button"
        >
          <Eraser className="mr-2 h-4 w-4" />
          {clearLabel}
        </Button>
        
        <Button 
          variant="default" 
          size="sm" 
          onClick={handleDone} 
          disabled={!hasSignature}
          type="button"
        >
          <Check className="mr-2 h-4 w-4" />
          {doneLabel}
        </Button>
      </div>
    </div>
  );
} 