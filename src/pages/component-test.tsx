import { useState } from "react";
import { Badge } from "@/components/ui-elements/atoms/Badge";
import { Tag } from "@/components/ui-elements/atoms/Tag";
import { SectionHeader } from "@/components/ui-elements/atoms/SectionHeader";
import { MediaItem, ImageThumbnail } from "@/components/ui-elements/molecules/MediaItem";
import { HealthBadge, PriorityBadge, StatusBadge } from "@/components/ui-elements/molecules/MetricSelector";
import { DropdownSelect } from "@/components/ui-elements/molecules/DropdownSelect";
import { FileText, Image as ImageIcon, Mic, Download, Play, Trash2, Calendar, Link as LinkIcon, Users, AlertCircle, User, CheckCircle2, CalendarDays, Plus, Activity } from "lucide-react";
import { MetadataSection } from "@/components/detail-view/sections/MetadataSection";
import { MetricsSection } from "@/components/detail-view/sections/MetricsSection";
import { MediaSection } from "@/components/detail-view/sections/MediaSection";
import { ConnectionsSection } from "@/components/detail-view/sections/ConnectionsSection";
import { ItemMetrics } from "@/store/notesStore";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { TAG_COLOR_PRESETS } from "@/store/notesStore";

// Shared styles for the panel
const PANEL_STYLES = {
  input: "h-6 px-2 rounded-[4px] bg-[#1e1e24] border border-white/10 text-xs placeholder:text-muted-foreground/50 focus:outline-none focus:border-white/15",
  addButton: "h-6 px-3 text-xs",
  linkItem: "flex items-center gap-2 h-6 px-2 rounded-[4px] bg-[#1e1e24] text-xs text-foreground hover:bg-white/5 my-0.5",
};

// Tag colors from the palette
const TAG_COLORS = TAG_COLOR_PRESETS;

export default function ComponentTestPage() {
  // Mock data for testing
  const [testName, setTestName] = useState("Test Item");
  const [testDescription, setTestDescription] = useState("This is a test description for the item.");
  const [testType, setTestType] = useState("Project");
  const [testMetrics, setTestMetrics] = useState<ItemMetrics>({
    health: "good",
    priority: "high",
    status: "in_progress",
    lead: "John Doe",
    targetDate: "2026-03-15",
  });

  return (
    <div className="min-h-screen bg-background p-8 space-y-8 font-mono">
      <h1 className="text-2xl font-bold mb-6 font-mono">Component Test Page - Detail View Organisms</h1>

      {/* ========================================== */}
      {/* TAG COLORS, TAG STYLES, BADGES, BUTTONS */}
      {/* ========================================== */}
      <section className="border rounded-lg p-4">
        <h2 className="text-lg font-semibold mb-4 font-mono">Tag Colors (JetBrains Mono Font)</h2>
        <div className="flex flex-wrap gap-4">
          {TAG_COLORS.map((color) => (
            <Tag
              key={color.name}
              label={color.name}
              color={color.value}
              size="md"
            />
          ))}
        </div>
        <div className="mt-4 flex flex-wrap gap-4">
          {TAG_COLORS.slice(0, 4).map((color) => (
            <Tag
              key={`solid-${color.name}`}
              label={color.name}
              color={color.value}
              size="md"
              variant="solid"
            />
          ))}
        </div>
      </section>

      {/* ========================================== */}
      {/* TAG STYLES */}
      {/* ========================================== */}
      <section className="border rounded-lg p-4">
        <h2 className="text-lg font-semibold mb-4 font-mono">Tag Styles (rounded-full, NO stroke)</h2>

        <div className="flex flex-wrap gap-4">
          <Tag label="blue" color="#49a0a2" />
          <Tag label="green" color="#66a44c" />
          <Tag label="yellow" color="#ffe32e" />
          <Tag label="red" color="#ce4646" />
          <Tag label="orange" color="#db8000" />
          <Tag label="purple" color="#9437ff" />
          <Tag label="warm" color="#d0d79d" />
          <Tag label="dark" color="#121215" />
        </div>

        <h3 className="text-sm font-medium mt-4 mb-2 font-mono">With remove button (white/30)</h3>
        <div className="flex flex-wrap gap-4">
          <Tag label="design" color="#49a0a2" removable onRemove={() => {}} />
          <Tag label="urgent" color="#ce4646" removable onRemove={() => {}} />
        </div>

        <h3 className="text-sm font-medium mt-4 mb-2 font-mono">Sizes</h3>
        <div className="flex flex-wrap gap-4 items-center">
          <Tag label="small" color="#49a0a2" size="sm" />
          <Tag label="medium" color="#49a0a2" size="md" />
        </div>
      </section>

      {/* ========================================== */}
      {/* BADGE STYLES */}
      {/* ========================================== */}
      <section className="border rounded-lg p-4">
        <h2 className="text-lg font-semibold mb-4 font-mono">Badge Styles (rounded-[4px], h-6)</h2>

        <div className="flex flex-wrap gap-4">
          <Badge variant="default">Default</Badge>
          <Badge variant="secondary">Secondary</Badge>
          <Badge variant="success">Success</Badge>
          <Badge variant="warning">Warning</Badge>
          <Badge variant="critical">Critical</Badge>
          <Badge variant="info">Info</Badge>
          <Badge variant="outline">Outline</Badge>
        </div>
      </section>

      {/* ========================================== */}
      {/* BUTTON STYLES */}
      {/* ========================================== */}
      <section className="border rounded-lg p-4">
        <h2 className="text-lg font-semibold mb-4 font-mono">Button Styles (28px height)</h2>

        <div className="flex flex-wrap gap-4 items-center">
          {/* Primary button (white bg, dark text) */}
          <Button className="text-xs">Primary</Button>

          {/* Secondary button (yellow bg, dark text) */}
          <Button variant="secondary" className="text-xs">Secondary</Button>

          {/* Outline button (dark bg, white text) */}
          <Button variant="outline" className="text-xs">Outline</Button>

          {/* Ghost button */}
          <Button variant="ghost" className="text-xs">Ghost</Button>

          {/* Destructive button */}
          <Button variant="destructive" className="text-xs">Delete</Button>
        </div>
      </section>

      {/* ========================================== */}
      {/* DROPDOWN SELECT */}
      {/* ========================================== */}
      <section className="border rounded-lg p-4 bg-[#0f0f13]">
        <h2 className="text-lg font-semibold mb-4 font-mono">DropdownSelect</h2>
        <div className="max-w-md">
          <DropdownSelect
            value={testType}
            options={["Project", "Note", "Task", "Idea"]}
            placeholder="Select type..."
            onChange={setTestType}
            label="Type"
          />
        </div>
      </section>

      {/* ========================================== */}
      {/* METRIC BADGES */}
      {/* ========================================== */}
      <section className="border rounded-lg p-4">
        <h2 className="text-lg font-semibold mb-4 font-mono">Metric Badges</h2>

        <div className="space-y-4">
          <div>
            <p className="text-sm text-muted-foreground mb-2 font-mono">Health</p>
            <div className="flex gap-2">
              <HealthBadge health="good" />
              <HealthBadge health="warning" />
              <HealthBadge health="critical" />
            </div>
          </div>
          <div>
            <p className="text-sm text-muted-foreground mb-2 font-mono">Priority</p>
            <div className="flex gap-2">
              <PriorityBadge priority="high" />
              <PriorityBadge priority="medium" />
              <PriorityBadge priority="low" />
            </div>
          </div>
          <div>
            <p className="text-sm text-muted-foreground mb-2 font-mono">Status</p>
            <div className="flex gap-2">
              <StatusBadge status="not_started" />
              <StatusBadge status="in_progress" />
              <StatusBadge status="done" />
              <StatusBadge status="blocked" />
            </div>
          </div>
        </div>
      </section>

      {/* ========================================== */}
      {/* METADATA SECTION - Bottom Panel */}
      {/* ========================================== */}
      <section className="border rounded-lg p-4 bg-[#0f0f13]">
        <h2 className="text-lg font-semibold mb-4 font-mono">MetadataSection (Bottom Panel)</h2>
        <div className="max-w-lg">
          <MetadataSection
            name={testName}
            description={testDescription}
            type={testType}
            typeOptions={["Project", "Note", "Task", "Idea"]}
            createdAt={Date.now() - 86400000 * 5}
            updatedAt={Date.now() - 86400000}
            size={2456000}
            sizeLabel="Size"
            onUpdateName={setTestName}
            onUpdateDescription={setTestDescription}
            onUpdateType={setTestType}
            isBottomPanel
          />
        </div>
      </section>

      {/* ========================================== */}
      {/* METRICS SECTION - Bottom Panel */}
      {/* ========================================== */}
      <section className="border rounded-lg p-4 bg-[#0f0f13]">
        <h2 className="text-lg font-semibold mb-4 font-mono">MetricsSection (Bottom Panel)</h2>
        <div className="max-w-lg">
          <MetricsSection
            metrics={testMetrics}
            onUpdateMetrics={setTestMetrics}
            isBottomPanel
          />
        </div>
      </section>

      {/* ========================================== */}
      {/* MEDIA SECTION - Bottom Panel */}
      {/* ========================================== */}
      <section className="border rounded-lg p-4 bg-[#0f0f13]">
        <h2 className="text-lg font-semibold mb-4 font-mono">MediaSection (Bottom Panel)</h2>
        <div className="max-w-lg">
          <MediaSection
            attachments={[
              { id: "1", type: "file", url: "#", name: "document.pdf", size: 1024000, mimeType: "application/pdf", createdAt: Date.now() },
            ]}
            photos={[
              { id: "1", name: "photo1.jpg", dataUrl: "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='100' height='100'%3E%3Crect fill='%2349a0a2' width='100' height='100'/%3E%3C/svg%3E", createdAt: Date.now() },
              { id: "2", name: "photo2.jpg", dataUrl: "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='100' height='100'%3E%3Crect fill='%2366a44c' width='100' height='100'/%3E%3C/svg%3E", createdAt: Date.now() },
              { id: "3", name: "photo3.jpg", dataUrl: "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='100' height='100'%3E%3Crect fill='%23ffe32e' width='100' height='100'/%3E%3C/svg%3E", createdAt: Date.now() },
              { id: "4", name: "photo4.jpg", dataUrl: "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='100' height='100'%3E%3Crect fill='%23ce4646' width='100' height='100'/%3E%3C/svg%3E", createdAt: Date.now() },
              { id: "5", name: "photo5.jpg", dataUrl: "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='100' height='100'%3E%3Crect fill='%23db8000' width='100' height='100'/%3E%3C/svg%3E", createdAt: Date.now() },
              { id: "6", name: "photo6.jpg", dataUrl: "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='100' height='100'%3E%3Crect fill='%239437ff' width='100' height='100'/%3E%3C/svg%3E", createdAt: Date.now() },
              { id: "7", name: "photo7.jpg", dataUrl: "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='100' height='100'%3E%3Crect fill='%23d0d79d' width='100' height='100'/%3E%3C/svg%3E", createdAt: Date.now() },
            ]}
            voiceRecordings={[
              { id: "1", name: "meeting.wav", url: "#", duration: "3:45", createdAt: Date.now() },
            ]}
            onAddAttachment={(att) => console.log("Add attachment", att)}
            onRemoveAttachment={(id) => console.log("Remove attachment", id)}
            onAddPhoto={(name, url) => console.log("Add photo", name, url)}
            onRemovePhoto={(id) => console.log("Remove photo", id)}
            onAddVoiceRecording={(name, url, duration) => console.log("Add recording", name, url, duration)}
            onRemoveVoiceRecording={(id) => console.log("Remove recording", id)}
            onPlayRecording={(url) => console.log("Play recording", url)}
            onDownloadFile={(url, name) => console.log("Download", url, name)}
            isBottomPanel
          />
        </div>
      </section>

      {/* ========================================== */}
      {/* CONNECTIONS SECTION - Bottom Panel */}
      {/* ========================================== */}
      <section className="border rounded-lg p-4 bg-[#0f0f13]">
        <h2 className="text-lg font-semibold mb-4 font-mono">ConnectionsSection (Bottom Panel)</h2>
        <div className="max-w-lg">
          <ConnectionsSection
            tags={["design", "ui"]}
            tagColors={{ design: "#49a0a2", ui: "#66a44c" }}
            links={[
              { id: "1", url: "https://github.com", title: "GitHub" },
            ]}
            contacts={[
              { id: "1", name: "John Doe", role: "Developer" },
            ]}
            onAddTag={(tag) => console.log("Add tag", tag)}
            onRemoveTag={(tag) => console.log("Remove tag", tag)}
            onUpdateTagColor={(tag, color) => console.log("Update tag color", tag, color)}
            onAddLink={(url, title) => console.log("Add link", url, title)}
            onRemoveLink={(id) => console.log("Remove link", id)}
            onUpdateLink={(id, updates) => console.log("Update link", id, updates)}
            onAddContact={(contact) => console.log("Add contact", contact)}
            onRemoveContact={(id) => console.log("Remove contact", id)}
            isBottomPanel
          />
        </div>
      </section>

      {/* ========================================== */}
      {/* Design System Components */}
      {/* ========================================== */}
      <section className="border rounded-lg p-4">
        <h2 className="text-lg font-semibold mb-4 font-mono">Design System Components</h2>

        <div className="grid grid-cols-2 gap-8">
          {/* CELL_STYLE verification */}
          <div>
            <h3 className="text-sm font-medium mb-2 font-mono">CELL_STYLE (bg-[#1e1e24] h-6 p-2 rounded-[4px])</h3>
            <div className="flex gap-4 items-center">
              <div className="bg-[#1e1e24] h-6 p-2 rounded-[4px] text-xs flex items-center">
                Cell 1
              </div>
              <div className="bg-[#1e1e24] h-6 p-2 rounded-[4px] text-xs flex items-center">
                Cell 2
              </div>
            </div>
          </div>

          {/* GRID_LAYOUT verification */}
          <div>
            <h3 className="text-sm font-medium mb-2 font-mono">GRID_LAYOUT (grid-cols-2 gap-x-4 gap-y-3)</h3>
            <div className="grid grid-cols-2 gap-x-4 gap-y-2">
              <div className="bg-[#1e1e24] h-6 p-2 rounded-[4px] text-xs flex items-center">Cell 1</div>
              <div className="bg-[#1e1e24] h-6 p-2 rounded-[4px] text-xs flex items-center">Cell 2</div>
              <div className="bg-[#1e1e24] h-6 p-2 rounded-[4px] text-xs flex items-center">Cell 3</div>
              <div className="bg-[#1e1e24] h-6 p-2 rounded-[4px] text-xs flex items-center">Cell 4</div>
            </div>
          </div>

          {/* Typography verification */}
          <div>
            <h3 className="text-sm font-medium mb-2 font-mono">Typography (JetBrains Mono)</h3>
            <div className="space-y-2">
              <div>
                <span className="text-[10px] text-muted-foreground uppercase block mb-1">Label (text-[10px])</span>
                <div className="bg-[#1e1e24] h-6 p-2 rounded-[4px] flex items-center">
                  <span className="text-xs">Value (text-xs)</span>
                </div>
              </div>
            </div>
          </div>

          {/* Icon size verification */}
          <div>
            <h3 className="text-sm font-medium mb-2 font-mono">ICON_SIZE (w-3 h-3)</h3>
            <div className="flex items-center gap-2">
              <Calendar className="w-3 h-3" />
              <Activity className="w-3 h-3" />
              <LinkIcon className="w-3 h-3" />
              <Users className="w-3 h-3" />
            </div>
          </div>
        </div>
      </section>

      {/* ========================================== */}
      {/* Input Field Styles */}
      {/* ========================================== */}
      <section className="border rounded-lg p-4">
        <h2 className="text-lg font-semibold mb-4 font-mono">Input Field Styles (FIXED h-6, same as buttons)</h2>

        <div className="space-y-4 max-w-lg">
          {/* Single line input */}
          <div>
            <label className="text-[10px] text-muted-foreground uppercase block mb-1.5 font-mono">Single Line Input</label>
            <input
              type="text"
              placeholder="Enter text..."
              className={PANEL_STYLES.input}
            />
          </div>

          {/* Inline add input */}
          <div className="flex gap-2">
            <input
              type="text"
              placeholder="Add tag..."
              className={PANEL_STYLES.input}
            />
            <Button className={PANEL_STYLES.addButton}>
              <Plus className="w-3 h-3 mr-1" /> Add
            </Button>
          </div>

          {/* Link add input */}
          <div className="flex gap-2">
            <input
              type="text"
              placeholder="https://..."
              className={PANEL_STYLES.input}
            />
            <Button className={PANEL_STYLES.addButton}>
              Add
            </Button>
          </div>

          {/* Textarea */}
          <div>
            <label className="text-[10px] text-muted-foreground uppercase block mb-1.5 font-mono">Multi-line Textarea</label>
            <textarea
              placeholder="Enter description..."
              className="min-h-[80px] w-full rounded-[4px] bg-[#1e1e24] border border-white/10 p-2 text-xs placeholder:text-muted-foreground/50 focus:outline-none focus:border-white/15 resize-none"
            />
          </div>
        </div>
      </section>

      {/* ========================================== */}
      {/* Link Styles */}
      {/* ========================================== */}
      <section className="border rounded-lg p-4 bg-[#0f0f13]">
        <h2 className="text-lg font-semibold mb-4 font-mono">Link Styles (max-h-[24px])</h2>

        <div className="space-y-2 max-w-lg">
          <div className={cn(PANEL_STYLES.linkItem)}>
            <LinkIcon className="w-3 h-3 shrink-0 text-muted-foreground" />
            <span className="truncate">github.com/anthropics/claude</span>
          </div>
          <div className={cn(PANEL_STYLES.linkItem)}>
            <LinkIcon className="w-3 h-3 shrink-0 text-muted-foreground" />
            <span className="truncate">docs.example.com/api</span>
          </div>
          <div className={cn(PANEL_STYLES.linkItem)}>
            <LinkIcon className="w-3 h-3 shrink-0 text-muted-foreground" />
            <span className="truncate">api.openai.com/v1</span>
          </div>
        </div>
      </section>

      {/* ========================================== */}
      {/* SECTION HEADER */}
      {/* ========================================== */}
      <section className="border rounded-lg p-4">
        <h2 className="text-lg font-semibold mb-4 font-mono">SectionHeader</h2>

        <div className="space-y-4">
          <SectionHeader
            title="Files"
            icon={<FileText className="w-3 h-3" />}
            count={5}
          />
          <SectionHeader
            title="Photos"
            icon={<ImageIcon className="w-3 h-3" />}
            count={12}
            collapsed
          />
          <SectionHeader
            title="Recordings"
            icon={<Mic className="w-3 h-3" />}
            count={3}
            action={<Badge variant="outline" className="h-6 px-2 cursor-pointer hover:bg-white/5"><Plus className="w-3 h-3 mr-1" />Add</Badge>}
          />
        </div>
      </section>

      {/* ========================================== */}
      {/* MEDIA ITEM (Compact) */}
      {/* ========================================== */}
      <section className="border rounded-lg p-4">
        <h2 className="text-lg font-semibold mb-2 font-mono">MediaItem (Compact)</h2>
        <p className="text-xs text-muted-foreground mb-4 font-mono">p-1.5, bg-[#1e1e24], rounded-[4px], h-6</p>

        <div className="space-y-2 max-w-md">
          <MediaItem
            type="file"
            name="document.pdf"
            url="#"
            size={1024000}
            compact
            onDownload={() => {}}
          />
          <MediaItem
            type="recording"
            name="meeting.wav"
            url="#"
            duration="3:45"
            compact
            onPlay={() => {}}
            onDownload={() => {}}
            onDelete={() => {}}
          />
        </div>
      </section>

      {/* ========================================== */}
      {/* IMAGE THUMBNAIL */}
      {/* ========================================== */}
      <section className="border rounded-lg p-4">
        <h2 className="text-lg font-semibold mb-2 font-mono">ImageThumbnail</h2>
        <p className="text-xs text-muted-foreground mb-4 font-mono">grid-cols-3, gap-1</p>

        <div className="grid grid-cols-3 gap-1 max-w-xs">
          <ImageThumbnail
            id="1"
            name="photo1.jpg"
            dataUrl="data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='100' height='100'%3E%3Crect fill='%2349a0a2' width='100' height='100'/%3E%3C/svg%3E"
            onView={() => {}}
            onDownload={() => {}}
            onDelete={() => {}}
          />
          <ImageThumbnail
            id="2"
            name="photo2.jpg"
            dataUrl="data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='100' height='100'%3E%3Crect fill='%2366a44c' width='100' height='100'/%3E%3C/svg%3E"
            onView={() => {}}
            onDownload={() => {}}
            onDelete={() => {}}
          />
          <ImageThumbnail
            id="3"
            name="photo3.jpg"
            dataUrl="data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='100' height='100'%3E%3Crect fill='%23ffe32e' width='100' height='100'/%3E%3C/svg%3E"
            onView={() => {}}
            onDownload={() => {}}
            onDelete={() => {}}
          />
        </div>
      </section>

      {/* ========================================== */}
      {/* CONTACT CARD - Delete Button Style */}
      {/* ========================================== */}
      <section className="border rounded-lg p-4 bg-[#0f0f13]">
        <h2 className="text-lg font-semibold mb-4 font-mono">Contact Card (delete = white/30, not red)</h2>

        <div className="max-w-lg">
          <div className="flex items-center justify-between p-2 rounded-[4px] bg-[#1e1e24]">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-full bg-primary flex items-center justify-center text-[10px] font-medium text-black">
                JD
              </div>
              <div className="flex flex-col">
                <span className="text-sm font-medium">John Doe</span>
                <span className="text-xs text-muted-foreground">Developer</span>
              </div>
            </div>
            <Button
              variant="ghost"
              size="icon"
              className="h-6 w-6 text-white/30 hover:text-white/50"
              onClick={() => {}}
            >
              <Trash2 className="w-3 h-3" />
            </Button>
          </div>
        </div>
      </section>
    </div>
  );
}
