import { motion } from "framer-motion";
import { pipelineStages } from "@/data/experiment-data";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ArrowDown, Sparkles } from "lucide-react";
import { useState } from "react";

export function Pipeline() {
  const [activeView, setActiveView] = useState<"paper" | "optimized">("paper");

  const stages =
    activeView === "paper" ? pipelineStages.paper : pipelineStages.optimized;

  return (
    <section id="pipeline" className="py-20">
      <div className="section-container">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
          className="text-center mb-12"
        >
          <h2 className="text-3xl sm:text-4xl font-bold mb-3">
            Detection Pipeline
          </h2>
          <p className="text-muted-foreground max-w-2xl mx-auto mb-8">
            The 5-table detection pipeline from Yang et al.'s paper, compared with
            our Port-Diversity optimization that adds a proactive detection layer.
          </p>

          {/* Toggle */}
          <div className="inline-flex items-center gap-1 bg-secondary rounded-lg p-1">
            <button
              className={`px-4 py-2 rounded-md text-sm font-medium transition-all cursor-pointer ${
                activeView === "paper"
                  ? "bg-card text-foreground shadow-sm"
                  : "text-muted-foreground hover:text-foreground"
              }`}
              onClick={() => setActiveView("paper")}
            >
              Paper Method
            </button>
            <button
              className={`px-4 py-2 rounded-md text-sm font-medium transition-all cursor-pointer ${
                activeView === "optimized"
                  ? "bg-card text-foreground shadow-sm"
                  : "text-muted-foreground hover:text-foreground"
              }`}
              onClick={() => setActiveView("optimized")}
            >
              <Sparkles className="w-3.5 h-3.5 inline mr-1.5" />
              Our Optimization
            </button>
          </div>
        </motion.div>

        {/* Pipeline flow */}
        <div className="flex flex-col items-center gap-2 max-w-lg mx-auto">
          {stages.map((stage, i) => (
            <motion.div
              key={`${activeView}-${i}`}
              initial={{ opacity: 0, x: i % 2 === 0 ? -30 : 30 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5, delay: i * 0.08 }}
              className="w-full"
            >
              <Card
                className="relative overflow-hidden transition-all hover:scale-[1.02]"
                style={{
                  borderColor: stage.color + "40",
                }}
              >
                {/* Color accent bar */}
                <div
                  className="absolute left-0 top-0 bottom-0 w-1"
                  style={{ backgroundColor: stage.color }}
                />

                <CardHeader className="py-3 px-5 flex flex-row items-center gap-3">
                  <div
                    className="w-8 h-8 rounded-lg flex items-center justify-center text-sm font-bold shrink-0"
                    style={{
                      backgroundColor: stage.color + "20",
                      color: stage.color,
                    }}
                  >
                    {i + 1}
                  </div>
                  <CardTitle className="text-sm sm:text-base flex items-center gap-2">
                    {stage.label}
                    {stage.label.includes("★") && (
                      <Badge variant="secondary" className="text-[10px]">
                        NEW
                      </Badge>
                    )}
                  </CardTitle>
                </CardHeader>
              </Card>

              {/* Arrow */}
              {i < stages.length - 1 && (
                <div className="flex justify-center py-1">
                  <ArrowDown
                    className="w-4 h-4 text-muted-foreground/50"
                  />
                </div>
              )}
            </motion.div>
          ))}
        </div>

        {/* Key difference callout */}
        {activeView === "optimized" && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            className="mt-10 max-w-lg mx-auto"
          >
            <Card className="border-border">
              <CardContent className="pt-6">
                <div className="flex items-start gap-3">
                  <Sparkles className="w-5 h-5 text-foreground shrink-0 mt-0.5" />
                  <div>
                    <p className="text-sm font-medium mb-1">
                      Key Optimization
                    </p>
                    <p className="text-sm text-muted-foreground">
                      The Port Diversity Check fires <strong className="text-foreground">before</strong> the
                      paper's SYN table — catching attackers during port
                      scanning (reconnaissance) with only ~15 SYNs instead of
                      waiting for 100. This is a{" "}
                      <strong className="text-foreground">proactive</strong> vs reactive approach.
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </motion.div>
        )}
      </div>
    </section>
  );
}
