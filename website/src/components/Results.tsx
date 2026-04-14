import { motion, AnimatePresence } from "framer-motion";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useExperiment } from "@/context/ExperimentContext";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  LineChart,
  Line,
  Cell,
  Legend,
} from "recharts";
import { TrendingDown, Clock, Shield, Zap } from "lucide-react";

export function Results() {
  const { results, isLoading, runCount } = useExperiment();
  const axisColor = "#a1a1aa";
  const gridColor = "#e4e4e7";

  const barData = [
    { name: "Paper Method", value: results.baseline.avg_ms, fill: "#ef4444" },
    { name: "Optimized", value: results.optimizer.avg_ms, fill: "#22c55e" },
  ];

  const trialData = results.baseline.detection_times.map((t, i) => ({
    trial: `Trial ${i + 1}`,
    paper: t,
    optimized: results.optimizer.detection_times[i] ?? 0,
    floodOptim: results.flood_with_optimizer.detection_times[i] ?? 0,
  }));

  const exposureData = [
    { name: "Paper", syns: results.baseline.syn_threshold, fill: "#ef4444" },
    { name: "Optimized", syns: results.optimizer.avg_syns_before, fill: "#22c55e" },
  ];

  const improvementData = [
    { name: "Detection Speed", value: results.improvements.time_improvement, fill: "#22c55e" },
    { name: "Exposure Reduction", value: results.improvements.exposure_reduction, fill: "#3b82f6" },
  ];

const CustomTooltip = ({
  active,
  payload,
  label,
}: {
  active?: boolean;
  payload?: Array<{ value: number; name: string; color: string }>;
  label?: string;
}) => {
  if (!active || !payload?.length) return null;
  return (
    <div className="bg-card border border-border rounded-lg px-3 py-2 shadow-lg">
      <p className="text-xs text-muted-foreground mb-1">{label}</p>
      {payload.map((entry, index) => (
        <p key={index} className="text-sm font-medium" style={{ color: entry.color }}>
          {entry.name}: {entry.value.toFixed(2)}ms
        </p>
      ))}
    </div>
  );
};

  return (
    <section id="results" className="py-20">
      <div className="section-container">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
          className="text-center mb-12"
        >
          <h2 className="text-3xl sm:text-4xl font-bold mb-3">
            Experiment Results
          </h2>
          <p className="text-muted-foreground max-w-2xl mx-auto">
            Results from {results.config.num_trials} controlled trial{results.config.num_trials !== 1 ? "s" : ""}{" "}
            comparing the paper's reactive detection with our proactive optimization.
          </p>
        </motion.div>

        {/* Key metrics cards — re-animate on each run */}
        <AnimatePresence mode="wait">
        <motion.div
          key={`metrics-${runCount}`}
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -20 }}
          transition={{ duration: 0.5 }}
        >
        <div className={`grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-12 transition-opacity ${isLoading ? "opacity-50" : ""}`}>
          {[
            { icon: Clock, label: "Paper Avg Time", value: `${results.baseline.avg_ms}ms`, color: "text-red-500" },
            { icon: Zap, label: "Optimized Avg Time", value: `${results.optimizer.avg_ms}ms`, color: "text-green-500" },
            { icon: TrendingDown, label: "Speed Improvement", value: `${results.improvements.time_improvement}%`, color: "text-blue-500" },
            { icon: Shield, label: "Exposure Reduction", value: `${results.improvements.exposure_reduction}%`, color: "text-amber-500" },
          ].map((metric, i) => (
            <motion.div
              key={metric.label}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5, delay: i * 0.1 }}
            >
              <Card>
                <CardContent className="pt-6 text-center">
                  <metric.icon className={`w-6 h-6 ${metric.color} mx-auto mb-2`} />
                  <div className={`text-3xl font-bold ${metric.color} mb-1`}>{metric.value}</div>
                  <div className="text-xs text-muted-foreground">{metric.label}</div>
                </CardContent>
              </Card>
            </motion.div>
          ))}
        </div>

        {/* Charts grid */}
        <div className={`grid grid-cols-1 lg:grid-cols-2 gap-6 transition-opacity ${isLoading ? "opacity-50" : ""}`}>
          {/* Chart 1: Detection Time Comparison */}
          <motion.div initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }}>
            <Card>
              <CardHeader>
                <CardTitle className="text-base">Average Detection Time</CardTitle>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={280}>
                  <BarChart data={barData} barSize={60}>
                    <CartesianGrid strokeDasharray="3 3" stroke={gridColor} />
                    <XAxis dataKey="name" tick={{ fill: axisColor, fontSize: 12 }} />
                    <YAxis tick={{ fill: axisColor, fontSize: 12 }} label={{ value: "Time (ms)", angle: -90, position: "insideLeft", fill: axisColor, fontSize: 11 }} />
                    <Tooltip content={<CustomTooltip />} />
                    <Bar dataKey="value" radius={[6, 6, 0, 0]}>
                      {barData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.fill} />
                      ))}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
          </motion.div>

          {/* Chart 2: Per-Trial Detection Times */}
          <motion.div initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ delay: 0.1 }}>
            <Card>
              <CardHeader>
                <CardTitle className="text-base">Per-Trial Detection Times</CardTitle>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={280}>
                  <LineChart data={trialData}>
                    <CartesianGrid strokeDasharray="3 3" stroke={gridColor} />
                    <XAxis dataKey="trial" tick={{ fill: axisColor, fontSize: 12 }} />
                    <YAxis tick={{ fill: axisColor, fontSize: 12 }} label={{ value: "Time (ms)", angle: -90, position: "insideLeft", fill: axisColor, fontSize: 11 }} />
                    <Tooltip content={<CustomTooltip />} />
                    <Legend wrapperStyle={{ fontSize: 11 }} />
                    <Line type="monotone" dataKey="paper" stroke="#ef4444" strokeWidth={2} dot={{ fill: "#ef4444", strokeWidth: 2 }} name="Paper Method" />
                    <Line type="monotone" dataKey="optimized" stroke="#22c55e" strokeWidth={2} dot={{ fill: "#22c55e", strokeWidth: 2 }} name="Optimized" />
                    <Line type="monotone" dataKey="floodOptim" stroke="#3b82f6" strokeWidth={1.5} strokeDasharray="5 5" dot={{ fill: "#3b82f6", strokeWidth: 2, r: 3 }} name="Flood+Optimizer" />
                  </LineChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
          </motion.div>

          {/* Chart 3: Server Exposure */}
          <motion.div initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ delay: 0.2 }}>
            <Card>
              <CardHeader>
                <CardTitle className="text-base">Server Exposure (SYNs Before Detection)</CardTitle>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={280}>
                  <BarChart data={exposureData} barSize={60}>
                    <CartesianGrid strokeDasharray="3 3" stroke={gridColor} />
                    <XAxis dataKey="name" tick={{ fill: axisColor, fontSize: 12 }} />
                    <YAxis tick={{ fill: axisColor, fontSize: 12 }} label={{ value: "SYN Packets", angle: -90, position: "insideLeft", fill: axisColor, fontSize: 11 }} />
                    <Tooltip content={({ active, payload, label }) => {
                      if (!active || !payload?.length) return null;
                      return (
                        <div className="bg-card border border-border rounded-lg px-3 py-2 shadow-lg">
                          <p className="text-xs text-muted-foreground mb-1">{label}</p>
                          <p className="text-sm font-medium text-foreground">{payload[0].value} SYN packets</p>
                        </div>
                      );
                    }} />
                    <Bar dataKey="syns" radius={[6, 6, 0, 0]}>
                      {exposureData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.fill} />
                      ))}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
          </motion.div>

          {/* Chart 4: Improvement Metrics */}
          <motion.div initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ delay: 0.3 }}>
            <Card>
              <CardHeader>
                <CardTitle className="text-base">Optimization Improvements</CardTitle>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={280}>
                  <BarChart data={improvementData} layout="vertical" barSize={40}>
                    <CartesianGrid strokeDasharray="3 3" stroke={gridColor} />
                    <XAxis type="number" tick={{ fill: axisColor, fontSize: 12 }} domain={[0, 100]} label={{ value: "Improvement %", position: "insideBottom", fill: axisColor, fontSize: 11, offset: -5 }} />
                    <YAxis type="category" dataKey="name" tick={{ fill: axisColor, fontSize: 12 }} width={120} />
                    <Tooltip content={({ active, payload, label }) => {
                      if (!active || !payload?.length) return null;
                      return (
                        <div className="bg-card border border-border rounded-lg px-3 py-2 shadow-lg">
                          <p className="text-xs text-muted-foreground mb-1">{label}</p>
                          <p className="text-sm font-bold text-green-500">{Number(payload[0].value).toFixed(1)}% improvement</p>
                        </div>
                      );
                    }} />
                    <Bar dataKey="value" radius={[0, 6, 6, 0]}>
                      {improvementData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.fill} />
                      ))}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
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
