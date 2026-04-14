import { motion } from "framer-motion";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Hash,
  Table2,
  Search,
  ArrowLeftRight,
  Trash2,
  Check,
} from "lucide-react";
import { useState } from "react";

interface CuckooState {
  table1: (string | null)[];
  table2: (string | null)[];
  lookupResult: { found: boolean; table: number; index: number } | null;
  lastAction: string;
}

const TABLE_SIZE = 8;

function h1(mac: string, size: number): number {
  const parts = mac.split(":");
  return parts.reduce((sum, b) => sum + parseInt(b, 16), 0) % size;
}

function h2(mac: string, size: number): number {
  const parts = mac.split(":");
  let val = 0;
  for (const b of parts) val ^= parseInt(b, 16);
  return (val * 31) % size;
}

export function CuckooDemo() {
  const [state, setState] = useState<CuckooState>({
    table1: Array(TABLE_SIZE).fill(null),
    table2: Array(TABLE_SIZE).fill(null),
    lookupResult: null,
    lastAction: "Ready — insert a MAC address to see Cuckoo Hashing in action",
  });
  const [inputMac, setInputMac] = useState("00:00:00:00:01:01");
  const [highlightIdx, setHighlightIdx] = useState<{
    t: number;
    i: number;
  } | null>(null);

  const insert = () => {
    const mac = inputMac.trim();
    if (!mac) return;

    setState((prev) => {
      const t1 = [...prev.table1];
      const t2 = [...prev.table2];

      // Check if already present
      if (t1[h1(mac, TABLE_SIZE)] === mac || t2[h2(mac, TABLE_SIZE)] === mac) {
        return {
          ...prev,
          lastAction: `"${mac}" already exists in the table`,
          lookupResult: null,
        };
      }

      let key = mac;
      for (let i = 0; i < 10; i++) {
        const idx1 = h1(key, TABLE_SIZE);
        if (t1[idx1] === null) {
          t1[idx1] = key;
          setHighlightIdx({ t: 1, i: idx1 });
          return {
            table1: t1,
            table2: t2,
            lookupResult: null,
            lastAction: `Inserted "${mac}" → Table 1[${idx1}]`,
          };
        }
        const evicted = t1[idx1]!;
        t1[idx1] = key;
        key = evicted;

        const idx2 = h2(key, TABLE_SIZE);
        if (t2[idx2] === null) {
          t2[idx2] = key;
          setHighlightIdx({ t: 2, i: idx2 });
          return {
            table1: t1,
            table2: t2,
            lookupResult: null,
            lastAction: `Inserted "${mac}" → evicted "${evicted}" → Table 2[${idx2}]`,
          };
        }
        const evicted2 = t2[idx2]!;
        t2[idx2] = key;
        key = evicted2;
      }

      return {
        table1: t1,
        table2: t2,
        lookupResult: null,
        lastAction: `Insert "${mac}" — max evictions reached, rehash needed`,
      };
    });
  };

  const lookup = () => {
    const mac = inputMac.trim();
    if (!mac) return;

    const idx1 = h1(mac, TABLE_SIZE);
    const idx2 = h2(mac, TABLE_SIZE);

    if (state.table1[idx1] === mac) {
      setHighlightIdx({ t: 1, i: idx1 });
      setState((prev) => ({
        ...prev,
        lookupResult: { found: true, table: 1, index: idx1 },
        lastAction: `Lookup "${mac}" → FOUND in Table 1[${idx1}] — O(1)`,
      }));
    } else if (state.table2[idx2] === mac) {
      setHighlightIdx({ t: 2, i: idx2 });
      setState((prev) => ({
        ...prev,
        lookupResult: { found: true, table: 2, index: idx2 },
        lastAction: `Lookup "${mac}" → FOUND in Table 2[${idx2}] — O(1)`,
      }));
    } else {
      setHighlightIdx(null);
      setState((prev) => ({
        ...prev,
        lookupResult: { found: false, table: 0, index: 0 },
        lastAction: `Lookup "${mac}" → NOT FOUND (checked T1[${idx1}], T2[${idx2}])`,
      }));
    }
  };

  const clearTables = () => {
    setState({
      table1: Array(TABLE_SIZE).fill(null),
      table2: Array(TABLE_SIZE).fill(null),
      lookupResult: null,
      lastAction: "Tables cleared",
    });
    setHighlightIdx(null);
  };

  const presetMacs = [
    "00:00:00:00:01:01",
    "00:00:00:00:02:01",
    "00:00:00:00:03:01",
    "00:00:00:00:10:01",
    "00:00:00:00:ff:fe",
  ];

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
          <h2 className="text-3xl sm:text-4xl font-bold mb-3">
            Cuckoo Hash Table Demo
          </h2>
          <p className="text-muted-foreground max-w-2xl mx-auto">
            The paper uses Cuckoo Hashing for O(1) lookup in Blacklist and
            Whitelist tables. Try inserting MAC addresses and see how collisions
            are resolved through eviction.
          </p>
        </motion.div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Controls */}
          <Card className="border-border lg:col-span-1">
            <CardHeader>
              <CardTitle className="text-base flex items-center gap-2">
                <Hash className="w-4 h-4 text-primary" /> Controls
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <label className="text-xs text-muted-foreground block mb-1.5">
                  MAC Address
                </label>
                <input
                  type="text"
                  value={inputMac}
                  onChange={(e) => setInputMac(e.target.value)}
                  className="w-full bg-background border border-border rounded-lg px-3 py-2 text-sm font-mono focus:outline-none focus:ring-2 focus:ring-ring"
                  placeholder="00:00:00:00:01:01"
                />
              </div>

              <div className="flex flex-wrap gap-1.5">
                {presetMacs.map((mac) => (
                  <Badge
                    key={mac}
                    variant="outline"
                    className="cursor-pointer text-[10px] font-mono hover:bg-secondary/50 transition-colors"
                    onClick={() => setInputMac(mac)}
                  >
                    {mac}
                  </Badge>
                ))}
              </div>

              <div className="flex gap-2">
                <button
                  onClick={insert}
                  className="flex-1 flex items-center justify-center gap-1.5 bg-primary text-primary-foreground rounded-lg px-3 py-2 text-sm font-medium hover:bg-primary/90 transition-colors cursor-pointer"
                >
                  <ArrowLeftRight className="w-3.5 h-3.5" /> Insert
                </button>
                <button
                  onClick={lookup}
                  className="flex-1 flex items-center justify-center gap-1.5 bg-secondary text-secondary-foreground rounded-lg px-3 py-2 text-sm font-medium hover:bg-secondary/80 transition-colors cursor-pointer"
                >
                  <Search className="w-3.5 h-3.5" /> Lookup
                </button>
                <button
                  onClick={clearTables}
                  className="flex items-center justify-center gap-1.5 bg-destructive/20 text-destructive rounded-lg px-3 py-2 text-sm font-medium hover:bg-destructive/30 transition-colors cursor-pointer"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                </button>
              </div>

              <div className="text-xs text-muted-foreground bg-background/50 rounded-lg p-3 border border-border/30">
                <span className="text-foreground font-medium">Status:</span>{" "}
                {state.lastAction}
              </div>

              {state.lookupResult && (
                <div
                  className={`text-sm font-medium flex items-center gap-2 ${
                    state.lookupResult.found
                      ? "text-green-400"
                      : "text-red-400"
                  }`}
                >
                  {state.lookupResult.found ? (
                    <Check className="w-4 h-4" />
                  ) : (
                    <Trash2 className="w-4 h-4" />
                  )}
                  {state.lookupResult.found
                    ? `Found in Table ${state.lookupResult.table}[${state.lookupResult.index}]`
                    : "Not found"}
                </div>
              )}
            </CardContent>
          </Card>

          {/* Tables */}
          <div className="lg:col-span-2 grid grid-cols-1 sm:grid-cols-2 gap-4">
            {[
              { title: "Table 1 (h₁)", data: state.table1, tableNum: 1 },
              { title: "Table 2 (h₂)", data: state.table2, tableNum: 2 },
            ].map(({ title, data, tableNum }) => (
              <Card key={title} className="border-border">
                <CardHeader className="py-3">
                  <CardTitle className="text-sm flex items-center gap-2">
                    <Table2 className="w-4 h-4 text-primary" /> {title}
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-1.5">
                    {data.map((entry, idx) => (
                      <motion.div
                        key={idx}
                        layout
                        className={`flex items-center gap-2 px-2.5 py-1.5 rounded-md border text-xs font-mono transition-colors ${
                          highlightIdx?.t === tableNum &&
                          highlightIdx?.i === idx
                            ? "border-primary bg-primary/10 text-primary"
                            : entry
                            ? "border-border/50 bg-secondary/30"
                            : "border-border/20 bg-background/30"
                        }`}
                      >
                        <span className="text-muted-foreground w-6 text-right">
                          [{idx}]
                        </span>
                        <span className={entry ? "text-foreground" : "text-muted-foreground/30"}>
                          {entry || "— empty —"}
                        </span>
                      </motion.div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
