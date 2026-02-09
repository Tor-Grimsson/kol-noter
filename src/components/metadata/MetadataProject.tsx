import { useRef, useState } from "react";
import { SectionTitle } from "./sections/SectionTitle";
import { MetadataSidebar, MetadataNotFound } from "./MetadataSidebar";
import { SectionMetadata } from "./sections/SectionMetadata";
import { SectionMetrics } from "./sections/SectionMetrics";
import { SectionMedia } from "./sections/SectionMedia";
import { SectionConnections } from "./sections/SectionConnections";
import { SectionDelete } from "./sections/SectionDelete";
import { useNotesStore } from "@/store/NotesContext";

interface MetadataProjectProps {
  systemId: string;
  projectId: string;
  onClose?: () => void;
}

export const MetadataProject = ({ systemId, projectId, onClose }: MetadataProjectProps) => {
  const {
    getProject,
    updateProjectMetadata,
    updateProjectMetrics,
    deleteProject,
    addProjectPhoto,
    removeProjectPhoto,
    addProjectVoiceRecording,
    removeProjectVoiceRecording,
    saveAttachment,
    addProjectLink,
    removeProjectLink,
    updateProjectLink,
    addProjectTag,
    removeProjectTag,
    updateProjectTagColor,
    addProjectContact,
    removeProjectContact,
    updateProjectContact,
    getAggregatedTags,
    getMetricsStats,
  } = useNotesStore();
  const project = getProject(systemId, projectId);
  const stats = getMetricsStats('project', projectId);

  const imageInputRef = useRef<HTMLInputElement>(null);

  if (!project) {
    return <MetadataNotFound message="Project not found" />;
  }

  // Transform attachments from store format
  const attachments = Object.entries(project.attachments || {}).map(([name, url]) => ({
    id: name,
    type: "file" as const,
    url,
    name,
    createdAt: Date.now(),
  }));

  // Get aggregated tags from notes
  const aggregatedTags = getAggregatedTags('project', projectId);

  return (
    <MetadataSidebar>
          {/* Detail Title Card */}
          <div className="meta-container">
            <SectionTitle
              title={project.name}
              subtitle={project.customField2 || "Q1 Init"}
              field1Label="Field 1"
              field1Value={project.customField1 || ""}
              field2Label="Field 2"
              field2Value={project.customField2 || ""}
              field3Label="Field 3"
              field3Value={project.customField3 || ""}
              onUpdateTitle={(title) => updateProjectMetadata(systemId, projectId, { name: title })}
              onUpdateSubtitle={(subtitle) => updateProjectMetadata(systemId, projectId, { customField2: subtitle, description: subtitle })}
              onUpdateField1={(value) => updateProjectMetadata(systemId, projectId, { customField1: value })}
              onUpdateField2={(value) => updateProjectMetadata(systemId, projectId, { customField2: value })}
              onUpdateField3={(value) => updateProjectMetadata(systemId, projectId, { customField3: value })}
            />
          </div>

          {/* SectionMetadata */}
          <div className="meta-container">
            <SectionMetadata
              name={project.name}
              description={project.description}
              type={project.customType}
              typeOptions={["Document", "Image", "Video", "Audio", "Code", "Archive"]}
              size={0}
              sizeLabel="Size"
              createdAt={project.createdAt}
              updatedAt={project.updatedAt}
              onUpdateName={(name) => updateProjectMetadata(systemId, projectId, { name })}
              onUpdateDescription={(description) => updateProjectMetadata(systemId, projectId, { description })}
              onUpdateType={(customType) => updateProjectMetadata(systemId, projectId, { customType })}
              isBottomPanel
            />
          </div>

          {/* SectionMetrics */}
          <div className="meta-container">
            <SectionMetrics
              metrics={project.metrics}
              stats={stats}
              onUpdateMetrics={(metrics) => updateProjectMetrics(systemId, projectId, metrics)}
              isBottomPanel
            />
          </div>

          {/* SectionMedia */}
          <div className="meta-container">
            <SectionMedia
              attachments={attachments}
              photos={project.photos || []}
              voiceRecordings={project.voiceRecordings || []}
              onAddPhoto={(name, dataUrl) => addProjectPhoto(systemId, projectId, name, dataUrl)}
              onRemovePhoto={(id) => removeProjectPhoto(systemId, projectId, id)}
              onAddAttachment={(att) => saveAttachment(projectId, att.name, att.url)}
              onRemoveAttachment={(id) => {
                const att = attachments.find(a => a.id === id);
                if (att) {
                  const newAttachments = { ...project.attachments };
                  delete newAttachments[att.name];
                  updateProjectMetadata(systemId, projectId, { attachments: newAttachments });
                }
              }}
              onAddVoiceRecording={(name, dataUrl, duration) => addProjectVoiceRecording(systemId, projectId, name, dataUrl, duration)}
              onRemoveVoiceRecording={(id) => removeProjectVoiceRecording(systemId, projectId, id)}
              isBottomPanel
            />
          </div>

          {/* SectionConnections */}
          <div className="meta-container">
            <SectionConnections
              tags={project.tags || []}
              tagColors={project.tagColors}
              links={project.links || []}
              contacts={project.contacts || []}
              aggregatedTags={aggregatedTags}
              onAddTag={(tag) => addProjectTag(systemId, projectId, tag)}
              onRemoveTag={(tag) => removeProjectTag(systemId, projectId, tag)}
              onUpdateTagColor={(tag, color) => updateProjectTagColor(systemId, projectId, tag, color)}
              onAddLink={(url, title) => addProjectLink(systemId, projectId, url, title)}
              onRemoveLink={(id) => removeProjectLink(systemId, projectId, id)}
              onUpdateLink={(id, updates) => updateProjectLink(systemId, projectId, id, updates)}
              onAddContact={(contact) => addProjectContact(systemId, projectId, contact)}
              onRemoveContact={(id) => removeProjectContact(systemId, projectId, id)}
              onUpdateContact={(id, updates) => updateProjectContact(systemId, projectId, id, updates)}
              isBottomPanel
            />
          </div>

          {/* SectionDelete */}
          <div className="meta-container">
            <SectionDelete
              onDelete={() => {
                if (confirm("Delete this project?")) {
                  deleteProject(systemId, projectId);
                  onClose?.();
                }
              }}
              isBottomPanel
            />
          </div>
    </MetadataSidebar>
  );
};
