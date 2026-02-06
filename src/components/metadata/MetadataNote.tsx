import { useState, useEffect, useCallback, useRef } from "react";
import { SectionTitle } from "./sections/SectionTitle";
import { SectionCoverImage } from "./sections/SectionCoverImage";
import { MetadataSidebar, MetadataNotFound } from "./MetadataSidebar";
import { SectionMetadata } from "./sections/SectionMetadata";
import { SectionMetrics } from "./sections/SectionMetrics";
import { SectionMedia } from "./sections/SectionMedia";
import { SectionConnections } from "./sections/SectionConnections";
import { SectionDelete } from "./sections/SectionDelete";
import { useNotesStore } from "@/store/NotesContext";
import { useVault } from "@/components/vault-system/VaultProvider";
import { filesystemAdapter } from "@/lib/persistence/filesystem-adapter";
import { Badge } from "@/components/ui-elements/atoms/Badge";
import { Plus } from "lucide-react";
import { SavedLink, Contact } from "@/store/NotesContext";

interface MetadataNoteProps {
  noteId: string;
  onClose?: () => void;
}

export const MetadataNote = ({ noteId, onClose }: MetadataNoteProps) => {
  const { isFilesystem } = useVault();
  const {
    getNote,
    updateNote,
    updateNoteMetrics,
    deleteNote,
    addNotePhoto,
    removeNotePhoto,
    addNoteVoiceRecording,
    removeNoteVoiceRecording,
    saveAttachment,
    addNoteLink,
    removeNoteLink,
    updateNoteLink,
    addNoteTag,
    removeNoteTag,
    updateNoteTagColor,
    addNoteContact,
    removeNoteContact,
    updateNoteContact,
  } = useNotesStore();
  const note = getNote(noteId);

  const [showDummyData, setShowDummyData] = useState(false);
  const [noteSize, setNoteSize] = useState(0);

  // Calculate note size from filesystem
  useEffect(() => {
    if (!isFilesystem || !noteId) {
      setNoteSize(0);
      return;
    }

    const calculateSize = async () => {
      try {
        const size = await filesystemAdapter.getNoteSize(noteId);
        setNoteSize(size);
      } catch (err) {
        console.error('[MetadataNote] Failed to calculate note size:', err);
        setNoteSize(0);
      }
    };

    calculateSize();
  }, [noteId, isFilesystem]);

  // Track note in a ref for fresh access
  const noteRef = useRef(note);
  useEffect(() => { noteRef.current = note; }, [note]);

  // Generate random dummy data
  const generateDummyData = useCallback(() => {
    const currentNote = noteRef.current;
    if (!currentNote) {
      console.log('[Dummy Data] No note found');
      return;
    }

    console.log('[Dummy Data] Starting for note:', currentNote.id);

    const rng = Math.random;
    const numPhotos = Math.floor(rng() * 5) + 4; // 4-8
    const numTags = Math.floor(rng() * 5) + 4; // 4-8
    const numLinks = Math.floor(rng() * 5) + 4; // 4-8
    const numContacts = Math.floor(rng() * 5) + 4; // 4-8

    console.log(`[Dummy Data] Adding: ${numPhotos} photos, ${numTags} tags, ${numLinks} links, ${numContacts} contacts`);

    // Generate random photos
    const photos = [];
    const photoColors = ['49a0a2', '66a44c', 'ce4646', 'db8000', '9437ff', 'ffe32e', 'd0d79d', '121215'];
    for (let i = 0; i < numPhotos; i++) {
      const color = photoColors[i % photoColors.length];
      const svgPhoto = `data:image/svg+xml,${encodeURIComponent(`<svg xmlns="http://www.w3.org/2000/svg" width="400" height="300" viewBox="0 0 400 300"><rect fill="#${color}" width="400" height="300"/><text x="50%" y="50%" dominant-baseline="middle" text-anchor="middle" fill="white" font-family="sans-serif" font-size="24">Photo ${i+1}</text></svg>`)}`;
      photos.push({ id: `photo_${Date.now()}_${i}`, name: `photo_${i+1}.svg`, dataUrl: svgPhoto, addedAt: Date.now() });
    }

    // Generate random tags
    const tags: string[] = ['kol', 'krabbi', 'kolkrabbi', 'noter', 'kol-noter'];

    // Generate random links
    const links: SavedLink[] = [];
    const linkUrls = [
      'https://github.com/anthropics/claude-code',
      'https://react.dev',
      'https://typescriptlang.org',
      'https://tailwindcss.com',
      'https://tauri.app',
      'https://radix-ui.com',
      'https://docs.microsoft.com',
      'https://developer.mozilla.org',
    ];
    for (let i = 0; i < numLinks; i++) {
      links.push({
        id: `link_${Date.now()}_${i}`,
        url: linkUrls[i % linkUrls.length],
        title: `Link ${i+1}`,
        addedAt: Date.now()
      });
    }

    // Generate random contacts
    const contacts: Contact[] = [];
    const contactNames = ['Alice Johnson', 'Bob Smith', 'Carol Williams', 'David Brown', 'Eve Davis', 'Frank Miller', 'Grace Lee', 'Henry Wilson'];
    const contactRoles = ['Designer', 'Developer', 'Manager', 'Product Owner', 'Stakeholder', 'Engineer', 'Analyst', 'Lead'];
    for (let i = 0; i < numContacts; i++) {
      contacts.push({
        id: `contact_${Date.now()}_${i}`,
        name: `${contactNames[i % contactNames.length]}`,
        role: contactRoles[i % contactRoles.length],
        email: `contact${i+1}@example.com`,
        phone: `+1 234 567 ${8900 + i}`,
        socials: `@contact${i+1}`,
      });
    }

    // Random metrics
    const healthOptions = ['good', 'warning', 'critical'];
    const priorityOptions = ['high', 'medium', 'low'];
    const statusOptions = ['not_started', 'in_progress', 'done', 'blocked'];

    const updateData = {
      customField1: `Field 1 Value ${Math.floor(rng() * 100)}`,
      customField2: `Q${Math.floor(rng() * 4) + 1} ${['Init', 'Review', 'Plan', 'Done'][Math.floor(rng() * 4)]}`,
      customField3: `Custom ${['Alpha', 'Beta', 'Gamma', 'Delta'][Math.floor(rng() * 4)]}`,
      customType: ['Document', 'Image', 'Video', 'Audio', 'Code', 'Archive'][Math.floor(rng() * 6)],
      tags,
      photos,
      links,
      contacts,
      metrics: {
        health: healthOptions[Math.floor(rng() * 3)] as 'good' | 'warning' | 'critical',
        priority: priorityOptions[Math.floor(rng() * 3)] as 'high' | 'medium' | 'low',
        status: statusOptions[Math.floor(rng() * 4)] as 'not_started' | 'in_progress' | 'done' | 'blocked',
        targetDate: new Date(Date.now() + Math.floor(rng() * 30) * 24 * 60 * 60 * 1000).toISOString(),
        lead: `Lead ${['Alice', 'Bob', 'Carol'][Math.floor(rng() * 3)]}`,
      },
      preview: `This is a dummy preview for testing purposes with random content ${Math.floor(rng() * 1000)}.`,
    };

    console.log('[Dummy Data] Calling updateNote with:', updateData);
    updateNote(noteId, updateData);
    console.log('[Dummy Data] Complete!');
    setShowDummyData(false);
  }, [noteId]);

  // Trigger dummy data generation
  useEffect(() => {
    if (showDummyData) {
      generateDummyData();
    }
  }, [showDummyData, generateDummyData]);

  if (!note) {
    return <MetadataNotFound message="Note not found" />;
  }

  // Transform attachments from store format to component format
  const attachments = Object.entries(note.attachments || {}).map(([name, url]) => ({
    id: name,
    type: "file" as const,
    url,
    name,
    createdAt: Date.now(),
  }));

  // Get cover photo by ID, or show placeholder
  const coverPhoto = note.photos?.find(p => p.id === note.coverPhotoId) || null;

  return (
    <MetadataSidebar>
      {/* Debug button for dummy data (TEMPORARY) */}
      <Badge
        variant="outline"
        className="fixed top-20 right-4 z-50 cursor-pointer hover:bg-white/5 opacity-50 hover:opacity-100"
        onClick={() => setShowDummyData(true)}
      >
        <Plus className="w-3 h-3 mr-1" />Add Dummy Data
      </Badge>

          {/* Detail Title Card */}
          <div className="meta-container">
            <SectionTitle
              title={note.title}
              subtitle={note.customField2 || "Q1 Init"}
              field1Label="Field 1"
              field1Value={note.customField1 || ""}
              field2Label="Field 2"
              field2Value={note.customField2 || ""}
              field3Label="Field 3"
              field3Value={note.customField3 || ""}
              onUpdateTitle={(title) => updateNote(noteId, { title })}
              onUpdateSubtitle={(subtitle) => updateNote(noteId, { customField2: subtitle, preview: subtitle })}
              onUpdateField1={(value) => updateNote(noteId, { customField1: value })}
              onUpdateField2={(value) => updateNote(noteId, { customField2: value })}
              onUpdateField3={(value) => updateNote(noteId, { customField3: value })}
            />
          </div>

          {/* Cover Image */}
          <SectionCoverImage
            coverPhotoUrl={coverPhoto?.dataUrl}
            onUploadImage={(file) => {
              const reader = new FileReader();
              reader.onload = (event) => {
                const dataUrl = event.target?.result as string;
                // Add as a photo AND set as cover
                const newPhoto = { id: `photo_${Date.now()}`, name: file.name, dataUrl, addedAt: Date.now() };
                updateNote(noteId, {
                  photos: [...(note.photos || []), newPhoto],
                  coverPhotoId: newPhoto.id
                });
              };
              reader.readAsDataURL(file);
            }}
            onRemoveImage={() => {
              updateNote(noteId, { coverPhotoId: undefined });
            }}
          />

          {/* SectionMetadata */}
          <div className="meta-container">
            <SectionMetadata
              name={note.title}
              description={note.preview}
              type={note.customType}
              typeOptions={["Document", "Image", "Video", "Audio", "Code", "Archive"]}
              size={noteSize}
              sizeLabel="Size"
              createdAt={note.createdAt}
              updatedAt={note.updatedAt}
              onUpdateName={(name) => updateNote(noteId, { title: name })}
              onUpdateDescription={(preview) => updateNote(noteId, { preview })}
              onUpdateType={(customType) => updateNote(noteId, { customType })}
              isSizeReadOnly
              isBottomPanel
            />
          </div>

          {/* SectionMetrics */}
          <div className="meta-container">
            <SectionMetrics
              metrics={note.metrics}
              onUpdateMetrics={(metrics) => updateNoteMetrics(noteId, metrics)}
              isBottomPanel
            />
          </div>

          {/* SectionMedia */}
          <div className="meta-container">
            <SectionMedia
              attachments={attachments}
              photos={note.photos || []}
              voiceRecordings={note.voiceRecordings || []}
              onAddPhoto={(name, dataUrl) => {
                // Save attachment to _assets folder first, then add photo reference
                saveAttachment(noteId, name, dataUrl);
                addNotePhoto(noteId, name, dataUrl);
              }}
              onRemovePhoto={(id) => removeNotePhoto(noteId, id)}
              onAddAttachment={(att) => saveAttachment(noteId, att.name, att.url)}
              onRemoveAttachment={(id) => {
                const att = attachments.find(a => a.id === id);
                if (att) {
                  const newAttachments = { ...note.attachments };
                  delete newAttachments[att.name];
                  updateNote(noteId, { attachments: newAttachments });
                }
              }}
              onAddVoiceRecording={(name, dataUrl, duration) => addNoteVoiceRecording(noteId, name, dataUrl, duration)}
              onRemoveVoiceRecording={(id) => removeNoteVoiceRecording(noteId, id)}
              isBottomPanel
            />
          </div>

          {/* SectionConnections */}
          <div className="meta-container">
            <SectionConnections
              tags={note.tags}
              tagColors={note.tagColors}
              links={note.links || []}
              contacts={note.contacts || []}
              onAddTag={(tag) => addNoteTag(noteId, tag)}
              onRemoveTag={(tag) => removeNoteTag(noteId, tag)}
              onUpdateTagColor={(tag, color) => updateNoteTagColor(noteId, tag, color)}
              onAddLink={(url, title) => addNoteLink(noteId, url, title)}
              onRemoveLink={(id) => removeNoteLink(noteId, id)}
              onUpdateLink={(id, updates) => updateNoteLink(noteId, id, updates)}
              onAddContact={(contact) => addNoteContact(noteId, contact)}
              onRemoveContact={(id) => removeNoteContact(noteId, id)}
              onUpdateContact={(id, updates) => updateNoteContact(noteId, id, updates)}
              isBottomPanel
            />
          </div>

          {/* SectionDelete */}
          <div className="meta-container">
            <SectionDelete
              onDelete={() => {
                if (confirm("Delete this note?")) {
                  deleteNote(noteId);
                  onClose?.();
                }
              }}
              isBottomPanel
            />
          </div>
    </MetadataSidebar>
  );
};
