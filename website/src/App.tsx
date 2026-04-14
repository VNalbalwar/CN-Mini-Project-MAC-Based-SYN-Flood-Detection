import { ThemeProvider } from "@/components/ThemeProvider";
import { ExperimentProvider } from "@/context/ExperimentContext";
import { Navbar } from "@/components/Navbar";
import { Hero } from "@/components/Hero";
import { NetworkTopology } from "@/components/NetworkTopology";
import { Pipeline } from "@/components/Pipeline";
import { CuckooDemo } from "@/components/CuckooDemo";
import { LiveSimulation } from "@/components/LiveSimulation";
import { ExperimentPanel } from "@/components/ExperimentPanel";
import { Results } from "@/components/Results";
import { Comparison } from "@/components/Comparison";
import { Footer } from "@/components/Footer";

function App() {
  return (
    <ThemeProvider>
      <ExperimentProvider>
        <div className="min-h-screen bg-background text-foreground">
          <Navbar />
          <main>
            <Hero />
            <NetworkTopology />
            <Pipeline />
            <CuckooDemo />
            <LiveSimulation />
            <ExperimentPanel />
            <Results />
            <Comparison />
          </main>
          <Footer />
        </div>
      </ExperimentProvider>
    </ThemeProvider>
  );
}

export default App;
