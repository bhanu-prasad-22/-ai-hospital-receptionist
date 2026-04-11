# 🏥 AI-Powered Hospital Receptionist 
### An Agentic AI Solution for Automated Patient Triage & Registration

[![Live Demo](https://img.shields.io/badge/Demo-Vercel-blue?style=for-the-badge)](https://hospital-ai-receptionist.vercel.app)
[![API Docs](https://img.shields.io/badge/API-FastAPI-green?style=for-the-badge)](https://bit.ly/Hospital-AI-API)
[![IBM SkillsBuild](https://img.shields.io/badge/Internship-IBM%20SkillsBuild-orange?style=for-the-badge)](https://skillsbuild.org)

## 📌 Project Overview
The **AI Hospital Receptionist Kiosk** is a full-stack "Agent Project" designed to solve the bottleneck of manual patient intake in hospitals and clinics. Built specifically for Tier 2/3 city infrastructure, this kiosk uses **LangGraph** to perform intelligent medical triage, ensuring urgent cases (like chest pain) are prioritized instantly.

## 🚀 Key Features
* **Natural Language Intake:** Patients interact via a simple chat interface; no complex forms required.
* **Agentic Triage Logic:** Powered by **Gemini 2.0 Flash**, the system analyzes symptoms to route patients to:
    * 🚨 **Emergency Ward**
    * 🩺 **General Ward**
    * 🧠 **Mental Health Ward**
* **Real-time Persistence:** Data is instantly synced to **Supabase**, allowing clinical staff to see patient details immediately.
* **Low Latency:** Optimized for speed to ensure the entire registration takes less than 45 seconds.

## 🛠️ Technical Stack
* **Frontend:** React (Vite) + Tailwind CSS (Deployed on Vercel)
* **Backend:** Python + FastAPI (Deployed on Render)
* **Orchestration:** LangGraph (State Machine for Agentic Workflow)
* **LLM:** Google Gemini 2.0 Flash (via Google AI Studio)
* **Database:** Supabase (PostgreSQL)

## 🧬 Agent Architecture
The system utilizes a structured **LangGraph** state machine:
1.  **Start Node:** Greets the user and collects initial query.
2.  **Router Node:** Analyzes the `patient_query` to identify symptom severity.
3.  **Ward Nodes:** Branches the logic into specific ward categories based on the Router's decision.
4.  **Supabase Node:** Persists the final structured JSON (Name, Age, Symptom, Ward) to the database.

## ⚙️ Setup & Installation

### Backend
1. Navigate to `/backend`
2. Install dependencies: `pip install -r requirements.txt`
3. Set your `.env` variables:
   ```env
   GOOGLE_API_KEY=your_gemini_key
   SUPABASE_URL=your_url
   SUPABASE_KEY=your_key
