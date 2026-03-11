import { Switch, Route } from "wouter";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import NotFound from "@/pages/not-found";
import Home from "@/pages/Home";
import Game from "@/pages/Game";
import Garage from "@/pages/Garage";
import LevelSelect from "@/pages/LevelSelect";
import Leaderboard from "@/pages/Leaderboard";
import { useLocation } from "wouter";

function GarageWrapper() {
  const [, setLocation] = useLocation();
  return (
    <Garage
      onStartFishing={(vehicleId) => {
        setLocation(`/levels?vehicle=${vehicleId}`);
      }}
    />
  );
}

function Router() {
  return (
    <Switch>
      <Route path="/" component={Home} />
      <Route path="/garage" component={GarageWrapper} />
      <Route path="/levels" component={LevelSelect} />
      <Route path="/game" component={Game} />
      <Route path="/leaderboard" component={Leaderboard} />
      <Route component={NotFound} />
    </Switch>
  );
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <Toaster />
      <Router />
    </QueryClientProvider>
  );
}

export default App;
