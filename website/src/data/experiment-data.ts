// Actual experiment results from the Jupyter notebooks
export const experimentResults = {
  baseline: {
    detection_times: [11.80, 12.45, 12.39, 11.80, 12.52],
    avg_ms: 12.19,
    syn_threshold: 100,
    syns_to_detect: 100,
  },
  optimizer: {
    detection_times: [2.66, 2.63, 3.39, 2.69, 3.13],
    avg_ms: 2.90,
    port_threshold: 5,
    avg_syns_before: 13,
  },
  flood_with_optimizer: {
    detection_times: [12.43, 11.77, 12.12, 11.75, 11.93],
    avg_ms: 12.00,
  },
  config: {
    syn_threshold: 100,
    port_diversity_threshold: 5,
    time_window: 10.0,
    num_trials: 5,
    flood_packets: 200,
    legit_packets: 50,
  },
  improvements: {
    time_improvement: 76.2, // %
    exposure_reduction: 85.0, // %
  },
} as const;

export const networkTopology = {
  server: { ip: "10.0.0.254", mac: "00:00:00:00:ff:fe", label: "Server" },
  switch: { label: "OVS Switch (s1)" },
  attackers: [
    { ip: "10.0.0.10", mac: "00:00:00:00:01:01", label: "Attacker 1 (h1)" },
    { ip: "10.0.0.11", mac: "00:00:00:00:02:01", label: "Attacker 2 (h2)" },
    { ip: "10.0.0.12", mac: "00:00:00:00:03:01", label: "Attacker 3 (h3)" },
  ],
  clients: [
    { ip: "10.0.0.2", mac: "00:00:00:00:10:01", label: "Client 1 (c1)" },
    { ip: "10.0.0.3", mac: "00:00:00:00:10:02", label: "Client 2 (c2)" },
    { ip: "10.0.0.4", mac: "00:00:00:00:10:03", label: "Client 3 (c3)" },
  ],
} as const;

export const pipelineStages = {
  paper: [
    { label: "Packet Arrives", color: "#3498db", icon: "package" },
    { label: "Check BLACKLIST", color: "#e74c3c", icon: "shield-x" },
    { label: "Check WHITELIST", color: "#2ecc71", icon: "shield-check" },
    { label: "SYN? → Check-SYN Table", color: "#f39c12", icon: "arrow-right" },
    { label: "ACK? → Check-ACK Table", color: "#9b59b6", icon: "arrow-left" },
    { label: "Cross-Check SYN+ACK", color: "#1abc9c", icon: "git-compare" },
    { label: "SYN Count ≥ 100?", color: "#e67e22", icon: "alert-triangle" },
    { label: "BLACKLIST or WHITELIST", color: "#c0392b", icon: "ban" },
  ],
  optimized: [
    { label: "Packet Arrives", color: "#3498db", icon: "package" },
    { label: "Check BLACKLIST", color: "#e74c3c", icon: "shield-x" },
    { label: "Check WHITELIST", color: "#2ecc71", icon: "shield-check" },
    { label: "Port Diversity Check ★", color: "#00e5ff", icon: "radar" },
    { label: "SYN? → Check-SYN Table", color: "#f39c12", icon: "arrow-right" },
    { label: "ACK? → Check-ACK Table", color: "#9b59b6", icon: "arrow-left" },
    { label: "Cross-Check SYN+ACK", color: "#1abc9c", icon: "git-compare" },
    { label: "SYN Count ≥ 100?", color: "#e67e22", icon: "alert-triangle" },
    { label: "BLACKLIST or WHITELIST", color: "#c0392b", icon: "ban" },
  ],
} as const;

export const comparisonTable = [
  { metric: "Detection Type", paper: "Reactive", optimized: "Proactive (Port Diversity)" },
  { metric: "Avg Detection Time", paper: "12.19 ms", optimized: "2.90 ms" },
  { metric: "SYNs Before Detection", paper: "100", optimized: "~15" },
  { metric: "Min Detection Time", paper: "11.80 ms", optimized: "2.63 ms" },
  { metric: "Max Detection Time", paper: "12.52 ms", optimized: "3.39 ms" },
  { metric: "Port Scan Detection", paper: "No", optimized: "Yes" },
  { metric: "Data Structure", paper: "Cuckoo Hash Table", optimized: "Cuckoo Hash + Port Tracker" },
  { metric: "Attack Phase Caught", paper: "During Flood", optimized: "Reconnaissance" },
] as const;
