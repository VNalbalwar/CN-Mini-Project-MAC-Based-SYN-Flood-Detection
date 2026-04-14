import { motion } from "framer-motion";
import { Shield, Zap, ArrowDown, Activity } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { useExperiment } from "@/context/ExperimentContext";

export function Hero() {
  const { results } = useExperiment();
  return (
    <section
      id="hero"
      className="min-h-screen flex items-center justify-center pt-16"
    >
      <div className="relative z-10 section-container text-center py-20">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8 }}
        >
          <Badge variant="outline" className="mb-6 px-4 py-1.5 text-sm">
            <Activity className="w-3.5 h-3.5 mr-1.5" />
            Computer Networks Mini Project
          </Badge>
        </motion.div>

        <motion.h1
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.1 }}
          className="text-4xl sm:text-5xl lg:text-6xl font-bold leading-tight tracking-tight mb-6"
        >
          MAC-Based SYN Flood
          <br />
          <span className="text-muted-foreground">Detection & Mitigation</span>
        </motion.h1>

        <motion.p
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.2 }}
          className="text-lg text-muted-foreground max-w-2xl mx-auto mb-12 leading-relaxed"
        >
          An SDN-based detection pipeline using{" "}
          <span className="text-foreground font-medium">Cuckoo Hash Tables</span> with a novel{" "}
          <span className="text-foreground font-medium">Port-Diversity Optimization</span> that
          catches attackers during reconnaissance — before the flood begins.
        </motion.p>

        {/* Key stats */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.3 }}
          className="flex flex-wrap items-center justify-center gap-4 mb-12"
        >
          <div className="flex items-center gap-3 px-5 py-3 rounded-lg bg-card border border-border">
            <Zap className="w-5 h-5 text-green-500" />
            <div className="text-left">
              <div className="text-2xl font-bold text-green-500">
                {results.improvements.time_improvement}%
              </div>
              <div className="text-xs text-muted-foreground">Faster Detection</div>
            </div>
          </div>

          <div className="flex items-center gap-3 px-5 py-3 rounded-lg bg-card border border-border">
            <Shield className="w-5 h-5 text-blue-500" />
            <div className="text-left">
              <div className="text-2xl font-bold text-blue-500">
                {results.improvements.exposure_reduction}%
              </div>
              <div className="text-xs text-muted-foreground">Less Exposure</div>
            </div>
          </div>

          <div className="flex items-center gap-3 px-5 py-3 rounded-lg bg-card border border-border">
            <Activity className="w-5 h-5 text-amber-500" />
            <div className="text-left">
              <div className="text-2xl font-bold text-amber-500">
                {results.optimizer.avg_ms}ms
              </div>
              <div className="text-xs text-muted-foreground">Avg Detection</div>
            </div>
          </div>
        </motion.div>

        <motion.p
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.8, delay: 0.5 }}
          className="text-sm text-muted-foreground mb-4"
        >
          Based on:{" "}
          <span className="italic">
            "Detection and Mitigation of SYN Flooding Attacks through SYN/ACK Packets
            and Black/White Lists"
          </span>{" "}
          — Yang et al., Sensors (MDPI), 2023
        </motion.p>

        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 1, delay: 0.8 }}
          className="mt-8"
        >
          <a
            href="#pipeline"
            className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors"
          >
            Explore the pipeline
            <motion.div
              animate={{ y: [0, 6, 0] }}
              transition={{ duration: 1.5, repeat: Infinity }}
            >
              <ArrowDown className="w-4 h-4" />
            </motion.div>
          </a>
        </motion.div>
      </div>
    </section>
  );
}
