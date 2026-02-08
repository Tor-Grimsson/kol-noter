import { Button } from "@/components/ui-elements/atoms/Button";
import {
  Columns,
  Bold,
  Italic,
  Underline as UnderlineIcon,
  Code,
  List,
  Link,
  Image,
  Mic,
  FileCode,
} from "lucide-react";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
import { VoiceRecorder } from "./VoiceRecorder";
import type { Editor } from "@tiptap/react";

type ViewMode = "wysiwyg" | "source" | "split";

interface ToolbarProps {
  viewMode: ViewMode;
  onViewModeChange: (mode: ViewMode) => void;
  /** TipTap editor instance — when available, formatting buttons use editor commands */
  editor?: Editor | null;
  /** Fallback for source mode (raw textarea manipulation) */
  onInsertMarkdown?: (syntax: string, placeholder?: string) => void;
}

export const Toolbar = ({
  viewMode,
  onViewModeChange,
  editor,
  onInsertMarkdown,
}: ToolbarProps) => {
  const isSource = viewMode === "source";
  const hasEditor = !!editor && !isSource;

  const handleFormat = (syntax: string, placeholder?: string) => {
    if (hasEditor) {
      switch (syntax) {
        case "bold":
          editor!.chain().focus().toggleBold().run();
          break;
        case "italic":
          editor!.chain().focus().toggleItalic().run();
          break;
        case "underline":
          editor!.chain().focus().toggleUnderline().run();
          break;
        case "code":
          editor!.chain().focus().toggleCode().run();
          break;
        case "list":
          editor!.chain().focus().toggleBulletList().run();
          break;
        case "link": {
          if (editor!.isActive("link")) {
            editor!.chain().focus().unsetLink().run();
          } else {
            const url = window.prompt("URL:");
            if (url) {
              editor!.chain().focus().setLink({ href: url }).run();
            }
          }
          break;
        }
        case "image": {
          const src = window.prompt("Image URL:");
          if (src) {
            editor!.chain().focus().setImage({ src }).run();
          }
          break;
        }
      }
    } else if (onInsertMarkdown) {
      onInsertMarkdown(syntax, placeholder);
    }
  };

  const isActive = (name: string): boolean => {
    if (!hasEditor) return false;
    return editor!.isActive(name);
  };

  const handleSourceToggle = () => {
    if (viewMode === "source") {
      onViewModeChange("wysiwyg");
    } else if (viewMode === "wysiwyg") {
      onViewModeChange("source");
    } else {
      // In split mode, toggle back to wysiwyg
      onViewModeChange("source");
    }
  };

  const handleSplitToggle = () => {
    if (viewMode === "split") {
      onViewModeChange("wysiwyg");
    } else {
      onViewModeChange("split");
    }
  };

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

      {/* View Mode Toggles */}
      <Button
        variant={viewMode === "source" ? "secondary" : "ghost"}
        size="sm"
        onClick={handleSourceToggle}
        title="Source"
        className="h-8 w-8 p-0"
      >
        <FileCode className="w-4 h-4" />
      </Button>
      <Button
        variant={viewMode === "split" ? "secondary" : "ghost"}
        size="sm"
        onClick={handleSplitToggle}
        title="Split View"
        className="h-8 w-8 p-0"
      >
        <Columns className="w-4 h-4" />
      </Button>

      <div className="w-px h-6 mx-1 bg-border/30" />

      {/* Formatting Buttons */}
      <Button
        variant={isActive("bold") ? "secondary" : "ghost"}
        size="sm"
        onClick={() => handleFormat("bold", "bold text")}
        title="Bold"
        className="h-8 w-8 p-0"
      >
        <Bold className="w-4 h-4" />
      </Button>
      <Button
        variant={isActive("italic") ? "secondary" : "ghost"}
        size="sm"
        onClick={() => handleFormat("italic", "italic text")}
        title="Italic"
        className="h-8 w-8 p-0"
      >
        <Italic className="w-4 h-4" />
      </Button>
      <Button
        variant={isActive("underline") ? "secondary" : "ghost"}
        size="sm"
        onClick={() => handleFormat("underline", "underlined text")}
        title="Underline"
        className="h-8 w-8 p-0"
      >
        <UnderlineIcon className="w-4 h-4" />
      </Button>
      <Button
        variant={isActive("code") ? "secondary" : "ghost"}
        size="sm"
        onClick={() => handleFormat("code", "code")}
        title="Inline Code"
        className="h-8 w-8 p-0"
      >
        <Code className="w-4 h-4" />
      </Button>
      <Button
        variant={isActive("bulletList") ? "secondary" : "ghost"}
        size="sm"
        onClick={() => handleFormat("list", "list item")}
        title="List"
        className="h-8 w-8 p-0"
      >
        <List className="w-4 h-4" />
      </Button>
      <Button
        variant={isActive("link") ? "secondary" : "ghost"}
        size="sm"
        onClick={() => handleFormat("link", "link text")}
        title="Link"
        className="h-8 w-8 p-0"
      >
        <Link className="w-4 h-4" />
      </Button>
      <Button
        variant="ghost"
        size="sm"
        onClick={() => handleFormat("image", "alt text")}
        title="Image"
        className="h-8 w-8 p-0"
      >
        <Image className="w-4 h-4" />
      </Button>
    </div>
  );
};
