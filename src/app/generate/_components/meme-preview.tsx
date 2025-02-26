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
            <div className="relative aspect-square max-w-[500px] mx-auto overflow-hidden rounded-lg border-2 shadow-lg">
              {generatedMeme ? (
                <Image
                  src={generatedMeme}
                  alt="Generated Meme"
                  fill
                  className="object-contain"
                />
              ) : (
                <div className="flex h-full items-center justify-center text-muted-foreground">
                  No preview available
                </div>
              )}
            </div>
            <div className="flex justify-between gap-4 max-w-[500px] mx-auto">
              <Button
                variant="outline"
                className="flex-1 gap-2"
                onClick={() => {
                  const link = document.createElement('a');
                  link.href = generatedMeme;
                  link.download = 'meme.jpg';
                  link.click();
                }}
              >
                <DownloadCloud className="h-4 w-4" />
                Download
              </Button>
              <Button
                variant="outline"
                className="flex-1 gap-2"
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
            <div className="space-y-4">
              <div>
                <Label htmlFor="title" className="text-lg">Title</Label>
                <Input
                  id="title"
                  value={title}
                  onChange={(e) => onTitleChange(e.target.value)}
                  placeholder="Give your meme a title"
                  className="text-lg"
                />
              </div>
              
              <div>
                <Label htmlFor="category" className="text-lg">Category</Label>
                <Select value={category} onValueChange={onCategoryChange}>
                  <SelectTrigger className="text-lg">
                    <SelectValue placeholder="Select a category" />
                  </SelectTrigger>
                  <SelectContent>
                    {CATEGORIES.map((cat: { value: string; label: string }) => (
                      <SelectItem key={cat.value} value={cat.value} className="text-lg">
                        {cat.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="flex items-center justify-between">
                <Label htmlFor="isPublic" className="text-lg">Make Public</Label>
                <Switch
                  id="isPublic"
                  checked={isPublic}
                  onCheckedChange={onIsPublicChange}
                />
              </div>
            </div>
            
            <Button
              size="lg"
              className="w-full text-lg"
              disabled={!title || isSaving}
              onClick={onSave}
            >
              {isSaving ? (
                <>
                  <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                  Saving...
                </>
              ) : (
                "Save Meme"
              )}
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  );
} 