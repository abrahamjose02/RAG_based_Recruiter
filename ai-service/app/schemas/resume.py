from dataclasses import field
from pydantic import BaseModel,EmailStr, Field

class Location(BaseModel):
    city: str | None = None
    state:str | None = None
    country:str | None = None

class Experience(BaseModel):
    company: str
    role: str
    startDate: str | None = None
    endDate: str | None = None
    isCurrent: bool | None = None
    description: str | None = None

class Education(BaseModel):
    institution: str
    degree: str | None = None
    fieldOfStudy: str | None = None
    startYear: int | None = None
    endYear: int | None = None

class ParsedResumeData(BaseModel):

    """
    Contract Node validates with resumeAiResponseSchema.
    name and email are required so a Candidate can be created.
    """
    name:str = Field(min_length=1)
    email:EmailStr
    phone:str | None = None
    location:Location | None = None
    skills:list[str] = Field(default_factory=list)
    totalExperienceYears:float | None = None
    currentRole:str | None = None
    professionalSummary:str | None = None
    experience:list[Experience] = Field(default_factory=list)
    education:list[Education] = Field(default_factory=list)

class ParseResumeRequest(BaseModel):
    text:str

class ParseResumeResponse(BaseModel):
    success:bool = True
    data: ParsedResumeData