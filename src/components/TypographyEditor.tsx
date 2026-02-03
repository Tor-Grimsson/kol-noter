import { useState } from "react";
import { Button } from "@/components/ui/button";
import { ChevronLeft, ChevronRight, Columns2, Columns3 } from "lucide-react";

interface TypographyEditorProps {
  focusMode?: boolean;
}

const pages = [
  {
    title: "Typography Showcase - Page 1",
    content: (
      <div className="space-y-8">
        <section className="space-y-4">
          <h1 className="text-5xl font-bold leading-tight tracking-tight">
            Heading 1 - Display Title
          </h1>
          <p className="text-muted-foreground text-sm">
            Font size: 3rem (48px) • Line height: tight • Weight: bold
          </p>
        </section>

        <section className="space-y-4">
          <h2 className="text-4xl font-semibold leading-snug">
            Heading 2 - Section Title
          </h2>
          <p className="text-muted-foreground text-sm">
            Font size: 2.25rem (36px) • Line height: snug • Weight: semibold
          </p>
        </section>

        <section className="space-y-4">
          <h3 className="text-3xl font-semibold leading-normal">
            Heading 3 - Subsection
          </h3>
          <p className="text-muted-foreground text-sm">
            Font size: 1.875rem (30px) • Line height: normal • Weight: semibold
          </p>
        </section>

        <section className="space-y-4">
          <h4 className="text-2xl font-medium leading-relaxed">
            Heading 4 - Minor Heading
          </h4>
          <p className="text-muted-foreground text-sm">
            Font size: 1.5rem (24px) • Line height: relaxed • Weight: medium
          </p>
        </section>
      </div>
    ),
  },
  {
    title: "Typography Showcase - Page 2",
    content: (
      <div className="space-y-8">
        <section className="space-y-4">
          <p className="text-base leading-7 mb-6">
            Paragraph - This is standard body text with comfortable reading line height. 
            The spacing between paragraphs creates natural breaks in content flow. 
            Lorem ipsum dolor sit amet, consectetur adipiscing elit. Sed do eiusmod 
            tempor incididunt ut labore et dolore magna aliqua.
          </p>
          <p className="text-muted-foreground text-sm">
            Font size: 1rem (16px) • Line height: 1.75rem (28px) • Weight: normal
          </p>
        </section>

        <section className="space-y-4">
          <label className="text-sm font-medium leading-none">
            Label - Form Field Label
          </label>
          <p className="text-muted-foreground text-sm">
            Font size: 0.875rem (14px) • Line height: none • Weight: medium
          </p>
        </section>

        <section className="space-y-4">
          <div className="text-xs uppercase tracking-wider text-muted-foreground font-semibold">
            Section Header
          </div>
          <p className="text-muted-foreground text-sm">
            Font size: 0.75rem (12px) • Line height: normal • Weight: semibold • Transform: uppercase • Tracking: wider
          </p>
        </section>

        <section className="space-y-6 mt-8">
          <h3 className="text-2xl font-semibold">Combined Example</h3>
          <div className="text-xs uppercase tracking-wider text-muted-foreground font-semibold mb-2">
            Introduction
          </div>
          <p className="text-base leading-7 mb-4">
            This paragraph demonstrates how different typography elements work together 
            in a real document. The section header above provides context, while this 
            paragraph contains the main content.
          </p>
          <label className="text-sm font-medium">Author Name</label>
        </section>
      </div>
    ),
  },
  {
    title: "Typography Showcase - Page 3",
    content: (
      <div className="space-y-8">
        <section className="space-y-6">
          <h2 className="text-3xl font-semibold">Spacing & Hierarchy</h2>
          
          <div className="space-y-4">
            <div className="text-xs uppercase tracking-wider text-muted-foreground font-semibold">
              Primary Content
            </div>
            <h3 className="text-xl font-medium">Content Block Title</h3>
            <p className="text-base leading-7">
              Notice how the spacing creates visual hierarchy. The section header is smallest 
              and most subtle, followed by the heading, and then the paragraph text.
            </p>
          </div>

          <div className="space-y-4">
            <div className="text-xs uppercase tracking-wider text-muted-foreground font-semibold">
              Secondary Content
            </div>
            <h3 className="text-xl font-medium">Another Block</h3>
            <p className="text-base leading-7">
              Consistent spacing between sections helps readers navigate the document 
              structure naturally. Each element has its role in the visual hierarchy.
            </p>
          </div>
        </section>

        <section className="space-y-4 pt-8 border-t border-border">
          <h3 className="text-2xl font-semibold">Line Height Examples</h3>
          
          <div className="space-y-6">
            <div>
              <label className="text-sm font-medium text-muted-foreground">Tight (leading-tight)</label>
              <p className="text-lg leading-tight mt-2">
                This text has tight line height. It's more compact and works well for headings 
                but can feel cramped for body text.
              </p>
            </div>

            <div>
              <label className="text-sm font-medium text-muted-foreground">Normal (leading-normal)</label>
              <p className="text-lg leading-normal mt-2">
                This text has normal line height. It provides balanced spacing that works 
                for most content types.
              </p>
            </div>

            <div>
              <label className="text-sm font-medium text-muted-foreground">Relaxed (leading-relaxed)</label>
              <p className="text-lg leading-relaxed mt-2">
                This text has relaxed line height. The extra space improves readability 
                for longer passages of text.
              </p>
            </div>
          </div>
        </section>
      </div>
    ),
  },
];

export const TypographyEditor = ({ focusMode, content, onChange }: TypographyEditorProps) => {
  const [currentPage, setCurrentPage] = useState(0);
  const [twoPageLayout, setTwoPageLayout] = useState(false);

  const goToNextPage = () => {
    if (currentPage < pages.length - 1) {
      setCurrentPage(twoPageLayout ? currentPage + 2 : currentPage + 1);
    }
  };

  const goToPreviousPage = () => {
    if (currentPage > 0) {
      setCurrentPage(twoPageLayout ? Math.max(0, currentPage - 2) : currentPage - 1);
    }
  };

  return (
    <div className={`flex-1 flex flex-col bg-background ${focusMode ? 'px-12 py-12' : ''}`}>
      {!focusMode && (
        <div className="sticky top-0 z-10 bg-card/80 backdrop-blur-sm border-b border-border px-6 py-3 flex items-center justify-between flex-shrink-0">
          <div className="flex items-center gap-4">
            <div className="text-xs uppercase tracking-wider text-muted-foreground font-semibold">
              Page {currentPage + 1} of {pages.length}
            </div>
            <div className="flex gap-1">
              <Button
                variant={twoPageLayout ? "ghost" : "secondary"}
                size="sm"
                onClick={() => setTwoPageLayout(false)}
                className="h-8 w-8 p-0"
                title="Single page"
              >
                <Columns2 className="w-4 h-4" />
              </Button>
              <Button
                variant={twoPageLayout ? "secondary" : "ghost"}
                size="sm"
                onClick={() => setTwoPageLayout(true)}
                className="h-8 w-8 p-0"
                title="Two pages"
              >
                <Columns3 className="w-4 h-4" />
              </Button>
            </div>
          </div>
          <div className="flex gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={goToPreviousPage}
              disabled={currentPage === 0}
            >
              <ChevronLeft className="w-4 h-4" />
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={goToNextPage}
              disabled={twoPageLayout ? currentPage >= pages.length - 2 : currentPage === pages.length - 1}
            >
              <ChevronRight className="w-4 h-4" />
            </Button>
          </div>
        </div>
      )}

      {/* Scrollable content area */}
      <div className="flex-1 overflow-auto p-6">
        {twoPageLayout ? (
          <div className="grid grid-cols-2 gap-8 min-h-full">
            <div className="prose prose-neutral dark:prose-invert max-w-none border-r border-border pr-8">
              {pages[currentPage]?.content}
            </div>
            <div className="prose prose-neutral dark:prose-invert max-w-none">
              {pages[currentPage + 1]?.content || (
                <div className="text-center text-muted-foreground py-12">
                  No more pages
                </div>
              )}
            </div>
          </div>
        ) : (
          <div className="max-w-3xl mx-auto prose prose-neutral dark:prose-invert">
            {pages[currentPage].content}
          </div>
        )}
      </div>

      {/* Fixed footer with page navigation */}
      <div className="flex-shrink-0 border-t border-border bg-background px-6 py-4">
        <div className="flex items-center justify-center gap-2">
          {pages.map((_, index) => (
            <button
              key={index}
              onClick={() => setCurrentPage(index)}
              className={`w-2 h-2 rounded-full transition-all ${
                index === currentPage || (twoPageLayout && index === currentPage + 1)
                  ? 'bg-primary w-8'
                  : 'bg-muted-foreground/30 hover:bg-muted-foreground/50'
              }`}
              aria-label={`Go to page ${index + 1}`}
            />
          ))}
        </div>
      </div>
    </div>
  );
};
