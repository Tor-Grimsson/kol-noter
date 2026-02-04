import * as React from "react";
import {
  MoreHorizontal,
  Trash2,
  Edit2,
  Share2,
  ExternalLink,
  Copy,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { ItemMetrics, Attachment, Photo, VoiceRecording, SavedLink } from "@/store/notesStore";
import { MetadataSection } from "./sections/MetadataSection";
import { MetricsSection } from "./sections/MetricsSection";
import { MediaSection } from "./sections/MediaSection";
import { ConnectionsSection } from "./sections/ConnectionsSection";

export interface Contact {
  id: string;
  name: string;
  role?: string;
  email?: string;
  phone?: string;
  imageUrl?: string;
}

export interface UnifiedDetailPanelProps {
  // Item identification
  itemType: "note" | "project" | "system";
  itemId: string;
  itemName: string;
  itemDescription?: string;
  parentIds?: {
    systemId?: string;
    projectId?: string;
  };

  // Metadata
  type?: string;
  typeOptions?: string[];
  createdAt?: number;
  updatedAt?: number;
  size?: number;
  onUpdateName?: (name: string) => void;
  onUpdateDescription?: (description: string) => void;
  onUpdateType?: (type: string) => void;

  // Metrics
  metrics?: ItemMetrics;
  onUpdateMetrics?: (metrics: Partial<ItemMetrics>) => void;
  metricsCollapsed?: boolean;
  onToggleMetricsCollapse?: () => void;

  // Media
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

  // Connections
  tags?: string[];
  tagColors?: { [tagName: string]: string };
  links?: SavedLink[];
  contacts?: Contact[];
  aggregatedTags?: string[];
  onAddTag?: (tag: string) => void;
  onRemoveTag?: (tag: string) => void;
  onUpdateTagColor?: (tag: string, color: string) => void;
  onAddLink?: (url: string, title?: string) => void;
  onRemoveLink?: (linkId: string) => void;
  onUpdateLink?: (linkId: string, updates: Partial<SavedLink>) => void;
  onAddContact?: (contact: Omit<Contact, "id">) => void;
  onRemoveContact?: (contactId: string) => void;

  // Detail notes
  detailNotes?: string;
  onUpdateDetailNotes?: (notes: string) => void;

  // Actions
  onDelete?: () => void;
  onEdit?: () => void;
  onShare?: () => void;
  onDuplicate?: () => void;

  // Layout
  isBottomPanel?: boolean;
  onClose?: () => void;
  className?: string;
}

export function UnifiedDetailPanel({
  itemType,
  itemId,
  itemName,
  itemDescription,
  parentIds,
  type,
  typeOptions,
  createdAt,
  updatedAt,
  size,
  onUpdateName,
  onUpdateDescription,
  onUpdateType,
  metrics,
  onUpdateMetrics,
  metricsCollapsed = false,
  onToggleMetricsCollapse,
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
  tags = [],
  tagColors = {},
  links = [],
  contacts = [],
  aggregatedTags = [],
  onAddTag,
  onRemoveTag,
  onUpdateTagColor,
  onAddLink,
  onRemoveLink,
  onUpdateLink,
  onAddContact,
  onRemoveContact,
  detailNotes,
  onUpdateDetailNotes,
  onDelete,
  onEdit,
  onShare,
  onDuplicate,
  isBottomPanel = false,
  onClose,
  className,
}: UnifiedDetailPanelProps) {
  const [showDeleteDialog, setShowDeleteDialog] = React.useState(false);

  const handleDelete = () => {
    setShowDeleteDialog(false);
    onDelete?.();
  };

  if (isBottomPanel) {
    return (
      <div className={cn("space-y-3 p-2", className)}>
        {/* Header with name and actions */}
        <div className="flex items-center justify-between">
          <h2 className="text-sm font-medium truncate">{itemName}</h2>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="icon" className="h-6 w-6">
                <MoreHorizontal className="w-3 h-3" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              {onEdit && (
                <DropdownMenuItem onClick={onEdit}>
                  <Edit2 className="w-3 h-3 mr-2" /> Edit
                </DropdownMenuItem>
              )}
              {onShare && (
                <DropdownMenuItem onClick={onShare}>
                  <Share2 className="w-3 h-3 mr-2" /> Share
                </DropdownMenuItem>
              )}
              {onDuplicate && (
                <DropdownMenuItem onClick={onDuplicate}>
                  <Copy className="w-3 h-3 mr-2" /> Duplicate
                </DropdownMenuItem>
              )}
              <DropdownMenuSeparator />
              {onDelete && (
                <DropdownMenuItem
                  onClick={() => setShowDeleteDialog(true)}
                  className="text-destructive"
                >
                  <Trash2 className="w-3 h-3 mr-2" /> Delete
                </DropdownMenuItem>
              )}
            </DropdownMenuContent>
          </DropdownMenu>
        </div>

        {/* Metadata */}
        <MetadataSection
          name={itemName}
          description={itemDescription}
          type={type}
          typeOptions={typeOptions}
          createdAt={createdAt}
          updatedAt={updatedAt}
          size={size}
          onUpdateName={onUpdateName}
          onUpdateDescription={onUpdateDescription}
          onUpdateType={onUpdateType}
          isBottomPanel
        />

        {/* Metrics (collapsible) */}
        {onUpdateMetrics && (
          <MetricsSection
            metrics={metrics}
            onUpdateMetrics={onUpdateMetrics}
            collapsed={metricsCollapsed}
            onToggleCollapse={onToggleMetricsCollapse}
            isBottomPanel
          />
        )}

        {/* Media */}
        <MediaSection
          attachments={attachments}
          photos={photos}
          voiceRecordings={voiceRecordings}
          onAddAttachment={onAddAttachment}
          onRemoveAttachment={onRemoveAttachment}
          onAddPhoto={onAddPhoto}
          onRemovePhoto={onRemovePhoto}
          onAddVoiceRecording={onAddVoiceRecording}
          onRemoveVoiceRecording={onRemoveVoiceRecording}
          onPlayRecording={onPlayRecording}
          onDownloadFile={onDownloadFile}
          isBottomPanel
        />

        {/* Connections */}
        <ConnectionsSection
          tags={tags}
          tagColors={tagColors}
          links={links}
          contacts={contacts}
          aggregatedTags={aggregatedTags}
          onAddTag={onAddTag}
          onRemoveTag={onRemoveTag}
          onUpdateTagColor={onUpdateTagColor}
          onAddLink={onAddLink}
          onRemoveLink={onRemoveLink}
          onUpdateLink={onUpdateLink}
          onAddContact={onAddContact}
          onRemoveContact={onRemoveContact}
          isBottomPanel
        />

        {/* Delete Dialog */}
        <AlertDialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Delete {itemType}?</AlertDialogTitle>
              <AlertDialogDescription>
                This will permanently delete "{itemName}" and all its contents. This action cannot be undone.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>Cancel</AlertDialogCancel>
              <AlertDialogAction onClick={handleDelete}>Delete</AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </div>
    );
  }

  return (
    <div className={cn("space-y-6 p-4", className)}>
      {/* Header with name and actions */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <h2 className="text-xl font-semibold">{itemName}</h2>
          {type && (
            <span className="text-xs text-muted-foreground px-2 py-0.5 rounded bg-muted">
              {type}
            </span>
          )}
        </div>
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="outline" size="sm">
              <MoreHorizontal className="w-3 h-3 mr-1" /> Actions
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            {onEdit && (
              <DropdownMenuItem onClick={onEdit}>
                <Edit2 className="w-3 h-3 mr-2" /> Edit
              </DropdownMenuItem>
            )}
            {onShare && (
              <DropdownMenuItem onClick={onShare}>
                <Share2 className="w-3 h-3 mr-2" /> Share
              </DropdownMenuItem>
            )}
            {onDuplicate && (
              <DropdownMenuItem onClick={onDuplicate}>
                <Copy className="w-3 h-3 mr-2" /> Duplicate
              </DropdownMenuItem>
            )}
            <DropdownMenuSeparator />
            {onDelete && (
              <DropdownMenuItem
                onClick={() => setShowDeleteDialog(true)}
                className="text-destructive"
              >
                <Trash2 className="w-3 h-3 mr-2" /> Delete
              </DropdownMenuItem>
            )}
          </DropdownMenuContent>
        </DropdownMenu>
      </div>

      {/* Description */}
      {itemDescription && (
        <p className="text-sm text-muted-foreground">{itemDescription}</p>
      )}

      {/* Metadata */}
      <MetadataSection
        name={itemName}
        description={itemDescription}
        type={type}
        typeOptions={typeOptions}
        createdAt={createdAt}
        updatedAt={updatedAt}
        size={size}
        onUpdateName={onUpdateName}
        onUpdateDescription={onUpdateDescription}
        onUpdateType={onUpdateType}
      />

      {/* Metrics (collapsible) */}
      {onUpdateMetrics && (
        <MetricsSection
          metrics={metrics}
          onUpdateMetrics={onUpdateMetrics}
          collapsed={metricsCollapsed}
          onToggleCollapse={onToggleMetricsCollapse}
        />
      )}

      {/* Media */}
      <MediaSection
        attachments={attachments}
        photos={photos}
        voiceRecordings={voiceRecordings}
        onAddAttachment={onAddAttachment}
        onRemoveAttachment={onRemoveAttachment}
        onAddPhoto={onAddPhoto}
        onRemovePhoto={onRemovePhoto}
        onAddVoiceRecording={onAddVoiceRecording}
        onRemoveVoiceRecording={onRemoveVoiceRecording}
        onPlayRecording={onPlayRecording}
        onDownloadFile={onDownloadFile}
      />

      {/* Connections */}
      <ConnectionsSection
        tags={tags}
        tagColors={tagColors}
        links={links}
        contacts={contacts}
        aggregatedTags={aggregatedTags}
        onAddTag={onAddTag}
        onRemoveTag={onRemoveTag}
        onUpdateTagColor={onUpdateTagColor}
        onAddLink={onAddLink}
        onRemoveLink={onRemoveLink}
        onUpdateLink={onUpdateLink}
        onAddContact={onAddContact}
        onRemoveContact={onRemoveContact}
      />

      {/* Delete Dialog */}
      <AlertDialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete {itemType}?</AlertDialogTitle>
            <AlertDialogDescription>
              This will permanently delete "{itemName}" and all its contents. This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleDelete}>Delete</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
