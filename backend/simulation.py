"""
SYN Flood Detection Simulation Engine.
Extracted from 01_Implementation.ipynb — this is the exact same logic.
"""

import time
import random
from dataclasses import dataclass
from collections import defaultdict


# ──────────────────── Cuckoo Hash Table ────────────────────

class CuckooHashTable:
    def __init__(self, size=256, max_evictions=10):
        self.size = size
        self.max_evictions = max_evictions
        self.table1 = [None] * size
        self.table2 = [None] * size
        self._count = 0

    def _h1(self, mac: str) -> int:
        parts = mac.split(':')
        return sum(int(b, 16) for b in parts) % self.size

    def _h2(self, mac: str) -> int:
        parts = mac.split(':')
        val = 0
        for b in parts:
            val ^= int(b, 16)
        return (val * 31) % self.size

    def insert(self, mac: str) -> bool:
        if self.lookup(mac):
            return True
        key = mac
        for _ in range(self.max_evictions):
            idx1 = self._h1(key)
            if self.table1[idx1] is None:
                self.table1[idx1] = key
                self._count += 1
                return True
            key, self.table1[idx1] = self.table1[idx1], key
            idx2 = self._h2(key)
            if self.table2[idx2] is None:
                self.table2[idx2] = key
                self._count += 1
                return True
            key, self.table2[idx2] = self.table2[idx2], key
        return False

    def lookup(self, mac: str) -> bool:
        return (
            self.table1[self._h1(mac)] == mac or
            self.table2[self._h2(mac)] == mac
        )


# ──────────────────── SimPacket ────────────────────

@dataclass
class SimPacket:
    src_mac: str
    dst_mac: str
    src_ip: str
    dst_ip: str
    src_port: int
    dst_port: int
    flags: int
    timestamp: float

    @property
    def is_syn(self):
        return bool(self.flags & 0x02) and not bool(self.flags & 0x10)

    @property
    def is_ack(self):
        return bool(self.flags & 0x10) and not bool(self.flags & 0x02)


# ──────────────────── Traffic Generators ────────────────────

SERVER_MAC = '00:00:00:00:ff:fe'


def generate_syn_flood(attacker_mac, attacker_ip, target_ip, target_port,
                       num_packets, start_time=None):
    packets = []
    t = start_time or time.perf_counter()
    for i in range(num_packets):
        pkt = SimPacket(
            src_mac=attacker_mac, dst_mac=SERVER_MAC,
            src_ip=attacker_ip, dst_ip=target_ip,
            src_port=random.randint(1024, 65535), dst_port=target_port,
            flags=0x02,
            timestamp=t + i * (0.0001 + random.uniform(0, 0.00005)),
        )
        packets.append(pkt)
    return packets


def generate_port_scan(attacker_mac, attacker_ip, target_ip, ports,
                       pkts_per_port=3, start_time=None):
    packets = []
    t = start_time or time.perf_counter()
    idx = 0
    for port in ports:
        for _ in range(pkts_per_port):
            pkt = SimPacket(
                src_mac=attacker_mac, dst_mac=SERVER_MAC,
                src_ip=attacker_ip, dst_ip=target_ip,
                src_port=random.randint(1024, 65535), dst_port=port,
                flags=0x02,
                timestamp=t + idx * (0.0002 + random.uniform(0, 0.0001)),
            )
            packets.append(pkt)
            idx += 1
    return packets


def generate_legit_traffic(client_mac, client_ip, target_ip, target_port,
                           num_pairs, start_time=None):
    packets = []
    t = start_time or time.perf_counter()
    for i in range(num_pairs):
        sport = random.randint(1024, 65535)
        base_t = t + i * (0.01 + random.uniform(0, 0.003))
        packets.append(SimPacket(
            src_mac=client_mac, dst_mac=SERVER_MAC,
            src_ip=client_ip, dst_ip=target_ip,
            src_port=sport, dst_port=target_port,
            flags=0x02, timestamp=base_t,
        ))
        packets.append(SimPacket(
            src_mac=client_mac, dst_mac=SERVER_MAC,
            src_ip=client_ip, dst_ip=target_ip,
            src_port=sport, dst_port=target_port,
            flags=0x10, timestamp=base_t + 0.001,
        ))
    return packets


# ──────────────────── Baseline Detector (Paper) ────────────────────

class BaselineDetector:
    def __init__(self, syn_threshold=100, ack_timeout=5.0):
        self.syn_threshold = syn_threshold
        self.ack_timeout = ack_timeout
        self.blacklist = CuckooHashTable()
        self.whitelist = CuckooHashTable()
        self.check_syn = defaultdict(lambda: {'count': 0, 'first_seen': None})
        self.check_ack = {}
        self.flag_table = {}
        self.stats = {
            'total_packets': 0, 'syn_packets': 0, 'ack_packets': 0,
            'blacklisted': 0, 'whitelisted': 0, 'dropped': 0, 'forwarded': 0,
            'detection_times': [],
        }

    def process_packet(self, pkt: SimPacket):
        self.stats['total_packets'] += 1
        now = pkt.timestamp

        if self.blacklist.lookup(pkt.src_mac):
            self.stats['dropped'] += 1
            return 'DROP'
        if self.whitelist.lookup(pkt.src_mac):
            self.stats['forwarded'] += 1
            return 'FORWARD'

        if pkt.is_syn:
            self.stats['syn_packets'] += 1
            key = (pkt.src_mac, pkt.src_ip, pkt.dst_port)
            if self.check_syn[key]['first_seen'] is None:
                self.check_syn[key]['first_seen'] = now
            self.check_syn[key]['count'] += 1
            self.flag_table[pkt.src_mac] = True

            if self.check_syn[key]['count'] >= self.syn_threshold:
                self.blacklist.insert(pkt.src_mac)
                self.stats['blacklisted'] += 1
                detection_time = (now - self.check_syn[key]['first_seen']) * 1000
                self.stats['detection_times'].append(detection_time)
                del self.check_syn[key]
                self.flag_table.pop(pkt.src_mac, None)
                return 'BLACKLIST'
            return 'PENDING'

        elif pkt.is_ack:
            self.stats['ack_packets'] += 1
            self.check_ack[(pkt.src_mac, pkt.src_ip)] = now
            for key in list(self.check_syn.keys()):
                if key[0] == pkt.src_mac and key[1] == pkt.src_ip:
                    self.whitelist.insert(pkt.src_mac)
                    self.stats['whitelisted'] += 1
                    del self.check_syn[key]
                    self.flag_table.pop(pkt.src_mac, None)
                    return 'WHITELIST'
            self.stats['dropped'] += 1
            return 'DROP'

        return 'DROP'


# ──────────────────── Optimized Detector ────────────────────

class OptimizedDetector:
    def __init__(self, syn_threshold=100, ack_timeout=5.0,
                 port_diversity_threshold=5, time_window=10.0):
        self.syn_threshold = syn_threshold
        self.ack_timeout = ack_timeout
        self.port_threshold = port_diversity_threshold
        self.time_window = time_window
        self.blacklist = CuckooHashTable()
        self.whitelist = CuckooHashTable()
        self.check_syn = defaultdict(lambda: {'count': 0, 'first_seen': None})
        self.check_ack = {}
        self.flag_table = {}

        self.port_tracker = defaultdict(lambda: {
            'ports': set(), 'first_seen': None,
            'alerted': False, 'syn_count': 0,
        })

        self.paper_stats = {
            'blacklisted': 0, 'detection_times': [], 'total_syns': 0,
        }
        self.optim_stats = {
            'port_scans_caught': 0, 'detection_times': [],
            'unique_ports_seen': [], 'syns_before_caught': [],
        }
        self.stats = {
            'total_packets': 0, 'syn_packets': 0, 'ack_packets': 0,
            'dropped': 0, 'forwarded': 0, 'whitelisted': 0,
        }

    def _check_port_diversity(self, src_mac, dst_port, now):
        entry = self.port_tracker[src_mac]
        if entry['first_seen'] is None:
            entry['first_seen'] = now
        if now - entry['first_seen'] > self.time_window:
            entry['ports'] = set()
            entry['first_seen'] = now
            entry['alerted'] = False
            entry['syn_count'] = 0
        entry['ports'].add(dst_port)
        entry['syn_count'] += 1

        if (len(entry['ports']) >= self.port_threshold
                and not entry['alerted']
                and not self.blacklist.lookup(src_mac)):
            entry['alerted'] = True
            self.blacklist.insert(src_mac)
            detection_time = (now - entry['first_seen']) * 1000
            self.optim_stats['port_scans_caught'] += 1
            self.optim_stats['detection_times'].append(detection_time)
            self.optim_stats['unique_ports_seen'].append(len(entry['ports']))
            self.optim_stats['syns_before_caught'].append(entry['syn_count'])
            return True
        return False

    def process_packet(self, pkt: SimPacket):
        self.stats['total_packets'] += 1
        now = pkt.timestamp

        if self.blacklist.lookup(pkt.src_mac):
            self.stats['dropped'] += 1
            return 'DROP'
        if self.whitelist.lookup(pkt.src_mac):
            self.stats['forwarded'] += 1
            return 'FORWARD'

        if pkt.is_syn:
            self.stats['syn_packets'] += 1
            self.paper_stats['total_syns'] += 1
            caught_early = self._check_port_diversity(pkt.src_mac, pkt.dst_port, now)
            if caught_early:
                return 'BLACKLIST_OPTIM'

            key = (pkt.src_mac, pkt.src_ip, pkt.dst_port)
            if self.check_syn[key]['first_seen'] is None:
                self.check_syn[key]['first_seen'] = now
            self.check_syn[key]['count'] += 1
            self.flag_table[pkt.src_mac] = True

            if self.check_syn[key]['count'] >= self.syn_threshold:
                self.blacklist.insert(pkt.src_mac)
                self.paper_stats['blacklisted'] += 1
                detection_time = (now - self.check_syn[key]['first_seen']) * 1000
                self.paper_stats['detection_times'].append(detection_time)
                del self.check_syn[key]
                self.flag_table.pop(pkt.src_mac, None)
                return 'BLACKLIST_PAPER'
            return 'PENDING'

        elif pkt.is_ack:
            self.stats['ack_packets'] += 1
            self.check_ack[(pkt.src_mac, pkt.src_ip)] = now
            for key in list(self.check_syn.keys()):
                if key[0] == pkt.src_mac and key[1] == pkt.src_ip:
                    self.whitelist.insert(pkt.src_mac)
                    self.stats['whitelisted'] += 1
                    del self.check_syn[key]
                    self.flag_table.pop(pkt.src_mac, None)
                    return 'WHITELIST'
            self.stats['dropped'] += 1
            return 'DROP'

        return 'DROP'


# ──────────────────── Experiment Runners ────────────────────

SERVER_IP = '10.0.0.254'
ATTACKER_IPS = ['10.0.0.10', '10.0.0.11', '10.0.0.12']
ATTACKER_MACS = ['00:00:00:00:01:01', '00:00:00:00:02:01', '00:00:00:00:03:01']
CLIENT_IPS = ['10.0.0.2', '10.0.0.3', '10.0.0.4']
CLIENT_MACS = ['00:00:00:00:10:01', '00:00:00:00:10:02', '00:00:00:00:10:03']

DEFAULT_SCAN_PORTS = [22, 80, 443, 8080, 3306, 5432, 6379, 27017]


def run_experiment(
    syn_threshold: int = 100,
    port_diversity_threshold: int = 5,
    time_window: float = 10.0,
    num_trials: int = 5,
    flood_packets: int = 200,
    legit_packets: int = 50,
    scan_ports: list[int] | None = None,
    pkts_per_port: int = 3,
) -> dict:
    """Run all three experiments and return results dict."""
    if scan_ports is None:
        scan_ports = DEFAULT_SCAN_PORTS

    ack_timeout = 5.0

    # ── Experiment 1: Baseline (Paper Method) ──
    baseline_times = []
    for _ in range(num_trials):
        detector = BaselineDetector(syn_threshold=syn_threshold, ack_timeout=ack_timeout)
        t_base = time.perf_counter()
        all_packets = []

        for mac, ip in zip(CLIENT_MACS, CLIENT_IPS):
            legit = generate_legit_traffic(
                mac, ip, SERVER_IP, 80,
                legit_packets // len(CLIENT_MACS),
                start_time=t_base,
            )
            all_packets.extend(legit)

        flood = generate_syn_flood(
            ATTACKER_MACS[0], ATTACKER_IPS[0], SERVER_IP, 80,
            flood_packets, start_time=t_base + 0.001,
        )
        all_packets.extend(flood)
        all_packets.sort(key=lambda p: p.timestamp)

        for pkt in all_packets:
            detector.process_packet(pkt)

        if detector.stats['detection_times']:
            baseline_times.append(round(detector.stats['detection_times'][0], 2))

    # ── Experiment 2: Optimized (Port-Scan Detection) ──
    optimizer_times = []
    optimizer_syns_before: list[int] = []
    for _ in range(num_trials):
        detector = OptimizedDetector(
            syn_threshold=syn_threshold, ack_timeout=ack_timeout,
            port_diversity_threshold=port_diversity_threshold,
            time_window=time_window,
        )
        t_base = time.perf_counter()
        all_packets = []

        for mac, ip in zip(CLIENT_MACS, CLIENT_IPS):
            legit = generate_legit_traffic(
                mac, ip, SERVER_IP, 80,
                legit_packets // len(CLIENT_MACS),
                start_time=t_base,
            )
            all_packets.extend(legit)

        scan = generate_port_scan(
            ATTACKER_MACS[0], ATTACKER_IPS[0], SERVER_IP,
            scan_ports, pkts_per_port=pkts_per_port,
            start_time=t_base + 0.001,
        )
        all_packets.extend(scan)
        all_packets.sort(key=lambda p: p.timestamp)

        for pkt in all_packets:
            detector.process_packet(pkt)

        if detector.optim_stats['detection_times']:
            optimizer_times.append(round(detector.optim_stats['detection_times'][0], 2))
        if detector.optim_stats['syns_before_caught']:
            optimizer_syns_before.append(detector.optim_stats['syns_before_caught'][0])

    # ── Experiment 2B: SYN Flood with Optimizer Active ──
    flood_optim_times = []
    for _ in range(num_trials):
        detector = OptimizedDetector(
            syn_threshold=syn_threshold, ack_timeout=ack_timeout,
            port_diversity_threshold=port_diversity_threshold,
            time_window=time_window,
        )
        t_base = time.perf_counter()
        all_packets = []

        for mac, ip in zip(CLIENT_MACS, CLIENT_IPS):
            legit = generate_legit_traffic(
                mac, ip, SERVER_IP, 80,
                legit_packets // len(CLIENT_MACS),
                start_time=t_base,
            )
            all_packets.extend(legit)

        flood = generate_syn_flood(
            ATTACKER_MACS[0], ATTACKER_IPS[0], SERVER_IP, 80,
            flood_packets, start_time=t_base + 0.001,
        )
        all_packets.extend(flood)
        all_packets.sort(key=lambda p: p.timestamp)

        for pkt in all_packets:
            detector.process_packet(pkt)

        if detector.paper_stats['detection_times']:
            flood_optim_times.append(round(detector.paper_stats['detection_times'][0], 2))

    # ── Compute derived metrics ──
    avg_b = round(sum(baseline_times) / len(baseline_times), 2) if baseline_times else 0
    avg_o = round(sum(optimizer_times) / len(optimizer_times), 2) if optimizer_times else 0
    avg_fo = round(sum(flood_optim_times) / len(flood_optim_times), 2) if flood_optim_times else 0
    avg_syns = round(sum(optimizer_syns_before) / len(optimizer_syns_before)) if optimizer_syns_before else 0

    time_improvement = round((1 - avg_o / avg_b) * 100, 1) if avg_b > 0 else 0
    exposure_reduction = round((1 - avg_syns / syn_threshold) * 100, 1) if syn_threshold > 0 else 0

    return {
        'baseline': {
            'detection_times': baseline_times,
            'avg_ms': avg_b,
            'syn_threshold': syn_threshold,
            'syns_to_detect': syn_threshold,
        },
        'optimizer': {
            'detection_times': optimizer_times,
            'avg_ms': avg_o,
            'port_threshold': port_diversity_threshold,
            'avg_syns_before': avg_syns,
        },
        'flood_with_optimizer': {
            'detection_times': flood_optim_times,
            'avg_ms': avg_fo,
        },
        'config': {
            'syn_threshold': syn_threshold,
            'port_diversity_threshold': port_diversity_threshold,
            'time_window': time_window,
            'num_trials': num_trials,
            'flood_packets': flood_packets,
            'legit_packets': legit_packets,
            'scan_ports': scan_ports,
            'pkts_per_port': pkts_per_port,
        },
        'improvements': {
            'time_improvement': time_improvement,
            'exposure_reduction': exposure_reduction,
        },
    }
