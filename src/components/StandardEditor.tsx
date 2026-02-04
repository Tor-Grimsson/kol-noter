import { useState, useEffect, useRef, useCallback } from "react";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Bold, Italic, List, Code, Image, Link, Mic } from "lucide-react";
import { VoiceRecorder } from "@/components/VoiceRecorder";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";

interface StandardEditorProps {
  content?: string;
  onChange?: (content: string) => void;
  focusMode?: boolean;
  onSaveAttachment?: (filename: string, dataUrl: string) => void;
}

const defaultContent = `# Welcome to Standard Editor

This is a **markdown-based editor** where you can write with familiar markdown syntax.

## Features

- **Bold text** with \`**text**\`
- *Italic text* with \`*text*\`
- Lists with \`-\` or \`1.\`
- Code blocks with triple backticks
- Links with \`[text](url)\`

## Getting Started

Start typing to create your document. Use the toolbar above for quick formatting options.
`;

export const StandardEditor = ({ content: propContent, onChange, focusMode, onSaveAttachment }: StandardEditorProps) => {
  const [content, setContent] = useState(propContent || defaultContent);
  const debounceRef = useRef<NodeJS.Timeout>();
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  // Sync with prop changes (switching notes)
  useEffect(() => {
    if (propContent !== undefined) {
      setContent(propContent);
    }
  }, [propContent]);

  const handleContentChange = (newContent: string) => {
    setContent(newContent);

    // Debounce save to avoid too many updates
    if (debounceRef.current) {
      clearTimeout(debounceRef.current);
    }
    debounceRef.current = setTimeout(() => {
      onChange?.(newContent);
    }, 500);
  };

  const handlePaste = useCallback((e: React.ClipboardEvent<HTMLTextAreaElement>) => {
    const items = e.clipboardData.items;
    for (let i = 0; i < items.length; i++) {
      const item = items[i];
      if (item.type.startsWith('image/')) {
        e.preventDefault();
        const file = item.getAsFile();
        if (!file) return;

        const reader = new FileReader();
        reader.onload = () => {
          const now = new Date();
          const timestamp = now.getFullYear().toString() +
            String(now.getMonth() + 1).padStart(2, '0') +
            String(now.getDate()).padStart(2, '0') +
            String(now.getHours()).padStart(2, '0') +
            String(now.getMinutes()).padStart(2, '0') +
            String(now.getSeconds()).padStart(2, '0');
          const filename = `Pasted image ${timestamp}.png`;

          // Insert the image syntax at cursor position
          const textarea = textareaRef.current;
          if (textarea) {
            const start = textarea.selectionStart;
            const end = textarea.selectionEnd;
            const imageSyntax = `![[${filename}]]`;
            const newContent = content.substring(0, start) + imageSyntax + content.substring(end);
            handleContentChange(newContent);

            // Move cursor after inserted text
            setTimeout(() => {
              textarea.selectionStart = textarea.selectionEnd = start + imageSyntax.length;
              textarea.focus();
            }, 0);
          }

          // Save the attachment
          if (onSaveAttachment) {
            onSaveAttachment(filename, reader.result as string);
          }
        };
        reader.readAsDataURL(file);
        break;
      }
    }
  }, [content, onSaveAttachment]);

  const insertMarkdown = (syntax: string, placeholder = "") => {
    const textarea = document.querySelector('textarea');
    if (!textarea) return;
    
    const start = textarea.selectionStart;
    const end = textarea.selectionEnd;
    const selectedText = content.substring(start, end) || placeholder;
    
    let newText = "";
    switch (syntax) {
      case "bold":
        newText = `**${selectedText}**`;
        break;
      case "italic":
        newText = `*${selectedText}*`;
        break;
      case "code":
        newText = `\`${selectedText}\``;
        break;
      case "link":
        newText = `[${selectedText}](url)`;
        break;
      case "image":
        newText = `![${selectedText}](image-url)`;
        break;
      case "list":
        newText = `\n- ${selectedText}`;
        break;
    }
    
    const newContent = content.substring(0, start) + newText + content.substring(end);
    handleContentChange(newContent);
  };

  return (
    <div className={`flex-1 overflow-auto bg-background ${focusMode ? 'px-12 py-12' : ''}`}>
      {!focusMode && (
        <div className="sticky top-0 z-10 bg-card/80 backdrop-blur-sm border-b border-border px-6 py-3 flex gap-2">
          <Sheet>
            <SheetTrigger asChild>
              <Button
                variant="ghost"
                size="sm"
                title="Voice Memo"
              >
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

          <Button
            variant="ghost"
            size="sm"
            onClick={() => insertMarkdown("bold", "bold text")}
            title="Bold"
          >
            <Bold className="w-4 h-4" />
          </Button>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => insertMarkdown("italic", "italic text")}
            title="Italic"
          >
            <Italic className="w-4 h-4" />
          </Button>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => insertMarkdown("code", "code")}
            title="Code"
          >
            <Code className="w-4 h-4" />
          </Button>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => insertMarkdown("list", "list item")}
            title="List"
          >
            <List className="w-4 h-4" />
          </Button>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => insertMarkdown("link", "link text")}
            title="Link"
          >
            <Link className="w-4 h-4" />
          </Button>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => insertMarkdown("image", "alt text")}
            title="Image"
          >
            <Image className="w-4 h-4" />
          </Button>
        </div>
      )}
      
      <div className={focusMode ? '' : 'p-6'}>
        <Textarea
          ref={textareaRef}
          value={content}
          onChange={(e) => handleContentChange(e.target.value)}
          onPaste={handlePaste}
          className="w-full min-h-[calc(100vh-200px)] bg-transparent border-0 focus-visible:ring-0 font-jetbrains text-sm resize-none"
          placeholder="Start writing in markdown..."
        />
      </div>
    </div>
  );
};
