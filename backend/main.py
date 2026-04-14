"""
FastAPI backend for the SYN Flood Detection website.
Runs the actual simulation from the Jupyter notebook with customizable parameters.
"""

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel, Field

from simulation import run_experiment

app = FastAPI(title="SYN Shield API")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_methods=["POST", "GET"],
    allow_headers=["*"],
)


class ExperimentParams(BaseModel):
    syn_threshold: int = Field(default=100, ge=10, le=1000)
    port_diversity_threshold: int = Field(default=5, ge=2, le=50)
    time_window: float = Field(default=10.0, ge=1.0, le=60.0)
    num_trials: int = Field(default=5, ge=1, le=20)
    flood_packets: int = Field(default=200, ge=50, le=5000)
    legit_packets: int = Field(default=50, ge=10, le=500)
    scan_ports: list[int] = Field(
        default=[22, 80, 443, 8080, 3306, 5432, 6379, 27017]
    )
    pkts_per_port: int = Field(default=3, ge=1, le=20)


@app.get("/api/health")
def health():
    return {"status": "ok"}


@app.post("/api/run-experiment")
def api_run_experiment(params: ExperimentParams):
    results = run_experiment(
        syn_threshold=params.syn_threshold,
        port_diversity_threshold=params.port_diversity_threshold,
        time_window=params.time_window,
        num_trials=params.num_trials,
        flood_packets=params.flood_packets,
        legit_packets=params.legit_packets,
        scan_ports=params.scan_ports,
        pkts_per_port=params.pkts_per_port,
    )
    return results
