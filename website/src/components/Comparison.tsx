import { motion, AnimatePresence } from "framer-motion";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { useExperiment } from "@/context/ExperimentContext";
import { Check, X, ArrowRight } from "lucide-react";

export function Comparison() {
  const { results, isLoading, runCount } = useExperiment();

  const comparisonRows = [
    { metric: "Detection Type", paper: "Reactive", optimized: "Proactive (Port Diversity)" },
    { metric: "Avg Detection Time", paper: `${results.baseline.avg_ms} ms`, optimized: `${results.optimizer.avg_ms} ms` },
    { metric: "SYNs Before Detection", paper: `${results.baseline.syn_threshold}`, optimized: `~${results.optimizer.avg_syns_before}` },
    { metric: "Min Detection Time", paper: `${Math.min(...(results.baseline.detection_times.length ? results.baseline.detection_times : [0])).toFixed(2)} ms`, optimized: `${Math.min(...(results.optimizer.detection_times.length ? results.optimizer.detection_times : [0])).toFixed(2)} ms` },
    { metric: "Max Detection Time", paper: `${Math.max(...(results.baseline.detection_times.length ? results.baseline.detection_times : [0])).toFixed(2)} ms`, optimized: `${Math.max(...(results.optimizer.detection_times.length ? results.optimizer.detection_times : [0])).toFixed(2)} ms` },
    { metric: "Port Scan Detection", paper: "No", optimized: "Yes" },
    { metric: "Data Structure", paper: "Cuckoo Hash Table", optimized: "Cuckoo Hash + Port Tracker" },
    { metric: "Attack Phase Caught", paper: "During Flood", optimized: "Reconnaissance" },
  ];

  const speedup = results.baseline.avg_ms > 0 ? (results.baseline.avg_ms / results.optimizer.avg_ms).toFixed(1) : "N/A";
  return (
    <section id="comparison" className="py-20">
      <div className="section-container">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
          className="text-center mb-12"
        >
          <h2 className="text-3xl sm:text-4xl font-bold mb-3">
            Head-to-Head Comparison
          </h2>
          <p className="text-muted-foreground max-w-2xl mx-auto">
            A detailed side-by-side breakdown of the paper's method versus our
            Port-Diversity optimization across all key metrics.
          </p>
        </motion.div>

        {/* Comparison Table */}
        <AnimatePresence mode="wait">
        <motion.div
          key={`comparison-${runCount}`}
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -20 }}
          transition={{ duration: 0.5 }}
          className="mb-12"
        >
          <Card className="overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-border bg-muted/50">
                    <th className="py-3 px-4 text-left text-sm font-semibold text-muted-foreground">
                      Metric
                    </th>
                    <th className="py-3 px-4 text-center text-sm font-semibold text-red-400">
                      Paper Method
                    </th>
                    <th className="py-3 px-4 text-center text-sm font-semibold text-green-400">
                      Our Optimization
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {comparisonRows.map((row, i) => (
                    <motion.tr
                      key={row.metric}
                      initial={{ opacity: 0, x: -20 }}
                      whileInView={{ opacity: 1, x: 0 }}
                      viewport={{ once: true }}
                      transition={{ duration: 0.4, delay: i * 0.05 }}
                      className="border-b border-border hover:bg-muted/30 transition-colors"
                    >
                      <td className="py-3 px-4 text-sm font-medium">
                        {row.metric}
                      </td>
                      <td className="py-3 px-4 text-center text-sm text-muted-foreground">
                        {row.paper === "No" ? (
                          <X className="w-4 h-4 text-red-400 mx-auto" />
                        ) : (
                          row.paper
                        )}
                      </td>
                      <td className="py-3 px-4 text-center text-sm">
                        {row.optimized === "Yes" ? (
                          <Check className="w-4 h-4 text-green-400 mx-auto" />
                        ) : (
                          <span className="text-green-500 font-medium">
                            {row.optimized}
                          </span>
                        )}
                      </td>
                    </motion.tr>
                  ))}
                </tbody>
              </table>
            </div>
          </Card>
        </motion.div>
        </AnimatePresence>

        {/* Visual comparison cards */}
        <AnimatePresence mode="wait">
        <motion.div
          key={`cards-${runCount}`}
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -20 }}
          transition={{ duration: 0.5, delay: 0.1 }}
        >
        <div className={`grid grid-cols-1 md:grid-cols-3 gap-6 transition-opacity ${isLoading ? "opacity-50" : ""}`}>
          {/* Detection Time */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
          >
            <Card className="h-full">
              <CardHeader>
                <CardTitle className="text-base flex items-center justify-between">
                  Detection Time
                  <Badge variant="secondary">
                    {speedup}x faster
                  </Badge>
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex items-center gap-3 mb-4">
                  <div className="flex-1">
                    <div className="text-xs text-muted-foreground mb-1">Paper</div>
                    <div className="h-3 bg-red-500/20 rounded-full overflow-hidden">
                      <motion.div
                        initial={{ width: 0 }}
                        whileInView={{ width: "100%" }}
                        viewport={{ once: true }}
                        transition={{ duration: 1, ease: "easeOut" }}
                        className="h-full bg-red-500 rounded-full"
                      />
                    </div>
                    <div className="text-sm font-bold text-red-500 mt-1">
                      {results.baseline.avg_ms}ms
                    </div>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <div className="flex-1">
                    <div className="text-xs text-muted-foreground mb-1">
                      Optimized
                    </div>
                    <div className="h-3 bg-green-500/20 rounded-full overflow-hidden">
                      <motion.div
                        initial={{ width: 0 }}
                        whileInView={{
                          width: `${
                            (results.optimizer.avg_ms /
                              results.baseline.avg_ms) *
                            100
                          }%`,
                        }}
                        viewport={{ once: true }}
                        transition={{ duration: 1, ease: "easeOut", delay: 0.2 }}
                        className="h-full bg-green-500 rounded-full"
                      />
                    </div>
                    <div className="text-sm font-bold text-green-500 mt-1">
                      {results.optimizer.avg_ms}ms
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </motion.div>

          {/* Server Exposure */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ delay: 0.1 }}
          >
            <Card className="h-full">
              <CardHeader>
                <CardTitle className="text-base flex items-center justify-between">
                  Server Exposure
                  <Badge variant="secondary">
                    {results.improvements.exposure_reduction}% less
                  </Badge>
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div>
                    <div className="text-xs text-muted-foreground mb-1">
                      Paper: SYNs before detection
                    </div>
                    <div className="flex items-center gap-2">
                      <div className="text-3xl font-bold text-red-500">{results.baseline.syn_threshold}</div>
                      <div className="text-xs text-muted-foreground">
                        SYN packets
                      </div>
                    </div>
                  </div>
                  <div className="flex justify-center">
                    <ArrowRight className="w-4 h-4 text-muted-foreground rotate-90" />
                  </div>
                  <div>
                    <div className="text-xs text-muted-foreground mb-1">
                      Optimized: SYNs before detection
                    </div>
                    <div className="flex items-center gap-2">
                      <div className="text-3xl font-bold text-green-500">~{results.optimizer.avg_syns_before}</div>
                      <div className="text-xs text-muted-foreground">
                        SYN packets
                      </div>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </motion.div>

          {/* Backwards Compatibility */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ delay: 0.2 }}
          >
            <Card className="h-full">
              <CardHeader>
                <CardTitle className="text-base flex items-center justify-between">
                  Backwards Compatible
                  <Badge variant="secondary">
                    Verified
                  </Badge>
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-muted-foreground mb-4">
                  When attackers flood a single port (no port scanning), the
                  paper's SYN threshold mechanism still functions normally:
                </p>
                <div className="space-y-2">
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-muted-foreground">
                      Paper avg:
                    </span>
                    <span className="font-mono text-foreground">
                      {results.baseline.avg_ms}ms
                    </span>
                  </div>
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-muted-foreground">
                      Flood + Optimizer:
                    </span>
                    <span className="font-mono text-foreground">
                      {results.flood_with_optimizer.avg_ms}ms
                    </span>
                  </div>
                  <div className="pt-2 border-t border-border">
                    <div className="flex items-center gap-2 text-sm text-green-500">
                      <Check className="w-4 h-4" />
                      Optimization is additive, not disruptive
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </motion.div>
        </div>
        </motion.div>
        </AnimatePresence>
      </div>
    </section>
  );
}
