import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { NotesProvider } from "./store/notesStore";
import Index from "./pages/Index";
import { ProjectView } from "./pages/ProjectView";
import Docs from "./pages/Docs";
import Trash from "./pages/Trash";
import ComponentTest from "./pages/component-test";
import NotFound from "./pages/NotFound";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <NotesProvider>
      <TooltipProvider>
        <Toaster />
        <Sonner />
        <BrowserRouter>
          <Routes>
            <Route path="/" element={<Index />} />
            <Route path="/projects-view" element={<ProjectView />} />
            <Route path="/docs" element={<Docs />} />
            <Route path="/trash" element={<Trash />} />
            <Route path="/component-test" element={<ComponentTest />} />
            {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
            <Route path="*" element={<NotFound />} />
          </Routes>
        </BrowserRouter>
      </TooltipProvider>
    </NotesProvider>
  </QueryClientProvider>
);

export default App;
