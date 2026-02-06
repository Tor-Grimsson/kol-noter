import { SectionTitle } from "./sections/SectionTitle";
import { SectionMetadata } from "./sections/SectionMetadata";
import { SectionMetrics } from "./sections/SectionMetrics";
import { SectionConnections } from "./sections/SectionConnections";
import { MetadataSidebar } from "./MetadataSidebar";
import { useNotesStore } from "@/store/NotesContext";

interface MetadataRootProps {
  onClose?: () => void;
}

export const MetadataRoot = ({ onClose }: MetadataRootProps) => {
  const { systems, notes, getAggregatedTags, getMetricsStats } = useNotesStore();

  const totalProjects = systems.reduce((acc, s) => acc + s.projects.length, 0);
  const aggregatedTags = getAggregatedTags('root');
  const stats = getMetricsStats('root');

  return (
    <MetadataSidebar>
      {/* Detail Title Card */}
      <div className="meta-container">
        <SectionTitle
          title="Vault Overview"
          subtitle={`${systems.length} systems`}
          field1Label="Systems"
          field1Value={String(systems.length)}
          field2Label="Projects"
          field2Value={String(totalProjects)}
          field3Label="Notes"
          field3Value={String(notes.length)}
        />
      </div>

      {/* SectionMetadata */}
      <div className="meta-container">
        <SectionMetadata
          name="Vault Overview"
          description={`${systems.length} systems, ${totalProjects} projects, ${notes.length} notes`}
          type="Vault"
          typeOptions={["Vault"]}
          size={notes.length}
          sizeLabel="Notes"
          isBottomPanel
        />
      </div>

      {/* SectionMetrics */}
      <div className="meta-container">
        <SectionMetrics
          stats={stats}
          isBottomPanel
        />
      </div>

      {/* SectionConnections */}
      <div className="meta-container">
        <SectionConnections
          tags={aggregatedTags}
          links={[]}
          contacts={[]}
          isBottomPanel
        />
      </div>
    </MetadataSidebar>
  );
};
