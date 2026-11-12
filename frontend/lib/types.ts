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