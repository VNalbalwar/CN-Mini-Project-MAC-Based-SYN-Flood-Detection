# Setup Guide - MAC-Based SYN Flood Detection in SDN

## Project Structure

```
CN-Mini-Project-MAC-Based-SYN-Flood-Detection/
├── 01_Implementation.ipynb             <- Main implementation (run this first)
├── 02_Results_and_Visualization.ipynb  <- Graphs and analysis (run second)
├── requirements.txt                    <- Python dependencies (notebooks)
├── SETUP.md                            <- This file
├── results/                            <- Generated results & graphs
│   ├── experiment_results.json         (auto-generated)
│   └── summary.txt                     (auto-generated)
├── backend/                            <- FastAPI simulation server
│   ├── main.py                         <- API endpoints
│   ├── simulation.py                   <- Simulation engine (extracted from notebook)
│   └── requirements.txt                <- Python dependencies (backend)
└── website/                            <- React + Vite interactive demo
    ├── package.json
    ├── vite.config.ts
    └── src/
        ├── App.tsx
        ├── context/ExperimentContext.tsx
        ├── components/                 <- All UI components
        └── data/experiment-data.ts     <- Default/fallback results
```

## Prerequisites

- **Python 3.8+** (3.10+ recommended)
- **pip** (comes with Python)
- **Node.js 18+** and **npm** (for the website)
- **Jupyter Notebook** support (VS Code or standalone) - only needed for notebooks

---

## Part 1: Running the Notebooks (Core Simulation)

### Step 1: Create virtual environment

```bash
cd CN-Mini-Project-MAC-Based-SYN-Flood-Detection

# Create virtual environment
python3 -m venv venv

# Activate it
# Linux/Mac:
source venv/bin/activate
# Windows (PowerShell):
.\venv\Scripts\Activate.ps1
# Windows (CMD):
.\venv\Scripts\activate.bat
```

### Step 2: Install dependencies

```bash
pip install -r requirements.txt
```

### Step 3: Run the notebooks

**Option A - VS Code (recommended):**
1. Open the project folder in VS Code
2. Install the "Jupyter" extension if not already installed
3. Open `01_Implementation.ipynb`
4. Click "Select Kernel" -> choose the `venv` Python
5. Click "Run All" to run all cells
6. Open `02_Results_and_Visualization.ipynb` and run all cells

**Option B - Jupyter Notebook (browser):**
```bash
jupyter notebook
```
Then open the notebooks in order from the browser.

---

## Part 2: Running the Website + Backend (Interactive Demo)

The website connects to a Python backend that runs the **actual simulation** from the notebook. You need **two terminals** running simultaneously.

### Step 1: Install backend dependencies

```bash
pip install fastapi uvicorn pydantic
```

Or if using system Python (no venv):
```bash
pip install --break-system-packages fastapi uvicorn pydantic
```

### Step 2: Install frontend dependencies

```bash
cd website
npm install
cd ..
```

### Step 3: Start the backend (Terminal 1)

```bash
python3 -m uvicorn main:app --host 0.0.0.0 --port 8000 --app-dir backend
```

You should see:
```
INFO:     Uvicorn running on http://0.0.0.0:8000
```

### Step 4: Start the frontend (Terminal 2)

```bash
cd website
npm run dev
```

You should see:
```
VITE v8.x.x  ready in XXX ms
  -> Local:   http://localhost:5173/
```

### Step 5: Open in browser

Open `http://localhost:5173` (or whatever port Vite shows). The website will:
- Show default results from the notebook on initial load
- Let you customize parameters (flood packets, thresholds, trials, etc.)
- Run the actual simulation backend when you click "Run Experiment"
- Update all charts, metrics, and comparisons dynamically with real results

### Stopping

- **Frontend**: Press `Ctrl+C` in Terminal 2
- **Backend**: Press `Ctrl+C` in Terminal 1

---

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
2. Check **Blacklist** (Cuckoo Hash) -> if MAC found -> DROP
3. Check **Whitelist** (Cuckoo Hash) -> if MAC found -> FORWARD
4. If **SYN** -> store in Check-SYN table
5. If **ACK** -> store in Check-ACK table -> cross-check with SYN -> WHITELIST
6. If SYN count exceeds threshold (100) -> **BLACKLIST** (attack detected)

### Our Optimization: Port-Diversity Tracking
- Track unique destination ports per source MAC within a time window
- If a MAC sends SYNs to >= 5 unique ports -> **port scan detected** -> BLACKLIST
- Catches attackers during reconnaissance, before the flood begins
- Reduces server exposure by ~85%

## Troubleshooting

| Problem | Solution |
|---------|----------|
| `ModuleNotFoundError` | Run `pip install -r requirements.txt` |
| No kernel found in VS Code | Install Jupyter extension, select venv kernel |
| `FileNotFoundError` in notebook 2 | Run notebook 1 first |
| Graphs not showing | Make sure `%matplotlib inline` is in the first code cell |
| Backend won't start | Make sure port 8000 is free, and fastapi/uvicorn are installed |
| Frontend can't reach backend | Both terminals must be running. Backend on 8000, frontend uses Vite proxy |
| `npm install` fails | Make sure Node.js 18+ is installed (`node --version`) |
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
