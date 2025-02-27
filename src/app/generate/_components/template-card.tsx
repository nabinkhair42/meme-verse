import Image from "next/image";
import { motion } from "framer-motion";
import { toast } from "sonner";
import { MemeTemplate } from "@/types/meme";
import { Check } from "lucide-react";

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
      className={`group relative cursor-pointer rounded-lg border transition-all duration-200
        ${isSelected 
          ? 'border-primary shadow-sm bg-primary/5' 
          : 'border-border hover:border-primary/50 hover:shadow-sm'}`}
      onClick={onClick}
      whileHover={{ scale: 1.02 }}
      whileTap={{ scale: 0.98 }}
      role="button"
      tabIndex={0}
      onKeyDown={(e) => {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault();
          onClick();
        }
      }}
    >
      <div className="relative aspect-square overflow-hidden rounded-md">
        {isSelected && (
          <div className="absolute inset-0 bg-primary/10 z-10 flex items-center justify-center">
            <div className="bg-primary text-primary-foreground rounded-full p-1">
              <Check className="h-4 w-4" />
            </div>
          </div>
        )}
        <Image
          src={template.url}
          alt={template.name}
          fill
          className="object-cover transition-all duration-200"
          sizes="(max-width: 768px) 50vw, 33vw"
          priority={isSelected}
          onError={(e) => {
            const img = e.currentTarget;
            img.src = "https://i.imgflip.com/30b1gx.jpg"; // Fallback image
            toast.error(`Failed to load template: ${template.name}`);
          }}
        />
      </div>
      <div className="p-2">
        <p className="text-sm font-medium truncate">{template.name}</p>
      </div>
    </motion.div>
  );
}