import { useState, useRef, useEffect, useCallback } from "react";
import {
  ResizablePanelGroup,
  ResizablePanel,
  ResizableHandle,
} from "@/components/ui/resizable";
import { Toolbar } from "./Toolbar";
import { EditPane } from "./EditPane";
import { WysiwygPane } from "./WysiwygPane";
import type { Editor } from "@tiptap/react";

type ViewMode = "wysiwyg" | "source" | "split";

interface UnifiedMarkdownEditorProps {
  content?: string;
  onChange?: (content: string) => void;
  focusMode?: boolean;
  attachments?: { [filename: string]: string };
  photos?: Array<{ id: string; name: string; dataUrl: string; addedAt: number }>;
  onSaveAttachment?: (filename: string, dataUrl: string) => void;
  onAddPhoto?: (name: string, dataUrl: string) => void;
  noteAssetBasePath?: string;
}

export const UnifiedMarkdownEditor = ({
  content: propContent,
  onChange,
  focusMode,
  attachments,
  photos,
  onSaveAttachment,
  onAddPhoto,
  noteAssetBasePath,
}: UnifiedMarkdownEditorProps) => {
  const [content, setContent] = useState(propContent ?? "");
  const [viewMode, setViewMode] = useState<ViewMode>("wysiwyg");
  const [tiptapEditor, setTiptapEditor] = useState<Editor | null>(null);
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

  // Source mode: insert markdown syntax around selection in textarea
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
        case "underline":
          newText = `<u>${selectedText}</u>`;
          cursorOffset = 3;
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

  const handleEditorReady = useCallback((editor: Editor) => {
    setTiptapEditor(editor);
  }, []);

  const renderContent = () => {
    // Split mode: source on left, WYSIWYG on right
    if (viewMode === "split") {
      return (
        <ResizablePanelGroup direction="horizontal" className="flex-1 h-full">
          <ResizablePanel defaultSize={50} minSize={30} className="h-full">
            <EditPane
              content={content}
              onChange={handleContentChange}
              showLineNumbers={true}
              textareaRef={textareaRef}
              onSaveAttachment={onSaveAttachment}
              onAddPhoto={onAddPhoto}
            />
          </ResizablePanel>
          <ResizableHandle withHandle />
          <ResizablePanel defaultSize={50} minSize={30} className="h-full">
            <WysiwygPane
              content={content}
              onChange={handleContentChange}
              attachments={attachments}
              photos={photos}
              onAddPhoto={onAddPhoto}
              noteAssetBasePath={noteAssetBasePath}
              onEditorReady={handleEditorReady}
            />
          </ResizablePanel>
        </ResizablePanelGroup>
      );
    }

    // Source mode: raw markdown textarea
    if (viewMode === "source") {
      return (
        <EditPane
          content={content}
          onChange={handleContentChange}
          showLineNumbers={true}
          textareaRef={textareaRef}
          onSaveAttachment={onSaveAttachment}
          onAddPhoto={onAddPhoto}
        />
      );
    }

    // WYSIWYG mode (default)
    return (
      <WysiwygPane
        content={content}
        onChange={handleContentChange}
        attachments={attachments}
        photos={photos}
        onAddPhoto={onAddPhoto}
        noteAssetBasePath={noteAssetBasePath}
        onEditorReady={handleEditorReady}
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
          viewMode={viewMode}
          onViewModeChange={setViewMode}
          editor={tiptapEditor}
          onInsertMarkdown={insertMarkdown}
        />
      )}
      {renderContent()}
    </div>
  );
};
