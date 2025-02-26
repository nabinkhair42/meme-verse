import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Skeleton } from "@/components/ui/skeleton";
import { MemeTemplate } from "@/types/meme";
import { motion } from "framer-motion";
import { TemplateCard } from "./template-card";

// Animation variants for container
const container = {
  hidden: { opacity: 0 },
  show: {
    opacity: 1,
    transition: {
      staggerChildren: 0.1
    }
  }
};

interface TemplateSelectorProps {
  templates: MemeTemplate[];
  selectedTemplate: MemeTemplate | null;
  isLoading: boolean;
  searchQuery: string;
  onSearchChange: (query: string) => void;
  onSelectTemplate: (template: MemeTemplate) => void;
}

// Loading state component
const TemplateLoadingState = () => (
  <div className="space-y-4 p-4">
    <Skeleton className="h-40 w-full rounded-lg" />
    <div className="space-y-2">
      <Skeleton className="h-4 w-3/4" />
      <Skeleton className="h-4 w-1/2" />
    </div>
  </div>
);

export function TemplateSelector({
  templates,
  selectedTemplate,
  isLoading,
  searchQuery,
  onSearchChange,
  onSelectTemplate
}: TemplateSelectorProps) {
  return (
    <Card className="border-2">
      <CardHeader className="space-y-4">
        <CardTitle className="text-2xl text-center">Choose Template</CardTitle>
        <Input
          placeholder="Search templates..."
          value={searchQuery}
          onChange={(e) => onSearchChange(e.target.value)}
          className="max-w-md mx-auto"
        />
      </CardHeader>
      <CardContent>
        <ScrollArea className="h-[500px] px-4">
          <motion.div
            variants={container}
            initial="hidden"
            animate="show"
            className="grid grid-cols-2 gap-6 sm:grid-cols-3 lg:grid-cols-4"
          >
            {isLoading ? (
              Array.from({ length: 8 }).map((_, i) => (
                <TemplateLoadingState key={i} />
              ))
            ) : templates.length === 0 ? (
              <div className="col-span-full text-center py-8 text-muted-foreground">
                No templates found. Try a different search term.
              </div>
            ) : (
              templates.map((template) => (
                <TemplateCard
                  key={template.id}
                  template={template}
                  isSelected={selectedTemplate?.id === template.id}
                  onClick={() => onSelectTemplate(template)}
                />
              ))
            )}
          </motion.div>
        </ScrollArea>
      </CardContent>
    </Card>
  );
} 