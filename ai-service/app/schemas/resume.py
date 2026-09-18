from pydantic import BaseModel,EmailStr

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
    nstitution: str
    degree: str | None = None
    fieldOfStudy: str | None = None
    startYear: int | None = None
    endYear: int | None = None

class ParsedResumeData(BaseModel):
    name:str | None = None
    email:str | None = None
    phone:str | None = None
    location:Location | None = None
    skills:list[str] = []
    totalExperienceYears:float | None = None
    currentRole:str | None = None
    professionalSummary:str | None = None
    experience:list[Experience] = []
    education:list[Education] = []

class ParsedResumeRequest(BaseModel):
    text:str

class ParseResumeResponse(BaseModel):
    success:bool = True
    data: ParsedResumeData