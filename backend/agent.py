import os
from typing import TypedDict, List
from langchain_google_genai import ChatGoogleGenerativeAI
from langgraph.graph import StateGraph, END
from supabase import create_client

# Supabase Setup
supabase = create_client(os.getenv("SUPABASE_URL"), os.getenv("SUPABASE_KEY"))

class AgentState(TypedDict):
    session_id: str
    messages: List[dict]
    patient_name: str
    patient_age: str
    patient_query: str
    ward: str
    complete: bool

# Using the requested model
llm = ChatGoogleGenerativeAI(
    model="gemini-3.1-flash-lite-preview", 
    google_api_key=os.getenv("GOOGLE_API_KEY"),
    temperature=0.2
)

def get_text_content(res):
    """Safely extracts text from Gemini 3.1 multimodal/list responses"""
    if isinstance(res.content, str):
        return res.content
    elif isinstance(res.content, list) and len(res.content) > 0:
        return res.content[0].get("text", "")
    return ""

def router_node(state: AgentState):
    if not state.get("ward"):
        first_input = state["messages"][0]["content"]
        
        prompt = (
            "You are a medical triage expert. Classify this query into: "
            "EMERGENCY, MENTAL HEALTH, or GENERAL.\n"
            f"Query: {first_input}\n"
            "Respond with ONLY the category name."
        )
        
        res = llm.invoke(prompt)
        content = get_text_content(res)
        cleaned_content = content.strip().title()
        
        if "Mental" in cleaned_content: state["ward"] = "Mental Health"
        elif "Emergency" in cleaned_content: state["ward"] = "Emergency"
        else: state["ward"] = "General"
            
    return state

def ward_node(state: AgentState):
    # 1. Gather all user messages for context
    user_messages = [m["content"] for m in state["messages"] if m["role"] == "user"]
    full_context = " ".join(user_messages)

    # 2. Extract info safely using the helper
    extract_prompt = f"""
    Act as a medical data extraction tool. 
    Analyze this context: "{full_context}"
    
    RULES:
    - Extract Name, Age (number), and Symptom.
    - If info is missing, write 'MISSING'.
    Format: Name | Age | Query
    """
    
    res = llm.invoke(extract_prompt)
    content = get_text_content(res).strip()
    
    print(f"--- DEBUG EXTRACTION: {content} ---")

    try:
        parts = content.split("|")
        if len(parts) == 3:
            n, a, q = [p.strip() for p in parts]
            if n != "MISSING": state["patient_name"] = n
            if a != "MISSING": state["patient_age"] = a
            if q != "MISSING": state["patient_query"] = q
    except Exception as e:
        print(f"Extraction Parsing Error: {e}")

    # 3. Determine next question or completion
    if not state.get("patient_name") or state["patient_name"] == "MISSING":
        return {"reply": "Welcome! What is your full name?", "complete": False}
    
    if not state.get("patient_age") or state["patient_age"] == "MISSING":
        return {"reply": f"Thanks {state['patient_name']}. How old are you?", "complete": False}
    
    if not state.get("patient_query") or state["patient_query"] == "MISSING":
        return {"reply": "What symptoms are you experiencing?", "complete": False}

    state["complete"] = True
    return state

async def complete_node(state: AgentState):
    try:
        # Retrieve lead doctor
        staff = supabase.table("ward_staff").select("*").eq("ward", state["ward"]).single().execute()
        doctor = staff.data.get("lead_doctor_email", "staff@hospital.com")

        # Final persistent save to Supabase
        supabase.table("sessions").upsert({
            "session_id": state["session_id"],
            "patient_name": state["patient_name"],
            "patient_age": state["patient_age"],
            "patient_query": state["patient_query"],
            "ward": state["ward"],
            "is_complete": True,
            "notified_staff": doctor
        }).execute()

        return {
            "reply": f"Check-in successful. You are routed to {state['ward']}. Dr. {doctor} has been notified.",
            "complete": True
        }
    except Exception as e:
        print(f"Database Error: {e}")
        return {"reply": "Check-in successful! A doctor will be with you shortly.", "complete": True}

# Workflow Construction
workflow = StateGraph(AgentState)
workflow.add_node("router", router_node)
workflow.add_node("ward_manager", ward_node)
workflow.add_node("finalize", complete_node)

workflow.set_entry_point("router")
workflow.add_edge("router", "ward_manager")

def route_next(state):
    return "finalize" if state.get("complete") else END

workflow.add_conditional_edges("ward_manager", route_next)
workflow.add_edge("finalize", END)
graph = workflow.compile()