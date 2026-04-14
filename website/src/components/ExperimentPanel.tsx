import { motion, AnimatePresence } from "framer-motion";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useExperiment, type ExperimentParams } from "@/context/ExperimentContext";
import { Play, Loader2, AlertCircle, Settings2, CheckCircle2 } from "lucide-react";

interface ParamConfig {
  key: keyof ExperimentParams;
  label: string;
  min: number;
  max: number;
  step: number;
  unit?: string;
  description: string;
}

const PARAM_CONFIGS: ParamConfig[] = [
  { key: "flood_packets", label: "Flood Packets", min: 50, max: 5000, step: 50, description: "Number of SYN flood packets per trial" },
  { key: "legit_packets", label: "Legit Packets", min: 10, max: 500, step: 10, description: "Number of legitimate packets mixed in" },
  { key: "num_trials", label: "Number of Trials", min: 1, max: 20, step: 1, description: "Trials to run for averaging results" },
  { key: "syn_threshold", label: "SYN Threshold", min: 10, max: 1000, step: 10, description: "SYN count before baseline triggers blacklist" },
  { key: "port_diversity_threshold", label: "Port Diversity Threshold", min: 2, max: 50, step: 1, description: "Unique ports before optimizer flags attacker" },
  { key: "time_window", label: "Time Window", min: 1, max: 60, step: 1, unit: "s", description: "Time window for port diversity tracking" },
  { key: "pkts_per_port", label: "Packets per Port", min: 1, max: 20, step: 1, description: "Scan packets sent per port during reconnaissance" },
];

export function ExperimentPanel() {
  const { params, setParams, isLoading, error, runExperiment, hasRun } = useExperiment();

  const updateParam = (key: keyof ExperimentParams, value: number) => {
    setParams({ ...params, [key]: value });
  };

  return (
    <section id="experiment" className="py-20">
      <div className="section-container">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
          className="text-center mb-12"
        >
          <h2 className="text-3xl sm:text-4xl font-bold mb-3">
            Run Your Own Experiment
          </h2>
          <p className="text-muted-foreground max-w-2xl mx-auto">
            Customize every parameter and run the actual simulation backend. Results below will
            update dynamically with your configuration.
          </p>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
        >
          <Card>
            <CardHeader>
              <CardTitle className="text-base flex items-center gap-2">
                <Settings2 className="w-4 h-4" />
                Simulation Parameters
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-x-8 gap-y-6">
                {PARAM_CONFIGS.map((cfg) => (
                  <div key={cfg.key}>
                    <div className="flex items-center justify-between mb-1.5">
                      <label className="text-sm font-medium">{cfg.label}</label>
                      <span className="text-sm font-mono font-bold tabular-nums">
                        {params[cfg.key]}{cfg.unit ?? ""}
                      </span>
                    </div>
                    <input
                      type="range"
                      min={cfg.min}
                      max={cfg.max}
                      step={cfg.step}
                      value={params[cfg.key]}
                      onChange={(e) => updateParam(cfg.key, Number(e.target.value))}
                      className="w-full h-2 bg-secondary rounded-full appearance-none cursor-pointer accent-foreground"
                    />
                    <div className="flex justify-between mt-1">
                      <span className="text-[10px] text-muted-foreground">{cfg.min}</span>
                      <span className="text-[10px] text-muted-foreground">{cfg.description}</span>
                      <span className="text-[10px] text-muted-foreground">{cfg.max}</span>
                    </div>
                  </div>
                ))}
              </div>

              <div className="mt-8 flex flex-col items-center gap-3">
                <button
                  onClick={runExperiment}
                  disabled={isLoading}
                  className="inline-flex items-center gap-2 px-8 py-3 rounded-lg bg-foreground text-background font-medium text-sm hover:opacity-90 transition-opacity disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {isLoading ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      Running Simulation...
                    </>
                  ) : (
                    <>
                      <Play className="w-4 h-4" />
                      Run Experiment
                    </>
                  )}
                </button>

                {error && (
                  <motion.div
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="flex items-center gap-2 text-sm text-red-500"
                  >
                    <AlertCircle className="w-4 h-4" />
                    {error}
                  </motion.div>
                )}

                <AnimatePresence mode="wait">
                  {isLoading && (
                    <motion.div
                      key="loading"
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      exit={{ opacity: 0 }}
                      className="flex flex-col items-center gap-2"
                    >
                      <div className="h-1.5 w-48 bg-secondary rounded-full overflow-hidden">
                        <motion.div
                          className="h-full bg-foreground rounded-full"
                          initial={{ width: "0%" }}
                          animate={{ width: "100%" }}
                          transition={{ duration: 8, ease: "linear" }}
                        />
                      </div>
                      <p className="text-xs text-muted-foreground">Running simulation on backend...</p>
                    </motion.div>
                  )}

                  {!hasRun && !isLoading && !error && (
                    <motion.p key="default" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="text-xs text-muted-foreground">
                      Showing default results from notebook. Click "Run Experiment" to generate fresh data.
                    </motion.p>
                  )}

                  {hasRun && !isLoading && !error && (
                    <motion.div
                      key="success"
                      initial={{ opacity: 0, scale: 0.9 }}
                      animate={{ opacity: 1, scale: 1 }}
                      exit={{ opacity: 0 }}
                      transition={{ type: "spring", stiffness: 300, damping: 20 }}
                      className="flex items-center gap-2 text-sm text-green-500 font-medium"
                    >
                      <CheckCircle2 className="w-4 h-4" />
                      Results updated — scroll down to see charts
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            </CardContent>
          </Card>
        </motion.div>
      </div>
    </section>
  );
}
