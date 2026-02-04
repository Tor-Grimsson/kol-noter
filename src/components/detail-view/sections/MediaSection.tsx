import * as React from "react";
import {
  Paperclip,
  Image as ImageIcon,
  Mic,
  Plus,
  X,
  Eye,
  EyeOff,
} from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui-elements/atoms/Badge";
import { cn } from "@/lib/utils";
import {
  Attachment,
  Photo,
  VoiceRecording,
} from "@/store/notesStore";
import { SectionHeader } from "@/components/ui-elements/atoms/SectionHeader";
import { MediaItem, ImageThumbnail } from "@/components/ui-elements/molecules/MediaItem";
import {
  CELL_STYLE,
  GRID_LAYOUT,
  LABEL_STYLE,
  VALUE_STYLE,
  ICON_SIZE,
  ITEM_PADDING,
  RADIUS_CELL,
} from "../constants";

export interface MediaSectionProps {
  attachments?: Attachment[];
  photos?: Photo[];
  voiceRecordings?: VoiceRecording[];
  onAddAttachment?: (attachment: Omit<Attachment, "id" | "createdAt">) => void;
  onRemoveAttachment?: (attachmentId: string) => void;
  onAddPhoto?: (name: string, dataUrl: string) => void;
  onRemovePhoto?: (photoId: string) => void;
  onAddVoiceRecording?: (name: string, dataUrl: string, duration?: string) => void;
  onRemoveVoiceRecording?: (recordingId: string) => void;
  onPlayRecording?: (dataUrl: string) => void;
  onDownloadFile?: (dataUrl: string, filename: string) => void;
  isBottomPanel?: boolean;
  className?: string;
}

export function MediaSection({
  attachments = [],
  photos = [],
  voiceRecordings = [],
  onAddAttachment,
  onRemoveAttachment,
  onAddPhoto,
  onRemovePhoto,
  onAddVoiceRecording,
  onRemoveVoiceRecording,
  onPlayRecording,
  onDownloadFile,
  isBottomPanel = false,
  className,
}: MediaSectionProps) {
  const fileInputRef = React.useRef<HTMLInputElement>(null);
  const photoInputRef = React.useRef<HTMLInputElement>(null);
  const audioInputRef = React.useRef<HTMLInputElement>(null);
  const [showPhotoPreview, setShowPhotoPreview] = React.useState(false);

  const handleFileUpload = (
    e: React.ChangeEvent<HTMLInputElement>,
    type: "attachment" | "photo" | "audio"
  ) => {
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
        const isImage = file.type.startsWith("image/");
        onAddAttachment({
          type: isImage ? "image" : "file",
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

  const handlePlayAudio = (dataUrl: string) => {
    if (onPlayRecording) {
      onPlayRecording(dataUrl);
    } else {
      const audio = new Audio(dataUrl);
      audio.play();
    }
  };

  const handleDownload = (dataUrl: string, filename: string) => {
    if (onDownloadFile) {
      onDownloadFile(dataUrl, filename);
    } else {
      const link = document.createElement("a");
      link.href = dataUrl;
      link.download = filename;
      link.click();
    }
  };

  if (isBottomPanel) {
    return (
      <div className={cn("space-y-3", className)}>
        {/* Files */}
        {onAddAttachment && (
          <section>
            <SectionHeader
              title={`Files (${attachments.length})`}
              icon={<Paperclip className={ICON_SIZE} />}
              action={
                <Badge
                  variant="outline"
                  className="h-6 px-2 cursor-pointer hover:bg-white/5"
                  onClick={() => fileInputRef.current?.click()}
                >
                  <Plus className="w-3 h-3 mr-1" />Add
                </Badge>
              }
            />
            <input
              ref={fileInputRef}
              type="file"
              className="hidden"
              onChange={(e) => handleFileUpload(e, "attachment")}
            />
            {attachments.length > 0 ? (
              <div className="space-y-1 mt-1">
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
              <p className="text-xs text-muted-foreground mt-1">No files</p>
            )}
          </section>
        )}

        {/* Photos */}
        {onAddPhoto && (
          <section>
            <SectionHeader
              title={`Photos (${photos.length})`}
              icon={<ImageIcon className={ICON_SIZE} />}
              action={
                <Badge
                  variant="outline"
                  className="h-6 px-2 cursor-pointer hover:bg-white/5"
                  onClick={() => photoInputRef.current?.click()}
                >
                  <Plus className="w-3 h-3 mr-1" />Add
                </Badge>
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
              <div className="grid grid-cols-3 gap-x-4 gap-y-3 mt-1">
                {photos.map((photo) => (
                  <MediaItem
                    key={photo.id}
                    type="image"
                    name={photo.name}
                    url={photo.dataUrl}
                    onDownload={() => handleDownload(photo.dataUrl, photo.name)}
                    onDelete={onRemovePhoto ? () => onRemovePhoto(photo.id) : undefined}
                  />
                ))}
              </div>
            ) : (
              <p className="text-xs text-muted-foreground mt-1">No photos</p>
            )}
          </section>
        )}

        {/* Voice Recordings */}
        {onAddVoiceRecording && (
          <section>
            <SectionHeader
              title={`Recordings (${voiceRecordings.length})`}
              icon={<Mic className={ICON_SIZE} />}
              action={
                <Badge
                  variant="outline"
                  className="h-6 px-2 cursor-pointer hover:bg-white/5"
                  onClick={() => audioInputRef.current?.click()}
                >
                  <Plus className="w-3 h-3 mr-1" />Add
                </Badge>
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
              <div className="space-y-1 mt-1">
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
              <p className="text-xs text-muted-foreground mt-1">No recordings</p>
            )}
          </section>
        )}
      </div>
    );
  }

  return (
    <div className={cn("space-y-4", className)}>
      {/* Files */}
      {onAddAttachment && (
        <section>
          <SectionHeader
            title={`Files (${attachments.length})`}
            icon={<Paperclip className={ICON_SIZE} />}
            action={
              <Badge
                variant="outline"
                className="h-6 px-2 cursor-pointer hover:bg-white/5"
                onClick={() => fileInputRef.current?.click()}
              >
                <Plus className="w-3 h-3 mr-1" />Add
              </Badge>
            }
          />
          <input
            ref={fileInputRef}
            type="file"
            className="hidden"
            onChange={(e) => handleFileUpload(e, "attachment")}
          />
          {attachments.length > 0 ? (
            <div className="space-y-2 mt-2">
              {attachments.map((att) => (
                <MediaItem
                  key={att.id}
                  type={att.type === "image" ? "image" : "file"}
                  name={att.name}
                  url={att.url}
                  size={att.size}
                  onDownload={() => handleDownload(att.url, att.name)}
                  onDelete={onRemoveAttachment ? () => onRemoveAttachment(att.id) : undefined}
                />
              ))}
            </div>
          ) : (
            <p className="text-xs text-muted-foreground mt-2">No files attached</p>
          )}
        </section>
      )}

      {/* Photos */}
      {onAddPhoto && (
        <section>
          <SectionHeader
            title={`Photos (${photos.length})`}
            icon={<ImageIcon className={ICON_SIZE} />}
            action={
              <div className="flex items-center gap-1">
                <button
                  onClick={() => setShowPhotoPreview(!showPhotoPreview)}
                  className="p-1 hover:bg-white/5 rounded"
                >
                  {showPhotoPreview ? (
                    <EyeOff className="w-3 h-3 text-muted-foreground" />
                  ) : (
                    <ImageIcon className="w-3 h-3 text-muted-foreground" />
                  )}
                </button>
                <Badge
                  variant="outline"
                  className="h-6 px-2 cursor-pointer hover:bg-white/5"
                  onClick={() => photoInputRef.current?.click()}
                >
                  <Plus className="w-3 h-3 mr-1" />Add
                </Badge>
              </div>
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
            showPhotoPreview ? (
              <div className="grid grid-cols-3 gap-x-4 gap-y-3 mt-2">
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
              <div className="space-y-2 mt-2">
                {photos.map((photo) => (
                  <MediaItem
                    key={photo.id}
                    type="image"
                    name={photo.name}
                    url={photo.dataUrl}
                    onDownload={() => handleDownload(photo.dataUrl, photo.name)}
                    onDelete={onRemovePhoto ? () => onRemovePhoto(photo.id) : undefined}
                  />
                ))}
              </div>
            )
          ) : (
            <p className="text-xs text-muted-foreground mt-2">No photos</p>
          )}
        </section>
      )}

      {/* Voice Recordings */}
      {onAddVoiceRecording && (
        <section>
          <SectionHeader
            title={`Recordings (${voiceRecordings.length})`}
            icon={<Mic className={ICON_SIZE} />}
            action={
              <Badge
                variant="outline"
                className="h-6 px-2 cursor-pointer hover:bg-white/5"
                onClick={() => audioInputRef.current?.click()}
              >
                <Plus className="w-3 h-3 mr-1" />Add
              </Badge>
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
            <div className="space-y-2 mt-2">
              {voiceRecordings.map((rec) => (
                <MediaItem
                  key={rec.id}
                  type="recording"
                  name={rec.name}
                  url={rec.dataUrl}
                  duration={rec.duration}
                  onPlay={() => handlePlayAudio(rec.dataUrl)}
                  onDownload={() => handleDownload(rec.dataUrl, rec.name)}
                  onDelete={onRemoveVoiceRecording ? () => onRemoveVoiceRecording(rec.id) : undefined}
                />
              ))}
            </div>
          ) : (
            <p className="text-xs text-muted-foreground mt-2">No recordings</p>
          )}
        </section>
      )}
    </div>
  );
}
