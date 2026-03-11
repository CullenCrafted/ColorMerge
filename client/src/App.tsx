import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import ColorMerge from "@/pages/colormerge";

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <div className="min-h-screen overflow-hidden">
          <Toaster />
          <ColorMerge />
        </div>
      </TooltipProvider>
    </QueryClientProvider>
  );
}

export default App;
