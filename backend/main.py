from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from agent import graph
from dotenv import load_dotenv

load_dotenv()
app = FastAPI()

app.add_middleware(CORSMiddleware, allow_origins=["*"], allow_methods=["*"], allow_headers=["*"])

class ChatRequest(BaseModel):
    message: str
    session_id: str

# In-memory session storage
sessions_db = {}

@app.post("/chat")
async def chat(req: ChatRequest):
    # 1. Initialize session if new
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
    
    # 2. Update local state with the new message
    current_state = sessions_db[req.session_id]
    current_state["messages"].append({"role": "user", "content": req.message})
    
    # 3. Invoke Graph (Memory is passed in via current_state)
    result = await graph.ainvoke(current_state)
    
    # 4. Merge results back into our session storage
    sessions_db[req.session_id].update(result)
    updated_session = sessions_db[req.session_id]
    
    # 5. Return the full accumulated data to the React Frontend
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