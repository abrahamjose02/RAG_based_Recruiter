import {z} from "zod";
import {env} from "../../config/env";
import { parsedResumeResultSchema,type  ParsedResumeResultInput } from "../../modules/resume/resume.schema";
import { AppError } from "../../errors/app-error";
import { completeJson } from "../providers/llm";

const SYSTEM_PROMPT = `
Extract a resume into JSON only.
Return:
{
  "name": string | omit,
  "email": string | omit,
  "phone": string | omit,
  "location": { "city"?: string, "state"?: string, "country"?: string } | omit,
  "skills": string[],
  "totalExperienceYears": number | omit,
  "currentRole": string | omit,
  "professionalSummary": string | omit,
  "experience": [{ "company": string, "role": string, "startDate"?: string, "endDate"?: string, "isCurrent"?: boolean, "description"?: string }],
  "education": [{ "institution": string, "degree"?: string, "fieldOfStudy"?: string, "startYear"?: number, "endYear"?: number }]
}
Copy email and phone only when they are written in the resume.
Use only facts written in the resume. Omit a field when it is not present.
Do not invent skills, employers, dates, years, email addresses, or phone numbers.
`.trim();

function prepareModelJson(raw:Record<string,unknown>):Record<string,unknown>{
    const next = {...raw};
    if(typeof next.email === "string" && !z.string().email().safeParse(next.email.trim()).success){
        delete next.email;
    }
    if(typeof next.phone === "string" && next.phone.trim().length === 0){
        delete next.phone;
    }
    if(Array.isArray(next.experience)){
        next.experience = next.experience.filter((item)=>{
            if(!item || typeof item !== "object") return false;
            const row  = item as {company?:unknown, role?:unknown};
            return typeof row.company === "string" && typeof row.role === "string"
        });
    }
    if(Array.isArray(next.education)){
        next.education = next.education.filter((item)=>{
            if(!item || typeof item !== "object") return false;
            const row  = item as {institution?:unknown};
            return typeof row.institution === "string" && row.institution.trim().length > 0;
        });
    }
    return next;
}


export async function parseResumeText(text:string):Promise<ParsedResumeResultInput>{
    const raw = await completeJson({
        systemPromt:SYSTEM_PROMPT,
        userPrompt:text,
        model:env.RESUME_PARSER_MODEL,
    })

    const parsed = parsedResumeResultSchema.safeParse(raw)
    if(!parsed.success){
        throw new AppError("Resume parser returned a profile that failed validation ",502)
    }
    return parsed.data;
}