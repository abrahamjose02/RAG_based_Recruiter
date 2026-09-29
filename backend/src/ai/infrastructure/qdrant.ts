import { QdrantClient } from "@qdrant/js-client-rest";
import { env } from "../../config/env";

export const VECTOR_SIZE = 1536

export const qdrantClient = new QdrantClient({
    url:env.QDRANT_URL,
    ...(env.QDRANT_API_KEY ? {apiKey:env.QDRANT_API_KEY} : {})
})

const PAYLOAD_INDEXES:Array<{
    field_name:string,
    field_schema:"keyword" | "float"
}> = [
    {field_name:"source",field_schema:"keyword"},
    {field_name:"candidate_profile_id",field_schema:"keyword"},
    {field_name:"resume_id",field_schema:"keyword"},
    {field_name:"city",field_schema:"keyword"},
    {field_name:"total_experience_years",field_schema:"float"},
    {field_name:"skills",field_schema:"keyword"},
    {field_name:"current_role",field_schema:"keyword"}
]

export async function ensureCollection():Promise<void>{
    const {exists} = await qdrantClient.collectionExists(env.QDRANT_COLLECTION)
    if(exists){
        return
    }

    await qdrantClient.createCollection(env.QDRANT_COLLECTION,{
        vectors:{
            size:VECTOR_SIZE,
            distance:"Cosine"
        }
    })

    for(const index of PAYLOAD_INDEXES){
        await qdrantClient.createPayloadIndex(env.QDRANT_COLLECTION,{
            wait:true,
            field_name:index.field_name,
            field_schema:index.field_schema
        })
    }
}