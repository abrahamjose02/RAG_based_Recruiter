import z from "zod";
import {env} from "../../config/env"
import { completeJson } from "../providers/llm";

const answerSchema = z.object({
    answer:z.string().trim().min(1),
})

export async function writeGroundedAnswer(
    params:{
        query:string;
        context:string;
    }
):Promise<string>{
    const raw = await completeJson({
        systemPromt: `
You answer a recruiter using only the JSON context of retrieved resumes.
Return {"answer": string}.
Do not invent skills, companies, years, or employers.
If a requested fact is absent from the context, say it is unavailable.
If the context is empty, say no matching resumes were found.
        `.trim(),
        userPrompt: JSON.stringify({
            query:params.query,
            context:params.context,
        }),
        model:env.RESUME_PARSER_MODEL,
    })
    const parsed = answerSchema.safeParse(raw);
    if(!parsed.success){
        throw new Error(`Failed to parse answer: ${parsed.error.message}`);
    }
    return parsed.data.answer;
}