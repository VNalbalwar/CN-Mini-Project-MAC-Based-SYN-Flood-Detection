# Project Explanation Script - Speak This to Your Instructor

> This is your complete explanation script. Read it as-is. It's written in natural spoken English so you can literally speak it word-for-word.

---

## 1. Introduction - What Is This Project?

So basically, our project is about detecting and mitigating SYN flood attacks in Software-Defined Networks. SYN flood is one of the most common types of DDoS attacks where the attacker sends a massive number of SYN packets to a server but never completes the TCP handshake, so the server keeps waiting and eventually gets overwhelmed and crashes or becomes unresponsive.

We took a research paper as our base — it's by Yang et al. from National Cheng Kung University, Taiwan, published in Sensors journal by MDPI in 2023. The paper title is "Detection and Mitigation of SYN Flooding Attacks through SYN/ACK Packets and Black/White Lists." We implemented their complete approach in Python simulation, and then we came up with our own optimization on top of it that makes the detection significantly faster.

---

## 2. Why SDN? Why Not Traditional Network?

The reason this works in SDN and not in a traditional network is because in SDN, there's a centralized controller. In traditional networks, each switch makes its own forwarding decisions, so there's no single point where you can inspect all the traffic. But in SDN, the controller sees every packet that doesn't match an existing flow rule. So when a new connection comes in, the switch sends it to the controller, and that's where we can run our detection logic.

The controller basically acts like the brain of the network. It can see patterns across multiple hosts, track which MAC addresses are behaving suspiciously, and instantly push rules to drop traffic from attackers. That's the power of SDN — you get programmability and a global view of the network.

---

## 3. The Existing Paper's Approach (Baseline)

Let me explain the paper's method first. They use a five-table pipeline for detection. Here's how it works step by step.

When a packet arrives at the SDN controller, the first thing we check is the Blacklist. The blacklist stores MAC addresses of confirmed attackers. If the source MAC is in the blacklist, we immediately drop the packet. No further processing needed.

If it's not blacklisted, we check the Whitelist. The whitelist stores MAC addresses that have been verified as legitimate. If the MAC is in the whitelist, we forward the packet normally.

Now if the MAC is neither blacklisted nor whitelisted, it means we haven't made a decision about it yet. So we look at what type of packet it is.

If it's a SYN packet, we record it in the Check-SYN table. We track the count of SYN packets from this source MAC, along with the source IP and destination port. Every time we get another SYN from the same MAC, we increment the counter. And here's the key part — if that counter reaches 100, which is the SYN threshold, we blacklist that MAC because a legitimate user would never send 100 SYN packets without completing any handshakes.

If it's an ACK packet, we record it in the Check-ACK table. Then we cross-check — we look if there's a matching SYN in the Check-SYN table from the same MAC and IP. If there's a match, it means this host sent a SYN and then followed up with an ACK, which is a normal TCP handshake. So we whitelist that MAC as legitimate.

There's also a timeout mechanism. If a SYN has been sitting in the Check-SYN table for too long without a matching ACK, that's suspicious, and we can flag or blacklist it.

Both the blacklist and whitelist are implemented using Cuckoo Hash Tables, which I'll explain in a moment.

---

## 4. What Is a Cuckoo Hash Table and Why Use It?

A Cuckoo Hash Table is a specialized hash table that guarantees O(1) worst-case lookup time. Not amortized, not average case — worst case. And that's critical for network security applications where you need to check every single packet against the blacklist as fast as possible.

The way it works is — it has two separate hash tables and two different hash functions. When you want to look up a MAC address, you compute both hashes and check both positions. That's it, just two array accesses, always. So lookup is always O(1).

For insertion, if the first position in table one is empty, you put it there. If it's occupied, you evict the existing entry, place yours there, and then try to place the evicted entry in table two using the second hash function. If that's also occupied, you keep evicting and swapping. There's a maximum number of evictions to prevent infinite loops.

In our implementation, the two hash functions are — h1 is the sum of all MAC address octets modulo table size, and h2 is the XOR of all octets multiplied by 31, modulo table size. The default table size is 256 slots.

We use this data structure specifically because in a real SDN deployment, the controller has to process potentially millions of packets per second, and having a guaranteed constant-time lookup for the blacklist and whitelist is essential. You can't afford a hash table that sometimes takes O(n) in worst case.

---

## 5. The Problem With the Paper's Approach

Now here's the thing — the paper's method is purely reactive. It waits until the attacker has already sent 100 SYN packets before it detects anything. By that time, 100 half-open connections are already consuming server resources. The server is already under stress.

And more importantly, real-world attackers don't just start flooding randomly. Most sophisticated attackers first do reconnaissance — they do a port scan to find which ports are open on the server. They send SYN packets to port 22, port 80, port 443, port 3306, port 8080, and so on. This is the classic port scanning phase, and it happens before the actual flood.

The paper's method completely misses this reconnaissance phase because it's only looking at the count of SYNs, not the pattern of where those SYNs are going.

---

## 6. Our Optimization - Port-Diversity Tracking

This is where our optimization comes in. We added a Port-Diversity Tracking module on top of the paper's pipeline. The idea is simple but effective — we track how many unique destination ports each source MAC is sending SYN packets to within a sliding time window.

So if a MAC sends a SYN to port 22, then to port 80, then to port 443, then to port 8080, then to port 3306 — that's five unique ports. A legitimate user doesn't do that. A legitimate user connects to maybe one or two ports, like port 80 for HTTP and port 443 for HTTPS. They don't scan across five, six, seven different ports in a short time window.

So our rule is — if a source MAC sends SYNs to five or more unique destination ports within a 10-second window, we immediately blacklist it. We don't wait for 100 SYNs. We catch it in around 15 SYN packets, which is however many it takes to hit five different ports.

The detection happens during the port scanning phase, which is the reconnaissance phase, before the actual flood even begins. That's the key advantage — we're catching the attacker during recon, not during the attack.

---

## 7. How We Implemented It

In terms of code, the OptimizedDetector extends the BaselineDetector. It has everything the paper has, plus one additional data structure — a port tracker dictionary. For each source MAC, it stores a set of unique ports seen, the timestamp of when tracking started, whether we've already alerted on this MAC, and how many SYN packets were processed before the alert.

When a SYN packet arrives, before doing the paper's check-SYN logic, we first run our port diversity check. We add the destination port to the set for that MAC. If the set size reaches the threshold, we immediately blacklist. If it doesn't trigger, we fall through to the paper's original SYN counting logic as a fallback.

This is important — our optimization is additive, not replacement. If an attacker decides to skip port scanning and directly floods a single port, the paper's SYN threshold mechanism still works as the safety net. We tested this specifically, and the detection time in that scenario matches the paper's baseline exactly. So we don't break anything; we only add an extra layer of defense.

---

## 8. Experiment Setup and Results

We ran controlled experiments with five trials each. The simulated network has three attackers, three legitimate clients, one OVS switch, and one server, all in an SDN topology.

For each trial, we generate 50 legitimate traffic packets — these are proper SYN-ACK pairs simulating normal TCP handshakes from the three clients. Then we generate the attack traffic.

For the baseline experiment, the attacker sends 200 SYN flood packets to a single port on the server.

For the optimizer experiment, the attacker first does a port scan across eight common ports — 22, 80, 443, 8080, 3306, 5432, 6379, and 27017 — sending three packets per port, followed by the flood.

All packets are interleaved by timestamp to simulate realistic traffic mixing.

Here are the results:

The paper's baseline method detects the attack in an average of 12.19 milliseconds across five trials. It requires all 100 SYN packets to hit the threshold before triggering.

Our optimized method detects the attack in an average of 2.90 milliseconds. It catches the attacker after just about 13-15 SYN packets, when the port diversity threshold is reached.

That's a 76.2% improvement in detection speed and an 85% reduction in server exposure, meaning the server receives 85% fewer malicious packets before the attacker is caught.

And like I said, when the attacker does a single-port flood with the optimizer active, the detection time is about 12.00 milliseconds, which matches the paper's baseline. So backward compatibility is verified.

---

## 9. Concepts Used in This Project

Let me go over the key computer networking concepts that are involved.

**TCP Three-Way Handshake**: The fundamental concept. SYN, SYN-ACK, ACK. The attack exploits the fact that the server allocates resources after receiving a SYN and sending back a SYN-ACK, but if the ACK never comes, those resources stay held.

**SYN Flood Attack**: A type of DDoS attack that exploits the TCP handshake. Attacker sends SYN packets with spoofed or real source addresses, server sends SYN-ACK and waits, the half-open connections consume server memory and connection table space.

**Software-Defined Networking (SDN)**: Decoupling of control plane and data plane. The controller has a global view of the network and can make intelligent forwarding decisions. OpenFlow is the protocol used between the controller and switches.

**MAC Address-Based Detection**: Instead of IP-based detection which can be spoofed easily, we use MAC addresses because in an SDN local network, MAC addresses are harder to spoof and more reliable for identification.

**Cuckoo Hashing**: A hashing scheme with worst-case O(1) lookups using two hash functions and two tables. Ideal for high-speed packet processing.

**Port Scanning**: A reconnaissance technique where an attacker sends packets to multiple ports to discover which services are running. This is typically the precursor to a targeted attack.

**Sliding Time Window**: We use a 10-second sliding window for port diversity tracking. This ensures we only look at recent behavior, not historical data that might be stale.

---

## 10. What Made Us Think of This Optimization?

When we studied the paper, the first thing that stood out was the threshold of 100 SYNs. That felt like a lot. In a real scenario, even 100 half-open connections can cause visible degradation on a small server.

And then we thought about how real attacks work. Always there's a recon phase. Nmap, masscan, or any scanning tool — they all scan ports first before launching the actual attack. And the paper had no mechanism to detect that scanning behavior.

So we asked ourselves — what if we could catch the attacker during the port scan itself, before they even start flooding? That would mean the flood never happens. The server never gets stressed at all.

Port diversity was the natural signal. A port scan has a very distinctive signature — one MAC address sending SYNs to many different ports in a short time. Legitimate users just don't do that. So by tracking unique ports per MAC in a time window, we get a very clean signal with almost no false positives.

---

## 11. The Website - End-to-End Workflow

Now, apart from the Jupyter notebooks, we also built a full interactive website to demonstrate this project. Let me walk you through the complete workflow.

The website is built with React, TypeScript, and Vite for the frontend, with Tailwind CSS for styling and shadcn/ui-style components. It uses Framer Motion for animations and Recharts for the data visualizations.

When you first open the site, it shows the Hero section with the key improvement metrics, then sections explaining the network topology, the detection pipeline, and a live simulation demo where you can see packets being processed in real-time through the pipeline.

But here's the most important part — there's a section called "Run Your Own Experiment" where you can customize every single parameter. Flood packets, legitimate packets, number of trials, SYN threshold, port diversity threshold, time window, packets per port — everything is adjustable through sliders.

When you click "Run Experiment," the frontend sends those parameters as a POST request to our Python FastAPI backend. The backend runs the actual simulation — the same code from the notebook — with your custom parameters. It runs all three experiments: baseline, optimizer with port scan, and flood with optimizer for backward compatibility.

The backend computes all the detection times, averages, and improvement percentages, and sends the results back as JSON. The frontend receives this, updates its React context, and all the charts, metric cards, and comparison tables re-render with animation. The page even auto-scrolls to the results section so you can see the fresh data immediately.

So it's not just a static display — it's a real simulation running in the backend every time you click the button. You can change the SYN threshold to 50 or 500, change the flood from 100 packets to 2000 packets, run 1 trial or 20 trials — and see exactly how the results change.

The Vite dev server has a proxy configured that forwards all /api requests to the FastAPI backend running on port 8000, so the frontend and backend communicate seamlessly.

---

## 12. Can This Be Implemented on a Real Network?

Yes, but with some important caveats.

Our simulation models the logical behavior of the detection pipeline accurately. The packet processing flow, the data structure lookups, the decision-making logic — all of that is identical to what you'd implement in a real SDN controller like Ryu, ONOS, or OpenDaylight.

The detection times in our simulation are based on processing timestamps, not real network latencies. In a real network, there would be additional factors like propagation delay, queuing delay, controller processing overhead, and switch-controller communication latency.

However, the relative improvement would hold. If the baseline takes X time to detect with 100 SYNs, and our optimizer catches it in 15 SYNs, that ratio stays the same regardless of the absolute time. The optimizer will always be faster because it's looking at a fundamentally earlier signal — port diversity during recon versus SYN count during flood.

For a real deployment, you would write the detector as a Ryu or ONOS application. The controller receives PacketIn events from the switch, runs our pipeline on each packet, and pushes FlowMod rules to drop traffic when a blacklist decision is made. The Cuckoo Hash Table would be stored in the controller's memory. The port tracker would be the same dictionary structure.

The main challenge in a real network would be performance at scale — handling thousands of flows per second. But that's why we used Cuckoo hash tables with O(1) lookups. And the port diversity check is also O(1) — just a set insertion and a length check.

Another thing to consider is that in the real world, attackers might use spoofed MAC addresses. In that case, MAC-based detection might not be sufficient on its own. But within an SDN local network, the switch knows which physical port each MAC came from, so MAC spoofing is detectable through port-MAC binding, which many SDN controllers already support.

---

## 13. Potential Follow-Up Questions and Answers

**Q: Why did you use Python simulation instead of Mininet or a real SDN setup?**

We chose pure Python simulation deliberately for a few reasons. First, it lets anyone run the project without needing Mininet, OpenvSwitch, or a Linux VM — just Python and pip. Second, the simulation focuses on the detection algorithm itself, which is the core contribution. The network topology and packet forwarding are not what we're testing. Third, Mininet would add setup complexity without changing the detection logic results.

**Q: What if the attacker floods on a single port and doesn't do a port scan?**

That's exactly what our Experiment 2B tests. When an attacker skips scanning and floods a single port, our port diversity check doesn't trigger, and the paper's SYN threshold kicks in as the fallback. Detection time matches the baseline exactly. So we don't make anything worse — worst case, we perform the same as the paper.

**Q: What about false positives? Could a legitimate user trigger port diversity detection?**

In practice, it's very unlikely. A legitimate user connects to maybe one or two ports on a server. The threshold is five unique ports in a 10-second window. For a user to trigger that, they'd have to send SYN packets to five different ports within 10 seconds without completing any handshakes. Normal browser traffic, API calls, or application connections wouldn't hit that pattern. And even if they did, the cross-check with ACK packets would whitelist them if they complete the handshake.

**Q: How does the Cuckoo Hash Table compare to a regular hash table?**

Regular hash tables use chaining or open addressing, which gives O(1) amortized but O(n) worst case for lookups. In packet processing, you can't afford worst-case O(n) because every packet needs to be checked. Cuckoo hashing gives exactly two array accesses per lookup, always. The tradeoff is that insertion can be more expensive, but lookups dominate in network filtering — you check the blacklist for every packet but only insert when you make a blacklist/whitelist decision.

**Q: Why specifically five ports as the threshold?**

Five is a reasonable balance. Most legitimate connections use one or two ports. Port scanners typically probe many more. Five gives enough margin to avoid false positives while still catching scans early. In our project, the attacker scans eight ports, so five catches them well before they finish scanning. The parameter is configurable on the website — you can set it to two or fifty and see the impact on detection.

**Q: How does the time window work for port tracking?**

Each MAC has a 10-second sliding window. When we first see a SYN from a MAC, we start the timer. As long as subsequent SYNs arrive within 10 seconds of the first one, they contribute to the port diversity count. If more than 10 seconds pass, we reset — clear the port set and start fresh. This prevents old behavior from incorrectly flagging a MAC. The window is also configurable.

**Q: What's the significance of the 76% and 85% improvements?**

76% faster detection means the attacker is caught in roughly one-quarter of the time compared to the paper's method. 85% less server exposure means the server receives only about 15 malicious SYN packets instead of 100 before the attacker is blocked. In a real scenario, that's the difference between the server barely noticing the attack versus having 100 half-open connections eating up resources.

**Q: Could this approach work for other types of attacks beyond SYN floods?**

The port diversity concept is specifically designed for detecting reconnaissance followed by attack. It would work for any attack that involves port scanning as a precursor — which includes many types of targeted attacks. For other attack types like UDP flood or HTTP flood, you'd need different detection signals, but the pipeline architecture and Cuckoo hash tables could still be reused.

---

## 14. Quick Summary - If They Ask You to Wrap Up

To summarize: we implemented a research paper's SYN flood detection pipeline that uses five tables and Cuckoo hashing in an SDN environment. We identified its weakness — it's reactive and waits for 100 SYN packets before detecting. We added a port-diversity tracking optimization that catches attackers during their port-scanning reconnaissance phase, reducing detection time by 76% and server exposure by 85%. The optimization is additive and backward compatible. We built the complete simulation in Python and an interactive website where you can tune every parameter and see live results. The approach is viable for real SDN deployment with standard controllers like Ryu or ONOS.
