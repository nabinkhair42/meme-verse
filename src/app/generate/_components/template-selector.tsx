import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Skeleton } from "@/components/ui/skeleton";
import { MemeTemplate } from "@/types/meme";
import { motion } from "framer-motion";
import { TemplateCard } from "./template-card";
import { Search, ImageIcon } from "lucide-react";

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
    <div className="relative">
      <Skeleton className="h-40 w-full rounded-lg" />
      <div className="absolute inset-0 flex items-center justify-center">
        <ImageIcon className="h-10 w-10 text-muted-foreground/30" />
      </div>
    </div>
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
      <CardHeader className="space-y-4 pb-4">
        <CardTitle className="text-xl font-bold">Choose Template</CardTitle>
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search templates..."
            value={searchQuery}
            onChange={(e) => onSearchChange(e.target.value)}
            className="pl-9 text-sm"
          />
        </div>
        {searchQuery && (
          <p className="text-sm text-muted-foreground">
            {templates.length} templates found
          </p>
        )}
      </CardHeader>
      <CardContent className="p-4">
        <ScrollArea className="h-[calc(100vh-16rem)] pr-4">
          <motion.div
            variants={container}
            initial="hidden"
            animate="show"
            className="grid grid-cols-2 gap-3"
          >
            {isLoading ? (
              Array.from({ length: 6 }).map((_, i) => (
                <TemplateLoadingState key={i} />
              ))
            ) : templates.length === 0 ? (
              <div className="col-span-2 text-center py-8">
                <ImageIcon className="mx-auto h-12 w-12 text-muted-foreground/30 mb-3" />
                <h3 className="text-lg font-medium mb-2">No templates found</h3>
                <p className="text-sm text-muted-foreground">Try a different search term</p>
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