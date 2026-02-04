import { useState, useRef, useEffect } from "react";
import { useNotesStore, TAG_COLOR_PRESETS } from "@/store/notesStore";
import { Paperclip, Image as ImageIcon, FileText, Link as LinkIcon, Mic, Calendar, Tag, Trash2, Plus, X, Play, Download, Edit2, ChevronDown } from "lucide-react";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { OutlineButton } from "@/components/ui/outline-button";
import { Textarea } from "@/components/ui/textarea";
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
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

interface NoteDetailsViewProps {
  noteId: string;
  onClose?: () => void;
}

const CUSTOM_TYPE_OPTIONS = [
  "Work Document",
  "Personal",
  "Reference",
  "Meeting Notes",
  "Project Notes",
  "Documentation",
  "Idea",
  "Journal",
  "Other",
];

export const NoteDetailsView = ({ noteId, onClose }: NoteDetailsViewProps) => {
  const { getNote, updateNote, updateNoteDetailNotes, addNoteLink, removeNoteLink, updateNoteLink, addVoiceRecording, removeVoiceRecording, addNotePhoto, removeNotePhoto, updateNoteCustomType, addNoteTag, removeNoteTag, updateNoteTagColor, renameNoteTag } = useNotesStore();
  const note = getNote(noteId);

  const [isEditing, setIsEditing] = useState(false);
  const [editTitle, setEditTitle] = useState(note?.title || "");
  const [newLinkUrl, setNewLinkUrl] = useState("");
  const [newTagName, setNewTagName] = useState("");
  const [editingLinkTitle, setEditingLinkTitle] = useState<string | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const photoInputRef = useRef<HTMLInputElement>(null);
  const audioInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (note) {
      setEditTitle(note.title);
    }
  }, [note]);

  useEffect(() => {
    if (isEditing && inputRef.current) {
      inputRef.current.focus();
      inputRef.current.select();
    }
  }, [isEditing]);

  const handleFinishRename = () => {
    const trimmed = editTitle.trim();
    if (trimmed && note && trimmed !== note.title) {
      updateNote(noteId, { title: trimmed });
    }
    setIsEditing(false);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter") {
      handleFinishRename();
    } else if (e.key === "Escape") {
      setEditTitle(note?.title || "");
      setIsEditing(false);
    }
  };

  const formatDate = (timestamp: number) => {
    return new Date(timestamp).toLocaleDateString("en-US", {
      year: "numeric",
      month: "long",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  const formatRelativeDate = (timestamp: number) => {
    const diff = Date.now() - timestamp;
    const minutes = Math.floor(diff / 60000);
    const hours = Math.floor(diff / 3600000);
    const days = Math.floor(diff / 86400000);

    if (minutes < 1) return "Just now";
    if (minutes < 60) return `${minutes} minute${minutes > 1 ? "s" : ""} ago`;
    if (hours < 24) return `${hours} hour${hours > 1 ? "s" : ""} ago`;
    if (days < 7) return `${days} day${days > 1 ? "s" : ""} ago`;
    return formatDate(timestamp);
  };

  const handleAddLink = () => {
    if (newLinkUrl.trim()) {
      addNoteLink(noteId, newLinkUrl.trim());
      setNewLinkUrl("");
    }
  };

  const handleAddTag = () => {
    if (newTagName.trim()) {
      addNoteTag(noteId, newTagName.trim().toLowerCase());
      setNewTagName("");
    }
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>, type: "attachment" | "photo" | "audio") => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      const dataUrl = event.target?.result as string;
      if (type === "audio") {
        const audio = new Audio(dataUrl);
        audio.onloadedmetadata = () => {
          const minutes = Math.floor(audio.duration / 60);
          const seconds = Math.floor(audio.duration % 60);
          const duration = `${minutes}:${seconds.toString().padStart(2, "0")}`;
          addVoiceRecording(noteId, file.name, dataUrl, duration);
        };
      } else if (type === "photo") {
        addNotePhoto(noteId, file.name, dataUrl);
      } else {
        useNotesStore.getState().saveAttachment(noteId, file.name, dataUrl);
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

  if (!note) {
    return (
      <div className="flex-1 overflow-auto text-foreground" style={{ backgroundColor: "#18181B" }}>
        <div className="p-8 flex items-center justify-center h-full">
          <p className="text-sm text-muted-foreground">Note not found</p>
        </div>
      </div>
    );
  }

  const attachments = Object.entries(note.attachments || {});
  const photos = note.photos || [];
  const recordings = note.voiceRecordings || [];
  const links = note.links || [];
  const tags = note.tags || [];

  return (
    <div className="flex-1 overflow-auto text-foreground" style={{ backgroundColor: "#18181B" }}>
      <ScrollArea className="h-full">
        <div className="p-8 max-w-4xl mx-auto">
          {/* Title Section */}
          {isEditing ? (
            <Input
              ref={inputRef}
              value={editTitle}
              onChange={(e) => setEditTitle(e.target.value)}
              onBlur={handleFinishRename}
              onKeyDown={handleKeyDown}
              className="text-3xl font-bold mb-6 h-auto py-1 px-0 bg-transparent border-none focus-visible:ring-0 focus:ring-0 focus:outline-none"
            />
          ) : (
            <h1
              className="text-3xl font-bold mb-6 cursor-pointer"
              onClick={() => setIsEditing(true)}
              title="Click to rename"
            >
              {note.title}
            </h1>
          )}

          {/* Metadata Section */}
          <section className="mb-6">
            <div className="flex items-center justify-between gap-2 mb-3">
              <div className="flex items-center gap-2">
                <Calendar className="w-4 h-4 text-foreground" />
                <h2 className="text-sm font-semibold uppercase tracking-wider text-foreground">METADATA</h2>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-3 p-4 rounded-[4px] border border-input bg-[#121215]">
              <div>
                <label className="text-xs text-muted-foreground">Created</label>
                <p className="text-sm">{formatDate(note.createdAt)}</p>
              </div>
              <div>
                <label className="text-xs text-muted-foreground">Modified</label>
                <p className="text-sm">{formatRelativeDate(note.updatedAt)}</p>
              </div>
              <div className="col-span-2">
                <label className="text-xs text-muted-foreground">Type</label>
                <div className="mt-1">
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="ghost" size="sm" className="h-auto p-0 hover:bg-transparent">
                        <span className="text-sm">{note.customType || "Not set"}</span>
                        <ChevronDown className="w-3 h-3 ml-1" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent>
                      {CUSTOM_TYPE_OPTIONS.map((type) => (
                        <DropdownMenuItem
                          key={type}
                          onClick={() => updateNoteCustomType(noteId, type)}
                        >
                          {type}
                        </DropdownMenuItem>
                      ))}
                      <DropdownMenuSeparator />
                      <DropdownMenuItem onClick={() => updateNoteCustomType(noteId, "")}>
                        Clear
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </div>
              </div>
              <div>
                <label className="text-xs text-muted-foreground">Size</label>
                <p className="text-sm">
                  {attachments.length > 0 ? `${attachments.length} file(s)` : "No files"}
                </p>
              </div>
            </div>
          </section>

          {/* Attachments Section */}
          <section className="mb-6">
            <div className="flex items-center justify-between gap-2 mb-3">
              <div className="flex items-center gap-2">
                <Paperclip className="w-4 h-4 text-foreground" />
                <h2 className="text-sm font-semibold uppercase tracking-wider text-foreground">ATTACHMENTS ({attachments.length})</h2>
              </div>
              <OutlineButton onClick={() => fileInputRef.current?.click()}>
                Upload
              </OutlineButton>
              <input
                ref={fileInputRef}
                type="file"
                className="hidden"
                onChange={(e) => handleFileUpload(e, "attachment")}
              />
            </div>
            {attachments.length > 0 ? (
              <div className="space-y-2">
                {attachments.map(([filename, dataUrl]) => (
                  <div
                    key={filename}
                    className="flex items-center justify-between p-3 rounded-[4px] border border-input bg-[#121215] hover:bg-accent/50 transition-colors cursor-pointer group"
                  >
                    <div className="flex items-center gap-2 flex-1 min-w-0">
                      <FileText className="w-4 h-4 text-muted-foreground shrink-0" />
                      <div className="min-w-0">
                        <p className="text-sm font-medium truncate">{filename}</p>
                        <p className="text-xs text-muted-foreground">
                          Added {formatRelativeDate(note.updatedAt)}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={(e) => {
                          e.stopPropagation();
                          handleDownload(dataUrl, filename);
                        }}
                      >
                        <Download className="w-3 h-3" />
                      </Button>
                      <AlertDialog>
                        <AlertDialogTrigger asChild>
                          <Button variant="ghost" size="icon">
                            <Trash2 className="w-3 h-3" />
                          </Button>
                        </AlertDialogTrigger>
                        <AlertDialogContent>
                          <AlertDialogHeader>
                            <AlertDialogTitle>Delete attachment?</AlertDialogTitle>
                            <AlertDialogDescription>
                              This will permanently remove "{filename}" from this note.
                            </AlertDialogDescription>
                          </AlertDialogHeader>
                          <AlertDialogFooter>
                            <AlertDialogCancel>Cancel</AlertDialogCancel>
                            <AlertDialogAction
                              onClick={() => {
                                const newAttachments = { ...note.attachments };
                                delete newAttachments[filename];
                                updateNote(noteId, { attachments: newAttachments });
                              }}
                            >
                              Delete
                            </AlertDialogAction>
                          </AlertDialogFooter>
                        </AlertDialogContent>
                      </AlertDialog>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-sm text-muted-foreground">No attachments</p>
            )}
          </section>

          {/* Photos Section */}
          <section className="mb-6">
            <div className="flex items-center justify-between gap-2 mb-3">
              <div className="flex items-center gap-2">
                <ImageIcon className="w-4 h-4 text-foreground" />
                <h2 className="text-sm font-semibold uppercase tracking-wider text-foreground">PHOTOS ({photos.length})</h2>
              </div>
              <OutlineButton onClick={() => photoInputRef.current?.click()}>
                Upload
              </OutlineButton>
              <input
                ref={photoInputRef}
                type="file"
                accept="image/*"
                className="hidden"
                onChange={(e) => handleFileUpload(e, "photo")}
              />
            </div>
            {photos.length > 0 ? (
              <div className="grid grid-cols-4 gap-3">
                {photos.map((photo) => (
                  <div
                    key={photo.id}
                    className="relative aspect-square rounded-[4px] border border-input overflow-hidden group"
                  >
                    <img
                      src={photo.dataUrl}
                      alt={photo.name}
                      className="w-full h-full object-cover"
                    />
                    <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2">
                      <Button
                        variant="secondary"
                        size="icon"
                        className="w-7 h-7"
                        onClick={() => handleDownload(photo.dataUrl, photo.name)}
                      >
                        <Download className="w-3 h-3" />
                      </Button>
                      <AlertDialog>
                        <AlertDialogTrigger asChild>
                          <Button variant="destructive" size="icon" className="w-7 h-7">
                            <Trash2 className="w-3 h-3" />
                          </Button>
                        </AlertDialogTrigger>
                        <AlertDialogContent>
                          <AlertDialogHeader>
                            <AlertDialogTitle>Delete photo?</AlertDialogTitle>
                            <AlertDialogDescription>
                              This will permanently remove "{photo.name}" from this note.
                            </AlertDialogDescription>
                          </AlertDialogHeader>
                          <AlertDialogFooter>
                            <AlertDialogCancel>Cancel</AlertDialogCancel>
                            <AlertDialogAction
                              onClick={() => removeNotePhoto(noteId, photo.id)}
                            >
                              Delete
                            </AlertDialogAction>
                          </AlertDialogFooter>
                        </AlertDialogContent>
                      </AlertDialog>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-sm text-muted-foreground">No photos</p>
            )}
          </section>

          {/* Voice Recordings Section */}
          <section className="mb-6">
            <div className="flex items-center justify-between gap-2 mb-3">
              <div className="flex items-center gap-2">
                <Mic className="w-4 h-4 text-foreground" />
                <h2 className="text-sm font-semibold uppercase tracking-wider text-foreground">VOICE RECORDINGS ({recordings.length})</h2>
              </div>
              <OutlineButton onClick={() => audioInputRef.current?.click()}>
                Upload
              </OutlineButton>
              <input
                ref={audioInputRef}
                type="file"
                accept="audio/*"
                className="hidden"
                onChange={(e) => handleFileUpload(e, "audio")}
              />
            </div>
            {recordings.length > 0 ? (
              <div className="space-y-2">
                {recordings.map((recording) => (
                  <div
                    key={recording.id}
                    className="flex items-center justify-between p-3 rounded-[4px] border border-input bg-[#121215] hover:bg-accent/50 transition-colors group"
                  >
                    <div className="flex items-center gap-3 flex-1">
                      <Button
                        variant="ghost"
                        size="icon"
                        className="w-7 h-7"
                        onClick={() => handlePlayAudio(recording.dataUrl)}
                      >
                        <Play className="w-4 h-4" />
                      </Button>
                      <div>
                        <p className="text-sm font-medium">{recording.name}</p>
                        <p className="text-xs text-muted-foreground">
                          {formatRelativeDate(recording.addedAt)} {recording.duration && `• ${recording.duration}`}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                      <Button
                        variant="ghost"
                        size="icon"
                        className="w-7 h-7"
                        onClick={() => handleDownload(recording.dataUrl, recording.name)}
                      >
                        <Download className="w-3 h-3" />
                      </Button>
                      <AlertDialog>
                        <AlertDialogTrigger asChild>
                          <Button variant="ghost" size="icon" className="w-7 h-7">
                            <Trash2 className="w-3 h-3" />
                          </Button>
                        </AlertDialogTrigger>
                        <AlertDialogContent>
                          <AlertDialogHeader>
                            <AlertDialogTitle>Delete recording?</AlertDialogTitle>
                            <AlertDialogDescription>
                              This will permanently remove "{recording.name}" from this note.
                            </AlertDialogDescription>
                          </AlertDialogHeader>
                          <AlertDialogFooter>
                            <AlertDialogCancel>Cancel</AlertDialogCancel>
                            <AlertDialogAction
                              onClick={() => removeVoiceRecording(noteId, recording.id)}
                            >
                              Delete
                            </AlertDialogAction>
                          </AlertDialogFooter>
                        </AlertDialogContent>
                      </AlertDialog>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-sm text-muted-foreground">No voice recordings</p>
            )}
          </section>

          {/* Saved Links Section */}
          <section className="mb-6">
            <div className="flex items-center justify-between gap-2 mb-3">
              <div className="flex items-center gap-2">
                <LinkIcon className="w-4 h-4 text-foreground" />
                <h2 className="text-sm font-semibold uppercase tracking-wider text-foreground">SAVED LINKS ({links.length})</h2>
              </div>
            </div>
            {links.length > 0 ? (
              <div className="space-y-2 mb-3">
                {links.map((link) => (
                  <div
                    key={link.id}
                    className="flex items-center justify-between p-3 rounded-[4px] border border-input bg-[#121215] hover:bg-accent/50 transition-colors group"
                  >
                    <div className="flex items-center gap-3 flex-1 min-w-0">
                      <LinkIcon className="w-4 h-4 text-muted-foreground shrink-0" />
                      <div className="min-w-0 flex-1">
                        {editingLinkTitle === link.id ? (
                          <Input
                            value={link.title || link.url}
                            onChange={(e) => updateNoteLink(noteId, link.id, { title: e.target.value })}
                            onBlur={() => setEditingLinkTitle(null)}
                            onKeyDown={(e) => e.key === "Enter" && setEditingLinkTitle(null)}
                            className="h-7 text-sm"
                            autoFocus
                          />
                        ) : (
                          <a
                            href={link.url}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-sm font-medium truncate block"
                          >
                            {link.title || link.url}
                          </a>
                        )}
                        <p className="text-xs text-muted-foreground">
                          {link.autoExtracted ? "Auto-extracted" : "Added manually"} • {formatRelativeDate(link.addedAt)}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                      <Button
                        variant="ghost"
                        size="icon"
                        className="w-7 h-7"
                        onClick={() => setEditingLinkTitle(link.id)}
                      >
                        <Edit2 className="w-3 h-3" />
                      </Button>
                      <AlertDialog>
                        <AlertDialogTrigger asChild>
                          <Button variant="ghost" size="icon" className="w-7 h-7">
                            <Trash2 className="w-3 h-3" />
                          </Button>
                        </AlertDialogTrigger>
                        <AlertDialogContent>
                          <AlertDialogHeader>
                            <AlertDialogTitle>Delete link?</AlertDialogTitle>
                            <AlertDialogDescription>
                              This will remove this link from the note.
                            </AlertDialogDescription>
                          </AlertDialogHeader>
                          <AlertDialogFooter>
                            <AlertDialogCancel>Cancel</AlertDialogCancel>
                            <AlertDialogAction
                              onClick={() => removeNoteLink(noteId, link.id)}
                            >
                              Delete
                            </AlertDialogAction>
                          </AlertDialogFooter>
                        </AlertDialogContent>
                      </AlertDialog>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-sm text-muted-foreground mb-3">No saved links</p>
            )}
            <div className="flex gap-2">
              <Input
                placeholder="https://example.com"
                value={newLinkUrl}
                onChange={(e) => setNewLinkUrl(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && handleAddLink()}
                className="h-9 text-sm bg-[#121215] border-input rounded-[4px]"
              />
              <OutlineButton onClick={handleAddLink} disabled={!newLinkUrl.trim()}>
                Add Link
              </OutlineButton>
            </div>
          </section>

          {/* Tags Section */}
          <section className="mb-6">
            <div className="flex items-center justify-between gap-2 mb-3">
              <div className="flex items-center gap-2">
                <Tag className="w-4 h-4 text-foreground" />
                <h2 className="text-sm font-semibold uppercase tracking-wider text-foreground">TAGS ({tags.length})</h2>
              </div>
            </div>
            <div className="flex flex-wrap gap-2 mb-3">
              {tags.map((tag) => {
                const tagColor = note.tagColors?.[tag] || "#6b7280";
                return (
                  <DropdownMenu key={tag}>
                    <DropdownMenuTrigger asChild>
                      <span
                        className="px-2 py-1 rounded text-sm cursor-pointer hover:opacity-80 transition-opacity"
                        style={{
                          backgroundColor: `${tagColor}30`,
                          color: tagColor,
                          border: "1px solid",
                          borderColor: `${tagColor}50`,
                        }}
                      >
                        #{tag}
                      </span>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent>
                      <DropdownMenuItem
                        onClick={() => {
                          const newTag = prompt("Enter new tag name:", tag);
                          if (newTag && newTag.trim() && newTag !== tag) {
                            renameNoteTag(noteId, tag, newTag.trim().toLowerCase());
                          }
                        }}
                      >
                        <Edit2 className="w-3 h-3 mr-2" />
                        Rename
                      </DropdownMenuItem>
                      <DropdownMenuSeparator />
                      <div className="px-2 py-1">
                        <p className="text-xs text-muted-foreground mb-1">Color</p>
                        <div className="flex flex-wrap gap-1 max-w-[200px]">
                          {TAG_COLOR_PRESETS.map((preset) => (
                            <button
                              key={preset.name}
                              className="w-5 h-5 rounded-full border border-border hover:scale-110 transition-transform"
                              style={{ backgroundColor: preset.value }}
                              onClick={() => updateNoteTagColor(noteId, tag, preset.value)}
                            />
                          ))}
                        </div>
                      </div>
                      <DropdownMenuSeparator />
                      <DropdownMenuItem
                        onClick={() => removeNoteTag(noteId, tag)}
                      >
                        <Trash2 className="w-3 h-3 mr-2" />
                        Remove from Note
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                );
              })}
            </div>
            <div className="flex gap-2">
              <Input
                placeholder="Add tag..."
                value={newTagName}
                onChange={(e) => setNewTagName(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && handleAddTag()}
                className="h-9 text-sm bg-[#121215] border-input rounded-[4px]"
              />
              <OutlineButton onClick={handleAddTag} disabled={!newTagName.trim()}>
                Add Tag
              </OutlineButton>
            </div>
          </section>

          {/* Notes Section */}
          <section className="mb-6">
            <div className="flex items-center justify-between gap-2 mb-3">
              <div className="flex items-center gap-2">
                <FileText className="w-4 h-4 text-foreground" />
                <h2 className="text-sm font-semibold uppercase tracking-wider text-foreground">NOTES</h2>
              </div>
            </div>
            <Textarea
              placeholder="Add additional notes and comments about this document..."
              value={note.detailNotes || ""}
              onChange={(e) => updateNoteDetailNotes(noteId, e.target.value)}
              className="min-h-[100px] bg-[#121215] border-input rounded-[4px] text-sm"
            />
          </section>

          {/* Danger Zone */}
          <section className="mb-6 pt-6 border-t border-border">
            <div className="flex items-center justify-between gap-2 mb-3">
              <div className="flex items-center gap-2">
                <Trash2 className="w-4 h-4 text-foreground" />
                <h2 className="text-sm font-semibold uppercase tracking-wider text-foreground">DANGER ZONE</h2>
              </div>
            </div>
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium">Delete this note</p>
                <p className="text-xs text-muted-foreground">Move this note to trash. You can restore it later.</p>
              </div>
                <AlertDialog>
                  <AlertDialogTrigger asChild>
                    <Button variant="outline" size="sm">
                      <Trash2 className="w-3 h-3 mr-1" />
                      Delete
                    </Button>
                  </AlertDialogTrigger>
                  <AlertDialogContent>
                    <AlertDialogHeader>
                      <AlertDialogTitle>Delete note?</AlertDialogTitle>
                      <AlertDialogDescription>
                        This will move "{note.title}" to trash. You can restore it from the trash later.
                      </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                      <AlertDialogCancel>Cancel</AlertDialogCancel>
                      <AlertDialogAction
                        onClick={() => {
                          useNotesStore.getState().deleteNote(noteId);
                          onClose?.();
                        }}
                      >
                        Delete
                      </AlertDialogAction>
                    </AlertDialogFooter>
                  </AlertDialogContent>
                </AlertDialog>
              </div>
          </section>
        </div>
      </ScrollArea>
    </div>
  );
};
