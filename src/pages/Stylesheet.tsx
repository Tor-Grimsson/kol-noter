import { UnifiedSidebar } from "@/components/UnifiedSidebar";
import { Breadcrumbs } from "@/components/Breadcrumbs";
import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Eye, Folder, FileText } from "lucide-react";

const Stylesheet = () => {
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);

  const breadcrumbItems = [
    { label: "Stylesheet" }
  ];

  return (
    <div className="flex h-screen w-full overflow-hidden bg-background">
      <UnifiedSidebar 
        collapsed={sidebarCollapsed}
        onNoteSelect={() => {}}
        selectedNoteId={undefined}
        onSystemProjectSelect={() => {}}
      />

      <div className="flex-1 bg-background flex flex-col">
        {/* Header */}
        <div className="h-12 border-b border-border bg-card/50 backdrop-blur-sm flex items-center px-4 gap-4 shadow-sm">
          <div className="flex-1 overflow-x-auto overflow-y-hidden">
            <Breadcrumbs items={breadcrumbItems} />
          </div>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-auto p-6">
          <div className="max-w-5xl mx-auto space-y-6">
            <div>
              <h1 className="text-2xl font-semibold mb-2">Stylesheet Documentation</h1>
              <p className="text-sm text-muted-foreground">
                Design system reference for colors, typography, and components
              </p>
            </div>

            {/* Typography */}
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Typography</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <p className="text-xs text-muted-foreground mb-3">Text size scale using Tailwind utilities</p>
                  <div className="text-2xl font-semibold">Heading 1 - text-2xl font-semibold</div>
                  <div className="text-xl font-semibold">Heading 2 - text-xl font-semibold</div>
                  <div className="text-lg font-semibold">Heading 3 - text-lg font-semibold</div>
                  <div className="text-base font-medium">Body Large - text-base font-medium</div>
                  <div className="text-sm">Body Regular - text-sm (default)</div>
                  <div className="text-xs">Body Small - text-xs</div>
                  <div className="text-[10px]">Micro - text-[10px]</div>
                </div>
              </CardContent>
            </Card>

            {/* Colors */}
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Color System</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <p className="text-xs text-muted-foreground mb-3">Semantic color tokens from design system</p>
                  <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                    <div className="space-y-2">
                      <div className="h-16 bg-primary rounded-lg border"></div>
                      <p className="text-xs font-medium">Primary</p>
                      <p className="text-[10px] text-muted-foreground">Main brand color</p>
                    </div>
                    <div className="space-y-2">
                      <div className="h-16 bg-secondary rounded-lg border"></div>
                      <p className="text-xs font-medium">Secondary</p>
                      <p className="text-[10px] text-muted-foreground">Supporting color</p>
                    </div>
                    <div className="space-y-2">
                      <div className="h-16 bg-accent rounded-lg border"></div>
                      <p className="text-xs font-medium">Accent</p>
                      <p className="text-[10px] text-muted-foreground">Highlights</p>
                    </div>
                    <div className="space-y-2">
                      <div className="h-16 bg-warning rounded-lg border"></div>
                      <p className="text-xs font-medium">Warning</p>
                      <p className="text-[10px] text-muted-foreground">Indicators, alerts</p>
                    </div>
                    <div className="space-y-2">
                      <div className="h-16 bg-destructive rounded-lg border"></div>
                      <p className="text-xs font-medium">Destructive</p>
                      <p className="text-[10px] text-muted-foreground">Errors, danger</p>
                    </div>
                    <div className="space-y-2">
                      <div className="h-16 bg-success rounded-lg border"></div>
                      <p className="text-xs font-medium">Success</p>
                      <p className="text-[10px] text-muted-foreground">Positive states</p>
                    </div>
                    <div className="space-y-2">
                      <div className="h-16 bg-muted rounded-lg border"></div>
                      <p className="text-xs font-medium">Muted</p>
                      <p className="text-[10px] text-muted-foreground">Backgrounds</p>
                    </div>
                    <div className="space-y-2">
                      <div className="h-16 bg-card rounded-lg border"></div>
                      <p className="text-xs font-medium">Card</p>
                      <p className="text-[10px] text-muted-foreground">Elevated surfaces</p>
                    </div>
                    <div className="space-y-2">
                      <div className="h-16 bg-background rounded-lg border"></div>
                      <p className="text-xs font-medium">Background</p>
                      <p className="text-[10px] text-muted-foreground">Base layer</p>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Buttons */}
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Buttons</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <p className="text-xs text-muted-foreground mb-3">Button variants and states</p>
                  <div className="flex flex-wrap gap-3">
                    <Button>Default</Button>
                    <Button variant="secondary">Secondary</Button>
                    <Button variant="outline">Outline</Button>
                    <Button variant="ghost">Ghost</Button>
                    <Button variant="destructive">Destructive</Button>
                  </div>
                </div>
                <div>
                  <p className="text-xs text-muted-foreground mb-3">Sizes</p>
                  <div className="flex flex-wrap items-center gap-3">
                    <Button size="sm">Small</Button>
                    <Button>Default</Button>
                    <Button size="lg">Large</Button>
                    <Button size="icon"><Eye className="w-4 h-4" /></Button>
                  </div>
                </div>
                <div>
                  <p className="text-xs text-muted-foreground mb-3">States</p>
                  <div className="flex flex-wrap gap-3">
                    <Button>Normal</Button>
                    <Button className="hover:bg-primary-hover">Hover</Button>
                    <Button disabled>Disabled</Button>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Badges & Pills */}
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Badges & Pills</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <p className="text-xs text-muted-foreground mb-3">Badge variants</p>
                  <div className="flex flex-wrap gap-2">
                    <Badge>Default</Badge>
                    <Badge variant="secondary">Secondary</Badge>
                    <Badge variant="outline">Outline</Badge>
                    <Badge variant="destructive">Destructive</Badge>
                  </div>
                </div>
                <div>
                  <p className="text-xs text-muted-foreground mb-3">Priority badges (from Projects)</p>
                  <div className="flex flex-wrap gap-2">
                    <Badge className="bg-muted text-muted-foreground text-xs">Low</Badge>
                    <Badge className="bg-warning/20 text-warning text-xs">Medium</Badge>
                    <Badge className="bg-destructive/20 text-destructive text-xs">High</Badge>
                  </div>
                </div>
                <div>
                  <p className="text-xs text-muted-foreground mb-3">Editor type badges</p>
                  <div className="flex flex-wrap gap-2">
                    <Badge className="bg-primary/10 text-primary text-[10px]">Modular</Badge>
                    <Badge className="bg-secondary/10 text-secondary text-[10px]">Standard</Badge>
                    <Badge className="bg-accent/10 text-accent text-[10px]">Visual</Badge>
                    <Badge className="bg-warning/10 text-warning text-[10px]">Typography</Badge>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Cards */}
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Cards</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <p className="text-xs text-muted-foreground mb-3">Note cards (from Notes List)</p>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    <Card className="cursor-pointer hover:border-primary/50 transition-all">
                      <CardContent className="p-4">
                        <div className="flex items-start gap-3">
                          <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center shrink-0">
                            <FileText className="w-5 h-5 text-primary" />
                          </div>
                          <div className="flex-1 min-w-0">
                            <h3 className="text-sm font-semibold line-clamp-1">Example Note Title</h3>
                            <p className="text-xs text-muted-foreground line-clamp-2 mt-1">
                              Note preview text with description
                            </p>
                            <div className="flex gap-1 mt-2">
                              <Badge className="text-[10px] px-1.5 py-0">tag</Badge>
                            </div>
                          </div>
                        </div>
                      </CardContent>
                    </Card>

                    <Card className="cursor-pointer border-primary/50 transition-all">
                      <CardContent className="p-4">
                        <div className="flex items-start gap-3">
                          <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center shrink-0">
                            <FileText className="w-5 h-5 text-primary" />
                          </div>
                          <div className="flex-1 min-w-0">
                            <h3 className="text-sm font-semibold line-clamp-1">Selected State</h3>
                            <p className="text-xs text-muted-foreground line-clamp-2 mt-1">
                              Card with primary border when selected
                            </p>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  </div>
                </div>

                <div>
                  <p className="text-xs text-muted-foreground mb-3">Project cards</p>
                  <Card className="cursor-pointer hover:border-primary/50 transition-all hover:shadow-lg">
                    <CardContent className="p-6">
                      <div className="flex items-start gap-4">
                        <div className="w-12 h-12 rounded-lg flex items-center justify-center flex-shrink-0 bg-primary/10">
                          <Folder className="w-6 h-6 text-primary" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <h3 className="text-lg font-semibold mb-1">Project Name</h3>
                          <p className="text-xs text-muted-foreground mb-3">System Name</p>
                          <div className="flex gap-2 flex-wrap">
                            <span className="text-xs px-2 py-1 rounded bg-muted text-muted-foreground">tag</span>
                          </div>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </div>
              </CardContent>
            </Card>

            {/* Breadcrumbs */}
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Breadcrumbs</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-xs text-muted-foreground mb-3">Navigation breadcrumb with horizontal scroll</p>
                <div className="p-3 border rounded-lg bg-card/50">
                  <Breadcrumbs items={[
                    { label: "System", href: "#" },
                    { label: "Project", href: "#" },
                    { label: "Current Note" }
                  ]} />
                </div>
              </CardContent>
            </Card>

            {/* Active/Inactive States */}
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Active & Inactive States</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <p className="text-xs text-muted-foreground mb-3">Selection indicators (sidebar items)</p>
                  <div className="flex gap-4">
                    <div className="flex items-center gap-2 p-2 border rounded">
                      <div className="w-2 h-2 rounded-full bg-warning"></div>
                      <span className="text-xs">Active (solid)</span>
                    </div>
                    <div className="flex items-center gap-2 p-2 border rounded">
                      <div className="w-2 h-2 rounded-full border border-dashed border-warning bg-transparent"></div>
                      <span className="text-xs">Inactive (dotted)</span>
                    </div>
                  </div>
                </div>

                <div>
                  <p className="text-xs text-muted-foreground mb-3">Hover states</p>
                  <div className="space-y-2">
                    <div className="p-2 border rounded hover:bg-muted/50 transition-colors text-xs">
                      Sidebar item hover (bg-muted/50)
                    </div>
                    <div className="p-2 border rounded hover:bg-sidebar-item transition-colors text-xs">
                      Unified sidebar hover (bg-sidebar-item)
                    </div>
                    <Card className="cursor-pointer hover:border-primary/50 transition-all">
                      <CardContent className="p-3">
                        <p className="text-xs">Card hover (border-primary/50)</p>
                      </CardContent>
                    </Card>
                  </div>
                </div>

                <div>
                  <p className="text-xs text-muted-foreground mb-3">Overview button active state</p>
                  <div className="flex gap-2">
                    <Button variant="ghost" size="sm" className="text-xs">Inactive</Button>
                    <Button variant="ghost" size="sm" className="bg-primary/10 text-primary hover:bg-primary/20 text-xs">Active</Button>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Spacing & Layout */}
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Spacing & Layout</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="text-xs space-y-1">
                  <p><span className="font-medium">Container padding:</span> p-6 (24px)</p>
                  <p><span className="font-medium">Card padding:</span> p-4 to p-6 (16-24px)</p>
                  <p><span className="font-medium">Sidebar items:</span> px-2 py-1.5</p>
                  <p><span className="font-medium">Gap between items:</span> gap-2 to gap-4 (8-16px)</p>
                  <p><span className="font-medium">Header height:</span> h-12 (48px)</p>
                  <p><span className="font-medium">Border radius:</span> rounded-lg (8px), rounded-md (6px)</p>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Stylesheet;
