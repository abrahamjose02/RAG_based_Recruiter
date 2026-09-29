import { Schemas } from "@qdrant/js-client-rest";
import { env } from "../../config/env";
import { qdrantClient } from "../infrastructure/qdrant";
import { ResumeChunkPayload, VectorPoint, VectorSearchFilter, VectorSearchHit } from "../types";



function asPayload(value:unknown):ResumeChunkPayload | undefined {
    if(!value || typeof value !== "object"){
        return undefined
    }

    const payload = value as ResumeChunkPayload
    if(
        payload.source !== "resume" ||
    typeof payload.candidate_profile_id !== "string" ||
    typeof payload.resume_id !== "string" || 
    typeof payload.chunk_type !== "string" ||
    typeof payload.text !== "string")
    {
        return undefined
    }
    return payload
}

class VectorRepository{
    async upsert(points:VectorPoint[]):Promise<void>{
        if(points.length === 0){
            return 
        }
        await qdrantClient.upsert(env.QDRANT_COLLECTION,{
            wait:true,
            points:points.map((point)=>({
                id:point.id,
                vector:point.vector,
                payload:point.payload
            }))
        })
    }

    async deleteByResumeId(resumeId:string):Promise<void>{
        await qdrantClient.delete(env.QDRANT_COLLECTION,{
            wait:true,
            filter:{
                must:[
                    {key:"resume_id",match:{value:resumeId}},
                    {key:"source",match:{value:"resume"}}
                ]
            }
        })
    }

    async deleteByCandidateId(candidateId:string):Promise<void>{
        await qdrantClient.delete(env.QDRANT_COLLECTION,{
            wait:true,
            filter:{
                must:[
                    {key:"candidate_profile_id",match:{value:candidateId}}
                ]
            }
        })
    }

    async search(params:{
        vector:number[],
        limit?:number,
        filter?:VectorSearchFilter
    }):Promise<VectorSearchHit[]>{
        const must:Schemas["Condition"][] = []

        if(params.filter?.source){
            must.push({
                key:"source",
                match:{value:params.filter.source}
            })
        }

        if(params.filter?.city){
            must.push({
                key:"city",
                match:{value : params.filter.city.trim().toLowerCase()}
            })
        }

        if(params.filter?.minExperienceYears != null){
            must.push({
                key:"total_experience_years",
                range:{ gte: params.filter.minExperienceYears},
            })
        }

        if (params.filter?.skills && params.filter.skills.length > 0) {
            must.push({
                key: "skills",
                match: {
                    any: params.filter.skills.map((skill) =>
                        skill.trim().toLowerCase()
                    ),
                },
            })
        }

        const result = await qdrantClient.query(env.QDRANT_COLLECTION,{
            query:params.vector,
            limit:params.limit ?? 50,
            with_payload:true,
            ...(must.length > 0 ? {filter : {must}}: {})
        })

        return result.points.flatMap((point)=>{
            const payload = asPayload(point.payload)
            if(!payload || point.score === null){
                return []
            }

            return[
                {
                    id:point.id,
                    score:point.score,
                    payload
                }
            ]
        })
    }

}

export const vectorRepository = new VectorRepository()