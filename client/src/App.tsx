import { Router, Route } from "wouter";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import SimpleMainMenu from "@/pages/simple-main-menu";
import GameSingle from "@/pages/game-single";
import GameArcade from "@/pages/game-arcade";
import ColorMerge from "@/pages/colormerge";

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <div className="min-h-screen overflow-hidden">
          <Toaster />
          <Router>
            <Route path="/" component={SimpleMainMenu} />
            <Route path="/game/:mode" component={GameSingle} />
            <Route path="/game/arcade" component={GameArcade} />
            <Route path="/colormerge" component={ColorMerge} />
          </Router>
        </div>
      </TooltipProvider>
    </QueryClientProvider>
  );
}

export default App;
