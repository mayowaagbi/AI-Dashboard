from dotenv import load_dotenv

load_dotenv()

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from app.api.routes import router


app = FastAPI(
    title="AI Business Intelligence API",
    version="1.0.0",
    description="Upload CSVs, clean data, and ask natural language questions to generate insights and charts.",
)

# CORS settings - adjust origins as needed
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # or specify your frontend URL(s)
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Include your route
app.include_router(router)
