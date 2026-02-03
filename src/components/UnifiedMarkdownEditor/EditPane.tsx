import { useRef, useEffect, useCallback } from "react";

interface EditPaneProps {
  content: string;
  onChange: (content: string) => void;
  showLineNumbers: boolean;
  textareaRef?: React.RefObject<HTMLTextAreaElement>;
}

export const EditPane = ({
  content,
  onChange,
  showLineNumbers,
  textareaRef: externalRef,
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
        className={`flex-1 py-4 px-4 bg-transparent font-mono text-sm resize-none focus:outline-none leading-6 overflow-auto ${
          showLineNumbers ? "whitespace-pre overflow-x-auto" : "whitespace-pre-wrap break-words"
        }`}
        placeholder="Start writing in markdown..."
        spellCheck={false}
      />
    </div>
  );
};
