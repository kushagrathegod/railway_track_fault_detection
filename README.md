# Railway Defect Detection System

## System Architecture
The system consists of three main components:
1. **Vision Agent (Edge)**: Python script using OpenCV to capture video, interact with the ML Model API, and detect defects.
2. **Backend (Server)**: FastAPI application that receives defect data, queries Groq (Llama 3) for analysis, logs to database, and uses SMTP for alerts.
3. **Frontend (Dashboard)**: React + Vite application with Leaflet maps to visualize defects in real-time.

## API Flow
1. **Detection**: `vision_agent.py` captures a frame -> POST `https://vishalbhagat01-railway.hf.space/predict`.
2. **Ingestion**: If defective, `vision_agent.py` -> POST `http://localhost:8000/analyze` (with location & confidence).
3. **Reasoning**: Backend -> Groq API (Reasoning & Resolution).
4. **Storage**: Backend -> SQLite `railway.db`.
5. **Alerting**: Backend -> Gmail SMTP (if Critical).
6. **Visualization**: Frontend -> GET `http://localhost:8000/defects`.

## Deployment Strategy (Free Tier)
- **Frontend**: Deploy to **Vercel** or **Netlify**. Both offer free tiers for static sites (React).
- **Backend**: Deploy to **Render.com** (Free Web Service) or **Railway.app** (Trial).
- **Database**: **Render** offers free PostgreSQL (better than SQLite for prod). Or use **Firebase Realtime Database** (Free Spark Plan).
- **ML Model**: Already hosted on Hugging Face Spaces (Free).
- **Vision Agent**: Runs on edge devices (Raspberry Pi/Laptop) - no cloud cost.

## Setup & Run

### Prerequisites
- Python 3.9+
- Node.js 18+
- Groq API Key

### Environment Variables
Create a `.env` file in `backend/` and `vision/` if needed:
```
GROQ_API_KEY=your_key_here
EMAIL_USER=your_email@gmail.com
EMAIL_PASS=your_app_password
ALERT_RECIPIENT=recipient@example.com
```

### Running Locally
Use the provided `start.bat` or run manually:

1. **Backend**:
   ```bash
   cd backend
   pip install -r requirements.txt
   uvicorn main:app --reload
   ```

2. **Frontend**:
   ```bash
   cd frontend
   npm install
   npm run dev
   ```

3. **Vision Agent**:
   ```bash
   cd vision
   pip install -r requirements.txt
   python vision_agent.py
   ```
# Railway-Moniter
