import { UnifiedSidebar } from "@/components/UnifiedSidebar";
import { Breadcrumbs } from "@/components/Breadcrumbs";
import { HierarchyContent } from "@/components/HierarchyContent";
import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { X } from "lucide-react";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";

interface SyntaxExampleProps {
  title: string;
  markdown: string;
}

const SyntaxExample = ({ title, markdown }: SyntaxExampleProps) => {
  return (
    <Card className="overflow-hidden">
      <CardContent className="p-0">
        <div className="grid grid-cols-1 md:grid-cols-2 divide-y md:divide-y-0 md:divide-x divide-border">
          {/* Rendered Output */}
          <div className="p-4">
            <p className="text-xs text-muted-foreground mb-3 font-medium">{title}</p>
            <article
              className="max-w-none text-foreground
                [&_h1]:text-3xl [&_h1]:font-bold [&_h1]:mb-4 [&_h1]:text-foreground
                [&_h2]:text-2xl [&_h2]:font-semibold [&_h2]:mb-3 [&_h2]:mt-0 [&_h2]:text-foreground
                [&_h3]:text-xl [&_h3]:font-semibold [&_h3]:mb-2 [&_h3]:mt-0 [&_h3]:text-foreground
                [&_h4]:text-lg [&_h4]:font-medium [&_h4]:mb-2 [&_h4]:mt-0 [&_h4]:text-foreground
                [&_p]:leading-7 [&_p]:mb-2 [&_p]:text-foreground [&_p]:last:mb-0
                [&_a]:text-primary [&_a]:no-underline hover:[&_a]:underline
                [&_code]:bg-muted [&_code]:px-1.5 [&_code]:py-0.5 [&_code]:rounded [&_code]:text-sm [&_code]:text-foreground
                [&_pre]:bg-muted [&_pre]:p-4 [&_pre]:rounded [&_pre]:overflow-auto
                [&_pre_code]:bg-transparent [&_pre_code]:p-0
                [&_blockquote]:border-l-4 [&_blockquote]:border-l-primary [&_blockquote]:bg-muted/30 [&_blockquote]:py-2 [&_blockquote]:px-4 [&_blockquote]:my-2
                [&_img]:rounded-lg [&_img]:shadow-md
                [&_ul]:my-2 [&_ul]:list-disc [&_ul]:pl-6
                [&_ol]:my-2 [&_ol]:list-decimal [&_ol]:pl-6
                [&_li]:my-1 [&_li]:text-foreground
                [&_hr]:border-border [&_hr]:my-4
                [&_strong]:font-bold [&_em]:italic
                [&_del]:line-through"
            >
              <ReactMarkdown remarkPlugins={[remarkGfm]}>{markdown}</ReactMarkdown>
            </article>
          </div>
          {/* Raw Syntax */}
          <div className="p-4 bg-muted/30">
            <p className="text-xs text-muted-foreground mb-3 font-medium">Syntax</p>
            <pre className="text-sm text-foreground whitespace-pre-wrap font-mono">{markdown}</pre>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

const MarkdownContent = () => {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold mb-2">Markdown Syntax Reference</h1>
        <p className="text-sm text-muted-foreground">
          Quick reference for formatting your notes with Markdown
        </p>
      </div>

      {/* Headings */}
      <section className="space-y-3">
        <h2 className="text-lg font-semibold">Headings</h2>
        <SyntaxExample
          title="Heading Levels"
          markdown={`# Heading 1
## Heading 2
### Heading 3
#### Heading 4`}
        />
      </section>

      {/* Text Styles */}
      <section className="space-y-3">
        <h2 className="text-lg font-semibold">Text Styles</h2>
        <SyntaxExample
          title="Bold & Italic"
          markdown={`**bold text** or __bold text__

*italic text* or _italic text_

***bold and italic***`}
        />
        <SyntaxExample
          title="Other Styles"
          markdown={`~~strikethrough~~

\`inline code\``}
        />
      </section>

      {/* Code Blocks */}
      <section className="space-y-3">
        <h2 className="text-lg font-semibold">Code Blocks</h2>
        <SyntaxExample
          title="Fenced Code Block"
          markdown={`\`\`\`javascript
function hello() {
  console.log("Hello, world!");
}
\`\`\``}
        />
      </section>

      {/* Lists */}
      <section className="space-y-3">
        <h2 className="text-lg font-semibold">Lists</h2>
        <SyntaxExample
          title="Unordered List"
          markdown={`- First item
- Second item
- Third item
  - Nested item
  - Another nested`}
        />
        <SyntaxExample
          title="Ordered List"
          markdown={`1. First item
2. Second item
3. Third item`}
        />
        <SyntaxExample
          title="Task List"
          markdown={`- [ ] Unchecked task
- [x] Completed task
- [ ] Another task`}
        />
      </section>

      {/* Links & Images */}
      <section className="space-y-3">
        <h2 className="text-lg font-semibold">Links & Images</h2>
        <SyntaxExample
          title="Links"
          markdown={`[Link text](https://example.com)

[Link with title](https://example.com "Hover title")`}
        />
        <SyntaxExample
          title="Images"
          markdown={`![Alt text](https://via.placeholder.com/150)`}
        />
      </section>

      {/* Blockquotes */}
      <section className="space-y-3">
        <h2 className="text-lg font-semibold">Blockquotes</h2>
        <SyntaxExample
          title="Quote"
          markdown={`> This is a blockquote.
> It can span multiple lines.
>
> And have multiple paragraphs.`}
        />
      </section>

      {/* Horizontal Rule */}
      <section className="space-y-3">
        <h2 className="text-lg font-semibold">Horizontal Rule</h2>
        <SyntaxExample
          title="Divider"
          markdown={`Content above

---

Content below`}
        />
      </section>

      {/* Tables */}
      <section className="space-y-3">
        <h2 className="text-lg font-semibold">Tables</h2>
        <SyntaxExample
          title="Table"
          markdown={`| Header 1 | Header 2 | Header 3 |
|----------|----------|----------|
| Cell 1   | Cell 2   | Cell 3   |
| Cell 4   | Cell 5   | Cell 6   |`}
        />
      </section>
    </div>
  );
};

const Docs = () => {
  const navigate = useNavigate();
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);

  const breadcrumbItems = [{ label: "Docs" }];

  const handleExplorerSelect = () => {
    navigate("/");
  };

  return (
    <div className="flex h-screen w-full overflow-hidden bg-background">
      <UnifiedSidebar
        collapsed={sidebarCollapsed}
        onNoteSelect={handleExplorerSelect}
        selectedNoteId={undefined}
        onSystemProjectSelect={handleExplorerSelect}
        onHierarchySelect={handleExplorerSelect}
      />

      <div className="flex-1 bg-background flex flex-col">
        {/* Header */}
        <div className="h-12 border-b border-border bg-card/50 backdrop-blur-sm flex items-center px-4 gap-4 shadow-sm">
          <div className="flex-1 overflow-x-auto overflow-y-hidden">
            <Breadcrumbs items={breadcrumbItems} />
          </div>
          <Button variant="ghost" size="icon" onClick={() => navigate("/")}>
            <X className="w-4 h-4" />
          </Button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-auto p-6">
          <div className="max-w-5xl mx-auto">
            <Tabs defaultValue="markdown">
              <TabsList className="mb-6">
                <TabsTrigger value="markdown">Markdown Syntax</TabsTrigger>
                <TabsTrigger value="hierarchy">Hierarchy</TabsTrigger>
              </TabsList>
              <TabsContent value="markdown">
                <MarkdownContent />
              </TabsContent>
              <TabsContent value="hierarchy">
                <HierarchyContent />
              </TabsContent>
            </Tabs>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Docs;
