import { env } from "../../config/env"
import { openai } from "./openai"


export async function embedMany(texts:string[]):Promise<number[][]>{
    if(texts.length === 0){
        return []
    }
    
    const response = await openai.embeddings.create({
        model:env.EMBEDDING_MODEL,
        input:texts
    })

    return response.data
        .slice()
        .sort((a,b)=>a.index - b.index)
        .map((item)=>item.embedding)
}