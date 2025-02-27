import Image from "next/image";
import { motion } from "framer-motion";
import { toast } from "sonner";
import { MemeTemplate } from "@/types/meme";

// Animation variants
const variants = {
  item: {
    hidden: { opacity: 0, y: 20 },
    show: { opacity: 1, y: 0 }
  }
};

interface TemplateCardProps {
  template: MemeTemplate;
  isSelected: boolean;
  onClick: () => void;
}

export function TemplateCard({ template, isSelected, onClick }: TemplateCardProps) {
  return (
    <motion.div
      variants={variants.item}
      className={`relative cursor-pointer rounded-lg border-2 p-2 transition-all duration-300
        ${isSelected 
          ? 'border-primary ring-2 ring-primary/20 bg-primary/5 shadow-md' 
          : 'border-border/40 hover:border-primary/40 hover:shadow-lg hover:bg-muted/30'}`}
      onClick={onClick}
      whileHover={{ scale: 1.02 }}
      whileTap={{ scale: 0.98 }}
    >
      <div className="relative aspect-square overflow-hidden rounded-lg bg-muted/50">
        {isSelected && (
          <div className="absolute top-2 right-2 z-10 bg-primary text-primary-foreground text-xs font-bold px-2 py-1 rounded-full shadow-sm">
            Selected
          </div>
        )}
        <Image
          src={template.url}
          alt={template.name}
          fill
          className={`object-contain transition-all duration-300 ${isSelected ? 'scale-105' : ''}`}
          sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
          priority={isSelected}
          onError={(e) => {
            const img = e.currentTarget;
            img.src = "https://i.imgflip.com/30b1gx.jpg"; // Fallback image
            toast.error(`Failed to load template: ${template.name}`);
          }}
        />
      </div>
      <div className="mt-2 flex flex-col">
        <p className="text-sm font-medium truncate">{template.name}</p>
        <p className="text-xs text-muted-foreground truncate">Click to select</p>
      </div>
    </motion.div>
  );
}