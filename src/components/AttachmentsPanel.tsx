import { useState, useRef } from "react";
import { Upload, Link2, X, FileText, Image, ExternalLink } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Attachment } from "@/store/notesStore";
import { cn } from "@/lib/utils";

interface AttachmentsPanelProps {
  attachments: Attachment[];
  onAddAttachment: (attachment: Omit<Attachment, 'id' | 'createdAt'>) => void;
  onRemoveAttachment: (attachmentId: string) => void;
}

export const AttachmentsPanel = ({
  attachments,
  onAddAttachment,
  onRemoveAttachment,
}: AttachmentsPanelProps) => {
  const [linkUrl, setLinkUrl] = useState("");
  const [showLinkInput, setShowLinkInput] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files) return;

    Array.from(files).forEach(file => {
      const reader = new FileReader();
      reader.onload = () => {
        const result = reader.result as string;
        const isImage = file.type.startsWith('image/');
        onAddAttachment({
          type: isImage ? 'image' : 'file',
          url: result,
          name: file.name,
          size: file.size,
          mimeType: file.type,
        });
      };
      reader.readAsDataURL(file);
    });

    // Reset the input
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const handleAddLink = () => {
    if (!linkUrl.trim()) return;

    let url = linkUrl.trim();
    if (!url.startsWith('http://') && !url.startsWith('https://')) {
      url = 'https://' + url;
    }

    onAddAttachment({
      type: 'link',
      url,
      name: new URL(url).hostname,
    });

    setLinkUrl("");
    setShowLinkInput(false);
  };

  const getAttachmentIcon = (attachment: Attachment) => {
    if (attachment.type === 'image') return <Image className="w-4 h-4" />;
    if (attachment.type === 'link') return <Link2 className="w-4 h-4" />;
    return <FileText className="w-4 h-4" />;
  };

  const formatFileSize = (bytes?: number) => {
    if (!bytes) return '';
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  };

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-medium text-muted-foreground">Attachments</h3>
        <div className="flex gap-1">
          <Button
            variant="ghost"
            size="icon"
            className="h-6 w-6"
            onClick={() => fileInputRef.current?.click()}
            title="Upload file"
          >
            <Upload className="w-3 h-3" />
          </Button>
          <Button
            variant="ghost"
            size="icon"
            className="h-6 w-6"
            onClick={() => setShowLinkInput(!showLinkInput)}
            title="Add link"
          >
            <Link2 className="w-3 h-3" />
          </Button>
        </div>
      </div>

      <input
        ref={fileInputRef}
        type="file"
        multiple
        className="hidden"
        onChange={handleFileUpload}
        accept="image/*,.pdf,.doc,.docx,.txt,.md"
      />

      {showLinkInput && (
        <div className="flex gap-2">
          <Input
            placeholder="Enter URL..."
            value={linkUrl}
            onChange={(e) => setLinkUrl(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter') handleAddLink();
              if (e.key === 'Escape') setShowLinkInput(false);
            }}
            className="h-7 text-xs"
          />
          <Button size="sm" className="h-7" onClick={handleAddLink}>
            Add
          </Button>
        </div>
      )}

      {attachments.length === 0 ? (
        <p className="text-xs text-muted-foreground">No attachments</p>
      ) : (
        <div className="space-y-1">
          {attachments.map((attachment) => (
            <div
              key={attachment.id}
              className="group flex items-center gap-2 p-1.5 rounded bg-accent/30 hover:bg-accent/50 transition-colors"
            >
              {attachment.type === 'image' ? (
                <img
                  src={attachment.url}
                  alt={attachment.name}
                  className="w-8 h-8 rounded object-cover"
                />
              ) : (
                <div className="w-8 h-8 rounded bg-muted flex items-center justify-center">
                  {getAttachmentIcon(attachment)}
                </div>
              )}
              <div className="flex-1 min-w-0">
                <p className="text-xs font-medium truncate">{attachment.name}</p>
                <p className="text-[10px] text-muted-foreground">
                  {attachment.type === 'link' ? 'Link' : formatFileSize(attachment.size)}
                </p>
              </div>
              <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                {attachment.type === 'link' && (
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-5 w-5"
                    onClick={() => window.open(attachment.url, '_blank')}
                    title="Open link"
                  >
                    <ExternalLink className="w-3 h-3" />
                  </Button>
                )}
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-5 w-5 text-destructive hover:text-destructive"
                  onClick={() => onRemoveAttachment(attachment.id)}
                  title="Remove"
                >
                  <X className="w-3 h-3" />
                </Button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};
