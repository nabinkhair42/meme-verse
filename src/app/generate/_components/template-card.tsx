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
      className={`relative cursor-pointer rounded-lg border-2 p-2 transition-all hover:shadow-lg
        ${isSelected ? 'border-primary' : 'border-transparent'}`}
      onClick={onClick}
    >
      <div className="relative aspect-square overflow-hidden rounded-lg">
        <Image
          src={template.url}
          alt={template.name}
          fill
          className="object-cover"
          sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
          priority={isSelected}
          onError={(e) => {
            const img = e.currentTarget;
            img.src = "https://i.imgflip.com/30b1gx.jpg"; // Fallback image
            toast.error(`Failed to load template: ${template.name}`);
          }}
        />
      </div>
      <p className="mt-2 text-sm font-medium truncate">{template.name}</p>
    </motion.div>
  );
} 