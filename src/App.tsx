import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { NotesProvider } from "./store/NotesContext";
import { VaultProvider } from "./components/vault-system/VaultProvider";
import Index from "./pages/Index";
import { ProjectView } from "./pages/ProjectView";
import Docs from "./pages/Docs";
import Trash from "./pages/Trash";
import ComponentTest from "./pages/component-test";
import NotFound from "./pages/NotFound";

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      // All data is local SQLite — no need to refetch on focus.
      // Mutations use optimistic updates + invalidation instead.
      refetchOnWindowFocus: false,
    },
  },
});

const App = () => (
  <QueryClientProvider client={queryClient}>
    <VaultProvider>
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
    </VaultProvider>
  </QueryClientProvider>
);

export default App;
