import { motion, AnimatePresence } from "framer-motion";
import { useState, useCallback, useRef, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Play,
  RotateCcw,
  Shield,
  ShieldX,
  ShieldCheck,
  Activity,
  Skull,
  Zap,
} from "lucide-react";

interface LogEntry {
  id: number;
  time: number;
  type: "syn" | "ack" | "blacklist" | "whitelist" | "drop" | "info" | "optim";
  mac: string;
  message: string;
}

interface SimState {
  running: boolean;
  mode: "baseline" | "optimized";
  synCount: Record<string, number>;
  portTracker: Record<string, Set<number>>;
  blacklist: Set<string>;
  whitelist: Set<string>;
  logs: LogEntry[];
  totalPackets: number;
  detectedAt: number | null;
  startTime: number | null;
}

const ATTACKER_MAC = "00:00:00:00:01:01";
const CLIENT_MAC = "00:00:00:00:10:01";
const SYN_THRESHOLD = 100;
const PORT_THRESHOLD = 5;
const SCAN_PORTS = [22, 80, 443, 8080, 3306, 5432, 6379, 27017];

function initialState(): SimState {
  return {
    running: false,
    mode: "baseline",
    synCount: {},
    portTracker: {},
    blacklist: new Set(),
    whitelist: new Set(),
    logs: [],
    totalPackets: 0,
    detectedAt: null,
    startTime: null,
  };
}

export function LiveSimulation() {
  const [state, setState] = useState<SimState>(initialState());
  const [mode, setMode] = useState<"baseline" | "optimized">("baseline");
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const logIdRef = useRef(0);
  const packetIndexRef = useRef(0);

  const addLog = useCallback(
    (type: LogEntry["type"], mac: string, message: string) => {
      logIdRef.current += 1;
      const entry: LogEntry = {
        id: logIdRef.current,
        time: Date.now(),
        type,
        mac,
        message,
      };
      setState((prev) => ({
        ...prev,
        logs: [...prev.logs.slice(-50), entry],
      }));
    },
    []
  );

  const stopSimulation = useCallback(() => {
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
      intervalRef.current = null;
    }
    setState((prev) => ({ ...prev, running: false }));
  }, []);

  const runSimulation = useCallback(() => {
    const newState = initialState();
    newState.running = true;
    newState.mode = mode;
    newState.startTime = Date.now();
    setState(newState);

    logIdRef.current = 0;
    packetIndexRef.current = 0;

    // Build packet sequence
    const packets: Array<{
      type: "syn" | "ack";
      mac: string;
      ip: string;
      dstPort: number;
      isAttacker: boolean;
    }> = [];

    // Legitimate traffic: SYN+ACK pairs
    for (let i = 0; i < 16; i++) {
      const sport = 1024 + Math.floor(Math.random() * 64000);
      packets.push({
        type: "syn",
        mac: CLIENT_MAC,
        ip: "10.0.0.2",
        dstPort: 80,
        isAttacker: false,
      });
      packets.push({
        type: "ack",
        mac: CLIENT_MAC,
        ip: "10.0.0.2",
        dstPort: sport,
        isAttacker: false,
      });
    }

    if (mode === "optimized") {
      // Port scan: SYNs to multiple ports
      for (const port of SCAN_PORTS) {
        for (let j = 0; j < 3; j++) {
          packets.push({
            type: "syn",
            mac: ATTACKER_MAC,
            ip: "10.0.0.10",
            dstPort: port,
            isAttacker: true,
          });
        }
      }
    } else {
      // SYN flood to single port
      for (let i = 0; i < 200; i++) {
        packets.push({
          type: "syn",
          mac: ATTACKER_MAC,
          ip: "10.0.0.10",
          dstPort: 80,
          isAttacker: true,
        });
      }
    }

    // Shuffle to simulate interleaving (keep some ordering)
    for (let i = packets.length - 1; i > 0; i--) {
      const j = Math.max(0, i - Math.floor(Math.random() * 5));
      [packets[i], packets[j]] = [packets[j], packets[i]];
    }

    intervalRef.current = setInterval(() => {
      const idx = packetIndexRef.current;
      if (idx >= packets.length) {
        stopSimulation();
        return;
      }

      const pkt = packets[idx];
      packetIndexRef.current += 1;

      setState((prev) => {
        if (prev.detectedAt !== null && pkt.isAttacker) {
          // Already detected, just drop
          return {
            ...prev,
            totalPackets: prev.totalPackets + 1,
          };
        }

        const newState = { ...prev, totalPackets: prev.totalPackets + 1 };

        // Check blacklist
        if (newState.blacklist.has(pkt.mac)) {
          addLog("drop", pkt.mac, `DROPPED (blacklisted) — ${pkt.mac}`);
          return newState;
        }

        // Check whitelist
        if (newState.whitelist.has(pkt.mac)) {
          addLog("whitelist", pkt.mac, `FORWARDED (whitelisted) — ${pkt.mac}`);
          return newState;
        }

        if (pkt.type === "syn") {
          // Track SYN count
          const currentCount = (newState.synCount[pkt.mac] || 0) + 1;
          newState.synCount = { ...newState.synCount, [pkt.mac]: currentCount };

          if (pkt.isAttacker) {
            addLog(
              "syn",
              pkt.mac,
              `SYN #${currentCount} from ${pkt.mac} → port ${pkt.dstPort}`
            );
          }

          // OPTIMIZED MODE: Port diversity check
          if (mode === "optimized" && pkt.isAttacker) {
            const existingPorts = prev.portTracker[pkt.mac] || new Set<number>();
            const newPorts = new Set(existingPorts);
            newPorts.add(pkt.dstPort);
            newState.portTracker = {
              ...newState.portTracker,
              [pkt.mac]: newPorts,
            };

            if (newPorts.size >= PORT_THRESHOLD && !prev.detectedAt) {
              const bl = new Set(newState.blacklist);
              bl.add(pkt.mac);
              newState.blacklist = bl;
              newState.detectedAt = currentCount;

              addLog(
                "optim",
                pkt.mac,
                `⚡ PORT SCAN DETECTED — ${pkt.mac} hit ${newPorts.size} unique ports! BLACKLISTED after ${currentCount} SYNs`
              );
              return newState;
            }
          }

          // BASELINE: SYN threshold check
          if (currentCount >= SYN_THRESHOLD && !prev.detectedAt) {
            const bl = new Set(newState.blacklist);
            bl.add(pkt.mac);
            newState.blacklist = bl;
            newState.detectedAt = currentCount;

            addLog(
              "blacklist",
              pkt.mac,
              `🚨 SYN FLOOD DETECTED — ${pkt.mac} sent ${currentCount} SYNs! BLACKLISTED`
            );
          }
        } else if (pkt.type === "ack") {
          // ACK: whitelist the client
          if (!pkt.isAttacker && !newState.whitelist.has(pkt.mac)) {
            const wl = new Set(newState.whitelist);
            wl.add(pkt.mac);
            newState.whitelist = wl;

            addLog(
              "whitelist",
              pkt.mac,
              `✅ ACK verified — ${pkt.mac} WHITELISTED`
            );
          }
        }

        return newState;
      });
    }, 60);
  }, [mode, addLog, stopSimulation]);

  useEffect(() => {
    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
  }, []);

  const reset = () => {
    stopSimulation();
    setState(initialState());
    packetIndexRef.current = 0;
    logIdRef.current = 0;
  };

  const attackerSyns = state.synCount[ATTACKER_MAC] || 0;
  const attackerPorts = state.portTracker[ATTACKER_MAC]
    ? state.portTracker[ATTACKER_MAC].size
    : 0;

  return (
    <section id="simulation" className="py-20">
      <div className="section-container">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
          className="text-center mb-12"
        >
          <h2 className="text-3xl sm:text-4xl font-bold mb-3">
            Live Simulation
          </h2>
          <p className="text-muted-foreground max-w-2xl mx-auto">
            Watch the detection pipeline in action. Toggle between the paper's
            method and our optimization to see the difference in real-time.
          </p>
        </motion.div>

        {/* Controls */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="flex flex-wrap items-center justify-center gap-4 mb-8"
        >
          <div className="inline-flex items-center gap-1 bg-secondary rounded-lg p-1">
            <button
              className={`px-4 py-2 rounded-md text-sm font-medium transition-all cursor-pointer ${
                mode === "baseline"
                  ? "bg-card text-foreground shadow-sm"
                  : "text-muted-foreground hover:text-foreground"
              }`}
              onClick={() => {
                if (!state.running) setMode("baseline");
              }}
              disabled={state.running}
            >
              Paper Method
            </button>
            <button
              className={`px-4 py-2 rounded-md text-sm font-medium transition-all cursor-pointer ${
                mode === "optimized"
                  ? "bg-card text-foreground shadow-sm"
                  : "text-muted-foreground hover:text-foreground"
              }`}
              onClick={() => {
                if (!state.running) setMode("optimized");
              }}
              disabled={state.running}
            >
              Optimized
            </button>
          </div>

          <Button
            onClick={state.running ? stopSimulation : runSimulation}
            variant={state.running ? "destructive" : "default"}
            className="gap-2"
          >
            {state.running ? (
              <>
                <Activity className="w-4 h-4 animate-pulse" /> Running...
              </>
            ) : (
              <>
                <Play className="w-4 h-4" /> Run Simulation
              </>
            )}
          </Button>

          <Button variant="outline" onClick={reset} className="gap-2">
            <RotateCcw className="w-4 h-4" /> Reset
          </Button>
        </motion.div>

        {/* Stats dashboard */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-8">
          <Card className="border-border">
            <CardContent className="pt-4 pb-3 px-4 text-center">
              <div className="text-2xl font-bold text-foreground">
                {state.totalPackets}
              </div>
              <div className="text-xs text-muted-foreground">Total Packets</div>
            </CardContent>
          </Card>

          <Card
            className={`border-border ${
              attackerSyns > 0 ? "border-red-500/30" : ""
            }`}
          >
            <CardContent className="pt-4 pb-3 px-4 text-center">
              <div className="text-2xl font-bold text-red-400 flex items-center justify-center gap-1">
                <Skull className="w-4 h-4" />
                {attackerSyns}
              </div>
              <div className="text-xs text-muted-foreground">
                Attacker SYNs
                {mode === "baseline"
                  ? ` / ${SYN_THRESHOLD}`
                  : ""}
              </div>
              {mode === "baseline" && attackerSyns > 0 && (
                <div className="mt-1.5 h-1.5 bg-secondary rounded-full overflow-hidden">
                  <motion.div
                    className="h-full bg-red-500 rounded-full"
                    animate={{
                      width: `${Math.min(
                        100,
                        (attackerSyns / SYN_THRESHOLD) * 100
                      )}%`,
                    }}
                  />
                </div>
              )}
            </CardContent>
          </Card>

          {mode === "optimized" && (
            <Card className={`border-border ${
                attackerPorts > 0 ? "border-blue-500/30" : ""
              }`}>
              <CardContent className="pt-4 pb-3 px-4 text-center">
                <div className="text-2xl font-bold text-blue-500">
                  {attackerPorts}
                </div>
                <div className="text-xs text-muted-foreground">
                  Unique Ports / {PORT_THRESHOLD}
                </div>
                <div className="mt-1.5 h-1.5 bg-secondary rounded-full overflow-hidden">
                  <motion.div
                    className="h-full bg-blue-500 rounded-full"
                    animate={{
                      width: `${Math.min(
                        100,
                        (attackerPorts / PORT_THRESHOLD) * 100
                      )}%`,
                    }}
                  />
                </div>
              </CardContent>
            </Card>
          )}

          <Card
            className={`border-border ${
              state.detectedAt
                ? "border-green-500/30"
                : ""
            }`}
          >
            <CardContent className="pt-4 pb-3 px-4 text-center">
              {state.detectedAt ? (
                <>
                  <div className="text-2xl font-bold text-green-400 flex items-center justify-center gap-1">
                    <Shield className="w-4 h-4" />
                    {state.detectedAt}
                  </div>
                  <div className="text-xs text-muted-foreground">SYNs to Detect</div>
                </>
              ) : (
                <>
                  <div className="text-2xl font-bold text-muted-foreground">—</div>
                  <div className="text-xs text-muted-foreground">Not Detected Yet</div>
                </>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Tables visualization */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-8">
          <Card className="border-red-500/20">
            <CardHeader className="py-3 px-4">
              <CardTitle className="text-sm flex items-center gap-2">
                <ShieldX className="w-4 h-4 text-red-400" /> Blacklist
              </CardTitle>
            </CardHeader>
            <CardContent className="px-4 pb-3">
              <AnimatePresence>
                {state.blacklist.size > 0 ? (
                  Array.from(state.blacklist).map((mac) => (
                    <motion.div
                      key={mac}
                      initial={{ opacity: 0, scale: 0.8 }}
                      animate={{ opacity: 1, scale: 1 }}
                      className="mb-1"
                    >
                      <Badge variant="destructive" className="font-mono text-[10px]">
                        {mac}
                      </Badge>
                    </motion.div>
                  ))
                ) : (
                  <span className="text-xs text-muted-foreground">Empty</span>
                )}
              </AnimatePresence>
            </CardContent>
          </Card>

          <Card className="border-green-500/20">
            <CardHeader className="py-3 px-4">
              <CardTitle className="text-sm flex items-center gap-2">
                <ShieldCheck className="w-4 h-4 text-green-400" /> Whitelist
              </CardTitle>
            </CardHeader>
            <CardContent className="px-4 pb-3">
              <AnimatePresence>
                {state.whitelist.size > 0 ? (
                  Array.from(state.whitelist).map((mac) => (
                    <motion.div
                      key={mac}
                      initial={{ opacity: 0, scale: 0.8 }}
                      animate={{ opacity: 1, scale: 1 }}
                      className="mb-1"
                    >
                      <Badge className="bg-green-500/20 text-green-400 border-green-500/30 font-mono text-[10px]">
                        {mac}
                      </Badge>
                    </motion.div>
                  ))
                ) : (
                  <span className="text-xs text-muted-foreground">Empty</span>
                )}
              </AnimatePresence>
            </CardContent>
          </Card>

          {mode === "optimized" && (
            <Card className="border-cyan-500/20">
              <CardHeader className="py-3 px-4">
                <CardTitle className="text-sm flex items-center gap-2">
                  <Zap className="w-4 h-4 text-cyan-400" /> Port Tracker
                </CardTitle>
              </CardHeader>
              <CardContent className="px-4 pb-3">
                {attackerPorts > 0 ? (
                  <div>
                    <div className="text-xs text-muted-foreground mb-1">
                      {ATTACKER_MAC}
                    </div>
                    <div className="flex flex-wrap gap-1">
                      <AnimatePresence>
                        {state.portTracker[ATTACKER_MAC] &&
                          Array.from(state.portTracker[ATTACKER_MAC]).map(
                            (port) => (
                              <motion.div
                                key={port}
                                initial={{ opacity: 0, scale: 0.5 }}
                                animate={{ opacity: 1, scale: 1 }}
                              >
                                <Badge
                                  variant="outline"
                                  className="text-cyan-400 border-cyan-500/30 text-[10px] font-mono"
                                >
                                  :{port}
                                </Badge>
                              </motion.div>
                            )
                          )}
                      </AnimatePresence>
                    </div>
                  </div>
                ) : (
                  <span className="text-xs text-muted-foreground">
                    No ports tracked
                  </span>
                )}
              </CardContent>
            </Card>
          )}
        </div>

        {/* Live log */}
        <Card className="border-border">
          <CardHeader className="py-3 px-4">
            <CardTitle className="text-sm flex items-center gap-2">
              <Activity className="w-4 h-4 text-primary" /> Detection Log
            </CardTitle>
          </CardHeader>
          <CardContent className="px-4 pb-4">
            <div className="h-48 overflow-y-auto font-mono text-xs space-y-0.5 bg-background/50 rounded-lg p-3 border border-border/30">
              {state.logs.length === 0 ? (
                <div className="text-muted-foreground text-center py-8">
                  Press "Run Simulation" to start...
                </div>
              ) : (
                <AnimatePresence>
                  {state.logs.map((log) => (
                    <motion.div
                      key={log.id}
                      initial={{ opacity: 0, x: -10 }}
                      animate={{ opacity: 1, x: 0 }}
                      className={`py-0.5 ${
                        log.type === "blacklist"
                          ? "text-red-400"
                          : log.type === "optim"
                          ? "text-cyan-400"
                          : log.type === "whitelist"
                          ? "text-green-500"
                          : log.type === "syn"
                          ? "text-yellow-400/80"
                          : log.type === "drop"
                          ? "text-red-400/60"
                          : "text-muted-foreground"
                      }`}
                    >
                      {log.message}
                    </motion.div>
                  ))}
                </AnimatePresence>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Result callout */}
        <AnimatePresence>
          {state.detectedAt !== null && !state.running && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              className="mt-8"
            >
              <Card className="border-green-500/30 bg-green-500/5">
                <CardContent className="pt-6 text-center">
                  <Shield className="w-10 h-10 text-green-500 mx-auto mb-3" />
                  <h3 className="text-xl font-bold text-green-500 mb-2">
                    Attack Detected & Mitigated!
                  </h3>
                  <p className="text-muted-foreground text-sm">
                    {mode === "optimized" ? (
                      <>
                        <strong className="text-cyan-400">Port-Diversity Optimization</strong>{" "}
                        caught the attacker after just{" "}
                        <strong>{state.detectedAt} SYNs</strong> — during the{" "}
                        <strong>reconnaissance phase</strong>, before the flood
                        even started.
                      </>
                    ) : (
                      <>
                        <strong className="text-red-400">Paper's Method</strong>{" "}
                        detected the flood after{" "}
                        <strong>{state.detectedAt} SYNs</strong> — the server
                        was already exposed to the full attack volume.
                      </>
                    )}
                  </p>
                </CardContent>
              </Card>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </section>
  );
}
