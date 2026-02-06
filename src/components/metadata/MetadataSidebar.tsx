import { ReactNode } from "react";
import { ScrollArea } from "@/components/ui/scroll-area";

interface MetadataSidebarProps {
  children: ReactNode;
}

export const MetadataSidebar = ({ children }: MetadataSidebarProps) => {
  return (
    <div className="flex-1 overflow-auto text-foreground" style={{ backgroundColor: "#121215" }}>
      <ScrollArea className="h-full">
        <div className="mt-16 mb-32 max-w-[600px] mx-auto flex flex-col gap-6">
          {children}
        </div>
      </ScrollArea>
    </div>
  );
};

export const MetadataNotFound = ({ message = "Not found" }: { message?: string }) => {
  return (
    <div className="flex-1 overflow-auto text-foreground" style={{ backgroundColor: "#121215" }}>
      <div className="p-8 flex items-center justify-center h-full">
        <p className="text-sm text-muted-foreground">{message}</p>
      </div>
    </div>
  );
};
