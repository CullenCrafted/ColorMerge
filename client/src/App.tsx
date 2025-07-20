import { Switch, Route } from "wouter";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import NotFound from "@/pages/not-found";
import Home from "@/pages/home";
import ColorMerge from "@/pages/colormerge";
import ConnectLines from "@/pages/connect-lines";
import StretchWords from "@/pages/stretch-words";
import WordScramble from "@/pages/word-scramble";
import LetterPath from "@/pages/letter-path";

function Router() {
  return (
    <Switch>
      <Route path="/" component={Home} />
      <Route path="/colormerge" component={ColorMerge} />
      <Route path="/connect-lines" component={ConnectLines} />
      <Route path="/stretch-words" component={StretchWords} />
      <Route path="/word-scramble" component={WordScramble} />
      <Route path="/letter-path" component={LetterPath} />
      <Route component={NotFound} />
    </Switch>
  );
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <div className="min-h-screen game-gradient-bg">
          <Toaster />
          <Router />
        </div>
      </TooltipProvider>
    </QueryClientProvider>
  );
}

export default App;
