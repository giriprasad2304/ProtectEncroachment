"""Severity classification node: evaluates encroachment severity based on percentage of change region outside authorized boundary."""
from datetime import datetime
from app.agent.state import AgentState


def severity_node(state: AgentState) -> AgentState:
    outside_percent = state.get("outside_percent", 0.0)
    change_bbox = state.get("change_bbox")

    if not change_bbox or outside_percent <= 0.0:
        severity = "none"
    elif outside_percent <= 25.0:
        severity = "minor"
    elif outside_percent <= 60.0:
        severity = "moderate"
    else:
        severity = "severe"

    step_log = {
        "node_name": "severity_node",
        "status": "success",
        "output": {
            "outside_percent": outside_percent,
            "severity": severity
        },
        "timestamp": datetime.utcnow().isoformat()
    }

    steps = list(state.get("steps", []))
    steps.append(step_log)

    return {
        **state,
        "severity": severity,
        "steps": steps
    }
