import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import { useMemo } from "react";

interface PreviewPaneProps {
  content: string;
  onClickToEdit?: () => void;
  attachments?: { [filename: string]: string };
  photos?: Array<{ id: string; name: string; dataUrl: string; addedAt: number }>;
}

// Custom component to render Obsidian-style image embeds: ![[filename]]
const ObsidianImage = ({
  filename,
  attachments,
  photos
}: {
  filename: string;
  attachments?: { [filename: string]: string };
  photos?: Array<{ id: string; name: string; dataUrl: string; addedAt: number }>;
}) => {
  // First check attachments (file-based storage in _assets folder)
  let src = attachments?.[filename];

  // Fall back to photos array (legacy storage as data URL)
  if (!src && photos) {
    const photo = photos.find(p => p.name === filename);
    src = photo?.dataUrl;
  }

  if (!src) {
    return (
      <span className="inline-block px-2 py-1 bg-muted rounded text-xs text-muted-foreground">
        Image not found: {filename}
      </span>
    );
  }
  return (
    <img
      src={src}
      alt={filename}
      className="rounded-lg shadow-md max-w-full my-4"
    />
  );
};

export const PreviewPane = ({ content, onClickToEdit, attachments, photos }: PreviewPaneProps) => {
  // Process content to replace ![[filename]] with placeholder markers
  // We'll split the content and render images inline
  const processedContent = useMemo(() => {
    const parts: Array<{ type: 'text' | 'image'; value: string }> = [];
    const regex = /!\[\[([^\]]+)\]\]/g;
    let lastIndex = 0;
    let match;

    while ((match = regex.exec(content)) !== null) {
      // Add text before the match
      if (match.index > lastIndex) {
        parts.push({ type: 'text', value: content.slice(lastIndex, match.index) });
      }
      // Add the image reference
      parts.push({ type: 'image', value: match[1] });
      lastIndex = regex.lastIndex;
    }

    // Add remaining text
    if (lastIndex < content.length) {
      parts.push({ type: 'text', value: content.slice(lastIndex) });
    }

    return parts;
  }, [content]);

  return (
    <div
      className="flex-1 h-full overflow-auto cursor-text"
      onClick={onClickToEdit}
    >
      <div className="p-6 max-w-3xl mx-auto">
        <article
          className="max-w-none text-foreground
            [&_h1]:text-3xl [&_h1]:font-bold [&_h1]:mb-4 [&_h1]:text-foreground
            [&_h2]:text-2xl [&_h2]:font-semibold [&_h2]:mb-3 [&_h2]:mt-6 [&_h2]:text-foreground
            [&_h3]:text-xl [&_h3]:font-semibold [&_h3]:mb-2 [&_h3]:mt-4 [&_h3]:text-foreground
            [&_h4]:text-lg [&_h4]:font-medium [&_h4]:mb-2 [&_h4]:mt-3 [&_h4]:text-foreground
            [&_p]:leading-7 [&_p]:mb-4 [&_p]:text-foreground
            [&_a]:text-primary [&_a]:no-underline hover:[&_a]:underline
            [&_code]:bg-muted [&_code]:px-1.5 [&_code]:py-0.5 [&_code]:rounded [&_code]:text-sm [&_code]:text-foreground [&_code]:font-jetbrains
            [&_pre]:bg-muted [&_pre]:p-4 [&_pre]:rounded [&_pre]:overflow-auto [&_pre]:font-jetbrains
            [&_blockquote]:border-l-4 [&_blockquote]:border-l-primary [&_blockquote]:bg-muted/30 [&_blockquote]:py-2 [&_blockquote]:px-4 [&_blockquote]:my-4
            [&_img]:rounded-lg [&_img]:shadow-md
            [&_ul]:my-2 [&_ul]:list-disc [&_ul]:pl-6
            [&_ol]:my-2 [&_ol]:list-decimal [&_ol]:pl-6
            [&_li]:my-1 [&_li]:text-foreground
            [&_hr]:border-border [&_hr]:my-6"
        >
          {processedContent.map((part, index) => {
            if (part.type === 'image') {
              return <ObsidianImage key={index} filename={part.value} attachments={attachments} photos={photos} />;
            }
            return <ReactMarkdown key={index} remarkPlugins={[remarkGfm]}>{part.value}</ReactMarkdown>;
          })}
        </article>
      </div>
    </div>
  );
};
