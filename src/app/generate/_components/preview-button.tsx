import { Button } from "@/components/ui/button";
import { Loader2, Wand2 } from "lucide-react";

interface PreviewButtonProps {
  onClick: () => void;
  isGenerating: boolean;
  className?: string;
}

export function PreviewButton({ onClick, isGenerating, className }: PreviewButtonProps) {
  return (
    <Button 
      onClick={onClick} 
      className={`${className} bg-gradient-to-r from-primary to-primary/80 hover:from-primary/90 hover:to-primary transition-all duration-300`}
      disabled={isGenerating}
      size="lg"
    >
      {isGenerating ? (
        <>
          <Loader2 className="mr-2 h-5 w-5 animate-spin" />
          <span className="animate-pulse">Creating magic...</span>
        </>
      ) : (
        <>
          <Wand2 className="mr-2 h-5 w-5" />
          Generate Meme
        </>
      )}
    </Button>
  );
}