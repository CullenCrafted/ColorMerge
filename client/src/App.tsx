import { useState } from "react";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import ColorMerge from "@/pages/colormerge";
import Home from "@/remix/Home";
import RemixGame from "@/remix/RemixGame";
import "@/remix/remix.css";

function App() {
  const [screen, setScreen] = useState<"home" | "classic" | "remix">(() => {
    // Restore the Remix screen after a hosted checkout without applying any
    // client-side reward. The shop always reloads the verified server wallet.
    try { return sessionStorage.getItem("colormerge.returnScreen") === "remix" ? "remix" : "home"; }
    catch { return "home"; }
  });
  const navigate = (next: "home" | "classic" | "remix") => {
    try { sessionStorage.setItem("colormerge.returnScreen", next); } catch { /* Storage is optional. */ }
    setScreen(next);
  };
  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <Toaster />
        {screen === "home" && <Home onClassic={() => navigate("classic")} onRemix={() => navigate("remix")} />}
        {screen === "classic" && <>
          <div data-testid="classic-screen"><ColorMerge /></div>
          <button className="cm-classic-home" onClick={() => navigate("home")} aria-label="Return to Color Merge home">Home</button>
        </>}
        {screen === "remix" && <RemixGame onHome={() => navigate("home")} />}
      </TooltipProvider>
    </QueryClientProvider>
  );
}
export default App;
