import { env } from "../config/env";
import { AppError } from "../errors/app-error";
import { resumeAiResponseSchema } from "../modules/resume/resume.schema";
import { ParsedResumeResult } from "../modules/resume/resume.types";

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