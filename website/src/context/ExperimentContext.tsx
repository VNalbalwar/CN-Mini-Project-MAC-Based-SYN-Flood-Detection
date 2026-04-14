import { createContext, useContext, useState, useCallback, type ReactNode } from "react";
import { experimentResults as defaultResults } from "@/data/experiment-data";

export interface ExperimentParams {
  syn_threshold: number;
  port_diversity_threshold: number;
  time_window: number;
  num_trials: number;
  flood_packets: number;
  legit_packets: number;
  pkts_per_port: number;
}

export interface ExperimentData {
  baseline: {
    detection_times: number[];
    avg_ms: number;
    syn_threshold: number;
    syns_to_detect: number;
  };
  optimizer: {
    detection_times: number[];
    avg_ms: number;
    port_threshold: number;
    avg_syns_before: number;
  };
  flood_with_optimizer: {
    detection_times: number[];
    avg_ms: number;
  };
  config: {
    syn_threshold: number;
    port_diversity_threshold: number;
    time_window: number;
    num_trials: number;
    flood_packets: number;
    legit_packets: number;
    scan_ports: number[];
    pkts_per_port: number;
  };
  improvements: {
    time_improvement: number;
    exposure_reduction: number;
  };
}

interface ExperimentContextValue {
  results: ExperimentData;
  params: ExperimentParams;
  setParams: (params: ExperimentParams) => void;
  isLoading: boolean;
  error: string | null;
  runExperiment: () => Promise<void>;
  hasRun: boolean;
  runCount: number;
}

const DEFAULT_PARAMS: ExperimentParams = {
  syn_threshold: 100,
  port_diversity_threshold: 5,
  time_window: 10.0,
  num_trials: 5,
  flood_packets: 200,
  legit_packets: 50,
  pkts_per_port: 3,
};

// Convert static data to mutable ExperimentData
const staticResults: ExperimentData = {
  baseline: { ...defaultResults.baseline, detection_times: [...defaultResults.baseline.detection_times] },
  optimizer: { ...defaultResults.optimizer, detection_times: [...defaultResults.optimizer.detection_times] },
  flood_with_optimizer: { ...defaultResults.flood_with_optimizer, detection_times: [...defaultResults.flood_with_optimizer.detection_times] },
  config: { ...defaultResults.config, scan_ports: [22, 80, 443, 8080, 3306, 5432, 6379, 27017], pkts_per_port: 3 },
  improvements: { ...defaultResults.improvements },
};

const ExperimentContext = createContext<ExperimentContextValue | null>(null);

export function ExperimentProvider({ children }: { children: ReactNode }) {
  const [results, setResults] = useState<ExperimentData>(staticResults);
  const [params, setParams] = useState<ExperimentParams>(DEFAULT_PARAMS);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [hasRun, setHasRun] = useState(false);
  const [runCount, setRunCount] = useState(0);

  const runExperiment = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/run-experiment", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(params),
      });
      if (!res.ok) {
        const err = await res.json().catch(() => ({ detail: "Server error" }));
        throw new Error(err.detail || `HTTP ${res.status}`);
      }
      const data: ExperimentData = await res.json();
      setResults(data);
      setHasRun(true);
      setRunCount((c) => c + 1);
      // Smooth scroll to results
      setTimeout(() => {
        document.getElementById("results")?.scrollIntoView({ behavior: "smooth", block: "start" });
      }, 100);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Unknown error");
    } finally {
      setIsLoading(false);
    }
  }, [params]);

  return (
    <ExperimentContext.Provider value={{ results, params, setParams, isLoading, error, runExperiment, hasRun, runCount }}>
      {children}
    </ExperimentContext.Provider>
  );
}

export function useExperiment() {
  const ctx = useContext(ExperimentContext);
  if (!ctx) throw new Error("useExperiment must be used within ExperimentProvider");
  return ctx;
}
