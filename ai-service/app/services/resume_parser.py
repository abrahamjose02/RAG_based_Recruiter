from app.providers.llm import complete_resume_json
from app.schemas.resume import ParsedResumeData

PARSE_SYSTEM_PROMPT = """
    You extract a structured candidate profile from resume text.
Return JSON only, matching this shape:
{
  "name": string,
  "email": string,
  "phone": string or null,
  "location": { "city": string or null, "state": string or null, "country": string or null } or null,
  "skills": string[],
  "totalExperienceYears": number or null,
  "currentRole": string or null,
  "professionalSummary": string or null,
  "experience": [
    {
      "company": string,
      "role": string,
      "startDate": string or null,
      "endDate": string or null,
      "isCurrent": boolean or null,
      "description": string or null
    }
  ],
  "education": [
    {
      "institution": string,
      "degree": string or null,
      "fieldOfStudy": string or null,
      "startYear": number or null,
      "endYear": number or null
    }
  ]
}
Rules:
- Use ONLY facts written in the resume text.
- name and email are required. If either is not clearly in the text, do not invent them.
- phone is optional. Use null if missing.
- Do not invent companies, degrees, years, or skills.
- Skip experience rows that lack both company and role.
- Skip education rows that lack institution.
- JSON keys must be camelCase exactly as shown.
"""

def parse_resume_text(text:str)->ParsedResumeData:
    """
    LLM fills every field including email and phone.
    pydantics then rejects invalid email or missing name.
    """

    raw = complete_resume_json(system_prompt=PARSE_SYSTEM_PROMPT,
    resume_text=text
    )

    parsed = ParsedResumeData.model_validate(raw)

    parsed.experience = [
        item for item in parsed.experience if item.company and item.role
    ]
    
    parsed.education = [
        item for item in parsed.education if item.institution
    ]

    if parsed.phone:
        parsed.phone = parsed.phone.strip() or None

    return parsed