import { useState, useRef, useEffect } from "react";
import { Paperclip, Image as ImageIcon, FileText, Link as LinkIcon, Mic, Calendar, Tag, Trash2 } from "lucide-react";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
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

interface NoteDetailsViewProps {
  noteId: string;
  noteTitle: string;
  onRename?: (newTitle: string) => void;
  onDelete?: () => void;
}

export const NoteDetailsView = ({ noteId, noteTitle, onRename, onDelete }: NoteDetailsViewProps) => {
  const [isEditing, setIsEditing] = useState(false);
  const [editTitle, setEditTitle] = useState(noteTitle);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    setEditTitle(noteTitle);
  }, [noteTitle]);

  useEffect(() => {
    if (isEditing && inputRef.current) {
      inputRef.current.focus();
      inputRef.current.select();
    }
  }, [isEditing]);

  const handleFinishRename = () => {
    const trimmed = editTitle.trim();
    if (trimmed && trimmed !== noteTitle) {
      onRename?.(trimmed);
    }
    setIsEditing(false);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter") {
      handleFinishRename();
    } else if (e.key === "Escape") {
      setEditTitle(noteTitle);
      setIsEditing(false);
    }
  };

  return (
    <div className="flex-1 overflow-auto bg-surface-inverse text-surface-inverse-foreground">
      <ScrollArea className="h-full">
        <div className="p-8 max-w-4xl mx-auto">
          {isEditing ? (
            <Input
              ref={inputRef}
              value={editTitle}
              onChange={(e) => setEditTitle(e.target.value)}
              onBlur={handleFinishRename}
              onKeyDown={handleKeyDown}
              className="text-3xl font-bold mb-8 h-auto py-1 px-0 bg-transparent border-none focus-visible:ring-0 focus:ring-0 focus:outline-none"
            />
          ) : (
            <h1
              className="text-3xl font-bold mb-8 cursor-pointer hover:text-primary transition-colors"
              onClick={() => setIsEditing(true)}
              title="Click to rename"
            >
              {noteTitle}
            </h1>
          )}

          {/* Metadata Section */}
          <section className="mb-8">
            <div className="flex items-center gap-2 mb-4">
              <Calendar className="w-5 h-5 text-primary" />
              <h2 className="text-xl font-semibold">Metadata</h2>
            </div>
            <div className="grid grid-cols-2 gap-4 p-4 border border-black/10 rounded-lg bg-black/5">
              <div>
                <label className="text-sm font-medium text-black/60">Created</label>
                <p className="text-base">January 15, 2025</p>
              </div>
              <div>
                <label className="text-sm font-medium text-black/60">Modified</label>
                <p className="text-base">2 minutes ago</p>
              </div>
              <div>
                <label className="text-sm font-medium text-black/60">Type</label>
                <p className="text-base">Work Document</p>
              </div>
              <div>
                <label className="text-sm font-medium text-black/60">Size</label>
                <p className="text-base">156 KB</p>
              </div>
            </div>
          </section>

          {/* Attachments Section */}
          <section className="mb-8">
            <div className="flex items-center gap-2 mb-4">
              <Paperclip className="w-5 h-5 text-primary" />
              <h2 className="text-xl font-semibold">Attachments (3)</h2>
            </div>
            <div className="space-y-2">
              <div className="flex items-center justify-between p-4 border border-black/10 rounded-lg bg-black/5 hover:bg-black/10 transition-colors cursor-pointer">
                <div className="flex items-center gap-3">
                  <FileText className="w-5 h-5 text-primary" />
                  <div>
                    <p className="text-sm font-medium">document.pdf</p>
                    <p className="text-xs text-black/60">Added 2 days ago</p>
                  </div>
                </div>
                <span className="text-sm text-black/60">2.4 MB</span>
              </div>
              <div className="flex items-center justify-between p-4 border border-black/10 rounded-lg bg-black/5 hover:bg-black/10 transition-colors cursor-pointer">
                <div className="flex items-center gap-3">
                  <FileText className="w-5 h-5 text-primary" />
                  <div>
                    <p className="text-sm font-medium">notes.txt</p>
                    <p className="text-xs text-black/60">Added 1 week ago</p>
                  </div>
                </div>
                <span className="text-sm text-black/60">12 KB</span>
              </div>
              <div className="flex items-center justify-between p-4 border border-black/10 rounded-lg bg-black/5 hover:bg-black/10 transition-colors cursor-pointer">
                <div className="flex items-center gap-3">
                  <FileText className="w-5 h-5 text-primary" />
                  <div>
                    <p className="text-sm font-medium">config.json</p>
                    <p className="text-xs text-black/60">Added 2 weeks ago</p>
                  </div>
                </div>
                <span className="text-sm text-black/60">8 KB</span>
              </div>
            </div>
          </section>

          {/* Photos Section */}
          <section className="mb-8">
            <div className="flex items-center gap-2 mb-4">
              <ImageIcon className="w-5 h-5 text-primary" />
              <h2 className="text-xl font-semibold">Photos (4)</h2>
            </div>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              {[1, 2, 3, 4].map((i) => (
                <div
                  key={i}
                  className="aspect-square bg-black/5 rounded-lg border border-black/10 flex items-center justify-center hover:bg-black/5/70 transition-colors cursor-pointer"
                >
                  <ImageIcon className="w-8 h-8 text-black/60" />
                </div>
              ))}
            </div>
          </section>

          {/* Voice Recordings Section */}
          <section className="mb-8">
            <div className="flex items-center gap-2 mb-4">
              <Mic className="w-5 h-5 text-primary" />
              <h2 className="text-xl font-semibold">Voice Recordings (2)</h2>
            </div>
            <div className="space-y-2">
              <div className="flex items-center justify-between p-4 border border-black/10 rounded-lg bg-black/5 hover:bg-black/10 transition-colors cursor-pointer">
                <div className="flex items-center gap-3">
                  <Mic className="w-5 h-5 text-primary" />
                  <div>
                    <p className="text-sm font-medium">Voice Memo 1</p>
                    <p className="text-xs text-black/60">Jan 15, 2:30 PM</p>
                  </div>
                </div>
                <span className="text-sm text-black/60">1:24</span>
              </div>
              <div className="flex items-center justify-between p-4 border border-black/10 rounded-lg bg-black/5 hover:bg-black/10 transition-colors cursor-pointer">
                <div className="flex items-center gap-3">
                  <Mic className="w-5 h-5 text-primary" />
                  <div>
                    <p className="text-sm font-medium">Voice Memo 2</p>
                    <p className="text-xs text-black/60">Jan 14, 9:15 AM</p>
                  </div>
                </div>
                <span className="text-sm text-black/60">2:47</span>
              </div>
            </div>
          </section>

          {/* Saved Links Section */}
          <section className="mb-8">
            <div className="flex items-center gap-2 mb-4">
              <LinkIcon className="w-5 h-5 text-primary" />
              <h2 className="text-xl font-semibold">Saved Links (3)</h2>
            </div>
            <div className="space-y-2">
              <div className="p-4 border border-black/10 rounded-lg bg-black/5 hover:bg-black/10 transition-colors cursor-pointer">
                <div className="flex items-center gap-3">
                  <LinkIcon className="w-4 h-4 text-primary" />
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium truncate">https://docs.example.com/api-reference</p>
                    <p className="text-xs text-black/60">Added 3 days ago</p>
                  </div>
                </div>
              </div>
              <div className="p-4 border border-black/10 rounded-lg bg-black/5 hover:bg-black/10 transition-colors cursor-pointer">
                <div className="flex items-center gap-3">
                  <LinkIcon className="w-4 h-4 text-primary" />
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium truncate">https://github.com/example/project</p>
                    <p className="text-xs text-black/60">Added 1 week ago</p>
                  </div>
                </div>
              </div>
              <div className="p-4 border border-black/10 rounded-lg bg-black/5 hover:bg-black/10 transition-colors cursor-pointer">
                <div className="flex items-center gap-3">
                  <LinkIcon className="w-4 h-4 text-primary" />
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium truncate">https://stackoverflow.com/questions/12345</p>
                    <p className="text-xs text-black/60">Added 2 weeks ago</p>
                  </div>
                </div>
              </div>
            </div>
          </section>

          {/* Tags Section */}
          <section className="mb-8">
            <div className="flex items-center gap-2 mb-4">
              <Tag className="w-5 h-5 text-primary" />
              <h2 className="text-xl font-semibold">Tags</h2>
            </div>
            <div className="flex flex-wrap gap-2">
              <span className="px-3 py-1.5 rounded-full bg-primary/20 text-primary border border-primary/30 text-sm">
                work
              </span>
              <span className="px-3 py-1.5 rounded-full bg-primary/20 text-primary border border-primary/30 text-sm">
                urgent
              </span>
              <span className="px-3 py-1.5 rounded-full bg-primary/20 text-primary border border-primary/30 text-sm">
                documentation
              </span>
            </div>
          </section>

          {/* Notes Section */}
          <section className="mb-8">
            <div className="flex items-center gap-2 mb-4">
              <FileText className="w-5 h-5 text-primary" />
              <h2 className="text-xl font-semibold">Notes</h2>
            </div>
            <div className="p-4 border border-black/10 rounded-lg bg-black/5">
              <p className="text-base leading-7">
                This is a placeholder for additional notes and comments about this document.
                You can add any contextual information, reminders, or observations here.
              </p>
            </div>
          </section>

          {/* Danger Zone */}
          <section className="mb-8 pt-8 border-t border-destructive/30">
            <div className="flex items-center gap-2 mb-4">
              <Trash2 className="w-5 h-5 text-destructive" />
              <h2 className="text-xl font-semibold text-destructive">Danger Zone</h2>
            </div>
            <div className="p-4 border border-destructive/30 rounded-lg bg-destructive/5">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium">Delete this note</p>
                  <p className="text-xs text-black/60">Move this note to trash. You can restore it later.</p>
                </div>
                <AlertDialog>
                  <AlertDialogTrigger asChild>
                    <Button variant="destructive" size="sm">
                      <Trash2 className="w-4 h-4 mr-2" />
                      Delete
                    </Button>
                  </AlertDialogTrigger>
                  <AlertDialogContent>
                    <AlertDialogHeader>
                      <AlertDialogTitle>Delete note?</AlertDialogTitle>
                      <AlertDialogDescription>
                        This will move "{noteTitle}" to trash. You can restore it from the trash later.
                      </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                      <AlertDialogCancel>Cancel</AlertDialogCancel>
                      <AlertDialogAction onClick={onDelete}>
                        Delete
                      </AlertDialogAction>
                    </AlertDialogFooter>
                  </AlertDialogContent>
                </AlertDialog>
              </div>
            </div>
          </section>
        </div>
      </ScrollArea>
    </div>
  );
};
