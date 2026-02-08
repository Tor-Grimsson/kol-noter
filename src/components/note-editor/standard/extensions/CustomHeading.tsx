import { Heading } from "@tiptap/extension-heading";
import {
  ReactNodeViewRenderer,
  NodeViewContent,
  NodeViewWrapper,
} from "@tiptap/react";
import type { NodeViewProps } from "@tiptap/react";

function HeadingView({ node, editor, getPos }: NodeViewProps) {
  const level = node.attrs.level as number;
  const prefix = "#".repeat(level);
  const pos = typeof getPos === "function" ? getPos() : 0;
  const { from } = editor.state.selection;
  const isCursorInside = from >= pos && from <= pos + node.nodeSize;

  return (
    <NodeViewWrapper as={`h${level}` as keyof JSX.IntrinsicElements}>
      {isCursorInside && (
        <span className="syntax-marker" contentEditable={false}>
          {prefix}{" "}
        </span>
      )}
      <NodeViewContent as="span" />
    </NodeViewWrapper>
  );
}

export const CustomHeading = Heading.extend({
  addNodeView() {
    return ReactNodeViewRenderer(HeadingView);
  },
});
