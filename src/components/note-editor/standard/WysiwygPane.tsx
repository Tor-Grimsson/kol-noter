import { useEffect, useCallback, useRef } from "react";
import { useEditor, EditorContent } from "@tiptap/react";
import StarterKit from "@tiptap/starter-kit";
import Image from "@tiptap/extension-image";
import Link from "@tiptap/extension-link";
import Underline from "@tiptap/extension-underline";
import Placeholder from "@tiptap/extension-placeholder";
import { Markdown } from "tiptap-markdown";
import { SyntaxReveal } from "./extensions/syntax-reveal-plugin";
import { resolveAssetUrl } from "@/lib/persistence/asset-resolver";
import "./wysiwyg-styles.css";
import type { Editor } from "@tiptap/react";
import type { Node as PmNode } from "@tiptap/pm/model";

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
  const attachmentsRef = useRef(attachments);
  attachmentsRef.current = attachments;
  const photosRef = useRef(photos);
  photosRef.current = photos;

  const editor = useEditor({
    extensions: [
      StarterKit.configure({
        heading: { levels: [1, 2, 3, 4] },
      }),
      SyntaxReveal,
      Underline,
      Image.extend({
        addNodeView() {
          const basePathRef = noteAssetBasePathRef;
          const attachmentsRef_ = attachmentsRef;
          const photosRef_ = photosRef;
          return ({ node: initialNode, editor, getPos }) => {
            let node = initialNode;
            let editing = false;
            let contextMenu: HTMLDivElement | null = null;

            const wrapper = document.createElement("div");
            wrapper.className = "image-node-wrapper";

            const img = document.createElement("img");
            img.src = node.attrs.src || "";
            img.alt = node.attrs.alt || "";
            img.className = "rounded-lg shadow-md max-w-full my-4";
            img.draggable = false;

            const input = document.createElement("input");
            input.className = "image-syntax-input";
            input.type = "text";
            input.style.display = "none";

            wrapper.appendChild(input);
            wrapper.appendChild(img);

            // ── Right-click context menu ──────────────────────────
            const dismissMenu = () => {
              if (contextMenu) {
                contextMenu.remove();
                contextMenu = null;
              }
            };

            const onClickOutside = (e: MouseEvent) => {
              if (contextMenu && !contextMenu.contains(e.target as Node)) {
                dismissMenu();
                document.removeEventListener("mousedown", onClickOutside);
                document.removeEventListener("keydown", onEscKey);
              }
            };

            const onEscKey = (e: KeyboardEvent) => {
              if (e.key === "Escape") {
                dismissMenu();
                document.removeEventListener("mousedown", onClickOutside);
                document.removeEventListener("keydown", onEscKey);
              }
            };

            const onScroll = () => {
              dismissMenu();
              document.removeEventListener("mousedown", onClickOutside);
              document.removeEventListener("keydown", onEscKey);
            };

            img.addEventListener("contextmenu", (e) => {
              e.preventDefault();
              e.stopPropagation();
              dismissMenu();

              const menu = document.createElement("div");
              menu.style.cssText = `
                position: fixed;
                left: ${e.clientX}px;
                top: ${e.clientY}px;
                z-index: 9999;
                background: hsl(var(--popover));
                color: hsl(var(--popover-foreground));
                border: 1px solid hsl(var(--border));
                border-radius: 6px;
                padding: 4px;
                box-shadow: 0 4px 12px rgba(0,0,0,0.15);
                min-width: 120px;
              `;

              const deleteBtn = document.createElement("button");
              deleteBtn.textContent = "Delete";
              deleteBtn.style.cssText = `
                display: block;
                width: 100%;
                padding: 6px 12px;
                text-align: left;
                background: transparent;
                border: none;
                border-radius: 4px;
                color: inherit;
                font-size: 13px;
                cursor: pointer;
              `;
              deleteBtn.addEventListener("mouseenter", () => {
                deleteBtn.style.background = "hsl(var(--accent))";
              });
              deleteBtn.addEventListener("mouseleave", () => {
                deleteBtn.style.background = "transparent";
              });
              deleteBtn.addEventListener("click", () => {
                const pos = typeof getPos === "function" ? getPos() : undefined;
                if (pos !== undefined) {
                  editor
                    .chain()
                    .focus()
                    .deleteRange({ from: pos, to: pos + node.nodeSize })
                    .run();
                }
                dismissMenu();
              });

              menu.appendChild(deleteBtn);
              document.body.appendChild(menu);
              contextMenu = menu;

              document.addEventListener("mousedown", onClickOutside);
              document.addEventListener("keydown", onEscKey);
              window.addEventListener("scroll", onScroll, { capture: true, once: true });
            });

            const getFilename = (n: PmNode) => {
              const alt = (n.attrs.alt as string) || "";
              return alt.startsWith(OBSIDIAN_MARKER)
                ? alt.slice(OBSIDIAN_MARKER.length)
                : alt || "image";
            };

            const startEditing = () => {
              if (editing) return;
              editing = true;
              input.value = `![[${getFilename(node)}]]`;
              input.style.display = "block";
              wrapper.classList.add("image-editing");
              input.addEventListener("focus", function deselect() {
                input.removeEventListener("focus", deselect);
                requestAnimationFrame(() => {
                  const len = input.value.length;
                  input.setSelectionRange(len, len);
                });
              });
              input.focus();
            };

            const stopEditing = (cancelled = false) => {
              if (!editing) return;
              editing = false;
              input.style.display = "none";
              wrapper.classList.remove("image-editing");
              if (cancelled) return;

              const value = input.value.trim();
              const pos = typeof getPos === "function" ? getPos() : undefined;
              if (pos === undefined) return;

              if (!value || value === "![[]]") {
                editor
                  .chain()
                  .focus()
                  .deleteRange({ from: pos, to: pos + node.nodeSize })
                  .run();
                return;
              }

              const match = value.match(/^!\[\[(.+)\]\]$/);
              if (match) {
                const newFilename = match[1];
                const currentFilename = getFilename(node);
                if (newFilename !== currentFilename) {
                  let newSrc = newFilename;
                  if (basePathRef.current) {
                    newSrc = resolveAssetUrl(basePathRef.current, newFilename);
                  } else if (attachmentsRef_.current?.[newFilename]) {
                    newSrc = attachmentsRef_.current[newFilename];
                  } else if (photosRef_.current) {
                    const photo = photosRef_.current.find(
                      (p) => p.name === newFilename
                    );
                    if (photo?.dataUrl) newSrc = photo.dataUrl;
                  }
                  editor
                    .chain()
                    .focus()
                    .command(({ tr }) => {
                      tr.setNodeMarkup(pos, undefined, {
                        ...node.attrs,
                        alt: `${OBSIDIAN_MARKER}${newFilename}`,
                        src: newSrc,
                      });
                      return true;
                    })
                    .run();
                }
              }
            };

            img.addEventListener("mousedown", (e) => {
              e.preventDefault();
              startEditing();
            });

            input.addEventListener("blur", () => stopEditing());

            input.addEventListener("keydown", (e) => {
              if (e.key === "Enter") {
                e.preventDefault();
                input.blur();
              } else if (e.key === "Escape") {
                e.preventDefault();
                stopEditing(true);
                editor.commands.focus();
              }
            });

            return {
              dom: wrapper,
              update(updatedNode: PmNode) {
                if (updatedNode.type.name !== "image") return false;
                node = updatedNode;
                img.src = updatedNode.attrs.src || "";
                img.alt = updatedNode.attrs.alt || "";
                return true;
              },
              stopEvent(event: Event) {
                if (contextMenu?.contains(event.target as Node)) return true;
                return editing && wrapper.contains(event.target as Node);
              },
              ignoreMutation() {
                return true;
              },
              destroy() {
                dismissMenu();
              },
            };
          };
        },
      }).configure({
        inline: false,
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
      <EditorContent editor={editor} className="h-full" />
    </div>
  );
};
