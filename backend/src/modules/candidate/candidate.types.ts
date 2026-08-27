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

export const NOTICE_PERIOD_OPTIONS = [
    "immediate",
    "15_days",
    "30_days",
    "45_days",
    "60_days",
    "90_days",
    "serving",
] as const;

export type NoticePeriodOption = (typeof NOTICE_PERIOD_OPTIONS)[number]

export interface CandidateNoticePeriod{
    option:NoticePeriodOption;
    lastWorkingDay?:Date | undefined;
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
    currentSalary:Number;
    expectedSalary:Number;
    noticePeriod:CandidateNoticePeriod;
    createdAt:Date;
    updatedAt:Date;
}