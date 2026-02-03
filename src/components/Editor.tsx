import { useState, useRef, useEffect } from "react";
import {
  Code,
  Eye,
  MoreHorizontal,
  Star,
  Trash2,
  Plus,
  ListTodo,
  Target,
  Calendar,
  Music,
  Image as ImageIcon,
  Link as LinkIcon,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
  DropdownMenuLabel,
} from "@/components/ui/dropdown-menu";
import { cn } from "@/lib/utils";

interface EditorProps {
  noteId?: string;
}

export const Editor = ({ noteId }: EditorProps) => {
  const [mode, setMode] = useState<"edit" | "preview">("edit");
  const [content, setContent] = useState(`# Project Tasks Summary

This document outlines the refactoring and animation tasks discussed.

## ✅ Task 1: Deprecate Custom Design System

The initial task was to refactor the entire frontend to remove the custom CSS utility classes defined in index.css.

### Implementation:

- All custom classes (e.g., .text-display-large, .padding-section, .gap-component) were removed from src/index.css.
- Components were updated to use standard, inline **Tailwind CSS classes** directly.

## ✅ Task 2: Synchronize Hero Component Animations

The hover animation on the arrow icon in DetailHero.jsx was updated to match the one in HomeHero.jsx.

### Implementation:

- **Framer Motion** was used to create a dual-arrow "bounce" effect.
- State management (useState) was added to track the hover state.
`);
  const previewRef = useRef<HTMLDivElement>(null);

  const insertAttachment = (type: string) => {
    const attachmentTemplates: Record<string, string> = {
      Planning: `\n\n## 📋 Planning\n\n### 🎯 High Level Goals\n- \n\n### ⚡ Medium Level Tasks\n- \n\n### ✅ Day Level Tasks\n- \n`,
      "Task List": `\n\n## ✓ Tasks\n- [ ] \n- [ ] \n- [ ] \n`,
      Songs: `\n\n## 🎵 Songs\n- [Song Title](URL)\n- \n`,
      Images: `\n\n## 🖼️ Images\n![Alt text](image-url)\n`,
      Links: `\n\n## 🔗 Links\n- [Link Title](URL)\n- \n`,
      Calendar: `\n\n## 📅 Calendar Event\n**Event:** \n**Date:** \n**Time:** \n**Reminder:** \n`,
    };

    const template = attachmentTemplates[type] || "";
    setContent((prev) => prev + template);
  };

  const attachmentTypes = [
    { icon: Target, label: "Planning", description: "High/Medium/Day level" },
    { icon: ListTodo, label: "Task List", description: "Todo items" },
    { icon: Music, label: "Songs", description: "YouTube or Spotify" },
    { icon: ImageIcon, label: "Images", description: "Upload or paste" },
    { icon: LinkIcon, label: "Links", description: "Web links" },
    { icon: Calendar, label: "Calendar", description: "Events & reminders" },
  ];

  if (!noteId) {
    return (
      <div className="flex-1 bg-editor-bg flex items-center justify-center">
        <div className="text-center space-y-4">
          <div className="w-16 h-16 rounded-full bg-muted mx-auto flex items-center justify-center">
            <Code className="w-8 h-8 text-muted-foreground" />
          </div>
          <div>
            <h3 className="text-lg font-medium text-foreground mb-2">No note selected</h3>
            <p className="text-sm text-muted-foreground">
              Select a note from the list or create a new one
            </p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="flex-1 bg-editor-bg flex flex-col">
      {/* Editor Header */}
      <div className="h-14 border-b border-border px-6 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setMode("edit")}
            className={cn(
              "gap-2",
              mode === "edit" && "bg-muted text-foreground"
            )}
          >
            <Code className="w-4 h-4" />
            Edit
          </Button>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setMode("preview")}
            className={cn(
              "gap-2",
              mode === "preview" && "bg-muted text-foreground"
            )}
          >
            <Eye className="w-4 h-4" />
            Preview
          </Button>
        </div>

        <div className="flex items-center gap-2">
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button
                variant="ghost"
                size="sm"
                className="gap-2 bg-primary hover:bg-primary-hover text-primary-foreground"
              >
                <Plus className="w-4 h-4" />
                Add Attachment
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-56 bg-popover border-border">
              <DropdownMenuLabel className="text-xs text-muted-foreground uppercase">
                Insert
              </DropdownMenuLabel>
              {attachmentTypes.map((type) => (
                <DropdownMenuItem
                  key={type.label}
                  onClick={() => insertAttachment(type.label)}
                  className="cursor-pointer hover:bg-muted focus:bg-muted"
                >
                  <type.icon className="w-4 h-4 mr-3 text-muted-foreground" />
                  <div className="flex-1">
                    <div className="text-sm font-medium text-foreground">{type.label}</div>
                    <div className="text-xs text-muted-foreground">{type.description}</div>
                  </div>
                </DropdownMenuItem>
              ))}
            </DropdownMenuContent>
          </DropdownMenu>

          <Button variant="ghost" size="icon" className="w-9 h-9">
            <Star className="w-4 h-4" />
          </Button>

          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="icon" className="w-9 h-9">
                <MoreHorizontal className="w-4 h-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-48 bg-popover border-border">
              <DropdownMenuItem className="cursor-pointer hover:bg-muted focus:bg-muted">
                Duplicate
              </DropdownMenuItem>
              <DropdownMenuItem className="cursor-pointer hover:bg-muted focus:bg-muted">
                Export
              </DropdownMenuItem>
              <DropdownMenuSeparator className="bg-border" />
              <DropdownMenuItem className="cursor-pointer text-destructive hover:bg-destructive/10 focus:bg-destructive/10">
                <Trash2 className="w-4 h-4 mr-2" />
                Delete
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>

      {/* Editor Content */}
      <div className="flex-1 overflow-hidden">
        <Textarea
          value={content}
          onChange={(e) => setContent(e.target.value)}
          className={cn(
            "w-full h-full resize-none border-0 bg-transparent px-6 py-6 leading-relaxed focus-visible:ring-0",
            mode === "edit" ? "font-mono text-sm" : "font-sans text-base"
          )}
          placeholder="Start writing..."
        />
      </div>
    </div>
  );
};
