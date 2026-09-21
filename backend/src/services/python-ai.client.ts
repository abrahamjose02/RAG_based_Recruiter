import { env } from "../config/env";
import { AppError } from "../errors/app-error";
import { resumeAiResponseSchema } from "../modules/resume/resume.schema";
import { ParsedResumeResult } from "../modules/resume/resume.types";
import { z } from "zod"

export async function parseResumeText(extractedText:string):Promise<ParsedResumeResult>{
    const response = await fetch(`${env.PYTHON_AI_BASE_URL}/v1/parse-resume`,{
        method:"POST",
        headers:{
            "Content-Type" : "application/json"
        },
        body:JSON.stringify({text:extractedText})
    })
    if(!response.ok){
        throw new AppError("Resume parse service failed",502)
    }

    const body = resumeAiResponseSchema.parse(await response.json());
    return body.data
}

const indexResumeResponseSchema = z.object({
    success:z.literal(true),
    data:z.object({indexedChunks:z.number().int().min(0)}),
})

export async function indexResume(input: {
    candidateId: string;
    resumeId: string;
    extractedText: string;
    parsed: ParsedResumeResult;
    sourceOrganizationId?: string;
    sourceRecruiterId?: string;
}): Promise<{ indexedChunks: number }> {
    const response = await fetch(`${env.PYTHON_AI_BASE_URL}/v1/index-resume`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
            candidate_profile_id: input.candidateId,
            resume_id: input.resumeId,
            extracted_text: input.extractedText,
            parsed: input.parsed,
            source_organization_id: input.sourceOrganizationId,
            source_recruiter_id: input.sourceRecruiterId,
        }),
    });
    if (!response.ok) {
        throw new AppError("Resume index service failed", 502);
    }
    return indexResumeResponseSchema.parse(await response.json()).data;
}