import z from "zod"
import {env} from "../../config/env"
import { completeJson } from "../providers/llm"

const QueryUnderstandingSchema = z.object({
    semanticQuery:z.string().trim().min(1),
    city:z.string().trim().min(1).optional(),
    minExperienceYears:z.number().int().positive().optional(),
    skills:z.array(z.string().trim().min(1)).default([]),
    preferredSkills :z.array(z.string().trim().min(1)).default([]),
    companies :z.array(z.string().trim().min(1)).default([]),
    currentRole :z.string().trim().min(1).optional(),
    domain :z.string().trim().min(1).optional(),
})

export type UnderstandingQuery = z.infer<typeof QueryUnderstandingSchema>

const SYSTEM_PROMPT = `
You convert a recruiter search into JSON only.
Return:
{
  "semanticQuery": string,
  "city": string | omit,
  "minExperienceYears": number | omit,
  "skills": string[],
  "preferredSkills": string[],
  "companies": string[],
  "currentRole": string | omit,
  "domain": string | omit
}
Rules:
- semanticQuery is the meaning of the request, with exact constraints removed.
- Put required skills in skills. Put nice-to-have skills in preferredSkills.
- minExperienceYears is only the numeric minimum ("5+ years" => 5). Omit it when no number is stated.
- companies is only an employer the user required by name.
- Do not invent cities, skills, years, or companies.
`.trim();

export async function understandQuery(query:string):Promise<UnderstandingQuery> {
    const raw = await completeJson({
        systemPromt:SYSTEM_PROMPT,
        userPrompt:query,
        model:env.RESUME_PARSER_MODEL
    })
    const parsed = QueryUnderstandingSchema.safeParse(raw)
    if(!parsed.success){
        return {
            semanticQuery:query,
            skills:[],
            preferredSkills:[],
            companies:[],
            currentRole:undefined,
            domain:undefined
        }
    }
    return parsed.data
}