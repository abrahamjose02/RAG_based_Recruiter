import type { CandidateLocation } from "../candidate/candidate.types";
import type {
    ParsedEducation,
    ParsedExperience,
} from "../resume/resume.types";

export type PublicResumeView = {
    id: string;
    name?: string | undefined;
    email?: string | undefined;
    phone?: string | undefined;
    location?: CandidateLocation | undefined;
    skills: string[];
    totalExperienceYears?: number | undefined;
    currentRole?: string | undefined;
    professionalSummary?: string | undefined;
    experience: ParsedExperience[];
    education: ParsedEducation[];
    score: number;
};
