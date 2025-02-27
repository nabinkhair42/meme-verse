import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Skeleton } from "@/components/ui/skeleton";
import { MemeTemplate } from "@/types/meme";
import { motion } from "framer-motion";
import { TemplateCard } from "./template-card";
import { Search, ImageIcon, ChevronLeft, ChevronRight } from "lucide-react";
import { Button } from "@/components/ui/button";

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
    <Card className="border-2 shadow-sm bg-background/50 backdrop-blur-sm">
      <CardHeader className="space-y-6 pb-6">
        <CardTitle className="text-2xl md:text-3xl text-center font-bold">Choose Your Template</CardTitle>
        <div className="relative max-w-md mx-auto w-full">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
            <Input
              placeholder="Search templates..."
              value={searchQuery}
              onChange={(e) => onSearchChange(e.target.value)}
              className="pl-10 pr-4 py-2 text-base border-2 focus-visible:ring-primary/20 focus-visible:ring-offset-2 transition-all duration-200"
            />
          </div>
          {searchQuery && (
            <p className="mt-2 text-sm text-muted-foreground">
              {templates.length} templates found for "{searchQuery}"
            </p>
          )}
        </div>
      </CardHeader>
      <CardContent className="px-6 pb-6">
        <ScrollArea className="h-[550px] pr-4">
          <div className="flex justify-between mb-4">
            <Button 
              variant="outline" 
              size="sm" 
              onClick={() => {
                if (templates.length > 0) {
                  const currentIndex = selectedTemplate ? templates.findIndex(t => t.id === selectedTemplate.id) : -1;
                  const prevIndex = currentIndex > 0 ? currentIndex - 1 : templates.length - 1;
                  onSelectTemplate(templates[prevIndex]);
                }
              }}
              disabled={templates.length <= 1}
              className="flex items-center gap-1"
            >
              <ChevronLeft className="h-4 w-4" />
              Previous
            </Button>
            <Button 
              variant="outline" 
              size="sm" 
              onClick={() => {
                if (templates.length > 0) {
                  const currentIndex = selectedTemplate ? templates.findIndex(t => t.id === selectedTemplate.id) : -1;
                  const nextIndex = currentIndex < templates.length - 1 ? currentIndex + 1 : 0;
                  onSelectTemplate(templates[nextIndex]);
                }
              }}
              disabled={templates.length <= 1}
              className="flex items-center gap-1"
            >
              Next
              <ChevronRight className="h-4 w-4" />
            </Button>
          </div>
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
              <div className="col-span-full text-center py-12 px-4">
                <ImageIcon className="mx-auto h-16 w-16 text-muted-foreground/50 mb-4" />
                <h3 className="text-xl font-medium mb-2">No templates found</h3>
                <p className="text-muted-foreground mb-4">Try a different search term or browse our popular templates below.</p>
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