import * as React from "react";
import { Tag, Link as LinkIcon, Users, Plus, X, ExternalLink } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui-elements/atoms/Badge";
import { cn } from "@/lib/utils";
import { SavedLink } from "@/store/notesStore";
import { SectionHeader } from "@/components/ui-elements/atoms/SectionHeader";
import { Tag as TagComponent } from "@/components/ui-elements/atoms/Tag";
import { Hyperlink } from "@/components/ui-elements/atoms/Hyperlink";
import { ContactCard, type Contact } from "@/components/ui-elements/molecules/ContactCard";
import {
  CELL_STYLE,
  GRID_LAYOUT,
  LABEL_STYLE,
  VALUE_STYLE,
  ICON_SIZE,
  ITEM_PADDING,
  RADIUS_CELL,
  RADIUS_PILL,
} from "../constants";

// Panel-specific styles
const PANEL_INPUT_CLASS = "h-6 px-2 rounded-[4px] bg-[#1e1e24] border border-transparent text-xs placeholder:text-muted-foreground/50 hover:border-white/10 focus:outline-none focus:border-white/15";
const LINK_ITEM_CLASS = "flex items-center gap-2 h-6 px-2 rounded-[4px] bg-[#1e1e24] text-xs hover:bg-white/5";

export interface ConnectionsSectionProps {
  tags?: string[];
  tagColors?: { [tagName: string]: string };
  links?: SavedLink[];
  contacts?: Contact[];
  onAddTag?: (tag: string) => void;
  onRemoveTag?: (tag: string) => void;
  onUpdateTagColor?: (tag: string, color: string) => void;
  onAddLink?: (url: string, title?: string) => void;
  onRemoveLink?: (linkId: string) => void;
  onUpdateLink?: (linkId: string, updates: Partial<SavedLink>) => void;
  onAddContact?: (contact: Omit<Contact, "id">) => void;
  onRemoveContact?: (contactId: string) => void;
  /** Tags from child items - displayed read-only */
  aggregatedTags?: string[];
  isBottomPanel?: boolean;
  className?: string;
}

export function ConnectionsSection({
  tags = [],
  tagColors = {},
  links = [],
  contacts = [],
  onAddTag,
  onRemoveTag,
  onUpdateTagColor,
  onAddLink,
  onRemoveLink,
  onUpdateLink,
  onAddContact,
  onRemoveContact,
  aggregatedTags = [],
  isBottomPanel = false,
  className,
}: ConnectionsSectionProps) {
  const [newTagName, setNewTagName] = React.useState("");
  const [newLinkUrl, setNewLinkUrl] = React.useState("");
  const [editingLinkId, setEditingLinkId] = React.useState<string | null>(null);

  const handleAddTag = () => {
    if (newTagName.trim() && onAddTag) {
      onAddTag(newTagName.trim().toLowerCase());
      setNewTagName("");
    }
  };

  const handleAddLink = () => {
    if (newLinkUrl.trim() && onAddLink) {
      let url = newLinkUrl.trim();
      if (!url.startsWith("http://") && !url.startsWith("https://")) {
        url = "https://" + url;
      }
      onAddLink(url);
      setNewLinkUrl("");
    }
  };

  if (isBottomPanel) {
    return (
      <div className={cn("space-y-4", className)}>
        {/* Tags */}
        {onAddTag && (
          <section>
            <SectionHeader
              title={`Tags (${tags.length})`}
              icon={<Tag className={ICON_SIZE} />}
            />
            <div className="flex gap-2">
              <input
                type="text"
                placeholder="Add tag..."
                value={newTagName}
                onChange={(e) => setNewTagName(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && handleAddTag()}
                className={PANEL_INPUT_CLASS}
              />
              <Badge
                variant="outline"
                className="h-6 px-2 cursor-pointer hover:bg-white/5"
                onClick={handleAddTag}
              >
                <Plus className="w-3 h-3 mr-1" />Add
              </Badge>
            </div>
            {(tags.length > 0 || aggregatedTags.length > 0) && (
              <div className="flex flex-wrap gap-1 mt-2">
                {tags.map((tag) => (
                  <TagComponent
                    key={tag}
                    label={tag}
                    color={tagColors[tag]}
                    size="sm"
                    removable
                    onRemove={onRemoveTag ? () => onRemoveTag(tag) : undefined}
                    showColorPicker={!!onUpdateTagColor}
                    onColorChange={onUpdateTagColor ? (color) => onUpdateTagColor(tag, color) : undefined}
                  />
                ))}
                {tags.length > 0 && aggregatedTags.length > 0 && (
                  <span className="text-muted-foreground text-xs self-center mx-1">|</span>
                )}
                {aggregatedTags.map((tag) => (
                  <TagComponent
                    key={`agg-${tag}`}
                    label={tag}
                    color={tagColors[tag]}
                    size="sm"
                    variant="subtle"
                  />
                ))}
              </div>
            )}
          </section>
        )}

        {/* Links */}
        {onAddLink && (
          <section>
            <SectionHeader
              title={`Links (${links.length})`}
              icon={<LinkIcon className={ICON_SIZE} />}
              action={
                <Badge
                  variant="outline"
                  className="h-6 px-2 cursor-pointer hover:bg-white/5"
                  onClick={handleAddLink}
                >
                  <Plus className="w-3 h-3 mr-1" />Add
                </Badge>
              }
            />
            {links.length > 0 && (
              <div className="space-y-1 mt-2">
                {links.map((link) => (
                  <div
                    key={link.id}
                    className={LINK_ITEM_CLASS}
                  >
                    <div className="flex items-center gap-2 min-w-0 flex-1">
                      <LinkIcon className={cn(ICON_SIZE, "shrink-0 text-muted-foreground")} />
                      {editingLinkId === link.id ? (
                        <input
                          type="text"
                          value={link.title || link.url}
                          onChange={(e) => onUpdateLink?.(link.id, { title: e.target.value })}
                          onBlur={() => setEditingLinkId(null)}
                          onKeyDown={(e) => e.key === "Enter" && setEditingLinkId(null)}
                          className="h-6 px-1 text-xs bg-transparent border-none focus:outline-none"
                          autoFocus
                        />
                      ) : (
                        <a
                          href={link.url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="truncate hover:underline"
                        >
                          {link.title || link.url}
                        </a>
                      )}
                    </div>
                    <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100">
                      {onUpdateLink && (
                        <button
                          onClick={() => setEditingLinkId(link.id)}
                          className="p-1 hover:bg-white/10 rounded"
                        >
                          <ExternalLink className="w-3 h-3" />
                        </button>
                      )}
                      {onRemoveLink && (
                        <button
                          onClick={() => onRemoveLink(link.id)}
                          className="p-1 hover:bg-white/10 rounded text-white/30 hover:text-white/50"
                        >
                          <X className="w-3 h-3" />
                        </button>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
            <input
              type="text"
              placeholder="https://..."
              value={newLinkUrl}
              onChange={(e) => setNewLinkUrl(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && handleAddLink()}
              className={PANEL_INPUT_CLASS}
            />
          </section>
        )}

        {/* Contacts */}
        {onAddContact && (
          <section>
            <SectionHeader
              title={`Contacts (${contacts.length})`}
              icon={<Users className={ICON_SIZE} />}
              action={
                <Badge
                  variant="outline"
                  className="h-6 px-2 cursor-pointer hover:bg-white/5"
                  onClick={onAddContact}
                >
                  <Plus className="w-3 h-3 mr-1" />Add
                </Badge>
              }
            />
            {contacts.length > 0 ? (
              <div className="space-y-1 mt-2">
                {contacts.map((contact) => (
                  <ContactCard
                    key={contact.id}
                    contact={contact}
                    compact
                    onDelete={onRemoveContact ? () => onRemoveContact(contact.id) : undefined}
                  />
                ))}
              </div>
            ) : (
              <p className="text-xs text-muted-foreground mt-2">No contacts</p>
            )}
          </section>
        )}
      </div>
    );
  }

  return (
    <div className={cn("space-y-4", className)}>
      {/* Tags */}
      {onAddTag && (
        <section>
          <SectionHeader
            title={`Tags (${tags.length})`}
            icon={<Tag className={ICON_SIZE} />}
          />
          {(tags.length > 0 || aggregatedTags.length > 0) && (
            <div className="flex flex-wrap gap-2 mt-2">
              {tags.map((tag) => (
                <TagComponent
                  key={tag}
                  label={tag}
                  color={tagColors[tag]}
                  size="md"
                  removable
                  onRemove={onRemoveTag ? () => onRemoveTag(tag) : undefined}
                  showColorPicker={!!onUpdateTagColor}
                  onColorChange={onUpdateTagColor ? (color) => onUpdateTagColor(tag, color) : undefined}
                />
              ))}
              {tags.length > 0 && aggregatedTags.length > 0 && (
                <span className="text-muted-foreground text-xs self-center mx-1">|</span>
              )}
              {aggregatedTags.map((tag) => (
                <TagComponent
                  key={`agg-${tag}`}
                  label={tag}
                  color={tagColors[tag]}
                  size="md"
                  variant="subtle"
                />
              ))}
            </div>
          )}
          <div className="flex gap-2 mt-2">
            <input
              type="text"
              placeholder="Add tag..."
              value={newTagName}
              onChange={(e) => setNewTagName(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && handleAddTag()}
              className={PANEL_INPUT_CLASS}
            />
            <Badge
              variant="outline"
              className="h-6 px-2 cursor-pointer hover:bg-white/5"
              onClick={handleAddTag}
            >
              Add Tag
            </Badge>
          </div>
        </section>
      )}

      {/* Links */}
      {onAddLink && (
        <section>
          <SectionHeader
            title={`Links (${links.length})`}
            icon={<LinkIcon className={ICON_SIZE} />}
          />
          {links.length > 0 && (
            <div className="space-y-2 mt-2">
              {links.map((link) => (
                <div
                  key={link.id}
                  className={cn("flex items-center justify-between group", LINK_ITEM_CLASS)}
                >
                  <div className="flex items-center gap-2 min-w-0 flex-1">
                    <LinkIcon className={cn(ICON_SIZE, "shrink-0 text-muted-foreground")} />
                    {editingLinkId === link.id ? (
                      <input
                        type="text"
                        value={link.title || link.url}
                        onChange={(e) => onUpdateLink?.(link.id, { title: e.target.value })}
                        onBlur={() => setEditingLinkId(null)}
                        onKeyDown={(e) => e.key === "Enter" && setEditingLinkId(null)}
                        className="h-6 px-1 text-xs bg-transparent border-none focus:outline-none"
                        autoFocus
                      />
                    ) : (
                      <Hyperlink
                        href={link.url}
                        title={link.title}
                        onEdit={onUpdateLink ? () => setEditingLinkId(link.id) : undefined}
                        onDelete={onRemoveLink ? () => onRemoveLink(link.id) : undefined}
                      />
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
          <div className="flex gap-2 mt-2">
            <input
              type="text"
              placeholder="https://..."
              value={newLinkUrl}
              onChange={(e) => setNewLinkUrl(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && handleAddLink()}
              className={PANEL_INPUT_CLASS}
            />
            <Badge
              variant="outline"
              className="h-6 px-2 cursor-pointer hover:bg-white/5"
              onClick={handleAddLink}
            >
              Add Link
            </Badge>
          </div>
        </section>
      )}

      {/* Contacts */}
      {onAddContact && (
        <section>
          <SectionHeader
            title={`Contacts (${contacts.length})`}
            icon={<Users className={ICON_SIZE} />}
            action={
              <Badge variant="outline" className="h-6 px-2 cursor-pointer hover:bg-white/5">
                <Plus className="w-3 h-3 mr-1" />Add
              </Badge>
            }
          />
          {contacts.length > 0 ? (
            <div className="space-y-2 mt-2">
              {contacts.map((contact) => (
                <ContactCard
                  key={contact.id}
                  contact={contact}
                  onDelete={onRemoveContact ? () => onRemoveContact(contact.id) : undefined}
                />
              ))}
            </div>
          ) : (
            <p className="text-xs text-muted-foreground mt-2">No contacts linked</p>
          )}
        </section>
      )}
    </div>
  );
}
