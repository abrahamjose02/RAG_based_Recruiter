import type { CandidateLocation } from "../candidate/candidate.types";
export const RESUME_STATUSES = [
    "uploaded",
    "processing",
    "parsed",
    "indexing",
    "ready",
    "failed"
] as const

export const RESUME_ALLOWED_MIME_TYPES = [
    "application/pdf",
    "application/vnd.openxmlformats-officedocument.wordprocessingml.document"
] as const;

export type ResumeStatus = (typeof RESUME_STATUSES)[number]
export type ResumeAllowedMimeType = (typeof RESUME_ALLOWED_MIME_TYPES)[number]

export interface ResumeDocumentManifest{
    clientDocumentId:string;
    file:{
        name:string;
        mimeType:ResumeAllowedMimeType;
        size:number;
    };
    storage:{
        key:string;
    };
    extractedText:string;
}

export interface ParsedExperience{
    company:string;
    role:string;
    startDate?:string | undefined;
    endDate?:string | undefined;
    isCurrent?:boolean | undefined;
    description?:string | undefined;
}

export interface ParsedEducation{
    institution:string;
    degree?:string | undefined;
    fieldOfStudy?:string | undefined;
    startYear?:number | undefined;
    endYear?:number | undefined;
}

export interface ParsedResumeResult{
    name?:string | undefined;
    email?:string | undefined;
    phone?:string | undefined;
    location?:CandidateLocation | undefined;
    skills:string[];
    totalExperienceYears?:number | undefined;
    currentRole?:string | undefined;
    professionalSummary?:string | undefined;
    experience:ParsedExperience[];
    education:ParsedEducation[];
}

export interface Resume{
    id:string;
    organizationId?:string;
    recruiterId?:string;
    candidateId?:string;
    clientDocumentId:string;
    originalFilename:string;
    storageKey:string;
    mimeType:string;
    sizeBytes:number;
    extractedText:string;
    status:ResumeStatus;
    parsed?:ParsedResumeResult;
    indexedChunks:number;
    errorMessage?:string;
    createdAt:Date;
    updatedAt:Date;
}
