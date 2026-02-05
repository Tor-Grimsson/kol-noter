import { useState } from "react";
import { useNotesStore } from "@/store/notesStore";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Calendar } from "lucide-react";
import { DetailTitleCard } from "@/components/ui-elements/molecules/DetailTitleCard";
import { MetadataSection } from "@/components/detail-view/sections/MetadataSection";
import { MetricsSection } from "@/components/detail-view/sections/MetricsSection";
import { MediaSection } from "@/components/detail-view/sections/MediaSection";
import { ConnectionsSection } from "@/components/detail-view/sections/ConnectionsSection";

interface NoteDetailsViewProps {
  noteId: string;
  onClose?: () => void;
}

export const NoteDetailsView = ({ noteId, onClose }: NoteDetailsViewProps) => {
  const { getNote } = useNotesStore();
  const note = getNote(noteId);

  if (!note) {
    return (
      <div className="flex-1 overflow-auto text-foreground" style={{ backgroundColor: "#121215" }}>
        <div className="p-8 flex items-center justify-center h-full">
          <p className="text-sm text-muted-foreground">Note not found</p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex-1 overflow-auto text-foreground" style={{ backgroundColor: "#121215" }}>
      <ScrollArea className="h-full">
        <div className="mt-16 max-w-[600px] mx-auto">

          {/* Detail Title Card */}
          <div className="flex flex-col gap-6">
            <h2 className="text-lg font-semibold font-mono">Project Alpha</h2>
            <div className="meta-container">
            <DetailTitleCard
              title="Project Alpha"
              subtitle="Q1 Initiative"
              field1Label="Email"
              field1Value="john@example.com"
              field2Label="Phone"
              field2Value="+1 234 567 8900"
              field3Label="Socials"
              field3Value="@projectalpha"
              onUpdateTitle={(v) => {}}
              onUpdateSubtitle={(v) => {}}
              onUpdateField1={(v) => {}}
              onUpdateField2={(v) => {}}
              onUpdateField3={(v) => {}}
              onDelete={() => {}}
            />
            </div>

            {/* Image Strip */}
            <div
              className="w-full h-[200px] rounded-[4px] overflow-hidden bg-cover bg-center"
              style={{ backgroundImage: "url(/placeholder-img/ph-02.png)" }}
            />

            {/* MetadataSection */}
            <div className="meta-container">
              <MetadataSection
                name="Test Item"
                description="This is a test description for the item."
                type="Project"
                typeOptions={["Project", "Note", "Task", "Idea"]}
                createdAt={Date.now() - 86400000 * 5}
                updatedAt={Date.now() - 86400000}
                size={2456000}
                sizeLabel="Size"
                onUpdateName={() => {}}
                onUpdateDescription={() => {}}
                onUpdateType={() => {}}
                isBottomPanel
              />
            </div>

            {/* MetricsSection */}
            <div className="meta-container">
              <MetricsSection
                metrics={{
                  health: "good",
                  priority: "high",
                  status: "in_progress",
                  lead: "John Doe",
                  targetDate: "2026-03-15",
                }}
                onUpdateMetrics={() => {}}
                isBottomPanel
              />
            </div>

            {/* MediaSection */}
            <div className="meta-container">
              <MediaSection
                attachments={[
                  { id: "1", type: "file", url: "#", name: "document.pdf", size: 1024000, mimeType: "application/pdf", createdAt: Date.now() },
                ]}
                photos={[
                  { id: "1", name: "ph-01.png", dataUrl: "/placeholder-img/ph-01.png", addedAt: Date.now() },
                  { id: "2", name: "ph-02.png", dataUrl: "/placeholder-img/ph-02.png", addedAt: Date.now() },
                  { id: "3", name: "ph-03.png", dataUrl: "/placeholder-img/ph-03.png", addedAt: Date.now() },
                  { id: "4", name: "ph-01.png", dataUrl: "/placeholder-img/ph-01.png", addedAt: Date.now() },
                  { id: "5", name: "ph-02.png", dataUrl: "/placeholder-img/ph-02.png", addedAt: Date.now() },
                  { id: "6", name: "ph-03.png", dataUrl: "/placeholder-img/ph-03.png", addedAt: Date.now() },
                  { id: "7", name: "ph-01.png", dataUrl: "/placeholder-img/ph-01.png", addedAt: Date.now() },
                ]}
                voiceRecordings={[
                  { id: "1", name: "meeting.wav", dataUrl: "#", duration: "3:45", addedAt: Date.now() },
                ]}
                onAddAttachment={() => {}}
                onRemoveAttachment={() => {}}
                onAddPhoto={() => {}}
                onRemovePhoto={() => {}}
                onAddVoiceRecording={() => {}}
                onRemoveVoiceRecording={() => {}}
                isBottomPanel
              />
            </div>

            {/* ConnectionsSection */}
            <div className="meta-container">
              <ConnectionsSection
                tags={["design", "ui"]}
                tagColors={{ design: "#49a0a2", ui: "#66a44c" }}
                links={[
                  { id: "1", url: "https://github.com", title: "GitHub", addedAt: Date.now() },
                ]}
                contacts={[
                  { id: "1", name: "John Doe", role: "Developer", email: "email@example.com", phone: "+1 234 567 8900" },
                ]}
                onAddTag={() => {}}
                onRemoveTag={() => {}}
                onUpdateTagColor={() => {}}
                onAddLink={() => {}}
                onRemoveLink={() => {}}
                onUpdateLink={() => {}}
                onAddContact={() => {}}
                onRemoveContact={() => {}}
                onUpdateContact={() => {}}
                isBottomPanel
              />
            </div>
          </div>

        </div>
      </ScrollArea>
    </div>
  );
};
