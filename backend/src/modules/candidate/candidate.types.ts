//candidate domain type

export interface CandidateLocation{
    city?:string;
    state?:string;
    country?:string;
}

export interface CandidateExperience{
    company?:string;
    role?:string;
    startDate?:Date;
    endDate?:Date;
    isCurrent?:Boolean
    description?:string
}

export interface CandidateEducation{
    institution?:string;
    degree?:string;
    fieldOfStudy:string;
    startYear?:number;
    endYear?:number;
}

//Note : Structured Retrieval is more necessary rather than the data is deterministic

export interface Candidate{
    id:string;
    name:string;
    email:string;
    phone?:string;
    location?:CandidateLocation;
    skills:string[];
    totalExperienceYears:number;
    currentRole?:string;
    professionalSummary?:string;
    experience:CandidateExperience[];
    education:CandidateEducation[];
    createdAt:Date;
    updatedAt:Date;
}