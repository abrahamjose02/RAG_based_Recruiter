from fastapi import APIRouter
from app.schemas.resume import ParseResumeResponse,ParseResumeRequest
from app.services.resume_parser import parse_resume_text

router = APIRouter()

@router.post("/v1/parse-resume",response_model=ParseResumeResponse)

def parse_resume(body:ParseResumeRequest) -> ParseResumeResponse:
    parsed = parse_resume_text(body.text)
    return ParseResumeResponse(success=True,data=parsed)