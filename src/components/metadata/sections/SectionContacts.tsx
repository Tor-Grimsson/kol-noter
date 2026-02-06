import * as React from "react";
import { UserAvatar } from "@/components/ui-elements/atoms/Avatar";
import { Badge } from "@/components/ui-elements/atoms/Badge";
import { Hyperlink } from "@/components/ui-elements/atoms/Hyperlink";
import { SectionHeader } from "@/components/ui-elements/atoms/SectionHeader";
import { LabeledInput } from "@/components/ui-elements/atoms/LabeledInput";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui-elements/atoms/Button";
import { Edit2, Trash2, X, ChevronDown, ChevronUp, Mail, Phone, Globe } from "lucide-react";

export interface Contact {
  id: string;
  name: string;
  role?: string;
  email?: string;
  phone?: string;
  socials?: string;
  imageUrl?: string;
}

export interface ContactCardProps {
  contact: Contact;
  onEdit?: () => void;
  onDelete?: () => void;
  onUpdate?: (updates: Partial<Contact>) => void;
  compact?: boolean;
  className?: string;
}

export function ContactCard({
  contact,
  onEdit,
  onDelete,
  onUpdate,
  compact = false,
  className,
}: ContactCardProps) {
  const [isExpanded, setIsExpanded] = React.useState(false);

  if (compact) {
    return (
      <div className={cn("space-y-2", className)}>
        {/* Header row: Avatar + Name/Role - always visible */}
        <div
          className={cn(
            "flex items-center gap-2 cursor-pointer select-none",
            isExpanded && "mb-2"
          )}
          onClick={() => onUpdate ? setIsExpanded(!isExpanded) : onEdit?.()}
        >
          <div className="w-6 h-6 rounded-full bg-primary flex items-center justify-center text-[10px] font-medium text-black shrink-0">
            {contact.name.split(" ").map((n) => n[0]).join("").slice(0, 2).toUpperCase()}
          </div>
          <div className="flex flex-col min-w-0 flex-1">
            {onUpdate ? (
              <input
                type="text"
                value={contact.name}
                onChange={(e) => onUpdate({ name: e.target.value })}
                placeholder="Name"
                className="text-xs font-medium bg-transparent border-none p-0 focus:outline-none"
              />
            ) : (
              <span className="text-xs font-medium truncate">{contact.name}</span>
            )}
            {onUpdate ? (
              <input
                type="text"
                value={contact.role || ""}
                onChange={(e) => onUpdate({ role: e.target.value || undefined })}
                placeholder="Title"
                className="text-[10px] text-muted-foreground bg-transparent border-none p-0 focus:outline-none"
              />
            ) : (
              contact.role && (
                <span className="text-[10px] text-muted-foreground truncate">
                  {contact.role}
                </span>
              )
            )}
          </div>
          {onUpdate && (
            <div className="flex items-center gap-1">
              {isExpanded ? (
                <ChevronUp className="w-3 h-3 text-muted-foreground" />
              ) : (
                <ChevronDown className="w-3 h-3 text-muted-foreground" />
              )}
            </div>
          )}
        </div>

        {/* Expanded content - email, phone, socials */}
        {isExpanded && onUpdate && (
          <div className="space-y-3 pl-8">
            {/* Email */}
            <div className="flex items-center gap-2">
              <Mail className="w-3 h-3 text-muted-foreground shrink-0" />
              {onUpdate ? (
                <input
                  type="email"
                  value={contact.email || ""}
                  onChange={(e) => onUpdate({ email: e.target.value || undefined })}
                  placeholder="email@example.com"
                  className="text-xs bg-transparent border-none p-0 focus:outline-none flex-1"
                />
              ) : contact.email ? (
                <a
                  href={`mailto:${contact.email}`}
                  className="text-xs hover:underline truncate"
                >
                  {contact.email}
                </a>
              ) : (
                <span className="text-xs text-muted-foreground italic">Add email</span>
              )}
            </div>

            {/* Phone */}
            <div className="flex items-center gap-2">
              <Phone className="w-3 h-3 text-muted-foreground shrink-0" />
              {onUpdate ? (
                <input
                  type="tel"
                  value={contact.phone || ""}
                  onChange={(e) => onUpdate({ phone: e.target.value || undefined })}
                  placeholder="+1 234 567 8900"
                  className="text-xs bg-transparent border-none p-0 focus:outline-none flex-1"
                />
              ) : contact.phone ? (
                <a
                  href={`tel:${contact.phone}`}
                  className="text-xs hover:underline truncate"
                >
                  {contact.phone}
                </a>
              ) : (
                <span className="text-xs text-muted-foreground italic">Add phone</span>
              )}
            </div>

            {/* Socials */}
            <div className="flex items-center gap-2">
              <Globe className="w-3 h-3 text-muted-foreground shrink-0" />
              {onUpdate ? (
                <input
                  type="text"
                  value={contact.socials || ""}
                  onChange={(e) => onUpdate({ socials: e.target.value || undefined })}
                  placeholder="@handle or URL"
                  className="text-xs bg-transparent border-none p-0 focus:outline-none flex-1"
                />
              ) : contact.socials ? (
                <a
                  href={contact.socials.startsWith('@') ? `https://twitter.com/${contact.socials.slice(1)}` : contact.socials}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-xs hover:underline truncate"
                >
                  {contact.socials}
                </a>
              ) : (
                <span className="text-xs text-muted-foreground italic">Add socials</span>
              )}
            </div>

            {/* Actions */}
            <div className="flex items-center gap-2 pt-1">
              {onDelete && (
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    onDelete();
                  }}
                  className="p-1 hover:bg-white/10 rounded text-white/30 hover:text-white/50"
                >
                  <X className="w-3 h-3" />
                </button>
              )}
            </div>
          </div>
        )}
      </div>
    );
  }

  return (
    <div
      className={cn(
        "flex items-center justify-between p-2 rounded border bg-card",
        className
      )}
    >
      <div className="flex items-center gap-3">
        <UserAvatar name={contact.name} size="md" />
        <div className="flex flex-col">
          <span className="text-sm font-medium">{contact.name}</span>
          {contact.role && (
            <span className="text-xs text-muted-foreground">{contact.role}</span>
          )}
          <div className="flex items-center gap-2 mt-1">
            {contact.email && (
              <a
                href={`mailto:${contact.email}`}
                className="text-xs text-primary hover:underline"
              >
                {contact.email}
              </a>
            )}
            {contact.phone && (
              <a
                href={`tel:${contact.phone}`}
                className="text-xs text-primary hover:underline"
              >
                {contact.phone}
              </a>
            )}
          </div>
        </div>
      </div>
      {(onEdit || onDelete) && (
        <div className="flex items-center gap-1">
          {onEdit && (
            <Button variant="ghost" size="icon" className="h-6 w-6" onClick={onEdit}>
              <Edit2 className="w-3 h-3" />
            </Button>
          )}
          {onDelete && (
            <Button
              variant="ghost"
              size="icon"
              className="h-6 w-6 text-[#ce4646] hover:text-[#ce4646]/70"
              onClick={onDelete}
            >
              <Trash2 className="w-3 h-3" />
            </Button>
          )}
        </div>
      )}
    </div>
  );
}

export interface ContactListProps {
  contacts: Contact[];
  title?: string;
  onAddContact?: () => void;
  onEditContact?: (contact: Contact) => void;
  onDeleteContact?: (contactId: string) => void;
  emptyMessage?: string;
  className?: string;
}

export function ContactList({
  contacts,
  title = "Contacts",
  onAddContact,
  onEditContact,
  onDeleteContact,
  emptyMessage = "No contacts",
  className,
}: ContactListProps) {
  return (
    <div className={cn("", className)}>
      <SectionHeader
        title={title}
        count={contacts.length}
        action={
          onAddContact && (
            <Button variant="ghost" size="sm" className="h-5 text-xs">
              + Add
            </Button>
          )
        }
      />
      {contacts.length > 0 ? (
        <div className="space-y-1">
          {contacts.map((contact) => (
            <ContactCard
              key={contact.id}
              contact={contact}
              compact
              onEdit={onEditContact ? () => onEditContact(contact) : undefined}
              onDelete={onDeleteContact ? () => onDeleteContact(contact.id) : undefined}
            />
          ))}
        </div>
      ) : (
        <p className="text-xs text-muted-foreground">{emptyMessage}</p>
      )}
    </div>
  );
}
