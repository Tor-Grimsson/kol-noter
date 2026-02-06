import { Trash2, RotateCcw, X } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui-elements/atoms/Button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { UnifiedSidebar } from "@/components/app-shell";
import { useNotesStore } from "@/store/NotesContext";
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

const Trash = () => {
  const navigate = useNavigate();
  const { trash, restoreNote, permanentlyDeleteNote, emptyTrash } = useNotesStore();

  const handleExplorerSelect = () => {
    navigate("/");
  };

  return (
    <div className="flex h-screen bg-background">
      <UnifiedSidebar
        onNoteSelect={handleExplorerSelect}
        onSystemProjectSelect={handleExplorerSelect}
        onHierarchySelect={handleExplorerSelect}
      />

      <div className="flex-1 flex flex-col">
        <div className="border-b border-border p-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Trash2 className="w-5 h-5 text-muted-foreground" />
            <h1 className="text-lg font-semibold">Trash</h1>
            <span className="text-sm text-muted-foreground">
              {trash.length} {trash.length === 1 ? "note" : "notes"}
            </span>
          </div>
          <div className="flex items-center gap-2">
            {trash.length > 0 && (
              <AlertDialog>
              <AlertDialogTrigger asChild>
                <Button variant="destructive" size="sm">
                  Empty Trash
                </Button>
              </AlertDialogTrigger>
              <AlertDialogContent>
                <AlertDialogHeader>
                  <AlertDialogTitle>Empty Trash?</AlertDialogTitle>
                  <AlertDialogDescription>
                    This will permanently delete all {trash.length} notes in the trash. This action cannot be undone.
                  </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                  <AlertDialogCancel>Cancel</AlertDialogCancel>
                  <AlertDialogAction onClick={emptyTrash}>
                    Delete All
                  </AlertDialogAction>
                </AlertDialogFooter>
              </AlertDialogContent>
            </AlertDialog>
            )}
            <Button variant="ghost" size="icon" onClick={() => navigate("/")}>
              <X className="w-4 h-4" />
            </Button>
          </div>
        </div>

        <ScrollArea className="flex-1">
          <div className="p-4">
            {trash.length === 0 ? (
              <div className="text-center py-12 text-muted-foreground">
                <Trash2 className="w-12 h-12 mx-auto mb-4 opacity-50" />
                <p className="text-sm">Trash is empty</p>
              </div>
            ) : (
              <div className="space-y-2">
                {trash.map((note) => (
                  <div
                    key={note.id}
                    className="flex items-center justify-between p-3 border border-border rounded bg-card hover:bg-muted/50 transition-colors"
                  >
                    <div className="flex-1 min-w-0">
                      <h3 className="text-sm font-medium truncate">{note.title}</h3>
                      <p className="text-xs text-muted-foreground truncate">{note.preview}</p>
                    </div>
                    <div className="flex items-center gap-2 ml-4">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => restoreNote(note.id)}
                        title="Restore note"
                      >
                        <RotateCcw className="w-4 h-4" />
                      </Button>
                      <AlertDialog>
                        <AlertDialogTrigger asChild>
                          <Button
                            variant="ghost"
                            size="sm"
                            className="text-destructive hover:text-destructive"
                            title="Delete permanently"
                          >
                            <X className="w-4 h-4" />
                          </Button>
                        </AlertDialogTrigger>
                        <AlertDialogContent>
                          <AlertDialogHeader>
                            <AlertDialogTitle>Delete permanently?</AlertDialogTitle>
                            <AlertDialogDescription>
                              This will permanently delete "{note.title}". This action cannot be undone.
                            </AlertDialogDescription>
                          </AlertDialogHeader>
                          <AlertDialogFooter>
                            <AlertDialogCancel>Cancel</AlertDialogCancel>
                            <AlertDialogAction onClick={() => permanentlyDeleteNote(note.id)}>
                              Delete
                            </AlertDialogAction>
                          </AlertDialogFooter>
                        </AlertDialogContent>
                      </AlertDialog>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </ScrollArea>
      </div>
    </div>
  );
};

export default Trash;
