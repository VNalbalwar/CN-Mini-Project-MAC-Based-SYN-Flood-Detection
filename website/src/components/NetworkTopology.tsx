import { motion } from "framer-motion";
import { Server, Wifi, Monitor, Skull } from "lucide-react";
import { networkTopology } from "@/data/experiment-data";
import { useEffect, useState, useRef } from "react";

interface PacketDot {
  id: number;
  fromX: number;
  fromY: number;
  toX: number;
  toY: number;
  color: string;
  duration: number;
}

export function NetworkTopology() {
  const [packets, setPackets] = useState<PacketDot[]>([]);
  const packetIdRef = useRef(0);

  useEffect(() => {
    const interval = setInterval(() => {
      const isAttack = Math.random() > 0.5;
      const sourceIndex = Math.floor(Math.random() * 3);

      const attackerYs = [80, 160, 240];
      const clientYs = [340, 420, 500];

      const fromX = 60;
      const fromY = isAttack ? attackerYs[sourceIndex] : clientYs[sourceIndex];
      const switchX = 350;
      const switchY = 290;

      packetIdRef.current += 1;
      const newPacket: PacketDot = {
        id: packetIdRef.current,
        fromX,
        fromY,
        toX: switchX,
        toY: switchY,
        color: isAttack ? "#ef4444" : "#22c55e",
        duration: 1 + Math.random() * 0.5,
      };

      setPackets((prevPackets) => [...prevPackets.slice(-15), newPacket]);
    }, 400);

    return () => clearInterval(interval);
  }, []);

  return (
    <section className="py-20">
      <div className="section-container">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
          className="text-center mb-12"
        >
          <h2 className="text-3xl font-bold mb-3">SDN Network Topology</h2>
          <p className="text-muted-foreground max-w-2xl mx-auto">
            Our simulated testbed with 3 attackers, 3 legitimate clients, an OVS
            switch, and a target server — all managed by the SDN controller.
          </p>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          whileInView={{ opacity: 1, scale: 1 }}
          viewport={{ once: true }}
          transition={{ duration: 0.8 }}
          className="relative bg-card rounded-lg border border-border p-6 overflow-hidden max-w-4xl mx-auto"
        >
          <svg viewBox="0 0 700 580" className="w-full h-auto" style={{ maxHeight: 500 }}>
            {/* Connection lines */}
            {[80, 160, 240].map((y, i) => (
              <line key={`atk-${i}`} x1="100" y1={y} x2="330" y2="290" stroke="#ef4444" strokeWidth="1.5" strokeDasharray="4 4" opacity="0.4" />
            ))}
            {[340, 420, 500].map((y, i) => (
              <line key={`cli-${i}`} x1="100" y1={y} x2="330" y2="290" stroke="#22c55e" strokeWidth="1.5" strokeDasharray="4 4" opacity="0.4" />
            ))}
            <line x1="390" y1="290" x2="600" y2="290" stroke="#a1a1aa" strokeWidth="2" strokeDasharray="6 4" opacity="0.5" />

            {/* Animated packets */}
            {packets.map((p) => (
              <motion.circle key={p.id} r="4" fill={p.color} initial={{ cx: p.fromX, cy: p.fromY, opacity: 0.8 }} animate={{ cx: p.toX, cy: p.toY, opacity: 0 }} transition={{ duration: p.duration, ease: "linear" }} />
            ))}

            {/* Attacker nodes */}
            {networkTopology.attackers.map((atk, i) => {
              const y = 80 + i * 80;
              return (
                <g key={atk.label}>
                  <motion.circle cx="60" cy={y} r="28" className="fill-card stroke-red-500" strokeWidth="2" whileHover={{ scale: 1.1 }} />
                  <Skull x={50} y={y - 10} width="20" height="20" className="text-red-500" />
                  <text x="60" y={y + 42} textAnchor="middle" className="fill-red-500 text-[10px] font-semibold">{atk.label}</text>
                  <text x="60" y={y + 54} textAnchor="middle" className="fill-muted-foreground text-[8px] font-mono">{atk.ip}</text>
                </g>
              );
            })}

            {/* Client nodes */}
            {networkTopology.clients.map((cli, i) => {
              const y = 340 + i * 80;
              return (
                <g key={cli.label}>
                  <motion.circle cx="60" cy={y} r="28" className="fill-card stroke-green-500" strokeWidth="2" whileHover={{ scale: 1.1 }} />
                  <Monitor x={50} y={y - 10} width="20" height="20" className="text-green-500" />
                  <text x="60" y={y + 42} textAnchor="middle" className="fill-green-500 text-[10px] font-semibold">{cli.label}</text>
                  <text x="60" y={y + 54} textAnchor="middle" className="fill-muted-foreground text-[8px] font-mono">{cli.ip}</text>
                </g>
              );
            })}

            {/* Switch node */}
            <g>
              <motion.rect x="320" y="260" width="60" height="60" rx="12" className="fill-card stroke-foreground" strokeWidth="2" whileHover={{ scale: 1.05 }} />
              <Wifi x={338} y={278} width="24" height="24" className="text-foreground" />
              <text x="350" y="340" textAnchor="middle" className="fill-foreground text-[10px] font-semibold">OVS Switch</text>
              <text x="350" y="352" textAnchor="middle" className="fill-muted-foreground text-[8px]">SDN Controller</text>
            </g>

            {/* Server node */}
            <g>
              <motion.rect x="590" y="255" width="70" height="70" rx="14" className="fill-card stroke-amber-500" strokeWidth="2" whileHover={{ scale: 1.05 }} />
              <Server x={611} y={276} width="28" height="28" className="text-amber-500" />
              <text x="625" y="345" textAnchor="middle" className="fill-amber-500 text-[10px] font-semibold">{networkTopology.server.label}</text>
              <text x="625" y="357" textAnchor="middle" className="fill-muted-foreground text-[8px] font-mono">{networkTopology.server.ip}</text>
            </g>

            {/* Legend */}
            <g transform="translate(480, 480)">
              <rect x="0" y="0" width="200" height="70" rx="8" className="fill-card stroke-border" />
              <circle cx="20" cy="18" r="5" fill="#ef4444" />
              <text x="32" y="22" className="fill-foreground text-[10px]">Attackers (SYN Flood)</text>
              <circle cx="20" cy="38" r="5" fill="#22c55e" />
              <text x="32" y="42" className="fill-foreground text-[10px]">Legitimate Clients</text>
              <circle cx="20" cy="58" r="5" fill="#f59e0b" />
              <text x="32" y="62" className="fill-foreground text-[10px]">Target Server</text>
            </g>
          </svg>
        </motion.div>
      </div>
    </section>
  );
}
