import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { CATEGORIES } from "@/redux/features/memes/memesSlice";
import { DownloadCloud, Loader2, Share2 } from "lucide-react";
import Image from "next/image";
import { toast } from "sonner";

interface MemePreviewProps {
  generatedMeme: string;
  title: string;
  category: string;
  isPublic: boolean;
  isSaving: boolean;
  onTitleChange: (value: string) => void;
  onCategoryChange: (value: string) => void;
  onIsPublicChange: (value: boolean) => void;
  onSave: () => void;
}

export function MemePreview({
  generatedMeme,
  title,
  category,
  isPublic,
  isSaving,
  onTitleChange,
  onCategoryChange,
  onIsPublicChange,
  onSave
}: MemePreviewProps) {
  return (
    <Card className="border-2">
      <CardHeader>
        <CardTitle className="text-2xl text-center">Preview & Save</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="grid gap-8 lg:grid-cols-2">
          <div className="space-y-6">
            <div className="relative aspect-square max-w-[500px] mx-auto overflow-hidden rounded-lg border-2 border-primary/20 shadow-lg bg-muted/10">
              {generatedMeme ? (
                <Image
                  src={generatedMeme}
                  alt="Generated Meme"
                  fill
                  className="object-contain"
                  priority
                />
              ) : (
                <div className="flex h-full items-center justify-center text-muted-foreground">
                  No preview available
                </div>
              )}
              <div className="absolute top-3 right-3 bg-background/80 backdrop-blur-sm rounded-full px-3 py-1 text-xs font-medium text-muted-foreground shadow-sm border border-border/40">
                Preview
              </div>
            </div>
            <div className="flex justify-between gap-4 max-w-[500px] mx-auto">
              <Button
                variant="outline"
                className="flex-1 gap-2 hover:bg-primary/10 transition-colors"
                onClick={() => {
                  const link = document.createElement('a');
                  link.href = generatedMeme;
                  link.download = 'meme.jpg';
                  link.click();
                  toast.success("Meme downloaded successfully!");
                }}
              >
                <DownloadCloud className="h-4 w-4" />
                Download
              </Button>
              <Button
                variant="outline"
                className="flex-1 gap-2 hover:bg-primary/10 transition-colors"
                onClick={() => {
                  navigator.clipboard.writeText(generatedMeme);
                  toast.success("Meme URL copied to clipboard!");
                }}
              >
                <Share2 className="h-4 w-4" />
                Share
              </Button>
            </div>
          </div>
          
          <div className="space-y-6 max-w-[500px] mx-auto w-full">
            <div className="space-y-5 bg-card rounded-lg border border-border/50 p-5 shadow-sm">
              <div>
                <Label htmlFor="title" className="text-base font-medium mb-1.5 block">Meme Title <span className="text-destructive">*</span></Label>
                <Input
                  id="title"
                  value={title}
                  onChange={(e) => onTitleChange(e.target.value)}
                  placeholder="Give your meme a catchy title"
                  className="text-base focus-visible:ring-primary/30"
                />
                {!title && <p className="text-xs text-muted-foreground mt-1">Title is required</p>}
              </div>
              
              <div>
                <Label htmlFor="category" className="text-base font-medium mb-1.5 block">Category <span className="text-destructive">*</span></Label>
                <Select value={category} onValueChange={onCategoryChange}>
                  <SelectTrigger id="category" className="focus-visible:ring-primary/30">
                    <SelectValue placeholder="Select a category" />
                  </SelectTrigger>
                  <SelectContent>
                    {CATEGORIES.map((cat: { value: string; label: string }) => (
                      <SelectItem key={cat.value} value={cat.value} className="text-base">
                        {cat.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              
              <div className="flex items-center space-x-3 bg-muted/30 p-3 rounded-md">
                <Switch
                  id="isPublic"
                  checked={isPublic}
                  onCheckedChange={onIsPublicChange}
                  className="data-[state=checked]:bg-primary"
                />
                <div>
                  <Label htmlFor="isPublic" className="text-base font-medium cursor-pointer">Make public</Label>
                  <p className="text-xs text-muted-foreground">Allow others to see and interact with your meme</p>
                </div>
              </div>
            </div>
            
            <Button
              onClick={onSave}
              disabled={!title || isSaving}
              className="w-full text-base py-6 bg-gradient-to-r from-primary to-primary/80 hover:from-primary/90 hover:to-primary transition-all duration-300"
              size="lg"
            >
              {isSaving ? (
                <>
                  <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                  Saving your meme...
                </>
              ) : (
                "Save & Share Your Meme"
              )}
            </Button>
            {!title && <p className="text-center text-sm text-muted-foreground">Please add a title to save your meme</p>}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}