import { useState, useRef, useEffect, useCallback } from "react";
import {
  ResizablePanelGroup,
  ResizablePanel,
  ResizableHandle,
} from "@/components/ui/resizable";
import { Toolbar } from "./Toolbar";
import { EditPane } from "./EditPane";
import { PreviewPane } from "./PreviewPane";

interface UnifiedMarkdownEditorProps {
  content?: string;
  onChange?: (content: string) => void;
  focusMode?: boolean;
  attachments?: { [filename: string]: string };
  photos?: Array<{ id: string; name: string; dataUrl: string; addedAt: number }>;
  onSaveAttachment?: (filename: string, dataUrl: string) => void;
  onAddPhoto?: (name: string, dataUrl: string) => void;
}

const defaultContent = `# Welcome to Unified Markdown Editor

This editor combines **editing** and **preview** in one seamless experience.

## Features

- **Edit mode**: Write markdown with live syntax styling
- **Preview mode**: See rendered output with beautiful typography
- **Split mode**: Side-by-side editing and preview

## Markdown Syntax

### Text Formatting

- **Bold text** with \`**text**\`
- *Italic text* with \`*text*\`
- \`Inline code\` with backticks

### Lists

1. Ordered lists
2. With numbers

- Unordered lists
- With dashes

### Code Blocks

\`\`\`javascript
function hello() {
  console.log("Hello, world!");
}
\`\`\`

### Links and Images

[Link text](https://example.com)

![Image alt text](image-url)

---

Start editing to see the magic!
`;

export const UnifiedMarkdownEditor = ({
  content: propContent,
  onChange,
  focusMode,
  attachments,
  photos,
  onSaveAttachment,
  onAddPhoto,
}: UnifiedMarkdownEditorProps) => {
  const [content, setContent] = useState(propContent ?? defaultContent);
  const [showPreview, setShowPreview] = useState(false);
  const [showSplit, setShowSplit] = useState(false);
  const [showLineNumbers, setShowLineNumbers] = useState(true);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const debounceRef = useRef<NodeJS.Timeout>();

  // Sync with prop changes (switching notes)
  useEffect(() => {
    if (propContent !== undefined) {
      setContent(propContent);
    }
  }, [propContent]);

  const handleContentChange = useCallback(
    (newContent: string) => {
      setContent(newContent);

      // Debounce save to avoid too many updates
      if (debounceRef.current) {
        clearTimeout(debounceRef.current);
      }
      debounceRef.current = setTimeout(() => {
        onChange?.(newContent);
      }, 500);
    },
    [onChange]
  );

  const insertMarkdown = useCallback(
    (syntax: string, placeholder = "") => {
      const textarea = textareaRef.current;
      if (!textarea) return;

      const start = textarea.selectionStart;
      const end = textarea.selectionEnd;
      const selectedText = content.substring(start, end) || placeholder;

      let newText = "";
      let cursorOffset = 0;

      switch (syntax) {
        case "bold":
          newText = `**${selectedText}**`;
          cursorOffset = 2;
          break;
        case "italic":
          newText = `*${selectedText}*`;
          cursorOffset = 1;
          break;
        case "code":
          newText = `\`${selectedText}\``;
          cursorOffset = 1;
          break;
        case "link":
          newText = `[${selectedText}](url)`;
          cursorOffset = 1;
          break;
        case "image":
          newText = `![${selectedText}](image-url)`;
          cursorOffset = 2;
          break;
        case "list":
          newText = `\n- ${selectedText}`;
          cursorOffset = 3;
          break;
      }

      const newContent =
        content.substring(0, start) + newText + content.substring(end);
      handleContentChange(newContent);

      // Restore focus and cursor position
      setTimeout(() => {
        textarea.focus();
        const newCursorPos = start + cursorOffset;
        textarea.setSelectionRange(
          newCursorPos,
          newCursorPos + selectedText.length
        );
      }, 0);
    },
    [content, handleContentChange]
  );

  const handleClickToEdit = useCallback(() => {
    setShowPreview(false);
    setTimeout(() => {
      textareaRef.current?.focus();
    }, 0);
  }, []);

  const renderContent = () => {
    // Split mode: show both side by side
    if (showSplit) {
      return (
        <ResizablePanelGroup direction="horizontal" className="flex-1 h-full">
          <ResizablePanel defaultSize={50} minSize={30} className="h-full">
            <EditPane
              content={content}
              onChange={handleContentChange}
              showLineNumbers={showLineNumbers}
              textareaRef={textareaRef}
              onSaveAttachment={onSaveAttachment}
              onAddPhoto={onAddPhoto}
            />
          </ResizablePanel>
          <ResizableHandle withHandle />
          <ResizablePanel defaultSize={50} minSize={30} className="h-full">
            <PreviewPane content={content} attachments={attachments} photos={photos} />
          </ResizablePanel>
        </ResizablePanelGroup>
      );
    }

    // Preview only
    if (showPreview) {
      return (
        <PreviewPane content={content} onClickToEdit={handleClickToEdit} attachments={attachments} photos={photos} />
      );
    }

    // Edit only (default)
    return (
      <EditPane
        content={content}
        onChange={handleContentChange}
        showLineNumbers={showLineNumbers}
        textareaRef={textareaRef}
        onSaveAttachment={onSaveAttachment}
        onAddPhoto={onAddPhoto}
      />
    );
  };

  return (
    <div
      className={`flex-1 flex flex-col overflow-hidden bg-background ${
        focusMode ? "px-12 py-12" : ""
      }`}
    >
      {!focusMode && (
        <Toolbar
          showPreview={showPreview}
          showSplit={showSplit}
          showLineNumbers={showLineNumbers}
          onPreviewToggle={() => setShowPreview(!showPreview)}
          onSplitToggle={() => setShowSplit(!showSplit)}
          onLineNumbersToggle={() => setShowLineNumbers(!showLineNumbers)}
          onInsertMarkdown={insertMarkdown}
        />
      )}
      {renderContent()}
    </div>
  );
};
