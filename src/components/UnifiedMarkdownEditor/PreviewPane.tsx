import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";

interface PreviewPaneProps {
  content: string;
  onClickToEdit?: () => void;
}

export const PreviewPane = ({ content, onClickToEdit }: PreviewPaneProps) => {
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
            [&_code]:bg-muted [&_code]:px-1.5 [&_code]:py-0.5 [&_code]:rounded [&_code]:text-sm [&_code]:text-foreground
            [&_pre]:bg-muted [&_pre]:p-4 [&_pre]:rounded [&_pre]:overflow-auto
            [&_blockquote]:border-l-4 [&_blockquote]:border-l-primary [&_blockquote]:bg-muted/30 [&_blockquote]:py-2 [&_blockquote]:px-4 [&_blockquote]:my-4
            [&_img]:rounded-lg [&_img]:shadow-md
            [&_ul]:my-2 [&_ul]:list-disc [&_ul]:pl-6
            [&_ol]:my-2 [&_ol]:list-decimal [&_ol]:pl-6
            [&_li]:my-1 [&_li]:text-foreground
            [&_hr]:border-border [&_hr]:my-6"
        >
          <ReactMarkdown remarkPlugins={[remarkGfm]}>{content}</ReactMarkdown>
        </article>
      </div>
    </div>
  );
};
