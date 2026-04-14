import { motion } from "framer-motion";
import { Shield, BookOpen, FileText, Code2 } from "lucide-react";

export function Footer() {
  return (
    <footer className="border-t border-border py-12">
      <div className="section-container">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="text-center"
        >
          <div className="flex items-center justify-center gap-2 mb-4">
            <Shield className="w-5 h-5 text-foreground" />
            <span className="text-lg font-bold">SYN Shield</span>
          </div>

          <p className="text-sm text-muted-foreground mb-6 max-w-xl mx-auto">
            MAC-Based SYN Flood Detection and Mitigation in SDN — A Computer
            Networks Mini Project implementing and optimizing the detection
            pipeline from Yang et al. (Sensors, MDPI, 2023).
          </p>

          <div className="flex items-center justify-center gap-6 mb-8">
            <a
              href="#"
              className="flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground transition-colors"
            >
              <Code2 className="w-4 h-4" /> Repository
            </a>
            <a
              href="#"
              className="flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground transition-colors"
            >
              <BookOpen className="w-4 h-4" /> Baseline Paper
            </a>
            <a
              href="#"
              className="flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground transition-colors"
            >
              <FileText className="w-4 h-4" /> Report
            </a>
          </div>

          <div className="text-xs text-muted-foreground/50">
            Built with React, Tailwind CSS, shadcn/ui, Recharts &amp; Framer Motion
          </div>
        </motion.div>
      </div>
    </footer>
  );
}
