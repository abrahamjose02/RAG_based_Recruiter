from fastapi import FastAPI
from app.api.routes.resumes import router as resume_routes


app = FastAPI(title="Recruiter AI Service")
app.include_router(resume_routes)