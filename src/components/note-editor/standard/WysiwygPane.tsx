import { useEffect, useCallback, useRef } from "react";
import { useEditor, EditorContent } from "@tiptap/react";
import StarterKit from "@tiptap/starter-kit";
import Image from "@tiptap/extension-image";
import Link from "@tiptap/extension-link";
import Underline from "@tiptap/extension-underline";
import Placeholder from "@tiptap/extension-placeholder";
import { Markdown } from "tiptap-markdown";
import { CustomHeading } from "./extensions/CustomHeading";
import { resolveAssetUrl } from "@/lib/persistence/asset-resolver";
import "./wysiwyg-styles.css";
import type { Editor } from "@tiptap/react";

// ── Obsidian image helpers ────────────────────────────────────────

const OBSIDIAN_RE = /!\[\[([^\]]+)\]\]/g;
const OBSIDIAN_MARKER = "obsidian://";

/**
 * Convert `![[filename]]` → `![obsidian](obsidian://filename)` so TipTap
 * can parse it as a standard image node. We tag the src with "obsidian://"
 * so we can reverse it on save.
 */
function obsidianToStandard(
  md: string,
  noteAssetBasePath?: string,
  attachments?: Record<string, string>,
  photos?: Array<{ id: string; name: string; dataUrl: string; addedAt: number }>
): string {
  return md.replace(OBSIDIAN_RE, (_, filename: string) => {
    let src = "";
    if (noteAssetBasePath) {
      src = resolveAssetUrl(noteAssetBasePath, filename);
    } else if (attachments?.[filename]) {
      src = attachments[filename];
    } else if (photos) {
      const photo = photos.find((p) => p.name === filename);
      if (photo?.dataUrl) src = photo.dataUrl;
    }
    // Encode the original filename in the alt text so we can reconstruct on save
    return `![${OBSIDIAN_MARKER}${filename}](${src || filename})`;
  });
}

/**
 * Reverse: convert `![obsidian://filename](url)` back to `![[filename]]`
 */
function standardToObsidian(md: string): string {
  // Match ![obsidian://filename](anything)
  const re = /!\[obsidian:\/\/([^\]]+)\]\([^)]*\)/g;
  return md.replace(re, (_, filename: string) => `![[${filename}]]`);
}

// ── Component ─────────────────────────────────────────────────────

interface WysiwygPaneProps {
  content: string;
  onChange: (content: string) => void;
  attachments?: Record<string, string>;
  photos?: Array<{ id: string; name: string; dataUrl: string; addedAt: number }>;
  onAddPhoto?: (name: string, dataUrl: string) => void;
  noteAssetBasePath?: string;
  onEditorReady?: (editor: Editor) => void;
}

export const WysiwygPane = ({
  content,
  onChange,
  attachments,
  photos,
  onAddPhoto,
  noteAssetBasePath,
  onEditorReady,
}: WysiwygPaneProps) => {
  // Refs to avoid stale closures in callbacks
  const contentRef = useRef(content);
  contentRef.current = content;
  const onChangeRef = useRef(onChange);
  onChangeRef.current = onChange;
  const onAddPhotoRef = useRef(onAddPhoto);
  onAddPhotoRef.current = onAddPhoto;
  const noteAssetBasePathRef = useRef(noteAssetBasePath);
  noteAssetBasePathRef.current = noteAssetBasePath;

  const editor = useEditor({
    extensions: [
      StarterKit.configure({
        heading: false,
      }),
      CustomHeading.configure({ levels: [1, 2, 3, 4] }),
      Underline,
      Image.configure({
        inline: false,
        HTMLAttributes: { class: "rounded-lg shadow-md max-w-full my-4" },
      }),
      Link.configure({
        openOnClick: false,
        HTMLAttributes: { class: "text-primary" },
      }),
      Placeholder.configure({
        placeholder: "Start writing...",
      }),
      Markdown.configure({
        html: false,
        transformCopiedText: true,
        transformPastedText: true,
      }),
    ],
    content: obsidianToStandard(content, noteAssetBasePath, attachments, photos),
    onUpdate: ({ editor }) => {
      const md = editor.storage.markdown.getMarkdown() as string;
      const restored = standardToObsidian(md);
      onChangeRef.current(restored);
    },
    editorProps: {
      handlePaste: (view, event) => {
        const items = event.clipboardData?.items;
        if (!items) return false;

        for (let i = 0; i < items.length; i++) {
          const item = items[i];
          if (item.type.startsWith("image/")) {
            event.preventDefault();
            const file = item.getAsFile();
            if (!file) return true;

            const reader = new FileReader();
            reader.onload = () => {
              const now = new Date();
              const timestamp =
                now.getFullYear().toString() +
                String(now.getMonth() + 1).padStart(2, "0") +
                String(now.getDate()).padStart(2, "0") +
                String(now.getHours()).padStart(2, "0") +
                String(now.getMinutes()).padStart(2, "0") +
                String(now.getSeconds()).padStart(2, "0");
              const filename = `pasted-image-${timestamp}.png`;

              // Resolve a renderable src for the editor
              let src = reader.result as string;
              if (noteAssetBasePathRef.current) {
                // Will resolve once the file is saved — use data URL temporarily
                src = reader.result as string;
              }

              // Insert image node into TipTap
              const ed = view.state.tr;
              const imgNode = view.state.schema.nodes.image?.create({
                src,
                alt: `${OBSIDIAN_MARKER}${filename}`,
              });
              if (imgNode) {
                view.dispatch(ed.replaceSelectionWith(imgNode));
              }

              // Save as photo
              if (onAddPhotoRef.current) {
                onAddPhotoRef.current(filename, reader.result as string);
              }
            };
            reader.readAsDataURL(file);
            return true;
          }
        }
        return false;
      },
    },
  });

  // Notify parent when editor is ready
  useEffect(() => {
    if (editor && onEditorReady) {
      onEditorReady(editor);
    }
  }, [editor, onEditorReady]);

  // Sync content when note changes (prop-driven switch)
  useEffect(() => {
    if (!editor) return;
    const currentMd = standardToObsidian(
      editor.storage.markdown.getMarkdown() as string
    );
    if (currentMd !== content) {
      const processed = obsidianToStandard(
        content,
        noteAssetBasePath,
        attachments,
        photos
      );
      editor.commands.setContent(processed);
    }
  }, [content, editor]); // eslint-disable-line react-hooks/exhaustive-deps

  if (!editor) return null;

  return (
    <div className="flex-1 h-full overflow-auto">
      <EditorContent editor={editor} className="min-h-full" />
    </div>
  );
};
