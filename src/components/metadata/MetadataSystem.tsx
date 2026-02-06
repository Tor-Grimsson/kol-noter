import { useRef, useState } from "react";
import { SectionTitle } from "./sections/SectionTitle";
import { MetadataSidebar, MetadataNotFound } from "./MetadataSidebar";
import { SectionMetadata } from "./sections/SectionMetadata";
import { SectionMetrics } from "./sections/SectionMetrics";
import { SectionMedia } from "./sections/SectionMedia";
import { SectionConnections } from "./sections/SectionConnections";
import { SectionDelete } from "./sections/SectionDelete";
import { useNotesStore } from "@/store/NotesContext";
import { Badge } from "@/components/ui-elements/atoms/Badge";
import { Plus } from "lucide-react";

interface MetadataSystemProps {
  systemId: string;
  onClose?: () => void;
}

export const MetadataSystem = ({ systemId, onClose }: MetadataSystemProps) => {
  const {
    getSystem,
    updateSystemMetadata,
    deleteSystem,
    addSystemPhoto,
    removeSystemPhoto,
    addSystemVoiceRecording,
    removeSystemVoiceRecording,
    saveAttachment,
    addSystemLink,
    removeSystemLink,
    updateSystemLink,
    addSystemTag,
    removeSystemTag,
    updateSystemTagColor,
    addSystemContact,
    removeSystemContact,
    updateSystemContact,
    getMetricsStats,
  } = useNotesStore();
  const system = getSystem(systemId);
  const stats = getMetricsStats('system', systemId);

  const imageInputRef = useRef<HTMLInputElement>(null);

  if (!system) {
    return <MetadataNotFound message="System not found" />;
  }

  // Transform attachments from store format
  const attachments = Object.entries(system.attachments || {}).map(([name, url]) => ({
    id: name,
    type: "file" as const,
    url,
    name,
    createdAt: Date.now(),
  }));

  // Get aggregated tags from projects and notes
  const { getAggregatedTags } = useNotesStore();
  const aggregatedTags = getAggregatedTags('system', systemId);

  return (
    <MetadataSidebar>
          {/* Detail Title Card */}
          <div className="meta-container">
            <SectionTitle
              title={system.name}
              subtitle={system.customField2 || "Q1 Init"}
              field1Label="Field 1"
              field1Value={system.customField1 || ""}
              field2Label="Field 2"
              field2Value={system.customField2 || ""}
              field3Label="Field 3"
              field3Value={system.customField3 || ""}
              onUpdateTitle={(title) => updateSystemMetadata(systemId, { name: title })}
              onUpdateSubtitle={(subtitle) => updateSystemMetadata(systemId, { customField2: subtitle, description: subtitle })}
              onUpdateField1={(value) => updateSystemMetadata(systemId, { customField1: value })}
              onUpdateField2={(value) => updateSystemMetadata(systemId, { customField2: value })}
              onUpdateField3={(value) => updateSystemMetadata(systemId, { customField3: value })}
            />
          </div>

          {/* SectionMetadata */}
          <div className="meta-container">
            <SectionMetadata
              name={system.name}
              description={system.description}
              type={system.customType}
              typeOptions={["Document", "Image", "Video", "Audio", "Code", "Archive"]}
              size={0}
              sizeLabel="Size"
              createdAt={system.createdAt}
              updatedAt={system.updatedAt}
              onUpdateName={(name) => updateSystemMetadata(systemId, { name })}
              onUpdateDescription={(description) => updateSystemMetadata(systemId, { description })}
              onUpdateType={(customType) => updateSystemMetadata(systemId, { customType })}
              isBottomPanel
            />
          </div>

          {/* SectionMetrics */}
          <div className="meta-container">
            <SectionMetrics
              metrics={system.metrics}
              stats={stats}
              onUpdateMetrics={(metrics) => updateSystemMetadata(systemId, { metrics } as any)}
              isBottomPanel
            />
          </div>

          {/* SectionMedia */}
          <div className="meta-container">
            <SectionMedia
              attachments={attachments}
              photos={system.photos || []}
              voiceRecordings={system.voiceRecordings || []}
              onAddPhoto={(name, dataUrl) => addSystemPhoto(systemId, name, dataUrl)}
              onRemovePhoto={(id) => removeSystemPhoto(systemId, id)}
              onAddAttachment={(att) => saveAttachment(systemId, att.name, att.url)}
              onRemoveAttachment={(id) => {
                const att = attachments.find(a => a.id === id);
                if (att) {
                  const newAttachments = { ...system.attachments };
                  delete newAttachments[att.name];
                  updateSystemMetadata(systemId, { attachments: newAttachments });
                }
              }}
              onAddVoiceRecording={(name, dataUrl, duration) => addSystemVoiceRecording(systemId, name, dataUrl, duration)}
              onRemoveVoiceRecording={(id) => removeSystemVoiceRecording(systemId, id)}
              isBottomPanel
            />
          </div>

          {/* SectionConnections */}
          <div className="meta-container">
            <SectionConnections
              tags={system.tags || []}
              tagColors={system.tagColors}
              links={system.links || []}
              contacts={system.contacts || []}
              aggregatedTags={aggregatedTags}
              onAddTag={(tag) => addSystemTag(systemId, tag)}
              onRemoveTag={(tag) => removeSystemTag(systemId, tag)}
              onUpdateTagColor={(tag, color) => updateSystemTagColor(systemId, tag, color)}
              onAddLink={(url, title) => addSystemLink(systemId, url, title)}
              onRemoveLink={(id) => removeSystemLink(systemId, id)}
              onUpdateLink={(id, updates) => updateSystemLink(systemId, id, updates)}
              onAddContact={(contact) => addSystemContact(systemId, contact)}
              onRemoveContact={(id) => removeSystemContact(systemId, id)}
              onUpdateContact={(id, updates) => updateSystemContact(systemId, id, updates)}
              isBottomPanel
            />
          </div>

          {/* SectionDelete */}
          <div className="meta-container">
            <SectionDelete
              onDelete={() => {
                if (confirm("Delete this system and all its projects?")) {
                  deleteSystem(systemId);
                  onClose?.();
                }
              }}
              isBottomPanel
            />
          </div>
    </MetadataSidebar>
  );
};
