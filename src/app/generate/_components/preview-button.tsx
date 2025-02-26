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
      className={className}
      disabled={isGenerating}
      size="lg"
    >
      {isGenerating ? (
        <>
          <Loader2 className="mr-2 h-5 w-5 animate-spin" />
          Generating...
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