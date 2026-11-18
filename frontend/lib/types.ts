export type ResumeExperience = {
    company: string;
    role: string;
    startDate?: string;
    endDate?: string;
    isCurrent?: boolean;
    description?: string;
  };
  
  export type ResumeEducation = {
    institution: string;
    degree?: string;
    fieldOfStudy?: string;
    startYear?: number;
    endYear?: number;
  };
  
  export type PublicResume = {
    id: string;
    name?: string;
    email?: string;
    phone?: string;
    location?: { city?: string; state?: string; country?: string };
    skills: string[];
    totalExperienceYears?: number;
    currentRole?: string;
    professionalSummary?: string;
    experience: ResumeExperience[];
    education: ResumeEducation[];
    score: number;
  };
  
  export type SearchResponse = {
    answer: string;
    resumes: PublicResume[];
  };

  export type CandidateLocation = {
    city?: string
    state?: string
    country?: string
  }
  
  export type NoticePeriodOption =
    | "immediate"
    | "15_days"
    | "30_days"
    | "45_days"
    | "60_days"
    | "90_days"
    | "serving"
  
  export type Candidate = {
    id: string
    name: string
    email: string
    phone?: string
    location?: CandidateLocation
    skills: string[]
    totalExperienceYears: number
    currentRole?: string
    professionalSummary?: string
    currentSalary?: number
    expectedSalary?: number
    noticePeriod?: {
      option: NoticePeriodOption
      lastWorkingDay?: string
    }
    source: "resume_upload" | "manual"
    sourceResumeIds: string[]
    createdAt: string
    updatedAt: string
  }
  
  export type CandidateList = {
    items: Candidate[]
    total: number
  }
  
  export type CandidateFilters = {
    name?: string
    city?: string
    currentRole?: string
    skills?: string
    minExperienceYears?: number
    page: number
    limit?: number
  }
  
  export type ResumeStatus =
    | "uploaded"
    | "processing"
    | "parsed"
    | "indexing"
    | "ready"
    | "failed"
  
  export type ResumeRecord = {
    id: string
    originalFilename: string
    status: ResumeStatus
    candidateId?: string
    errorMessage?: string
    createdAt: string
  }
  
  export type ResumeList = {
    items: ResumeRecord[]
    total: number
  }