import { Extension } from "@tiptap/core";
import { Plugin, PluginKey } from "@tiptap/pm/state";
import { Decoration, DecorationSet } from "@tiptap/pm/view";
import type { Node as PmNode, MarkType } from "@tiptap/pm/model";

const syntaxRevealKey = new PluginKey("syntaxReveal");

/** Syntax characters for each mark type */
const MARK_SYNTAX: Record<string, [string, string]> = {
  bold: ["**", "**"],
  italic: ["*", "*"],
  underline: ["<u>", "</u>"],
  code: ["`", "`"],
};

/**
 * Find the contiguous range of a mark around the cursor position.
 */
function findMarkRange(
  parent: PmNode,
  parentStart: number,
  cursorPos: number,
  markType: MarkType
): { from: number; to: number } | null {
  let rangeStart = -1;
  let rangeEnd = -1;
  let found: { from: number; to: number } | null = null;

  parent.forEach((child, offset) => {
    if (found) return;
    const childStart = parentStart + offset;
    const childEnd = childStart + child.nodeSize;
    const hasMark = markType.isInSet(child.marks);

    if (hasMark) {
      if (rangeStart === -1) rangeStart = childStart;
      rangeEnd = childEnd;
    } else {
      if (rangeStart !== -1 && cursorPos >= rangeStart && cursorPos <= rangeEnd) {
        found = { from: rangeStart, to: rangeEnd };
      }
      rangeStart = -1;
      rangeEnd = -1;
    }
  });

  if (!found && rangeStart !== -1 && cursorPos >= rangeStart && cursorPos <= rangeEnd) {
    found = { from: rangeStart, to: rangeEnd };
  }

  return found;
}

/** Create a widget span element */
function makeWidget(text: string, className: string): HTMLSpanElement {
  const span = document.createElement("span");
  span.className = className;
  span.textContent = text;
  return span;
}

export const SyntaxReveal = Extension.create({
  name: "syntaxReveal",

  addProseMirrorPlugins() {
    return [
      new Plugin({
        key: syntaxRevealKey,
        props: {
          decorations(state) {
            const { selection, doc, schema } = state;
            const decorations: Decoration[] = [];
            const from = selection.from;

            // ── Heading syntax reveal ──────────────────────────
            const $from = selection.$from;
            for (let depth = $from.depth; depth > 0; depth--) {
              const node = $from.node(depth);
              if (node.type.name === "heading") {
                const level = node.attrs.level as number;
                const prefix = "#".repeat(level) + " ";
                const pos = $from.start(depth);

                decorations.push(
                  Decoration.widget(pos, makeWidget(prefix, "syntax-marker"), {
                    side: -1,
                  })
                );
                break;
              }
            }

            // ── Inline mark syntax reveal ─────────────────────
            if (selection.empty) {
              const parent = $from.parent;
              const parentStart = $from.start();

              for (const [markName, [open, close]] of Object.entries(MARK_SYNTAX)) {
                const markType = schema.marks[markName];
                if (!markType) continue;

                const range = findMarkRange(parent, parentStart, from, markType);
                if (!range) continue;

                decorations.push(
                  Decoration.widget(
                    range.from,
                    makeWidget(open, "syntax-marker syntax-marker-inline"),
                    { side: -1 }
                  )
                );
                decorations.push(
                  Decoration.widget(
                    range.to,
                    makeWidget(close, "syntax-marker syntax-marker-inline"),
                    { side: 1 }
                  )
                );
              }
            }

            return DecorationSet.create(doc, decorations);
          },
        },
      }),
    ];
  },
});
