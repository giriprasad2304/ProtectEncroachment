"""LangGraph agent pipeline definition: defines sequential execution graph for land encroachment detection."""
from langgraph.graph import StateGraph, START, END
from app.agent.state import AgentState
from app.agent.nodes.preprocess import preprocess_node
from app.agent.nodes.interpret import interpret_node
from app.agent.nodes.boundary_check import boundary_check_node
from app.agent.nodes.severity import severity_node
from app.agent.nodes.report import report_node

# Construct the StateGraph
workflow = StateGraph(AgentState)

# Add nodes
workflow.add_node("preprocess", preprocess_node)
workflow.add_node("interpret", interpret_node)
workflow.add_node("boundary_check", boundary_check_node)
workflow.add_node("severity", severity_node)
workflow.add_node("report", report_node)

# Set sequential execution pipeline
workflow.add_edge(START, "preprocess")
workflow.add_edge("preprocess", "interpret")
workflow.add_edge("interpret", "boundary_check")
workflow.add_edge("boundary_check", "severity")
workflow.add_edge("severity", "report")
workflow.add_edge("report", END)

# Compile runnable graph
agent_graph = workflow.compile()
