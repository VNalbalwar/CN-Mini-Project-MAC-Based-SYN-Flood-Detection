# Setup Guide — MAC-Based SYN Flood Detection in SDN

## Project Structure

```
cn-syn-project/
├── 01_Implementation.ipynb         ← Main implementation (run this first)
├── 02_Results_and_Visualization.ipynb  ← Graphs and analysis (run second)
├── requirements.txt                ← Python dependencies
├── SETUP.md                        ← This file
└── results/                        ← Generated results & graphs
    ├── experiment_results.json     (auto-generated)
    ├── summary.txt                 (auto-generated)
    ├── topology.png                (auto-generated)
    ├── detection_time_comparison.png
    ├── per_trial_detection.png
    ├── server_exposure.png
    ├── summary_table.png
    ├── pipeline_flowchart.png
    ├── boxplot_detection.png
    └── improvement_metrics.png
```

## Prerequisites

- **Python 3.8+** (3.10 or 3.11 recommended)
- **pip** (comes with Python)
- **Jupyter Notebook** support (VS Code or standalone)

## Quick Setup (3 steps)

### Step 1: Create virtual environment

```bash
# Open terminal in the project folder
cd "d:\Viraj Zone\CodeGround\cn-syn-project"

# Create virtual environment
python -m venv venv

# Activate it
# Windows (PowerShell):
.\venv\Scripts\Activate.ps1
# Windows (CMD):
.\venv\Scripts\activate.bat
# Linux/Mac:
source venv/bin/activate
```

### Step 2: Install dependencies

```bash
pip install -r requirements.txt
```

### Step 3: Run the notebooks

**Option A — VS Code (recommended):**
1. Open the project folder in VS Code
2. Install the "Jupyter" extension if not already installed
3. Open `01_Implementation.ipynb`
4. Click "Select Kernel" → choose the `venv` Python
5. Click "Run All" (▶▶) to run all cells
6. Open `02_Results_and_Visualization.ipynb` and run all cells

**Option B — Jupyter Notebook (browser):**
```bash
jupyter notebook
```
Then open the notebooks in order from the browser.

## What Each Notebook Does

### `01_Implementation.ipynb`
- Draws the SDN network topology
- Implements Cuckoo Hash Table (paper's data structure)
- Implements the paper's 5-table detection pipeline (BaselineDetector)
- Implements our Port-Diversity optimization (OptimizedDetector)
- Generates simulated SYN flood and port-scan traffic
- Runs 5-trial experiments for both methods
- Saves results to `results/` folder

### `02_Results_and_Visualization.ipynb`
- Loads experiment results
- Generates 7 publication-quality charts:
  1. Average detection time comparison (bar chart)
  2. Per-trial detection times (line plot)
  3. Server exposure comparison (bar chart)
  4. Summary comparison table
  5. Detection pipeline flowchart (paper vs optimized)
  6. Detection time distribution (box plot)
  7. Improvement metrics

## Baseline Paper

**Title**: Detection and Mitigation of SYN Flooding Attacks through SYN/ACK Packets and Black/White Lists  
**Authors**: Yang et al., National Cheng Kung University (NCKU), Taiwan  
**Journal**: Sensors (MDPI), 2023  

### Paper's Core Algorithm
1. Packet arrives at SDN controller
2. Check **Blacklist** (Cuckoo Hash) → if MAC found → DROP
3. Check **Whitelist** (Cuckoo Hash) → if MAC found → FORWARD
4. If **SYN** → store in Check-SYN table
5. If **ACK** → store in Check-ACK table → cross-check with SYN → WHITELIST
6. If SYN count exceeds threshold (100) → **BLACKLIST** (attack detected)

### Our Optimization: Port-Diversity Tracking
- Track unique destination ports per source MAC within a time window
- If a MAC sends SYNs to ≥5 unique ports → **port scan detected** → BLACKLIST
- Catches attackers during reconnaissance, before the flood begins
- Reduces server exposure by ~85%

## Troubleshooting

| Problem | Solution |
|---------|----------|
| `ModuleNotFoundError` | Run `pip install -r requirements.txt` |
| No kernel found in VS Code | Install Jupyter extension, select venv kernel |
| `FileNotFoundError` in notebook 2 | Run notebook 1 first |
| Graphs not showing | Make sure `%matplotlib inline` is in the first code cell |
