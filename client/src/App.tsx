import { useState } from "react";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import ColorMerge from "@/pages/colormerge";
import AdScreen from "@/components/ad-screen";

function App() {
  const [showAd, setShowAd] = useState(true);

  const handleAdClose = () => {
    setShowAd(false);
    // Force a reflow to ensure any backdrop blur effects are cleared
    document.body.style.transform = 'translateZ(0)';
    setTimeout(() => {
      document.body.style.transform = '';
    }, 10);
  };

  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <div className="min-h-screen overflow-hidden">
          <Toaster />
          {showAd ? (
            <AdScreen onClose={handleAdClose} />
          ) : (
            <ColorMerge />
          )}
        </div>
      </TooltipProvider>
    </QueryClientProvider>
  );
}

export default App;
