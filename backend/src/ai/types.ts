export type ChunkSource = "resume"

export type ResumeChunk = {
    chunkType:string
    text:string
}

export type ResumeChunkPayload = {
    source:ChunkSource
    candidate_profile_id:string
    resume_id:string
    chunk_type:string
    text:string
    city?:string
    total_experience_years?:number
    skills:string[]
    current_role?:string;
    companies:string[]
    embedding_version:string;
    uploaded_by_recruiter_id?:string;
}

export type VectorPayload = {
    id:string;
    vector:number[]
    payload:ResumeChunkPayload
}

export type VectorSearchFilter = {
    city?:string
    minExperienceYears?:number;
    skills?:string[]
    source?:ChunkSource
}

export type VectorSearchHit = {
    id:string | number
    score:number
    payload:ResumeChunkPayload
}