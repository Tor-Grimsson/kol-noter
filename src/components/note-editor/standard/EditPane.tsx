import { useRef, useEffect, useCallback } from "react";

interface EditPaneProps {
  content: string;
  onChange: (content: string) => void;
  showLineNumbers: boolean;
  textareaRef?: React.RefObject<HTMLTextAreaElement>;
  onSaveAttachment?: (filename: string, dataUrl: string) => void;
  onAddPhoto?: (name: string, dataUrl: string) => void;
}

export const EditPane = ({
  content,
  onChange,
  showLineNumbers,
  textareaRef: externalRef,
  onSaveAttachment,
  onAddPhoto,
}: EditPaneProps) => {
  const internalRef = useRef<HTMLTextAreaElement>(null);
  const textareaRef = externalRef || internalRef;
  const lineNumbersRef = useRef<HTMLDivElement>(null);
  const lines = content.split("\n");

  const handleScroll = useCallback(() => {
    if (textareaRef.current && lineNumbersRef.current) {
      lineNumbersRef.current.scrollTop = textareaRef.current.scrollTop;
    }
  }, [textareaRef]);

  useEffect(() => {
    const textarea = textareaRef.current;
    if (textarea) {
      textarea.addEventListener("scroll", handleScroll);
      return () => textarea.removeEventListener("scroll", handleScroll);
    }
  }, [handleScroll, textareaRef]);

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
            onChange(newContent);

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

          // Also add to photos for metadata
          if (onAddPhoto) {
            onAddPhoto(filename, reader.result as string);
          }
        };
        reader.readAsDataURL(file);
        break;
      }
    }
  }, [content, onChange, onSaveAttachment, onAddPhoto, textareaRef]);

  return (
    <div className="flex-1 flex overflow-hidden h-full">
      {/* Line Numbers */}
      {showLineNumbers && (
        <div
          ref={lineNumbersRef}
          className="flex-shrink-0 w-12 bg-muted/20 overflow-y-auto overflow-x-hidden select-none"
        >
          <div className="py-4 px-4 font-mono text-sm text-muted-foreground text-right leading-6">
            {lines.map((_, index) => (
              <div key={index} className="h-6">
                {index + 1}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Textarea */}
      <textarea
        ref={textareaRef}
        value={content}
        onChange={(e) => onChange(e.target.value)}
        onPaste={handlePaste}
        className={`flex-1 py-4 px-4 bg-transparent font-jetbrains text-sm resize-none focus:outline-none leading-6 overflow-auto ${
          showLineNumbers ? "whitespace-pre overflow-x-auto" : "whitespace-pre-wrap break-words"
        }`}
        placeholder="Start writing in markdown..."
        spellCheck={false}
      />
    </div>
  );
};
