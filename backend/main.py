from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from agent import graph
from dotenv import load_dotenv

load_dotenv()

app = FastAPI()

# 1. CORS MUST BE FIRST
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"], # For the IBM demo, this is safest
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

class ChatRequest(BaseModel):
    message: str
    session_id: str

sessions_db = {}

# Added a root route so you don't get "Not Found" at the base URL
@app.get("/")
async def root():
    return {"status": "Hospital AI Backend is Running"}

@app.post("/chat") # <--- No slash here
async def chat(req: ChatRequest):
    if req.session_id not in sessions_db:
        sessions_db[req.session_id] = {
            "session_id": req.session_id,
            "messages": [],
            "patient_name": None,
            "patient_age": None,
            "patient_query": None,
            "ward": None,
            "complete": False
        }
    
    current_state = sessions_db[req.session_id]
    current_state["messages"].append({"role": "user", "content": req.message})
    
    # Invoke Graph
    result = await graph.ainvoke(current_state)
    
    sessions_db[req.session_id].update(result)
    updated_session = sessions_db[req.session_id]
    
    return {
        "reply": updated_session.get("reply"),
        "ward": updated_session.get("ward"),
        "patient_summary": {
            "name": updated_session.get("patient_name"), 
            "age": updated_session.get("patient_age"),
            "query": updated_session.get("patient_query")
        },
        "complete": updated_session.get("complete")
    }
