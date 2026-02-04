import * as React from "react";
import { UserAvatar } from "../atoms/Avatar";
import { Badge } from "../atoms/Badge";
import { Hyperlink } from "../atoms/Hyperlink";
import { SectionHeader } from "../atoms/SectionHeader";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Edit2, Trash2 } from "lucide-react";

export interface Contact {
  id: string;
  name: string;
  role?: string;
  email?: string;
  phone?: string;
  imageUrl?: string;
}

export interface ContactCardProps {
  contact: Contact;
  onEdit?: () => void;
  onDelete?: () => void;
  compact?: boolean;
  className?: string;
}

export function ContactCard({
  contact,
  onEdit,
  onDelete,
  compact = false,
  className,
}: ContactCardProps) {
  if (compact) {
    return (
      <div className={cn("inline-flex items-center gap-2", className)}>
        <div className="w-8 h-8 rounded-full bg-primary flex items-center justify-center text-[10px] font-medium text-black">
          {contact.name.split(" ").map((n) => n[0]).join("").slice(0, 2).toUpperCase()}
        </div>
        <div className="flex flex-col">
          <span className="text-sm font-medium truncate max-w-[120px]">{contact.name}</span>
          {contact.role && (
            <span className="text-xs text-muted-foreground truncate max-w-[120px]">
              {contact.role}
            </span>
          )}
        </div>
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
