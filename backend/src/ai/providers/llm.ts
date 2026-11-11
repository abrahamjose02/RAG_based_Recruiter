import { AppError } from "../../errors/app-error";
import { env } from "../../config/env";
import { openai } from "./openai";

export async function completeJson(params:{
    systemPromt:string,
    userPrompt:string,
    model:string
}):Promise<Record<string,unknown>>{
    const completion = await openai.chat.completions.create({
        model:params.model ?? env.RESUME_PARSER_MODEL,
        response_format:{type:"json_object"},
        temperature:0,
        messages:[
            {role:"system",content:params.systemPromt},
            {role:"user",content:params.userPrompt}
        ],
    })

    const content = completion.choices[0]?.message.content

    if(!content){
        throw new AppError("LLM returned empty JSON",502)
    }

    let parsed:unknown
    try {
        parsed = JSON.parse(content)
    } catch (error) {
        throw new AppError("LLM returned invalid JSON",502)
    }
    if(!parsed || typeof parsed !== "object" || Array.isArray(parsed)){
        throw new AppError("LLM JSON must be an object",502)
    }
    return parsed as Record<string,unknown>
}