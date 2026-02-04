import { useState, useRef } from "react";
import {
  Paperclip, Image as ImageIcon, FileText, Link as LinkIcon, Mic, Trash2,
  Plus, X, Play, Download, Edit2, ChevronDown, AlertCircle, Flag, CalendarDays, User, CheckCircle2
} from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { cn } from "@/lib/utils";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { TAG_COLOR_PRESETS, Photo, VoiceRecording, SavedLink, Attachment, ItemMetrics } from "@/store/notesStore";
import { SectionHeader } from "@/components/ui-elements/atoms/SectionHeader";
import { Hyperlink } from "@/components/ui-elements/atoms/Hyperlink";
import { Tag as TagComponent } from "@/components/ui-elements/atoms/Tag";
import { MediaItem, ImageThumbnail } from "@/components/ui-elements/molecules/MediaItem";

interface ItemMetadataPanelProps {
  itemType: "system" | "project";
  itemName: string;
  itemDescription?: string;
  createdAt?: number;
  updatedAt?: number;
  /** When true, layouts content in columns for bottom panel */
  isBottomPanel?: boolean;
  // Attachments
  attachments?: Attachment[];
  onAddAttachment?: (attachment: Omit<Attachment, 'id' | 'createdAt'>) => void;
  onRemoveAttachment?: (attachmentId: string) => void;
  // Photos
  photos?: Photo[];
  onAddPhoto?: (name: string, dataUrl: string) => void;
  onRemovePhoto?: (photoId: string) => void;
  // Voice recordings
  voiceRecordings?: VoiceRecording[];
  onAddVoiceRecording?: (name: string, dataUrl: string, duration?: string) => void;
  onRemoveVoiceRecording?: (recordingId: string) => void;
  // Links
  links?: SavedLink[];
  onAddLink?: (url: string, title?: string) => void;
  onRemoveLink?: (linkId: string) => void;
  onUpdateLink?: (linkId: string, updates: Partial<SavedLink>) => void;
  // Tags
  tags?: string[];
  tagColors?: { [tagName: string]: string };
  onAddTag?: (tag: string) => void;
  onRemoveTag?: (tag: string) => void;
  onUpdateTagColor?: (tag: string, color: string) => void;
  /** Tags aggregated from child items (notes) - displayed but not editable */
  aggregatedTags?: string[];
  // Detail notes
  detailNotes?: string;
  onUpdateDetailNotes?: (notes: string) => void;
  // Metrics
  metrics?: ItemMetrics;
  onUpdateMetrics?: (metrics: Partial<ItemMetrics>) => void;
  // Delete
  onDelete?: () => void;
}

export const ItemMetadataPanel = ({
  itemType,
  itemName,
  itemDescription,
  createdAt,
  updatedAt,
  isBottomPanel = false,
  attachments = [],
  onAddAttachment,
  onRemoveAttachment,
  photos = [],
  onAddPhoto,
  onRemovePhoto,
  voiceRecordings = [],
  onAddVoiceRecording,
  onRemoveVoiceRecording,
  links = [],
  onAddLink,
  onRemoveLink,
  onUpdateLink,
  tags = [],
  tagColors = {},
  onAddTag,
  onRemoveTag,
  onUpdateTagColor,
  aggregatedTags = [],
  detailNotes = "",
  onUpdateDetailNotes,
  metrics,
  onUpdateMetrics,
  onDelete,
}: ItemMetadataPanelProps) => {
  const [newLinkUrl, setNewLinkUrl] = useState("");
  const [newTagName, setNewTagName] = useState("");
  const [editingLinkId, setEditingLinkId] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const photoInputRef = useRef<HTMLInputElement>(null);
  const audioInputRef = useRef<HTMLInputElement>(null);

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>, type: "attachment" | "photo" | "audio") => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      const dataUrl = event.target?.result as string;
      if (type === "audio" && onAddVoiceRecording) {
        const audio = new Audio(dataUrl);
        audio.onloadedmetadata = () => {
          const minutes = Math.floor(audio.duration / 60);
          const seconds = Math.floor(audio.duration % 60);
          const duration = `${minutes}:${seconds.toString().padStart(2, "0")}`;
          onAddVoiceRecording(file.name, dataUrl, duration);
        };
      } else if (type === "photo" && onAddPhoto) {
        onAddPhoto(file.name, dataUrl);
      } else if (type === "attachment" && onAddAttachment) {
        const isImage = file.type.startsWith('image/');
        onAddAttachment({
          type: isImage ? 'image' : 'file',
          url: dataUrl,
          name: file.name,
          size: file.size,
          mimeType: file.type,
        });
      }
    };
    reader.readAsDataURL(file);
    e.target.value = "";
  };

  const handleDownload = (dataUrl: string, filename: string) => {
    const link = document.createElement("a");
    link.href = dataUrl;
    link.download = filename;
    link.click();
  };

  const handlePlayAudio = (dataUrl: string) => {
    const audio = new Audio(dataUrl);
    audio.play();
  };

  const handleAddLink = () => {
    if (newLinkUrl.trim() && onAddLink) {
      let url = newLinkUrl.trim();
      if (!url.startsWith('http://') && !url.startsWith('https://')) {
        url = 'https://' + url;
      }
      onAddLink(url);
      setNewLinkUrl("");
    }
  };

  const handleAddTag = () => {
    if (newTagName.trim() && onAddTag) {
      onAddTag(newTagName.trim().toLowerCase());
      setNewTagName("");
    }
  };

  // Bottom panel uses vertical grid layout
  const containerClass = isBottomPanel
    ? "grid grid-cols-4 gap-x-4 gap-y-3 p-2 auto-rows-min"
    : "space-y-4 p-4";

  const sectionClass = isBottomPanel ? "" : "";

  return (
    <div className={containerClass}>
      {/* Header with item info - spans 2 columns in bottom panel */}
      <section className={isBottomPanel ? "col-span-2" : ""}>
        <h2 className="text-sm font-medium mb-1">{itemName}</h2>
        {itemDescription && (
          <p className="text-xs text-muted-foreground line-clamp-2">{itemDescription}</p>
        )}
      </section>

      {/* Metadata - spans 2 columns in bottom panel */}
      <section className={isBottomPanel ? "col-span-2" : ""}>
        <SectionHeader
          title="Metadata"
          icon={<CalendarDays className="w-3 h-3" />}
        />
        <div className="grid grid-cols-2 gap-2 p-2 rounded-[4px] bg-[#1e1e24] text-xs">
          <div>
            <span className="text-muted-foreground">Created</span>
            <p>{createdAt ? new Date(createdAt).toLocaleDateString("en-US", {
              year: "numeric",
              month: "short",
              day: "numeric",
            }) : "N/A"}</p>
          </div>
          <div>
            <span className="text-muted-foreground">Modified</span>
            <p>{updatedAt ? new Date(updatedAt).toLocaleDateString("en-US", {
              year: "numeric",
              month: "short",
              day: "numeric",
            }) : "N/A"}</p>
          </div>
        </div>
      </section>

      {/* Attachments */}
      {onAddAttachment && (
        <section className={sectionClass}>
          <SectionHeader
            title="Files"
            icon={<Paperclip className="w-3 h-3" />}
            count={attachments.length}
            action={
              <Button variant="ghost" size="sm" className="h-6 text-xs" onClick={() => fileInputRef.current?.click()}>
                <Plus className="w-3 h-3 mr-1" /> Add
              </Button>
            }
          />
          <input
            ref={fileInputRef}
            type="file"
            className="hidden"
            onChange={(e) => handleFileUpload(e, "attachment")}
          />
          {attachments.length > 0 ? (
            <div className="space-y-1">
              {attachments.map((att) => (
                <MediaItem
                  key={att.id}
                  type={att.type === "image" ? "image" : "file"}
                  name={att.name}
                  url={att.url}
                  size={att.size}
                  compact
                  onDownload={() => handleDownload(att.url, att.name)}
                  onDelete={onRemoveAttachment ? () => onRemoveAttachment(att.id) : undefined}
                />
              ))}
            </div>
          ) : (
            <p className="text-xs text-muted-foreground">No files</p>
          )}
        </section>
      )}

      {/* Photos */}
      {onAddPhoto && (
        <section className={sectionClass}>
          <SectionHeader
            title="Photos"
            icon={<ImageIcon className="w-3 h-3" />}
            count={photos.length}
            action={
              <Button variant="ghost" size="sm" className="h-6 text-xs" onClick={() => photoInputRef.current?.click()}>
                <Plus className="w-3 h-3 mr-1" /> Add
              </Button>
            }
          />
          <input
            ref={photoInputRef}
            type="file"
            accept="image/*"
            className="hidden"
            onChange={(e) => handleFileUpload(e, "photo")}
          />
          {photos.length > 0 ? (
            <div className="grid grid-cols-3 gap-1">
              {photos.map((photo) => (
                <ImageThumbnail
                  key={photo.id}
                  id={photo.id}
                  name={photo.name}
                  dataUrl={photo.dataUrl}
                  onDownload={() => handleDownload(photo.dataUrl, photo.name)}
                  onDelete={onRemovePhoto ? () => onRemovePhoto(photo.id) : undefined}
                />
              ))}
            </div>
          ) : (
            <p className="text-xs text-muted-foreground">No photos</p>
          )}
        </section>
      )}

      {/* Voice Recordings */}
      {onAddVoiceRecording && (
        <section className={sectionClass}>
          <SectionHeader
            title="Recordings"
            icon={<Mic className="w-3 h-3" />}
            count={voiceRecordings.length}
            action={
              <Button variant="ghost" size="sm" className="h-6 text-xs" onClick={() => audioInputRef.current?.click()}>
                <Plus className="w-3 h-3 mr-1" /> Add
              </Button>
            }
          />
          <input
            ref={audioInputRef}
            type="file"
            accept="audio/*"
            className="hidden"
            onChange={(e) => handleFileUpload(e, "audio")}
          />
          {voiceRecordings.length > 0 ? (
            <div className="space-y-1">
              {voiceRecordings.map((rec) => (
                <MediaItem
                  key={rec.id}
                  type="recording"
                  name={rec.name}
                  url={rec.dataUrl}
                  duration={rec.duration}
                  compact
                  onPlay={() => handlePlayAudio(rec.dataUrl)}
                  onDownload={() => handleDownload(rec.dataUrl, rec.name)}
                  onDelete={onRemoveVoiceRecording ? () => onRemoveVoiceRecording(rec.id) : undefined}
                />
              ))}
            </div>
          ) : (
            <p className="text-xs text-muted-foreground">No recordings</p>
          )}
        </section>
      )}

      {/* Links */}
      {onAddLink && (
        <section className={sectionClass}>
          <SectionHeader
            title="Links"
            icon={<LinkIcon className="w-3 h-3" />}
            count={links.length}
          />
          {links.length > 0 && (
            <div className="space-y-1 mb-2">
              {links.map((link) => (
                <div key={link.id} className="flex items-center justify-between p-1.5 rounded-[4px] bg-[#1e1e24] group text-xs">
                  <div className="flex items-center gap-2 min-w-0 flex-1">
                    <LinkIcon className="w-3 h-3 shrink-0" />
                    {editingLinkId === link.id ? (
                      <Input
                        value={link.title || link.url}
                        onChange={(e) => onUpdateLink?.(link.id, { title: e.target.value })}
                        onBlur={() => setEditingLinkId(null)}
                        onKeyDown={(e) => e.key === "Enter" && setEditingLinkId(null)}
                        className="h-5 text-xs"
                        autoFocus
                      />
                    ) : (
                      <Hyperlink
                        href={link.url}
                        title={link.title}
                        showIcon={false}
                        onEdit={onUpdateLink ? () => setEditingLinkId(link.id) : undefined}
                        onDelete={onRemoveLink ? () => onRemoveLink(link.id) : undefined}
                      />
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
          <div className="flex gap-1">
            <Input
              placeholder="https://..."
              value={newLinkUrl}
              onChange={(e) => setNewLinkUrl(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && handleAddLink()}
              className="h-6 text-xs"
            />
            <Button size="sm" className="h-6 text-xs" onClick={handleAddLink} disabled={!newLinkUrl.trim()}>
              Add
            </Button>
          </div>
        </section>
      )}

      {/* Tags */}
      {onAddTag && (
        <section className={sectionClass}>
          <SectionHeader
            title="Tags"
            icon={<TagComponent className="w-3 h-3" />}
          />
          {(tags.length > 0 || aggregatedTags.length > 0) && (
            <div className="flex flex-wrap gap-1 mb-2">
              {tags.map((tag) => (
                <TagComponent
                  key={tag}
                  label={tag}
                  color={tagColors[tag]}
                  size="sm"
                  removable={!!onRemoveTag}
                  onRemove={onRemoveTag ? () => onRemoveTag(tag) : undefined}
                  showColorPicker={!!onUpdateTagColor}
                  onColorChange={onUpdateTagColor ? (color) => onUpdateTagColor(tag, color) : undefined}
                />
              ))}
              {/* Separator between own and aggregated tags */}
              {tags.length > 0 && aggregatedTags.length > 0 && (
                <span className="text-muted-foreground text-xs self-center mx-1">|</span>
              )}
              {/* Aggregated tags from notes - read-only, dimmed */}
              {aggregatedTags.map((tag) => (
                <TagComponent
                  key={`agg-${tag}`}
                  label={tag}
                  color={tagColors[tag]}
                  size="sm"
                  variant="subtle"
                />
              ))}
            </div>
          )}
          <div className="flex gap-1">
            <Input
              placeholder="Add tag..."
              value={newTagName}
              onChange={(e) => setNewTagName(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && handleAddTag()}
              className="h-6 text-xs"
            />
            <Button size="sm" className="h-6 text-xs" onClick={handleAddTag} disabled={!newTagName.trim()}>
              Add
            </Button>
          </div>
        </section>
      )}

      {/* Notes */}
      {onUpdateDetailNotes && (
        <section className={sectionClass}>
          <SectionHeader
            title="Notes"
            icon={<FileText className="w-3 h-3" />}
          />
          <Textarea
            placeholder={`Notes about this ${itemType}...`}
            value={detailNotes}
            onChange={(e) => onUpdateDetailNotes(e.target.value)}
            className="min-h-[60px] text-xs"
          />
        </section>
      )}

      {/* Metrics */}
      {onUpdateMetrics && (
        <section className={sectionClass}>
          <SectionHeader
            title="Metrics"
            icon={<Flag className="w-3 h-3" />}
          />
          <div className={cn("grid gap-2", isBottomPanel ? "grid-cols-2" : "grid-cols-2")}>
            {/* Health */}
            <div className="relative">
              <select
                value={metrics?.health || ''}
                onChange={(e) => onUpdateMetrics({ health: e.target.value as any || undefined })}
                className="w-full h-8 px-2 text-xs bg-input border border-input-border rounded appearance-none cursor-pointer hover:bg-accent/50 transition-colors"
              >
                <option value="">Health</option>
                <option value="good">Good</option>
                <option value="warning">Warning</option>
                <option value="critical">Critical</option>
              </select>
              <AlertCircle className="absolute right-2 top-1/2 -translate-y-1/2 w-3 h-3 text-muted-foreground pointer-events-none" />
            </div>
            {/* Priority */}
            <div className="relative">
              <select
                value={metrics?.priority || ''}
                onChange={(e) => onUpdateMetrics({ priority: e.target.value as any || undefined })}
                className="w-full h-8 px-2 text-xs bg-input border border-input-border rounded appearance-none cursor-pointer hover:bg-accent/50 transition-colors"
              >
                <option value="">Priority</option>
                <option value="high">High</option>
                <option value="medium">Medium</option>
                <option value="low">Low</option>
              </select>
              <Flag className="absolute right-2 top-1/2 -translate-y-1/2 w-3 h-3 text-muted-foreground pointer-events-none" />
            </div>
            {/* Status */}
            <div className="relative">
              <select
                value={metrics?.status || ''}
                onChange={(e) => onUpdateMetrics({ status: e.target.value as any || undefined })}
                className="w-full h-8 px-2 text-xs bg-input border border-input-border rounded appearance-none cursor-pointer hover:bg-accent/50 transition-colors"
              >
                <option value="">Status</option>
                <option value="not_started">Not Started</option>
                <option value="in_progress">In Progress</option>
                <option value="done">Done</option>
                <option value="blocked">Blocked</option>
              </select>
              <CheckCircle2 className="absolute right-2 top-1/2 -translate-y-1/2 w-3 h-3 text-muted-foreground pointer-events-none" />
            </div>
            {/* Target Date */}
            <div className="relative">
              <input
                type="text"
                placeholder="Target Date"
                value={metrics?.targetDate || ''}
                onChange={(e) => onUpdateMetrics({ targetDate: e.target.value || undefined })}
                className="w-full h-8 px-2 text-xs bg-input border border-input-border rounded hover:bg-accent/50 transition-colors"
              />
              <CalendarDays className="absolute right-2 top-1/2 -translate-y-1/2 w-3 h-3 text-muted-foreground pointer-events-none" />
            </div>
          </div>
          {/* Lead on full width */}
          <div className="mt-2 relative">
            <input
              type="text"
              placeholder="Lead"
              value={metrics?.lead || ''}
              onChange={(e) => onUpdateMetrics({ lead: e.target.value || undefined })}
              className="w-full h-8 px-2 text-xs bg-input border border-input-border rounded hover:bg-accent/50 transition-colors"
            />
            <User className="absolute right-2 top-1/2 -translate-y-1/2 w-3 h-3 text-muted-foreground pointer-events-none" />
          </div>
        </section>
      )}

      {/* Danger Zone */}
      {onDelete && (
        <section className={cn("pt-3 border-t border-border", isBottomPanel && "border-t")}>
          <div className="flex items-center gap-2 mb-2">
            <Trash2 className="w-3 h-3 text-destructive" />
            <h3 className="text-xs font-medium text-destructive uppercase">Danger Zone</h3>
          </div>
          <AlertDialog>
            <AlertDialogTrigger asChild>
              <Button variant="outline" size="sm" className="w-full h-7 text-xs text-destructive">
                <Trash2 className="w-3 h-3 mr-1" />
                Delete {itemType}
              </Button>
            </AlertDialogTrigger>
            <AlertDialogContent>
              <AlertDialogHeader>
                <AlertDialogTitle>Delete {itemType}?</AlertDialogTitle>
                <AlertDialogDescription>
                  This will permanently delete "{itemName}" and all its contents. This action cannot be undone.
                </AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel>Cancel</AlertDialogCancel>
                <AlertDialogAction onClick={onDelete}>Delete</AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>
        </section>
      )}
    </div>
  );
};
