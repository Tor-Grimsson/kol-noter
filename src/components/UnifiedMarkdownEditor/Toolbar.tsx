import { Button } from "@/components/ui/button";
import {
  Eye,
  Columns,
  Hash,
  Bold,
  Italic,
  Code,
  List,
  Link,
  Image,
  Mic,
} from "lucide-react";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
import { VoiceRecorder } from "@/components/VoiceRecorder";

interface ToolbarProps {
  showPreview: boolean;
  showSplit: boolean;
  showLineNumbers: boolean;
  onPreviewToggle: () => void;
  onSplitToggle: () => void;
  onLineNumbersToggle: () => void;
  onInsertMarkdown: (syntax: string, placeholder?: string) => void;
}

export const Toolbar = ({
  showPreview,
  showSplit,
  showLineNumbers,
  onPreviewToggle,
  onSplitToggle,
  onLineNumbersToggle,
  onInsertMarkdown,
}: ToolbarProps) => {
  return (
    <div className="sticky top-0 z-10 bg-card/80 backdrop-blur-sm border-b border-border/50 px-4 py-2 flex items-center gap-1">
      {/* Voice Memo */}
      <Sheet>
        <SheetTrigger asChild>
          <Button variant="ghost" size="sm" title="Voice Memo" className="h-8 w-8 p-0">
            <Mic className="w-4 h-4" />
          </Button>
        </SheetTrigger>
        <SheetContent side="right" className="w-[400px] sm:w-[540px]">
          <SheetHeader>
            <SheetTitle>Voice Memos</SheetTitle>
            <SheetDescription>
              Record voice notes and memos for this document
            </SheetDescription>
          </SheetHeader>
          <div className="mt-6">
            <VoiceRecorder />
          </div>
        </SheetContent>
      </Sheet>

      <div className="w-px h-6 mx-1 bg-border/30" />

      {/* View Toggles */}
      <Button
        variant={showPreview ? "secondary" : "ghost"}
        size="sm"
        onClick={onPreviewToggle}
        title="Toggle Preview"
        className="h-8 w-8 p-0"
      >
        <Eye className="w-4 h-4" />
      </Button>
      <Button
        variant={showSplit ? "secondary" : "ghost"}
        size="sm"
        onClick={onSplitToggle}
        title="Toggle Split View"
        className="h-8 w-8 p-0"
      >
        <Columns className="w-4 h-4" />
      </Button>

      <div className="w-px h-6 mx-1 bg-border/30" />

      {/* Line Numbers Toggle */}
      <Button
        variant={showLineNumbers ? "secondary" : "ghost"}
        size="sm"
        onClick={onLineNumbersToggle}
        title="Toggle Line Numbers"
        className="h-8 w-8 p-0"
      >
        <Hash className="w-4 h-4" />
      </Button>

      <div className="w-px h-6 mx-1 bg-border/30" />

      {/* Formatting Buttons */}
      <Button
        variant="ghost"
        size="sm"
        onClick={() => onInsertMarkdown("bold", "bold text")}
        title="Bold"
        className="h-8 w-8 p-0"
        disabled={showPreview && !showSplit}
      >
        <Bold className="w-4 h-4" />
      </Button>
      <Button
        variant="ghost"
        size="sm"
        onClick={() => onInsertMarkdown("italic", "italic text")}
        title="Italic"
        className="h-8 w-8 p-0"
        disabled={showPreview && !showSplit}
      >
        <Italic className="w-4 h-4" />
      </Button>
      <Button
        variant="ghost"
        size="sm"
        onClick={() => onInsertMarkdown("code", "code")}
        title="Code"
        className="h-8 w-8 p-0"
        disabled={showPreview && !showSplit}
      >
        <Code className="w-4 h-4" />
      </Button>
      <Button
        variant="ghost"
        size="sm"
        onClick={() => onInsertMarkdown("list", "list item")}
        title="List"
        className="h-8 w-8 p-0"
        disabled={showPreview && !showSplit}
      >
        <List className="w-4 h-4" />
      </Button>
      <Button
        variant="ghost"
        size="sm"
        onClick={() => onInsertMarkdown("link", "link text")}
        title="Link"
        className="h-8 w-8 p-0"
        disabled={showPreview && !showSplit}
      >
        <Link className="w-4 h-4" />
      </Button>
      <Button
        variant="ghost"
        size="sm"
        onClick={() => onInsertMarkdown("image", "alt text")}
        title="Image"
        className="h-8 w-8 p-0"
        disabled={showPreview && !showSplit}
      >
        <Image className="w-4 h-4" />
      </Button>
    </div>
  );
};
